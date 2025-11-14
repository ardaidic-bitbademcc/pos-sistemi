import { useMemo } from 'react';
import type { AuthSession } from '@/lib/types';
import { createBranchManager, type BranchFilterableItem } from '@/lib/branch-filter';

export function useBranchFilter<T extends BranchFilterableItem>(
  items: T[] | undefined,
  session: AuthSession | null | undefined
): {
  filteredItems: T[];
  addItem: (item: T) => T;
  updateItem: (item: T) => T;
  isOwnedByCurrentBranch: (item: T) => boolean;
} {
  const manager = useMemo(() => createBranchManager<T>(session || null), [session]);
  
  const filteredItems = useMemo(() => {
    if (!items) return [];
    if (!session) return items;
    return manager.filter(items);
  }, [items, session, manager]);

  const addItem = (item: T): T => {
    return manager.addBranchInfo(item);
  };

  const updateItem = (item: T): T => {
    return manager.addBranchInfo(item);
  };

  const isOwnedByCurrentBranch = (item: T): boolean => {
    if (!session) return false;
    return (item.adminId === session.adminId && item.branchId === session.branchId) ||
           (!item.adminId && !item.branchId);
  };

  return { filteredItems, addItem, updateItem, isOwnedByCurrentBranch };
}
