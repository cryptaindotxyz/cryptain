import { useState } from 'react';
import { stakeTokens } from '../utils/stakeOperations';
import { unstakeTokens } from '../utils/unstakeUtils';

export function useStakingOperations(walletAddress, onSuccess) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStake = async (amount) => {
    setIsProcessing(true);
    try {
      const signature = await stakeTokens(amount, walletAddress);
      await new Promise(resolve => setTimeout(resolve, 2000));
      onSuccess?.(true);
      return signature;
    } catch (error) {
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnstake = async (amount) => {
    setIsProcessing(true);
    try {
      await unstakeTokens(amount, walletAddress);
      await new Promise(resolve => setTimeout(resolve, 2000));
      onSuccess?.(true);
      return true;
    } catch (error) {
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    handleStake,
    handleUnstake
  };
}