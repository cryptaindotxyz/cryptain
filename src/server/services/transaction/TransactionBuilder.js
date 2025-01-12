import { Transaction } from '@solana/web3.js';
import { getOrCreateAssociatedTokenAccount, createTransferInstruction } from '@solana/spl-token';
import { getConnection, getPublicKey, validateAddress } from '../../utils/solana.js';

export class TransactionBuilder {
  static async buildStakeTransaction(walletAddress, amount, tokenMint, paymentAddress, decimals) {
    // Validate all addresses first
    if (!validateAddress(walletAddress)) {
      throw new Error('Invalid wallet address');
    }
    if (!validateAddress(tokenMint)) {
      throw new Error('Invalid token mint address');
    }
    if (!validateAddress(paymentAddress)) {
      throw new Error('Invalid payment address');
    }

    const connection = getConnection();
    const wallet = getPublicKey(walletAddress);
    const mintPubkey = getPublicKey(tokenMint);
    const paymentPubkey = getPublicKey(paymentAddress);
    
    // Validate and convert amount
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new Error('Invalid amount: Must be a positive number');
    }
    
    const rawAmount = Math.floor(parsedAmount * Math.pow(10, decimals));

    // Get token accounts
    const sourceAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet,
      mintPubkey,
      wallet
    );

    const destinationAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet,
      mintPubkey,
      paymentPubkey
    );

    // Create transfer instruction
    const transferInstruction = createTransferInstruction(
      sourceAccount.address,
      destinationAccount.address,
      wallet,
      rawAmount
    );

    // Build transaction
    const transaction = new Transaction();
    transaction.add(transferInstruction);
    transaction.feePayer = wallet;
    
    // Get latest blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;

    return transaction;
  }
}