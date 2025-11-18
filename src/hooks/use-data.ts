import { useState, useEffect, useCallback } from 'react';
import { getStorageAdapter } from '@/lib/storage';

/**
 * Universal data hook that works with both KV (localStorage) and Supabase
 * 
 * Usage (exactly like useKV):
 * const [data, setData] = useData<Employee[]>('employees', []);
 * 
 * The storage mode is controlled by VITE_STORAGE_MODE environment variable:
 * - 'kv': Uses localStorage (GitHub Spark KV)
 * - 'supabase': Uses Supabase cloud database
 */
export function useData<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [data, setData] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const adapter = getStorageAdapter();
        const stored = await adapter.get<T>(key);
        
        if (stored !== null) {
          setData(stored);
        } else {
          setData(defaultValue);
        }
      } catch (error) {
        console.error(`Error loading data for key "${key}":`, error);
        setData(defaultValue);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [key]); // Only run when key changes

  // Save data function
  const saveData = useCallback(
    async (value: T | ((prev: T) => T)) => {
      try {
        const adapter = getStorageAdapter();
        
        // Handle functional updates
        const newValue = typeof value === 'function'
          ? (value as (prev: T) => T)(data)
          : value;

        // Update local state immediately
        setData(newValue);

        // Save to storage
        await adapter.set(key, newValue);
      } catch (error) {
        console.error(`Error saving data for key "${key}":`, error);
      }
    },
    [key, data]
  );

  return [data, saveData];
}

/**
 * Hook specifically for Supabase real-time subscriptions
 * Only works when VITE_STORAGE_MODE=supabase
 */
export function useDataRealtime<T>(
  key: string,
  defaultValue: T,
  onUpdate?: (data: T) => void
): [T, (value: T | ((prev: T) => T)) => void] {
  const [data, setData] = useData<T>(key, defaultValue);

  useEffect(() => {
    const storageMode = import.meta.env.VITE_STORAGE_MODE;
    
    if (storageMode !== 'supabase') {
      return; // Real-time only available in Supabase mode
    }

    // TODO: Add Supabase real-time subscription here
    // This will be implemented when migrations are ready
    
    console.log(`Real-time subscription for "${key}" will be available after Supabase setup`);
  }, [key]);

  return [data, setData];
}
