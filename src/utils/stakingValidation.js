import { checkStakingStatus } from './stakingUtils';

export async function validateStakingForVote(walletAddress) {
  try {
    // Get staking data from database
    const { isStaking, amount } = await checkStakingStatus(walletAddress);
    
    if (!isStaking || amount <= 0) {
      throw new Error('You need to stake CRYPTAIN tokens to vote');
    }
    
    return amount;
  } catch (error) {
    console.error('Staking validation error:', error);
    throw error;
  }
}