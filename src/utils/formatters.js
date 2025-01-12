/**
 * Utility functions for formatting numbers in the UI
 */
export const formatters = {
  price(value) {
    // Ensure we're working with a number
    const num = Number(value);
    return isFinite(num) ? num.toFixed(4) : '0.0000';
  },

  number(value) {
    // Ensure we're working with a number
    const num = Number(value);
    return isFinite(num) ? Math.round(num).toLocaleString() : '0';
  }
};