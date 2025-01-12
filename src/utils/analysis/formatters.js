/**
 * Formats currency values with proper precision
 */
export function formatPrice(value) {
  const num = Number(value);
  return isFinite(num) ? num.toFixed(6) : '0.000000';
}

/**
 * Formats large numbers with commas
 */
export function formatLargeNumber(value) {
  const num = Number(value);
  return isFinite(num) ? Math.round(num).toLocaleString() : '0';
}

/**
 * Creates a formatted analysis string
 */
export function createAnalysisString(analysis) {
  try {
    // Parse if string
    const data = typeof analysis === 'string' ? JSON.parse(analysis) : analysis;
    
    return `Price: $${formatPrice(data.price)} | ` +
           `Liquidity: $${formatLargeNumber(data.liquidity)} | ` +
           `24h Volume: $${formatLargeNumber(data.volume24h)} | ` +
           `FDV: $${formatLargeNumber(data.fdv)}`;
  } catch (error) {
    console.error('Error creating analysis string:', error);
    return null;
  }
}