import { dbService } from '../database.js';

export class TransactionRepository {
  static async createPending(walletAddress, amount, type) {
    return await dbService.run(`
      INSERT INTO pending_transactions (
        wallet_address,
        amount,
        type,
        created_at
      ) VALUES (?, ?, ?, datetime('now'))
    `, [walletAddress, amount, type]);
  }

  static async getLatestPending(walletAddress) {
    return await dbService.get(`
      SELECT * FROM pending_transactions 
      WHERE wallet_address = ? 
      AND status = 'pending'
      ORDER BY created_at DESC 
      LIMIT 1
    `, [walletAddress]);
  }

  static async markAsCompleted(id, signature) {
    return await dbService.run(`
      UPDATE pending_transactions 
      SET status = 'completed', 
          signature = ?,
          completed_at = datetime('now')
      WHERE id = ?
    `, [signature, id]);
  }

  static async markAsFailed(id, error) {
    return await dbService.run(`
      UPDATE pending_transactions 
      SET status = 'failed', 
          error = ?,
          completed_at = datetime('now')
      WHERE id = ?
    `, [error, id]);
  }
}