# 🎯 Windows Installer Oluşturma Rehberi

## Hızlı Başlangıç

### Windows PC'de

```bash
# 1. Repository'yi klon
git clone https://github.com/ardaidic-bitbademcc/pos-sistemi.git
cd pos-sistemi
git checkout feature/electron-desktop

# 2. Installer oluştur
build-installer.bat      # ÇİFT TIKLA
```

Bu kadar! 5-10 dakika sonra installer hazır olacak.

---

## 📦 Oluşturulacak Dosyalar

Build tamamlandığında `dist-electron/` klasöründe:

### 1. NSIS Installer (Önerilen)
```
Spark POS Desktop-1.0.0-x64.exe
```

**Özellikler:**
- ✅ Başlat menüsüne ekler
- ✅ Masaüstü kısayolu
- ✅ Kaldırma programı
- ✅ Türkçe kurulum sihirbazı
- ✅ Kullanıcı klasörüne kurulum
- ✅ Profesyonel görünüm

**Kurulum Adımları:**
1. `.exe` dosyasını çift tıkla
2. "İleri" butonuna tıkla
3. Kurulum yerini seç (varsayılan: `C:\Users\KullaniciAdi\AppData\Local\Programs\spark-pos-desktop`)
4. "Masaüstü kısayolu oluştur" ✓
5. "Kur" butonuna tıkla
6. Kurulum tamamlandı!

**Başlatma:**
- Başlat → "Spark POS" yaz
- veya Masaüstü kısayolundan

### 2. Portable Versiyon
```
Spark POS Desktop-1.0.0-Portable.exe
```

**Özellikler:**
- ✅ Kurulum gerektirmez
- ✅ USB'den çalışır
- ✅ Tek dosya
- ✅ Kayıt defteri kullanmaz
- ✅ Hızlı başlatma

**Kullanım:**
1. Dosyayı istediğin yere kopyala (USB, Desktop, vb.)
2. Çift tıkla
3. Uygulama açılır

---

## 🔧 Build Süreci Detayları

### build-installer.bat Ne Yapar?

```
1. Node.js & npm kontrolü
2. Bağımlılıkları kur/güncelle
3. Önceki build'leri temizle
4. React uygulamasını build et (Vite)
5. Electron'u paketle (electron-builder)
6. Dosyaları doğrula
7. Dosya gezginini aç
```

### Manuel Build

```bash
# Bağımlılıkları kur
npm install

# React build
npm run build

# Electron build
npm run electron:build:win
```

### Sadece Portable

```bash
npm run electron:build:win -- --win portable
```

### Sadece NSIS

```bash
npm run electron:build:win -- --win nsis
```

---

## 🎨 Icon Özelleştirme

### Mevcut Durum

Şu anda placeholder bir SVG icon kullanılıyor:
- `public/icon.svg` - Mavi gradient + "POS SPARK" yazısı

### Kendi Logo'nuzu Eklemek

#### Yöntem 1: Online Converter (Kolay)

1. Logonuzu hazırlayın (PNG, 512x512 önerilen)
2. https://icoconvert.com/ adresine gidin
3. PNG'nizi yükleyin
4. "Convert" butonuna tıklayın
5. İndirilen `icon.ico` dosyasını `public/` klasörüne kopyalayın

#### Yöntem 2: Script ile (Otomatik)

```bash
# Linux/macOS veya Windows WSL/Git Bash
./generate-icons.sh
```

Bu script:
- `icon.png` (512x512) oluşturur
- `icon.ico` (Windows) dönüştürür
- `icon.icns` (macOS, opsiyonel) oluşturur

#### Yöntem 3: Manuel (Profesyonel)

1. **Figma/Photoshop** ile logo tasarla
2. **512x512 PNG** olarak export et
3. **GIMP** veya **Photoshop ICO plugin** ile ICO'ya çevir
4. `public/icon.ico` olarak kaydet

### Icon Gereksinimleri

- **Format:** ICO (Windows), ICNS (macOS), PNG (Linux)
- **Boyutlar:** 16x16, 32x32, 48x48, 64x64, 128x128, 256x256
- **Arka plan:** Transparan önerilen
- **Renkler:** Kurumsal kimliğe uygun

### Icon Güncelledikten Sonra

```bash
build-installer.bat     # Yeniden build yap
```

---

## 📋 Sistem Gereksinimleri

### Geliştirme PC (Build yapacak makine)

- **OS:** Windows 10/11 (64-bit)
- **RAM:** Minimum 4GB, önerilen 8GB+
- **Disk:** 5GB boş alan
- **Node.js:** 18.x veya üzeri
- **npm:** 9.x veya üzeri
- **İnternet:** Bağımlılıklar için gerekli

### Hedef PC (Installer'ın kurulacağı makine)

- **OS:** Windows 10/11 (64-bit)
- **RAM:** Minimum 2GB
- **Disk:** 500MB boş alan
- **İzinler:** Kullanıcı seviyesi (admin gerekmez)

---

## 🚀 Dağıtım Stratejileri

### 1. Tek PC (Kendi Kullanımınız)

```bash
build-installer.bat
dist-electron\Spark POS Desktop-1.0.0-x64.exe  # Çift tıkla, kur
```

### 2. Birkaç PC (Küçük İşletme)

**USB ile:**
```
1. Portable version'ı USB'ye kopyala
2. Her PC'de USB'den çalıştır
```

**Network ile:**
```
1. NSIS installer'ı network drive'a koy
2. Her PC'de network'ten kur
```

### 3. Çok Sayıda PC (Franchise)

**Cloud Storage:**
```
1. Google Drive / OneDrive'a yükle
2. Paylaşım linki oluştur
3. Link'i franchisee'lere gönder
```

**FTP/HTTP Server:**
```
1. Kendi sunucunuza yükle
2. Indirme sayfası oluştur
3. Otomatik güncelleme sistemi (gelecek özellik)
```

### 4. Demo/Test Sürümü

**WeTransfer / Email:**
```
1. Portable version'ı WeTransfer'e yükle
2. Email ile gönder
3. Test ettir
```

---

## 🔐 Güvenlik & İmzalama

### Kod İmzalama (Code Signing)

Production'da uygulamanızı imzalamanız önerilir:

**Neden?**
- Windows SmartScreen uyarısı göstermez
- Güvenilir publisher olarak görünürsünüz
- Profesyonel görünüm

**Nasıl?**

1. **Code Signing Certificate** satın alın:
   - Sectigo
   - DigiCert
   - GlobalSign
   
2. **electron-builder.json** güncelleyin:
```json
{
  "win": {
    "certificateFile": "path/to/cert.pfx",
    "certificatePassword": "password",
    "signingHashAlgorithms": ["sha256"],
    "sign": "./sign.js"
  }
}
```

3. Build yapın (normal şekilde)

**Maliyet:** ~$100-300/yıl

### İmzasız Dağıtım

İmza olmadan da dağıtabilirsiniz:

**Windows SmartScreen Uyarısı:**
```
Windows korudu
Tanınmayan uygulama başlatılmasını engelledi

[Daha fazla bilgi] → [Yine de çalıştır]
```

Kullanıcılarınıza nasıl geçeceklerini anlatın.

---

## 📊 Build Optimizasyonu

### Dosya Boyutu Küçültme

#### 1. Gereksiz Dosyaları Hariç Tut

`electron-builder.json`:
```json
{
  "files": [
    "dist/**/*",
    "electron/**/*",
    "!node_modules/**/*.md",
    "!node_modules/**/LICENSE",
    "!node_modules/**/*.d.ts",
    "!**/*.map"
  ]
}
```

#### 2. Compression

```json
{
  "compression": "maximum",
  "asar": true
}
```

#### 3. Node Modules Prune

```bash
npm prune --production
```

### Build Hızlandırma

#### Parallel Building

```json
{
  "electronVersion": "28.0.0",
  "buildDependenciesFromSource": false
}
```

#### Cache Kullanımı

```bash
# Cache'i temizle (sorun olursa)
npm cache clean --force
rm -rf node_modules
npm install
```

---

## 🐛 Sorun Giderme

### "ENOENT: no such file or directory 'icon.ico'"

**Çözüm:**
```bash
# Icon'u kaldır (geçici)
# electron-builder.json'dan icon satırını sil
# Veya placeholder icon oluştur
./generate-icons.sh
```

### "Build failed: Exit code 1"

**Çözüm:**
```bash
# Temizlik yap
rm -rf dist dist-electron node_modules
npm install
npm run build
npm run electron:build:win
```

### "Cannot find module 'electron'"

**Çözüm:**
```bash
npm install --save-dev electron electron-builder
```

### Build çok yavaş

**Çözüm:**
```bash
# Sadece mevcut platform için build yap
npm run electron:build:win -- --win nsis --x64

# ASAR compression'ı devre dışı bırak (geliştirmede)
# electron-builder.json: "asar": false
```

### "Access denied" hatası

**Çözüm:**
- Antivirus'ü geçici devre dışı bırak
- Veya `dist-electron` klasörünü exception'a ekle

---

## 📦 Versiyonlama

### Versiyon Numarası Güncellemek

`package.json`:
```json
{
  "version": "1.0.0"  →  "1.1.0"
}
```

Build yapınca:
```
Spark POS Desktop-1.1.0-x64.exe
```

### Semantic Versioning

- **1.0.0** → İlk release
- **1.0.1** → Bug fix
- **1.1.0** → Yeni özellik
- **2.0.0** → Breaking change

---

## 🔄 Güncelleme Stratejisi

### Manuel Güncelleme (Şu an)

1. Yeni versiyon build et
2. Installer'ı dağıt
3. Kullanıcılar yeniden kursun

### Otomatik Güncelleme (Gelecek)

`electron-updater` paketi ile:

```javascript
// electron/main.cjs
const { autoUpdater } = require('electron-updater');

app.on('ready', () => {
  autoUpdater.checkForUpdatesAndNotify();
});
```

**Gereksinimler:**
- Update sunucusu (GitHub Releases, S3, custom)
- Code signing certificate
- Update manifest

---

## ✅ Checklist: Production'a Hazır

Dağıtmadan önce kontrol edin:

**Temel:**
- [ ] Versiyonu güncelledin
- [ ] Icon'u özelleştirdin
- [ ] Test ortamında denedi
- [ ] Temiz kurulumu test ettin

**Özellikler:**
- [ ] Tüm özellikler çalışıyor
- [ ] Hatalar düzeltildi
- [ ] Performance kabul edilebilir
- [ ] UI responsive

**Güvenlik:**
- [ ] API key'ler environment variable'da
- [ ] Hassas veriler şifrelendi
- [ ] HTTPS kullanılıyor (eğer varsa)

**Dokümantasyon:**
- [ ] Kullanım kılavuzu hazır
- [ ] Kurulum talimatları açık
- [ ] Sorun giderme bölümü var

**Dağıtım:**
- [ ] Installer test edildi
- [ ] Farklı PC'de kuruldu
- [ ] Güncelleme stratejisi planlandı

---

## 📚 Ek Kaynaklar

- **electron-builder Docs:** https://www.electron.build/
- **NSIS Documentation:** https://nsis.sourceforge.io/
- **Code Signing Guide:** https://www.electron.build/code-signing
- **Auto Update:** https://www.electron.build/auto-update

**Proje Dosyaları:**
- `KURULUM.md` - Hızlı başlangıç
- `WINDOWS_DEPLOYMENT.md` - Detaylı deployment
- `ELECTRON_SETUP_SUMMARY.md` - Teknik özet
- `public/README_ICONS.md` - Icon rehberi

---

**Son Güncelleme:** 20 Kasım 2025  
**Versiyon:** 1.0.0
