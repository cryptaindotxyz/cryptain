import { signMessage, createSignMessage } from './messageSigningUtils';

export async function unstakeTokens(amount, walletAddress) {
  if (!amount || !walletAddress) {
    throw new Error('Amount and wallet address are required');
  }

  try {
    // Create and sign the unstake message
    const message = createSignMessage('unstake', { amount, walletAddress });
    const { signature, publicKey } = await signMessage(message);

    // Submit unstake request
    const response = await fetch('/api/stakes/unstake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        walletAddress,
        amount,
        signature,
        publicKey,
        message
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to process unstake');
    }

    return await response.json();
  } catch (error) {
    console.error('Unstake failed:', error);
    throw new Error(`Unstake failed: ${error.message}`);
  }
}