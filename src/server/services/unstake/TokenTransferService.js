import { Keypair, PublicKey } from '@solana/web3.js';
import { getOrCreateAssociatedTokenAccount, createTransferInstruction } from '@solana/spl-token';
import { CONFIG } from '../../config/constants.js';
import { solanaConnection } from '../../utils/solanaConnection.js';
import { confirmTransaction } from '../../utils/transactionConfirmation.js';
import { buildTransaction, signAndSendTransaction } from '../../utils/solana/transaction.js';
import bs58 from 'bs58';

export class TokenTransferService {
  static async transferTokens(walletAddress, amount) {
    console.log('Starting token transfer process:', { walletAddress, amount });

    if (!process.env.UNSTAKE_WALLET_PRIVATE_KEY) {
      throw new Error('Unstake wallet not configured');
    }

    const connection = solanaConnection.getConnection();
    const unstakeWallet = this.loadUnstakeWallet();
    
    // Setup accounts
    const [sourceAccount, destinationAccount] = await this.setupTokenAccounts(
      connection,
      unstakeWallet,
      walletAddress
    );

    // Send transaction
    return await this.sendUnstakeTransaction(
      connection,
      unstakeWallet,
      sourceAccount,
      destinationAccount,
      amount
    );
  }

  static loadUnstakeWallet() {
    try {
      const privateKey = bs58.decode(process.env.UNSTAKE_WALLET_PRIVATE_KEY);
      const unstakeWallet = Keypair.fromSecretKey(privateKey);
      console.log('Unstake wallet loaded:', unstakeWallet.publicKey.toString());
      return unstakeWallet;
    } catch (error) {
      console.error('Failed to load unstake wallet:', error);
      throw new Error('Invalid unstake wallet configuration');
    }
  }

  static async setupTokenAccounts(connection, unstakeWallet, walletAddress) {
    console.log('Setting up token accounts for:', { walletAddress });

    try {
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

      // Verify accounts exist
      await connection.getAccountInfo(sourceAccount.address);
      await connection.getAccountInfo(destinationAccount.address);

      console.log('Token accounts verified:', {
        source: sourceAccount.address.toString(),
        destination: destinationAccount.address.toString()
      });

      return [sourceAccount, destinationAccount];
    } catch (error) {
      console.error('Failed to setup token accounts:', error);
      throw new Error('Token account setup failed: ' + error.message);
    }
  }

  static async sendUnstakeTransaction(
    connection,
    unstakeWallet,
    sourceAccount,
    destinationAccount,
    amount
  ) {
    console.log('Preparing unstake transaction:', { amount });
    
    try {
      const transferAmount = Math.floor(amount * Math.pow(10, CONFIG.TOKEN_DECIMALS));
      console.log('Calculated transfer amount:', transferAmount);
      
      // Create transfer instruction
      const transferInstruction = createTransferInstruction(
        sourceAccount.address,
        destinationAccount.address,
        unstakeWallet.publicKey,
        transferAmount
      );

      // Build and sign transaction
      const transaction = await buildTransaction(
        transferInstruction,
        unstakeWallet.publicKey,
        connection
      );

      console.log('Signing and sending transaction...');
      const signature = await signAndSendTransaction(
        transaction,
        [unstakeWallet],
        connection
      );
      
      console.log('Transaction sent:', signature);

      // Confirm with higher commitment
      await confirmTransaction(signature);
      console.log('Transaction confirmed successfully');

      return signature;
    } catch (error) {
      console.error('Unstake transaction failed:', error);
      throw new Error('Failed to process unstake: ' + error.message);
    }
  }
}