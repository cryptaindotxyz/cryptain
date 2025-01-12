import React from 'react';
import { useTotalStakingStats } from '../../hooks/useTotalStakingStats';
import { TerminalLine } from '../Terminal';

export default function StakedAmount() {
  const { totalStaked, isLoading } = useTotalStakingStats();

  return (
    <TerminalLine>
      {isLoading 
        ? 'Loading total staked amount...' 
        : `Total Staked: ${totalStaked} CRYPTAIN`
      }
    </TerminalLine>
  );
}