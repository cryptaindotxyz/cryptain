import { dbService } from './database.js';

export class UnstakesDB {
  static async beginTransaction() {
    return await dbService.beginTransaction();
  }

  static async recordUnstake(walletAddress, amount, signature, transaction) {
    const sql = `
      INSERT INTO unstakes (
        wallet_address, 
        amount,
        signature,
        status,
        request_time
      ) VALUES (?, ?, ?, 'completed', datetime('now'))
    `;

    return await dbService.run(sql, [walletAddress, amount, signature], transaction);
  }

  static async getUnstakeHistory(walletAddress) {
    const sql = `
      SELECT * FROM unstakes 
      WHERE wallet_address = ?
      ORDER BY request_time DESC
    `;

    return await dbService.all(sql, [walletAddress]);
  }
}