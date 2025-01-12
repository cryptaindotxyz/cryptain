import React from 'react';
import { useWindowSize } from '../../hooks/useWindowSize';
import { shortenAddress } from '../../utils/addressFormatter';
import { CopyableAddress } from '../CopyableAddress';

export const TerminalHeader = ({ tokenAddress }) => {
  const width = useWindowSize();
  const shortenedAddress = shortenAddress(tokenAddress, width);
  
  return (
    <div style={{ opacity: 0.7 }}>
      <CopyableAddress fullAddress={tokenAddress}>{'> '}{shortenedAddress}</CopyableAddress>
    </div>
  );
}