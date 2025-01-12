import { dbService } from './database.js';

export class VotesDB {
  static async init() {
    // Create index for performance
    await dbService.run(`
      CREATE INDEX IF NOT EXISTS idx_votes_wallet_timestamp 
      ON votes(wallet_address, timestamp DESC);
    `);
  }

  static async getVoteLogs(limit = 50) {
    await this.init();

    return await dbService.all(`
      SELECT 
        id,
        wallet_address,
        token_address,
        token_name,
        token_symbol,
        staked_amount,
        analysis_data as data,
        strftime('%s', timestamp) * 1000 as timestamp_ms,
        timestamp,
        'vote' as source
      FROM votes 
      ORDER BY timestamp DESC
      LIMIT ?
    `, [limit]);
  }

  static async getLastVote(walletAddress) {
    await this.init();

    return await dbService.get(`
      SELECT 
        id,
        wallet_address,
        token_address,
        token_name,
        token_symbol,
        staked_amount,
        analysis_data,
        strftime('%s', timestamp) * 1000 as timestamp_ms,
        timestamp
      FROM votes 
      WHERE wallet_address = ? 
      ORDER BY timestamp DESC 
      LIMIT 1
    `, [walletAddress]);
  }

  static async saveVote(walletAddress, tokenAddress, tokenInfo, analysisData, stakedAmount) {
    await this.init();

    // Use server timestamp for consistency
    const result = await dbService.run(`
      INSERT INTO votes (
        wallet_address, 
        token_address, 
        token_name,
        token_symbol,
        staked_amount,
        analysis_data,
        timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `, [
      walletAddress,
      tokenAddress,
      tokenInfo?.name || null,
      tokenInfo?.symbol || null,
      stakedAmount,
      analysisData
    ]);

    return { id: result.lastID };
  }

  static async getVoteRankings() {
    await this.init();

    return await dbService.all(`
      SELECT 
        token_address,
        token_name,
        token_symbol,
        SUM(staked_amount) as total_stake,
        COUNT(*) as vote_count,
        MAX(timestamp) as last_vote
      FROM votes 
      GROUP BY token_address, token_name, token_symbol
      ORDER BY total_stake DESC, vote_count DESC, last_vote DESC
    `);
  }

  static async getVoteStats(walletAddress) {
    await this.init();

    return await dbService.get(`
      SELECT 
        COUNT(*) as vote_count,
        SUM(staked_amount) as total_stake
      FROM votes 
      WHERE wallet_address = ?
    `, [walletAddress]);
  }
}