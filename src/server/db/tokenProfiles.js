import { dbService } from './database.js';

export class TokenProfilesDB {
  static async init() {
    await dbService.run(`
      CREATE TABLE IF NOT EXISTS token_profiles (
        token_address TEXT PRIMARY KEY,
        chain_id TEXT NOT NULL,
        icon TEXT,
        header TEXT,
        website TEXT,
        twitter TEXT,
        telegram TEXT,
        first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  static async getAllProfiles() {
    return await dbService.all(
      'SELECT * FROM token_profiles WHERE chain_id = ?',
      ['solana']
    );
  }

  static async upsertProfile(profile) {
    const sql = `
      INSERT INTO token_profiles (
        token_address,
        chain_id,
        icon,
        header,
        website,
        twitter,
        telegram,
        last_updated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(token_address) DO UPDATE SET
        chain_id = excluded.chain_id,
        icon = excluded.icon,
        header = excluded.header,
        website = excluded.website,
        twitter = excluded.twitter,
        telegram = excluded.telegram,
        last_updated = datetime('now')
    `;

    const links = profile.links || [];
    const website = links.find(l => l.label === 'Website')?.url;
    const twitter = links.find(l => l.type === 'twitter')?.url;
    const telegram = links.find(l => l.type === 'telegram')?.url;

    return await dbService.run(sql, [
      profile.tokenAddress,
      profile.chainId,
      profile.icon || null,
      profile.header || null,
      website || null,
      twitter || null,
      telegram || null
    ]);
  }
}