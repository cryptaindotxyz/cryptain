import { StakeMonitor } from './StakeMonitor.js';
import { TokenProfileMonitor } from './TokenProfileMonitor.js';
import { TelegramMonitor } from './TelegramMonitor.js';

export const stakeMonitor = new StakeMonitor();
export const tokenProfileMonitor = new TokenProfileMonitor();
export const telegramMonitor = new TelegramMonitor('https://t.me/s/newlistingsfeed');