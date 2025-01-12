import { CONFIG } from '../../../config/constants.js';
import { getConnection } from '../../../utils/solana.js';
import { Jupiter } from '@jup-ag/core';

export class RiskManager {
  constructor(config = {}) {
    // Core risk parameters
    this.maxPositionSize = config.maxPositionSize || 100000;
    this.maxPortfolioRisk = config.maxPortfolioRisk || 0.2;
    this.maxDrawdown = config.maxDrawdown || 0.15;
    this.maxLeverage = config.maxLeverage || 1;

    // Position-specific limits
    this.maxPositionCount = config.maxPositionCount || 10;
    this.maxConcentration = config.maxConcentration || 0.25;
    this.minLiquidity = config.minLiquidity || 50000;

    // Stop loss and take profit
    this.stopLossPercent = config.stopLossPercent || 0.05;
    this.takeProfitPercent = config.takeProfitPercent || 0.1;
    this.trailingStopDistance = config.trailingStopDistance || 0.02;

    // Market impact limits
    this.maxSlippage = config.maxSlippage || 0.02;
    this.maxSpread = config.maxSpread || 0.01;
    this.minDepthRatio = config.minDepthRatio || 10;

    // Volatility and momentum
    this.maxVolatility = config.maxVolatility || 0.5;
    this.momentumThreshold = config.momentumThreshold || 0.1;
    this.volumeThreshold = config.volumeThreshold || 50000;

    // Risk tracking
    this.positions = new Map();
    this.riskMetrics = {
      totalRisk: 0,
      drawdown: 0,
      dailyPnL: 0,
      volatility: 0
    };

    // Initialize Jupiter for market data
    this.connection = getConnection();
    this.jupiter = null;
    this.initializeJupiter();
  }

  async initializeJupiter() {
    try {
      this.jupiter = await Jupiter.load({
        connection: this.connection,
        cluster: 'mainnet-beta'
      });
    } catch (error) {
      console.error('Jupiter initialization failed:', error);
    }
  }

  async validateTrade(trade) {
    try {
      const validations = await Promise.all([
        this.validatePositionLimits(trade),
        this.validateMarketConditions(trade),
        this.validateRiskExposure(trade),
        this.validateLiquidity(trade),
        this.validateVolatility(trade)
      ]);

      const failed = validations.find(v => !v.passed);
      if (failed) {
        console.log('Trade validation failed:', failed.reason);
        return failed;
      }

      return { passed: true };
    } catch (error) {
      console.error('Trade validation error:', error);
      return { passed: false, reason: error.message };
    }
  }

  async validatePositionLimits(trade) {
    const currentPosition = this.positions.get(trade.tokenAddress);
    const newSize = (currentPosition?.size || 0) + trade.amount;

    // Check absolute position size
    if (newSize > this.maxPositionSize) {
      return {
        passed: false,
        reason: 'Position size exceeds maximum allowed'
      };
    }

    // Check position count
    if (!currentPosition && this.positions.size >= this.maxPositionCount) {
      return {
        passed: false,
        reason: 'Maximum position count reached'
      };
    }

    // Check concentration
    const portfolioValue = this.getPortfolioValue();
    const concentration = newSize / (portfolioValue + newSize);
    if (concentration > this.maxConcentration) {
      return {
        passed: false,
        reason: 'Position concentration too high'
      };
    }

    return { passed: true };
  }

  async validateMarketConditions(trade) {
    try {
      // Get market data from Jupiter
      const routes = await this.jupiter.computeRoutes({
        inputMint: trade.tokenAddress,
        outputMint: CONFIG.USDC_MINT,
        amount: trade.amount,
        slippageBps: 50
      });

      const bestRoute = routes.routesInfos[0];
      if (!bestRoute) {
        return {
          passed: false,
          reason: 'No valid trading route found'
        };
      }

      // Check slippage
      const priceImpact = bestRoute.priceImpactPct / 100;
      if (priceImpact > this.maxSlippage) {
        return {
          passed: false,
          reason: `Slippage (${(priceImpact * 100).toFixed(2)}%) exceeds maximum allowed`
        };
      }

      // Check spread
      const spread = this.calculateSpread(bestRoute);
      if (spread > this.maxSpread) {
        return {
          passed: false,
          reason: `Spread (${(spread * 100).toFixed(2)}%) too high`
        };
      }

      return { passed: true };
    } catch (error) {
      console.error('Market validation error:', error);
      return {
        passed: false,
        reason: 'Failed to validate market conditions'
      };
    }
  }

  async validateRiskExposure(trade) {
    // Calculate current portfolio risk
    const portfolioRisk = this.calculatePortfolioRisk();
    const newRisk = this.estimateNewRisk(trade, portfolioRisk);

    if (newRisk > this.maxPortfolioRisk) {
      return {
        passed: false,
        reason: 'Exceeds maximum portfolio risk'
      };
    }

    // Check drawdown
    const currentDrawdown = this.calculateDrawdown();
    if (currentDrawdown > this.maxDrawdown) {
      return {
        passed: false,
        reason: 'Maximum drawdown exceeded'
      };
    }

    // Check leverage
    const leverage = this.calculateLeverage(trade);
    if (leverage > this.maxLeverage) {
      return {
        passed: false,
        reason: 'Exceeds maximum leverage'
      };
    }

    return { passed: true };
  }

  async validateLiquidity(trade) {
    try {
      const marketInfo = await this.getMarketInfo(trade.tokenAddress);
      
      // Check minimum liquidity
      if (marketInfo.liquidity < this.minLiquidity) {
        return {
          passed: false,
          reason: 'Insufficient liquidity'
        };
      }

      // Check depth ratio
      const depthRatio = marketInfo.liquidity / trade.amount;
      if (depthRatio < this.minDepthRatio) {
        return {
          passed: false,
          reason: 'Insufficient market depth'
        };
      }

      // Check volume
      if (marketInfo.volume24h < this.volumeThreshold) {
        return {
          passed: false,
          reason: 'Insufficient trading volume'
        };
      }

      return { passed: true };
    } catch (error) {
      console.error('Liquidity validation error:', error);
      return {
        passed: false,
        reason: 'Failed to validate liquidity'
      };
    }
  }

  async validateVolatility(trade) {
    try {
      const volatility = await this.calculateVolatility(trade.tokenAddress);
      
      if (volatility > this.maxVolatility) {
        return {
          passed: false,
          reason: 'Excessive volatility'
        };
      }

      // Check momentum
      const momentum = await this.calculateMomentum(trade.tokenAddress);
      if (Math.abs(momentum) > this.momentumThreshold) {
        return {
          passed: false,
          reason: 'Excessive price momentum'
        };
      }

      return { passed: true };
    } catch (error) {
      console.error('Volatility validation error:', error);
      return {
        passed: false,
        reason: 'Failed to validate volatility'
      };
    }
  }

  async getMarketInfo(tokenAddress) {
    const response = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`
    );
    const data = await response.json();
    const pair = data.pairs?.[0];

    return {
      liquidity: parseFloat(pair?.liquidity?.usd || 0),
      volume24h: parseFloat(pair?.volume?.h24 || 0),
      priceChange24h: parseFloat(pair?.priceChange?.h24 || 0)
    };
  }

  calculateSpread(route) {
    const { inAmount, outAmount } = route;
    const midPrice = outAmount / inAmount;
    const spread = (route.priceImpactPct / 100) * 2; // Approximate spread
    return spread;
  }

  calculatePortfolioRisk() {
    let totalRisk = 0;
    const positions = Array.from(this.positions.values());
    const portfolioValue = this.getPortfolioValue();

    for (const position of positions) {
      const weight = position.size / portfolioValue;
      const positionRisk = position.risk * weight;
      totalRisk += positionRisk;
    }

    return totalRisk;
  }

  estimateNewRisk(trade, currentRisk) {
    const portfolioValue = this.getPortfolioValue();
    const newWeight = trade.amount / (portfolioValue + trade.amount);
    const tradeRisk = this.estimateTradeRisk(trade);

    return currentRisk * (1 - newWeight) + tradeRisk * newWeight;
  }

  estimateTradeRisk(trade) {
    const { metrics } = trade;
    
    // Combine multiple risk factors
    const volatilityRisk = metrics.volatility || 0;
    const liquidityRisk = Math.max(0, 1 - metrics.liquidity / this.minLiquidity);
    const momentumRisk = Math.abs(metrics.priceChange24h || 0) / 100;

    return (
      volatilityRisk * 0.4 +
      liquidityRisk * 0.3 +
      momentumRisk * 0.3
    );
  }

  calculateDrawdown() {
    const positions = Array.from(this.positions.values());
    const currentValue = positions.reduce((sum, pos) => sum + pos.currentValue, 0);
    const peakValue = positions.reduce((sum, pos) => sum + pos.peakValue, 0);

    return peakValue > 0 ? (peakValue - currentValue) / peakValue : 0;
  }

  calculateLeverage(trade) {
    const portfolioValue = this.getPortfolioValue();
    const totalExposure = Array.from(this.positions.values())
      .reduce((sum, pos) => sum + pos.size, 0) + trade.amount;

    return totalExposure / portfolioValue;
  }

  async calculateVolatility(tokenAddress) {
    const prices = await this.getPriceHistory(tokenAddress);
    if (prices.length < 2) return 0;

    const returns = prices.slice(1).map((price, i) => 
      Math.log(price / prices[i])
    );

    const mean = returns.reduce((a, b) => a + b) / returns.length;
    const variance = returns.reduce((sum, ret) => 
      sum + Math.pow(ret - mean, 2), 0
    ) / returns.length;

    return Math.sqrt(variance * 365); // Annualized volatility
  }

  async calculateMomentum(tokenAddress) {
    const prices = await this.getPriceHistory(tokenAddress);
    if (prices.length < 2) return 0;

    const shortTerm = prices.slice(-5).reduce((a, b) => a + b) / 5;
    const longTerm = prices.reduce((a, b) => a + b) / prices.length;

    return (shortTerm - longTerm) / longTerm;
  }

  async getPriceHistory(tokenAddress) {
    try {
      const response = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`
      );
      const data = await response.json();
      return data.pairs?.[0]?.priceUsd || [];
    } catch (error) {
      console.error('Failed to get price history:', error);
      return [];
    }
  }

  getPortfolioValue() {
    return Array.from(this.positions.values())
      .reduce((sum, pos) => sum + pos.currentValue, 0);
  }

  updatePosition(tokenAddress, update) {
    const position = this.positions.get(tokenAddress);
    if (!position) return;

    const newPosition = {
      ...position,
      ...update,
      peakValue: Math.max(position.peakValue, update.currentValue),
      lastUpdate: Date.now()
    };

    this.positions.set(tokenAddress, newPosition);
    this.updateRiskMetrics();
  }

  updateRiskMetrics() {
    this.riskMetrics = {
      totalRisk: this.calculatePortfolioRisk(),
      drawdown: this.calculateDrawdown(),
      dailyPnL: this.calculateDailyPnL(),
      volatility: this.calculatePortfolioVolatility()
    };
  }

  calculateDailyPnL() {
    const positions = Array.from(this.positions.values());
    return positions.reduce((sum, pos) => sum + (pos.dailyPnL || 0), 0);
  }

  calculatePortfolioVolatility() {
    const positions = Array.from(this.positions.values());
    const weights = positions.map(p => p.size / this.getPortfolioValue());
    
    return Math.sqrt(
      positions.reduce((sum, pos, i) => 
        sum + Math.pow(weights[i] * (pos.volatility || 0), 2), 0
      )
    );
  }
}