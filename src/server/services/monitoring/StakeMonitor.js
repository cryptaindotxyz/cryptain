import { Connection, PublicKey } from '@solana/web3.js';
import { CONFIG } from '../../config/constants.js';
import { StakeService } from '../StakeService.js';
import { StakesDB } from '../../db/stakes.js';
import cluster from 'cluster';

export class StakeMonitor {
  constructor() {
    this.connection = new Connection(CONFIG.SOLANA_RPC_URL, {
      commitment: 'confirmed',
      wsEndpoint: CONFIG.SOLANA_WS_URL
    });
    this.paymentAddress = new PublicKey(CONFIG.PAYMENT_ADDRESS);
    this.mintAddress = new PublicKey(CONFIG.TOKEN_MINT_ADDRESS);
    this.subscriptionId = null;
    this.lastSignature = null;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.baseDelay = 5000;
  }

  async start() {
    // Only run monitoring on primary process
    if (!cluster.isPrimary) {
      console.log('Stake monitoring skipped on worker process');
      return;
    }

    if (this.subscriptionId) return;

    try {
      await this.monitorNewTransactions();
      setInterval(() => this.checkMissedTransactions(), 30000);
      console.log('Stake monitoring started on primary process');
    } catch (error) {
      console.error('Failed to start stake monitoring:', error);
      throw error;
    }
  }

  async monitorNewTransactions() {
    const signatures = await this.connection.getSignaturesForAddress(
      this.paymentAddress,
      { limit: 1 },
      'confirmed'
    );
    
    if (signatures?.[0]?.signature) {
      this.lastSignature = signatures[0].signature;
    }

    this.subscriptionId = this.connection.onAccountChange(
      this.paymentAddress,
      async () => {
        await this.checkNewTransactions();
      },
      'confirmed'
    );
  }

  async checkNewTransactions() {
    try {
      const signatures = await this.connection.getSignaturesForAddress(
        this.paymentAddress,
        { until: this.lastSignature },
        'confirmed'
      );

      for (const { signature } of signatures.reverse()) {
        await this.processTransaction(signature);
      }

      if (signatures.length > 0) {
        this.lastSignature = signatures[0].signature;
      }
    } catch (error) {
      console.error('Error checking new transactions:', error);
    }
  }

  async checkMissedTransactions() {
    try {
      const signatures = await this.connection.getSignaturesForAddress(
        this.paymentAddress,
        { limit: 50 },
        'confirmed'
      );

      for (const { signature } of signatures) {
        const existing = await StakesDB.getStakeBySignature(signature);
        if (!existing) {
          await this.processTransaction(signature);
        }
      }
    } catch (error) {
      console.error('Error checking missed transactions:', error);
    }
  }

  async processTransaction(signature, attempt = 1) {
    try {
      const existing = await StakesDB.getStakeBySignature(signature);
      if (existing) return;

      const txInfo = await this.connection.getTransaction(signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0
      });

      if (!txInfo || txInfo.meta?.err) return;

      const postBalance = txInfo.meta.postTokenBalances?.find(
        balance => balance.owner === this.paymentAddress.toString() &&
                  balance.mint === this.mintAddress.toString()
      );

      const preBalance = txInfo.meta.preTokenBalances?.find(
        balance => balance.owner === this.paymentAddress.toString() &&
                  balance.mint === this.mintAddress.toString()
      );

      if (!postBalance || !preBalance) return;

      const amount = postBalance.uiTokenAmount.uiAmount - preBalance.uiTokenAmount.uiAmount;
      if (amount <= 0) return;

      const walletAddress = txInfo.transaction.message.staticAccountKeys[0].toString();

      await StakeService.recordStake({
        walletAddress,
        amount: Math.abs(amount),
        signature
      });

      console.log('Recorded stake:', {
        walletAddress,
        amount: Math.abs(amount),
        signature
      });
    } catch (error) {
      console.error(`Error processing transaction (attempt ${attempt}):`, error);
      
      if (attempt < this.maxRetries) {
        const delay = this.baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.processTransaction(signature, attempt + 1);
      }
    }
  }

  stop() {
    if (this.subscriptionId) {
      this.connection.removeAccountChangeListener(this.subscriptionId);
      this.subscriptionId = null;
      console.log('Stake monitoring stopped');
    }
  }
}