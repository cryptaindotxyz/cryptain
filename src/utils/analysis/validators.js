/**
 * Validates analysis data structure and types
 */
export function validateAnalysisData(data) {
  if (!data) {
    console.error('No analysis data provided');
    return false;
  }
  
  try {
    // Parse data if it's a string
    const analysis = typeof data === 'string' ? JSON.parse(data) : data;
    
    // Check required fields exist and are numbers
    const requiredFields = ['price', 'liquidity', 'volume24h', 'fdv'];
    return requiredFields.every(field => {
      const value = Number(analysis[field]);
      const isValid = !isNaN(value) && isFinite(value);
      if (!isValid) {
        console.error(`Invalid or missing field: ${field}`, analysis[field]);
      }
      return isValid;
    });
  } catch (error) {
    console.error('Error validating analysis data:', error);
    return false;
  }
}