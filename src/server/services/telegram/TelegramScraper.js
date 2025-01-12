import puppeteer from 'puppeteer';
import { LogsDB } from '../../db/logs.js';

export class TelegramScraper {
  constructor() {
    this.browser = null;
    this.page = null;
    this.isMonitoring = false;
    this.processedMessages = new Set();
    this.lastMessageId = null;
    this.checkInterval = 30000; // Check every 30 seconds
    this.intervalId = null;
  }

  async init() {
    try {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      this.page = await this.browser.newPage();
      
      // Set viewport
      await this.page.setViewport({ width: 1280, height: 800 });
      
      console.log('Telegram scraper initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Telegram scraper:', error);
      await this.cleanup();
      throw error;
    }
  }

  async startMonitoring(channelUrl) {
    if (!this.browser) {
      await this.init();
    }

    try {
      this.isMonitoring = true;
      console.log('Starting Telegram monitoring for:', channelUrl);

      await this.page.goto(channelUrl, {
        waitUntil: 'networkidle0',
        timeout: 60000
      });

      // Wait for messages to load
      await this.page.waitForSelector('.tgme_widget_message_wrap', { timeout: 30000 });

      // Initial message load
      const messages = await this.getMessages();
      console.log(`Found ${messages.length} initial messages`);
      
      for (const message of messages) {
        await this.handleNewMessage(message);
      }

      // Set up interval for checking new messages
      this.intervalId = setInterval(async () => {
        if (!this.isMonitoring) return;
        
        try {
          // Reload page to get fresh content
          await this.page.reload({ waitUntil: 'networkidle0' });
          await this.page.waitForSelector('.tgme_widget_message_wrap', { timeout: 30000 });
          
          const newMessages = await this.getMessages();
          console.log(`Found ${newMessages.length} messages in check`);
          
          for (const message of newMessages) {
            await this.handleNewMessage(message);
          }
        } catch (error) {
          console.error('Error checking for new messages:', error);
        }
      }, this.checkInterval);

      console.log('Telegram monitoring active');
    } catch (error) {
      console.error('Error monitoring Telegram:', error);
      this.isMonitoring = false;
      await this.cleanup();
      throw error;
    }
  }

  async getMessages() {
    try {
      return await this.page.evaluate(() => {
        const messages = [];
        const messageElements = document.querySelectorAll('.tgme_widget_message_wrap');

        messageElements.forEach((element, index) => {
          // Get the inner message element
          const messageElement = element.querySelector('.tgme_widget_message');
          if (!messageElement) return;

          // Get message ID from data attribute
          const id = messageElement.getAttribute('data-post') || `msg_${Date.now()}_${index}`;
          
          // Get message text from the correct element
          const textElement = messageElement.querySelector('.tgme_widget_message_text.js-message_text');
          if (!textElement) return;
          
          // Get timestamp from the correct element
          const timeElement = messageElement.querySelector('.tgme_widget_message_date time');
          const timestamp = timeElement ? new Date(timeElement.getAttribute('datetime')).getTime() : Date.now();

          // Get message URL
          const url = messageElement.getAttribute('data-url') || null;

          messages.push({
            id,
            text: textElement.textContent.trim(),
            timestamp,
            url
          });
        });

        return messages.filter(msg => msg.text && msg.text.length > 0);
      });
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  async handleNewMessage(message) {
    try {
      // Skip if already processed in memory
      if (this.processedMessages.has(message.id)) {
        return;
      }

      // Skip if already exists in database
      const exists = await LogsDB.messageExists(message.id);
      if (exists) {
        this.processedMessages.add(message.id);
        return;
      }

      console.log('Processing new message:', {
        id: message.id,
        text: message.text.substring(0, 50) + '...',
        timestamp: new Date(message.timestamp).toISOString()
      });

      await LogsDB.saveLogs([{
        type: 'telegram',
        message: message.text,
        timestamp: new Date(message.timestamp).toISOString(),
        message_id: message.id,
        data: JSON.stringify({ url: message.url })
      }]);

      // Mark as processed
      this.processedMessages.add(message.id);
      this.lastMessageId = message.id;
      console.log('Message processed successfully');
    } catch (error) {
      console.error('Failed to handle message:', error);
    }
  }

  async cleanup() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isMonitoring = false;
    
    if (this.browser) {
      try {
        await this.browser.close();
        this.browser = null;
        this.page = null;
        console.log('Telegram scraper cleaned up successfully');
      } catch (error) {
        console.error('Error cleaning up Telegram scraper:', error);
      }
    }
  }
}