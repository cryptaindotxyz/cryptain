import { createSignMessage } from '../shared/messageSigningUtils.js';
import { encodeBase58 } from './crypto/base58.js';

export { createSignMessage };

export async function signMessage(message) {
  if (!window.solana) {
    throw new Error('Solana wallet not found');
  }

  try {
    const encodedMessage = new TextEncoder().encode(message);
    const signedMessage = await window.solana.signMessage(encodedMessage, 'utf8');
    
    return {
      signature: encodeBase58(signedMessage.signature),
      publicKey: signedMessage.publicKey.toString()
    };
  } catch (error) {
    console.error('Message signing failed:', error);
    throw new Error('Failed to sign message: ' + error.message);
  }
}