#!/bin/bash

# 🚀 POS System - VPS Otomatik Kurulum Scripti
# Ubuntu 24.04 LTS için tasarlanmıştır

set -e  # Hata durumunda dur

echo "🚀 POS System VPS Kurulumu Başlıyor..."
echo "=========================================="

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Root kontrolü
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Bu script root olarak çalıştırılmalı!${NC}"
    echo "Kullanım: sudo bash deploy.sh"
    exit 1
fi

echo -e "${GREEN}✓ Root erişimi doğrulandı${NC}"

# Sistem güncelleme
echo ""
echo "📦 Sistem güncellemeleri yapılıyor..."
apt update && apt upgrade -y
echo -e "${GREEN}✓ Sistem güncellendi${NC}"

# Temel paketler
echo ""
echo "📦 Temel paketler kuruluyor..."
apt install -y curl wget git ufw fail2ban
echo -e "${GREEN}✓ Temel paketler kuruldu${NC}"

# Güvenlik duvarı
echo ""
echo "🔒 Güvenlik duvarı yapılandırılıyor..."
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
echo -e "${GREEN}✓ Güvenlik duvarı aktif${NC}"

# Swap oluştur
echo ""
echo "💾 Swap alanı oluşturuluyor..."
if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo -e "${GREEN}✓ 2GB Swap oluşturuldu${NC}"
else
    echo -e "${YELLOW}⚠ Swap zaten mevcut${NC}"
fi

# Deploy kullanıcısı
echo ""
echo "👤 Deploy kullanıcısı oluşturuluyor..."
if ! id -u deploy > /dev/null 2>&1; then
    adduser --disabled-password --gecos "" deploy
    usermod -aG sudo deploy
    echo "deploy ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/deploy
    echo -e "${GREEN}✓ Deploy kullanıcısı oluşturuldu${NC}"
else
    echo -e "${YELLOW}⚠ Deploy kullanıcısı zaten mevcut${NC}"
fi

# Node.js kurulumu
echo ""
echo "📦 Node.js 20.x kuruluyor..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
    echo -e "${GREEN}✓ Node.js kuruldu: $(node -v)${NC}"
else
    echo -e "${YELLOW}⚠ Node.js zaten mevcut: $(node -v)${NC}"
fi

# PM2 kurulumu
echo ""
echo "📦 PM2 Process Manager kuruluyor..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    echo -e "${GREEN}✓ PM2 kuruldu${NC}"
else
    echo -e "${YELLOW}⚠ PM2 zaten mevcut${NC}"
fi

# PostgreSQL kurulumu
echo ""
echo "🐘 PostgreSQL 16 kuruluyor..."
if ! command -v psql &> /dev/null; then
    apt install -y postgresql postgresql-contrib
    systemctl start postgresql
    systemctl enable postgresql
    echo -e "${GREEN}✓ PostgreSQL kuruldu${NC}"
else
    echo -e "${YELLOW}⚠ PostgreSQL zaten mevcut${NC}"
fi

# Nginx kurulumu
echo ""
echo "🌐 Nginx kuruluyor..."
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
    systemctl start nginx
    systemctl enable nginx
    echo -e "${GREEN}✓ Nginx kuruldu${NC}"
else
    echo -e "${YELLOW}⚠ Nginx zaten mevcut${NC}"
fi

# Certbot kurulumu
echo ""
echo "🔒 Certbot (Let's Encrypt) kuruluyor..."
if ! command -v certbot &> /dev/null; then
    apt install -y certbot python3-certbot-nginx
    echo -e "${GREEN}✓ Certbot kuruldu${NC}"
else
    echo -e "${YELLOW}⚠ Certbot zaten mevcut${NC}"
fi

# Fail2ban yapılandırma
echo ""
echo "🛡️ Fail2ban yapılandırılıyor..."
systemctl enable fail2ban
systemctl start fail2ban
echo -e "${GREEN}✓ Fail2ban aktif${NC}"

# Proje dizini oluştur
echo ""
echo "📁 Proje dizini oluşturuluyor..."
mkdir -p /home/deploy/apps
mkdir -p /home/deploy/backups
chown -R deploy:deploy /home/deploy
echo -e "${GREEN}✓ Proje dizini hazır${NC}"

# Database oluşturma (interaktif)
echo ""
echo "🗄️ PostgreSQL database yapılandırması"
read -p "Database adı (pos_system_db): " DB_NAME
DB_NAME=${DB_NAME:-pos_system_db}

read -p "Database kullanıcı adı (pos_user): " DB_USER
DB_USER=${DB_USER:-pos_user}

read -sp "Database şifresi: " DB_PASS
echo ""

sudo -u postgres psql << EOF
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
\q
EOF

echo -e "${GREEN}✓ Database oluşturuldu${NC}"

# .env.production oluştur
echo ""
echo "⚙️ Environment dosyası oluşturuluyor..."
cat > /home/deploy/.env.production << EOF
# Database
DATABASE_URL="postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME"

# Server
PORT=3001
NODE_ENV=production

# JWT Secret
JWT_SECRET="$(openssl rand -base64 32)"

# CORS Origin (domain'inizi buraya yazın)
CORS_ORIGIN="https://yourdomain.com"
EOF

chmod 600 /home/deploy/.env.production
chown deploy:deploy /home/deploy/.env.production
echo -e "${GREEN}✓ Environment dosyası oluşturuldu${NC}"

# Backup scripti oluştur
echo ""
echo "💾 Otomatik backup scripti oluşturuluyor..."
cat > /home/deploy/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/deploy/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

pg_dump -U pos_user -d pos_system_db > "$BACKUP_DIR/db_backup_$TIMESTAMP.sql"
find $BACKUP_DIR -name "db_backup_*.sql" -mtime +7 -delete

echo "Backup completed: db_backup_$TIMESTAMP.sql"
EOF

chmod +x /home/deploy/backup-db.sh
chown deploy:deploy /home/deploy/backup-db.sh

# Crontab ekle
(crontab -u deploy -l 2>/dev/null; echo "0 2 * * * /home/deploy/backup-db.sh") | crontab -u deploy -
echo -e "${GREEN}✓ Otomatik backup ayarlandı (her gece 02:00)${NC}"

# Özet
echo ""
echo "=========================================="
echo -e "${GREEN}✅ VPS Kurulumu Tamamlandı!${NC}"
echo "=========================================="
echo ""
echo "📝 Sonraki Adımlar:"
echo ""
echo "1. Deploy kullanıcısına geçin:"
echo "   su - deploy"
echo ""
echo "2. Projeyi GitHub'dan klonlayın:"
echo "   cd /home/deploy/apps"
echo "   git clone https://github.com/YOUR_USERNAME/pos-sistemi.git"
echo "   cd pos-sistemi"
echo ""
echo "3. Bağımlılıkları yükleyin:"
echo "   npm install"
echo ""
echo "4. .env.production dosyasını kopyalayın:"
echo "   cp /home/deploy/.env.production .env.production"
echo ""
echo "5. Prisma migration:"
echo "   npx prisma generate"
echo "   npx prisma db push"
echo "   npm run db:seed"
echo ""
echo "6. Frontend build:"
echo "   npm run build"
echo ""
echo "7. Backend başlat:"
echo "   pm2 start ecosystem.config.js"
echo "   pm2 save"
echo "   pm2 startup"
echo ""
echo "8. Nginx yapılandırması:"
echo "   sudo nano /etc/nginx/sites-available/pos-system"
echo "   sudo ln -s /etc/nginx/sites-available/pos-system /etc/nginx/sites-enabled/"
echo "   sudo nginx -t"
echo "   sudo systemctl restart nginx"
echo ""
echo "9. SSL sertifikası (domain'inizi yazın):"
echo "   sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com"
echo ""
echo "🔐 Database Bilgileri:"
echo "   DB Name: $DB_NAME"
echo "   DB User: $DB_USER"
echo "   DB Pass: [gizlendi]"
echo ""
echo "📁 Önemli Dosya Konumları:"
echo "   .env: /home/deploy/.env.production"
echo "   Backup: /home/deploy/backups/"
echo "   Project: /home/deploy/apps/pos-sistemi"
echo ""
echo "🎉 Başarılar!"
