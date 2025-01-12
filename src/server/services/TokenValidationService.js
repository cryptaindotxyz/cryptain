import fetch from 'node-fetch';
import { DexDataAggregator } from '../utils/dexDataAggregator.js';

export class TokenValidationService {
  static async validateToken(address) {
    try {
      const url = `https://api.dexscreener.com/latest/dex/tokens/${address}`;
      console.log('Fetching token data from:', url);
      
      const response = await fetch(url);
      if (!response.ok) {
        return { isValid: false };
      }

      const data = await response.json();
      console.log('DexScreener response:', JSON.stringify(data, null, 2));
      
      if (!data.pairs || data.pairs.length === 0) {
        return { isValid: false };
      }

      const metrics = DexDataAggregator.aggregateMetrics(data.pairs);
      if (!metrics) {
        return { isValid: false };
      }

      // Create analysis data object with proper number types
      const analysisData = {
        price: Number(metrics.price),
        liquidity: Number(metrics.liquidity),
        volume24h: Number(metrics.volume24h),
        fdv: Number(metrics.fdv)
      };

      return {
        isValid: true,
        tokenInfo: metrics.tokenInfo,
        analysisData: JSON.stringify(analysisData) // Stringify with proper number types
      };
    } catch (error) {
      console.error('DexScreener validation error:', error);
      return { isValid: false };
    }
  }
}