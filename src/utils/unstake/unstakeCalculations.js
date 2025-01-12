/**
 * Calculates the amount available for unstaking
 */
export async function getAvailableToUnstake(stakedAmount, unstakingAmount = 0) {
  // Ensure we're working with numbers
  const staked = Number(stakedAmount) || 0;
  const unstaking = Number(unstakingAmount) || 0;
  
  // Calculate available amount
  return Math.max(0, staked - unstaking);
}