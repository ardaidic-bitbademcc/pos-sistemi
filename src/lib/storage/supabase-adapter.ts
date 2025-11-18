import { supabase } from '../supabase/client';
import type { StorageAdapter } from './adapter';

// Supabase Adapter for cloud storage
export class SupabaseAdapter implements StorageAdapter {
  private tableName = 'kv_storage';
  private adminId: string | null = null;

  constructor(adminId?: string) {
    this.adminId = adminId || null;
  }

  setAdminId(adminId: string) {
    this.adminId = adminId;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('value')
        .eq('key', key)
        .eq('admin_id', this.adminId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null;
        }
        throw error;
      }

      return data?.value as T;
    } catch (error) {
      console.error(`Supabase get error for key "${key}":`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    if (!this.adminId) {
      throw new Error('Admin ID not set for Supabase adapter');
    }

    try {
      const { error } = await supabase
        .from(this.tableName)
        .upsert({
          key,
          value: value as any,
          admin_id: this.adminId,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'key,admin_id'
        });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error(`Supabase set error for key "${key}":`, error);
      throw error;
    }
  }

  async remove(key: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('key', key)
        .eq('admin_id', this.adminId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error(`Supabase remove error for key "${key}":`, error);
    }
  }

  async clear(): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('admin_id', this.adminId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Supabase clear error:', error);
    }
  }

  async keys(): Promise<string[]> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('key')
        .eq('admin_id', this.adminId);

      if (error) {
        throw error;
      }

      return data?.map(row => row.key) || [];
    } catch (error) {
      console.error('Supabase keys error:', error);
      return [];
    }
  }
}
