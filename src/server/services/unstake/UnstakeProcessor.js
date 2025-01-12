import { UnstakesDB } from '../../db/unstakes.js';
import { StakesDB } from '../../db/stakes.js';
import { TokenTransferService } from './TokenTransferService.js';
import { RateLimiter } from '../../utils/rateLimiter.js';

const rateLimiter = new RateLimiter();

export class UnstakeProcessor {
  static async processUnstake(walletAddress, amount) {
    // Rate limiting
    if (!rateLimiter.tryRequest(walletAddress)) {
      throw new Error('Too many unstake requests. Please wait.');
    }

    // Verify stake exists
    const stakeInfo = await StakesDB.getStakeInfo(walletAddress);
    if (!stakeInfo || stakeInfo.amount < amount) {
      throw new Error('Insufficient staked amount');
    }

    // Start database transaction
    const dbTransaction = await UnstakesDB.beginTransaction();

    try {
      // Process token transfer
      const signature = await TokenTransferService.transferTokens(walletAddress, amount);
      
      // Record unstake with verified amount
      await UnstakesDB.recordUnstake(
        walletAddress, 
        amount, 
        signature,
        dbTransaction
      );

      // Update stake record
      await StakesDB.reduceStake(
        walletAddress, 
        amount,
        dbTransaction
      );

      // Commit transaction
      await dbTransaction.commit();

      return { signature };
    } catch (error) {
      // Rollback on error
      await dbTransaction.rollback();
      console.error('Unstake processing failed:', error);
      throw new Error('Failed to process unstake');
    }
  }
}