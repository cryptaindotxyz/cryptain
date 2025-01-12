import { StakesDB } from '../db/stakes.js';
import { TokenTransferService } from './token/TokenTransferService.js';

export class StakeService {
  static async recordStake(stakeData) {
    if (!stakeData?.walletAddress || !stakeData?.amount || !stakeData?.signature) {
      throw new Error('Missing required stake data');
    }

    try {
      const { walletAddress, amount, signature } = stakeData;
      return await StakesDB.saveStake(walletAddress, amount, signature);
    } catch (error) {
      console.error('Failed to record stake:', error);
      throw error;
    }
  }

  static async recordUnstake(walletAddress, amount) {
    try {
      // First send tokens
      const signature = await TokenTransferService.transferTokens(walletAddress, amount);
      
      // Then record the unstake
      return await StakesDB.saveStake(walletAddress, -amount, signature);
    } catch (error) {
      console.error('Failed to process unstake:', error);
      throw error;
    }
  }

  static async getStakeInfo(walletAddress) {
    try {
      return await StakesDB.getStakeInfo(walletAddress);
    } catch (error) {
      console.error('Failed to get stake info:', error);
      throw error;
    }
  }

  static async getTotalStaked() {
    try {
      return await StakesDB.getTotalStaked();
    } catch (error) {
      console.error('Failed to get total staked:', error);
      throw error;
    }
  }
}