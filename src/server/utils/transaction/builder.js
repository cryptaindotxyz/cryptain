import { Transaction } from '@solana/web3.js';
import { createPriorityFeeInstructions } from './priorityFees.js';

export async function buildTransaction(instruction, feePayer, connection) {
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
  
  const transaction = new Transaction();
  
  // Add priority fee instructions
  const priorityInstructions = createPriorityFeeInstructions();
  transaction.add(...priorityInstructions);
  
  // Add main instruction
  transaction.add(instruction);
  
  transaction.feePayer = feePayer;
  transaction.recentBlockhash = blockhash;
  transaction.lastValidBlockHeight = lastValidBlockHeight;

  return transaction;
}

export async function signAndSendTransaction(transaction, signers, connection) {
  // Sign transaction
  transaction.partialSign(...signers);

  // Verify signatures
  if (!transaction.verifySignatures()) {
    throw new Error('Transaction is missing required signatures');
  }

  // Send transaction
  const rawTransaction = transaction.serialize();
  const signature = await connection.sendRawTransaction(rawTransaction, {
    skipPreflight: false,
    preflightCommitment: 'finalized',
    maxRetries: 5
  });

  // Confirm transaction
  await connection.confirmTransaction({
    signature,
    blockhash: transaction.recentBlockhash,
    lastValidBlockHeight: transaction.lastValidBlockHeight
  });

  return signature;
}