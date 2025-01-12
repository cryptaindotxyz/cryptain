import { verifySignature } from '../../shared/messageSigningUtils.js';

export function verifyMessageSignature(req, res, next) {
  const { signature, publicKey, message, walletAddress } = req.body;

  if (!signature || !publicKey || !message || !walletAddress) {
    return res.status(400).json({ 
      error: 'Missing signature verification data' 
    });
  }

  // Verify the signer is the wallet owner
  if (publicKey !== walletAddress) {
    return res.status(403).json({ 
      error: 'Signature must be from wallet owner' 
    });
  }

  // Verify signature
  const isValid = verifySignature(message, signature, publicKey);
  if (!isValid) {
    return res.status(403).json({ 
      error: 'Invalid signature' 
    });
  }

  // Verify message timestamp (prevent replay attacks)
  const messageData = JSON.parse(message);
  const messageAge = Date.now() - messageData.timestamp;
  if (messageAge > 5 * 60 * 1000) { // 5 minutes
    return res.status(403).json({ 
      error: 'Message expired' 
    });
  }

  next();
}