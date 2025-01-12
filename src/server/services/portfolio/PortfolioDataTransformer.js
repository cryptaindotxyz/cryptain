export class PortfolioDataTransformer {
  static async transformPortfolioData(moralisData, prices) {
    let totalUsd = 0;
    
    const items = await Promise.all(moralisData.tokens.map(async token => {
      const priceUsd = prices[token.mint] || 0;
      const valueUsd = token.amount * priceUsd;
      totalUsd += valueUsd;

      return {
        address: token.mint,
        name: token.name,
        symbol: token.symbol,
        decimals: token.decimals,
        balance: token.amountRaw,
        uiAmount: token.amount,
        priceUsd,
        valueUsd,
        logoURI: null
      };
    }));

    return {
      totalUsd,
      items: items.sort((a, b) => b.valueUsd - a.valueUsd)
    };
  }
}