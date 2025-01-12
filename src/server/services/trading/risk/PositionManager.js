import { CONFIG } from '../../../config/constants.js';

export class PositionManager {
  constructor() {
    this.positions = new Map();
    this.maxPositions = CONFIG.MAX_POSITIONS || 10;
    this.maxPortfolioRisk = CONFIG.MAX_PORTFOLIO_RISK || 0.2;
    this.correlationThreshold = CONFIG.CORRELATION_THRESHOLD || 0.7;
  }

  async addPosition(position) {
    try {
      // Validate position limits
      if (!this.canAddPosition(position)) {
        throw new Error('Position limits exceeded');
      }

      // Calculate position size and risk
      const sizing = await this.calculatePositionSize(position);
      const risk = await this.calculatePositionRisk(position);

      // Create position object
      const newPosition = {
        ...position,
        ...sizing,
        ...risk,
        entryTime: Date.now(),
        updates: []
      };

      // Store position
      this.positions.set(position.tokenAddress, newPosition);
      
      // Update portfolio metrics
      await this.updatePortfolioMetrics();

      return newPosition;
    } catch (error) {
      console.error('Failed to add position:', error);
      throw error;
    }
  }

  canAddPosition(position) {
    if (this.positions.size >= this.maxPositions) {
      return false;
    }

    const portfolioRisk = this.calculatePortfolioRisk();
    if (portfolioRisk >= this.maxPortfolioRisk) {
      return false;
    }

    const correlation = this.calculateCorrelation(position);
    if (correlation >= this.correlationThreshold) {
      return false;
    }

    return true;
  }

  async calculatePositionSize(position) {
    const portfolioValue = this.getPortfolioValue();
    const riskScore = await this.calculateRiskScore(position);
    
    // Kelly Criterion for position sizing
    const winRate = 0.6; // Historical win rate
    const profitRatio = 2; // Risk:Reward ratio
    
    const kellySize = (winRate * profitRatio - (1 - winRate)) / profitRatio;
    const adjustedSize = kellySize * (1 - riskScore);
    
    const positionSize = portfolioValue * adjustedSize;
    
    return {
      size: positionSize,
      riskAdjustedSize: positionSize * (1 - riskScore)
    };
  }

  async calculatePositionRisk(position) {
    const volatility = await this.calculateVolatility(position);
    const liquidity = await this.calculateLiquidity(position);
    const correlation = this.calculateCorrelation(position);

    const riskFactors = {
      volatility: volatility * 0.4,
      liquidity: liquidity * 0.3,
      correlation: correlation * 0.3
    };

    return {
      riskFactors,
      totalRisk: Object.values(riskFactors).reduce((a, b) => a + b, 0)
    };
  }

  async calculateVolatility(position) {
    // Would calculate actual volatility from price data
    return 0.2;
  }

  async calculateLiquidity(position) {
    // Would calculate from order book depth
    return 0.3;
  }

  calculateCorrelation(position) {
    if (this.positions.size === 0) return 0;

    const correlations = Array.from(this.positions.values())
      .map(existing => this.pairwiseCorrelation(position, existing));

    return Math.max(...correlations);
  }

  pairwiseCorrelation(position1, position2) {
    // Would calculate actual price correlation
    return 0.5;
  }

  calculatePortfolioRisk() {
    if (this.positions.size === 0) return 0;

    const positions = Array.from(this.positions.values());
    const weights = positions.map(p => p.size / this.getPortfolioValue());
    
    let portfolioRisk = 0;
    for (let i = 0; i < positions.length; i++) {
      for (let j = 0; j < positions.length; j++) {
        const correlation = i === j ? 1 : this.pairwiseCorrelation(positions[i], positions[j]);
        portfolioRisk += weights[i] * weights[j] * correlation;
      }
    }

    return Math.sqrt(portfolioRisk);
  }

  getPortfolioValue() {
    return Array.from(this.positions.values())
      .reduce((sum, pos) => sum + pos.size, 0);
  }

  async updatePortfolioMetrics() {
    const metrics = {
      totalValue: this.getPortfolioValue(),
      risk: this.calculatePortfolioRisk(),
      positions: this.positions.size,
      diversification: this.calculateDiversification()
    };

    console.log('Portfolio metrics:', metrics);
    return metrics;
  }

  calculateDiversification() {
    if (this.positions.size <= 1) return 0;

    const correlations = [];
    const positions = Array.from(this.positions.values());

    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        correlations.push(this.pairwiseCorrelation(positions[i], positions[j]));
      }
    }

    const avgCorrelation = correlations.reduce((a, b) => a + b, 0) / correlations.length;
    return 1 - avgCorrelation;
  }

  async updatePosition(tokenAddress, update) {
    const position = this.positions.get(tokenAddress);
    if (!position) {
      throw new Error('Position not found');
    }

    position.updates.push({
      ...update,
      timestamp: Date.now()
    });

    // Update position metrics
    const risk = await this.calculatePositionRisk(position);
    Object.assign(position, { ...risk });

    this.positions.set(tokenAddress, position);
    await this.updatePortfolioMetrics();

    return position;
  }

  async closePosition(tokenAddress) {
    const position = this.positions.get(tokenAddress);
    if (!position) {
      throw new Error('Position not found');
    }

    position.closeTime = Date.now();
    const metrics = await this.updatePortfolioMetrics();
    
    this.positions.delete(tokenAddress);
    
    return {
      position,
      metrics
    };
  }
}