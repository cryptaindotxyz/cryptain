import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getVoteRankings } from '../../utils/voteUtils';
import { useWindowSize } from '../../hooks/useWindowSize';
import RankingItem from './RankingItem';
import RankingNavigation from './RankingNavigation';

const RankingsContainer = styled.div`
  margin-top: 1rem;
`;

const ITEMS_PER_PAGE = 3;

export default function VoteRankings() {
  const [rankings, setRankings] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const width = useWindowSize();

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        setIsLoading(true);
        const data = await getVoteRankings();
        setRankings(data);
      } catch (err) {
        setError('Failed to load rankings');
        console.error('Error fetching rankings:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRankings();
    const interval = setInterval(fetchRankings, 30000);
    return () => clearInterval(interval);
  }, []);

  // Reset to first page when rankings change
  useEffect(() => {
    setCurrentPage(0);
  }, [rankings.length]);

  if (isLoading) {
    return <div style={{ textAlign: 'center', opacity: 0.8 }}>Loading rankings...</div>;
  }

  if (error) {
    return <div style={{ textAlign: 'center', color: '#ff0000' }}>{error}</div>;
  }

  if (rankings.length === 0) {
    return <div style={{ textAlign: 'center', opacity: 0.8 }}>No votes recorded yet</div>;
  }

  const totalPages = Math.ceil(rankings.length / ITEMS_PER_PAGE);
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const visibleRankings = rankings.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <RankingsContainer>
      {visibleRankings.map((item, index) => (
        <RankingItem 
          key={item.token_address || startIndex + index}
          item={item}
          index={startIndex + index}
          width={width}
        />
      ))}
      <RankingNavigation 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </RankingsContainer>
  );
}