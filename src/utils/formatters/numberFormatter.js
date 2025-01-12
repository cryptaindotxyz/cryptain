/**
 * Utility functions for formatting numbers in logs
 */
export function formatPrice(value) {
  // Handle string input by parsing first
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return isFinite(num) ? num.toFixed(6) : '0.000000';
}

export function formatLargeNumber(value) {
  // Handle string input by parsing first
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return isFinite(num) ? Math.round(num).toLocaleString() : '0';
}