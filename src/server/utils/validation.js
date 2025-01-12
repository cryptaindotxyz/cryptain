export function validateTransactionParams(walletAddress, amount) {
  const errors = [];

  if (!walletAddress) {
    errors.push('Wallet address is required');
  }

  if (!amount) {
    errors.push('Amount is required');
  } else if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
    errors.push('Amount must be a positive number');
  }

  return {
    isValid: errors.length === 0,
    errors: errors.join(', ')
  };
}