import { Buffer } from 'buffer';
import { PublicKey, Connection } from '@solana/web3.js';
import { ENV } from '../config/env.js';

// Polyfill Buffer for browser environment
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
}

let connection = null;

export function getConnection() {
  if (!connection) {
    const rpcUrl = ENV.SOLANA_RPC_URL;
    const wsUrl = ENV.SOLANA_WS_URL;

    console.log('Initializing Solana connection with:', {
      rpcUrl,
      wsUrl: wsUrl || 'Not configured'
    });

    const config = {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000
    };

    // Add WebSocket endpoint if available
    if (wsUrl) {
      config.wsEndpoint = wsUrl;
      console.log('Using WebSocket endpoint:', wsUrl);
    }

    connection = new Connection(rpcUrl, config);
    
    // Test the connection
    connection.getSlot()
      .then(slot => console.log('Connected to Solana network. Current slot:', slot))
      .catch(err => console.error('Solana connection error:', err));
  }
  return connection;
}

export function getPublicKey(address) {
  if (!address || typeof address !== 'string') {
    throw new Error('Invalid address: Address must be a non-empty string');
  }

  try {
    return new PublicKey(address.trim());
  } catch (error) {
    throw new Error(`Invalid Solana address format: ${error.message}`);
  }
}

export function validateAddress(address) {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}