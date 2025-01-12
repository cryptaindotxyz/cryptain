/**
 * Formats token metadata into readable strings
 */
export function formatMetadata(metadata) {
  if (!metadata) return [];

  const messages = [];
  
  // Website info
  messages.push('Getting website...');
  messages.push(metadata.website || 'Not found');
  
  // Social media info
  messages.push('Getting socials...');
  messages.push(`X: ${metadata.twitter || 'Not found'}`);
  messages.push(`Telegram: ${metadata.telegram || 'Not found'}`);
  
  return messages;
}