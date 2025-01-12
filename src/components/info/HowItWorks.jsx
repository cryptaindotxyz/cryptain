import React from 'react';
import styled from 'styled-components';
import { TerminalLine } from '../Terminal';

const StepsList = styled.div`
  margin: 0;
`;

const StepsHeader = styled(TerminalLine)`
  margin-bottom: 0;
  opacity: 0.8;
`;

const Step = styled(TerminalLine)`
  padding-left: 1rem;
  opacity: 0.9;
  margin: 0;
`;

export default function HowItWorks() {
  return (
    <StepsList>
      <StepsHeader>How it works:</StepsHeader>
      <Step>1. Buy CRYPTAIN tokens</Step>
      <Step>2. Stake your tokens</Step>
      <Step>3. Vote on tokens as investments</Step>
      <Step>4. AI agent trades based on community votes</Step>
    </StepsList>
  );
}