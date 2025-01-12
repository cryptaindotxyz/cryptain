import { CONFIG } from '../../../config/constants.js';
import { Jupiter } from '@jup-ag/core';
import { PublicKey } from '@solana/web3.js';

export class MarketMaker {
  constructor(connection) {
    this.connection = connection;
    this.jupiter = null;
    this.depthLevels = 10;
    this.pricePoints = 20;
    this.minSpread = CONFIG.MIN_SPREAD || 0.001;
    this.maxSpread = CONFIG.MAX_SPREAD || 0.01;
    this.initializeJupiter();
  }

  async initializeJupiter() {
    try {
      this.jupiter = await Jupiter.load({
        connection: this.connection,
        cluster: 'mainnet-beta',
        platformFeeAndAccounts: {
          feeBps: 5,
          feeAccounts: new Map()
        }
      });
    } catch (error) {
      console.error('Jupiter initialization failed:', error);
      throw error;
    }
  }

  async analyzeMarketDepth(tokenAddress) {
    try {
      const [orderBook, recentTrades, liquidityData] = await Promise.all([
        this.getOrderBook(tokenAddress),
        this.getRecentTrades(tokenAddress),
        this.getLiquidityData(tokenAddress)
      ]);

      const analysis = {
        spread: this.calculateSpread(orderBook),
        depth: this.calculateDepth(orderBook, liquidityData),
        imbalance: this.calculateImbalance(orderBook),
        volatility: this.calculateVolatility(recentTrades),
        manipulation: this.detectManipulation(orderBook, recentTrades),
        liquidity: {
          total: liquidityData.totalLiquidity,
          distribution: liquidityData.distribution,
          concentration: this.calculateLiquidityConcentration(liquidityData)
        }
      };

      return analysis;
    } catch (error) {
      console.error('Market making analysis failed:', error);
      return null;
    }
  }

  async getOrderBook(tokenAddress) {
    try {
      const routes = await this.jupiter.computeRoutes({
        inputMint: new PublicKey(tokenAddress),
        outputMint: new PublicKey(CONFIG.USDC_MINT),
        amount: BigInt(1e6),
        slippageBps: 50
      });

      const pricePoints = routes.routesInfos[0].marketInfos.map(info => ({
        price: parseFloat(info.outAmount) / parseFloat(info.inAmount),
        liquidity: parseFloat(info.lpFee)
      }));

      return {
        bids: pricePoints.map(p => ({
          price: p.price * 0.995,
          size: p.liquidity / p.price
        })),
        asks: pricePoints.map(p => ({
          price: p.price * 1.005,
          size: p.liquidity / p.price
        }))
      };
    } catch (error) {
      console.error('Failed to get order book:', error);
      throw error;
    }
  }

  async getLiquidityData(tokenAddress) {
    try {
      const liquidityMaps = await Promise.all(
        Array(this.pricePoints).fill().map((_, i) => {
          const amount = BigInt(1e6 * (i + 1));
          return this.jupiter.computeRoutes({
            inputMint: new PublicKey(tokenAddress),
            outputMint: new PublicKey(CONFIG.USDC_MINT),
            amount
          });
        })
      );

      const distribution = liquidityMaps.map(routes => {
        const bestRoute = routes.routesInfos[0];
        return {
          price: parseFloat(bestRoute.outAmount) / parseFloat(bestRoute.inAmount),
          liquidity: bestRoute.marketInfos.reduce((sum, info) => 
            sum + parseFloat(info.lpFee), 0
          )
        };
      });

      return {
        totalLiquidity: distribution.reduce((sum, d) => sum + d.liquidity, 0),
        distribution
      };
    } catch (error) {
      console.error('Failed to get liquidity data:', error);
      throw error;
    }
  }

  async getRecentTrades(tokenAddress) {
    try {
      const signatures = await this.connection.getSignaturesForAddress(
        new PublicKey(tokenAddress),
        { limit: 100 }
      );

      const trades = await Promise.all(
        signatures.map(async sig => {
          const tx = await this.connection.getTransaction(sig.signature);
          if (!tx?.meta) return null;

          const preBalances = tx.meta.preTokenBalances;
          const postBalances = tx.meta.postTokenBalances;
          if (!preBalances?.[0] || !postBalances?.[0]) return null;

          return {
            price: postBalances[0].uiTokenAmount.uiAmount / 
                   preBalances[0].uiTokenAmount.uiAmount,
            size: preBalances[0].uiTokenAmount.uiAmount,
            timestamp: tx.blockTime * 1000
          };
        })
      );

      return trades.filter(Boolean);
    } catch (error) {
      console.error('Failed to get recent trades:', error);
      throw error;
    }
  }

  calculateSpread(orderBook) {
    const bestBid = Math.max(...orderBook.bids.map(b => b.price));
    const bestAsk = Math.min(...orderBook.asks.map(a => a.price));
    const midPrice = (bestBid + bestAsk) / 2;
    
    return {
      absolute: bestAsk - bestBid,
      relative: (bestAsk - bestBid) / midPrice,
      midPrice
    };
  }

  calculateDepth(orderBook, liquidityData) {
    const levels = Array(this.depthLevels).fill().map((_, i) => {
      const bidPrice = orderBook.bids[0].price * (1 - i * 0.001);
      const askPrice = orderBook.asks[0].price * (1 + i * 0.001);

      return {
        level: i + 1,
        bidDepth: this.sumLiquidityAtPrice(orderBook.bids, bidPrice),
        askDepth: this.sumLiquidityAtPrice(orderBook.asks, askPrice),
        totalDepth: liquidityData.distribution[i]?.liquidity || 0
      };
    });

    return {
      levels,
      totalBidDepth: levels.reduce((sum, l) => sum + l.bidDepth, 0),
      totalAskDepth: levels.reduce((sum, l) => sum + l.askDepth, 0)
    };
  }

  sumLiquidityAtPrice(orders, targetPrice) {
    return orders
      .filter(o => Math.abs(o.price - targetPrice) / targetPrice < 0.001)
      .reduce((sum, o) => sum + o.size * o.price, 0);
  }

  calculateImbalance(orderBook) {
    const { totalBidDepth, totalAskDepth } = this.calculateDepth(orderBook);
    const totalDepth = totalBidDepth + totalAskDepth;
    
    return {
      ratio: totalBidDepth / totalAskDepth,
      netImbalance: (totalBidDepth - totalAskDepth) / totalDepth,
      severity: Math.abs((totalBidDepth - totalAskDepth) / totalDepth)
    };
  }

  calculateVolatility(trades) {
    if (!trades.length) return { value: 0, annualized: 0 };

    const returns = trades.slice(1).map((trade, i) => 
      Math.log(trade.price / trades[i].price)
    );

    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => 
      sum + Math.pow(ret - mean, 2), 0
    ) / returns.length;

    const stdDev = Math.sqrt(variance);
    const annualizedVol = stdDev * Math.sqrt(365 * 24 * 60);

    return {
      value: stdDev,
      annualized: annualizedVol,
      extremeMovements: this.countExtremeMovements(returns, stdDev)
    };
  }

  countExtremeMovements(returns, stdDev) {
    const threshold = 3 * stdDev;
    return returns.filter(ret => Math.abs(ret) > threshold).length;
  }

  calculateLiquidityConcentration(liquidityData) {
    const totalLiquidity = liquidityData.totalLiquidity;
    const distribution = liquidityData.distribution;

    const gini = this.calculateGiniCoefficient(
      distribution.map(d => d.liquidity)
    );

    const topHeaviness = distribution
      .slice(0, 3)
      .reduce((sum, d) => sum + d.liquidity, 0) / totalLiquidity;

    return {
      gini,
      topHeaviness,
      concentration: Math.max(gini, topHeaviness)
    };
  }

  calculateGiniCoefficient(values) {
    const sortedValues = [...values].sort((a, b) => a - b);
    const n = sortedValues.length;
    const mean = sortedValues.reduce((a, b) => a + b, 0) / n;
    
    const sumOfAbsoluteDifferences = sortedValues.reduce((sum, value, i) => {
      return sum + sortedValues.reduce((innerSum, otherValue) => {
        return innerSum + Math.abs(value - otherValue);
      }, 0);
    }, 0);

    return sumOfAbsoluteDifferences / (2 * n * n * mean);
  }

  detectManipulation(orderBook, trades) {
    const patterns = {
      spoofing: this.detectSpoofing(orderBook),
      layering: this.detectLayering(orderBook),
      washTrading: this.detectWashTrading(trades),
      momentum: this.detectMomentumIgnition(trades)
    };

    return {
      patterns,
      score: this.calculateManipulationScore(patterns),
      confidence: this.calculateDetectionConfidence(patterns)
    };
  }

  detectSpoofing(orderBook) {
    const largeOrders = orderBook.bids.concat(orderBook.asks)
      .filter(order => order.size > this.averageOrderSize(orderBook) * 5);

    return {
      detected: largeOrders.length > 0,
      severity: largeOrders.length / (orderBook.bids.length + orderBook.asks.length)
    };
  }

  detectLayering(orderBook) {
    const pricePoints = new Set([
      ...orderBook.bids.map(b => b.price),
      ...orderBook.asks.map(a => a.price)
    ]);

    const layering = pricePoints.size > this.pricePoints * 2;

    return {
      detected: layering,
      severity: layering ? pricePoints.size / (this.pricePoints * 2) : 0
    };
  }

  detectWashTrading(trades) {
    const volumeProfile = this.analyzeVolumeProfile(trades);
    const suspicious = volumeProfile.repeatedSizes / trades.length;

    return {
      detected: suspicious > 0.2,
      severity: suspicious
    };
  }

  detectMomentumIgnition(trades) {
    const returns = trades.slice(1).map((trade, i) => 
      (trade.price - trades[i].price) / trades[i].price
    );

    const acceleration = returns.slice(1).map((ret, i) => 
      ret - returns[i]
    );

    const ignition = acceleration.some(acc => Math.abs(acc) > 0.05);

    return {
      detected: ignition,
      severity: Math.max(...acceleration.map(Math.abs))
    };
  }

  analyzeVolumeProfile(trades) {
    const sizeCounts = trades.reduce((counts, trade) => {
      const size = Math.round(trade.size * 100) / 100;
      counts[size] = (counts[size] || 0) + 1;
      return counts;
    }, {});

    return {
      repeatedSizes: Object.values(sizeCounts).filter(count => count > 3).length,
      uniqueSizes: Object.keys(sizeCounts).length
    };
  }

  averageOrderSize(orderBook) {
    const sizes = [...orderBook.bids, ...orderBook.asks].map(o => o.size);
    return sizes.reduce((a, b) => a + b, 0) / sizes.length;
  }

  calculateManipulationScore(patterns) {
    const weights = {
      spoofing: 0.3,
      layering: 0.2,
      washTrading: 0.3,
      momentum: 0.2
    };

    return Object.entries(patterns).reduce((score, [pattern, data]) => {
      return score + (data.severity * weights[pattern]);
    }, 0);
  }

  calculateDetectionConfidence(patterns) {
    const detectionCount = Object.values(patterns)
      .filter(p => p.detected).length;

    return detectionCount / Object.keys(patterns).length;
  }
}