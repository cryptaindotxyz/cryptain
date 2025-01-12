import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { getOrCreateAssociatedTokenAccount, createTransferInstruction } from '@solana/spl-token';
import { dbService } from '../db/database.js';

export class TransactionService {
  constructor(rpcUrl) {
    this.connection = new Connection(rpcUrl);
  }

  async createStakeTransaction(walletAddress, amount, tokenMint, paymentAddress, decimals) {
    const wallet = new PublicKey(walletAddress);
    const mintPubkey = new PublicKey(tokenMint);
    const paymentPubkey = new PublicKey(paymentAddress);
    const rawAmount = Math.floor(parseFloat(amount) * Math.pow(10, decimals));

    const sourceAccount = await getOrCreateAssociatedTokenAccount(
      this.connection,
      wallet,
      mintPubkey,
      wallet
    );

    const destinationAccount = await getOrCreateAssociatedTokenAccount(
      this.connection,
      wallet,
      mintPubkey,
      paymentPubkey
    );

    const transferInstruction = createTransferInstruction(
      sourceAccount.address,
      destinationAccount.address,
      wallet,
      rawAmount
    );

    const transaction = new Transaction().add(transferInstruction);
    transaction.feePayer = wallet;
    
    const { blockhash } = await this.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;

    // Save pending transaction
    await dbService.run(`
      INSERT INTO pending_transactions (
        wallet_address,
        amount,
        type,
        created_at
      ) VALUES (?, ?, 'stake', datetime('now'))
    `, [walletAddress, amount]);

    return transaction.serialize();
  }

  async verifyTransaction(signature, walletAddress) {
    try {
      // Wait for transaction confirmation
      await this.connection.confirmTransaction(signature);
      
      // Get transaction details
      const txInfo = await this.connection.getTransaction(signature);
      if (!txInfo) {
        throw new Error('Transaction not found');
      }

      // Get pending transaction
      const pendingTx = await dbService.get(`
        SELECT * FROM pending_transactions 
        WHERE wallet_address = ? 
        AND status = 'pending'
        ORDER BY created_at DESC 
        LIMIT 1
      `, [walletAddress]);

      if (!pendingTx) {
        throw new Error('No pending transaction found');
      }

      // Update transaction status
      await dbService.run(`
        UPDATE pending_transactions 
        SET status = 'completed', 
            signature = ?,
            completed_at = datetime('now')
        WHERE id = ?
      `, [signature, pendingTx.id]);

      return pendingTx;
    } catch (error) {
      console.error('Transaction verification failed:', error);
      throw error;
    }
  }
}