# 🚀 Production Deployment Rehberi - VPS ile Canlıya Alma

## 📋 İçindekiler
1. [VPS Nedir ve Neden Kullanmalı?](#vps-nedir)
2. [Önerilen VPS Sağlayıcıları](#vps-sağlayıcıları)
3. [Sistem Gereksinimleri](#sistem-gereksinimleri)
4. [Adım Adım VPS Kurulumu](#vps-kurulumu)
5. [Database Migration (SQLite → PostgreSQL)](#database-migration)
6. [Backend Deployment](#backend-deployment)
7. [Frontend Deployment](#frontend-deployment)
8. [Domain ve SSL Kurulumu](#domain-ssl)
9. [Monitoring ve Backup](#monitoring-backup)
10. [Güvenlik](#güvenlik)

---

## 🎯 VPS Nedir ve Neden Kullanmalı?

### VPS (Virtual Private Server) Nedir?
- Sanal özel sunucu
- Kendi işletim sisteminiz (Ubuntu, CentOS, vb.)
- Full kontrol (root access)
- Dedicated resources (CPU, RAM, Disk)

### Bu Sistem İçin VPS Mantıklı mı? **EVET! ✅**

**Avantajlar:**
- ✅ **Full Kontrol**: Node.js, PostgreSQL, Nginx hepsini kendiniz yönetin
- ✅ **Maliyet Efektif**: $5-20/ay ile başlayabilirsiniz
- ✅ **Ölçeklenebilir**: RAM/CPU ihtiyaç arttıkça upgrade
- ✅ **Tek Yerde**: Backend + Database + Frontend hepsi tek sunucuda
- ✅ **Hız**: Türkiye'ye yakın lokasyon seçebilirsiniz
- ✅ **Öğrenme**: Sunucu yönetimi deneyimi

**Dezavantajlar:**
- ⚠️ Sunucu yönetimi gerekir
- ⚠️ Güvenlik güncellemeleri sizin sorumluluğunuzda

---

## 🏢 Önerilen VPS Sağlayıcıları

### 1. **DigitalOcean** (En Önerilen)
- **Fiyat**: $6/ay'dan başlar (1GB RAM, 25GB SSD)
- **Lokasyon**: Frankfurt (TR'ye yakın)
- **Artılar**: Kolay UI, güzel döküman, snapshot/backup
- **İlk Kredi**: $200 ücretsiz kredi (60 gün)
- **Link**: https://www.digitalocean.com/

### 2. **Hetzner**
- **Fiyat**: €4.51/ay (~160₺) (2GB RAM, 40GB SSD)
- **Lokasyon**: Falkenstein/Helsinki (Avrupa)
- **Artılar**: Ucuz, güçlü donanım
- **Link**: https://www.hetzner.com/cloud

### 3. **Linode (Akamai)**
- **Fiyat**: $5/ay (1GB RAM, 25GB SSD)
- **Lokasyon**: Frankfurt
- **Artılar**: Güvenilir, iyi performans
- **Link**: https://www.linode.com/

### 4. **Vultr**
- **Fiyat**: $6/ay (1GB RAM, 25GB SSD)
- **Lokasyon**: Frankfurt/Amsterdam
- **Link**: https://www.vultr.com/

### 5. **AWS EC2 / Azure / Google Cloud**
- **Fiyat**: Değişken (genelde daha pahalı)
- **Artılar**: Enterprise grade, ölçeklenebilir
- **Eksiler**: Karmaşık, pahalı

**ÖNERİM**: **DigitalOcean** veya **Hetzner** ile başlayın.

---

## 💻 Sistem Gereksinimleri

### Minimum (Küçük işletme)
- **CPU**: 1 vCore
- **RAM**: 1-2GB
- **Disk**: 25GB SSD
- **Bant Genişliği**: 1TB/ay
- **Tahmini Maliyet**: $5-10/ay

### Önerilen (Orta ölçek)
- **CPU**: 2 vCore
- **RAM**: 4GB
- **Disk**: 50GB SSD
- **Bant Genişliği**: 2TB/ay
- **Tahmini Maliyet**: $12-24/ay

### Yüksek Performans (Büyük işletme)
- **CPU**: 4 vCore
- **RAM**: 8GB
- **Disk**: 100GB SSD
- **Tahmini Maliyet**: $40-80/ay

---

## 🛠️ Adım Adım VPS Kurulumu

### ADIM 1: VPS Satın Alma (DigitalOcean Örneği)

1. **DigitalOcean'a Kaydolun**
   - https://www.digitalocean.com/
   - Kredi kartı ekleyin ($200 ücretsiz kredi)

2. **Droplet Oluşturun**
   ```
   Choose an image: Ubuntu 24.04 LTS
   Choose a plan: Basic - $6/mo (1GB RAM)
   Choose a datacenter region: Frankfurt
   Authentication: SSH keys (önerilen) veya Password
   Hostname: pos-system-prod
   ```

3. **SSH Key Oluşturma (Güvenli)**
   ```bash
   # Yerel bilgisayarınızda
   ssh-keygen -t ed25519 -C "your_email@example.com"
   # Public key'i kopyalayın
   cat ~/.ssh/id_ed25519.pub
   ```

4. **Droplet'e Bağlanma**
   ```bash
   ssh root@YOUR_SERVER_IP
   ```

---

### ADIM 2: Sunucu İlk Kurulum

```bash
# 1. Sistem güncellemesi
apt update && apt upgrade -y

# 2. Güvenlik duvarı (UFW)
ufw allow OpenSSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable

# 3. Swap oluştur (düşük RAM için)
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# 4. Yeni kullanıcı oluştur (root yerine)
adduser deploy
usermod -aG sudo deploy
su - deploy
```

---

### ADIM 3: Node.js Kurulumu

```bash
# Node.js 20.x (LTS) kurulumu
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Versiyonları kontrol et
node -v   # v20.x.x
npm -v    # 10.x.x

# Yarn (opsiyonel)
sudo npm install -g yarn

# PM2 (Process Manager)
sudo npm install -g pm2
```

---

### ADIM 4: PostgreSQL Kurulumu

```bash
# PostgreSQL 16 kurulumu
sudo apt install -y postgresql postgresql-contrib

# PostgreSQL başlat
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Database ve kullanıcı oluştur
sudo -u postgres psql

# PostgreSQL shell'de:
CREATE DATABASE pos_system_db;
CREATE USER pos_user WITH PASSWORD 'güçlü_şifre_buraya';
GRANT ALL PRIVILEGES ON DATABASE pos_system_db TO pos_user;
\q

# PostgreSQL connection test
psql -U pos_user -d pos_system_db -h localhost
```

---

### ADIM 5: Nginx Kurulumu (Reverse Proxy)

```bash
# Nginx kurulumu
sudo apt install -y nginx

# Nginx başlat
sudo systemctl start nginx
sudo systemctl enable nginx

# Test
curl http://localhost
# "Welcome to nginx!" görmeli
```

---

### ADIM 6: Projeyi Sunucuya Aktarma

```bash
# Git kurulumu
sudo apt install -y git

# Proje dizini oluştur
mkdir -p /home/deploy/apps
cd /home/deploy/apps

# GitHub'dan clone (veya SCP ile transfer)
git clone https://github.com/ardaidic-bitbademcc/pos-sistemi.git
cd pos-sistemi

# Bağımlılıkları yükle
npm install

# Environment variables
cp .env.example .env.production
nano .env.production
```

**`.env.production` içeriği:**
```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://pos_user:güçlü_şifre_buraya@localhost:5432/pos_system_db"

# Server
PORT=3001
NODE_ENV=production

# JWT Secret (güçlü random string)
JWT_SECRET="$(openssl rand -base64 32)"

# CORS (Domain'iniz)
CORS_ORIGIN="https://yourdomain.com"
```

---

### ADIM 7: Database Migration (SQLite → PostgreSQL)

```bash
# Prisma schema'da datasource değiştir
nano prisma/schema.prisma
```

**`prisma/schema.prisma` değişikliği:**
```prisma
datasource db {
  provider = "postgresql"  // sqlite yerine
  url      = env("DATABASE_URL")
}
```

```bash
# Prisma Client yeniden oluştur
npx prisma generate

# Migration oluştur ve çalıştır
npx prisma migrate dev --name init

# Veya direkt push (development'tan production'a geçişte)
npx prisma db push

# Seed data yükle
npm run db:seed
```

---

### ADIM 8: Frontend Build

```bash
# Frontend build (production)
npm run build

# Build çıktısı: dist/ klasörü
ls -la dist/
```

---

### ADIM 9: PM2 ile Backend Başlatma

```bash
# PM2 ecosystem dosyası oluştur
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'pos-backend',
    script: './server/index.ts',
    interpreter: 'tsx',
    env: {
      NODE_ENV: 'production',
    },
    env_file: '.env.production',
    instances: 2,
    exec_mode: 'cluster',
    max_memory_restart: '500M',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  }]
};
EOF

# Log klasörü oluştur
mkdir -p logs

# PM2 ile başlat
pm2 start ecosystem.config.js

# PM2 status
pm2 status
pm2 logs pos-backend

# Otomatik başlatma (reboot sonrası)
pm2 startup
pm2 save
```

---

### ADIM 10: Nginx Konfigürasyonu

```bash
# Nginx site config
sudo nano /etc/nginx/sites-available/pos-system
```

**Nginx config içeriği:**
```nginx
# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /home/deploy/apps/pos-sistemi/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static assets cache
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

```bash
# Config'i aktifleştir
sudo ln -s /etc/nginx/sites-available/pos-system /etc/nginx/sites-enabled/

# Nginx test
sudo nginx -t

# Nginx restart
sudo systemctl restart nginx
```

---

### ADIM 11: Domain ve SSL (Let's Encrypt)

```bash
# Certbot kurulumu
sudo apt install -y certbot python3-certbot-nginx

# SSL sertifikası al (ücretsiz)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# Otomatik yenileme test
sudo certbot renew --dry-run
```

**SSL sonrası Nginx otomatik HTTPS'e yönlendirir:**
- http://yourdomain.com → https://yourdomain.com
- http://api.yourdomain.com → https://api.yourdomain.com

---

## 🔐 Güvenlik

### 1. Firewall (UFW)
```bash
sudo ufw status
# Sadece 22 (SSH), 80 (HTTP), 443 (HTTPS) açık olmalı
```

### 2. Fail2ban (Brute-force koruması)
```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3. SSH Güvenliği
```bash
sudo nano /etc/ssh/sshd_config
```
```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```
```bash
sudo systemctl restart sshd
```

### 4. PostgreSQL Güvenliği
```bash
sudo nano /etc/postgresql/16/main/pg_hba.conf
```
```
# Sadece localhost'tan bağlantı izin ver
local   all   all   peer
host    all   all   127.0.0.1/32   md5
```

### 5. Environment Variables
```bash
# .env.production dosyasını root dışında kimse okuyamasın
chmod 600 .env.production
```

---

## 📊 Monitoring ve Backup

### 1. PM2 Monitoring
```bash
# PM2 web dashboard
pm2 web

# PM2 logs
pm2 logs pos-backend --lines 100
```

### 2. Database Backup (Otomatik)
```bash
# Backup scripti oluştur
nano ~/backup-db.sh
```
```bash
#!/bin/bash
BACKUP_DIR="/home/deploy/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

pg_dump -U pos_user -d pos_system_db > "$BACKUP_DIR/db_backup_$TIMESTAMP.sql"

# 7 günden eski backupları sil
find $BACKUP_DIR -name "db_backup_*.sql" -mtime +7 -delete

echo "Backup completed: db_backup_$TIMESTAMP.sql"
```
```bash
chmod +x ~/backup-db.sh

# Crontab ile günlük backup (her gece 2:00)
crontab -e
# Ekle: 0 2 * * * /home/deploy/backup-db.sh
```

### 3. Uptime Monitoring (Ücretsiz)
- **UptimeRobot**: https://uptimerobot.com/ (50 monitor ücretsiz)
- **Pingdom**: https://www.pingdom.com/
- Her 5 dakikada bir health check

### 4. Log Rotation
```bash
sudo nano /etc/logrotate.d/pos-system
```
```
/home/deploy/apps/pos-sistemi/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    missingok
    copytruncate
}
```

---

## 🚀 Deployment Akışı (Güncellemeler)

### Manuel Deployment
```bash
# 1. Sunucuya bağlan
ssh deploy@YOUR_SERVER_IP

# 2. Proje dizinine git
cd /home/deploy/apps/pos-sistemi

# 3. Son değişiklikleri çek
git pull origin main

# 4. Bağımlılıkları güncelle
npm install

# 5. Database migration (gerekirse)
npx prisma migrate deploy

# 6. Frontend build
npm run build

# 7. Backend restart
pm2 restart pos-backend

# 8. Durum kontrol
pm2 status
pm2 logs pos-backend --lines 20
```

### Otomatik Deployment (GitHub Actions)
**`.github/workflows/deploy.yml`** oluşturun:
```yaml
name: Deploy to VPS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_IP }}
          username: deploy
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /home/deploy/apps/pos-sistemi
            git pull origin main
            npm install
            npm run build
            pm2 restart pos-backend
```

---

## 💰 Maliyet Tahmini

### Aylık Maliyetler (DigitalOcean)
| Bileşen | Maliyet |
|---------|---------|
| VPS (2GB RAM, 50GB SSD) | $12/ay |
| Domain (.com) | $12/yıl (~$1/ay) |
| SSL Sertifikası (Let's Encrypt) | Ücretsiz |
| **TOPLAM** | **~$13/ay** |

### İlk Kurulum Maliyeti
- Domain: $12 (yıllık)
- VPS: $12 (aylık)
- **İlk Ay Toplam**: ~$24

---

## 📝 Deployment Checklist

### Kurulum Öncesi
- [ ] VPS hesabı oluştur
- [ ] Domain satın al (GoDaddy, Namecheap, vb.)
- [ ] SSH key oluştur
- [ ] GitHub repo'su hazır

### VPS Kurulumu
- [ ] Ubuntu 24.04 yükle
- [ ] Güvenlik duvarı aktif (UFW)
- [ ] Swap oluştur
- [ ] Deploy kullanıcısı oluştur

### Yazılım Kurulumları
- [ ] Node.js 20.x
- [ ] PostgreSQL 16
- [ ] Nginx
- [ ] PM2
- [ ] Certbot

### Database
- [ ] PostgreSQL database oluştur
- [ ] User ve şifre ayarla
- [ ] Prisma migration çalıştır
- [ ] Seed data yükle

### Backend
- [ ] .env.production ayarla
- [ ] PM2 ile başlat
- [ ] Health check test et
- [ ] Log'ları kontrol et

### Frontend
- [ ] `npm run build` çalıştır
- [ ] dist/ klasörü kontrol
- [ ] Nginx static serve ayarla

### Domain ve SSL
- [ ] Domain DNS ayarları (A record)
- [ ] Nginx config (server_name)
- [ ] Certbot SSL kurulum
- [ ] HTTPS redirect test

### Güvenlik
- [ ] Firewall (22, 80, 443)
- [ ] Fail2ban aktif
- [ ] SSH password disable
- [ ] .env dosya izinleri (600)

### Monitoring
- [ ] PM2 monitoring
- [ ] Database backup scripti
- [ ] Cron job ayarla
- [ ] UptimeRobot setup

### Test
- [ ] Frontend erişim (https://yourdomain.com)
- [ ] API erişim (https://api.yourdomain.com/health)
- [ ] Login testi
- [ ] CRUD işlemleri testi

---

## 🎯 Hızlı Başlangıç (TL;DR)

```bash
# 1. VPS'e bağlan
ssh root@YOUR_SERVER_IP

# 2. Hızlı kurulum scripti
curl -o- https://raw.githubusercontent.com/YOUR_GITHUB/pos-sistemi/main/deploy.sh | bash

# 3. Domain DNS ayarları
# A record: yourdomain.com → YOUR_SERVER_IP
# A record: api.yourdomain.com → YOUR_SERVER_IP

# 4. SSL kurulum
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com

# 5. Hazır! 🎉
```

---

## 🆘 Sorun Giderme

### Backend çalışmıyor
```bash
pm2 logs pos-backend
pm2 restart pos-backend
```

### Database bağlanamıyor
```bash
sudo systemctl status postgresql
psql -U pos_user -d pos_system_db -h localhost
```

### Nginx hata
```bash
sudo nginx -t
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log
```

### Port dinlemiyor
```bash
sudo netstat -tulpn | grep :3001
```

---

**Sonraki Adım**: VPS sağlayıcısı seçin ve başlayalım! 🚀
