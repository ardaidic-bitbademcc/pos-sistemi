import type { StorageAdapter, StorageMode } from './adapter';
import { KVAdapter } from './kv-adapter';
import { SupabaseAdapter } from './supabase-adapter';
import { ElectronAdapter } from './electron-adapter';

let storageAdapter: StorageAdapter | null = null;
let currentAdminId: string | null = null;

// Detect if running in Electron
function isElectron(): boolean {
  return typeof window !== 'undefined' && !!(window as any).electronAPI;
}

export function getStorageAdapter(mode?: StorageMode, adminId?: string): StorageAdapter {
  // Auto-detect Electron environment
  if (isElectron() && !mode) {
    console.log('🖥️  Electron environment detected - using ElectronAdapter');
    if (!storageAdapter) {
      storageAdapter = new ElectronAdapter();
    }
    return storageAdapter;
  }

  const storageMode = mode || (import.meta.env.VITE_STORAGE_MODE as StorageMode) || 'kv';

  // Return existing adapter if mode hasn't changed
  if (storageAdapter) {
    return storageAdapter;
  }

  // Create new adapter based on mode
  if (storageMode === 'supabase') {
    console.log('🚀 Using Supabase storage adapter', currentAdminId ? `(adminId: ${currentAdminId})` : '(no adminId yet)');
    storageAdapter = new SupabaseAdapter(currentAdminId || undefined);
  } else {
    console.log('💾 Using KV storage adapter (localStorage)');
    storageAdapter = new KVAdapter();
  }

  return storageAdapter;
}

export function resetStorageAdapter() {
  console.log('🔄 Resetting storage adapter...');
  storageAdapter = null;
}

export function setAdminIdForSupabase(adminId: string) {
  console.log('🔐 Setting adminId for Supabase:', adminId);
  currentAdminId = adminId;
  
  if (storageAdapter && storageAdapter instanceof SupabaseAdapter) {
    storageAdapter.setAdminId(adminId);
  }
}

// Export for external use
export { isElectron };
