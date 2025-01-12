import React from 'react';
import styled from 'styled-components';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const NavigationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 1rem 0;
`;

const NavButton = styled.button`
  background: transparent;
  border: 2px solid var(--terminal-green);
  color: var(--terminal-green);
  padding: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  opacity: ${props => props.disabled ? '0.5' : '0.8'};
  pointer-events: ${props => props.disabled ? 'none' : 'auto'};

  &:hover:not(:disabled) {
    opacity: 1;
  }
`;

const PageInfo = styled.div`
  color: var(--terminal-green);
  opacity: 0.8;
`;

export default function RankingNavigation({ currentPage, totalPages, onPageChange }) {
  return (
    <NavigationContainer>
      <NavButton 
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
      >
        <FaChevronLeft />
      </NavButton>
      <PageInfo>
        Page {currentPage + 1} of {totalPages}
      </PageInfo>
      <NavButton 
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages - 1}
      >
        <FaChevronRight />
      </NavButton>
    </NavigationContainer>
  );
}