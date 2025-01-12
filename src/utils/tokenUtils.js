import { CONFIG } from './config';
import { getConnection, getPublicKey } from './solana';
import { getAccount, getMint } from '@solana/spl-token';

export async function getTokenDecimals() {
  return CONFIG.TOKEN_DECIMALS;
}

export async function validateTokenAddress(address) {
  try {
    const response = await fetch(`/api/tokens/validate/${address}`);
    if (!response.ok) {
      return false;
    }
    const data = await response.json();
    return data.isValid;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
}

export async function getTokenBalance(walletAddress) {
  try {
    const connection = getConnection();
    const wallet = getPublicKey(walletAddress);
    const mintPubkey = getPublicKey(CONFIG.TOKEN_MINT_ADDRESS);

    // Get token account
    const tokenAccounts = await connection.getTokenAccountsByOwner(wallet, {
      mint: mintPubkey
    });

    if (tokenAccounts.value.length === 0) {
      return 0;
    }

    // Get mint info for decimals
    const mintInfo = await getMint(connection, mintPubkey);
    
    // Get balance of first token account
    const tokenAccount = await getAccount(connection, tokenAccounts.value[0].pubkey);
    
    // Convert raw balance to decimal number
    return Number(tokenAccount.amount) / Math.pow(10, mintInfo.decimals);
  } catch (error) {
    console.error('Error getting token balance:', error);
    return 0;
  }
}