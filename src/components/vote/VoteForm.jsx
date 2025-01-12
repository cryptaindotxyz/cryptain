import React, { useState, useEffect } from 'react';
import { Form, Input, Button } from '../StyledComponents';
import { submitVote, getLastVote } from '../../utils/voteUtils';
import { validateStakingForVote } from '../../utils/stakingValidation';

export default function VoteForm({ walletAddress, onError, onStatus, onVoteSuccess }) {
  const [tokenAddress, setTokenAddress] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastVoteTime, setLastVoteTime] = useState(null);
  const [timeUntilNextVote, setTimeUntilNextVote] = useState('');
  const [canVote, setCanVote] = useState(false);
  const [isCheckingStake, setIsCheckingStake] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let interval;

    const checkVoteEligibility = async () => {
      if (!walletAddress) return;

      try {
        setIsLoading(true);
        setCanVote(false);

        // Check staking first
        await validateStakingForVote(walletAddress);

        // Then check last vote
        const lastVote = await getLastVote(walletAddress);
        if (!mounted) return;

        if (lastVote) {
          const timeSinceVote = Date.now() - lastVote.timestamp_ms;
          if (timeSinceVote < 60 * 60 * 1000) {
            setLastVoteTime(new Date(lastVote.timestamp_ms));
            setCanVote(false);
          } else {
            setLastVoteTime(null);
            setCanVote(true);
          }
        } else {
          setLastVoteTime(null);
          setCanVote(true);
        }
      } catch (error) {
        if (!mounted) return;
        console.error('Error checking vote eligibility:', error);
        setCanVote(false);
        onError(error.message);
      } finally {
        if (mounted) {
          setIsLoading(false);
          setIsCheckingStake(false);
        }
      }
    };

    checkVoteEligibility();
    // Refresh eligibility every minute
    interval = setInterval(checkVoteEligibility, 60000);

    return () => {
      mounted = false;
      if (interval) clearInterval(interval);
    };
  }, [walletAddress, onError]);

  useEffect(() => {
    let interval;
    
    if (lastVoteTime) {
      const updateTimeRemaining = () => {
        const now = Date.now();
        const nextVoteTime = lastVoteTime.getTime() + 60 * 60 * 1000;
        const diff = nextVoteTime - now;

        if (diff <= 0) {
          setTimeUntilNextVote('');
          setLastVoteTime(null);
          setCanVote(true);
          return;
        }

        const minutes = Math.floor(diff / 60000);
        const seconds = Math.ceil((diff % 60000) / 1000);
        setTimeUntilNextVote(`Next vote available in ${minutes}m ${seconds}s`);
      };

      updateTimeRemaining();
      interval = setInterval(updateTimeRemaining, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [lastVoteTime]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canVote) return;
    
    setIsProcessing(true);
    onError('');
    onStatus('');

    try {
      await submitVote(tokenAddress, walletAddress);
      setTokenAddress('');
      setLastVoteTime(new Date());
      setCanVote(false);
      onStatus('Vote submitted successfully!');
      onVoteSuccess?.();
    } catch (error) {
      onError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading || isCheckingStake) {
    return <div style={{ textAlign: 'center', opacity: 0.8 }}>Loading...</div>;
  }

  if (!canVote && !lastVoteTime) {
    return (
      <div style={{ textAlign: 'center', opacity: 0.8 }}>
        You need to stake CRYPTAIN tokens to vote. Visit the Token page to stake.
      </div>
    );
  }

  if (lastVoteTime) {
    return (
      <div style={{ textAlign: 'center', opacity: 0.8 }}>
        {timeUntilNextVote}
      </div>
    );
  }

  return (
    <Form onSubmit={handleSubmit}>
      <Input
        type="text"
        value={tokenAddress}
        onChange={(e) => setTokenAddress(e.target.value)}
        placeholder="Enter token contract address"
        required
        disabled={isProcessing}
      />
      <Button type="submit" disabled={!tokenAddress || isProcessing || !canVote}>
        {isProcessing ? 'Processing...' : 'Vote'}
      </Button>
    </Form>
  );
}