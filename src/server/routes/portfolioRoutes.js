import express from 'express';
import { PortfolioDB } from '../db/portfolio.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const portfolio = await PortfolioDB.getLatestSnapshot();
    if (!portfolio) {
      return res.status(404).json({ error: 'No portfolio data available' });
    }
    res.json(portfolio);
  } catch (error) {
    console.error('No tokens found in portfolio.', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;