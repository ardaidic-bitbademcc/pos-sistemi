# Supabase Kurulum Rehberi

## 🎯 Adım Adım Supabase Kurulumu

### 1. Supabase Hesabı Oluşturma

1. **https://supabase.com** adresine gidin
2. **Start your project** → **Sign Up** tıklayın
3. GitHub hesabınızla giriş yapın (önerilen)

### 2. Yeni Proje Oluşturma

1. Supabase Dashboard'da **New Project** butonuna tıklayın
2. Organization seçin (veya yeni oluşturun)
3. Proje bilgilerini doldurun:
   - **Name**: `pos-sistemi-production`
   - **Database Password**: Güçlü bir şifre oluşturun ve kaydedin! ⚠️
   - **Region**: `Frankfurt (eu-central-1)` (Türkiye'ye en yakın)
   - **Pricing Plan**: Free tier başlangıç için yeterli

4. **Create new project** butonuna tıklayın
5. Proje hazırlanırken 2-3 dakika bekleyin ☕

### 3. Database Connection String Alma

Proje hazır olduğunda:

1. **Settings** (sol menü) → **Database**
2. **Connection string** bölümünde **URI** sekmesini seçin
3. Connection string'i kopyalayın:

```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
```

4. **Connection pooling** bölümünde de string'i kopyalayın (Prisma için):

```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:6543/postgres?pgbouncer=true
```

### 4. API Keys Alma

1. **Settings** → **API**
2. Aşağıdaki değerleri kopyalayın:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (gizli tutun!)

### 5. JWT Secret Alma

1. Aynı sayfada (Settings → API)
2. **JWT Settings** bölümünde **JWT Secret** değerini kopyalayın

### 6. .env Dosyası Oluşturma

`.env.production.template` dosyasını `.env` olarak kopyalayın ve doldurun:

```bash
cp .env.production.template .env
```

`.env` dosyasını düzenleyin:

```bash
# Supabase Database
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Supabase API
SUPABASE_URL="https://[PROJECT-REF].supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# JWT Secret
JWT_SECRET="your-jwt-secret-here"

# Server
PORT=3001
NODE_ENV=production
CORS_ORIGIN="http://localhost:5000"
```

### 7. Migration Çalıştırma

```bash
# Migration script'i çalıştır
./scripts/migrate-to-supabase.sh

# Veya manuel:
npx prisma generate
npx prisma migrate dev --name init_supabase
npx prisma db push
npm run db:seed  # Demo data için (opsiyonel)
```

### 8. Doğrulama

1. **Prisma Studio** ile database'i kontrol edin:
```bash
npx prisma studio
```

2. **Supabase Dashboard** → **Table Editor** ile tabloları görün

3. Uygulamayı test edin:
```bash
npm run dev
```

---

## 🔒 Güvenlik Notları

### ⚠️ ÖNEMLİ:
- `service_role` key'i **asla** frontend'de kullanmayın
- `.env` dosyasını **asla** Git'e commit etmeyin
- Database şifresini güçlü tutun (min 20 karakter)
- Production'da farklı şifreler kullanın

### ✅ Güvenli Kullanım:
- Frontend'de sadece `SUPABASE_ANON_KEY` kullanın
- Backend'de `SUPABASE_SERVICE_KEY` kullanın
- Row Level Security (RLS) aktifleştirin (opsiyonel)

---

## 📊 Supabase Dashboard Özellikleri

### Table Editor
- Tüm tablolarınızı görüntüleyin
- Manuel veri ekleyin/düzenleyin
- SQL sorguları çalıştırın

### SQL Editor
- Custom SQL sorguları yazın
- Views oluşturun
- Triggers tanımlayın

### Database Backups
- Otomatik daily backups ✅
- Point-in-time recovery (Pro plan)
- Manuel backup indirme

### Logs
- Real-time logs
- API logs
- Database logs
- Error tracking

---

## 🚀 İleri Seviye Özellikler

### Row Level Security (RLS)

Supabase'de her tablo için güvenlik politikaları oluşturabilirsiniz:

```sql
-- Admin'ler sadece kendi verilerini görsün
CREATE POLICY "Users can only see their own data"
ON products
FOR SELECT
USING (auth.uid() = admin_id);
```

### Realtime Subscriptions

Canlı veri güncellemeleri:

```typescript
const { data, error } = await supabase
  .from('sales')
  .select('*')
  .on('INSERT', payload => {
    console.log('Yeni satış:', payload.new)
  })
  .subscribe()
```

### Storage

Ürün görselleri için:

```typescript
const { data, error } = await supabase.storage
  .from('product-images')
  .upload('products/image.jpg', file)
```

---

## 🆘 Sorun Giderme

### Migration Hataları

**Hata**: `relation "Admin" does not exist`
**Çözüm**: 
```bash
npx prisma migrate reset
npx prisma migrate deploy
```

**Hata**: `Can't reach database server`
**Çözüm**: 
- DATABASE_URL'i kontrol edin
- Supabase proje durumunu kontrol edin
- IP whitelist kontrolü (Supabase'de gerekmiyor)

**Hata**: `SSL connection required`
**Çözüm**: 
```bash
DATABASE_URL="postgresql://...?sslmode=require"
```

### Connection Pool Hataları

**Hata**: `Too many connections`
**Çözüm**: Connection pooling URL kullanın (6543 portu)

---

## 💰 Supabase Pricing

### Free Tier (Başlangıç için yeterli)
- ✅ 500 MB database
- ✅ 1 GB file storage
- ✅ 2 GB bandwidth/ay
- ✅ 50,000 monthly active users
- ✅ Unlimited API requests
- ✅ Daily backups (7 gün saklama)

### Pro Plan ($25/ay)
- ✅ 8 GB database
- ✅ 100 GB file storage
- ✅ 250 GB bandwidth
- ✅ 500,000 monthly active users
- ✅ Point-in-time recovery
- ✅ Custom domains

---

## 📞 Destek

- **Dokümantasyon**: https://supabase.com/docs
- **Discord**: https://discord.supabase.com
- **GitHub Issues**: https://github.com/supabase/supabase/issues
- **Email Support**: (Pro plan)

---

## ✅ Checklist

- [ ] Supabase hesabı oluşturuldu
- [ ] Yeni proje oluşturuldu
- [ ] Database password kaydedildi
- [ ] Connection strings alındı
- [ ] API keys alındı
- [ ] .env dosyası oluşturuldu
- [ ] Migration çalıştırıldı
- [ ] Prisma Studio'da tablolar görünüyor
- [ ] Uygulama test edildi
- [ ] Backup sistemi kontrol edildi

**Tamamlandıktan sonra deployment'a hazırsınız! 🚀**
