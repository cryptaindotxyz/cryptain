import { ComputeBudgetProgram } from '@solana/web3.js';

// Default priority fee configuration
const PRIORITY_CONFIG = {
  // Base fee in microLamports (0.001 SOL)
  baseFee: 1000000,
  // Additional fee for high-priority operations
  highPriorityFee: 2000000,
  // Maximum units of compute to use
  computeUnits: 200000
};

/**
 * Creates compute budget instructions for priority fees
 */
export function createPriorityFeeInstructions(priorityLevel = 'normal') {
  const fee = priorityLevel === 'high' 
    ? PRIORITY_CONFIG.highPriorityFee 
    : PRIORITY_CONFIG.baseFee;

  return [
    // Set compute unit limit
    ComputeBudgetProgram.setComputeUnitLimit({
      units: PRIORITY_CONFIG.computeUnits
    }),
    // Set priority fee
    ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: fee
    })
  ];
}