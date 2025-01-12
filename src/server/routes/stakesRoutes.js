import express from 'express';
import { StakeService } from '../services/StakeService.js';
import { verifyMessageSignature } from '../middleware/signatureVerification.js';

const router = express.Router();

// Get stake status for specific wallet
router.get('/status/:walletAddress', async (req, res) => {
  try {
    const result = await StakeService.getStakeInfo(req.params.walletAddress);
    res.json(result || { amount: 0 });
  } catch (error) {
    console.error('Error getting stake status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get total staked amount across all wallets
router.get('/total', async (req, res) => {
  try {
    const total = await StakeService.getTotalStaked();
    res.json({ total });
  } catch (error) {
    console.error('Error getting total staked:', error);
    res.status(500).json({ error: error.message });
  }
});

// Process unstake
router.post('/unstake', verifyMessageSignature, async (req, res) => {
  try {
    const { walletAddress, amount } = req.body;
    
    if (!walletAddress || !amount) {
      return res.status(400).json({ error: 'Wallet address and amount are required' });
    }

    const result = await StakeService.recordUnstake(walletAddress, amount);
    res.json(result);
  } catch (error) {
    console.error('Error processing unstake:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;