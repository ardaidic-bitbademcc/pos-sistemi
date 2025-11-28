import { useState, useEffect, useCallback } from 'react';

// Global keys that should NOT be prefixed with adminId
const GLOBAL_KEYS = [
  'authSession', 
  'supplierSession', 
  'currentUserRole', 
  'data-migration-completed',
  'b2b-suppliers', // Tedarikçiler global - tüm adminler için ortak
  'admins' // Admin kayıtları global
];

// Keys that should be synced to database
const DB_SYNC_KEYS = ['products', 'sales', 'employees', 'branches', 'categories'];

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
      
      // Save to KV storage
      fetch(`/api/kv/${actualKey}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value: valueToSet }),
      }).catch((error) => {
        console.warn(`Failed to update KV key: ${actualKey}`, error);
      });

      // Sync to database if needed
      if (DB_SYNC_KEYS.includes(key) && adminId) {
        syncToDatabase(key, valueToSet, adminId);
      }

      return valueToSet;
    });
  }, [actualKey, key, adminId]);

  return [state, setValue];
}

// Sync data to database
async function syncToDatabase(key: string, value: any, adminId: string) {
  try {
    const endpoint = `/api/${key}`;
    
    // For arrays, sync each item
    if (Array.isArray(value)) {
      // We'll do a simple bulk sync - send all items
      // The API will handle create/update logic
      await fetch(`${endpoint}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          adminId,
          items: value 
        }),
      }).catch(err => console.warn(`DB sync failed for ${key}:`, err));
    }
  } catch (error) {
    console.warn(`Database sync failed for key: ${key}`, error);
  }
}
