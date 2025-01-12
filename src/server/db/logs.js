import { dbService } from './database.js';

export class LogsDB {
  static async init() {
    await dbService.init();
    
    try {
      // First check if column exists
      const result = await dbService.get(`
        SELECT COUNT(*) as count 
        FROM pragma_table_info('system_logs') 
        WHERE name = 'message_id'
      `);
      
      // Add column only if it doesn't exist
      if (!result.count) {
        await dbService.run(`
          ALTER TABLE system_logs 
          ADD COLUMN message_id TEXT;
        `);
        
        // Create index after adding column
        await dbService.run(`
          CREATE INDEX idx_logs_message_id 
          ON system_logs(message_id);
        `);
      }
    } catch (error) {
      console.error('Error initializing logs table:', error);
      throw error;
    }
  }

  static async messageExists(messageId) {
    await this.init();
    const result = await dbService.get(`
      SELECT id FROM system_logs 
      WHERE message_id = ? 
      LIMIT 1
    `, [messageId]);
    return !!result;
  }

  static async saveLogs(logs) {
    await this.init();

    const values = logs.map(log => [
      log.type,
      log.message,
      log.related_id || null,
      log.data ? JSON.stringify(log.data) : null,
      log.message_id || null
    ]);

    for (const value of values) {
      await dbService.run(`
        INSERT INTO system_logs (
          type, 
          message, 
          related_id, 
          data,
          message_id
        ) VALUES (?, ?, ?, ?, ?)
      `, value);
    }
  }

  static async getLogs(limit = 50) {
    await this.init();

    return await dbService.all(`
      SELECT 
        id,
        type,
        message,
        related_id,
        data,
        message_id,
        timestamp,
        'system' as source
      FROM system_logs
      ORDER BY timestamp DESC
      LIMIT ?
    `, [limit]);
  }
}