import { dbService } from '../db/database.js';

export class NotificationService {
  static async saveNotification(notification) {
    try {
      console.log('Saving notification:', notification);
      const result = await dbService.saveNotification(notification.text);
      console.log('Notification saved successfully:', result);
      return result;
    } catch (error) {
      console.error('Failed to save notification:', error);
      throw error;
    }
  }

  static async getNotifications(limit = 50) {
    try {
      return await dbService.getNotifications(limit);
    } catch (error) {
      console.error('Failed to get notifications:', error);
      throw error;
    }
  }
}