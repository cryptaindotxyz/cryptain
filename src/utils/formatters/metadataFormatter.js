/**
 * Formats metadata into a readable string
 */
export function formatMetadata(metadata) {
  return `Fetching metadata... RESULT: ${metadata.website || 'No website'} / ` +
         `${metadata.twitter || 'No X'} / ` +
         `${metadata.telegram || 'No Telegram'}`;
}