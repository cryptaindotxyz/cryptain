import { Transaction } from '@solana/web3.js';
import { createPriorityFeeInstructions } from './priorityFees.js';

export async function buildTransaction(instruction, feePayer, connection, priorityLevel = 'high') {
  // Get blockhash first to ensure freshness
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
  
  const transaction = new Transaction();

  // Add priority fee instructions first
  const priorityInstructions = createPriorityFeeInstructions(priorityLevel);
  transaction.add(...priorityInstructions);
  
  // Add main instruction
  transaction.add(instruction);
  
  transaction.feePayer = feePayer;
  transaction.recentBlockhash = blockhash;
  transaction.lastValidBlockHeight = lastValidBlockHeight;

  return transaction;
}

export async function signAndSendTransaction(transaction, signers, connection) {
  try {
    // Sign transaction
    if (signers.length > 0) {
      transaction.partialSign(...signers);
    }

    // Verify all signatures are present
    if (!transaction.verifySignatures()) {
      throw new Error('Transaction is missing required signatures');
    }

    // Serialize and send with proper options
    const rawTransaction = transaction.serialize({
      verifySignatures: true,
      requireAllSignatures: true
    });
    
    const signature = await connection.sendRawTransaction(rawTransaction, {
      skipPreflight: false,
      preflightCommitment: 'finalized',
      maxRetries: 5
    });

    return signature;
  } catch (error) {
    console.error('Transaction signing/sending failed:', error);
    throw error;
  }
}