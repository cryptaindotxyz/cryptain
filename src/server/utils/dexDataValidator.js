/**
 * Validates DEX pair data before processing
 */
export class DexDataValidator {
  static isValidPair(pair) {
    console.log('Validating pair:', {
      hasBaseToken: !!pair?.baseToken,
      priceUsd: pair?.priceUsd,
      liquidityUsd: pair?.liquidity?.usd,
      volume24h: pair?.volume?.h24,
      fdv: pair?.fdv
    });

    if (!pair || !pair.baseToken) {
      console.log('Invalid pair: Missing base data');
      return false;
    }

    const price = Number(pair.priceUsd);
    const liquidity = Number(pair.liquidity?.usd);
    const volume = Number(pair.volume?.h24);
    const fdv = Number(pair.fdv);

    const isValid = !isNaN(price) && !isNaN(liquidity) && !isNaN(volume) && !isNaN(fdv);
    console.log(`Pair validation result: ${isValid}`);
    
    return isValid;
  }

  static filterValidPairs(pairs) {
    console.log('Filtering pairs...');
    const validPairs = pairs.filter(pair => this.isValidPair(pair));
    console.log(`Found ${validPairs.length} valid pairs`);
    return validPairs;
  }
}