import React, { createContext, useContext, useState, useCallback } from 'react';

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState('');

  const connect = useCallback(async () => {
    try {
      if (!window.solana) {
        throw new Error('Solana wallet not found');
      }

      const response = await window.solana.connect();
      const newAddress = response.publicKey.toString();
      
      setAddress(newAddress);
      setConnected(true);
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

  return (
    <WalletContext.Provider value={{ connected, address, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};