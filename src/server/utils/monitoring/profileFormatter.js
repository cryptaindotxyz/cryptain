/**
 * Formats token profile data for logging
 */
export class ProfileFormatter {
  static formatProfileMessage(profile, links) {
    const linkStrings = [];
    if (links.website) linkStrings.push(`Website: ${links.website}`);
    if (links.twitter) linkStrings.push(`X: ${links.twitter}`);
    if (links.telegram) linkStrings.push(`Telegram: ${links.telegram}`);

    return `New token profile: ` +
           `(${profile.tokenAddress}) ` +
           `${linkStrings.length > 0 ? '| ' + linkStrings.join(' | ') : ''}`;
  }

  static formatAnalysisMessage(tokenName, analysis) {
    // Return null to skip this message
    return null;
  }
}