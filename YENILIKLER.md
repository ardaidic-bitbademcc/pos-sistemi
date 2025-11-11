# Yenilikler - B2B Tedarik Platformu (Gizli Tedarikçi Modeli)

## 🏪 B2B Tedarik Platformu - Anonim Aracılık Sistemi

### Temel Mantık
Kafe ve restoran işletmecilerinin tedarik ihtiyaçlarını karşılarken **tedarikçi isimlerini gizleyerek** platform üzerinden aracılık yapılır ve **komisyon alınır**. Müşteriler tedarikçi firmalarını göremez, doğrudan iletişim kuramaz - tüm işlemler platform üzerinden gerçekleşir.

### Ana Özellikler

#### 🎭 Anonim Tedarikçi Sistemi
- **Tedarikçi İsimleri Gizli**: Müşteriler tedarikçi firmalarının adını göremez
- **Anonim Kodlar**: Tedarikçiler "Tedarikçi A", "Tedarikçi B", "Tedarikçi C" şeklinde gösterilir
- **Platform Aracılığı**: Tüm iletişim ve sipariş platform üzerinden yapılır
- **Komisyon Sistemi**: Her işlemden belirlenebilir oranda komisyon alınır (varsayılan %10)

#### 🔓 Opsiyonel Tedarikçi Paneli
- **Varsayılan Kapalı**: Tedarikçi paneli başlangıçta gizlidir
- **Tedarikçi Ol Butonu**: Kullanıcı dilerse "Tedarikçi Panelini Aktifleştir" butonuna tıklayarak tedarikçi olabilir
- **Hibrit Kullanım**: Aynı kullanıcı hem ürün sipariş edebilir (müşteri), hem kendi ürünlerini satabilir (tedarikçi)
- **Kafe Senaryosu**: Bir kafe ambalaj sipariş ederken, kendi kavurduğu kahveleri de satabilir

#### 📦 Müşteri Paneli (Sipariş Ver)
- **Ürün Kataloğu**: Tüm tedarikçilerin ürünleri tek listede
- **Kategori Filtresi**: Kahve, Ambalaj, İçecek, Gıda, Pasta/Çikolata, Ekipman kategorileri
- **Anonim Görüntüleme**: Her üründe tedarikçi "Tedarikçi A", "Tedarikçi B" gibi gösterilir
- **Numune Talebi**: "Numune İste" butonu ile ücretsiz numune talep edilebilir
- **Sipariş Verme**: Minimum sipariş miktarına uygun olarak sipariş oluşturma
- **Sipariş Takibi**: Bekliyor → Onaylandı → Hazırlanıyor → Kargoda → Teslim Edildi

#### 🏭 Tedarikçi Paneli (Ürün Sat)
- **Ürün Ekleme**: Detaylı ürün bilgileri, fiyat, minimum sipariş adedi
- **Kategori Seçimi**: 7 farklı kategori desteği
- **Numune Seçeneği**: Numune verilebilir/verilemez toggle
- **Tasarım Desteği**: Baskılı ürünler için "Tasarım Gerekir" işaretleme
- **Kargo Koşulları**: Ücretsiz kargo veya alıcı ödemeli seçenekleri
- **Anonim Siparişler**: Müşteri isimleri gizli, sadece "Müşteri X" görünür
- **Sipariş Yönetimi**: Onaylama, reddetme, durum güncelleme
- **Komisyon Takibi**: Ciro ve net kazanç (komisyon kesintisi sonrası) görüntüleme

### 💰 Komisyon Sistemi
- **Platform Komisyonu**: Her teslim edilen sipariş için %10 komisyon (ayarlanabilir)
- **Otomatik Hesaplama**: Tedarikçi panelinde net kazanç otomatik gösterilir
- **Şeffaf Gösterim**: Müşteri ve tedarikçi komisyon oranını görür

### 🔒 Gizlilik ve Güvenlik
- **Tedarikçi → Müşteri**: Tedarikçiler müşteri adlarını göremez (Müşteri X)
- **Müşteri → Tedarikçi**: Müşteriler tedarikçi adlarını göremez (Tedarikçi A, B, C)
- **İletişim Engelleme**: Direkt iletişim imkansız, platform aracılık eder
- **Rekabet Koruması**: Tedarikçiler birbirlerini göremez

### 📊 Sipariş Akışı

#### Müşteri Tarafı
1. **Ürün Keşfi**: Katalogda ürünlere göz at (tedarikçi anonim)
2. **Numune Talebi**: İsteğe bağlı numune isteme
3. **Sipariş Oluşturma**: Miktar seç, sipariş ver
4. **Platform Onayı**: Platform siparişi kontrol eder
5. **Tedarikçi Onayı**: Tedarikçi siparişi kabul/red eder
6. **Üretim/Hazırlık**: Durum güncellemeleri takip edilir
7. **Kargo**: Takip numarası ile kargo izleme
8. **Teslim Alma**: "Teslim Alındı" butonu ile onaylama

#### Tedarikçi Tarafı
1. **Ürün Yayını**: Ürünleri anonim olarak yayınlama
2. **Talep Alma**: Anonim müşteri taleplerini görme
3. **Onay/Red**: Numune ve sipariş taleplerini değerlendirme
4. **Üretim**: Sipariş hazırlama
5. **Kargo Düzenleme**: Kargoya verme
6. **Teslim**: Müşteri onayından sonra ödeme alma (komisyon kesintisi ile)

### 🎯 Kullanım Senaryoları

#### Senaryo 1: Kafe Sahibi Ambalaj Siparişi Veriyor
1. B2B Platform modülüne gir
2. "Sipariş Ver" sekmesinde kal
3. "Ambalaj" kategorisini seç
4. "Kraft Kağıt Bardak" ürününü görüntüle → Tedarikçi: "Tedarikçi A"
5. İstersen önce numune iste
6. Sipariş ver → Platform aracılık yapar
7. Tedarikçi kabul ederse üretim başlar
8. Kargo takibi yap
9. Teslim al → Stoklar otomatik güncellenir

#### Senaryo 2: Kafe Kendi Kahvesini Satmaya Başlıyor
1. B2B Platform modülüne gir
2. "Tedarikçi Panelini Aktifleştir" butonuna tıkla
3. "Tedarikçi Panelim" sekmesi açılır
4. "Yeni Ürün Ekle" butonuna tıkla
5. Ürün bilgilerini doldur (örn: "Organik Arabica Kahve - 250gr")
6. Kategori: Kahve, Min. Sipariş: 10 paket, Fiyat: 85 ₺
7. Numune verilebilir: Evet
8. Ekle ve Yayınla
9. Ürün anonim kod ile yayınlanır
10. Diğer kafeler "Tedarikçi B" olarak görür ve sipariş verir

#### Senaryo 3: Pasta Üreticisi Birden Fazla Kafeye Satış Yapıyor
1. Tedarikçi panelinde birden fazla ürün ekle (Cheesecake, Brownie, San Sebastian)
2. Her ürün için minimum sipariş ve fiyat belirle
3. Siparişler gelince "Müşteri X", "Müşteri Y" şeklinde anonim görürsün
4. Siparişleri onayla, hazırla, kargoya ver
5. Her teslimden %10 komisyon kesilir
6. Net kazancını panelde takip et

### 📈 İstatistikler ve Takip

#### Müşteri İçin
- Toplam ürün sayısı
- Verilen sipariş sayısı
- Bekleyen numune talepleri

#### Tedarikçi İçin
- Yayınlanan ürün sayısı
- Bekleyen siparişler
- Toplam ciro
- Net kazanç (komisyon sonrası)
- Numune talep sayısı

### 🔄 Entegrasyonlar

#### Stok ve Reçete Senkronizasyonu
- Müşteri "Teslim Alındı" dediğinde sipariş edilen ürünler otomatik stok'a eklenir
- Eğer ürün reçetelerde kullanılıyorsa maliyetler otomatik güncellenir
- Menü mühendisliği kar marjları yeniden hesaplanır

### ⚠️ Önemli Notlar
- **Platform Kontrolü**: Tüm işlemler platform kontrolünde gerçekleşir
- **Komisyon Garantisi**: Direkt iletişim engellenerek komisyon kaybı önlenir
- **Rekabet Koruması**: Tedarikçi isimleri gizlenerek piyasa bilgisi korunur
- **Esneklik**: Her kullanıcı hem alıcı hem satıcı olabilir

### 🚀 Gelecek Geliştirmeler İçin Öneriler
1. Tasarım dosyası yükleme ve mockup oluşturma
2. Otomatik fatura kesme sistemi
3. Kargo entegrasyonu (Yurtiçi, MNG, Aras)
4. Takip numarası otomatik sorgulaması
5. Değerlendirme ve yıldız sistemi (anonim)
6. Platform içi mesajlaşma (anonim)
7. Sipariş geçmişi ve tekrar sipariş özelliği
8. Toplu sipariş indirimleri

---

# Önceki Yenilikler - QR Menü ve Tema Özelleştirme

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
