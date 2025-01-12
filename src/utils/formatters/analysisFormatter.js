import { validateAnalysisData } from '../analysis/validators.js';
import { formatPrice, formatLargeNumber } from './numberFormatters.js';

/**
 * Formats analysis data into a readable string
 */
export function formatAnalysisData(data) {
  if (!data) {
    console.error('No analysis data provided');
    return null;
  }

  try {
    // Parse if string
    const analysis = typeof data === 'string' ? JSON.parse(data) : data;
    
    // Validate data
    if (!validateAnalysisData(analysis)) {
      console.error('Invalid analysis data:', analysis);
      return null;
    }

    // Format data with token address
    const formattedString = `Price: $${formatPrice(analysis.price)} | ` +
                           `Liquidity: $${formatLargeNumber(analysis.liquidity)} | ` +
                           `24h Volume: $${formatLargeNumber(analysis.volume24h)} | ` +
                           `FDV: $${formatLargeNumber(analysis.fdv)}`;

    return formattedString;
  } catch (error) {
    console.error('Error formatting analysis data:', error);
    return null;
  }
}