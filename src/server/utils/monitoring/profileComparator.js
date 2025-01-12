/**
 * Utility for comparing token profiles and determining changes
 */
export class ProfileComparator {
  static isNewProfile(profile, existingProfiles) {
    return !existingProfiles.some(p => p.token_address === profile.tokenAddress);
  }

  static extractLinks(profile) {
    const links = profile.links || [];
    return {
      website: links.find(l => l.label === 'Website')?.url,
      twitter: links.find(l => l.type === 'twitter')?.url,
      telegram: links.find(l => l.type === 'telegram')?.url
    };
  }
}