import { PositionManager } from '../trading/risk/PositionManager.js';
import { CONFIG } from '../../config/constants.js';

export class ProfitCalculator {
  constructor() {
    this.positionManager = new PositionManager();
    this.distributionInterval = CONFIG.PROFIT_DISTRIBUTION_INTERVAL || 24 * 60 * 60 * 1000; // 24 hours
    this.lastDistribution = 0;
  }

  async calculateProfits() {
    try {
      const positions = Array.from(this.positionManager.positions.values());
      
      const profits = positions.reduce((total, position) => {
        if (!position.closeTime) return total;
        
        const profit = this.calculatePositionProfit(position);
        return total + profit;
      }, 0);

      const metrics = {
        totalProfits: profits,
        positionCount: positions.length,
        closedPositions: positions.filter(p => p.closeTime).length,
        averageProfit: profits / positions.length || 0,
        timestamp: Date.now()
      };

      console.log('Profit calculation:', metrics);
      return metrics;
    } catch (error) {
      console.error('Profit calculation failed:', error);
      throw error;
    }
  }

  calculatePositionProfit(position) {
    const entryValue = position.size * position.entryPrice;
    const exitValue = position.size * position.exitPrice;
    
    return position.action === 'buy' 
      ? exitValue - entryValue 
      : entryValue - exitValue;
  }

  shouldDistribute() {
    const now = Date.now();
    return now - this.lastDistribution >= this.distributionInterval;
  }

  async getDistributableProfits() {
    const { totalProfits } = await this.calculateProfits();
    
    if (totalProfits <= 0) {
      return 0;
    }

    // Deduct operating costs and reserves
    const operatingCosts = this.calculateOperatingCosts();
    const reserveAmount = this.calculateReserveAmount(totalProfits);
    
    return Math.max(0, totalProfits - operatingCosts - reserveAmount);
  }

  calculateOperatingCosts() {
    // Calculate gas fees, infrastructure costs, etc.
    return 100; // Example fixed cost
  }

  calculateReserveAmount(profits) {
    // Keep 20% as reserve
    return profits * 0.2;
  }
}