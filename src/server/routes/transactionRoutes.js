import express from 'express';
import { verifyMessageSignature } from '../middleware/signatureVerification.js';
import { TransactionProcessor } from '../services/transaction/TransactionProcessor.js';
import { validateAddress } from '../utils/solana.js';

const router = express.Router();

// Prepare transaction route
router.post('/prepare', async (req, res) => {
  try {
    const { walletAddress, amount } = req.body;
    
    if (!walletAddress || !amount) {
      return res.status(400).json({ 
        error: 'Wallet address and amount are required' 
      });
    }

    if (!validateAddress(walletAddress)) {
      return res.status(400).json({
        error: 'Invalid wallet address format'
      });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        error: 'Amount must be a positive number'
      });
    }

    const serializedTransaction = await TransactionProcessor.prepareStakeTransaction(
      walletAddress,
      parsedAmount
    );
    
    res.json({ 
      serializedTransaction: serializedTransaction.toString('base64')
    });
  } catch (error) {
    console.error('Error preparing transaction:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verify transaction route
router.post('/verify', async (req, res) => {
  try {
    const { signature, walletAddress } = req.body;
    
    if (!signature || !walletAddress) {
      return res.status(400).json({ 
        error: 'Transaction signature and wallet address are required' 
      });
    }

    if (!validateAddress(walletAddress)) {
      return res.status(400).json({
        error: 'Invalid wallet address format'
      });
    }

    const result = await TransactionProcessor.processTransaction(
      signature,
      walletAddress
    );

    res.json(result);
  } catch (error) {
    console.error('Error processing transaction:', error);
    res.status(500).json({ error: error.message });
  }
});

// Protected routes that require signature verification
router.post('/unstakes', verifyMessageSignature);
router.delete('/unstakes/:walletAddress', verifyMessageSignature);
router.post('/votes', verifyMessageSignature);

export default router;