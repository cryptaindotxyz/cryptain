import React from 'react';
import styled from 'styled-components';
import { FaExternalLinkAlt } from 'react-icons/fa';
import { shortenAddress } from '../../utils/addressShortener';
import { formatTokenDisplay } from '../../utils/formatters/tokenFormatter';
import { CopyableAddress } from '../CopyableAddress';

const ItemContainer = styled.div`
  margin: 0.5rem 0;
  padding: 0.5rem;
  border: 1px solid var(--terminal-green);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const TokenInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const TokenName = styled.span`
  flex: 2;
`;

const StakeAmount = styled.span`
  flex: 1;
  text-align: right;
  opacity: 0.8;
`;

const TokenAddress = styled.div`
  font-size: 0.8em;
  opacity: 0.6;
  color: var(--terminal-green);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    opacity: 1;
  }
`;

const ExternalLink = styled.a`
  color: var(--terminal-green);
  display: flex;
  align-items: center;
  margin-left: 0.5rem;
  
  &:hover {
    opacity: 0.8;
  }
`;

function formatStakeAmount(amount) {
  return Math.floor(parseFloat(amount)).toLocaleString();
}

export default function RankingItem({ item, index, width }) {
  const tokenDisplay = formatTokenDisplay(item.token_name, item.token_symbol, width);
  const shortenedAddress = shortenAddress(item.token_address, width);

  return (
    <ItemContainer>
      <TokenInfo>
        <TokenName>{index + 1}. {tokenDisplay}</TokenName>
        <StakeAmount>{formatStakeAmount(item.total_stake)} FVND</StakeAmount>
      </TokenInfo>
      {item.token_address && (
        <TokenAddress>
          <CopyableAddress fullAddress={item.token_address}>{shortenedAddress}</CopyableAddress>
          <ExternalLink
            href={`https://solscan.io/token/${item.token_address}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaExternalLinkAlt size={12} />
          </ExternalLink>
        </TokenAddress>
      )}
    </ItemContainer>
  );
}