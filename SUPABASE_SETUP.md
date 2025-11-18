# Supabase Entegrasyonu - Kurulum Kılavuzu

Bu proje **Adapter Pattern** kullanarak hem **localStorage (KV)** hem de **Supabase** ile çalışabilir.

## 🎯 Mevcut Durum

✅ **Şu an KV modunda çalışıyor** - Herhangi bir değişiklik gerektirmiyor  
✅ Tüm mevcut kod çalışmaya devam ediyor  
✅ Supabase altyapısı hazır - sadece aktif etmek gerekiyor

## 📦 Kurulum Adımları

### 1. Supabase Projesi Oluştur

1. [supabase.com](https://supabase.com) adresinden ücretsiz hesap oluştur
2. "New Project" ile yeni proje oluştur
3. Proje ayarlarından **Project URL** ve **Anon Key**'i kopyala

### 2. Environment Variables

`.env` dosyasını düzenle:

```bash
# Supabase credentials (Project Settings > API)
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE

# Storage mode değiştir
VITE_STORAGE_MODE=supabase  # 'kv' yerine 'supabase'
```

### 3. Database Migration

Supabase Dashboard'dan SQL Editor'ü aç ve şu dosyayı çalıştır:

```sql
-- supabase/migrations/00001_initial_schema.sql dosyasının içeriğini kopyala
```

veya Supabase CLI kullan:

```bash
# Supabase CLI yükle
npm install -g supabase

# Login
npx supabase login

# Projeye bağlan
npx supabase link --project-ref YOUR_PROJECT_REF

# Migration'ları uygula
npx supabase db push
```

### 4. Test Et

```bash
npm run dev
```

Artık verileriniz Supabase'de saklanıyor! 🎉

## 🔄 KV'den Supabase'e Geçiş

### Otomatik Geçiş (Önerilen)

Mevcut localStorage verilerinizi Supabase'e taşımak için:

1. `.env` dosyasında `VITE_STORAGE_MODE=kv` olarak bırak
2. Tarayıcı console'unda şunu çalıştır:

```javascript
// Tüm KV verilerini export et
const exportData = async () => {
  const data = {};
  const keys = ['admins', 'branches', 'employees', 'products', 'categories', 'sales'];
  
  for (const key of keys) {
    data[key] = await window.spark.kv.get(key);
  }
  
  console.log('Export data:', JSON.stringify(data, null, 2));
  return data;
};

await exportData();
```

3. Export edilen veriyi kopyala
4. `.env` dosyasında `VITE_STORAGE_MODE=supabase` yap
5. Uygulamayı yeniden başlat
6. Console'da import scriptini çalıştır:

```javascript
// Import data to Supabase
const importData = async (data) => {
  const adapter = getStorageAdapter();
  
  for (const [key, value] of Object.entries(data)) {
    await adapter.set(key, value);
  }
  
  console.log('Import complete!');
};

await importData(YOUR_EXPORTED_DATA);
```

### Manuel Geçiş

Supabase Dashboard'dan SQL Editor ile direkt insert:

```sql
INSERT INTO employees (full_name, email, phone, role, branch_id, hourly_rate, employee_pin, admin_id)
VALUES 
  ('Ahmet Yılmaz', 'ahmet@restoran.com', '0555 111 2233', 'cashier', 'branch-1', 85, '1234', 'demo-admin'),
  -- diğer kayıtlar...
```

## 🔌 API Kullanımı

### useData Hook (Önerilen)

Tüm component'lerde `useKV` yerine `useData` kullanın:

```typescript
// Eski (hala çalışır)
import { useKV } from '@github/spark/hooks';
const [employees, setEmployees] = useKV<Employee[]>('employees', []);

// Yeni (KV ve Supabase ile uyumlu)
import { useData } from '@/hooks/use-data';
const [employees, setEmployees] = useData<Employee[]>('employees', []);
```

### Direct Supabase Queries

Daha gelişmiş sorgular için:

```typescript
import { getAll, insert, update, remove } from '@/lib/supabase/queries';

// Tüm çalışanları getir
const employees = await getAll<Employee>('employees', adminId);

// Yeni çalışan ekle
const newEmployee = await insert<Employee>('employees', {
  full_name: 'John Doe',
  email: 'john@example.com',
  role: 'waiter',
  admin_id: adminId,
  branch_id: branchId,
  hourly_rate: 75,
  employee_pin: '1234'
});

// Güncelle
await update<Employee>('employees', employeeId, adminId, {
  hourly_rate: 85
});

// Sil
await remove('employees', employeeId, adminId);
```

### Real-time Subscriptions

```typescript
import { subscribeToTable } from '@/lib/supabase/queries';

useEffect(() => {
  const unsubscribe = subscribeToTable('employees', adminId, (payload) => {
    console.log('Change received:', payload);
    // Verileri yenile
  });

  return () => unsubscribe();
}, [adminId]);
```

## 🏗️ Proje Yapısı

```
src/
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Supabase bağlantısı
│   │   └── queries.ts          # Hazır CRUD fonksiyonları
│   └── storage/
│       ├── adapter.ts          # Storage interface
│       ├── kv-adapter.ts       # localStorage implementasyonu
│       ├── supabase-adapter.ts # Supabase implementasyonu
│       └── index.ts            # Adapter seçici
├── hooks/
│   └── use-data.ts             # Universal data hook
└── types/
    └── supabase/
        └── database.types.ts   # Database type definitions

supabase/
└── migrations/
    └── 00001_initial_schema.sql # Database schema
```

## ⚙️ Özellikler

### ✅ Şu An Çalışıyor

- [x] Adapter pattern ile dual storage desteği
- [x] KV (localStorage) implementasyonu
- [x] Supabase implementasyonu
- [x] Unified `useData` hook
- [x] TypeScript type safety
- [x] Multi-tenancy (admin_id bazlı izolasyon)
- [x] Temel CRUD operasyonları
- [x] İlk 7 tablo migration'ı

### 🚧 Yapılacaklar

- [ ] Kalan 43 tablo migration'ı
- [ ] Real-time subscription implementasyonu
- [ ] Auth entegrasyonu (Supabase Auth)
- [ ] File upload (Supabase Storage)
- [ ] Advanced RLS policies
- [ ] Backup/restore tools
- [ ] Data migration helper script

## 🔐 Güvenlik

### Row Level Security (RLS)

Tüm tablolarda RLS aktif. Her admin sadece kendi verilerini görebilir:

```sql
-- Örnek RLS policy
CREATE POLICY "Users can manage own admin employees" ON employees
    FOR ALL USING (admin_id = auth.uid());
```

### API Keys

`.env` dosyası `.gitignore`'da. Production'da environment variables kullan.

## 📊 Performans

| Özellik | KV (localStorage) | Supabase |
|---------|-------------------|----------|
| İlk yükleme | ~50ms | ~200ms |
| Veri okuma | ~1ms | ~50ms |
| Veri yazma | ~2ms | ~100ms |
| Offline | ✅ Çalışır | ❌ Çalışmaz |
| Senkronizasyon | ❌ Yok | ✅ Var |
| Capacity | ~10MB | Unlimited |

## 🐛 Sorun Giderme

### "Supabase not configured" Hatası

`.env` dosyasında credentials'ları kontrol et:

```bash
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=eyJ...
```

### Veriler Görünmüyor

1. Migration'ları çalıştırdığınızdan emin olun
2. RLS policy'lerini kontrol edin
3. Tarayıcı console'unda hata var mı bakın

### KV'ye Geri Dönmek İstiyorum

`.env` dosyasında:

```bash
VITE_STORAGE_MODE=kv
```

Uygulamayı yeniden başlatın. Tüm localStorage verileri korunur.

## 📚 Kaynaklar

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Real-time](https://supabase.com/docs/guides/realtime)

## 💬 Destek

Sorularınız için issue açabilirsiniz.
