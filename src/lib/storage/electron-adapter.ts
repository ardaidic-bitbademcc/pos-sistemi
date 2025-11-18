import type { StorageAdapter } from './adapter';

// Electron storage adapter using IPC
export class ElectronAdapter implements StorageAdapter {
  async get<T>(key: string): Promise<T | null> {
    try {
      // Check if we're in Electron environment
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        const value = await (window as any).electronAPI.getData(key);
        return value;
      }
      
      // Fallback to localStorage if not in Electron
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error(`ElectronAdapter get error for key ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      // Check if we're in Electron environment
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        await (window as any).electronAPI.setData(key, value);
        return;
      }
      
      // Fallback to localStorage if not in Electron
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`ElectronAdapter set error for key ${key}:`, error);
      throw error;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      // Check if we're in Electron environment
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        await (window as any).electronAPI.deleteData(key);
        return;
      }
      
      // Fallback to localStorage if not in Electron
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`ElectronAdapter remove error for key ${key}:`, error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      // Check if we're in Electron environment
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        await (window as any).electronAPI.clearData();
        return;
      }
      
      // Fallback to localStorage if not in Electron
      localStorage.clear();
    } catch (error) {
      console.error('ElectronAdapter clear error:', error);
      throw error;
    }
  }

  async keys(): Promise<string[]> {
    try {
      // Check if we're in Electron environment
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        const keys = await (window as any).electronAPI.getAllKeys();
        return keys;
      }
      
      // Fallback to localStorage if not in Electron
      return Object.keys(localStorage);
    } catch (error) {
      console.error('ElectronAdapter keys error:', error);
      return [];
    }
  }
}
