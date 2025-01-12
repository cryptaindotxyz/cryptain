import { useState, useCallback, useRef } from 'react';
import { checkStakingStatus } from '../utils/stakingUtils';

const DEBOUNCE_DELAY = 1000;

export function useVoteStats() {
  const [stats, setStats] = useState({
    voteCount: 0,
    isLoading: false
  });
  
  const updateTimeoutRef = useRef(null);

  const updateStats = useCallback(async (walletAddress) => {
    if (!walletAddress) return;

    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(async () => {
      setStats(prev => ({ ...prev, isLoading: true }));
      
      try {
        const { amount } = await checkStakingStatus(walletAddress);
        setStats({
          voteCount: amount,
          isLoading: false
        });
      } catch (error) {
        console.error('Error updating vote stats:', error);
        setStats(prev => ({ ...prev, isLoading: false }));
      }
    }, DEBOUNCE_DELAY);
  }, []);

  return { ...stats, updateStats };
}