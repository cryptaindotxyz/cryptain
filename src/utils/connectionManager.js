import { Connection } from '@solana/web3.js';
import { CONFIG } from './config';

class ConnectionManager {
  constructor() {
    this._connection = null;
    this._lastUsed = 0;
    this._connectionTimeout = 5 * 60 * 1000; // 5 minutes
  }

  getConnection() {
    const now = Date.now();

    // Create new connection if none exists or if the existing one has timed out
    if (!this._connection || (now - this._lastUsed > this._connectionTimeout)) {
      const config = {
        commitment: 'confirmed',
        disableRetryOnRateLimit: true,
        confirmTransactionInitialTimeout: 60000
      };

      // Add WebSocket endpoint if available
      if (CONFIG.SOLANA_WS_URL) {
        config.wsEndpoint = CONFIG.SOLANA_WS_URL;
      }

      this._connection = new Connection(CONFIG.SOLANA_RPC_URL, config);
      
      // Silent connection test
      this._connection.getSlot().catch(() => {});
    }

    this._lastUsed = now;
    return this._connection;
  }
}

export const connectionManager = new ConnectionManager();