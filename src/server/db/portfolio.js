import { dbService } from './database.js';

export class PortfolioDB {
  static async init() {
    await dbService.run(`
      CREATE TABLE IF NOT EXISTS portfolio_snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        wallet_address TEXT NOT NULL,
        total_usd DECIMAL(20,2) NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await dbService.run(`
      CREATE TABLE IF NOT EXISTS portfolio_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        snapshot_id INTEGER NOT NULL,
        token_address TEXT NOT NULL,
        name TEXT,
        symbol TEXT,
        decimals INTEGER,
        balance DECIMAL(30,9),
        ui_amount DECIMAL(30,9),
        price_usd DECIMAL(30,9),
        value_usd DECIMAL(20,2),
        logo_uri TEXT,
        FOREIGN KEY (snapshot_id) REFERENCES portfolio_snapshots(id)
      )
    `);
  }

  static async saveSnapshot(walletAddress, data) {
    const { totalUsd, items } = data;
    
    // Start transaction
    const transaction = await dbService.db.run('BEGIN TRANSACTION');
    
    try {
      // Save snapshot
      const result = await dbService.run(
        'INSERT INTO portfolio_snapshots (wallet_address, total_usd) VALUES (?, ?)',
        [walletAddress, totalUsd]
      );
      
      const snapshotId = result.lastID;

      // Save tokens
      for (const token of items) {
        await dbService.run(`
          INSERT INTO portfolio_tokens (
            snapshot_id, token_address, name, symbol, decimals,
            balance, ui_amount, price_usd, value_usd, logo_uri
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          snapshotId,
          token.address,
          token.name,
          token.symbol,
          token.decimals,
          token.balance,
          token.uiAmount,
          token.priceUsd,
          token.valueUsd,
          token.logoURI || token.icon
        ]);
      }

      await dbService.db.run('COMMIT');
      return snapshotId;
    } catch (error) {
      await dbService.db.run('ROLLBACK');
      throw error;
    }
  }

  static async getLatestSnapshot() {
    const snapshot = await dbService.get(`
      SELECT * FROM portfolio_snapshots 
      ORDER BY timestamp DESC LIMIT 1
    `);

    if (!snapshot) return null;

    const tokens = await dbService.all(`
      SELECT * FROM portfolio_tokens 
      WHERE snapshot_id = ? 
      ORDER BY value_usd DESC
    `, [snapshot.id]);

    return {
      ...snapshot,
      tokens
    };
  }
}