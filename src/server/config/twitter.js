/**
 * Twitter-specific configuration and constants
 */
export const TWITTER_CONFIG = {
  BASE_URL: 'https://x.com',
  NOTIFICATIONS_PATH: '/notifications',
  SELECTORS: {
    NOTIFICATION: '[data-testid="notification"]',
    PRIMARY_COLUMN: '[data-testid="primaryColumn"]',
    NOTIFICATION_TEXT: '.css-146c3p1',
    TWEET_TEXT: '[data-testid="tweetText"]'
  },
  TIMEOUTS: {
    NAVIGATION: 30000,
    ELEMENT_WAIT: 10000
  }
};