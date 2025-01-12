import { StakesDB } from '../../db/stakes.js';
import { TokenValidationService as TokenValidator } from '../TokenValidationService.js';
import { VotesDB } from '../../db/votes.js';

export class VoteValidationService {
  static async validateVoteEligibility(walletAddress) {
    // Check last vote time first - this is critical
    const lastVote = await VotesDB.getLastVote(walletAddress);
    if (lastVote) {
      const timeSinceLastVote = Date.now() - lastVote.timestamp_ms;
      const remainingTime = Math.ceil((60 * 60 * 1000 - timeSinceLastVote) / 1000);
      
      if (timeSinceLastVote < 60 * 60 * 1000) {
        const minutes = Math.floor(remainingTime / 60);
        const seconds = remainingTime % 60;
        throw new Error(
          `You can only vote once every 60 minutes. Please wait ${minutes}m ${seconds}s.`
        );
      }
    }

    // Only check staking if cooldown has passed
    const stakeInfo = await StakesDB.getStakeInfo(walletAddress);
    if (!stakeInfo || stakeInfo.amount <= 0) {
      throw new Error('You need to stake CRYPTAIN tokens to vote');
    }

    return stakeInfo;
  }

  static async validateAndAnalyzeToken(tokenAddress) {
    const validation = await TokenValidator.validateToken(tokenAddress);
    if (!validation.isValid) {
      throw new Error('Invalid token - Token not found on DEX');
    }
    return validation;
  }
}