/**
 * Formats analysis messages
 */
export function formatAnalysisMessages(tokenInfo, analysisData) {
  try {
    const data = typeof analysisData === 'string' ? JSON.parse(analysisData) : analysisData;
    
    return [
      `Analyzing token ${tokenInfo.name} (${tokenInfo.symbol})`,
      `Price: $${formatPrice(data.price)} | Liquidity: $${formatLargeNumber(data.liquidity)} | 24h Volume: $${formatLargeNumber(data.volume24h)} | FDV: $${formatLargeNumber(data.fdv)}`
    ];
  } catch (error) {
    console.error('Error formatting analysis messages:', error);
    return ['Analysis data unavailable'];
  }
}

function formatPrice(value) {
  const num = Number(value);
  return isFinite(num) ? num.toFixed(6) : '0.000000';
}

function formatLargeNumber(value) {
  const num = Number(value);
  return isFinite(num) ? Math.round(num).toLocaleString() : '0';
}