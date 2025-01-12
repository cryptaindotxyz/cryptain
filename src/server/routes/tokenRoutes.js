import express from 'express';
import { TokenValidationService } from '../services/TokenValidationService.js';

const router = express.Router();

router.get('/validate/:address', async (req, res) => {
  try {
    const result = await TokenValidationService.validateToken(req.params.address);
    res.json(result);
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;