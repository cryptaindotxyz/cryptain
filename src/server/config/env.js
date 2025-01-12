import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '../../..');

// Load environment variables
dotenv.config({ path: join(rootDir, '.env') });

function validateEnvVar(name, defaultValue = '') {
  const value = process.env[name] || defaultValue;
  if (!value && defaultValue === '') {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value;
}

export const ENV = {
  SOLANA_RPC_URL: validateEnvVar('VITE_SOLANA_RPC_URL'),
  SOLANA_WS_URL: validateEnvVar('VITE_SOLANA_WS_URL', ''),
  TOKEN_MINT_ADDRESS: validateEnvVar('VITE_TOKEN_MINT_ADDRESS'),
  PAYMENT_ADDRESS: validateEnvVar('VITE_PAYMENT_ADDRESS'),
  TOKEN_DECIMALS: parseInt(validateEnvVar('VITE_TOKEN_DECIMALS', '6'), 10),
  MORALIS_API_KEY: validateEnvVar('MORALIS_API_KEY')
};

// Log configuration
console.log('Environment configuration loaded:', {
  rpcUrl: ENV.SOLANA_RPC_URL,
  wsUrl: ENV.SOLANA_WS_URL || 'Not configured',
  tokenDecimals: ENV.TOKEN_DECIMALS
});