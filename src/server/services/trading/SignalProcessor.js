import { TradingAgent } from './TradingAgent.js';

export class SignalProcessor {
  constructor() {
    this.tradingAgent = new TradingAgent();
    this.processingEnabled = true;
  }

  async processNewSignal(signal) {
    if (!this.processingEnabled) {
      console.log('Signal processing is disabled');
      return;
    }

    try {
      console.log('New signal received:', {
        token: signal.tokenAddress,
        timestamp: new Date().toISOString()
      });

      // Validate signal
      if (!this.validateSignal(signal)) {
        console.log('Invalid signal, skipping');
        return;
      }

      // Process signal with trading agent
      await this.tradingAgent.processSignal(signal);
    } catch (error) {
      console.error('Error processing signal:', error);
    }
  }

  validateSignal(signal) {
    return (
      signal &&
      signal.tokenAddress &&
      signal.socialData &&
      typeof signal.socialData.mentions === 'number' &&
      typeof signal.socialData.sentiment === 'number' &&
      typeof signal.socialData.volume === 'number'
    );
  }

  enableProcessing() {
    this.processingEnabled = true;
    console.log('Signal processing enabled');
  }

  disableProcessing() {
    this.processingEnabled = false;
    console.log('Signal processing disabled');
  }
}