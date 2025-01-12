import { ComputeBudgetProgram } from '@solana/web3.js';

const PRIORITY_CONFIG = {
  baseFee: 1000000, // Increased from 50000 to 1M microLamports
  computeUnits: 200000
};

export function createPriorityFeeInstructions() {
  return [
    ComputeBudgetProgram.setComputeUnitLimit({
      units: PRIORITY_CONFIG.computeUnits
    }),
    ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: PRIORITY_CONFIG.baseFee
    })
  ];
}