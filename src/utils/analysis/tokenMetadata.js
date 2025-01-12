/**
 * Fetches and validates token metadata
 */
export async function getTokenMetadata(tokenAddress) {
  try {
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
    if (!response.ok) return null;
    
    const data = await response.json();
    const pair = data.pairs?.[0];
    if (!pair?.info) return null;

    // Extract website from info.websites array
    const website = pair.info.websites?.[0]?.url || null;

    // Extract social links from info.socials array
    const socials = pair.info.socials || [];
    const twitter = socials.find(s => s.type === 'twitter')?.url || null;
    const telegram = socials.find(s => s.type === 'telegram')?.url || null;

    return { website, twitter, telegram };
  } catch (error) {
    console.error('Error fetching token metadata:', error);
    return null;
  }
}