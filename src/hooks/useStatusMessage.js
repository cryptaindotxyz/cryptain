import { useState, useEffect } from 'react';

export function useStatusMessage(timeout = 3000) {
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let timer;
    if (status) {
      timer = setTimeout(() => {
        setStatus('');
      }, timeout);
    }
    return () => clearTimeout(timer);
  }, [status, timeout]);

  useEffect(() => {
    let timer;
    if (error) {
      timer = setTimeout(() => {
        setError('');
      }, timeout);
    }
    return () => clearTimeout(timer);
  }, [error, timeout]);

  return { status, setStatus, error, setError };
}