import React from 'react';
import styled from 'styled-components';
import { TerminalHeader } from './TerminalHeader';
import { TERMINAL_CONFIG } from '../../config/terminal';

const Terminal = styled.div`
  background-color: var(--terminal-bg);
  border: 2px solid var(--terminal-green);
  border-radius: 10px;
  box-shadow: 0 0 10px var(--terminal-green);
  height: 100%;
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
`;

const FixedHeader = styled.div`
  background-color: var(--terminal-bg);
  border-bottom: 1px solid var(--terminal-green);
  padding: 1rem 2rem;
  border-radius: 8px 8px 0 0;
  flex-shrink: 0;
`;

const ScrollContent = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  height: 0; // Force proper scrolling
  
  /* Custom Scrollbar */
  &::-webkit-scrollbar {
    width: 12px;
    background-color: var(--terminal-bg);
  }

  &::-webkit-scrollbar-thumb {
    background-color: var(--terminal-green);
    border: 2px solid var(--terminal-bg);
    border-radius: 6px;
    box-shadow: 0 0 6px var(--terminal-green);
  }

  &::-webkit-scrollbar-track {
    background-color: rgba(0, 255, 0, 0.1);
    border-radius: 6px;
  }

  /* Firefox */
  scrollbar-width: thin;
  scrollbar-color: var(--terminal-green) var(--terminal-bg);
`;

export const TerminalContainer = ({ children }) => {
  let header = null;
  let content = null;

  React.Children.forEach(children, child => {
    if (child?.props?.['data-header']) {
      header = child;
    } else {
      content = child;
    }
  });

  return (
    <Terminal>
      <FixedHeader>
        <TerminalHeader tokenAddress={TERMINAL_CONFIG.tokenAddress} />
        {header}
      </FixedHeader>
      <ScrollContent>
        {content}
      </ScrollContent>
    </Terminal>
  );
};