import { ProfitCalculator } from './ProfitCalculator.js';
import { ProfitDistributor } from './ProfitDistributor.js';
import { StakesDB } from '../../db/stakes.js';

export class DistributionManager {
  constructor() {
    this.calculator = new ProfitCalculator();
    this.distributor = new ProfitDistributor();
    this.isProcessing = false;
  }

  async processDistribution() {
    if (this.isProcessing) {
      console.log('Distribution already in progress');
      return;
    }

    try {
      this.isProcessing = true;

      // Check if it's time to distribute
      if (!this.calculator.shouldDistribute()) {
        console.log('Not time for distribution yet');
        return;
      }

      // Calculate distributable profits
      const profits = await this.calculator.getDistributableProfits();
      if (profits <= 0) {
        console.log('No profits to distribute');
        return;
      }

      // Distribute profits
      const result = await this.distributor.distributeProfits(profits);
      
      // Record distribution
      if (result.distributed) {
        await this.recordDistributionEvent(result);
      }

      return result;
    } catch (error) {
      console.error('Distribution processing failed:', error);
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  async recordDistributionEvent(distribution) {
    try {
      await StakesDB.recordDistributionEvent({
        totalAmount: distribution.totalDistributed,
        performanceFee: distribution.performanceFee,
        recipientCount: distribution.distributions.length,
        successCount: distribution.distributions.filter(d => d.success).length,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Failed to record distribution event:', error);
      throw error;
    }
  }

  async getDistributionHistory(walletAddress) {
    try {
      return await StakesDB.getDistributionHistory(walletAddress);
    } catch (error) {
      console.error('Failed to get distribution history:', error);
      throw error;
    }
  }

  async getTotalDistributed() {
    try {
      return await StakesDB.getTotalDistributed();
    } catch (error) {
      console.error('Failed to get total distributed:', error);
      throw error;
    }
  }
}