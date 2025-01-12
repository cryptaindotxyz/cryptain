import { getConnection } from '../../utils/solana.js';

export class TransactionValidator {
  static async validateTransaction(signature) {
    const connection = getConnection();
    
    try {
      // First check if transaction exists and is confirmed
      const txInfo = await connection.getTransaction(signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0
      });

      if (txInfo?.meta?.err) {
        throw new Error('Transaction failed');
      }

      if (!txInfo) {
        // If not found, wait for confirmation with latest blockhash
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        
        const result = await connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight
        }, 'confirmed');

        if (result.value.err) {
          throw new Error('Transaction failed');
        }

        // Get final transaction info
        const confirmedTx = await connection.getTransaction(signature, {
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 0
        });

        if (!confirmedTx) {
          throw new Error('Transaction not found after confirmation');
        }

        return confirmedTx;
      }

      return txInfo;
    } catch (error) {
      console.error('Transaction validation error:', error);
      throw new Error(`Transaction validation failed: ${error.message}`);
    }
  }
}