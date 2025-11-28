import { useState, useEffect, useCallback } from 'react';

// Custom KV store hook that uses Vercel API (which connects to Supabase via Prisma)
export function useKV<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => Promise<void>] {
  const [state, setState] = useState<T>(initialValue);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Load initial value from API only once
  useEffect(() => {
    if (hasLoaded) return;
    
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
        setHasLoaded(true);
      }
    };

    loadValue();
  }, [key, hasLoaded]);

  // Update value via API
  const setValue = useCallback(async (newValue: T | ((prev: T) => T)) => {
    // Use functional update to get current state
    setState((currentState) => {
      const valueToSet = typeof newValue === 'function' 
        ? (newValue as (prev: T) => T)(currentState) 
        : newValue;
      
      // Save via API (don't await to avoid blocking)
      fetch(`/api/kv/${key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value: valueToSet }),
      }).catch((error) => {
        console.warn(`Failed to update KV key: ${key}`, error);
      });

      return valueToSet;
    });
  }, [key]);

  return [state, setValue];
}
