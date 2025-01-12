import { CONFIG } from '../../config/constants.js';

export class MoralisClient {
  static async getPortfolio(walletAddress) {
    console.log('Fetching portfolio for wallet:', walletAddress);

    try {
      const response = await fetch(
        `https://solana-gateway.moralis.io/account/mainnet/${walletAddress}/portfolio`,
        {
          headers: {
            'accept': 'application/json',
            'X-API-Key': CONFIG.MORALIS_API_KEY
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Moralis API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(`Moralis API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Portfolio data fetched successfully');
      return data;
    } catch (error) {
      console.error('Failed to fetch portfolio:', error);
      // Return empty portfolio data instead of throwing
      return {
        tokens: [],
        nativeBalance: { solana: "0" }
      };
    }
  }

  static async getTokenPrice(tokenAddress) {
    console.log('Fetching price for token:', tokenAddress);

    try {
      const response = await fetch(
        `https://solana-gateway.moralis.io/token/mainnet/${tokenAddress}/price`,
        {
          headers: {
            'accept': 'application/json',
            'X-API-Key': CONFIG.MORALIS_API_KEY
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Moralis API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        return 0;
      }

      const data = await response.json();
      return data.usdPrice || 0;
    } catch (error) {
      console.error('Failed to fetch token price:', error);
      return 0;
    }
  }
}