# ⚡ Hızlı Başlangıç - Production'a Alma (15 Dakika)

## 🎯 Gereksinimler
- ✅ VPS hesabı (DigitalOcean/Hetzner önerilen)
- ✅ Domain (opsiyonel ama önerilen)
- ✅ SSH erişimi
- ✅ 30 dakika zamanınız

---

## 📝 Adım Adım (Kopyala-Yapıştır)

### 1️⃣ VPS Satın Al (2 dakika)

**DigitalOcean:**
1. https://www.digitalocean.com/ 'a git
2. "Create Droplet" tıkla
3. Seçimler:
   - Image: **Ubuntu 24.04 LTS**
   - Plan: **Basic $12/mo (2GB RAM, 50GB SSD)**
   - Region: **Frankfurt** (TR'ye yakın)
   - Authentication: **SSH Key** (daha güvenli) veya **Password**
   - Hostname: `pos-production`
4. "Create Droplet" tıkla
5. IP adresini not al: `YOUR_SERVER_IP`

---

### 2️⃣ SSH ile Bağlan (1 dakika)

```bash
# Terminal açın
ssh root@YOUR_SERVER_IP

# İlk giriş için "yes" yazın
```

---

### 3️⃣ Otomatik Kurulum Scripti (10 dakika)

```bash
# Script'i indir
curl -o deploy.sh https://raw.githubusercontent.com/ardaidic-bitbademcc/pos-sistemi/main/deploy.sh

# Çalıştır
sudo bash deploy.sh
```

**Script şunları soracak:**
- Database adı: `pos_system_db` (Enter)
- Database kullanıcı: `pos_user` (Enter)
- Database şifresi: `güçlü_bir_şifre_yazın`

**Script otomatik kuracaklar:**
- ✅ Node.js 20.x
- ✅ PostgreSQL 16
- ✅ Nginx
- ✅ PM2
- ✅ Certbot (SSL)
- ✅ Güvenlik duvarı
- ✅ Otomatik backup

---

### 4️⃣ Projeyi Yükle (5 dakika)

```bash
# Deploy kullanıcısına geç
su - deploy

# Proje dizinine git
cd /home/deploy/apps

# GitHub'dan klonla
git clone https://github.com/ardaidic-bitbademcc/pos-sistemi.git
cd pos-sistemi

# Bağımlılıkları yükle
npm install

# .env dosyasını kopyala
cp /home/deploy/.env.production .env.production

# Domain'inizi düzenleyin
nano .env.production
# CORS_ORIGIN satırını düzenleyin: https://yourdomain.com

# Prisma setup
npx prisma generate
npx prisma db push
npm run db:seed

# Frontend build
npm run build

# Backend başlat
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Çıkan komutu kopyalayıp root olarak çalıştırın
```

---

### 5️⃣ Nginx Yapılandırması (3 dakika)

```bash
# Root olarak
exit  # deploy'dan çık
sudo -i

# Nginx config dosyasını kopyala
cd /home/deploy/apps/pos-sistemi
cp nginx.conf /etc/nginx/sites-available/pos-system

# Domain'inizi düzenleyin
nano /etc/nginx/sites-available/pos-system
# yourdomain.com yerine kendi domain'inizi yazın
# api.yourdomain.com yerine api.kendi-domain.com yazın

# Config'i aktifleştir
ln -s /etc/nginx/sites-available/pos-system /etc/nginx/sites-enabled/

# Default config'i devre dışı bırak
rm /etc/nginx/sites-enabled/default

# Test
nginx -t

# Restart
systemctl restart nginx
```

---

### 6️⃣ Domain Ayarları (2 dakika)

**Domain sağlayıcınızda (GoDaddy, Namecheap, vb.):**

DNS Records ekleyin:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | YOUR_SERVER_IP | 600 |
| A | www | YOUR_SERVER_IP | 600 |
| A | api | YOUR_SERVER_IP | 600 |

**DNS yayılması 5-30 dakika sürebilir.**

Test:
```bash
ping yourdomain.com
ping api.yourdomain.com
```

---

### 7️⃣ SSL Kurulumu (2 dakika)

```bash
# Domain'inizi buraya yazın
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# Soruları yanıtlayın:
# Email: your-email@example.com
# Terms: Yes
# Share email: No (opsiyonel)
# Redirect HTTP to HTTPS: Yes (2)

# Test otomatik yenileme
sudo certbot renew --dry-run
```

---

### 8️⃣ Test Et! 🎉 (1 dakika)

**1. Frontend:**
```
https://yourdomain.com
```
→ POS sistemi açılmalı

**2. Backend API:**
```bash
curl https://api.yourdomain.com/health
# {"status":"ok","message":"Server is running"}
```

**3. Login:**
```
Email: demo@posaca.com
Password: demo123
```

---

## ✅ Tamamlandı! Sistem Canlıda!

### 📊 Monitoring

```bash
# Backend durumu
pm2 status
pm2 logs pos-backend

# Nginx durumu
sudo systemctl status nginx

# Database durumu
sudo systemctl status postgresql

# Disk kullanımı
df -h

# RAM kullanımı
free -h

# CPU kullanımı
top
```

---

## 🔄 Güncelleme Yapmak İçin

```bash
# Sunucuya bağlan
ssh deploy@YOUR_SERVER_IP

# Proje dizinine git
cd /home/deploy/apps/pos-sistemi

# Son değişiklikleri çek
git pull origin main

# Bağımlılıkları güncelle
npm install

# Frontend build
npm run build

# Backend restart
pm2 restart pos-backend

# Durum kontrol
pm2 status
```

---

## 🆘 Sorun mu Var?

### Backend çalışmıyor
```bash
pm2 logs pos-backend --lines 50
pm2 restart pos-backend
```

### Site açılmıyor
```bash
sudo systemctl status nginx
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

### Database hatası
```bash
sudo systemctl status postgresql
psql -U pos_user -d pos_system_db -h localhost
```

### SSL hatası
```bash
sudo certbot renew --force-renewal
sudo systemctl restart nginx
```

---

## 💰 Aylık Maliyet

| Hizmet | Tutar |
|--------|-------|
| VPS (2GB RAM) | $12/ay |
| Domain | $1/ay (~$12/yıl) |
| SSL (Let's Encrypt) | Ücretsiz |
| **TOPLAM** | **~$13/ay** |

---

## 🎓 İleri Seviye (Opsiyonel)

### Otomatik Deployment (GitHub Actions)

1. **GitHub Secrets Ekle:**
   - Settings → Secrets → New repository secret
   - `SERVER_IP`: YOUR_SERVER_IP
   - `SERVER_USER`: deploy
   - `SSH_PRIVATE_KEY`: (yerel bilgisayarınızdan `cat ~/.ssh/id_rsa`)

2. **Push yaptığınızda otomatik deploy olur!**

### Monitoring (UptimeRobot)

1. https://uptimerobot.com/ 'a git
2. Add Monitor
   - Type: HTTP(S)
   - URL: https://yourdomain.com
   - Interval: 5 minutes
3. Email notification ayarla

### Database Backup Kontrolü

```bash
# Backup'ları listele
ls -lh /home/deploy/backups/

# Manuel backup
/home/deploy/backup-db.sh

# Cron job kontrol
crontab -l
```

---

## 📚 Kaynak Linkler

- **Dökümanlar:**
  - [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) - Detaylı rehber
  - [BACKEND_DOKUMANTASYON.md](./BACKEND_DOKUMANTASYON.md) - API dökümanı

- **VPS Sağlayıcıları:**
  - [DigitalOcean](https://www.digitalocean.com/)
  - [Hetzner](https://www.hetzner.com/cloud)
  - [Linode](https://www.linode.com/)

- **Domain Sağlayıcıları:**
  - [GoDaddy](https://www.godaddy.com/)
  - [Namecheap](https://www.namecheap.com/)
  - [Cloudflare](https://www.cloudflare.com/)

---

## 🎉 Tebrikler!

Sisteminiz artık canlıda ve kullanıma hazır! 🚀

Sorular için GitHub Issues'dan ulaşabilirsiniz.
