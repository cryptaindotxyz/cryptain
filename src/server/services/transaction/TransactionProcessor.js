import { Transaction } from '@solana/web3.js';
import { TransactionBuilder } from './TransactionBuilder.js';
import { TransactionValidator } from './TransactionValidator.js';
import { TransactionRepository } from '../../db/repositories/TransactionRepository.js';
import { StakeService } from '../StakeService.js';
import { CONFIG } from '../../config/constants.js';
import { handleTransactionError } from '../../utils/errorHandler.js';

export class TransactionProcessor {
  static async prepareStakeTransaction(walletAddress, amount) {
    if (!walletAddress || !amount) {
      throw new Error('Wallet address and amount are required');
    }

    try {
      const transaction = await TransactionBuilder.buildStakeTransaction(
        walletAddress,
        amount,
        CONFIG.TOKEN_MINT_ADDRESS,
        CONFIG.PAYMENT_ADDRESS,
        CONFIG.TOKEN_DECIMALS
      );

      await TransactionRepository.createPending(walletAddress, amount, 'stake');

      // Serialize the entire transaction
      const serializedTransaction = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false
      });

      return serializedTransaction.toString('base64');
    } catch (error) {
      throw handleTransactionError(error);
    }
  }

  static async processTransaction(signature, walletAddress) {
    if (!signature || !walletAddress) {
      throw new Error('Signature and wallet address are required');
    }

    let pendingTx = null;

    try {
      await TransactionValidator.validateTransaction(signature);

      pendingTx = await TransactionRepository.getLatestPending(walletAddress);
      if (!pendingTx) {
        throw new Error('No pending transaction found');
      }

      await TransactionRepository.markAsCompleted(pendingTx.id, signature);

      if (pendingTx.type === 'stake') {
        await StakeService.recordStake({
          walletAddress,
          amount: pendingTx.amount,
          signature
        });
      }

      return { success: true };
    } catch (error) {
      if (pendingTx) {
        await TransactionRepository.markAsFailed(pendingTx.id, error.message);
      }
      throw handleTransactionError(error);
    }
  }
}