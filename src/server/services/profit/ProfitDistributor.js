import { StakesDB } from '../../db/stakes.js';
import { CONFIG } from '../../config/constants.js';
import { TokenTransferService } from '../token/TokenTransferService.js';

export class ProfitDistributor {
  constructor() {
    this.minDistributionAmount = CONFIG.MIN_DISTRIBUTION_AMOUNT || 100;
    this.performanceFee = CONFIG.PERFORMANCE_FEE || 0.1; // 10%
    this.distributionThreshold = CONFIG.DISTRIBUTION_THRESHOLD || 1000;
  }

  async distributeProfits(profits) {
    try {
      console.log('Starting profit distribution:', profits);

      // Validate minimum distribution amount
      if (profits < this.minDistributionAmount) {
        console.log('Profit below minimum distribution amount');
        return { distributed: false, reason: 'Below minimum amount' };
      }

      // Get total staked amount
      const totalStaked = await StakesDB.getTotalStaked();
      if (totalStaked <= 0) {
        console.log('No stakes found for distribution');
        return { distributed: false, reason: 'No stakes' };
      }

      // Calculate performance fee
      const performanceFeeAmount = profits * this.performanceFee;
      const distributableAmount = profits - performanceFeeAmount;

      // Get all stakers
      const stakers = await this.getActiveStakers();
      if (stakers.length === 0) {
        console.log('No active stakers found');
        return { distributed: false, reason: 'No active stakers' };
      }

      // Calculate shares and amounts
      const distributions = this.calculateDistributions(
        stakers,
        totalStaked,
        distributableAmount
      );

      // Execute distributions
      const results = await this.executeDistributions(distributions);

      // Record distributions
      await this.recordDistributions(distributions, results);

      return {
        distributed: true,
        totalDistributed: distributableAmount,
        performanceFee: performanceFeeAmount,
        distributions: results
      };
    } catch (error) {
      console.error('Profit distribution failed:', error);
      throw error;
    }
  }

  async getActiveStakers() {
    try {
      const stakers = await StakesDB.getActiveStakers();
      return stakers.filter(staker => 
        staker.amount >= this.distributionThreshold
      );
    } catch (error) {
      console.error('Failed to get active stakers:', error);
      throw error;
    }
  }

  calculateDistributions(stakers, totalStaked, distributableAmount) {
    return stakers.map(staker => {
      const share = staker.amount / totalStaked;
      const amount = distributableAmount * share;

      return {
        walletAddress: staker.wallet_address,
        stakedAmount: staker.amount,
        share,
        amount: Math.floor(amount), // Round down to ensure no overflow
        timestamp: Date.now()
      };
    });
  }

  async executeDistributions(distributions) {
    const results = [];

    for (const distribution of distributions) {
      try {
        const signature = await TokenTransferService.transferTokens(
          distribution.walletAddress,
          distribution.amount
        );

        results.push({
          ...distribution,
          success: true,
          signature
        });
      } catch (error) {
        console.error('Distribution failed:', error);
        results.push({
          ...distribution,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  async recordDistributions(distributions, results) {
    try {
      await StakesDB.recordDistributions(distributions.map((dist, i) => ({
        ...dist,
        success: results[i].success,
        signature: results[i].signature,
        error: results[i].error
      })));
    } catch (error) {
      console.error('Failed to record distributions:', error);
      throw error;
    }
  }
}