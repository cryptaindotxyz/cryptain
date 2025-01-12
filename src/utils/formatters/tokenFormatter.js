/**
 * Formats token information based on screen width
 */
export function formatTokenDisplay(tokenName, tokenSymbol, width) {
  if (!tokenName && !tokenSymbol) return 'Unknown Token';
  
  // On wider screens, show full name and symbol
  if (width >= 400) {
    return tokenName && tokenSymbol 
      ? `${tokenName} (${tokenSymbol})`
      : tokenSymbol || tokenName || 'Unknown Token';
  }
  
  // On smaller screens, show only symbol
  return tokenSymbol || tokenName || 'Unknown Token';
}