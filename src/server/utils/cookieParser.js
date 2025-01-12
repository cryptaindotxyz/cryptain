/**
 * Parses Twitter cookies from various formats into the format required by Puppeteer
 */
export class CookieParser {
  static parse(cookieString) {
    if (!cookieString) {
      throw new Error('No cookies provided');
    }

    try {
      // If it's already a JSON array, try to parse it directly
      if (cookieString.trim().startsWith('[')) {
        return JSON.parse(cookieString);
      }

      // If it's a single auth token, format it properly
      return [{
        name: 'auth_token',
        value: cookieString.trim(),
        domain: '.twitter.com',
        path: '/'
      }];
    } catch (error) {
      throw new Error(`Failed to parse cookies: ${error.message}`);
    }
  }
}