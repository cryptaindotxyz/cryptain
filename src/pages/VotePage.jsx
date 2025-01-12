import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaTimes } from 'react-icons/fa';
import { useWallet } from '@solana/wallet-adapter-react';
import { TerminalContainer } from '../components/Terminal';
import VoteForm from '../components/vote/VoteForm';
import VoteRankings from '../components/vote/VoteRankings';
import VoteSwitch from '../components/vote/VoteSwitch';
import VoteStats from '../components/vote/VoteStats';
import ConnectWallet from '../components/ConnectWallet';
import { useStatusMessage } from '../hooks/useStatusMessage';
import { useVoteStats } from '../hooks/useVoteStats';
import { WalletInfo, DisconnectButton } from '../components/StyledComponents';
import { getLastVote } from '../utils/voteUtils';

const Title = styled.h1`
  margin: 0;
`;

const Content = styled.div`
  padding: 1rem 2rem;
`;

const VOTE_COOLDOWN = 60 * 60 * 1000; // 60 minutes in milliseconds

export default function VotePage() {
  const [mode, setMode] = useState('vote');
  const [lastVoteTime, setLastVoteTime] = useState(null);
  const [isLoadingVoteStatus, setIsLoadingVoteStatus] = useState(true);
  const { connected, publicKey, disconnect } = useWallet();
  const { status, setStatus, error, setError } = useStatusMessage();
  const { voteCount, isLoading, updateStats } = useVoteStats();

  // Check last vote time on mount and after voting
  useEffect(() => {
    const checkLastVote = async () => {
      if (!connected || !publicKey) {
        setLastVoteTime(null);
        setIsLoadingVoteStatus(false);
        return;
      }
      
      try {
        setIsLoadingVoteStatus(true);
        const lastVote = await getLastVote(publicKey.toBase58());
        
        if (lastVote) {
          const voteTime = new Date(lastVote.timestamp).getTime();
          const timeSinceVote = Date.now() - voteTime;
          
          // Only set last vote time if within cooldown period
          if (timeSinceVote < VOTE_COOLDOWN) {
            setLastVoteTime(new Date(lastVote.timestamp));
          } else {
            setLastVoteTime(null);
          }
        } else {
          setLastVoteTime(null);
        }
      } catch (error) {
        console.error('Error checking last vote:', error);
        setError('Failed to check voting status');
      } finally {
        setIsLoadingVoteStatus(false);
      }
    };

    checkLastVote();
    // Check every minute
    const interval = setInterval(checkLastVote, 60000);
    return () => clearInterval(interval);
  }, [connected, publicKey, setError]);

  // Update vote stats
  useEffect(() => {
    if (connected && publicKey) {
      updateStats(publicKey.toBase58());
    }
  }, [connected, publicKey, updateStats]);

  return (
    <TerminalContainer>
      <Title data-header>Vote</Title>
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

            <VoteStats 
              voteCount={voteCount}
              isLoading={isLoading}
            />

            <VoteSwitch mode={mode} setMode={setMode} />
            
            {mode === 'vote' ? (
              isLoadingVoteStatus ? (
                <div style={{ textAlign: 'center', opacity: 0.8 }}>
                  Checking voting status...
                </div>
              ) : (
                <VoteForm 
                  walletAddress={publicKey.toBase58()}
                  onError={setError}
                  onStatus={setStatus}
                  onVoteSuccess={() => {
                    updateStats(publicKey.toBase58());
                    setLastVoteTime(new Date());
                  }}
                  lastVoteTime={lastVoteTime}
                />
              )
            ) : (
              <VoteRankings />
            )}

            {status && <div style={{ color: 'var(--terminal-green)', textAlign: 'center', marginTop: '1rem' }}>{status}</div>}
            {error && <div style={{ color: '#ff0000', textAlign: 'center', marginTop: '1rem' }}>{error}</div>}
          </>
        )}
      </Content>
    </TerminalContainer>
  );
}