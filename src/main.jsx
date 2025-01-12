import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { GlobalStyle } from './styles/GlobalStyle';
import { WalletAdapterStyles } from './styles/WalletAdapterStyles';
import { SolanaWalletProvider } from './providers/WalletProvider';
import './utils/solana';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <SolanaWalletProvider>
        <GlobalStyle />
        <WalletAdapterStyles />
        <App />
      </SolanaWalletProvider>
    </BrowserRouter>
  </React.StrictMode>
);