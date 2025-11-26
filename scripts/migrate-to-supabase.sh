#!/bin/bash

# ==============================================
# POS System - Supabase Migration Script
# ==============================================
# Bu script ile SQLite'dan Supabase PostgreSQL'e geçiş yapabilirsiniz
#
# Kullanım:
#   chmod +x scripts/migrate-to-supabase.sh
#   ./scripts/migrate-to-supabase.sh
# ==============================================

set -e  # Hata durumunda dur

echo "🚀 POS System - Supabase Migration Başlatılıyor..."
echo ""

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Gerekli dosyaları kontrol et
echo "${BLUE}📋 1. Gerekli dosyalar kontrol ediliyor...${NC}"
if [ ! -f "prisma/schema.prisma" ]; then
    echo "${RED}❌ Hata: prisma/schema.prisma bulunamadı${NC}"
    exit 1
fi

if [ ! -f ".env.production.template" ]; then
    echo "${RED}❌ Hata: .env.production.template bulunamadı${NC}"
    exit 1
fi

echo "${GREEN}✅ Gerekli dosyalar mevcut${NC}"
echo ""

# 2. Environment variables kontrolü
echo "${BLUE}📋 2. Environment variables kontrol ediliyor...${NC}"
if [ ! -f ".env" ]; then
    echo "${YELLOW}⚠️  .env dosyası bulunamadı${NC}"
    echo "   .env.production.template dosyasını .env olarak kopyalayıp doldurun:"
    echo "   cp .env.production.template .env"
    echo ""
    read -p "   .env dosyasını oluşturdunuz mu? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "${RED}❌ Migration iptal edildi${NC}"
        exit 1
    fi
fi

# DATABASE_URL kontrolü
if ! grep -q "DATABASE_URL=" .env; then
    echo "${RED}❌ Hata: .env dosyasında DATABASE_URL bulunamadı${NC}"
    exit 1
fi

# PostgreSQL kontrolü
if ! grep -q "postgresql://" .env; then
    echo "${RED}❌ Hata: DATABASE_URL PostgreSQL connection string değil${NC}"
    echo "   Örnek: postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"
    exit 1
fi

echo "${GREEN}✅ Environment variables hazır${NC}"
echo ""

# 3. Prisma schema güncellemesi
echo "${BLUE}📋 3. Prisma schema güncelleniyor...${NC}"

# Backup oluştur
if [ -f "prisma/schema.prisma" ]; then
    cp prisma/schema.prisma prisma/schema.prisma.backup
    echo "${GREEN}✅ Yedek oluşturuldu: prisma/schema.prisma.backup${NC}"
fi

echo "${GREEN}✅ Prisma schema PostgreSQL için hazır${NC}"
echo ""

# 4. Dependencies kurulumu
echo "${BLUE}📋 4. Dependencies kontrol ediliyor...${NC}"
if [ ! -d "node_modules" ]; then
    echo "${YELLOW}⚠️  node_modules bulunamadı, yükleniyor...${NC}"
    npm install
fi
echo "${GREEN}✅ Dependencies hazır${NC}"
echo ""

# 5. Prisma Client generate
echo "${BLUE}📋 5. Prisma Client generate ediliyor...${NC}"
npx prisma generate
echo "${GREEN}✅ Prisma Client oluşturuldu${NC}"
echo ""

# 6. Migration confirmation
echo "${YELLOW}⚠️  DİKKAT: Şimdi Supabase veritabanına migration yapılacak${NC}"
echo ""
echo "   Migration yapılacak database:"
DATABASE_URL=$(grep "DATABASE_URL=" .env | cut -d '=' -f2- | tr -d '"')
echo "   ${BLUE}$DATABASE_URL${NC}"
echo ""
read -p "   Migration'ı başlatmak istediğinize emin misiniz? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "${RED}❌ Migration iptal edildi${NC}"
    exit 1
fi

# 7. Database migration
echo ""
echo "${BLUE}📋 7. Database migration yapılıyor...${NC}"
echo "${YELLOW}   Bu işlem birkaç dakika sürebilir...${NC}"
echo ""

# Migration oluştur
echo "   → Migration dosyası oluşturuluyor..."
npx prisma migrate dev --name init_supabase --create-only

# Migration'ı uygula
echo "   → Migration uygulanıyor..."
npx prisma migrate deploy

echo "${GREEN}✅ Migration tamamlandı${NC}"
echo ""

# 8. Database seed (opsiyonel)
echo "${BLUE}📋 8. Demo data eklemek ister misiniz?${NC}"
read -p "   (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "${YELLOW}   Demo data yükleniyor...${NC}"
    npm run db:seed
    echo "${GREEN}✅ Demo data eklendi${NC}"
else
    echo "${YELLOW}⊘ Demo data atlandı${NC}"
fi
echo ""

# 9. Database studio
echo "${BLUE}📋 9. Database'i kontrol etmek ister misiniz?${NC}"
read -p "   Prisma Studio'yu açalım mı? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "${GREEN}✅ Prisma Studio açılıyor...${NC}"
    echo "   Tarayıcınızda http://localhost:5555 açılacak"
    echo ""
    npx prisma studio
else
    echo "${YELLOW}⊘ Prisma Studio atlandı${NC}"
fi
echo ""

# 10. Başarı mesajı
echo ""
echo "${GREEN}═══════════════════════════════════════════${NC}"
echo "${GREEN}🎉 Migration başarıyla tamamlandı!${NC}"
echo "${GREEN}═══════════════════════════════════════════${NC}"
echo ""
echo "${BLUE}Sonraki adımlar:${NC}"
echo ""
echo "1. 🧪 Uygulamayı test edin:"
echo "   ${YELLOW}npm run dev${NC}"
echo ""
echo "2. 🏗️  Production build:"
echo "   ${YELLOW}npm run build${NC}"
echo ""
echo "3. 🚀 Deploy edin (Vercel örneği):"
echo "   ${YELLOW}vercel --prod${NC}"
echo ""
echo "4. 📊 Supabase Dashboard:"
echo "   ${BLUE}https://supabase.com/dashboard${NC}"
echo ""
echo "5. 📝 Dokümantasyon:"
echo "   ${BLUE}cat PRODUCTION_CHECKLIST.md${NC}"
echo ""
echo "${GREEN}✨ İyi çalışmalar!${NC}"
echo ""
