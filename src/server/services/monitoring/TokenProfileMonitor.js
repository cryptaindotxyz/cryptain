import { TokenProfilesDB } from '../../db/tokenProfiles.js';
import { LogsDB } from '../../db/logs.js';
import { TokenAnalyzer } from './TokenAnalyzer.js';
import { ProfileComparator } from '../../utils/monitoring/profileComparator.js';
import { ProfileFormatter } from '../../utils/monitoring/profileFormatter.js';
import cluster from 'cluster';

export class TokenProfileMonitor {
  constructor() {
    this.intervalId = null;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.baseDelay = 5000;
    this.checkInterval = 60000;
  }

  async start() {
    // Only run monitoring on primary process
    if (!cluster.isPrimary) {
      console.log('Token profile monitoring skipped on worker process');
      return;
    }

    if (this.intervalId) return;

    try {
      await TokenProfilesDB.init();
      await this.checkProfiles();
      this.intervalId = setInterval(() => this.checkProfiles(), this.checkInterval);
      console.log('Token profile monitoring started on primary process');
    } catch (error) {
      console.error('Failed to start token profile monitoring:', error);
      throw error;
    }
  }

  async fetchProfilesWithRetry(attempt = 1) {
    try {
      const response = await fetch('https://api.dexscreener.com/token-profiles/latest/v1');
      
      if (!response.ok) {
        const errorMessage = `HTTP error! status: ${response.status}`;
        console.log(`Failed to fetch profiles (attempt ${attempt}/${this.maxRetries}): ${errorMessage}`);
        
        if (attempt < this.maxRetries) {
          const delay = this.baseDelay * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.fetchProfilesWithRetry(attempt + 1);
        }
        
        throw new Error(`Failed to fetch profiles after ${attempt} attempts: ${errorMessage}`);
      }
      
      return await response.json();
    } catch (error) {
      if (attempt < this.maxRetries) {
        const delay = this.baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchProfilesWithRetry(attempt + 1);
      }
      
      throw error;
    }
  }

  async checkProfiles() {
    try {
      console.log('Checking token profiles...');
      const existingProfiles = await TokenProfilesDB.getAllProfiles();
      const profiles = await this.fetchProfilesWithRetry();
      
      if (!profiles || !Array.isArray(profiles)) {
        throw new Error('Invalid profiles data received');
      }

      const solanaProfiles = profiles.filter(p => p.chainId === 'solana');
      console.log(`Found ${solanaProfiles.length} Solana profiles`);
      
      for (const profile of solanaProfiles) {
        try {
          const isNew = ProfileComparator.isNewProfile(profile, existingProfiles);
          
          await TokenProfilesDB.upsertProfile(profile);

          if (isNew) {
            const logs = await this.createProfileLogs(profile);
            if (logs.length > 0) {
              await LogsDB.saveLogs(logs);
            }
          }
        } catch (error) {
          console.error('Error processing profile:', error);
          // Continue with next profile
          continue;
        }
      }
    } catch (error) {
      console.error('Error checking token profiles:', {
        error: error.message,
        stack: error.stack,
        retryCount: error.retryCount
      });
    }
  }

async createProfileLogs(profile) {
    const logs = [];
    try {
      const links = ProfileComparator.extractLinks(profile);

      const profileMessage = ProfileFormatter.formatProfileMessage(profile, links);
      if (profileMessage) {
        logs.push({
          type: 'token_profile',
          message: profileMessage,
          data: JSON.stringify(profile)
        });
      }

      // Only add analysis if we have valid data
      const analysis = await TokenAnalyzer.analyzeToken(profile.tokenAddress);
      if (analysis) {
        logs.push({
          type: 'analysis',
          message: `Analyzing token (${profile.tokenAddress})`,
          data: JSON.stringify(analysis)
        });
      }
    } catch (error) {
      console.error('Error creating profile logs:', error);
    }

    return logs.filter(log => log.message && log.message.trim() !== '');
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Token profile monitoring stopped');
    }
  }
}