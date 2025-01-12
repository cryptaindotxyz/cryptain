/**
 * Utility functions for formatting numbers consistently
 */
export class NumberFormatter {
  static formatPrice(price) {
    console.log('Formatting price:', price);
    if (!price || isNaN(price)) {
      console.log('Invalid price, returning 0.000000');
      return '0.000000';
    }
    // Don't convert to float and format directly to preserve precision
    const formatted = price.toFixed(6);
    console.log('Formatted price:', formatted);
    return formatted;
  }

  static formatLargeNumber(number) {
    console.log('Formatting large number:', number);
    if (!number || isNaN(number)) {
      console.log('Invalid number, returning 0');
      return 0;
    }
    const formatted = Math.round(number);
    console.log('Formatted large number:', formatted);
    return formatted;
  }

  static safeParseFloat(value) {
    console.log('Safe parsing:', value);
    if (!value) {
      console.log('No value provided, returning 0');
      return 0;
    }
    // Use Number() instead of parseFloat to maintain precision
    const parsed = Number(value);
    if (isNaN(parsed)) {
      console.log('Parse failed, returning 0');
      return 0;
    }
    console.log('Parsed value:', parsed);
    return parsed;
  }
}