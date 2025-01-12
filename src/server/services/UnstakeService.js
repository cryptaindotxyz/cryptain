import { StakesDB } from '../db/stakes.js';
import { TokenTransferService } from './unstake/TokenTransferService.js';
import { RateLimiter } from '../utils/rateLimiter.js';

const rateLimiter = new RateLimiter();

export class UnstakeService {
  static async recordUnstake(unstakeData) {
    console.log('Processing unstake request:', unstakeData);

    if (!unstakeData?.walletAddress || !unstakeData?.amount) {
      console.error('Missing required unstake data');
      throw new Error('Missing required unstake data');
    }

    // Rate limiting
    if (!rateLimiter.tryRequest(unstakeData.walletAddress)) {
      console.error('Rate limit exceeded for:', unstakeData.walletAddress);
      throw new Error('Too many unstake requests. Please wait.');
    }

    // Verify stake exists
    console.log('Verifying stake amount...');
    const stakeInfo = await StakesDB.getStakeInfo(unstakeData.walletAddress);
    console.log('Current stake info:', stakeInfo);

    if (!stakeInfo || stakeInfo.amount < unstakeData.amount) {
      console.error('Insufficient stake amount:', {
        requested: unstakeData.amount,
        available: stakeInfo?.amount || 0
      });
      throw new Error('Insufficient staked amount');
    }

    // Start database transaction
    console.log('Starting database transaction');
    const dbTransaction = await StakesDB.beginTransaction();

    try {
      // Process token transfer
      console.log('Initiating token transfer...');
      const signature = await TokenTransferService.transferTokens(
        unstakeData.walletAddress, 
        unstakeData.amount
      );
      console.log('Token transfer complete:', signature);
      
      // Update stake record
      console.log('Updating stake record...');
      await StakesDB.reduceStake(
        unstakeData.walletAddress, 
        unstakeData.amount,
        dbTransaction
      );

      // Commit transaction
      console.log('Committing database transaction...');
      await dbTransaction.commit();
      console.log('Unstake process complete');

      return { signature };
    } catch (error) {
      // Rollback on error
      console.error('Unstake processing failed, rolling back:', error);
      await dbTransaction.rollback();
      throw new Error('Failed to process unstake: ' + error.message);
    }
  }
}