# Icon Dosyaları Hakkında

## Gerekli Icon Formatları

Electron Builder için şu icon dosyalarına ihtiyaç var:

### Windows
- `icon.ico` - Windows icon (256x256, 128x128, 64x64, 48x48, 32x32, 16x16)

### macOS
- `icon.icns` - macOS icon bundle

### Linux
- `icon.png` - PNG format (512x512 önerilen)

## Icon Oluşturma Araçları

### Online Araçlar
1. **ICO Converter** - https://icoconvert.com/
   - PNG'den ICO'ya dönüştürür
   - Birden fazla boyut içerir

2. **CloudConvert** - https://cloudconvert.com/
   - PNG to ICO, PNG to ICNS

### Masaüstü Araçlar
- **GIMP** (Ücretsiz) - Tüm formatları destekler
- **Adobe Photoshop** - ICO plugin ile
- **Figma** - Export to PNG, sonra convert

## Hızlı Başlangıç

### Eğer icon dosyanız yoksa:

1. Logo tasarımı yapın (512x512 PNG)
2. https://icoconvert.com/ adresine gidin
3. PNG yükleyin
4. Windows ICO seçeneğini seçin
5. İndirin ve `public/icon.ico` olarak kaydedin

### Varsayılan Icon (Geçici)

Şu an için basit bir text-based icon kullanacağız.
Production'da profesyonel bir logo tasarımı yapılmalı.

## Icon Gereksinimleri

- **Minimum:** 256x256 piksel
- **Önerilen:** 512x512 piksel
- **Format:** PNG (kaynak), ICO (Windows)
- **Transparan arka plan:** Önerilen
- **Renkler:** Kurumsal kimliğe uygun

## Mevcut Durum

✅ `icon.png` - 512x512 placeholder (geçici)
⏳ `icon.ico` - Windows installer için gerekli (oluşturulacak)
⏳ `icon.icns` - macOS için gerekli (opsiyonel)

## Sonraki Adımlar

1. Profesyonel bir logo tasarlayın
2. PNG formatında kaydedin (512x512)
3. ICO formatına dönüştürün
4. `public/icon.ico` dosyasını güncelleyin
5. `npm run electron:build:win` ile yeniden build yapın
