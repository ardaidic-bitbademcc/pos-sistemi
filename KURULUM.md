# 🚀 Windows PC'ye Kurulum - Hızlı Başlangıç

## 📋 Gereksinimler

1. **Node.js 18+** → [İndir](https://nodejs.org)
2. **Git** → [İndir](https://git-scm.com)
3. **Windows 10/11**

---

## ⚡ Hızlı Kurulum (3 Adım)

### 1️⃣ Repository'yi İndirin

```bash
git clone https://github.com/ardaidic-bitbademcc/pos-sistemi.git
cd pos-sistemi
git checkout feature/electron-desktop
```

### 2️⃣ Çift Tıklayarak Çalıştırın

```
start-electron.bat
```

Bu kadar! Electron uygulaması açılacak.

---

## 🏗️ Production Build (.exe Oluşturma)

### Otomatik (Önerilen)

```
build-windows.bat
```

Dosya gezgini otomatik açılacak:
- `win-unpacked\Spark POS Desktop.exe` → Taşınabilir
- `Spark POS Desktop Setup 0.0.0.exe` → Installer

### Manuel

```bash
npm install
npm run electron:build:win
```

---

## 💾 Dağıtım Seçenekleri

### Seçenek A: Taşınabilir Sürüm (Kolay)

1. `dist-electron/win-unpacked` klasörünü kopyala
2. USB bellekle taşı veya network'te paylaş
3. İstediğin PC'de `Spark POS Desktop.exe` çalıştır

**Avantajlar:**
✅ Kurulum gerektirmez
✅ USB'den çalışır
✅ Hızlı

### Seçenek B: Installer (Profesyonel)

1. `Spark POS Desktop Setup 0.0.0.exe` dosyasını paylaş
2. Her PC'de çalıştır ve kur
3. Başlat menüsünden aç

**Avantajlar:**
✅ Profesyonel görünüm
✅ Başlat menüsü kısayolu
✅ Masaüstü ikonu

---

## 🌐 Çoklu PC Kullanımı

### Ana Sunucu PC

```
start-electron.bat
```

Console'da IP adresini not et:
```
📡 API: http://192.168.1.100:3333
```

### Diğer PC'ler (Terminal Modu)

Tarayıcıdan bağlan:
```
http://192.168.1.100:3333
```

### Firewall İzni

İlk çalıştırmada:
- Windows Defender uyarısı çıkacak
- **"İzin Ver"** butonuna tıkla

---

## 🔧 Sorun Giderme

### "Node.js bulunamadı"
→ [nodejs.org](https://nodejs.org) adresinden kur

### "Port 3333 kullanımda"
→ `electron/main.cjs` içinde portu değiştir

### "Build hatası"
```bash
npm cache clean --force
npm install
```

### Firewall Sorunu
```
Windows Defender → Gelişmiş Ayarlar → 
Gelen Kurallar → Yeni Kural → 
TCP 3333, 3334 portlarına izin ver
```

---

## 📚 Detaylı Dokümantasyon

- 📖 **[WINDOWS_DEPLOYMENT.md](WINDOWS_DEPLOYMENT.md)** - Tam rehber
- 🔧 **[ELECTRON_SETUP_SUMMARY.md](ELECTRON_SETUP_SUMMARY.md)** - Teknik detaylar
- 🧪 **[ELECTRON_TEST.md](ELECTRON_TEST.md)** - Test komutları
- 📱 **[MOBILE_TERMINAL_API.md](MOBILE_TERMINAL_API.md)** - API kullanımı

---

## 📞 Yardım

Sorun mu yaşıyorsunuz? 
1. `WINDOWS_DEPLOYMENT.md` dosyasını okuyun
2. Sorun Giderme bölümüne bakın
3. Console loglarını kontrol edin

---

**✨ Artık Windows PC'nizde Spark POS Desktop çalışıyor!**
