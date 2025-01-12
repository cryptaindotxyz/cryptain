import { solanaConnection } from './solanaConnection.js';

const RETRY_CONFIG = {
  maxRetries: 5,
  initialDelay: 500,
  maxDelay: 2000,
  commitment: 'finalized'
};

export async function confirmTransaction(signature, commitment = RETRY_CONFIG.commitment) {
  const connection = solanaConnection.getConnection();
  let retries = 0;
  
  while (retries < RETRY_CONFIG.maxRetries) {
    try {
      // Check if already confirmed first
      const status = await connection.getSignatureStatus(signature);
      if (status?.value?.confirmationStatus === commitment) {
        console.log('Transaction already confirmed:', signature);
        return status;
      }

      // Get fresh blockhash for confirmation
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash(commitment);
      
      console.log(`Confirming transaction (attempt ${retries + 1}/${RETRY_CONFIG.maxRetries}):`, {
        signature,
        commitment,
        blockhash: blockhash.substring(0, 10) + '...'
      });

      // Wait for confirmation with timeout
      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      }, commitment);

      // Verify transaction succeeded
      if (confirmation?.value?.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err}`);
      }

      // Double check final status
      const finalStatus = await connection.getSignatureStatus(signature);
      if (finalStatus?.value?.err) {
        throw new Error(`Transaction failed after confirmation: ${finalStatus.value.err}`);
      }

      console.log('Transaction confirmed successfully:', signature);
      return confirmation;
    } catch (error) {
      retries++;
      console.error(`Confirmation attempt ${retries} failed:`, error.message);
      
      if (retries === RETRY_CONFIG.maxRetries) {
        throw new Error(`Transaction confirmation failed after ${retries} attempts: ${error.message}`);
      }

      // Exponential backoff with max delay
      const delay = Math.min(
        RETRY_CONFIG.initialDelay * Math.pow(2, retries - 1),
        RETRY_CONFIG.maxDelay
      );
      
      console.log(`Retrying confirmation in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}