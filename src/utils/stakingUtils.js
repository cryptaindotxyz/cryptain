export async function checkStakingStatus(walletAddress) {
  try {
    const response = await fetch(`/api/stakes/status/${walletAddress}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch staking status');
    }
    const data = await response.json();
    return {
      isStaking: data.amount > 0,
      amount: data.amount || 0
    };
  } catch (error) {
    console.error('Error checking staking status:', error);
    return { isStaking: false, amount: 0 };
  }
}

export async function getTotalStakingStats() {
  try {
    const response = await fetch('/api/stakes/total');
    if (!response.ok) {
      throw new Error('Failed to fetch total staking stats');
    }
    const data = await response.json();
    return data.total || 0;
  } catch (error) {
    console.error('Error fetching total staking stats:', error);
    return 0;
  }
}