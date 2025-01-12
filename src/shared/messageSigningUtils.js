import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

export function verifySignature(message, signature, publicKeyStr) {
  try {
    // Convert message to Uint8Array
    const messageBytes = new TextEncoder().encode(message);
    
    // Convert base58 signature to Uint8Array
    const signatureBytes = bs58.decode(signature);
    
    // Get public key bytes
    const publicKey = new PublicKey(publicKeyStr);
    const publicKeyBytes = publicKey.toBytes();
    
    // Verify signature using nacl directly
    return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

export function createSignMessage(action, data) {
  return JSON.stringify({
    action,
    data,
    timestamp: Date.now()
  });
}