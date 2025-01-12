import { useState, useCallback, useRef } from 'react';
import { getTokenBalance } from '../utils/tokenUtils';

const DEBOUNCE_DELAY = 1000;

export function useWalletBalance() {
  const [balance, setBalance] = useState({
    amount: 0,
    isLoading: false
  });
  
  const updateTimeoutRef = useRef(null);

  const updateBalance = useCallback(async (walletAddress) => {
    if (!walletAddress) return;

    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(async () => {
      setBalance(prev => ({ ...prev, isLoading: true }));
      
      try {
        const amount = await getTokenBalance(walletAddress);
        setBalance({
          amount: Math.floor(amount), // Round down to ensure whole numbers
          isLoading: false
        });
      } catch (error) {
        console.error('Error updating wallet balance:', error);
        setBalance(prev => ({ ...prev, isLoading: false }));
      }
    }, DEBOUNCE_DELAY);
  }, []);

  return { ...balance, updateBalance };
}