# Yeni Özellikler - QR Menü ve Tema Özelleştirme

## 🎨 QR Menü Tema Özelleştirme

### Ürün Görsel Yönetimi
- **Menü Mühendisliği** modülünde yeni menü öğesi eklerken "Görsel URL" alanı eklendi
- Ürün görselleri QR menüde otomatik olarak gösterilir
- Görseller yüksek kalitede görüntülenir, yüklenemezse otomatik gizlenir
- Tema ayarlarından tüm görseller toplu olarak gösterilebilir/gizlenebilir

### QR Menü Tema Ayarları
QR Menü modülünde **"Tema Ayarları"** butonu ile erişilebilir:

#### Hazır Temalar (4 Adet)
1. **Klasik** - Geleneksel ve şık, yeşil tonları, Inter yazı tipi
2. **Modern** - Minimalist ve temiz, siyah-beyaz tonlar, turuncu vurgu
3. **Zarif** - Lüks ve sofistike, mor tonları, Lora serif yazı tipi
4. **Canlı** - Enerjik ve renkli, kırmızı ve yeşil tonlar

#### Görünüm Ayarları
- ✅ **Ürün Görselleri**: Ürün fotoğraflarını göster/gizle
- ✅ **Ürün Açıklamaları**: Detaylı açıklamaları göster/gizle
- ✅ **Menü Düzeni**: Izgara veya liste görünümü seçimi

#### Özelleştirilebilir Öğeler
- 🎨 Ana Renk (Primary Color)
- 🎨 Arkaplan Rengi (Background Color)
- 🎨 Metin Rengi (Text Color)
- 🎨 Vurgu Rengi (Accent Color)
- 📝 Yazı Tipi (Inter veya Lora)

### Müşteri Görünümü
- **"Müşteri Görünümü"** butonu ile müşterilerin göreceği menü önizlenebilir
- Seçilen tema ve ayarlar gerçek zamanlı olarak uygulanır
- Ürün görselleri, açıklamalar ve fiyatlar tema ile uyumlu şekilde gösterilir

## 🎭 Sistem Teması (Önizleme Modu)

### Ayarlar Modülünde Yeni Sekme
**Ayarlar → Sistem Teması** sekmesi eklendi

#### Hazır Sistem Temaları (6 Adet)
1. **Varsayılan** - Modern ve dengeli, yeşil-mavi tonlar
2. **Profesyonel** - İş odaklı ve ciddi, mavi-gri tonlar
3. **Sıcak** - Samimi ve davetkar, turuncu-krem tonlar
4. **Minimal** - Sade ve şık, siyah-beyaz
5. **Karanlık** - Göz yormayan, koyu arkaplan
6. **Doğa** - Organik ve ferah, yeşil tonlar

### Tema Özellikleri
- Her tema için renk paleti önizlemesi
- Ana renk, ikincil renk, vurgu rengi görüntüleme
- Font ailesi bilgisi
- Köşe yuvarlaklığı ayarları

**Not**: Sistem teması şu anda önizleme modundadır. Seçim yapılabilir ancak sayfa yenilenmeden etki etmez. Gelecek güncellemelerde tam olarak aktif olacaktır.

## 📋 Güncellenmiş Modüller

### 1. Menü Mühendisliği
- ✅ Ürün görsel URL alanı eklendi
- ✅ Yeni menü öğesi eklerken görsel linki girilebilir
- ✅ Görseller QR menüde otomatik gösterilir

### 2. QR Menü
- ✅ Tema ayarları butonu eklendi
- ✅ Hazır tema seçenekleri
- ✅ Görsel göster/gizle toggle
- ✅ Açıklama göster/gizle toggle
- ✅ Izgara/liste görünüm seçimi
- ✅ Müşteri görünümü önizlemesi
- ✅ Ürün görselleri destegi

### 3. Ayarlar
- ✅ Sistem Teması sekmesi eklendi
- ✅ 6 hazır sistem teması
- ✅ QR Menü teması yönlendirmesi
- ✅ Renk paleti önizlemeleri

## 🔄 Otomatik Senkronizasyon

Tüm değişiklikler gerçek zamanlı olarak çalışır:
- Menü mühendisliğinde eklenen görseller → QR menüde gösterilir
- Tema ayarlarında yapılan değişiklikler → Müşteri görünümünde anında yansır
- Görsel/açıklama toggle → Menü görünümü anında güncellenir
- Düzen değişikliği (ızgara/liste) → Anında uygulanır

## 🎯 Kullanım Senaryoları

### Senaryo 1: Görsel Ekleyerek Menü Oluşturma
1. **Menü Mühendisliği** modülüne git
2. "Yeni Menü Öğesi" butonuna tıkla
3. Ürün bilgilerini doldur
4. **"Görsel URL"** alanına ürün fotoğrafının linkini yapıştır
5. Kaydet
6. QR Menü modülünde ürün görseli ile birlikte görüntülenir

### Senaryo 2: Mağazaya Özel Tema Oluşturma
1. **QR Menü** modülüne git
2. **"Tema Ayarları"** butonuna tıkla
3. Hazır temalardan birini seç veya özel renkler belirle
4. Görsel ve açıklama ayarlarını düzenle
5. Düzeni seç (ızgara veya liste)
6. **"Müşteri Görünümü"** ile önizle
7. Değişiklikler otomatik kaydedilir

### Senaryo 3: Sistem Teması İnceleme
1. **Ayarlar** modülüne git
2. **"Sistem Teması"** sekmesine tıkla
3. 6 farklı hazır temayı incele
4. Renk paletlerini görüntüle
5. İstediğin temayı seç (önizleme modu)

## 📝 Notlar

- QR Menü tema özelleştirmesi **tam çalışır durumda**
- Sistem teması **önizleme modunda** (gelecek güncellemede aktif olacak)
- Tüm tema ayarları kalıcı olarak saklanır (useKV ile)
- Görseller yüklenemezse otomatik gizlenir
- Her mağaza kendi temasını oluşturabilir

## 🚀 Gelecek Geliştirmeler İçin Öneriler

1. Ürün görsellerine tıklayınca büyütme özelliği ekle
2. QR menüde çoklu dil desteği ekle (Türkçe/İngilizce)
3. Sistem temasını gerçek zamanlı olarak uygula (sayfa yenileme olmadan)
4. Görsel yükleme sistemi (dosya upload)
5. Tema şablonlarını dışa/içe aktarma
6. Logo ekleme desteği
7. Font boyutu özelleştirme
