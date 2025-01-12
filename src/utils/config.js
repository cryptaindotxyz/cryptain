// Environment variables with fallbacks
export const CONFIG = {
  SOLANA_RPC_URL: import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  SOLANA_WS_URL: import.meta.env.VITE_SOLANA_WS_URL || '',
  TOKEN_MINT_ADDRESS: import.meta.env.VITE_TOKEN_MINT_ADDRESS,
  PAYMENT_ADDRESS: import.meta.env.VITE_PAYMENT_ADDRESS,
  TOKEN_DECIMALS: parseInt(import.meta.env.VITE_TOKEN_DECIMALS || '9', 10)
};