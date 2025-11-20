# Windows PC'ye Kurulum Rehberi

## Seçenek 1: Geliştirme Ortamında Çalıştırma (Önerilen - İlk Test İçin)

### Gereksinimler
- Windows 10/11
- Node.js 18+ ([nodejs.org](https://nodejs.org))
- Git ([git-scm.com](https://git-scm.com))

### Kurulum Adımları

#### 1. Repository'yi Klonlayın
```bash
# Komut İstemi veya PowerShell'i açın
cd C:\
git clone https://github.com/ardaidic-bitbademcc/pos-sistemi.git
cd pos-sistemi
```

#### 2. Electron Branch'ine Geçin
```bash
git checkout feature/electron-desktop
```

#### 3. Bağımlılıkları Kurun
```bash
npm install
```

Bu işlem 5-10 dakika sürebilir (internet hızınıza bağlı).

#### 4. Uygulamayı Başlatın
```bash
npm run electron
```

**İlk çalıştırmada:**
- Vite dev server başlayacak (React app)
- Electron penceresi açılacak
- Console'da API sunucu logları görünecek:
  ```
  🚀 Spark POS API Server running on http://192.168.1.X:3333
  📱 Mobile terminals can connect to: http://192.168.1.X:3333
  🔌 WebSocket Server running on ws://192.168.1.X:3334
  ```

#### 5. Test Edin
- [ ] Electron penceresi açıldı mı?
- [ ] Login ekranı görünüyor mu?
- [ ] Giriş yapabildiniz mi?
- [ ] POS modülü çalışıyor mu?
- [ ] Satış yapabildiniz mi?

---

## Seçenek 2: Production Build (.exe Oluşturma)

### Tek PC için (.exe çalıştırılabilir dosya)

#### 1. Production Build Yapın
```bash
npm run electron:build:win
```

Bu komut:
- React app'i build eder (`npm run build`)
- Electron uygulamasını paketler
- `dist-electron` klasöründe çıktı oluşturur

**Çıktı dosyaları:**
```
dist-electron/
├── win-unpacked/           # Taşınabilir sürüm (kurulum gerektirmez)
│   └── Spark POS Desktop.exe
└── Spark POS Desktop Setup 0.0.0.exe  # Installer
```

#### 2. Taşınabilir Sürümü Kullanma

**Avantajlar:**
- Kurulum gerektirmez
- USB belleğe kopyalanabilir
- Herhangi bir klasöre taşınabilir

**Kullanım:**
```
dist-electron/win-unpacked/Spark POS Desktop.exe
```

Bu dosyayı çift tıklayarak çalıştırabilirsiniz.

#### 3. Installer ile Kurulum

**Avantajlar:**
- Başlat menüsüne ekler
- Masaüstü kısayolu oluşturur
- Güncelleme altyapısı (ileride)
- Profesyonel görünüm

**Kullanım:**
```
dist-electron/Spark POS Desktop Setup 0.0.0.exe
```

Çift tıklayın ve kurulum sihirbazını takip edin:
1. Kurulum yolu seçin (varsayılan: `C:\Program Files\Spark POS Desktop`)
2. Masaüstü kısayolu oluştur ✓
3. Başlat menüsüne ekle ✓
4. Kur butonuna tıkla

Kurulum tamamlandıktan sonra:
- Başlat → Spark POS
- veya Masaüstü kısayolu

---

## Seçenek 3: Birden Fazla PC'ye Dağıtım

### A. Taşınabilir Sürüm ile (Önerilen - Kolay)

#### 1. Build Yapın (Bir PC'de)
```bash
npm run electron:build:win
```

#### 2. Klasörü Kopyalayın
```
dist-electron/win-unpacked/
```

Bu klasörün tamamını şunlara kopyalayın:
- **USB bellek** → Diğer PC'lere taşı
- **Network paylaşımı** → `\\SERVER\SparkPOS\`
- **Cloud storage** → Google Drive, Dropbox

#### 3. Diğer PC'lerde Çalıştırın
```
Spark POS Desktop.exe
```

**NOT:** Her PC'de .exe'yi çalıştırmanız yeterli, kurulum gerektirmez.

### B. Installer ile (Profesyonel)

#### 1. Installer'ı Dağıtın
```
Spark POS Desktop Setup 0.0.0.exe
```

Bu dosyayı şuralardan paylaşın:
- Network drive
- Email
- WeTransfer / Google Drive
- USB bellek

#### 2. Her PC'de Kurun
1. Setup.exe'yi çalıştır
2. Kurulum sihirbazını tamamla
3. Uygulamayı aç

---

## Veri Senkronizasyonu

### Durum: Şu Anda Her PC Bağımsız

Electron şu anda **local storage** kullanıyor. Yani:
- ✅ Her PC kendi verilerini saklar
- ❌ PC'ler arası veri paylaşımı yok
- ❌ Merkezi veritabanı yok

### Çözüm 1: Mobil Terminal Modu (Mevcut)

**Ana PC (Sunucu):**
```bash
npm run electron
# API Server: http://192.168.1.X:3333
```

**Diğer PC'ler (Terminal):**
- Mobil terminal gibi bağlanır
- API üzerinden veri alır/gönderir
- Real-time sync

### Çözüm 2: Supabase Entegrasyonu (Önerilen - Gelecek)

Web versiyonundaki Supabase adapter'ını Electron'a entegre edin:

```typescript
// .env dosyası
VITE_STORAGE_MODE=supabase
VITE_SUPABASE_URL=https://lvciqbweooripjmltxwh.supabase.co
VITE_SUPABASE_ANON_KEY=your-key-here
```

Böylece tüm PC'ler aynı cloud veritabanını kullanır.

### Çözüm 3: Kendi Sunucunuz

Merkezi bir Windows Server kurun:
- Express API server çalıştırın
- Tüm PC'ler ona bağlansın
- Veriler merkezi sunucuda

---

## Ağ Yapılandırması (Mobil Terminal Modu İçin)

### Senaryo: Ana PC + 2 Terminal PC + Mobil Tablet

#### 1. Ana PC'yi Sunucu Olarak Ayarlayın

```bash
# Ana PC'de
npm run electron
```

Console'da IP adresini not edin:
```
📡 REST API: http://192.168.1.100:3333
🔌 WebSocket: ws://192.168.1.100:3334
```

#### 2. Windows Firewall İzni Verin

**Otomatik (İlk çalıştırmada):**
- Windows Firewall uyarısı çıkacak
- "İzin Ver" butonuna tıklayın

**Manuel:**
```
1. Windows Defender Güvenlik Duvarı → Gelişmiş Ayarlar
2. Gelen Kurallar → Yeni Kural
3. Bağlantı Noktası → TCP
4. Belirli Bağlantı Noktaları: 3333, 3334
5. Bağlantıya izin ver
6. Ad: Spark POS API
```

#### 3. Terminal PC'lerde Web Browser ile Bağlanın

Diğer PC'lerde tarayıcıyı açın:
```
http://192.168.1.100:3333
```

Spark POS web arayüzü açılacak ve ana sunucuya bağlanacak.

#### 4. Mobil Tablet'ten Bağlanın

- Ana PC'de "Sunucu Bilgileri" bölümünden QR kodu gösterin
- Tablet'ten QR kodu tarayın (mobil app olduğunda)
- veya IP'yi manuel girin

---

## Güncelleme Stratejisi

### Manuel Güncelleme

#### Yeni versiyon çıktığında:

1. GitHub'dan son kodu çek:
   ```bash
   git pull origin feature/electron-desktop
   ```

2. Bağımlılıkları güncelle:
   ```bash
   npm install
   ```

3. Yeniden build yap:
   ```bash
   npm run electron:build:win
   ```

4. Yeni .exe'yi dağıt

### Otomatik Güncelleme (Gelecek)

`electron-updater` paketi ile:
- Uygulama açılışta güncelleme kontrolü
- Yeni versiyon varsa otomatik indir
- Kullanıcı onayı ile güncelle
- Restart

---

## Performans Optimizasyonu

### Build Size Küçültme

#### 1. Production Build Optimization

`vite.config.ts` güncellemesi:
```typescript
export default defineConfig({
  build: {
    minify: 'esbuild',
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu']
        }
      }
    }
  }
});
```

#### 2. Gereksiz Dosyaları Hariç Tut

`electron-builder.json`:
```json
{
  "files": [
    "dist/**/*",
    "electron/**/*",
    "package.json"
  ],
  "extraFiles": [
    {
      "from": "public",
      "to": "public",
      "filter": ["icon.png", "icon.ico"]
    }
  ]
}
```

### Hızlı Başlangıç

```javascript
// electron/main.cjs
app.on('ready', async () => {
  // Show window immediately
  createWindow();
  
  // Start servers asynchronously
  setTimeout(() => {
    startAPIServer();
    startWebSocketServer();
  }, 100);
});
```

---

## Sorun Giderme

### Build Hataları

#### "Cannot find module 'electron'"
```bash
npm install --save-dev electron
```

#### "electron-builder failed"
```bash
# Cache temizle
npm cache clean --force
rm -rf node_modules
npm install
```

### Runtime Hataları

#### "Port 3333 already in use"
Başka bir uygulama portu kullanıyor. Port değiştirin:

`electron/main.cjs`:
```javascript
const API_PORT = 3335; // 3333 → 3335
const WS_PORT = 3336;  // 3334 → 3336
```

#### "Failed to load resource"
Firewall blokluyor. Yukarıdaki adımları uygulayın.

#### "WebSocket connection failed"
- Antivirus yazılımını kontrol edin
- Windows Firewall izinlerini kontrol edin
- IP adresinin doğru olduğundan emin olun

---

## Hızlı Başlangıç Checklist

### İlk Kez Kurulum (Dev Mode)
- [ ] Node.js kurulumu
- [ ] Git kurulumu
- [ ] Repository klonlama
- [ ] `npm install`
- [ ] `npm run electron`
- [ ] Giriş yapıp test et

### Production Deployment
- [ ] `npm run electron:build:win`
- [ ] `dist-electron/win-unpacked` klasörünü kopyala
- [ ] Diğer PC'lere taşı
- [ ] `Spark POS Desktop.exe` çalıştır
- [ ] Test et

### Network Setup (Çoklu PC)
- [ ] Ana PC'de Electron başlat
- [ ] IP adresini not et
- [ ] Firewall izni ver
- [ ] Diğer PC'lerden bağlan
- [ ] Test et

---

## Ek Kaynaklar

- **Electron Dokümantasyon:** https://www.electronjs.org/docs
- **electron-builder:** https://www.electron.build/
- **Node.js İndirme:** https://nodejs.org
- **Git İndirme:** https://git-scm.com

**Proje Dosyaları:**
- `ELECTRON_SETUP_SUMMARY.md` - Teknik detaylar
- `ELECTRON_TEST.md` - Test komutları
- `NEXT_STEPS.md` - Gelecek adımlar
- `MOBILE_TERMINAL_API.md` - API referansı

---

**Son Güncelleme:** 20 Kasım 2025
