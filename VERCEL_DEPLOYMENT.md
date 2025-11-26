# 🚀 Vercel Deployment Rehberi

## Ön Hazırlık

### ✅ Tamamlananlar:
- [x] Production build başarılı (`npm run build`)
- [x] Supabase kurulu ve aktif (32 tablo)
- [x] `.env` dosyası hazır
- [x] `vercel.json` konfigürasyonu hazır
- [x] Vercel CLI kuruldu (v48.10.10)

---

## 🔐 Adım 1: Vercel Hesabı & Login

```bash
# Vercel'e giriş yap (tarayıcı açılacak)
vercel login
```

**Seçenekler:**
- GitHub ile giriş (önerilen)
- Email ile giriş
- GitLab / Bitbucket

---

## 📦 Adım 2: İlk Deployment

### Otomatik Deployment (Önerilen)

```bash
# Proje klasöründe çalıştır
cd /workspaces/pos-sistemi

# İlk deployment - interactive mod
vercel

# Sorulara cevaplar:
# ? Set up and deploy "~/pos-sistemi"? [Y/n] Y
# ? Which scope? [Kendi hesabınız]
# ? Link to existing project? [N]
# ? What's your project's name? pos-sistemi
# ? In which directory is your code located? ./
# ? Want to override the settings? [N]
```

### Manuel Deployment

```bash
# Production deployment
vercel --prod

# Preview deployment (test için)
vercel
```

---

## 🔧 Adım 3: Environment Variables Ekleme

### Dashboard'dan Ekle (Önerilen):

1. https://vercel.com/dashboard → **pos-sistemi** projesine git
2. **Settings** → **Environment Variables**
3. Şu değişkenleri ekle:

| Key | Value | Environment |
|-----|-------|-------------|
| `DATABASE_URL` | `postgresql://postgres:Badem2005acd@db.lvciqbweooripjmltxwh.supabase.co:5432/postgres` | Production, Preview, Development |
| `SUPABASE_URL` | `https://lvciqbweooripjmltxwh.supabase.co` | Production, Preview, Development |
| `SUPABASE_ANON_KEY` | `eyJhbGci...` | Production, Preview, Development |
| `JWT_SECRET` | `your-super-secret-jwt-key-change-this` | Production |
| `NODE_ENV` | `production` | Production |
| `PORT` | `3001` | All |
| `CORS_ORIGIN` | `https://pos-sistemi.vercel.app` | Production |

4. **Save** butonuna tıkla
5. **Redeploy** et (Vercel otomatik sorar)

### CLI ile Ekle:

```bash
# Environment variable ekle
vercel env add DATABASE_URL production

# Paste value sonra Enter

# Tüm environment variables'ı göster
vercel env ls
```

---

## 🔄 Adım 4: Redeploy (Environment Variables Sonrası)

```bash
# Yeni env variables ile redeploy
vercel --prod --force
```

---

## ✅ Adım 5: Deployment Doğrulama

### Deployment URL'ini Al:

```bash
# Son deployment URL'ini göster
vercel ls
```

Örnek output:
```
pos-sistemi    https://pos-sistemi-xxxx.vercel.app    Ready
```

### Test Et:

```bash
# Deployment'ı tarayıcıda aç
vercel open

# Veya curl ile test
curl -I https://pos-sistemi-xxxx.vercel.app
```

### Supabase Bağlantısını Test Et:

1. Deployment URL'ine git
2. Login sayfasında giriş yap
3. Dashboard'da veri görüntüle
4. POS modülünde satış yap
5. Supabase Dashboard → Table Editor'da verileri kontrol et

---

## 📋 Production Checklist

### Deployment Öncesi:

- [ ] `.env` dosyası `.gitignore`'da
- [ ] `vercel.json` commit edildi
- [ ] Production build başarılı
- [ ] Supabase aktif
- [ ] Domain hazır (opsiyonel)

### Deployment Sonrası:

- [ ] HTTPS çalışıyor (Vercel otomatik)
- [ ] Environment variables ayarlandı
- [ ] Database bağlantısı çalışıyor
- [ ] Login/Register çalışıyor
- [ ] POS modülü test edildi
- [ ] Raporlar oluşturuluyor

---

## 🌐 Adım 6: Custom Domain (Opsiyonel)

### Domain Ekleme:

1. Vercel Dashboard → **pos-sistemi** → **Settings** → **Domains**
2. Domain ekle: `pos.yourcompany.com`
3. DNS kayıtlarını güncelle (Vercel talimatları verir):
   ```
   Type: CNAME
   Name: pos
   Value: cname.vercel-dns.com
   ```
4. SSL otomatik aktif olur (Let's Encrypt)

### `CORS_ORIGIN` Güncelle:

```bash
# Custom domain sonrası CORS'u güncelle
vercel env add CORS_ORIGIN production
# Value: https://pos.yourcompany.com
```

---

## 🔍 Debugging & Logs

### Real-time Logs:

```bash
# Production logs
vercel logs --prod

# Follow logs (tail -f gibi)
vercel logs --prod --follow
```

### Dashboard'dan Logs:

1. Vercel Dashboard → **pos-sistemi**
2. **Deployments** → Son deployment'ı tıkla
3. **Functions** → `/api/*` logs
4. **Runtime Logs** → Tüm loglar

---

## 🚨 Sorun Giderme

### Build Hatası:

```bash
# Local'de build test et
npm run build

# Hataları düzelt ve tekrar deploy
vercel --prod
```

### Database Connection Hatası:

- Vercel Dashboard'da `DATABASE_URL` doğru mu kontrol et
- Supabase projesi "Active" durumda mı?
- Port 5432 yerine 6543 (pooling) dene

### Environment Variables Yüklenmiyor:

```bash
# Environment variables'ı tekrar ekle
vercel env pull .env.production
cat .env.production
```

---

## 📊 Monitoring & Analytics

### Vercel Analytics:

1. Dashboard → **pos-sistemi** → **Analytics**
2. **Enable Analytics** butonuna tıkla
3. Gerçek kullanıcı metrikleri görüntüle:
   - Page views
   - Unique visitors
   - Top pages
   - Performance metrics

### Supabase Monitoring:

1. Supabase Dashboard → **Reports**
2. Database metrics:
   - Active connections
   - Query performance
   - Storage usage

---

## 🔄 CI/CD Kurulumu (GitHub)

### GitHub ile Otomatik Deployment:

1. **GitHub'a push yap:**
   ```bash
   git add .
   git commit -m "Production deployment hazır"
   git push origin main
   ```

2. **Vercel Dashboard → pos-sistemi → Settings → Git**
3. **Connect Git Repository** → GitHub seç
4. **ardaidic-bitbademcc/pos-sistemi** repository'sini bağla

**Artık her push otomatik deploy olacak!** 🎉

---

## 📦 Deployment Komutları Özeti

```bash
# İlk deployment
vercel login
cd /workspaces/pos-sistemi
vercel

# Production deployment
vercel --prod

# Environment variables ekle
vercel env add DATABASE_URL production
vercel env add SUPABASE_URL production
vercel env add SUPABASE_ANON_KEY production

# Logs
vercel logs --prod

# Domain ekle
vercel domains add pos.yourcompany.com

# Proje bilgisi
vercel ls
vercel inspect
```

---

## ✅ Deployment Tamamlandı!

Deployment başarılı olduğunda:

1. **URL'inizi kaydedin:** `https://pos-sistemi-xxxx.vercel.app`
2. **Admin hesabı oluşturun** (ilk login)
3. **Şube ekleyin**
4. **Ürün/menü ekleyin**
5. **Personel ekleyin**
6. **İlk satışı yapın** 🎉

---

## 🆘 Destek

- **Vercel Docs**: https://vercel.com/docs
- **Vercel Discord**: https://vercel.com/discord
- **Supabase Docs**: https://supabase.com/docs
- **GitHub Issues**: Proje repository'nizde issue açın

**Başarılar! 🚀**
