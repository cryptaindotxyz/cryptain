import { getConnection } from '../utils/solana';

export class TokenInfoService {
  static async getTokenInfo(tokenAddress) {
    console.log('Fetching token info for:', tokenAddress);
    
    try {
      const connection = getConnection();
      const accountInfo = await connection.getParsedAccountInfo(tokenAddress);
      
      if (!accountInfo?.value?.data?.parsed?.info) {
        console.log('No token info found');
        return null;
      }

      const { name, symbol } = accountInfo.value.data.parsed.info;
      const tokenInfo = { name, symbol };
      console.log('Token info:', tokenInfo);

      return tokenInfo;
    } catch (error) {
      console.error('Error fetching token info:', error);
      return null;
    }
  }
}