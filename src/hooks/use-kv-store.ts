import { useState, useEffect, useCallback } from 'react';

// Global keys that should NOT be prefixed with adminId
const GLOBAL_KEYS = ['authSession', 'supplierSession', 'currentUserRole', 'data-migration-completed'];

// Custom KV store hook that uses Vercel API (which connects to Supabase via Prisma)
// Automatically prefixes keys with adminId for multi-tenancy isolation (except global keys)
export function useKV<T>(
  key: string, 
  initialValue: T,
  adminId?: string | null
): [T, (value: T | ((prev: T) => T)) => Promise<void>] {
  // Determine the actual key to use
  const actualKey = adminId && !GLOBAL_KEYS.includes(key) 
    ? `${adminId}_${key}` 
    : key;
    
  const [state, setState] = useState<T>(initialValue);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Load initial value from API only once
  useEffect(() => {
    if (hasLoaded) return;
    
    const loadValue = async () => {
      try {
        const response = await fetch(`/api/kv/${actualKey}`);
        if (response.ok) {
          const data = await response.json();
          setState(data.value);
        }
      } catch (error) {
        console.warn(`Failed to load KV key: ${actualKey}`, error);
      } finally {
        setHasLoaded(true);
      }
    };

    loadValue();
  }, [actualKey, hasLoaded]);

  // Update value via API
  const setValue = useCallback(async (newValue: T | ((prev: T) => T)) => {
    // Use functional update to get current state
    setState((currentState) => {
      const valueToSet = typeof newValue === 'function' 
        ? (newValue as (prev: T) => T)(currentState) 
        : newValue;
      
      // Save via API (don't await to avoid blocking)
      fetch(`/api/kv/${actualKey}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value: valueToSet }),
      }).catch((error) => {
        console.warn(`Failed to update KV key: ${actualKey}`, error);
      });

      return valueToSet;
    });
  }, [actualKey]);

  return [state, setValue];
}
