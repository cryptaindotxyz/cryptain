import { LogAnalyzer } from './analysis/LogAnalyzer.js';
import { SignalProcessor } from './SignalProcessor.js';
import { CONFIG } from '../../config/constants.js';

export class SignalGenerator {
  constructor() {
    this.logAnalyzer = new LogAnalyzer();
    this.signalProcessor = new SignalProcessor();
    this.analysisInterval = CONFIG.ANALYSIS_INTERVAL || 5 * 60 * 1000; // 5 minutes
    this.minSignalStrength = CONFIG.MIN_SIGNAL_STRENGTH || 0.7;
    this.intervalId = null;
  }

  async start() {
    if (this.intervalId) return;

    console.log('Starting signal generation...');
    await this.generateSignals();
    
    this.intervalId = setInterval(
      () => this.generateSignals(),
      this.analysisInterval
    );
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Signal generation stopped');
    }
  }

  async generateSignals() {
    try {
      // Analyze voting activity
      const votingSignals = await this.logAnalyzer.analyzeVotingActivity();
      
      // Filter and process strong signals
      for (const signal of votingSignals) {
        if (signal.strength >= this.minSignalStrength) {
          await this.processSignal(signal);
        }
      }
    } catch (error) {
      console.error('Signal generation failed:', error);
    }
  }

  async processSignal(signal) {
    try {
      const tradingSignal = {
        tokenAddress: signal.tokenAddress,
        strength: signal.strength,
        metrics: signal.metrics,
        analysis: signal.analysis,
        socialData: {
          mentions: signal.analysis.logs.mentionCount,
          sentiment: signal.analysis.logs.sentiment,
          volume: signal.metrics.voteVelocity
        },
        timestamp: Date.now()
      };

      await this.signalProcessor.processNewSignal(tradingSignal);
    } catch (error) {
      console.error('Signal processing failed:', error);
    }
  }
}