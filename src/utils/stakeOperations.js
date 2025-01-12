import { Transaction } from '@solana/web3.js';
import { confirmTransaction } from './transactionConfirmation';

export async function stakeTokens(amount, walletAddress) {
  if (!amount || !walletAddress) {
    throw new Error('Amount and wallet address are required');
  }

  try {
    // Get serialized transaction from server
    const response = await fetch('/api/transactions/prepare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        walletAddress: walletAddress.toString(),
        amount: amount.toString()
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to prepare transaction');
    }

    const { serializedTransaction } = await response.json();
    
    if (!window.solana) {
      throw new Error('Solana wallet not found');
    }

    // Deserialize and sign the transaction
    const transaction = Transaction.from(
      Buffer.from(serializedTransaction, 'base64')
    );

    // Sign and send with longer timeout
    const { signature } = await window.solana.signAndSendTransaction(transaction, {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
      maxRetries: 5
    });

    // Confirm transaction with retries
    await confirmTransaction(signature);

    // Verify transaction with server
    const verifyResponse = await fetch('/api/transactions/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        signature,
        walletAddress: walletAddress.toString()
      })
    });

    if (!verifyResponse.ok) {
      const error = await verifyResponse.json();
      throw new Error(error.error || 'Failed to verify transaction');
    }

    return signature;
  } catch (error) {
    console.error('Stake failed:', error);
    throw error;
  }
}