# 🚀 Spark POS - Otomatik Kurulum ve Build Sistemi

## ✨ Özellikler

`setup-and-build.bat` scripti **tamamen otomatik** çalışır:

### ✅ Otomatik Kontrol ve Kurulum
- **Node.js** - Yoksa otomatik kurar (Chocolatey ile)
- **Git** - Yoksa otomatik kurar
- **npm Paketleri** - Güncelleme gerekiyorsa otomatik günceller
- **Versiyon Kontrolü** - Eski versiyonları tespit edip günceller

### 🔧 Otomatik Build İşlemleri
1. React uygulamasını build eder (Vite)
2. Electron desktop uygulamasını paketler
3. Windows installer (.exe) oluşturur
4. NSIS + Portable versiyonlar hazırlar

## 🎯 Kullanım

### Tek Adım Kurulum

```bash
# 1. Projeyi indirin
git clone https://github.com/ardaidic-bitbademcc/pos-sistemi.git
cd pos-sistemi
git checkout feature/electron-desktop

# 2. Setup scriptine SAĞ TIKLAYIN
# "Yönetici olarak çalıştır" seçin
setup-and-build.bat
```

### ⚠️ Önemli: Yönetici Hakları

Script **yönetici hakları** gerektirir çünkü:
- Chocolatey package manager kurulumu
- Node.js sistem geneli kurulum
- PATH environment değişkeni güncelleme

### 📋 Script Ne Yapar?

1. **Yönetici hakları kontrolü** ✅
2. **Node.js kontrolü**
   - Yoksa → Chocolatey kurar → Node.js kurar
   - Eski versiyon → Güncelleme seçeneği sunar
   - Güncel → Devam eder
3. **Git kontrolü**
   - Yoksa → Otomatik kurar
   - Varsa → Devam eder
4. **npm paketleri**
   - node_modules yoksa → `npm install`
   - Güncel değilse → Güncelleme seçeneği
5. **React build** (Vite)
   - dist klasörü temizlenir
   - `npm run build` çalıştırılır
6. **Electron build**
   - dist-electron temizlenir
   - `npm run electron:build:win` çalıştırılır
   - NSIS + Portable installer oluşturur

## 🎨 Kullanıcı Deneyimi

### Renkli Çıktı
- 🟢 **Yeşil**: Başarılı işlemler
- 🔴 **Kırmızı**: Hatalar
- 🟡 **Sarı**: Uyarılar ve bilgilendirmeler
- 🔵 **Mavi**: Başlıklar ve bölümler

### İnteraktif Seçenekler
- Node.js güncelleme istemi (eski versiyon varsa)
- npm paket güncelleme istemi
- Bilgisayar yeniden başlatma istemi (yeni kurulum sonrası)
- Installer klasörünü açma istemi (sonunda)

## 🔄 İşlem Akışı

```
START
  ↓
[Yönetici hakları kontrolü]
  ↓
[Node.js var mı?] → HAYIR → [Chocolatey kur] → [Node.js kur] → [Yeniden başlat?]
  ↓ EVET
[Versiyon uygun mu?] → HAYIR → [Güncelle?]
  ↓ EVET
[Git var mı?] → HAYIR → [Git kur]
  ↓ EVET
[node_modules var mı?] → HAYIR → [npm install]
  ↓ EVET
[Paketler güncel mi?] → HAYIR → [npm install]
  ↓ EVET
[React Build] (npm run build)
  ↓
[Electron Build] (npm run electron:build:win)
  ↓
[.exe dosyaları oluşturuldu mu?] → EVET → [Başarı! 🎉]
  ↓ HAYIR
[Hata mesajı göster]
```

## 🛠️ Hata Yönetimi

### Otomatik Düzeltme
Script hataları otomatik düzeltmeye çalışır:

```batch
# npm install başarısız olursa:
1. npm cache clean --force
2. node_modules sil
3. Tekrar npm install dene
```

### Manuel Müdahale Gereken Durumlar

**1. Chocolatey Kurulamıyorsa**
```
Manuel: https://nodejs.org/
- LTS versiyonunu indirin
- Kurulum yapın
- Bilgisayarı yeniden başlatın
```

**2. Node.js Kurulamıyorsa**
```
Olası nedenler:
- İnternet bağlantısı yok
- Proxy ayarları engelleme yapıyor
- Antivirüs engelliyor
```

**3. Electron Build Başarısız**
```
Kontrol edin:
- Disk alanı yeterli mi? (min 2GB boş alan)
- Antivirüs electron-builder'ı engelliyor mu?
- electron-builder제대로 kuruldu mu?
```

## 📊 Beklenen Süre

| İşlem | İlk Kurulum | Sonraki Build'ler |
|-------|-------------|-------------------|
| Node.js Kurulumu | 3-5 dakika | - |
| npm install | 2-4 dakika | 30 saniye |
| React Build | 1-2 dakika | 30-60 saniye |
| Electron Build | 3-5 dakika | 2-3 dakika |
| **TOPLAM** | **10-15 dakika** | **3-5 dakika** |

## 🎯 Sonuç

Script başarıyla tamamlandığında:

```
dist-electron/
  ├── Spark POS Desktop-1.0.0-x64.exe        (NSIS Installer)
  └── Spark POS Desktop-1.0.0-Portable.exe   (Portable)
```

### NSIS Installer
- Profesyonel kurulum deneyimi
- Start Menu kısayolları
- Desktop ikonu
- Uninstaller

### Portable
- Tek .exe dosyası
- Kurulum gerektirmez
- USB'den çalışır
- Ayarlar .exe ile aynı klasörde

## 🔐 Güvenlik

Script **güvenli** operasyonlar yapar:
- ✅ Sadece resmi kaynaklardan indirir (nodejs.org, chocolatey.org)
- ✅ npm registry: registry.npmjs.org
- ✅ Hiçbir veri dışarı gönderilmez
- ✅ Tüm işlemler local makinede

### Chocolatey Güvenliği
Chocolatey, Windows için güvenilir bir package manager'dır:
- Microsoft ve büyük şirketler kullanır
- Açık kaynak
- Community + 9000 paket

## 🆚 Diğer Scriptlerle Karşılaştırma

| Script | Node.js Kurulumu | Versiyon Kontrolü | Güncelleme | Hata Düzeltme |
|--------|------------------|-------------------|------------|---------------|
| `build-installer.bat` | ❌ Manuel | ❌ | ❌ | ✅ Kısmi |
| `check-requirements.bat` | ❌ Sadece kontrol | ✅ | ❌ | ❌ |
| **`setup-and-build.bat`** | ✅ **Otomatik** | ✅ | ✅ | ✅ **Tam** |

## 💡 İpuçları

### İlk Kurulum
1. **Sabırlı olun** - İlk kurulum 10-15 dakika sürer
2. **İnternet bağlantısı** - Hızlı internet gereklidir
3. **Disk alanı** - En az 2GB boş alan
4. **Antivirüs** - Gerekirse geçici devre dışı bırakın

### Sonraki Build'ler
- Çok daha hızlı (3-5 dakika)
- node_modules cache'den gelir
- Sadece değişen dosyalar build edilir

### Offline Kullanım
İlk kurulum sonrası:
- node_modules zaten local
- Electron binary cache'lendi
- İnternet olmadan da build yapabilirsiniz

## 🐛 Sorun Giderme

### "Yönetici hakları gerekli" hatası
```
Çözüm:
- Dosyaya SAĞ TIKLAYIN
- "Yönetici olarak çalıştır" seçin
```

### "Chocolatey kurulamadı" hatası
```
Çözüm:
1. PowerShell'i yönetici olarak açın
2. Şunu çalıştırın:
   Set-ExecutionPolicy Bypass -Scope Process -Force
3. Script'i tekrar çalıştırın
```

### "npm install başarısız" hatası
```
Çözüm:
1. node_modules klasörünü manuel silin
2. npm cache clean --force
3. Script'i tekrar çalıştırın
```

### ".exe dosyaları oluşmadı" hatası
```
Kontrol:
1. dist klasörü var mı? (React build başarılı mı?)
2. electron-builder kurulu mu? (npm list electron-builder)
3. Disk alanı yeterli mi?
4. dist-electron klasöründe log dosyası var mı?
```

## 📞 Destek

Sorun yaşıyorsanız:
1. Script çıktısını **tamamını** kaydedin
2. Hata mesajlarını kontrol edin
3. `check-requirements.bat` çalıştırıp sonucu paylaşın

## 🚀 Gelecek Geliştirmeler

- [ ] Python kurulumu (gelecekte gerekirse)
- [ ] Otomatik icon dönüştürme
- [ ] Code signing otomasyonu
- [ ] Auto-update sistem kurulumu
- [ ] Linux/macOS desteği
- [ ] CI/CD entegrasyonu

---

**Not**: Bu script Windows 10/11 için optimize edilmiştir. Windows 7/8 desteği garanti değildir.
