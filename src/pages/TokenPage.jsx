import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaTimes } from 'react-icons/fa';
import { useWallet } from '@solana/wallet-adapter-react';
import { TerminalContainer } from '../components/Terminal';
import { useStatusMessage } from '../hooks/useStatusMessage';
import { useStakingStats } from '../hooks/useStakingStats';
import { useStakingOperations } from '../hooks/useStakingOperations';
import StakeSwitch from '../components/StakeSwitch';
import StakeForm from '../components/StakeForm';
import UnstakeForm from '../components/UnstakeForm';
import StakingStats from '../components/StakingStats';
import ConnectWallet from '../components/ConnectWallet';
import { WalletInfo, DisconnectButton, Status, Error } from '../components/StyledComponents';
import { getTokenDecimals } from '../utils/tokenUtils';

const Title = styled.h1`
  margin: 0;
`;

const Content = styled.div`
  padding: 1rem 2rem;
`;

export default function TokenPage() {
  const [mode, setMode] = useState('stake');
  const [decimals, setDecimals] = useState(9);
  const { status, setStatus, error, setError } = useStatusMessage();
  const { connected, publicKey, disconnect } = useWallet();
  const { stakedAmount, isLoading, updateStats } = useStakingStats();
  
  const { isProcessing, handleStake, handleUnstake } = 
    useStakingOperations(publicKey?.toBase58(), (forceUpdate) => {
      updateStats(publicKey?.toBase58(), forceUpdate);
      setStatus('Operation successful!');
    });

  useEffect(() => {
    if (connected && publicKey) {
      getTokenDecimals().then(setDecimals);
      updateStats(publicKey.toBase58(), true);
    }
  }, [connected, publicKey, updateStats]);

  const onStake = async (amount) => {
    setError('');
    try {
      await handleStake(amount);
    } catch (err) {
      setError(err.message);
    }
  };

  const onUnstake = async (amount) => {
    setError('');
    try {
      await handleUnstake(amount);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <TerminalContainer>
      <Title data-header>Stake</Title>
      <Content>
        {!connected ? (
          <ConnectWallet />
        ) : (
          <>
            <WalletInfo>
              Connected: {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
              <DisconnectButton onClick={disconnect} title="Disconnect wallet">
                <FaTimes />
              </DisconnectButton>
            </WalletInfo>

            <StakingStats 
              stakedAmount={stakedAmount}
              isLoading={isLoading}
            />

            <StakeSwitch mode={mode} setMode={setMode} />

            {mode === 'stake' ? (
              <StakeForm 
                walletAddress={publicKey.toBase58()}
                decimals={decimals}
                onStake={onStake}
                isProcessing={isProcessing}
              />
            ) : (
              <UnstakeForm 
                stakedAmount={stakedAmount}
                onUnstake={onUnstake}
                isProcessing={isProcessing}
              />
            )}

            {status && <Status>{status}</Status>}
            {error && <Error>{error}</Error>}
          </>
        )}
      </Content>
    </TerminalContainer>
  );
}