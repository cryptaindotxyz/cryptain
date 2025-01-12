import { CONFIG } from '../../config/constants.js';
import { PortfolioDB } from '../../db/portfolio.js';
import { MoralisClient } from '../moralis/MoralisClient.js';
import { PortfolioDataTransformer } from '../portfolio/PortfolioDataTransformer.js';
import cluster from 'cluster';

export class PortfolioMonitor {
  constructor() {
    this.intervalId = null;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.baseDelay = 5000;
    this.updateInterval = 5 * 60 * 1000; // 5 minutes
  }

  async start() {
    // Only run monitoring on primary process
    if (!cluster.isPrimary) {
      console.log('Portfolio monitoring skipped on worker process');
      return;
    }

    if (this.intervalId) return;

    try {
      await PortfolioDB.init();
      await this.updatePortfolio();
      
      this.intervalId = setInterval(() => this.updatePortfolio(), this.updateInterval);
      
      console.log('Portfolio monitoring started on primary process');
    } catch (error) {
      console.error('Failed to start portfolio monitoring:', error);
      // Don't throw error to prevent server startup failure
      console.log('Portfolio monitoring will retry on next interval');
    }
  }

  async fetchPortfolioWithRetry(attempt = 1) {
    try {
      console.log(`Fetching portfolio data (attempt ${attempt}/${this.maxRetries})...`);
      const portfolioData = await MoralisClient.getPortfolio(CONFIG.PAYMENT_ADDRESS);
      
      // Skip update if no tokens
      if (!portfolioData.tokens || portfolioData.tokens.length === 0) {
        console.log('No tokens found in portfolio');
        return null;
      }

      return portfolioData;
    } catch (error) {
      console.error(`Portfolio fetch attempt ${attempt} failed:`, error);
      
      if (attempt < this.maxRetries) {
        const delay = this.baseDelay * Math.pow(2, attempt - 1);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchPortfolioWithRetry(attempt + 1);
      }
      
      throw error;
    }
  }

  async fetchPricesWithRetry(tokens, attempt = 1) {
    const prices = {};
    
    for (const token of tokens) {
      try {
        prices[token.mint] = await MoralisClient.getTokenPrice(token.mint);
      } catch (error) {
        console.error(`Failed to fetch price for token ${token.mint} (attempt ${attempt}):`, error);
        
        if (attempt < this.maxRetries) {
          const delay = this.baseDelay * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
          try {
            prices[token.mint] = await MoralisClient.getTokenPrice(token.mint);
          } catch (retryError) {
            console.warn(`Price fetch retry failed for token ${token.mint}:`, retryError);
            prices[token.mint] = 0;
          }
        } else {
          console.warn(`Max retries reached for token ${token.mint}, setting price to 0`);
          prices[token.mint] = 0;
        }
      }
    }

    return prices;
  }

  async updatePortfolio() {
    try {
      console.log('Updating portfolio data...');
      
      // Get portfolio data with retries
      const portfolioData = await this.fetchPortfolioWithRetry();
      if (!portfolioData) return;
      
      // Get prices for all tokens with retries
      const prices = await this.fetchPricesWithRetry(portfolioData.tokens);

      // Transform data
      const transformedData = await PortfolioDataTransformer.transformPortfolioData(
        portfolioData,
        prices
      );

      // Save to database
      await PortfolioDB.saveSnapshot(CONFIG.PAYMENT_ADDRESS, transformedData);
      console.log('Portfolio data updated successfully');
    } catch (error) {
      console.error('Error updating portfolio:', {
        error: error.message,
        stack: error.stack,
        retryCount: error.retryCount
      });
      // Error is logged but not thrown to prevent crashing
    }
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Portfolio monitoring stopped');
    }
  }
}