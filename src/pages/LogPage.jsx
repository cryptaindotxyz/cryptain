import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { TerminalContainer, TerminalLine } from '../components/Terminal';
import { formatAnalysisData } from '../utils/analysisFormatter';
import { useAutoScroll } from '../hooks/useAutoScroll';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import LogFilter from '../components/log/LogFilter';
import { filterLogs } from '../utils/logUtils';
import { getVoteLogs } from '../utils/voteUtils';
import { FaSync } from 'react-icons/fa';

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const TitleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Title = styled.h1`
  margin: 0;
`;

const RefreshButton = styled.button`
  background: transparent;
  border: none;
  color: var(--terminal-green);
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  opacity: 0.8;
  transition: all 0.2s;

  &:hover {
    opacity: 1;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SwitchButton = styled.button`
  background: transparent;
  border: 2px solid var(--terminal-green);
  color: var(--terminal-green);
  padding: 0.5rem 1rem;
  font-family: var(--terminal-font);
  font-size: 1rem;
  cursor: pointer;
  opacity: 0.8;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
`;

const ScrollContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding-right: 12px;

  &::-webkit-scrollbar {
    width: 8px;
    background-color: var(--terminal-bg);
  }

  &::-webkit-scrollbar-thumb {
    background-color: var(--terminal-green);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-track {
    background-color: rgba(0, 255, 0, 0.1);
    border-radius: 4px;
  }

  scrollbar-width: thin;
  scrollbar-color: var(--terminal-green) var(--terminal-bg);
`;

const LogContent = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 1rem 2rem;
`;

const LogMessages = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const LogLine = styled(TerminalLine)`
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-wrap: break-word;
  max-width: 100%;
`;

const LoadingIndicator = styled.div`
  text-align: center;
  padding: 1rem;
  opacity: 0.8;
`;

export default function LogPage() {
  const navigate = useNavigate();
  const [allLogs, setAllLogs] = useState([]);
  const [displayedLogs, setDisplayedLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [filters, setFilters] = useState({
    vote: true,
    analyze: true,
    new: true,
    news: true
  });

  const scrollRef = useAutoScroll(displayedLogs);

  const fetchLogs = async () => {
    try {
      setIsRefreshing(true);
      const data = await getVoteLogs();
      if (Array.isArray(data)) {
        const validLogs = data
          .filter(log => log.message && log.message.trim() !== '')
          .sort((b, a) => new Date(b.timestamp) - new Date(a.timestamp)); // Sort newest first
        setAllLogs(validLogs);
        const filtered = filterLogs(validLogs, filters);
        setDisplayedLogs(filtered.slice(0, 50));
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const filtered = filterLogs(allLogs, filters);
    setDisplayedLogs(filtered.slice(0, 50));
  }, [filters, allLogs]);

  const loadMoreLogs = useCallback(() => {
    if (isLoadingMore) return;
    
    setIsLoadingMore(true);
    const filteredLogs = filterLogs(allLogs, filters);
    const currentLength = displayedLogs.length;
    
    if (currentLength < filteredLogs.length) {
      const nextBatch = filteredLogs.slice(currentLength, currentLength + 50);
      setDisplayedLogs(prev => [...prev, ...nextBatch]);
    }
    
    setIsLoadingMore(false);
  }, [displayedLogs.length, allLogs, filters, isLoadingMore]);

  const lastLogRef = useInfiniteScroll(loadMoreLogs);

  const handleFilterChange = (type, checked) => {
    setFilters(prev => ({ ...prev, [type]: checked }));
  };

  const handleSwitchToAdvanced = () => {
    navigate('/advanced');
  };

  const handleRefresh = () => {
    if (!isRefreshing) {
      setIsRotating(true);
      fetchLogs();
      setTimeout(() => setIsRotating(false), 500);
    }
  };

  return (
    <TerminalContainer>
      <HeaderContainer data-header>
        <TitleContainer>
          <Title>Log</Title>
          <RefreshButton 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            title="Refresh logs"
          >
            <FaSync style={{ 
              transform: isRotating ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.5s ease-in-out'
            }} />
          </RefreshButton>
        </TitleContainer>
        <SwitchButton onClick={handleSwitchToAdvanced}>
          Switch to Advanced
        </SwitchButton>
      </HeaderContainer>
      <LogContent>
        <LogFilter filters={filters} onChange={handleFilterChange} />
        <ScrollContainer ref={scrollRef}>
          <LogMessages>
            {isLoading ? (
              <LogLine>Loading logs...</LogLine>
            ) : displayedLogs.length === 0 ? (
              <LogLine>No logs recorded yet</LogLine>
            ) : (
              displayedLogs.map((log, index) => (
                <LogLine
                  key={log.id || index}
                  ref={index === displayedLogs.length - 1 ? lastLogRef : null}
                >
                  [{new Date(log.timestamp).toLocaleString()}] {log.message}
                  {log.type === 'analysis' && log.data && (
                    <> - {formatAnalysisData(log.data) || 'Analysis data unavailable'}</>
                  )}
                </LogLine>
              ))
            )}
            {isLoadingMore && (
              <LoadingIndicator>Loading more logs...</LoadingIndicator>
            )}
          </LogMessages>
        </ScrollContainer>
      </LogContent>
    </TerminalContainer>
  );
}