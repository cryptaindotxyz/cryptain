import { getConnection } from './solana';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export async function confirmTransaction(signature, commitment = 'confirmed') {
  const connection = getConnection();
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      
      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      }, commitment);

      if (confirmation?.value?.err) {
        throw new Error('Transaction failed');
      }

      return confirmation;
    } catch (error) {
      retries++;
      if (retries === MAX_RETRIES) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }
}