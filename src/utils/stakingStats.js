import { checkStakingStatus } from './stakingUtils';

const STATS_CACHE_DURATION = 30 * 1000; // 30 seconds

class StakingStatsCache {
  constructor() {
    this.cache = new Map();
  }

  get(walletAddress) {
    const cached = this.cache.get(walletAddress);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > STATS_CACHE_DURATION) {
      this.cache.delete(walletAddress);
      return null;
    }

    return cached.stats;
  }

  set(walletAddress, stats) {
    this.cache.set(walletAddress, {
      stats,
      timestamp: Date.now()
    });
  }
}

export const stakingStatsCache = new StakingStatsCache();

export async function getStakingStats(walletAddress) {
  if (!walletAddress) {
    return { stakedAmount: 0 };
  }

  // Check cache first
  const cached = stakingStatsCache.get(walletAddress);
  if (cached) return cached;

  // Get fresh data
  const { amount } = await checkStakingStatus(walletAddress);
  
  const stats = { stakedAmount: amount };
  stakingStatsCache.set(walletAddress, stats);
  
  return stats;
}