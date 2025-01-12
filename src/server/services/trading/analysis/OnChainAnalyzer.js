import { CONFIG } from '../../../config/constants.js';

export class OnChainAnalyzer {
  constructor() {
    this.minLiquidity = CONFIG.MIN_LIQUIDITY || 50000;
    this.minVolume = CONFIG.MIN_VOLUME || 10000;
  }

  async analyzeToken(tokenAddress) {
    try {
      const [metrics, holders, transactions] = await Promise.all([
        this.getTokenMetrics(tokenAddress),
        this.getHolderMetrics(tokenAddress),
        this.getTransactionMetrics(tokenAddress)
      ]);

      if (!metrics) return null;

      const analysis = {
        ...metrics,
        ...holders,
        ...transactions,
        score: this.calculateScore(metrics, holders, transactions)
      };

      console.log('On-chain analysis:', analysis);
      return analysis;
    } catch (error) {
      console.error('On-chain analysis failed:', error);
      return null;
    }
  }

  async getTokenMetrics(tokenAddress) {
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
    const data = await response.json();
    const pair = data.pairs?.[0];

    if (!pair) return null;

    return {
      price: parseFloat(pair.priceUsd),
      liquidity: parseFloat(pair.liquidity?.usd || 0),
      volume24h: parseFloat(pair.volume?.h24 || 0),
      priceChange24h: parseFloat(pair.priceChange?.h24 || 0),
      marketCap: parseFloat(pair.fdv || 0)
    };
  }

  async getHolderMetrics(tokenAddress) {
    // Mockup - would fetch from blockchain
    return {
      totalHolders: 1000,
      holdersChange24h: 50,
      topHoldersConcentration: 0.4
    };
  }

  async getTransactionMetrics(tokenAddress) {
    // Mockup - would fetch from blockchain
    return {
      txCount24h: 500,
      uniqueBuyers24h: 200,
      uniqueSellers24h: 150,
      buyPressure: 0.6
    };
  }

  calculateScore(metrics, holders, transactions) {
    if (!metrics || metrics.liquidity < this.minLiquidity) {
      return 0;
    }

    const scores = {
      liquidity: Math.min(metrics.liquidity / 1000000, 1) * 0.3,
      volume: Math.min(metrics.volume24h / metrics.liquidity, 1) * 0.2,
      holders: Math.min(holders.holdersChange24h / 100, 1) * 0.2,
      transactions: Math.min(transactions.txCount24h / 1000, 1) * 0.2,
      buyPressure: transactions.buyPressure * 0.1
    };

    return Object.values(scores).reduce((a, b) => a + b, 0);
  }
}