/**
 * Formats price values with proper decimal places
 */
export function formatPrice(value) {
  const num = Number(value);
  return isFinite(num) ? num.toFixed(6) : '0.000000';
}

/**
 * Formats large numbers with comma separators
 */
export function formatLargeNumber(value) {
  const num = Number(value);
  return isFinite(num) ? Math.round(num).toLocaleString() : '0';
}