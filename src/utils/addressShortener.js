/**
 * Utility functions for shortening addresses with different formats
 */

export const ADDRESS_FORMATS = {
  FULL: {
    minWidth: 420,
    format: (address) => address
  },
  LONG: {
    minWidth: 380,
    format: (address) => `${address.slice(0, 15)}...${address.slice(-20)}`
  },
  MEDIUM_LONG: {
    minWidth: 350,
    format: (address) => `${address.slice(0, 13)}...${address.slice(-15)}`
  },
  MEDIUM: {
    minWidth: 325,
    format: (address) => `${address.slice(0, 11)}...${address.slice(-12)}`
  },
  MEDIUM_SHORT: {
    minWidth: 300,
    format: (address) => `${address.slice(0, 9)}...${address.slice(-10)}`
  },
  SHORT: {
    minWidth: 275,
    format: (address) => `${address.slice(0, 7)}...${address.slice(-8)}`
  },
  VERY_SHORT: {
    minWidth: 250,
    format: (address) => `${address.slice(0, 6)}...${address.slice(-6)}`
  },
  TINY: {
    minWidth: 225,
    format: (address) => `${address.slice(0, 4)}...${address.slice(-4)}`
  },
  MINIMAL: {
    minWidth: 0, // Default format for smallest screens
    format: (address) => `${address.slice(0, 4)}...${address.slice(-4)}`
  }
};

/**
 * Shortens an address based on the available width
 * @param {string} address - The address to shorten
 * @param {number} width - The available width in pixels
 * @returns {string} The shortened address
 */
export function shortenAddress(address, width) {
  if (!address) return '';
  
  // Find the appropriate format based on width
  const format = Object.values(ADDRESS_FORMATS)
    .sort((a, b) => b.minWidth - a.minWidth)
    .find(format => width >= format.minWidth);
    
  return format.format(address);
}

/**
 * Returns the appropriate format key based on width
 * @param {number} width - The available width in pixels
 * @returns {string} The format key (e.g., 'FULL', 'LONG', etc.)
 */
export function getFormatForWidth(width) {
  return Object.entries(ADDRESS_FORMATS)
    .sort(([, a], [, b]) => b.minWidth - a.minWidth)
    .find(([, format]) => width >= format.minWidth)?.[0] || 'MINIMAL';
}