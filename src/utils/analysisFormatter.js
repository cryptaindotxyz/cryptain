import { validateAnalysisData } from './analysis/validators';
import { createAnalysisString } from './analysis/formatters';

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

    // Format data
    const formattedString = createAnalysisString(analysis);
    if (!formattedString) {
      console.error('Failed to format analysis data');
      return null;
    }

    return formattedString;
  } catch (error) {
    console.error('Error formatting analysis data:', error);
    return null;
  }
}