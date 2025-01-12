import React from 'react';
import styled from 'styled-components';

const StatsContainer = styled.div`
  text-align: center;
  margin: 1rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const StatItem = styled.div`
  opacity: 0.8;
`;

export default function VoteStats({ voteCount, isLoading }) {
  return (
    <StatsContainer>
      <StatItem>
        {isLoading ? 'Loading...' : `Your votes: ${voteCount} CRYPTAIN`}
      </StatItem>
    </StatsContainer>
  );
}