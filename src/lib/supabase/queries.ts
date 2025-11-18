import { supabase } from './client';
import type { Database } from '@/types/supabase/database.types';

// Type helpers
type Tables = Database['public']['Tables'];
type Employee = Tables['employees']['Row'];
type Product = Tables['products']['Row'];
type Sale = Tables['sales']['Row'];
type Branch = Tables['branches']['Row'];
type Category = Tables['categories']['Row'];

/**
 * Helper functions for common Supabase queries
 * These wrap the Supabase client with type-safe methods
 */

// Generic CRUD operations
export async function getAll<T>(
  table: string,
  adminId: string,
  filters?: Record<string, any>
) {
  if (!supabase) throw new Error('Supabase not configured');

  let query = supabase
    .from(table)
    .select('*')
    .eq('admin_id', adminId);

  // Apply additional filters
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as T[];
}

export async function getById<T>(
  table: string,
  id: string,
  adminId: string
) {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', id)
    .eq('admin_id', adminId)
    .single();

  if (error) throw error;
  return data as T;
}

export async function insert<T>(
  table: string,
  values: any
) {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from(table)
    .insert(values)
    .select()
    .single();

  if (error) throw error;
  return data as T;
}

export async function update<T>(
  table: string,
  id: string,
  adminId: string,
  values: any
) {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from(table)
    .update(values)
    .eq('id', id)
    .eq('admin_id', adminId)
    .select()
    .single();

  if (error) throw error;
  return data as T;
}

export async function remove(
  table: string,
  id: string,
  adminId: string
) {
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id)
    .eq('admin_id', adminId);

  if (error) throw error;
}

// Specific queries for common operations

export async function getEmployeesByBranch(
  branchId: string,
  adminId: string
): Promise<Employee[]> {
  return getAll<Employee>('employees', adminId, { branch_id: branchId });
}

export async function getProductsByCategory(
  categoryId: string,
  adminId: string
): Promise<Product[]> {
  return getAll<Product>('products', adminId, { category_id: categoryId });
}

export async function getSalesByDateRange(
  adminId: string,
  startDate: string,
  endDate: string
): Promise<Sale[]> {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .eq('admin_id', adminId)
    .gte('sale_date', startDate)
    .lte('sale_date', endDate)
    .order('sale_date', { ascending: false });

  if (error) throw error;
  return data as Sale[];
}

export async function getLowStockProducts(
  adminId: string,
  branchId?: string
): Promise<Product[]> {
  if (!supabase) throw new Error('Supabase not configured');

  let query = supabase
    .from('products')
    .select('*')
    .eq('admin_id', adminId)
    .eq('is_active', true);

  if (branchId) {
    query = query.eq('branch_id', branchId);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Filter products where stock <= min_stock_level
  return (data as Product[]).filter(
    p => p.stock <= p.min_stock_level
  );
}

// Real-time subscriptions
export function subscribeToTable<T>(
  table: string,
  adminId: string,
  callback: (payload: any) => void
) {
  if (!supabase) {
    console.warn('Supabase not configured, real-time unavailable');
    return () => {};
  }

  const channel = supabase
    .channel(`${table}_changes`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: table,
        filter: `admin_id=eq.${adminId}`,
      },
      callback
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
}
