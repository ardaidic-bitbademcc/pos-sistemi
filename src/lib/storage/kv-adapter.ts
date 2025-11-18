import type { StorageAdapter } from './adapter';

// KV Adapter using GitHub Spark's KV system
export class KVAdapter implements StorageAdapter {
  async get<T>(key: string): Promise<T | null> {
    try {
      if (typeof window === 'undefined' || !window.spark?.kv) {
        return null;
      }
      return await window.spark.kv.get<T>(key);
    } catch (error) {
      console.error(`KV get error for key "${key}":`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      if (typeof window === 'undefined' || !window.spark?.kv) {
        throw new Error('Spark KV not available');
      }
      await window.spark.kv.set(key, value);
    } catch (error) {
      console.error(`KV set error for key "${key}":`, error);
      throw error;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      if (typeof window === 'undefined' || !window.spark?.kv) {
        return;
      }
      await window.spark.kv.delete(key);
    } catch (error) {
      console.error(`KV remove error for key "${key}":`, error);
    }
  }

  async clear(): Promise<void> {
    try {
      if (typeof window === 'undefined' || !window.spark?.kv) {
        return;
      }
      // Get all keys and delete them
      const keys = await this.keys();
      await Promise.all(keys.map(key => this.remove(key)));
    } catch (error) {
      console.error('KV clear error:', error);
    }
  }

  async keys(): Promise<string[]> {
    try {
      if (typeof window === 'undefined' || !window.spark?.kv) {
        return [];
      }
      // Spark KV doesn't have a keys() method, so we track keys separately
      const trackedKeys = await window.spark.kv.get<string[]>('__kv_keys__') || [];
      return trackedKeys;
    } catch (error) {
      console.error('KV keys error:', error);
      return [];
    }
  }

  // Helper to track keys
  private async addKey(key: string): Promise<void> {
    if (key === '__kv_keys__') return; // Don't track the tracking key
    
    const keys = await this.keys();
    if (!keys.includes(key)) {
      await window.spark.kv.set('__kv_keys__', [...keys, key]);
    }
  }

  private async removeKey(key: string): Promise<void> {
    if (key === '__kv_keys__') return;
    
    const keys = await this.keys();
    await window.spark.kv.set('__kv_keys__', keys.filter(k => k !== key));
  }
}
