import { useState, useEffect, useCallback } from 'react';

// Custom KV store hook that uses Vercel API (which connects to Supabase via Prisma)
export function useKV<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => Promise<void>] {
  const [state, setState] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial value from API
  useEffect(() => {
    const loadValue = async () => {
      try {
        const response = await fetch(`/api/kv/${key}`);
        if (response.ok) {
          const data = await response.json();
          setState(data.value);
        }
      } catch (error) {
        console.warn(`Failed to load KV key: ${key}`, error);
      } finally {
        setIsLoading(false);
      }
    };

    loadValue();
  }, [key]);

  // Update value via API
  const setValue = useCallback(async (newValue: T | ((prev: T) => T)) => {
    // Support both direct value and updater function
    const valueToSet = typeof newValue === 'function' 
      ? (newValue as (prev: T) => T)(state) 
      : newValue;
    
    setState(valueToSet);

    // Save via API
    try {
      const response = await fetch(`/api/kv/${key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value: valueToSet }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.warn(`API update failed for ${key}:`, error);
      }
    } catch (error) {
      console.warn(`Failed to update KV key: ${key}`, error);
    }
  }, [key, state]);

  return [state, setValue];
}
