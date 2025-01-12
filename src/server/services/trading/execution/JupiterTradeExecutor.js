import { Connection } from '@solana/web3.js';
import { Jupiter } from '@jup-ag/core';
import { CONFIG } from '../../../config/constants.js';

export class JupiterTradeExecutor {
  constructor(connection, wallet) {
    this.connection = connection;
    this.wallet = wallet;
    this.jupiter = null;
    this.initializeJupiter();
  }

  async initializeJupiter() {
    try {
      this.jupiter = await Jupiter.load({
        connection: this.connection,
        cluster: 'mainnet-beta',
        user: this.wallet,
        platformFeeAndAccounts: {
          feeBps: 5, // 0.05%
          feeAccounts: new Map()
        }
      });
      console.log('Jupiter initialized successfully');
    } catch (error) {
      console.error('Jupiter initialization failed:', error);
      throw error;
    }
  }

  async executeTrade(trade) {
    console.log('Executing trade via Jupiter:', trade);

    try {
      if (!this.jupiter) {
        await this.initializeJupiter();
      }

      const { tokenAddress, action, amount } = trade;

      // Get routes from Jupiter
      const routes = await this.jupiter.computeRoutes({
        inputMint: action === 'buy' ? CONFIG.USDC_MINT : tokenAddress,
        outputMint: action === 'buy' ? tokenAddress : CONFIG.USDC_MINT,
        amount,
        slippageBps: 50, // 0.5% slippage
        feeBps: 5 // 0.05% fee
      });

      if (!routes.routesInfos || routes.routesInfos.length === 0) {
        throw new Error('No routes found');
      }

      // Select best route
      const bestRoute = routes.routesInfos[0];
      console.log('Selected route:', {
        inAmount: bestRoute.inAmount,
        outAmount: bestRoute.outAmount,
        priceImpactPct: bestRoute.priceImpactPct
      });

      // Execute swap
      const { transactions } = await this.jupiter.exchange({
        routeInfo: bestRoute
      });

      // Sign and send transaction
      const signature = await this.signAndSendTransaction(transactions.swapTransaction);
      
      console.log('Trade executed successfully:', signature);
      return { 
        success: true, 
        signature,
        route: bestRoute
      };
    } catch (error) {
      console.error('Trade execution failed:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  async signAndSendTransaction(transaction) {
    // Add recent blockhash
    const { blockhash } = await this.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = this.wallet.publicKey;

    // Sign transaction
    transaction.sign(this.wallet);

    // Send transaction
    const signature = await this.connection.sendRawTransaction(
      transaction.serialize(),
      {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
        maxRetries: 3
      }
    );

    // Confirm transaction
    await this.connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight: await this.connection.getBlockHeight()
    });

    return signature;
  }

  async getQuote(inputMint, outputMint, amount) {
    try {
      if (!this.jupiter) {
        await this.initializeJupiter();
      }

      const routes = await this.jupiter.computeRoutes({
        inputMint,
        outputMint,
        amount,
        slippageBps: 50,
        feeBps: 5
      });

      if (!routes.routesInfos || routes.routesInfos.length === 0) {
        return null;
      }

      const bestRoute = routes.routesInfos[0];
      return {
        inAmount: bestRoute.inAmount,
        outAmount: bestRoute.outAmount,
        priceImpactPct: bestRoute.priceImpactPct,
        marketInfos: bestRoute.marketInfos
      };
    } catch (error) {
      console.error('Failed to get quote:', error);
      return null;
    }
  }
}