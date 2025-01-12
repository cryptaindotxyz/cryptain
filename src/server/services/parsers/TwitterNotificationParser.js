import { JSDOM } from 'jsdom';

export class TwitterNotificationParser {
  static parseNotification(element) {
    try {
      const dom = new JSDOM(element);
      const notification = dom.window.document.querySelector('[data-testid="notification"]');
      
      if (!notification) return null;

      // Get the notification text (includes username and action)
      const textContent = notification.querySelector('.css-146c3p1')?.textContent?.trim();
      if (!textContent) return null;

      // Get the referenced tweet text if it exists
      const tweetText = notification.querySelector('[data-testid="tweetText"]')?.textContent?.trim() || '';

      return {
        text: `${textContent}${tweetText ? ` - "${tweetText}"` : ''}`,
        timestamp: new Date().toISOString(),
        type: this.determineNotificationType(textContent)
      };
    } catch (error) {
      console.error('Error parsing notification:', error);
      return null;
    }
  }

  static determineNotificationType(text) {
    if (text.includes('liked')) return 'like';
    if (text.includes('followed')) return 'follow';
    if (text.includes('retweeted')) return 'retweet';
    if (text.includes('replied')) return 'reply';
    return 'other';
  }
}