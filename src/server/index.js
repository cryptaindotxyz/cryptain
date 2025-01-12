import express from 'express';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import os from 'os';
import cluster from 'cluster';
import { SERVER_PORT } from './config/constants.js';
import { dbService } from './db/database.js';
import tokenRoutes from './routes/tokenRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import stakesRoutes from './routes/stakesRoutes.js';
import { VoteService } from './services/vote/VoteService.js';
import { stakeMonitor, tokenProfileMonitor, telegramMonitor } from './services/monitoring/index.js';
import portfolioRoutes from './routes/portfolioRoutes.js';
import { PortfolioMonitor } from './services/monitoring/PortfolioMonitor.js';

// Configure environment variables
dotenv.config();

// Set up file paths
const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = join(__dirname, '../../dist');

async function initializeMonitors() {
  console.log('Initializing monitoring services...');
  
  try {
    // Start all monitors concurrently
    await Promise.all([
      stakeMonitor.start(),
      tokenProfileMonitor.start(),
      telegramMonitor.start(),
      new PortfolioMonitor().start()
    ]);
    
    console.log('All monitoring services started successfully');
  } catch (error) {
    console.error('Failed to initialize monitoring services:', error);
    throw error;
  }
}

function setupMiddleware(app) {
  app.use(express.json());
  app.use(express.static(DIST_DIR));
}

function setupRoutes(app) {
  // API Routes
  app.use('/api/tokens', tokenRoutes);
  app.use('/api/transactions', transactionRoutes);
  app.use('/api/stakes', stakesRoutes);
  app.use('/api/portfolio', portfolioRoutes);

  // Vote endpoints
  app.get('/api/votes/logs', async (req, res) => {
    try {
      const logs = await VoteService.getVoteLogs();
      res.json(logs || []);
    } catch (error) {
      console.error('Error getting vote logs:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/votes/last/:walletAddress', async (req, res) => {
    try {
      const vote = await VoteService.getLastVote(req.params.walletAddress);
      res.json(vote || null);
    } catch (error) {
      console.error('Error getting last vote:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/votes/rankings', async (req, res) => {
    try {
      const rankings = await VoteService.getRankings();
      res.json(rankings || []);
    } catch (error) {
      console.error('Error getting vote rankings:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/votes', async (req, res) => {
    try {
      if (!req.body.walletAddress || !req.body.tokenAddress) {
        return res.status(400).json({ error: 'Wallet address and token address are required' });
      }
      const result = await VoteService.submitVote(req.body);
      res.json(result);
    } catch (error) {
      console.error('Error submitting vote:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // SPA support - serve index.html for all other routes
  app.get('*', (req, res) => {
    res.sendFile(join(DIST_DIR, 'index.html'));
  });
}

function setupErrorHandling(app) {
  app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  });
}

function setupShutdownHandlers() {
  process.on('SIGINT', async () => {
    console.log('Shutting down...');
    if (process.env.PM2_PROCESS_TYPE === 'monitor') {
      stakeMonitor.stop();
      tokenProfileMonitor.stop();
      telegramMonitor.stop();
    }
    await dbService.close();
    process.exit(0);
  });

  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (error) => {
    console.error('Unhandled rejection:', error);
    process.exit(1);
  });
}

// Check process type from PM2 environment variable
if (process.env.PM2_PROCESS_TYPE === 'monitor') {
  console.log('Starting monitor process...');
  
  // Initialize database and start monitors
  dbService.init()
    .then(() => {
      console.log('Monitor process database initialized');
      return initializeMonitors();
    })
    .catch(error => {
      console.error('Monitor process initialization failed:', error);
      process.exit(1);
    });
} else if (cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  console.log(`Primary ${process.pid} is running`);

  // Initialize database for primary
  dbService.init()
    .then(() => {
      console.log('Primary process database initialized');
      console.log(`Starting ${numCPUs} workers...`);
      for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
      }
    })
    .catch(error => {
      console.error('Primary process initialization failed:', error);
      process.exit(1);
    });

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died (${signal || code}). Restarting...`);
    cluster.fork();
  });

  cluster.on('online', (worker) => {
    console.log(`Worker ${worker.process.pid} is online`);
  });
} else {
  // Workers only need database initialization
  const app = express();

  try {
    await dbService.init();
    console.log(`Worker ${process.pid} database initialized`);

    setupMiddleware(app);
    setupRoutes(app);
    setupErrorHandling(app);
    setupShutdownHandlers();

    app.listen(SERVER_PORT, () => {
      console.log(`Worker ${process.pid} listening on port ${SERVER_PORT}`);
      // Signal ready to PM2
      if (process.send) {
        process.send('ready');
      }
    });
  } catch (error) {
    console.error(`Worker ${process.pid} failed to start:`, error);
    process.exit(1);
  }
}