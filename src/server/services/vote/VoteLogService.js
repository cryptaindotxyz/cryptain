import { VotesDB } from '../../db/votes.js';
import { LogsDB } from '../../db/logs.js';

export class VoteLogService {
  static async getLogs(limit = 50) {
    try {
      const voteLogs = await VotesDB.getVoteLogs(limit);
      const systemLogs = await LogsDB.getLogs(limit);
      
      const allLogs = [...voteLogs, ...systemLogs].map(log => ({
        ...log,
        timestamp: new Date(log.timestamp)
      }));
      
      return allLogs
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit)
        .map(log => ({
          ...log,
          timestamp: log.timestamp.toISOString()
        }));
    } catch (error) {
      console.error('Failed to get vote logs:', error);
      throw error;
    }
  }

  static async getLastVote(walletAddress) {
    try {
      return await VotesDB.getLastVote(walletAddress);
    } catch (error) {
      console.error('Failed to get last vote:', error);
      throw error;
    }
  }

  static async getRankings() {
    try {
      return await VotesDB.getVoteRankings();
    } catch (error) {
      console.error('Failed to get rankings:', error);
      throw error;
    }
  }
}