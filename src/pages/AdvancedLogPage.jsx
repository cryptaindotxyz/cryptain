import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { TerminalContainer, TerminalLine } from '../components/Terminal';
import ConnectWallet from '../components/ConnectWallet';
import { useWalletBalance } from '../hooks/useWalletBalance';
import { FaTimes } from 'react-icons/fa';

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h1`
  margin: 0;
`;

const BackButton = styled.button`
  background: transparent;
  border: 2px solid var(--terminal-green);
  color: var(--terminal-green);
  padding: 0.5rem 1rem;
  font-family: var(--terminal-font);
  font-size: 1rem;
  cursor: pointer;
  opacity: 0.8;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
`;

const Content = styled.div`
  padding: 1rem 2rem;
`;

const CenteredContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 2rem;
`;

const Message = styled.div`
  font-size: 2rem;
  opacity: 0.8;
  text-align: center;
`;

const RequirementMessage = styled.div`
  font-size: 1.2rem;
  opacity: 0.7;
  text-align: center;
`;

const WalletInfo = styled.div`
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
`;

const DisconnectButton = styled.button`
  background: none;
  border: none;
  color: var(--terminal-green);
  cursor: pointer;
  padding: 0.2rem;
  display: flex;
  align-items: center;
  opacity: 0.8;

  &:hover {
    opacity: 1;
  }
`;

export default function AdvancedLogPage() {
  const { connected, publicKey, disconnect } = useWallet();
  const navigate = useNavigate();
  const { amount: balance, isLoading, updateBalance } = useWalletBalance();

  React.useEffect(() => {
    if (connected && publicKey) {
      updateBalance(publicKey.toString());
    }
  }, [connected, publicKey, updateBalance]);

  const handleBackToLog = () => {
    navigate('/log');
  };

  const renderContent = () => {
    if (!connected) {
      return <ConnectWallet />;
    }

    if (isLoading) {
      return <Message>Loading...</Message>;
    }

    if (balance >= 1000000) {
      return <Message>Coming Soon</Message>;
    }

    return (
      <>
        <Message>Access Restricted</Message>
        <RequirementMessage>1,000,000 CRYPTAIN required to access</RequirementMessage>
      </>
    );
  };

  return (
    <TerminalContainer>
      <HeaderContainer data-header>
        <Title>Advanced Log</Title>
        <BackButton onClick={handleBackToLog}>
          Back to Log
        </BackButton>
      </HeaderContainer>
      <Content>
        {connected && (
          <WalletInfo>
            Connected: {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
            <DisconnectButton onClick={disconnect} title="Disconnect wallet">
              <FaTimes />
            </DisconnectButton>
          </WalletInfo>
        )}
        <CenteredContent>
          {renderContent()}
        </CenteredContent>
      </Content>
    </TerminalContainer>
  );
}