import type {
  Product,
  MenuItem,
  Employee,
  Category,
  Sale,
  Table,
  SalaryCalculation,
  Task,
  Invoice,
  Recipe,
  CustomerAccount,
  CustomerTransaction,
  CashTransaction,
  AuthSession,
} from './types';

export interface BranchFilterableItem {
  branchId?: string;
  adminId?: string;
}

export function filterByBranch<T extends BranchFilterableItem>(
  items: T[],
  session: AuthSession | null
): T[] {
  if (!session) return [];
  
  return items.filter((item) => {
    const hasAdminId = item.adminId === session.adminId;
    const hasBranchId = item.branchId === session.branchId;
    const hasNoIds = !item.adminId && !item.branchId;
    
    return hasAdminId && (hasBranchId || !item.branchId) || hasNoIds;
  });
}

export function filterByAdminOnly<T extends BranchFilterableItem>(
  items: T[],
  session: AuthSession | null
): T[] {
  if (!session) return [];
  
  return items.filter((item) => {
    return item.adminId === session.adminId || !item.adminId;
  });
}

export function addBranchInfo<T extends BranchFilterableItem>(
  item: T,
  session: AuthSession | null
): T {
  if (!session) return item;
  
  return {
    ...item,
    adminId: session.adminId,
    branchId: session.branchId,
  };
}

export function updateWithBranchInfo<T extends BranchFilterableItem>(
  items: T[],
  updatedItem: T,
  session: AuthSession | null
): T[] {
  if (!session) return items;
  
  const itemWithBranchInfo = addBranchInfo(updatedItem, session);
  
  return items.map((item) => {
    if ('id' in item && 'id' in itemWithBranchInfo && item.id === itemWithBranchInfo.id) {
      return itemWithBranchInfo;
    }
    return item;
  });
}

export function addItemWithBranchInfo<T extends BranchFilterableItem>(
  items: T[],
  newItem: T,
  session: AuthSession | null
): T[] {
  if (!session) return items;
  
  const itemWithBranchInfo = addBranchInfo(newItem, session);
  return [...items, itemWithBranchInfo];
}

export function removeItemIfOwned<T extends BranchFilterableItem & { id: string }>(
  items: T[],
  itemId: string,
  session: AuthSession | null
): T[] {
  if (!session) return items;
  
  return items.filter((item) => {
    if (item.id !== itemId) return true;
    
    const isOwned = (item.adminId === session.adminId && item.branchId === session.branchId) || 
                    (!item.adminId && !item.branchId);
    
    return !isOwned;
  });
}

export class BranchDataManager<T extends BranchFilterableItem> {
  constructor(private session: AuthSession | null) {}

  filter(items: T[]): T[] {
    return filterByBranch(items, this.session);
  }

  filterByAdminOnly(items: T[]): T[] {
    return filterByAdminOnly(items, this.session);
  }

  add(items: T[], newItem: T): T[] {
    return addItemWithBranchInfo(items, newItem, this.session);
  }

  update(items: T[], updatedItem: T): T[] {
    return updateWithBranchInfo(items, updatedItem, this.session);
  }

  remove(items: (T & { id: string })[], itemId: string): T[] {
    return removeItemIfOwned(items, itemId, this.session);
  }

  addBranchInfo(item: T): T {
    return addBranchInfo(item, this.session);
  }
}

export function createBranchManager<T extends BranchFilterableItem>(
  session: AuthSession | null
): BranchDataManager<T> {
  return new BranchDataManager<T>(session);
}
