import { Buffer } from 'buffer';
import { PublicKey } from '@solana/web3.js';
import { connectionManager } from './connectionManager';

// Polyfill Buffer for browser environment
window.Buffer = Buffer;

// Get connection from manager
export const getConnection = () => {
  return connectionManager.getConnection();
};

// Get public key from string
export const getPublicKey = (address) => {
  if (!address) {
    throw new Error('Invalid Solana address: Address is required');
  }

  try {
    return new PublicKey(address);
  } catch (error) {
    throw new Error(`Invalid Solana address: ${error.message}`);
  }
};