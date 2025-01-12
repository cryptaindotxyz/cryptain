import { Connection } from '@solana/web3.js';
import { CONFIG } from '../config/constants.js';

class SolanaConnectionManager {
  constructor() {
    this.connection = null;
  }

  getConnection() {
    if (!this.connection) {
      const connectionConfig = {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000,
        disableRetryOnRateLimit: false
      };

      // Add WebSocket endpoint if available
      if (CONFIG.SOLANA_WS_URL) {
        connectionConfig.wsEndpoint = CONFIG.SOLANA_WS_URL;
        console.log('Using WebSocket endpoint:', CONFIG.SOLANA_WS_URL);
      }

      console.log('Creating new Solana connection with config:', {
        ...connectionConfig,
        rpcUrl: CONFIG.SOLANA_RPC_URL
      });

      this.connection = new Connection(CONFIG.SOLANA_RPC_URL, connectionConfig);

      // Test connection
      this.connection.getSlot()
        .then(slot => console.log('Connected to Solana network, current slot:', slot))
        .catch(err => console.error('Solana connection error:', err));
    }

    return this.connection;
  }

  resetConnection() {
    if (this.connection) {
      console.log('Resetting Solana connection...');
      this.connection = null;
    }
    return this.getConnection();
  }
}

export const solanaConnection = new SolanaConnectionManager();