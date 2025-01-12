import { NumberFormatter } from './numberFormatter.js';
import { DexDataValidator } from './dexDataValidator.js';

/**
 * Aggregates and analyzes DEX pair data to get the most accurate market metrics
 */
export class DexDataAggregator {
  static getTotalLiquidity(pairs) {
    const total = pairs.reduce((sum, pair) => {
      const liquidity = NumberFormatter.safeParseFloat(pair.liquidity?.usd);
      console.log(`Pair liquidity: ${liquidity} USD`);
      return sum + liquidity;
    }, 0);
    console.log(`Total liquidity: ${total} USD`);
    return total;
  }

  static getTotalVolume24h(pairs) {
    const total = pairs.reduce((sum, pair) => {
      const volume = NumberFormatter.safeParseFloat(pair.volume?.h24);
      console.log(`Pair 24h volume: ${volume} USD`);
      return sum + volume;
    }, 0);
    console.log(`Total 24h volume: ${total} USD`);
    return total;
  }

  static getFirstPairMetrics(pairs) {
    const firstPair = pairs[0];
    // Use Number() to maintain precision for small values
    const price = Number(firstPair.priceUsd);
    const fdv = NumberFormatter.safeParseFloat(firstPair.fdv);
    console.log(`First pair metrics - Price: ${price} USD, FDV: ${fdv} USD`);
    return { price, fdv };
  }

  static getTokenInfo(pairs) {
    if (!pairs || pairs.length === 0) return null;
    const baseToken = pairs[0].baseToken;
    const info = {
      name: baseToken.name || '',
      symbol: baseToken.symbol || ''
    };
    console.log('Token info:', info);
    return info;
  }

  static aggregateMetrics(pairs) {
    console.log('Starting metrics aggregation...');
    console.log('Input pairs:', pairs?.length);

    if (!pairs || pairs.length === 0) {
      console.log('No pairs provided');
      return null;
    }

    // Filter out invalid pairs
    const validPairs = DexDataValidator.filterValidPairs(pairs);
    console.log(`Valid pairs: ${validPairs.length} of ${pairs.length}`);

    if (validPairs.length === 0) {
      console.log('No valid pairs found');
      return null;
    }

    // Sort pairs by liquidity
    const sortedPairs = [...validPairs].sort((a, b) => {
      const liquidityA = NumberFormatter.safeParseFloat(a.liquidity?.usd);
      const liquidityB = NumberFormatter.safeParseFloat(b.liquidity?.usd);
      return liquidityB - liquidityA;
    });

    // Get metrics
    const { price, fdv } = this.getFirstPairMetrics(sortedPairs);
    const liquidity = this.getTotalLiquidity(validPairs);
    const volume24h = this.getTotalVolume24h(validPairs);

    const metrics = {
      price: price.toString(), // Pass as string to maintain precision
      liquidity: NumberFormatter.formatLargeNumber(liquidity),
      volume24h: NumberFormatter.formatLargeNumber(volume24h),
      fdv: NumberFormatter.formatLargeNumber(fdv),
      tokenInfo: this.getTokenInfo(validPairs)
    };

    console.log('Final metrics:', metrics);

    // Validate final metrics
    if (isNaN(metrics.price) || isNaN(metrics.liquidity) || 
        isNaN(metrics.volume24h) || isNaN(metrics.fdv)) {
      console.log('Invalid metrics detected');
      return null;
    }

    return metrics;
  }
}