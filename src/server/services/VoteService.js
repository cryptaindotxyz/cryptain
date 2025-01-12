import { VoteLogService } from './VoteLogService.js';
import { VoteValidationService } from './VoteValidationService.js';
import { VoteRecordingService } from './VoteRecordingService.js';
import { VotesDB } from '../../db/votes.js';

export class VoteService {
  static async getVoteLogs(limit = 50) {
    return await VoteLogService.getLogs(limit);
  }

  static async getLastVote(walletAddress) {
    return await VoteLogService.getLastVote(walletAddress);
  }

  static async getRankings() {
    return await VoteLogService.getRankings();
  }

  static async submitVote(voteData) {
    if (!voteData?.walletAddress || !voteData?.tokenAddress) {
      throw new Error('Missing required vote data');
    }

    try {
      // First check cooldown at service level
      const lastVote = await VotesDB.getLastVote(voteData.walletAddress);
      if (lastVote) {
        const timeSinceLastVote = Date.now() - new Date(lastVote.timestamp).getTime();
        const cooldownPeriod = 60 * 60 * 1000; // 60 minutes in milliseconds
        
        if (timeSinceLastVote < cooldownPeriod) {
          const remainingTime = Math.ceil((cooldownPeriod - timeSinceLastVote) / 1000);
          const minutes = Math.floor(remainingTime / 60);
          const seconds = remainingTime % 60;
          throw new Error(
            `Vote cooldown in effect. Please wait ${minutes}m ${seconds}s.`
          );
        }
      }

      // Validate eligibility and token
      await VoteValidationService.validateVoteEligibility(voteData.walletAddress);
      const validation = await VoteValidationService.validateAndAnalyzeToken(voteData.tokenAddress);
      
      // Record vote and create logs
      return await VoteRecordingService.recordVote(voteData, validation);
    } catch (error) {
      console.error('Failed to submit vote:', error);
      throw error;
    }
  }
}