import { useState, useCallback, useRef } from 'react';
import { checkStakingStatus } from '../utils/stakingUtils';

export function useStakingStats() {
  const [stats, setStats] = useState({
    stakedAmount: 0,
    isLoading: false
  });
  
  const updateTimeoutRef = useRef(null);

  const updateStats = useCallback(async (walletAddress, forceUpdate = false) => {
    if (!walletAddress) return;

    // Clear existing timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // If force update, skip debounce
    if (forceUpdate) {
      setStats(prev => ({ ...prev, isLoading: true }));
      try {
        const { amount } = await checkStakingStatus(walletAddress);
        setStats({
          stakedAmount: amount,
          isLoading: false
        });
      } catch (error) {
        console.error('Error updating staking stats:', error);
        setStats(prev => ({ ...prev, isLoading: false }));
      }
      return;
    }

    // Set loading state
    setStats(prev => ({ ...prev, isLoading: true }));

    // Debounce regular updates
    updateTimeoutRef.current = setTimeout(async () => {
      try {
        const { amount } = await checkStakingStatus(walletAddress);
        setStats({
          stakedAmount: amount,
          isLoading: false
        });
      } catch (error) {
        console.error('Error updating staking stats:', error);
        setStats(prev => ({ ...prev, isLoading: false }));
      }
    }, 1000);
  }, []);

  return { ...stats, updateStats };
}