import { VotesDB } from '../../../db/votes.js';
import { LogsDB } from '../../../db/logs.js';
import { TokenInfoService } from '../../TokenInfoService.js';
import { CONFIG } from '../../../config/constants.js';

export class LogAnalyzer {
  constructor() {
    this.minVotesThreshold = CONFIG.MIN_VOTES_THRESHOLD || 3;
    this.minStakeThreshold = CONFIG.MIN_STAKE_THRESHOLD || 10000;
    this.timeWindow = CONFIG.ANALYSIS_TIME_WINDOW || 24 * 60 * 60 * 1000; // 24 hours
  }

  async analyzeVotingActivity() {
    try {
      // Get recent votes and logs
      const [votes, logs] = await Promise.all([
        VotesDB.getVoteLogs(100),
        LogsDB.getLogs(100)
      ]);

      // Group votes by token
      const votesByToken = this.groupVotesByToken(votes);
      
      // Analyze each token's voting activity
      const signals = await Promise.all(
        Object.entries(votesByToken).map(([tokenAddress, votes]) =>
          this.analyzeTokenVotes(tokenAddress, votes, logs)
        )
      );

      // Filter out null signals and sort by strength
      return signals
        .filter(signal => signal && signal.strength > 0.6)
        .sort((a, b) => b.strength - a.strength);
    } catch (error) {
      console.error('Vote analysis failed:', error);
      return [];
    }
  }

  groupVotesByToken(votes) {
    return votes.reduce((groups, vote) => {
      if (!groups[vote.token_address]) {
        groups[vote.token_address] = [];
      }
      groups[vote.token_address].push(vote);
      return groups;
    }, {});
  }

  async analyzeTokenVotes(tokenAddress, votes, logs) {
    try {
      // Filter recent votes
      const recentVotes = this.filterRecentActivity(votes);
      if (recentVotes.length < this.minVotesThreshold) {
        return null;
      }

      // Calculate total staked amount in votes
      const totalStaked = recentVotes.reduce((sum, vote) => 
        sum + vote.staked_amount, 0
      );
      
      if (totalStaked < this.minStakeThreshold) {
        return null;
      }

      // Get token info
      const tokenInfo = await TokenInfoService.getTokenInfo(tokenAddress);
      if (!tokenInfo) {
        return null;
      }

      // Analyze vote patterns
      const voteAnalysis = this.analyzeVotePatterns(recentVotes);
      
      // Analyze related logs
      const logAnalysis = this.analyzeRelatedLogs(
        tokenAddress,
        logs,
        recentVotes[0].timestamp
      );

      // Calculate signal strength
      const strength = this.calculateSignalStrength(
        voteAnalysis,
        logAnalysis,
        totalStaked
      );

      return {
        tokenAddress,
        tokenInfo,
        strength,
        metrics: {
          votes: recentVotes.length,
          totalStaked,
          averageStake: totalStaked / recentVotes.length,
          voteVelocity: this.calculateVoteVelocity(recentVotes),
          stakeConcentration: this.calculateStakeConcentration(recentVotes)
        },
        analysis: {
          votes: voteAnalysis,
          logs: logAnalysis
        },
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Token vote analysis failed:', error);
      return null;
    }
  }

  filterRecentActivity(activities) {
    const cutoff = Date.now() - this.timeWindow;
    return activities.filter(activity => 
      new Date(activity.timestamp).getTime() > cutoff
    );
  }

  analyzeVotePatterns(votes) {
    const timeIntervals = [];
    const stakeChanges = [];
    
    for (let i = 1; i < votes.length; i++) {
      const interval = new Date(votes[i].timestamp) - new Date(votes[i-1].timestamp);
      timeIntervals.push(interval);
      
      const stakeChange = votes[i].staked_amount - votes[i-1].staked_amount;
      stakeChanges.push(stakeChange);
    }

    return {
      averageInterval: this.calculateAverage(timeIntervals),
      intervalVariance: this.calculateVariance(timeIntervals),
      stakeGrowth: this.calculateGrowthRate(stakeChanges),
      consistency: this.calculateConsistency(votes)
    };
  }

  analyzeRelatedLogs(tokenAddress, logs, since) {
    const relevantLogs = logs.filter(log => {
      const isRecent = new Date(log.timestamp) >= new Date(since);
      const isRelevant = log.message.includes(tokenAddress) ||
                        (log.data && log.data.includes(tokenAddress));
      return isRecent && isRelevant;
    });

    return {
      mentionCount: relevantLogs.length,
      sentiment: this.analyzeSentiment(relevantLogs),
      analysisResults: this.extractAnalysisResults(relevantLogs)
    };
  }

  calculateSignalStrength(voteAnalysis, logAnalysis, totalStaked) {
    const weights = {
      voteConsistency: 0.3,
      stakeGrowth: 0.2,
      logSentiment: 0.2,
      analysisResults: 0.3
    };

    const scores = {
      voteConsistency: voteAnalysis.consistency,
      stakeGrowth: Math.min(voteAnalysis.stakeGrowth / 100000, 1),
      logSentiment: (logAnalysis.sentiment + 1) / 2,
      analysisResults: this.normalizeAnalysisScore(logAnalysis.analysisResults)
    };

    return Object.entries(weights).reduce((strength, [factor, weight]) => 
      strength + (scores[factor] * weight), 0
    );
  }

  calculateVoteVelocity(votes) {
    if (votes.length < 2) return 0;
    
    const timeSpan = new Date(votes[0].timestamp) - new Date(votes[votes.length-1].timestamp);
    return votes.length / (timeSpan / (60 * 60 * 1000)); // Votes per hour
  }

  calculateStakeConcentration(votes) {
    const uniqueVoters = new Set(votes.map(v => v.wallet_address)).size;
    return votes.length / uniqueVoters;
  }

  calculateConsistency(votes) {
    if (votes.length < 2) return 0;

    const intervals = [];
    for (let i = 1; i < votes.length; i++) {
      intervals.push(new Date(votes[i].timestamp) - new Date(votes[i-1].timestamp));
    }

    const avgInterval = this.calculateAverage(intervals);
    const variance = this.calculateVariance(intervals);
    
    return 1 - (Math.sqrt(variance) / avgInterval);
  }

  analyzeSentiment(logs) {
    let sentiment = 0;
    
    for (const log of logs) {
      if (log.type === 'analysis') {
        try {
          const data = JSON.parse(log.data);
          sentiment += this.extractSentimentFromAnalysis(data);
        } catch (error) {
          console.error('Failed to parse analysis data:', error);
        }
      }
    }

    return logs.length > 0 ? sentiment / logs.length : 0;
  }

  extractAnalysisResults(logs) {
    const results = [];
    
    for (const log of logs) {
      if (log.type === 'analysis' && log.data) {
        try {
          const data = JSON.parse(log.data);
          results.push({
            price: data.price,
            liquidity: data.liquidity,
            volume24h: data.volume24h,
            fdv: data.fdv
          });
        } catch (error) {
          console.error('Failed to parse analysis data:', error);
        }
      }
    }

    return results;
  }

  normalizeAnalysisScore(results) {
    if (results.length === 0) return 0;

    const scores = results.map(result => {
      const liquidityScore = Math.min(result.liquidity / 1000000, 1);
      const volumeScore = Math.min(result.volume24h / result.liquidity, 1);
      const fdvScore = Math.min(1000000 / result.fdv, 1);
      
      return (liquidityScore * 0.4) + (volumeScore * 0.4) + (fdvScore * 0.2);
    });

    return this.calculateAverage(scores);
  }

  extractSentimentFromAnalysis(data) {
    const priceChange = data.priceChange24h || 0;
    const volumeGrowth = data.volumeGrowth || 0;
    const liquidityGrowth = data.liquidityGrowth || 0;

    return (
      (Math.sign(priceChange) * Math.min(Math.abs(priceChange) / 10, 1) * 0.4) +
      (Math.sign(volumeGrowth) * Math.min(Math.abs(volumeGrowth) / 100, 1) * 0.3) +
      (Math.sign(liquidityGrowth) * Math.min(Math.abs(liquidityGrowth) / 50, 1) * 0.3)
    );
  }

  calculateAverage(numbers) {
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }

  calculateVariance(numbers) {
    const avg = this.calculateAverage(numbers);
    return this.calculateAverage(numbers.map(num => Math.pow(num - avg, 2)));
  }

  calculateGrowthRate(changes) {
    return changes.reduce((sum, change) => sum + Math.max(0, change), 0);
  }
}