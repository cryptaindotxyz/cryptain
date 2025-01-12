import { Connection } from '@solana/web3.js';
import { CONFIG } from '../../config/constants.js';
import { OnChainAnalyzer } from './analysis/OnChainAnalyzer.js';
import { SentimentAnalyzer } from './analysis/SentimentAnalyzer.js';
import { VolumeAnalyzer } from './analysis/VolumeAnalyzer.js';
import { MarketMaker } from './analysis/MarketMaker.js';
import { RiskManager } from './risk/RiskManager.js';
import { PositionManager } from './risk/PositionManager.js';
import { TradeExecutor } from './execution/TradeExecutor.js';
import { LiquidityRouter } from './execution/LiquidityRouter.js';

export class TradingAgent {
  constructor() {
    // Initialize connections and core services
    this.connection = new Connection(CONFIG.SOLANA_RPC_URL);
    
    // Analysis components
    this.onChainAnalyzer = new OnChainAnalyzer();
    this.sentimentAnalyzer = new SentimentAnalyzer();
    this.volumeAnalyzer = new VolumeAnalyzer();
    this.marketMaker = new MarketMaker();
    
    // Risk and position management
    this.riskManager = new RiskManager();
    this.positionManager = new PositionManager();
    
    // Execution components
    this.liquidityRouter = new LiquidityRouter();
    this.tradeExecutor = new TradeExecutor(this.connection, null);
    
    // Agent state
    this.tradingEnabled = true;
    this.lastAnalysis = null;
    this.performanceMetrics = {
      trades: 0,
      winRate: 0,
      profitFactor: 0,
      sharpeRatio: 0
    };
  }

  async processSignal(signal) {
    if (!this.tradingEnabled) {
      console.log('Trading is disabled');
      return;
    }

    try {
      console.log('Processing signal:', signal);
      
      // Comprehensive analysis
      const analysis = await this.performAnalysis(signal);
      if (!analysis) {
        console.log('Analysis failed, skipping signal');
        return;
      }

      // Generate trade decision
      const trade = await this.generateTrade(signal.tokenAddress, analysis);
      if (!trade) {
        console.log('No trade generated');
        return;
      }

      // Risk validation
      const validation = await this.validateTrade(trade, analysis);
      if (!validation.passed) {
        console.log('Trade validation failed:', validation.reason);
        return;
      }

      // Find optimal execution route
      const route = await this.liquidityRouter.routeTrade(trade);
      if (!route) {
        console.log('No viable route found');
        return;
      }

      // Execute trade
      const result = await this.executeTrade(trade, route);
      if (result.success) {
        await this.updatePosition(trade, result);
      }

      // Update performance metrics
      await this.updatePerformanceMetrics(result);

      return result; <boltAction type="file" filePath="src/server/services/trading/TradingAgent.js">    } catch (error) {
      console.error('Signal processing failed:', error);
      return { success: false, error: error.message };
    }
  }

  async performAnalysis(signal) {
    try {
      // Run all analysis in parallel
      const [
        onChainAnalysis,
        sentimentAnalysis,
        volumeAnalysis,
        marketAnalysis
      ] = await Promise.all([
        this.onChainAnalyzer.analyzeToken(signal.tokenAddress),
        this.sentimentAnalyzer.analyzeSentiment(signal.socialData),
        this.volumeAnalyzer.analyzeVolume(signal.tokenAddress),
        this.marketMaker.analyzeMarketDepth(signal.tokenAddress)
      ]);

      if (!onChainAnalysis || !sentimentAnalysis || 
          !volumeAnalysis || !marketAnalysis) {
        return null;
      }

      const analysis = {
        onChain: onChainAnalysis,
        sentiment: sentimentAnalysis,
        volume: volumeAnalysis,
        market: marketAnalysis,
        score: this.calculateCombinedScore({
          onChainAnalysis,
          sentimentAnalysis,
          volumeAnalysis,
          marketAnalysis
        })
      };

      this.lastAnalysis = analysis;
      return analysis;
    } catch (error) {
      console.error('Analysis failed:', error);
      return null;
    }
  }

  calculateCombinedScore(analyses) {
    const weights = {
      onChain: 0.3,
      sentiment: 0.2,
      volume: 0.3,
      market: 0.2
    };

    return {
      score: (
        analyses.onChainAnalysis.score * weights.onChain +
        analyses.sentimentAnalysis.score * weights.sentiment +
        analyses.volumeAnalysis.score * weights.volume +
        (1 - analyses.marketAnalysis.manipulation.score) * weights.market
      ),
      confidence: this.calculateConfidence(analyses)
    };
  }

  calculateConfidence(analyses) {
    const confidenceFactors = [
      analyses.onChainAnalysis.score > 0.7,
      analyses.sentimentAnalysis.confidence > 0.8,
      analyses.volume.anomalies.severity < 1,
      analyses.market.manipulation.score < 0.3
    ];

    return confidenceFactors.filter(Boolean).length / confidenceFactors.length;
  }

  async generateTrade(tokenAddress, analysis) {
    const { score, confidence } = analysis.score;
    
    if (score < 0.6 || confidence < 0.7) {
      return null;
    }

    // Determine trade direction
    const direction = this.determineTradeDirection(analysis);
    if (!direction) return null;

    // Calculate position size
    const size = await this.calculatePositionSize(analysis);
    if (size <= 0) return null;

    return {
      tokenAddress,
      action: direction,
      amount: size,
      analysis
    };
  }

  determineTradeDirection(analysis) {
    const {
      onChain,
      sentiment,
      volume,
      market
    } = analysis;

    // Weight different signals
    const signals = {
      priceAction: onChain.priceChange24h > 0 ? 1 : -1,
      sentiment: sentiment.sentiment > 0.5 ? 1 : -1,
      volumeTrend: volume.momentum.trend === 'increasing' ? 1 : -1,
      marketDepth: market.imbalance > 0 ? 1 : -1
    };

    const weights = {
      priceAction: 0.3,
      sentiment: 0.2,
      volumeTrend: 0.3,
      marketDepth: 0.2
    };

    const weightedSum = Object.entries(signals)
      .reduce((sum, [signal, value]) => {
        return sum + value * weights[signal];
      }, 0);

    if (Math.abs(weightedSum) < 0.3) return null;
    return weightedSum > 0 ? 'buy' : 'sell';
  }

  async calculatePositionSize(analysis) {
    const baseSize = this.positionManager.getPortfolioValue() * 0.1;
    
    // Adjust for confidence
    const confidenceAdjustment = analysis.score.confidence;
    
    // Adjust for volatility
    const volatilityAdjustment = Math.max(0.5, 1 - analysis.volume.volatility);
    
    // Adjust for liquidity
    const liquidityAdjustment = Math.min(
      1,
      analysis.market.depth.totalDepth / (baseSize * 10)
    );

    return baseSize * 
           confidenceAdjustment * 
           volatilityAdjustment * 
           liquidityAdjustment;
  }

  async validateTrade(trade, analysis) {
    try {
      // Risk manager validation
      const riskValidation = await this.riskManager.validateTrade({
        ...trade,
        metrics: analysis.onChain
      });

      if (!riskValidation.passed) {
        return riskValidation;
      }

      // Position manager validation
      if (!this.positionManager.canAddPosition(trade)) {
        return {
          passed: false,
          reason: 'Position limits exceeded'
        };
      }

      // Market impact validation
      const impactValidation = this.validateMarketImpact(
        trade,
        analysis.market
      );

      if (!impactValidation.passed) {
        return impactValidation;
      }

      return { passed: true };
    } catch (error) {
      console.error('Trade validation failed:', error);
      return {
        passed: false,
        reason: 'Validation error: ' + error.message
      };
    }
  }

  validateMarketImpact(trade, marketAnalysis) {
    const { amount } = trade;
    const { depth } = marketAnalysis;

    // Calculate expected price impact
    const impactRatio = amount / depth.totalDepth;
    
    if (impactRatio > 0.1) {
      return {
        passed: false,
        reason: 'Excessive market impact'
      };
    }

    return { passed: true };
  }

  async executeTrade(trade, route) {
    try {
      // Execute each route step
      const results = [];
      
      for (const step of route.steps) {
        const result = await this.tradeExecutor.executeTrade({
          ...trade,
          amount: step.amount,
          dexId: step.dexId
        });

        results.push(result);

        if (!result.success) {
          // Attempt to revert previous steps if any failed
          await this.revertTradeSteps(results);
          return {
            success: false,
            error: 'Step execution failed'
          };
        }
      }

      return {
        success: true,
        steps: results
      };
    } catch (error) {
      console.error('Trade execution failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async revertTradeSteps(results) {
    for (const result of results) {
      if (result.success) {
        try {
          await this.tradeExecutor.revertTrade(result);
        } catch (error) {
          console.error('Trade reversion failed:', error);
        }
      }
    }
  }

  async updatePosition(trade, result) {
    if (trade.action === 'buy') {
      await this.positionManager.addPosition({
        tokenAddress: trade.tokenAddress,
        amount: trade.amount,
        entryPrice: trade.analysis.onChain.price
      });
    } else {
      await this.positionManager.closePosition(trade.tokenAddress);
    }
  }

  async updatePerformanceMetrics(result) {
    this.performanceMetrics.trades++;
    
    if (result.success) {
      // Update win rate
      const newWinRate = (
        (this.performanceMetrics.winRate * (this.performanceMetrics.trades - 1)) +
        (result.profit > 0 ? 1 : 0)
      ) / this.performanceMetrics.trades;
      
      this.performanceMetrics.winRate = newWinRate;

      // Update other metrics
      await this.calculatePerformanceMetrics();
    }
  }

  async calculatePerformanceMetrics() {
    const positions = Array.from(this.positionManager.positions.values());
    
    // Calculate profit factor
    const profits = positions.reduce((sum, pos) => {
      return sum + (pos.profit > 0 ? pos.profit : 0);
    }, 0);
    
    const losses = positions.reduce((sum, pos) => {
      return sum + (pos.profit < 0 ? Math.abs(pos.profit) : 0);
    }, 0);

    this.performanceMetrics.profitFactor = losses > 0 ? profits / losses : profits;

    // Calculate Sharpe ratio
    const returns = positions.map(pos => pos.profit / pos.size);
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const stdDev = Math.sqrt(
      returns.reduce((sum, ret) => {
        return sum + Math.pow(ret - avgReturn, 2);
      }, 0) / returns.length
    );

    this.performanceMetrics.sharpeRatio = avgReturn / stdDev;
  }

  async monitorPositions() {
    try {
      // Check all positions
      const positions = Array.from(this.positionManager.positions.values());
      
      for (const position of positions) {
        // Get current analysis
        const analysis = await this.performAnalysis({
          tokenAddress: position.tokenAddress
        });

        if (!analysis) continue;

        // Check exit signals
        if (this.shouldExitPosition(position, analysis)) {
          const trade = {
            tokenAddress: position.tokenAddress,
            action: 'sell',
            amount: position.amount,
            analysis
          };

          // Find route and execute
          const route = await this.liquidityRouter.routeTrade(trade);
          if (route) {
            await this.executeTrade(trade, route);
          }
        }
      }
    } catch (error) {
      console.error('Position monitoring failed:', error);
    }
  }

  shouldExitPosition(position, analysis) {
    // Check stop loss
    const currentPrice = analysis.onChain.price;
    const loss = (position.entryPrice - currentPrice) / position.entryPrice;
    
    if (loss >= this.riskManager.stopLossPercent) {
      return true;
    }

    // Check take profit
    const profit = (currentPrice - position.entryPrice) / position.entryPrice;
    if (profit >= this.riskManager.takeProfitPercent) {
      return true;
    }

    // Check deteriorating metrics
    if (analysis.score.score < 0.4 || analysis.score.confidence < 0.5) {
      return true;
    }

    // Check market manipulation
    if (analysis.market.manipulation.score > 0.7) {
      return true;
    }

    return false;
  }

  setWallet(wallet) {
    this.tradeExecutor = new TradeExecutor(this.connection, wallet);
  }

  enableTrading() {
    this.tradingEnabled = true;
    console.log('Trading enabled');
  }

  disableTrading() {
    this.tradingEnabled = false;
    console.log('Trading disabled');
  }
}