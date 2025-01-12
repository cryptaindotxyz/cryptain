import { TelegramScraper } from '../telegram/TelegramScraper.js';
import cluster from 'cluster';

export class TelegramMonitor {
  constructor(channelUrl) {
    this.channelUrl = channelUrl;
    this.scraper = new TelegramScraper();
  }

  async start() {
    // Only run monitoring on primary process
    if (!cluster.isPrimary) {
      console.log('Telegram monitoring skipped on worker process');
      return;
    }

    try {
      await this.scraper.startMonitoring(this.channelUrl);
      console.log('Telegram monitoring started on primary process');
    } catch (error) {
      console.error('Failed to start Telegram monitoring:', error);
      throw error;
    }
  }

  stop() {
    return this.scraper.cleanup();
  }
}