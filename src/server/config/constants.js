import { ENV } from './env.js';

export const SERVER_PORT = 3333;
export const WEBSOCKET_PORT = 3334;

// Format WebSocket URL
function formatWebSocketUrl(url) {
  if (!url) return null;
  try {
    const wsUrl = new URL(url);
    if (!wsUrl.protocol.startsWith('ws')) {
      wsUrl.protocol = wsUrl.protocol === 'https:' ? 'wss:' : 'ws:';
    }
    return wsUrl.toString();
  } catch (error) {
    console.error('Invalid WebSocket URL:', error);
    return null;
  }
}

export const CONFIG = {
  SOLANA_RPC_URL: ENV.SOLANA_RPC_URL,
  SOLANA_WS_URL: formatWebSocketUrl(ENV.SOLANA_WS_URL),
  TOKEN_MINT_ADDRESS: ENV.TOKEN_MINT_ADDRESS,
  PAYMENT_ADDRESS: ENV.PAYMENT_ADDRESS,
  TOKEN_DECIMALS: ENV.TOKEN_DECIMALS,
  MORALIS_API_KEY: ENV.MORALIS_API_KEY
};

// Log config on initialization
console.log('Server configuration loaded:', {
  SERVER_PORT,
  WEBSOCKET_PORT,
  TOKEN_DECIMALS: CONFIG.TOKEN_DECIMALS,
  WS_ENABLED: !!CONFIG.SOLANA_WS_URL
});