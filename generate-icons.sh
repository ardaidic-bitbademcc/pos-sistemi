#!/bin/bash

# Icon oluşturma script'i (Linux/macOS için)
# Windows'ta WSL veya Git Bash kullanarak çalıştırılabilir

echo "=================================="
echo "  Spark POS - Icon Generator"
echo "=================================="
echo ""

# ImageMagick kontrolü
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick bulunamadı!"
    echo ""
    echo "Kurulum:"
    echo "  Ubuntu/Debian: sudo apt install imagemagick"
    echo "  macOS: brew install imagemagick"
    echo "  Windows: choco install imagemagick"
    echo ""
    exit 1
fi

echo "✅ ImageMagick bulundu"
echo ""

# Çıktı klasörü
mkdir -p public

# Placeholder PNG oluştur (eğer yoksa)
if [ ! -f "public/icon.png" ]; then
    echo "📝 Placeholder icon oluşturuluyor..."
    
    # 512x512 mavi gradient ile POS ikonu
    convert -size 512x512 \
        gradient:'#4F46E5-#7C3AED' \
        -gravity center \
        -font Arial-Bold \
        -pointsize 180 \
        -fill white \
        -annotate +0+0 'POS' \
        -pointsize 80 \
        -annotate +0+180 'SPARK' \
        public/icon.png
    
    echo "✅ icon.png oluşturuldu"
else
    echo "✅ icon.png mevcut"
fi

# Windows ICO oluştur
if [ -f "public/icon.png" ]; then
    echo "🔨 Windows ICO oluşturuluyor..."
    
    convert public/icon.png \
        -define icon:auto-resize=256,128,64,48,32,16 \
        public/icon.ico
    
    echo "✅ icon.ico oluşturuldu"
fi

# macOS ICNS oluştur (opsiyonel)
if command -v png2icns &> /dev/null; then
    echo "🍎 macOS ICNS oluşturuluyor..."
    png2icns public/icon.icns public/icon.png
    echo "✅ icon.icns oluşturuldu"
else
    echo "⏭️  png2icns bulunamadı, ICNS oluşturulamadı (opsiyonel)"
fi

echo ""
echo "=================================="
echo "  Icon Dosyaları Hazır!"
echo "=================================="
echo ""
echo "Oluşturulan dosyalar:"
echo "  ✓ public/icon.png  (512x512)"
echo "  ✓ public/icon.ico  (Windows)"
if [ -f "public/icon.icns" ]; then
    echo "  ✓ public/icon.icns (macOS)"
fi
echo ""
echo "Sonraki adım:"
echo "  npm run electron:build:win"
echo ""
