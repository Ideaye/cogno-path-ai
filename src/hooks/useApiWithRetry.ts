import { useState } from 'react';
import { toast } from 'sonner';

interface RetryOptions {
  maxRetries?: number;
  backoffMs?: number;
  onError?: (error: Error) => void;
}

export function useApiWithRetry() {
  const [loading, setLoading] = useState(false);

  async function execute<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T | null> {
    const { maxRetries = 3, backoffMs = 1000, onError } = options;
    setLoading(true);

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await fn();
        setLoading(false);
        return result;
      } catch (error) {
        lastError = error as Error;
        const isServerError = 
          error instanceof Error && 
          (error.message.includes('500') || error.message.includes('network'));

        if (attempt < maxRetries - 1 && isServerError) {
          // Wait with exponential backoff
          await new Promise(resolve => 
            setTimeout(resolve, backoffMs * Math.pow(2, attempt))
          );
          console.log(`Retry attempt ${attempt + 1}/${maxRetries}`);
        } else {
          break;
        }
      }
    }

    setLoading(false);
    
    if (lastError) {
      if (onError) {
        onError(lastError);
      } else {
        toast.error('Operation failed', {
          description: lastError.message,
          action: {
            label: 'Retry',
            onClick: () => execute(fn, options),
          },
        });
      }
    }

    return null;
  }

  return { execute, loading };
}
