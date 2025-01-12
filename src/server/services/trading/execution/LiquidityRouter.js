import { CONFIG } from '../../../config/constants.js';
import { JupiterTradeExecutor } from './JupiterTradeExecutor.js';

export class LiquidityRouter {
  constructor(connection, wallet) {
    this.jupiterExecutor = new JupiterTradeExecutor(connection, wallet);
    this.minLiquidity = CONFIG.MIN_LIQUIDITY || 10000;
    this.maxSlippage = CONFIG.MAX_SLIPPAGE || 0.01;
  }

  async routeTrade(trade) {
    try {
      console.log('Routing trade:', trade);

      // Get quote from Jupiter
      const quote = await this.jupiterExecutor.getQuote(
        trade.action === 'buy' ? CONFIG.USDC_MINT : trade.tokenAddress,
        trade.action === 'buy' ? trade.tokenAddress : CONFIG.USDC_MINT,
        trade.amount
      );

      if (!quote) {
        throw new Error('No quote available');
      }

      // Validate quote
      if (!this.validateQuote(quote, trade)) {
        throw new Error('Quote validation failed');
      }

      // Create route
      const route = {
        steps: [{
          dexId: 'jupiter',
          amount: trade.amount,
          quote
        }]
      };

      console.log('Selected route:', route);
      return route;
    } catch (error) {
      console.error('Trade routing failed:', error);
      return null;
    }
  }

  validateQuote(quote, trade) {
    // Check price impact
    if (quote.priceImpactPct > this.maxSlippage * 100) {
      console.log('Price impact too high:', quote.priceImpactPct);
      return false;
    }

    // Check minimum liquidity
    const totalLiquidity = quote.marketInfos.reduce((sum, market) => {
      return sum + parseFloat(market.lpFee || 0);
    }, 0);

    if (totalLiquidity < this.minLiquidity) {
      console.log('Insufficient liquidity:', totalLiquidity);
      return false;
    }

    return true;
  }
}