import { formatAnalysisData } from './analysisFormatter.js';
import { formatMetadata } from './metadataFormatter.js';

/**
 * Formats log messages consistently
 */
export function formatLogMessages(voteData, validation, metadata) {
  const shortAddress = `${voteData.walletAddress.slice(0, 4)}...${voteData.walletAddress.slice(-4)}`;
  const tokenInfo = validation.tokenInfo;
  const tokenAddress = voteData.tokenAddress;

  const messages = [
    // Vote message
    `${shortAddress} has cast votes for ${tokenInfo.name} (${tokenInfo.symbol})`,
    
    // Analysis message with token info only
    `Analyzing token ${tokenInfo.name} (${tokenInfo.symbol}) - ${tokenAddress}`
  ];

  // Add analysis data if available
  const analysisStr = formatAnalysisData(validation.analysisData);
  if (analysisStr) {
    messages.push(analysisStr);
  }

  // Add metadata if available
  if (metadata) {
    messages.push(formatMetadata(metadata));
  }

  return messages.filter(msg => msg && msg.trim() !== '');
}