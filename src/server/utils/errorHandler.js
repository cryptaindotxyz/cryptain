export class TransactionError extends Error {
  constructor(message, code = 'TRANSACTION_ERROR') {
    super(message);
    this.name = 'TransactionError';
    this.code = code;
  }
}

export function handleTransactionError(error) {
  console.error('Transaction error:', error);
  
  if (error instanceof TransactionError) {
    return error;
  }
  
  return new TransactionError(
    error.message || 'An unexpected error occurred',
    'INTERNAL_ERROR'
  );
}