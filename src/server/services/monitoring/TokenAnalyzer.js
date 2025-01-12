import { DexDataAggregator } from '../../utils/dexDataAggregator.js';

export class TokenAnalyzer {
  static async analyzeToken(tokenAddress) {
    try {
      const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
      if (!response.ok) {
        throw new Error('Failed to fetch token data');
      }

      const data = await response.json();
      if (!data.pairs || data.pairs.length === 0) {
        return null;
      }

      const metrics = DexDataAggregator.aggregateMetrics(data.pairs);
      if (metrics) {
        metrics.tokenAddress = tokenAddress;
      }
      return metrics;
    } catch (error) {
      console.error('Token analysis failed:', error);
      return null;
    }
  }

  static formatAnalysis(analysis) {
    if (!analysis) return null;

    return `Analyzing token (${analysis.tokenAddress}) - Price: $${analysis.price} | ` +
           `Liquidity: $${analysis.liquidity} | ` +
           `24h Volume: $${analysis.volume24h} | ` +
           `FDV: $${analysis.fdv}`;
  }
}