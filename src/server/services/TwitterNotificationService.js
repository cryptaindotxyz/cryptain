import puppeteer from 'puppeteer';
import { TwitterNotificationParser } from './parsers/TwitterNotificationParser.js';
import { CookieParser } from '../utils/cookieParser.js';
import { TWITTER_CONFIG } from '../config/twitter.js';

export class TwitterNotificationService {
  constructor() {
    this.browser = null;
    this.page = null;
    this.isMonitoring = false;
  }

  async init() {
    try {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      this.page = await this.browser.newPage();
      
      // Parse and set cookies
      if (!process.env.TWITTER_COOKIES) {
        throw new Error('TWITTER_COOKIES environment variable is not set');
      }

      const cookies = CookieParser.parse(process.env.TWITTER_COOKIES);
      await this.page.setCookie(...cookies);
      
      console.log('Twitter service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Twitter service:', error);
      await this.cleanup();
      throw error;
    }
  }

  async startMonitoring(callback) {
    if (!this.browser) {
      await this.init();
    }

    try {
      this.isMonitoring = true;
      console.log('Starting Twitter notifications monitoring...');

      const notificationsUrl = `${TWITTER_CONFIG.BASE_URL}${TWITTER_CONFIG.NOTIFICATIONS_PATH}`;
      await this.page.goto(notificationsUrl, {
        waitUntil: 'networkidle0',
        timeout: TWITTER_CONFIG.TIMEOUTS.NAVIGATION
      });

      // Wait for notifications to load
      await this.page.waitForSelector(TWITTER_CONFIG.SELECTORS.NOTIFICATION, {
        timeout: TWITTER_CONFIG.TIMEOUTS.ELEMENT_WAIT
      });

      // Set up mutation observer for new notifications
      await this.page.evaluate((selectors) => {
        const observer = new MutationObserver((mutations) => {
          const notifications = document.querySelectorAll(selectors.NOTIFICATION);
          if (notifications.length > 0) {
            notifications.forEach(notification => {
              window.postMessage({
                type: 'newNotification',
                html: notification.outerHTML
              }, '*');
            });
          }
        });

        const column = document.querySelector(selectors.PRIMARY_COLUMN);
        if (column) {
          observer.observe(column, {
            childList: true,
            subtree: true
          });
        }
      }, TWITTER_CONFIG.SELECTORS);

      // Handle new notifications
      this.page.on('console', msg => console.log('Browser console:', msg.text()));
      
      this.page.on('message', async event => {
        if (event.type === 'newNotification') {
          const notification = TwitterNotificationParser.parseNotification(event.html);
          if (notification) {
            await callback(notification);
          }
        }
      });

      console.log('Twitter notification monitoring active');
    } catch (error) {
      console.error('Error monitoring Twitter notifications:', error);
      this.isMonitoring = false;
      await this.cleanup();
      throw error;
    }
  }

  async cleanup() {
    if (this.browser) {
      try {
        this.isMonitoring = false;
        await this.browser.close();
      } catch (error) {
        console.error('Error closing browser:', error);
      }
      this.browser = null;
      this.page = null;
    }
  }
}