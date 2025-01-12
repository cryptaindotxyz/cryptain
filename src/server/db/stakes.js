import { dbService } from './database.js';

export class StakesDB {
  static async getStakeInfo(walletAddress) {
    const sql = `
      SELECT 
        wallet_address,
        SUM(amount) as amount
      FROM stakes 
      WHERE wallet_address = ?
      GROUP BY wallet_address
    `;

    return await dbService.get(sql, [walletAddress]) || { amount: 0 };
  }

  static async getTotalStaked() {
    // Calculate net staked amount per wallet first, then sum only positive balances
    const sql = `
      WITH wallet_balances AS (
        SELECT 
          wallet_address,
          SUM(amount) as net_amount
        FROM stakes
        GROUP BY wallet_address
      )
      SELECT COALESCE(SUM(CASE WHEN net_amount > 0 THEN net_amount ELSE 0 END), 0) as total
      FROM wallet_balances
    `;

    const result = await dbService.get(sql);
    return result?.total || 0;
  }

  static async saveStake(walletAddress, amount, signature) {
    if (!walletAddress || !amount || !signature) {
      throw new Error('Missing required stake data');
    }

    const sql = `
      INSERT INTO stakes (
        wallet_address, 
        amount, 
        signature
      ) VALUES (?, ?, ?)
    `;

    const result = await dbService.run(sql, [walletAddress, amount, signature]);
    return { id: result.lastID };
  }

  static async getStakeHistory(walletAddress) {
    const sql = `
      SELECT * FROM stakes 
      WHERE wallet_address = ?
      ORDER BY timestamp DESC
    `;

    return await dbService.all(sql, [walletAddress]);
  }

  static async getStakeBySignature(signature) {
    const sql = `
      SELECT * FROM stakes 
      WHERE signature = ?
      LIMIT 1
    `;

    return await dbService.get(sql, [signature]);
  }
}