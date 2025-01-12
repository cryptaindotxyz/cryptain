import { VotesDB } from '../../db/votes.js';
import { LogsDB } from '../../db/logs.js';
import { getTokenMetadata } from '../../../utils/analysis/tokenMetadata.js';
import { formatLogMessages } from '../../../utils/formatters/logMessageFormatter.js';
import { StakesDB } from '../../db/stakes.js';

export class VoteRecordingService {
  static async recordVote(voteData, validation) {
    // Final cooldown check before recording
    const lastVote = await VotesDB.getLastVote(voteData.walletAddress);
    if (lastVote) {
      const timeSinceLastVote = Date.now() - new Date(lastVote.timestamp).getTime();
      if (timeSinceLastVote < 60 * 60 * 1000) {
        throw new Error('Vote cooldown still in effect');
      }
    }

    // Verify staked amount
    const stakeInfo = await StakesDB.getStakeInfo(voteData.walletAddress);
    if (!stakeInfo || !stakeInfo.amount) {
      throw new Error('No staked tokens found');
    }

    // Get token metadata
    const metadata = await getTokenMetadata(voteData.tokenAddress);
    
    // Record vote with verified stake amount
    const voteResult = await VotesDB.saveVote(
      voteData.walletAddress,
      voteData.tokenAddress,
      validation.tokenInfo,
      validation.analysisData,
      stakeInfo.amount // Use verified stake amount from database
    );

    // Create log messages
    const messages = formatLogMessages(voteData, validation, metadata);
    
    // Convert messages to log entries and filter out any empty messages
    const logs = messages
      .filter(message => message && message.trim() !== '')
      .map(message => ({
        type: 'vote',
        message,
        related_id: voteResult.id
      }));
    
    // Save logs
    await LogsDB.saveLogs(logs);

    return voteResult;
  }
}