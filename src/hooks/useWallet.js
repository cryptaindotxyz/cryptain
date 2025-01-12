import { useState, useCallback, useRef } from 'react';

export function useWallet() {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState('');
  const updateTimeoutRef = useRef(null);

  const connect = useCallback(async () => {
    try {
      if (!window.solana) {
        throw new Error('Solana wallet not found');
      }

      const response = await window.solana.connect();
      const newAddress = response.publicKey.toString();
      
      // Debounce connection updates
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      
      updateTimeoutRef.current = setTimeout(() => {
        setAddress(newAddress);
        setConnected(true);
      }, 100);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      if (window.solana) {
        await window.solana.disconnect();
      }
      setAddress('');
      setConnected(false);
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  }, []);

  return { connected, address, connect, disconnect };
}