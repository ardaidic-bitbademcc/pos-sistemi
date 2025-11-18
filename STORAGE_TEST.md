# 🧪 Supabase Storage Test

## Test Component'i Kullanma

Test component'i oluşturuldu: `src/components/StorageTest.tsx`

### Hızlı Test (Development)

1. **Dev server'ı çalıştırın:**
```bash
npm run dev
```

2. **Test sayfasını açın:**
   - Browser console'da: `window.location.href = '/test'`
   - Ya da App.tsx'e import edip kullanın

### Manual Test (Console'dan)

Browser Developer Console'u açın ve şunu çalıştırın:

```javascript
// Test verisi ekle
const testData = [
  { id: '1', name: 'Test Item 1', value: 'Value 1', createdAt: new Date().toISOString() },
  { id: '2', name: 'Test Item 2', value: 'Value 2', createdAt: new Date().toISOString() }
];

// KV mode'da
window.spark.kv.set('test-items', testData);

// Oku
window.spark.kv.get('test-items').then(console.log);
```

### Supabase'e Geçiş Testi

#### Adım 1: Environment Variables
`.env` dosyanızı güncelleyin:
```bash
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY
VITE_STORAGE_MODE=kv  # Henüz değiştirmeyin
```

#### Adım 2: KV Mode'da Test
```bash
npm run dev
```
- Bir component'te veri ekleyin
- Sayfayı yenileyin, veriler durmalı (localStorage)

#### Adım 3: Supabase Mode'a Geçin
`.env` dosyasında:
```bash
VITE_STORAGE_MODE=supabase  # KV'den Supabase'e geçiş
```

#### Adım 4: Server'ı Restart Edin
```bash
# Ctrl+C ile durdurun
npm run dev
```

#### Adım 5: Test Edin
- Aynı component'i açın
- Yeni veri ekleyin
- **Supabase Dashboard** → **Table Editor** → `kv_storage` tablosuna bakın
- Verilerinizi göreceksiniz! ☁️

#### Adım 6: Real-time Test
- İki browser tab açın
- Birinde veri ekleyin
- Diğerinde otomatik güncellenmelidir (yakında...)

## 🔄 Geri Dönüş (Rollback)

Sorun çıkarsa KV'ye geri dönün:
```bash
# .env dosyasında
VITE_STORAGE_MODE=kv
```

## 📊 Supabase'de Veriyi Görüntüleme

1. **Supabase Dashboard** → https://supabase.com
2. **Table Editor**
3. **kv_storage** tablosunu seçin
4. Tüm verilerinizi JSON formatında göreceksiniz!

## ⚠️ Önemli Notlar

- `VITE_STORAGE_MODE` değişikliği için **server restart** gerekli
- KV mode = localStorage (offline çalışır)
- Supabase mode = Cloud database (internet gerekli)
- Her iki mod da aynı API'yi kullanır (`useData` hook)
- Veriler otomatik olarak migrate edilmez, ayrıca script gerekir

## 🚀 Production Hazırlık

Production'a geçmeden önce:
1. ✅ Tüm tablolar oluşturuldu
2. ⏳ Test verisi ekleyin
3. ⏳ RLS politikalarını güncelleyin (şu an "allow all")
4. ⏳ Supabase Auth entegrasyonu
5. ⏳ Real-time subscriptions
6. ⏳ Data migration script'i
