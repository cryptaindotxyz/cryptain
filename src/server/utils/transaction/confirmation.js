import { getConnection } from '../solana.js';

const MAX_RETRIES = 5;
const RETRY_DELAY = 1000;

export async function confirmTransaction(signature, commitment = 'confirmed') {
  const connection = getConnection();
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      // Get latest blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      
      // Wait for confirmation
      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      }, commitment);

      if (confirmation?.value?.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err}`);
      }

      // Verify final status
      const status = await connection.getSignatureStatus(signature);
      if (status?.value?.err) {
        throw new Error(`Transaction failed: ${status.value.err}`);
      }

      return confirmation;
    } catch (error) {
      retries++;
      if (retries === MAX_RETRIES) throw error;
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }
}