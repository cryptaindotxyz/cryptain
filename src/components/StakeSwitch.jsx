import React from 'react';
import styled from 'styled-components';

const SwitchContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const SwitchButton = styled.button`
  background: ${props => props.active ? 'var(--terminal-green)' : 'transparent'};
  color: ${props => props.active ? 'var(--terminal-bg)' : 'var(--terminal-green)'};
  border: 2px solid var(--terminal-green);
  padding: 0.5rem 1rem;
  font-family: var(--terminal-font);
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    opacity: 0.8;
  }
`;

export default function StakeSwitch({ mode, setMode }) {
  return (
    <SwitchContainer>
      <SwitchButton 
        active={mode === 'stake'} 
        onClick={() => setMode('stake')}
      >
        Stake
      </SwitchButton>
      <SwitchButton 
        active={mode === 'unstake'} 
        onClick={() => setMode('unstake')}
      >
        Unstake
      </SwitchButton>
    </SwitchContainer>
  );
}