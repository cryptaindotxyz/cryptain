import { Keypair, PublicKey } from '@solana/web3.js';
import { getOrCreateAssociatedTokenAccount, createTransferInstruction } from '@solana/spl-token';
import { CONFIG } from '../../config/constants.js';
import { getConnection } from '../../utils/solana.js';
import { buildTransaction, signAndSendTransaction } from '../../utils/transaction/index.js';
import bs58 from 'bs58';

export class TokenTransferService {
  static async transferTokens(walletAddress, amount) {
    console.log('Starting token transfer:', { walletAddress, amount });

    if (!process.env.UNSTAKE_WALLET_PRIVATE_KEY) {
      throw new Error('Unstake wallet not configured');
    }

    try {
      const connection = getConnection();
      const unstakeWallet = this.loadUnstakeWallet();
      
      // Setup accounts
      const [sourceAccount, destinationAccount] = await this.setupTokenAccounts(
        connection,
        unstakeWallet,
        walletAddress
      );

      // Create transfer instruction
      const transferAmount = Math.floor(amount * Math.pow(10, CONFIG.TOKEN_DECIMALS));
      const transferInstruction = createTransferInstruction(
        sourceAccount.address,
        destinationAccount.address,
        unstakeWallet.publicKey,
        transferAmount
      );

      // Build and send transaction
      const transaction = await buildTransaction(
        transferInstruction,
        unstakeWallet.publicKey,
        connection
      );

      const signature = await signAndSendTransaction(
        transaction,
        [unstakeWallet],
        connection
      );

      console.log('Transfer complete:', signature);
      return signature;
    } catch (error) {
      console.error('Transfer failed:', error);
      throw error;
    }
  }

  static loadUnstakeWallet() {
    try {
      const privateKey = bs58.decode(process.env.UNSTAKE_WALLET_PRIVATE_KEY);
      return Keypair.fromSecretKey(privateKey);
    } catch (error) {
      console.error('Failed to load unstake wallet:', error);
      throw new Error('Invalid unstake wallet configuration');
    }
  }

  static async setupTokenAccounts(connection, unstakeWallet, walletAddress) {
    const mintPubkey = new PublicKey(CONFIG.TOKEN_MINT_ADDRESS);
    const userPubkey = new PublicKey(walletAddress);

    const [sourceAccount, destinationAccount] = await Promise.all([
      getOrCreateAssociatedTokenAccount(
        connection,
        unstakeWallet,
        mintPubkey,
        unstakeWallet.publicKey
      ),
      getOrCreateAssociatedTokenAccount(
        connection,
        unstakeWallet,
        mintPubkey,
        userPubkey
      )
    ]);

    return [sourceAccount, destinationAccount];
  }
}