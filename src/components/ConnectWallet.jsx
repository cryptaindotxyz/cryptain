import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import styled from 'styled-components';

const WalletButton = styled(WalletMultiButton)`
  background-color: transparent !important;
  border: 2px solid var(--terminal-green) !important;
  color: var(--terminal-green) !important;
  font-family: var(--terminal-font) !important;
  transition: all 0.2s;

  &:hover {
    background-color: var(--terminal-green) !important;
    color: var(--terminal-bg) !important;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Container = styled.div`
  text-align: center;
  margin-top: 2rem;
`;

export default function ConnectWallet() {
  const { connected } = useWallet();

  return (
    <Container>
      <WalletButton />
    </Container>
  );
}