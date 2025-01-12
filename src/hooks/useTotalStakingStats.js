import { useState, useCallback, useEffect } from 'react';
import { getTotalStakingStats } from '../utils/stakingUtils';

export function useTotalStakingStats() {
  const [stats, setStats] = useState({
    totalStaked: 0,
    isLoading: true
  });

  const fetchStats = useCallback(async () => {
    try {
      const total = await getTotalStakingStats();
      setStats({
        totalStaked: total,
        isLoading: false
      });
    } catch (error) {
      console.error('Error fetching total staking stats:', error);
      setStats(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    fetchStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  return stats;
}