import fetch from 'node-fetch';

export class TokenInfoService {
  static async getTokenInfo(tokenAddress) {
    console.log('Fetching token info for:', tokenAddress);
    
    try {
      const url = `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`;
      console.log('Making request to:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('Token info response not OK:', response.status, response.statusText);
        throw new Error('Failed to fetch token info');
      }

      const data = await response.json();
      console.log('Token info response:', JSON.stringify(data, null, 2));

      const pair = data.pairs?.[0];
      if (!pair) {
        console.log('No pair data found for token');
        return null;
      }

      const tokenInfo = {
        name: pair.baseToken.name,
        symbol: pair.baseToken.symbol
      };
      console.log('Extracted token info:', tokenInfo);

      return tokenInfo;
    } catch (error) {
      console.error('Error fetching token info:', error);
      return null;
    }
  }
}