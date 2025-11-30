
import { useEffect, useCallback } from 'react';
import type { Product, Sale } from '@/lib/types';

// Database'e senkronize edilmesi gereken key'ler
const DB_SYNC_KEYS = ['products', 'sales'];

/**
 * KV storage'daki değişiklikleri database'e senkronize eder
 * Bu hook useKV ile birlikte kullanılır
 */
export function useDbSync<T>(
  key: string,
  value: T,
  adminId?: string | null,
  branchId?: string | null
) {
  // Sadece DB_SYNC_KEYS içindeki key'ler için çalış
  const shouldSync = DB_SYNC_KEYS.includes(key) && adminId;

  const syncToDatabase = useCallback(async () => {
    if (!shouldSync) return;

    try {
      // Key'e göre hangi API endpoint'ini çağıracağımızı belirle
      const endpoint = `/api/${key}`;
      
      // Array ise her item için sync yap
      if (Array.isArray(value) && value.length > 0) {
        // Bulk sync için her item'ı ayrı ayrı kontrol et
        for (const item of value) {
          if (!item || typeof item !== 'object') continue;
          
          const itemWithIds = {
            ...item,
            adminId,
            branchId: branchId || (item as any).branchId,
          };

          // ID varsa UPDATE, yoksa CREATE
          if ((item as any).id) {
            await fetch(endpoint, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(itemWithIds),
            }).catch(err => console.warn(`DB sync update failed for ${key}:`, err));
          } else {
            await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(itemWithIds),
            }).catch(err => console.warn(`DB sync create failed for ${key}:`, err));
          }
        }
      }
    } catch (error) {
      console.warn(`Database sync failed for key: ${key}`, error);
    }
  }, [key, value, adminId, branchId, shouldSync]);

  // Value değiştiğinde database'e sync et (debounce ile)
  useEffect(() => {
    if (!shouldSync) return;

    const timeoutId = setTimeout(() => {
      syncToDatabase();
    }, 1000); // 1 saniye bekle (çok sık yazma olmasın)

    return () => clearTimeout(timeoutId);
  }, [syncToDatabase, shouldSync]);

  return { syncToDatabase };
}
