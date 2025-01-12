import { Connection, PublicKey } from '@solana/web3.js';
import { CONFIG } from '../../config/constants.js';
import { StakeService } from '../StakeService.js';
import cluster from 'cluster';

export class TransactionMonitor {
  constructor() {
    this.connection = new Connection(CONFIG.SOLANA_RPC_URL, {
      commitment: 'confirmed',
      wsEndpoint: CONFIG.SOLANA_WS_URL
    });
    this.paymentAddress = new PublicKey(CONFIG.PAYMENT_ADDRESS);
    this.subscriptionId = null;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.baseDelay = 5000;
  }

  async start() {
    // Only run monitoring on primary process
    if (!cluster.isPrimary) {
      console.log('Transaction monitoring skipped on worker process');
      return;
    }

    if (this.subscriptionId) return;

    try {
      // Monitor transfers to payment address
      this.subscriptionId = this.connection.onProgramAccountChange(
        new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), // SPL Token program
        async (accountInfo) => {
          await this.handleAccountChange(accountInfo);
        },
        'confirmed',
        [
          {
            memcmp: {
              offset: 0,
              bytes: this.paymentAddress.toBase58()
            }
          }
        ]
      );

      console.log('Transaction monitoring started on primary process');
    } catch (error) {
      console.error('Failed to start transaction monitoring:', error);
      throw error;
    }
  }

  async handleAccountChange(accountInfo, attempt = 1) {
    try {
      const signature = accountInfo.signature;
      const txInfo = await this.connection.getTransaction(signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0
      });

      if (!txInfo || txInfo.meta.err) return;

      // Extract stake amount and wallet address from transaction
      const preTokenBalance = txInfo.meta.preTokenBalances[0];
      const postTokenBalance = txInfo.meta.postTokenBalances[0];
      const amount = (preTokenBalance.uiTokenAmount.uiAmount - postTokenBalance.uiTokenAmount.uiAmount);
      const walletAddress = txInfo.transaction.message.accountKeys[0].toString();

      // Record stake
      await StakeService.recordStake({
        walletAddress,
        amount,
        signature
      });

      console.log('Recorded stake transaction:', {
        walletAddress,
        amount,
        signature
      });
    } catch (error) {
      console.error(`Error processing transaction (attempt ${attempt}):`, error);
      
      if (attempt < this.maxRetries) {
        const delay = this.baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.handleAccountChange(accountInfo, attempt + 1);
      }
    }
  }

  stop() {
    if (this.subscriptionId) {
      this.connection.removeAccountChangeListener(this.subscriptionId);
      this.subscriptionId = null;
      console.log('Transaction monitoring stopped');
    }
  }
}