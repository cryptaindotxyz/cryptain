import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Form, Input, Button } from './StyledComponents';
import { useWalletBalance } from '../hooks/useWalletBalance';

const InputContainer = styled.div`
  position: relative;
  width: 100%;
`;

const MaxButton = styled.button`
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: 1px solid var(--terminal-green);
  color: var(--terminal-green);
  padding: 2px 8px;
  font-family: var(--terminal-font);
  font-size: 0.8rem;
  cursor: pointer;
  opacity: 0.8;

  &:hover {
    opacity: 1;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const BalanceInfo = styled.div`
  text-align: left;
  margin-bottom: 0.5rem;
  opacity: 0.8;
  font-size: 0.9rem;
`;

const ErrorMessage = styled.div`
  color: #ff0000;
  font-size: 0.9rem;
  margin-top: 0.5rem;
  text-align: center;
`;

export default function StakeForm({ walletAddress, onStake, isProcessing }) {
  const [amount, setAmount] = useState('');
  const [validationError, setValidationError] = useState('');
  const { amount: balance, isLoading, updateBalance } = useWalletBalance();

  useEffect(() => {
    if (walletAddress) {
      updateBalance(walletAddress);
    }
  }, [walletAddress, updateBalance]);

  useEffect(() => {
    // Validate amount whenever it or balance changes
    if (amount) {
      const numAmount = Number(amount);
      if (numAmount > balance) {
        setValidationError('Insufficient balance');
      } else {
        setValidationError('');
      }
    } else {
      setValidationError('');
    }
  }, [amount, balance]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validationError) return;

    try {
      await onStake(amount);
      setAmount('');
      updateBalance(walletAddress);
    } catch (err) {
      console.error('Stake error:', err);
    }
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setAmount(value);
    }
  };

  const handleMaxClick = () => {
    setAmount(balance.toString());
  };

  const isStakeDisabled = 
    !amount || 
    isProcessing || 
    Number(amount) > balance || 
    Number(amount) <= 0 ||
    balance <= 0;

  return (
    <Form onSubmit={handleSubmit}>
      <BalanceInfo>
        Wallet Balance: {isLoading ? 'Loading...' : `${balance} CRYPTAIN`}
      </BalanceInfo>
      <InputContainer>
        <Input
          type="text"
          inputMode="numeric"
          pattern="\d*"
          value={amount}
          onChange={handleAmountChange}
          placeholder="Enter amount to stake"
          required
          disabled={isProcessing}
          style={{ paddingRight: '60px' }}
        />
        <MaxButton
          type="button"
          onClick={handleMaxClick}
          disabled={isProcessing || isLoading || balance === 0}
        >
          MAX
        </MaxButton>
      </InputContainer>
      {validationError && <ErrorMessage>{validationError}</ErrorMessage>}
      <Button type="submit" disabled={isStakeDisabled}>
        {isProcessing ? 'Processing...' : 'Stake Tokens'}
      </Button>
    </Form>
  );
}