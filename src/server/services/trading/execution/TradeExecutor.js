import { JupiterTradeExecutor } from './JupiterTradeExecutor.js';

export class TradeExecutor {
  constructor(connection, wallet) {
    this.jupiterExecutor = new JupiterTradeExecutor(connection, wallet);
  }

  async executeTrade(trade) {
    console.log('Executing trade:', trade);

    try {
      // Execute via Jupiter
      const result = await this.jupiterExecutor.executeTrade(trade);
      
      if (!result.success) {
        throw new Error(result.error || 'Trade execution failed');
      }

      // Log trade metrics
      this.logTradeMetrics(trade, result);

      return result;
    } catch (error) {
      console.error('Trade execution failed:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  async getQuote(trade) {
    return await this.jupiterExecutor.getQuote(
      trade.inputMint,
      trade.outputMint,
      trade.amount
    );
  }

  logTradeMetrics(trade, result) {
    const metrics = {
      tokenAddress: trade.tokenAddress,
      action: trade.action,
      amount: trade.amount,
      route: {
        inAmount: result.route.inAmount,
        outAmount: result.route.outAmount,
        priceImpact: result.route.priceImpactPct,
        marketInfos: result.route.marketInfos.map(m => ({
          id: m.id,
          label: m.label,
          inAmount: m.inAmount,
          outAmount: m.outAmount
        }))
      },
      signature: result.signature,
      timestamp: Date.now()
    };

    console.log('Trade metrics:', metrics);
  }
}