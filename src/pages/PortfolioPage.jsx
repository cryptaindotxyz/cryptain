import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaExternalLinkAlt } from 'react-icons/fa';
import { TerminalContainer, TerminalLine } from '../components/Terminal';
import { formatPrice, formatLargeNumber } from '../utils/formatters/numberFormatters';

const Title = styled.h1`
  margin: 0;
`;

const Content = styled.div`
  padding: 1rem 2rem;
`;

const TokenList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const TokenItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem;
  border: 1px solid var(--terminal-green);
`;

const TokenIcon = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 50%;
`;

const TokenInfo = styled.div`
  flex: 1;
`;

const TokenName = styled.div`
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ExternalLink = styled.a`
  color: var(--terminal-green);
  opacity: 0.8;
  transition: opacity 0.2s;
  line-height: 1;
  
  &:hover {
    opacity: 1;
  }
`;

const TokenBalance = styled.div`
  opacity: 0.8;
`;

const TokenValue = styled.div`
  text-align: right;
`;

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const response = await fetch('/api/portfolio');
        if (!response.ok) {
          throw new Error('Failed to fetch portfolio data');
        }
        const data = await response.json();
        setPortfolio(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPortfolio();
    // Refresh every minute
    const interval = setInterval(fetchPortfolio, 60000);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <TerminalContainer>
        <Title data-header>Portfolio</Title>
        <Content>
          <TerminalLine>Error: {error}</TerminalLine>
        </Content>
      </TerminalContainer>
    );
  }

  if (isLoading || !portfolio) {
    return (
      <TerminalContainer>
        <Title data-header>Portfolio</Title>
        <Content>
          <TerminalLine>Loading portfolio data...</TerminalLine>
        </Content>
      </TerminalContainer>
    );
  }

  return (
    <TerminalContainer>
      <Title data-header>Portfolio</Title>
      <Content>
        <TerminalLine>
          Total Value: ${formatLargeNumber(portfolio.total_usd)}
        </TerminalLine>
        <TokenList>
          {portfolio.tokens.map(token => (
            <TokenItem key={token.token_address}>
              {token.logo_uri && (
                <TokenIcon src={token.logo_uri} alt={token.symbol} />
              )}
              <TokenInfo>
                <TokenName>
                  {token.name} ({token.symbol})
                  <ExternalLink 
                    href={`https://solscan.io/token/${token.token_address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="View on Solscan"
                  >
                    <FaExternalLinkAlt size={12} />
                  </ExternalLink>
                </TokenName>
                <TokenBalance>
                  {formatLargeNumber(token.ui_amount)} × ${formatPrice(token.price_usd)}
                </TokenBalance>
              </TokenInfo>
              <TokenValue>
                ${formatLargeNumber(token.value_usd)}
              </TokenValue>
            </TokenItem>
          ))}
        </TokenList>
      </Content>
    </TerminalContainer>
  );
}