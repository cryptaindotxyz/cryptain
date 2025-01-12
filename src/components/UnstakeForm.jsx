import React from 'react';
import styled from 'styled-components';
import { Button } from './StyledComponents';

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 400px;
  margin: 0 auto;
  text-align: center;
`;

const StakeInfo = styled.div`
  margin-bottom: 1rem;
  opacity: 0.8;
`;

export default function UnstakeForm({ 
  stakedAmount, 
  onUnstake,
  isProcessing 
}) {
  const handleUnstake = async () => {
    try {
      await onUnstake(stakedAmount);
    } catch (error) {
      console.error('Unstake error:', error);
    }
  };

  return (
    <FormContainer>
      <StakeInfo>
        Available to unstake: {stakedAmount} CRYPTAIN
      </StakeInfo>

      {stakedAmount > 0 && (
        <Button 
          onClick={handleUnstake} 
          disabled={isProcessing}
        >
          {isProcessing ? 'Processing...' : 'Unstake All Tokens'}
        </Button>
      )}
    </FormContainer>
  );
}