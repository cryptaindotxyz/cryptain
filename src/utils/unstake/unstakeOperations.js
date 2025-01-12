import { signMessage, createSignMessage } from '../messageSigningUtils';

export async function unstakeTokens(amount, walletAddress) {
  if (!amount || !walletAddress) {
    throw new Error('Amount and wallet address are required');
  }

  try {
    const message = createSignMessage('unstake', { amount, walletAddress });
    const { signature, publicKey } = await signMessage(message);

    const response = await fetch('/api/unstakes', {
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

export async function cancelUnstake(walletAddress) {
  try {
    const message = createSignMessage('cancel_unstake', { walletAddress });
    const { signature, publicKey } = await signMessage(message);

    const response = await fetch(`/api/unstakes/${walletAddress}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        signature,
        publicKey,
        message
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to cancel unstaking');
    }

    return await response.json();
  } catch (error) {
    console.error('Cancel unstake failed:', error);
    throw new Error(`Cancel unstake failed: ${error.message}`);
  }
}