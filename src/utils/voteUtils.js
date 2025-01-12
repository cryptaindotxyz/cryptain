import { validateTokenAddress } from './tokenUtils';
import { signMessage, createSignMessage } from './messageSigningUtils';
import { checkStakingStatus } from './stakingUtils';

export async function submitVote(tokenAddress, walletAddress) {
  try {
    // First validate the token
    const isValid = await validateTokenAddress(tokenAddress);
    if (!isValid) {
      throw new Error('Invalid token address - Token not found on DEX');
    }

    // Get staking amount
    const { amount: stakedAmount } = await checkStakingStatus(walletAddress);
    if (!stakedAmount || stakedAmount <= 0) {
      throw new Error('You need to stake CRYPTAIN tokens to vote');
    }

    // Create and sign the vote message
    const message = createSignMessage('vote', { 
      tokenAddress, 
      walletAddress,
      stakedAmount 
    });
    const { signature, publicKey } = await signMessage(message);

    // Submit the vote
    const response = await fetch('/api/votes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tokenAddress,
        walletAddress,
        stakedAmount,
        signature,
        publicKey,
        message
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to submit vote');
    }

    return await response.json();
  } catch (error) {
    console.error('Vote submission error:', error);
    throw error;
  }
}

export async function getVoteLogs() {
  try {
    const response = await fetch('/api/votes/logs');
    if (!response.ok) {
      throw new Error('Failed to fetch vote logs');
    }
    const data = await response.json();
    // Sort in reverse chronological order (newest first)
    return data || [];
  } catch (error) {
    console.error('Error getting vote logs:', error);
    return [];
  }
}

export async function getLastVote(walletAddress) {
  try {
    const response = await fetch(`/api/votes/last/${walletAddress}`);
    if (!response.ok) {
      throw new Error('Failed to fetch last vote');
    }
    const data = await response.json();
    return data || null;
  } catch (error) {
    console.error('Error getting last vote:', error);
    return null;
  }
}

export async function getVoteRankings() {
  try {
    const response = await fetch('/api/votes/rankings');
    if (!response.ok) {
      throw new Error('Failed to fetch vote rankings');
    }
    return await response.json();
  } catch (error) {
    console.error('Error getting vote rankings:', error);
    return [];
  }
}