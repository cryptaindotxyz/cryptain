export async function getUnstakingInfo(walletAddress) {
  if (!walletAddress) return null;
  
  try {
    const response = await fetch(`/api/unstakes/${walletAddress}`);
    if (!response.ok) {
      throw new Error('Failed to fetch unstaking info');
    }
    
    const data = await response.json();
    if (!data) return null;

    return {
      amount: data.amount,
      signature: data.signature,
      status: data.status
    };
  } catch (error) {
    console.error('Error getting unstaking info:', error);
    return null;
  }
}