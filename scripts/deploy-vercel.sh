#!/bin/bash

# ==============================================
# POS System - Vercel Deployment Script
# ==============================================
# Bu script sistemi Vercel'e deploy eder
#
# Kullanım:
#   chmod +x scripts/deploy-vercel.sh
#   ./scripts/deploy-vercel.sh
# ==============================================

set -e

echo "🚀 POS System - Vercel Deployment Başlatılıyor..."
echo ""

# Renk kodları
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. Vercel CLI kontrolü
echo "${BLUE}📋 1. Vercel CLI kontrol ediliyor...${NC}"
if ! command -v vercel &> /dev/null; then
    echo "${YELLOW}⚠️  Vercel CLI bulunamadı, yükleniyor...${NC}"
    npm install -g vercel
fi
echo "${GREEN}✅ Vercel CLI hazır${NC}"
echo ""

# 2. Build kontrolü
echo "${BLUE}📋 2. Production build yapılıyor...${NC}"
npm run build
echo "${GREEN}✅ Build tamamlandı${NC}"
echo ""

# 3. Environment variables uyarısı
echo "${YELLOW}⚠️  DİKKAT: Vercel Dashboard'da environment variables ekleyin:${NC}"
echo ""
echo "   Gerekli variables:"
echo "   - DATABASE_URL"
echo "   - DIRECT_URL"
echo "   - SUPABASE_URL"
echo "   - SUPABASE_ANON_KEY"
echo "   - JWT_SECRET"
echo "   - NODE_ENV=production"
echo ""
read -p "   Environment variables eklendi mi? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "${YELLOW}⊘ Deployment iptal edildi${NC}"
    echo "   Vercel Dashboard → Project Settings → Environment Variables"
    exit 1
fi

# 4. Deployment
echo ""
echo "${BLUE}📋 4. Vercel'e deploy ediliyor...${NC}"
vercel --prod

echo ""
echo "${GREEN}═══════════════════════════════════════════${NC}"
echo "${GREEN}🎉 Deployment tamamlandı!${NC}"
echo "${GREEN}═══════════════════════════════════════════${NC}"
echo ""
echo "${BLUE}URL:${NC} Yukarıda gösterilen production URL'yi kullanın"
echo ""
