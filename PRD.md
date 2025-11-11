# Entegre POS Sistemi - Ürün Gereksinimleri Dokümanı

Restoran ve perakende işletmeler için kapsamlı, modern, çoklu şube destekli satış noktası yönetim sistemi.

## Deneyim Nitelikleri

1. **Profesyonel** - İş süreçlerini hızlandıran, güvenilir ve sağlam bir platform
2. **Sezgisel** - Minimum eğitimle kullanılabilen, akıcı iş akışları
3. **Kapsamlı** - Satıştan personel yönetimine, menü optimizasyonundan finansal raporlamaya tüm operasyonları kapsayan

## Karmaşıklık Seviyesi

**Kompleks Uygulama** (gelişmiş işlevsellik, hesaplar) - Bu sistem, çoklu modüller, rol tabanlı erişim, gerçek zamanlı senkronizasyon, AI destekli analizler ve kapsamlı finansal yönetim içeren kurumsal düzeyde bir çözümdür.

## Temel Özellikler

### 0. Kullanıcı Kimlik Doğrulama Sistemi
- **İşlevsellik**: 4 haneli PIN kodu ile giriş, role özel dashboard erişimi, güvenli oturum yönetimi
- **Amaç**: Sisteme güvenli erişim sağlamak, her kullanıcının yetkisine göre modülleri görmesini sağlamak
- **Tetikleyici**: Uygulama açılışında veya çıkış yapıldığında
- **Akış**: Login ekranı → 4 haneli PIN gir → Sistem kullanıcıyı doğrular → Rolüne uygun dashboard açılır → Çıkış yap butonu ile oturum sonlanır
- **Başarı Kriterleri**: 
  - Hatalı PIN girişlerinde görsel geri bildirim (kırmızı animasyon ve sallama efekti)
  - Doğru PIN ile 1 saniye içinde dashboard açılır
  - Her kullanıcı sadece yetkili olduğu modülleri görür
  - Çıkış yapınca tekrar login ekranına dönülür
  - Kilit ikonu ile güvenlik hissi veren modern tasarım
  - Numpad ile hızlı ve kolay PIN girişi
  - Demo için test kullanıcıları ekranda gösterilir

#### Varsayılan Kullanıcılar
- **Admin (PIN: 3010)** - Owner rolü, tüm yetkilere sahip
- **Yönetici (PIN: 1234)** - Manager rolü, kullanıcı yönetimi hariç tüm yetkilere sahip
- **Kasiyer (PIN: 5678)** - Cashier rolü, kasa görüntüleme ve para ekleme yetkisi var
- **Garson (PIN: 9999)** - Waiter rolü, sadece POS erişimi, ödeme alamaz

### 1. POS (Satış Noktası) Modülü
- **İşlevsellik**: Hızlı ürün satışı, masa yönetimi, ödeme işlemleri
- **Amaç**: Kasiyer işlemlerini hızlandırmak, masa bazlı sipariş yönetimi sağlamak ve satış verilerini otomatik kaydetmek
- **Tetikleyici**: Kasiyer masa seçer veya doğrudan ürün ekler
- **Akış**: Masa seç (opsiyonel) → Ürün ara/seç → Sepete ekle → Miktarı ayarla → Ödeme butonlarından birini seç (Nakit/Kart/Mobil) → Tamamla
- **Başarı Kriterleri**: 30 saniye içinde satış tamamlanır, masa durumu otomatik güncellenir, fatura oluşturulur

#### Masa Yönetimi
- **İşlevsellik**: Masa durumu takibi (Boş/Dolu/Rezerve), masa kapasitesi görüntüleme, sipariş zamanı takibi, tembel masa uyarıları
- **Amaç**: Restoran masalarını verimli yönetmek ve masa bazlı sipariş takibi
- **Tetikleyici**: Kasiyer/garson masa seçer veya masa durumu değişir
- **Akış**: Masa listesi görüntüle → Masa seç → Sipariş ekle → Kaydet → Masalar ekranına yönlendir → Ödeme al (sadece yetkili kullanıcılar) → Masa otomatik boşalt
- **Başarı Kriterleri**: 
  - Masa durumları gerçek zamanlı güncellenir
  - Sipariş girilmiş masalar amber/turuncu, boş masalar yeşil renkle gösterilir
  - Her masada ilk sipariş zamanı ve son sipariş arası geçen süre görünür
  - Son sipariş dakikası gösterilir
  - Kullanıcı tarafından ayarlanabilir süre sonunda (varsayılan 120 dk) "TEMBEL MASA" uyarısı gösterilir
  - Sipariş kaydedildikten sonra otomatik olarak masalar ekranına yönlendirilir

#### Ödeme Yöntemleri ve Yetkiler
- **İşlevsellik**: Buton bazlı ödeme yöntemi seçimi (Nakit, Kredi Kartı, Mobil Ödeme), rol bazlı yetkilendirme
- **Amaç**: Hızlı ve kolay ödeme işlemi, güvenli ödeme alma yetkisi kontrolü
- **Tetikleyici**: Kasiyer ödeme ekranında ilgili butona tıklar
- **Akış**: Sepeti kontrol et → Ödeme butonlarından birini seç (yetki kontrolü) → Tutarı onayla → Satışı tamamla
- **Başarı Kriterleri**: 
  - Tek tıkla ödeme yöntemi seçimi
  - Garson rolü ödeme alma butonunu göremez/kullanamaz
  - Sadece sipariş kaydedebilir
  - Görsel geri bildirim

### 2. Personel Yönetimi Modülü
- **İşlevsellik**: Vardiya takibi, PIN/QR kod ile giriş-çıkış, özelleştirilebilir maaş hesaplama, maaş onay/red sistemi
- **Amaç**: Personel maliyetlerini optimize etmek, çalışanların kendi vardiyalarını yönetmelerini sağlamak
- **Tetikleyici**: Çalışan PIN veya QR kod ile giriş/çıkış yapar, yönetici maaş hesaplama başlatır
- **Akış**: Personel giriş → PIN/QR kod girişi → Vardiya otomatik başlar/biter → Çalışma saati kaydedilir → Maaş hesaplama → Onay/Red → Finans entegrasyonu
- **Başarı Kriterleri**: Doğru saat hesaplaması, esnek maaş hesaplama ayarları, red nedeni kayıt altına alınması

#### Personel Giriş/Çıkış Sistemi
- **İşlevsellik**: PIN kodu veya QR kod ile self-service vardiya başlatma/bitirme
- **Amaç**: Personelin bağımsız olarak vardiya yönetimi yapabilmesi
- **Tetikleyici**: Personel "Giriş/Çıkış" butonuna tıklar
- **Akış**: Giriş/Çıkış ekranı → PIN veya QR kod gir → Sistem personeli tanır → Aktif vardiya varsa bitir, yoksa başlat → Bildirim göster
- **Başarı Kriterleri**: Hızlı kimlik doğrulama, otomatik vardiya başlat/bitir

#### Maaş Hesaplama Sistemi
- **İşlevsellik**: Özelleştirilebilir hesaplama parametreleri, onaylama/reddetme, red nedeni kaydetme
- **Amaç**: Farklı hesaplama yöntemleri ile esnek maaş yönetimi
- **Tetikleyici**: Yönetici "Yeni Hesaplama" başlatır veya ayarları düzenler
- **Akış**: Personel seç → Dönem belirle → Ayarlara göre hesapla → Detayları göster → Onayla/Reddet → (Reddedilirse) Nedeni gir → Finans kaydı oluştur
- **Başarı Kriterleri**: Çoklu çarpan desteği (mesai, gece, hafta sonu), maaş reddetme seçeneği, detaylı hesaplama raporu

#### Maaş Hesaplama Ayarları
- Standart aylık çalışma saati (varsayılan: 160 saat)
- Mesai çarpanı (varsayılan: 1.5x)
- Gece vardiyası çarpanı (varsayılan: 1.25x)
- Hafta sonu çarpanı (varsayılan: 1.5x)
- Mola süreleri hesaplamaya dahil edilsin/edilmesin seçeneği

### 3. Şube Yönetimi Modülü
- **İşlevsellik**: Çoklu şube senkronizasyonu, merkezi ürün yönetimi, şubeler arası stok transferi
- **Amaç**: Çok şubeli işletmelerde tutarlılığı sağlamak ve merkezi kontrolü güçlendirmek
- **Tetikleyici**: Merkezi yönetici ürün güncellemesi yapar veya stok transferi başlatır
- **Akış**: Merkezi panel → Ürün seç → Şubeleri seç → Fiyat/stok güncelle → Onayla → Tüm şubelere yayınla

#### Stok Transfer Sistemi
- **İşlevsellik**: Şubeler arası ürün stoğu transferi, transfer geçmişi takibi
- **Amaç**: Şubeler arasında stok dengeleme ve verimli stok yönetimi
- **Tetikleyici**: Yönetici "Stok Transferi" butonuna tıklar
- **Akış**: Stok Transferi dialog aç → Gönderen şube seç → Alıcı şube seç → Ürün seç → Transfer miktarı gir → Transfer Et → Başarı bildirimi göster → Transfer geçmişine kaydet
- **Başarı Kriterleri**: 
  - Aynı şubeye transfer engellenmiş olmalı
  - Transfer geçmişi son 5 işlem olarak görüntülenir
  - Her transfer tarih, miktar ve durum bilgisi içerir
  - Transfer edilen ürün ve şube isimleri açıkça gösterilir
- **Başarı Kriterleri**: Tüm şubeler 5 saniye içinde güncellenir, çakışma yok

### 4. Menü Mühendisliği Modülü
- **İşlevsellik**: Reçete yönetimi, fatura girişi, otomatik stok güncelleme, maliyet analizi, AI destekli menü optimizasyonu (tarih aralığı filtreli)
- **Amaç**: Karlılığı artırmak, menü performansını optimize etmek ve stok maliyetlerini doğru takip etmek
- **Tetikleyici**: Aşçıbaşı/müdür reçete oluşturur, fatura girer veya AI analiz başlatır
- **Akış**: 
  - **Reçete Yönetimi**: Menü öğesi seç → Malzeme ekle → Miktar belirle → Porsiyon sayısı gir → Otomatik maliyet hesaplama → Kar marjı görüntüle → Kaydet
  - **Fatura Girişi**: Fatura Gir → Tedarikçi adı → Ürün/Menü öğesi seç → Adet ve birim fiyat → Otomatik stok güncelle → KDV hesapla → Kaydet
  - **AI Analizi**: Menü listesi → Tarih aralığı seç (opsiyonel) → AI analiz başlat → Satış/maliyet verisi analizi → Yıldız/Köpek kategorileme → Öneriler → Uygula
- **Başarı Kriterleri**: 
  - Reçete oluşturulduğunda otomatik porsiyon başı maliyet hesaplanır
  - Fatura girildiğinde stok otomatik güncellenir ve maliyet fiyatları yansır
  - 12 dilimlik cheesecake için 1200 TL fatura girilince, dilim başı 100 TL maliyet otomatik hesaplanır
  - Kar marjı yüzdesi anlık güncellenir
  - Actionable öneriler, kar marjı artışı tahmini
  - Seçilen tarih aralığındaki satış verilerine göre analiz yapılır
  - Tarih aralığı belirtilmezse tüm satış geçmişi kullanılır

#### Reçete Yönetimi
- **İşlevsellik**: Menü öğeleri için detaylı reçete oluşturma, malzeme listesi, porsiyon başı maliyet hesaplama
- **Amaç**: Her menü öğesinin gerçek maliyetini bilmek ve kar marjını optimize etmek
- **Tetikleyici**: Yönetici bir menü öğesi için "Reçete Oluştur" butonuna tıklar
- **Akış**: Menü öğesi seç → Porsiyon sayısı belirle → Malzeme ekle (stoktan seç) → Miktar gir → Otomatik maliyet hesapla → Porsiyon başı maliyet görüntüle → Kar marjı göster → Kaydet
- **Başarı Kriterleri**: 
  - Reçetedeki her malzeme için güncel maliyet fiyatı kullanılır
  - Toplam maliyet ve porsiyon başı maliyet otomatik hesaplanır
  - Kar marjı yüzdesi anlık güncellenir
  - Reçete değiştiğinde menü öğesi maliyeti otomatik güncellenir

#### Fatura Girişi ve Otomatik Stok
- **İşlevsellik**: Satın alma faturası girişi, otomatik stok güncelleme, maliyet fiyatı senkronizasyonu
- **Amaç**: Stok alımlarını kaydetmek ve maliyetleri güncel tutmak
- **Tetikleyici**: Yönetici "Fatura Gir" butonuna tıklar
- **Akış**: 
  - Tedarikçi bilgileri → Ürün/menü öğesi seç → Adet gir → Birim fiyat gir (KDV dahil/hariç) → Toplam hesapla → Kaydet
  - **Örnek 1 (Satın Alınan Ürün)**: Cheesecake 12 adet, 1200 TL → Sistem otomatik hesaplar: 100 TL/adet → Stok +12 adet → Maliyet güncelle
  - **Örnek 2 (Üretilen Ürün)**: Un 50 kg, 2500 TL → Sistem: 50 TL/kg → Stok +50 kg → Reçetelerde otomatik güncelle
- **Başarı Kriterleri**: 
  - Fatura kaydedildiğinde seçilen ürünlerin stok miktarı otomatik artar
  - Birim maliyet fiyatları güncellenir
  - Menü öğeleri için porsiyon başı maliyet otomatik hesaplanır
  - Reçetelerde kullanılan malzemelerin maliyeti güncellenir ve menü kar marjı yeniden hesaplanır
  - KDV tutarı ayrı gösterilir

#### AI Menü Analizi
- **İşlevsellik**: Boston Consulting Group (BCG) matris analizi ile menü öğelerini kategorize etme, tarih aralığı bazlı filtreleme
- **Amaç**: Menü öğelerinin performansını analiz ederek optimizasyon önerileri sunmak
- **Tetikleyici**: Yönetici "AI Analiz" sekmesinde "Analiz Başlat" butonuna tıklar
- **Akış**: 
  - AI Analiz sekmesi → (Opsiyonel) Başlangıç-Bitiş tarihi seç → Analiz Başlat → Satış verilerini filtrele → Popülerlik ve karlılık skorları hesapla → BCG kategorilerine ayır → Sonuçları göster
- **Kategoriler**:
  - **⭐ Yıldız**: Yüksek popülerlik + Yüksek kar marjı → Öne çıkar, upselling yap
  - **🧩 Puzzle**: Düşük popülerlik + Yüksek kar marjı → Fiyat düşür, pazarlamayı artır
  - **🐴 İş Atı**: Yüksek popülerlik + Düşük kar marjı → Maliyetleri optimize et, fiyat artır
  - **🐕 Zayıf**: Düşük popülerlik + Düşük kar marjı → Menüden çıkar, yenile
- **Başarı Kriterleri**: 
  - Tarih aralığı seçilirse sadece o dönemdeki satışlar analiz edilir
  - Tarih aralığı seçilmezse tüm satış geçmişi kullanılır
  - Seçilen tarih aralığında satış yoksa kullanıcı uyarılır
  - Her ürün için satış adedi, ciro, kar, popülerlik skoru gösterilir
  - Seçilen tarih aralığı ekranda görünür
  - "Temizle" butonu ile tarih filtreleri sıfırlanabilir

### 5. Finans Modülü
- **İşlevsellik**: Gelir-gider takibi, kar-zarar raporu, bütçe planlama, satış tahmini
- **Amaç**: Finansal sağlığı görünür kılmak ve öngörülebilir planlama sağlamak
- **Tetikleyici**: Satış tamamlanır (otomatik gelir), maaş onaylanır (otomatik gider)
- **Akış**: Dashboard → Dönem seç → Gelir/gider raporu görüntüle → Trend analizi → Export
- **Başarı Kriterleri**: Gerçek zamanlı güncellemeler, doğru kar/zarar hesaplaması

### 6. Ayarlar Modülü
- **İşlevsellik**: Stok girişi, KDV oranları düzenleme, ödeme yöntemi yönetimi, genel sistem ayarları, tembel masa uyarı süresi özelleştirme
- **Amaç**: Sistem parametrelerini özelleştirmek ve işletme ihtiyaçlarına göre yapılandırmak
- **Tetikleyici**: Yönetici ayarlar modülüne girer
- **Akış**: Ayarlar → Stok/KDV/Ödeme/Genel sekmesi seç → Değişiklik yap → Kaydet → Sistem güncellenir
- **Başarı Kriterleri**: Kolay navigasyon, anlık kaydetme, değişikliklerin tüm modüllere yansıması

#### Stok Yönetimi
- **İşlevsellik**: Manuel stok girişi, stok seviyelerini izleme, düşük stok uyarıları
- **Amaç**: Stok takibini kolaylaştırmak ve eksik ürün durumlarını önlemek
- **Tetikleyici**: Yönetici "Stok Ekle" butonuna tıklar
- **Akış**: Ürün seç → Miktar gir → Onayla → Stok güncellenir
- **Başarı Kriterleri**: Hızlı stok girişi, anlık güncelleme, düşük stok görselleştirmesi

#### KDV Ayarları
- **İşlevsellik**: Çoklu KDV oranı tanımlama, ürünlere KDV atama, varsayılan oran belirleme
- **Amaç**: Farklı KDV oranlarını yönetmek ve ürün bazında özelleştirmek
- **Tetikleyici**: Yönetici "Yeni KDV Ekle" veya ürün KDV'sini değiştirir
- **Akış**: KDV tanımla/düzenle → Ürünlere ata → Varsayılan belirle → Kaydet
- **Başarı Kriterleri**: Esnek KDV yönetimi, toplu atama, satışlara otomatik yansıma

#### Ödeme Yöntemi Yönetimi
- **İşlevsellik**: Ödeme yöntemlerini aktif/pasif yapma, POS ekranında gösterim kontrolü
- **Amaç**: Kullanılmayan ödeme yöntemlerini gizlemek ve kullanıcı deneyimini sadeleştirmek
- **Tetikleyici**: Yönetici bir ödeme yöntemini toggle eder
- **Akış**: Ödeme listesi → Toggle aktif/pasif → POS ekranında güncellenir
- **Başarı Kriterleri**: Anlık güncelleme, POS'ta sadece aktif metodlar görünür

#### Kategori Yönetimi
- **İşlevsellik**: Ürün kategorilerini ekleme, düzenleme, silme ve POS görünürlüğünü kontrol etme
- **Amaç**: Kategorileri organize etmek ve satış ekranında hangi kategorilerin görüneceğini belirlemek
- **Tetikleyici**: Yönetici "Kategori Yönetimi" sekmesine girer
- **Akış**: Kategori listesi → Yeni kategori ekle/düzenle → POS görünürlüğünü toggle et → Otomatik kaydet
- **Başarı Kriterleri**: 
  - Kategoriler POS ekranında anlık olarak görünür/gizli olur
  - "Malzeme" kategorisi varsayılan olarak satış ekranında gizlidir
  - Kategoride ürün varken silme engellenir
  - Her kategori için ürün sayısı görüntülenir

#### Genel Ayarlar
- **İşlevsellik**: Stok uyarıları, otomatik maaş hesaplama, KDV dahil/hariç fiyatlandırma, tembel masa uyarı süresi
- **Amaç**: Sistem davranışlarını özelleştirmek
- **Tetikleyici**: Yönetici "Genel" sekmesine girer
- **Akış**: Ayarlar → Toggle aç/kapat veya değer gir → Otomatik kaydet
- **Başarı Kriterleri**: 
  - Tembel masa uyarı süresi kullanıcı tarafından özelleştirilebilir (varsayılan: 120 dakika)
  - Süre 30-300 dakika arasında ayarlanabilir
  - Değişiklikler masalar ekranında anlık yansır

#### Sistem Teması
- **İşlevsellik**: Uygulamanın genel görünümünü ve renklerini özelleştirme
- **Amaç**: Mağaza sahiplerinin kendi marka kimliklerine uygun bir sistem görünümü oluşturmasını sağlamak
- **Tetikleyici**: Yönetici "Ayarlar" → "Sistem Teması" sekmesine girer
- **Akış**: Tema sekmesi aç → Hazır temalardan birini seç → Tema önizle → Uygula
- **Başarı Kriterleri**: 
  - 6 hazır tema seçeneği (Varsayılan, Profesyonel, Sıcak, Minimal, Karanlık, Doğa)
  - Her tema için renk paleti önizlemesi
  - Tema seçimi ile görsel kimlik değişir
  - Font ailesi tercihi
  - QR Menü teması ayrı olarak yönetilebilir
  
##### Hazır Sistem Temaları
- **Varsayılan**: Modern ve dengeli, yeşil-mavi tonlar, Inter yazı tipi
- **Profesyonel**: İş odaklı ve ciddi, mavi-gri tonlar, düz köşeler
- **Sıcak**: Samimi ve davetkar, turuncu-krem tonlar, yuvarlak köşeler
- **Minimal**: Sade ve şık, siyah-beyaz, keskin hatlar
- **Karanlık**: Göz yormayan, koyu arkaplan, açık mavi vurgular
- **Doğa**: Organik ve ferah, yeşil tonlar, doğal hissiyat

**Not**: Sistem teması şu anda önizleme modundadır. QR Menü tema özelleştirmesi tam çalışır durumdadır.

### 7. QR Menü Modülü
- **İşlevsellik**: Müşterilere yönelik dijital menü görüntüleme, ürün görselleri, otomatik fiyat senkronizasyonu, kampanya gösterimi, tema özelleştirme
- **Amaç**: Müşterilerin masalarında QR kod ile menüye erişmelerini sağlamak, menü mühendisliğindeki değişikliklerin anında yansımasını sağlamak, mağazaya özel görsel kimlik oluşturmak
- **Tetikleyici**: Müşteri masa üzerindeki QR kodu okutarak veya personel QR Menü modülünü açarak
- **Akış**: QR Menü aç → Tüm aktif menü öğelerini görüntüle → Kategori filtrele → Ürün ara → Kampanyalı ürünleri özel göster → Fiyatları canlı senkronize et → Ürün görsellerini göster
- **Başarı Kriterleri**: 
  - Menü mühendisliğinde yapılan fiyat değişiklikleri QR menüde anında görünür
  - Kampanyaya alınan ürünler indirimli fiyatı ve indirim yüzdesi ile gösterilir
  - Kampanya sonlandırılan ürünler normal fiyata döner
  - Pasife alınan ürünler QR menüde otomatik gizlenir
  - Aktife alınan ürünler QR menüde otomatik görünür
  - Kategori bazlı filtreleme ve arama özelliği
  - Tüm değişiklikler manuel güncelleme gerektirmez, gerçek zamanlı senkronizasyon
  - Ürün görselleri (varsa) yüksek kalitede görüntülenir

#### Ürün Görsel Yönetimi
- **İşlevsellik**: Menü öğelerine görsel URL ekleme, QR menüde görselleri gösterme/gizleme
- **Amaç**: Müşterilere ürünleri görsel olarak tanıtmak, menüyü daha çekici hale getirmek
- **Tetikleyici**: Menü mühendisliğinde yeni ürün eklerken veya mevcut ürünü düzenlerken
- **Akış**: Menü öğesi oluştur/düzenle → Görsel URL alanına resim linki gir → Kaydet → QR menüde otomatik gösterilir
- **Başarı Kriterleri**: 
  - Görseller QR menüde yüksek kalitede görüntülenir
  - Görsel yüklenemezse otomatik gizlenir
  - Tema ayarlarından görseller toplu olarak gösterilebilir/gizlenebilir

#### QR Menü Tema Özelleştirme
- **İşlevsellik**: Menü görünümünü mağazaya özel özelleştirme (renkler, yazı tipi, düzen)
- **Amaç**: Her mağazanın kendi görsel kimliğini menüye yansıtmasını sağlamak
- **Tetikleyici**: QR Menü modülünde "Tema Ayarları" butonuna tıklama
- **Akış**: Tema Ayarları aç → Hazır tema seç veya özel renkler belirle → Görünüm ayarlarını düzenle → Müşteri görünümünde önizle → Otomatik kaydet
- **Başarı Kriterleri**: 
  - 4 hazır tema seçeneği (Klasik, Modern, Zarif, Canlı)
  - Ana renk, arkaplan rengi, vurgu rengi özelleştirme
  - Yazı tipi seçimi (Inter, Lora)
  - Görselleri göster/gizle toggle
  - Açıklamaları göster/gizle toggle
  - Izgara veya liste görünüm seçimi
  - Değişiklikler müşteri görünümünde anında yansır
  - Tema ayarları kalıcı olarak saklanır

##### Hazır Temalar
- **Klasik**: Geleneksel ve şık, yeşil tonları, Inter yazı tipi
- **Modern**: Minimalist ve temiz, siyah-beyaz tonlar, turuncu vurgu
- **Zarif**: Lüks ve sofistike, mor tonları, Lora serif yazı tipi
- **Canlı**: Enerjik ve renkli, kırmızı ve yeşil tonlar, Inter yazı tipi

#### Otomatik Senkronizasyon
- **Fiyat Değişiklikleri**: Menü mühendisliği modülünden manuel veya AI önerileri ile yapılan fiyat güncellemeleri QR menüde anında yansır
- **Kampanya Durumu**: Başlatılan kampanyalar özel gösterim ile işaretlenir, sonlandırılanlar normal görünüme döner
- **Ürün Durumu**: Aktif/pasif durumu değişen ürünler otomatik olarak gösterilir/gizlenir
- **Kategori Değişiklikleri**: Yeni kategoriler ve kategori isimleri QR menüde otomatik güncellenir
- **Görsel Değişiklikleri**: Ürün görsellerinde yapılan değişiklikler anında yansır

### 8. Rol Yönetimi ve Yetkilendirme Modülü
- **İşlevsellik**: Kullanıcı rollerine modül erişim yetkileri atama, özel yetkileri yönetme
- **Amaç**: Personelin sadece görevleriyle ilgili modüllere erişmesini sağlamak, veri güvenliğini artırmak
- **Tetikleyici**: Sistem sahibi "Yetki Yönetimi" butonuna tıklar
- **Akış**: Rol seç → Modül yetkilerini işaretle/kaldır → Özel yetkileri aç/kapat → Otomatik kaydet → Tüm kullanıcılara yansır
- **Başarı Kriterleri**: Her rol için ayrı yetki tanımlanabilir, değişiklikler anında uygulanır, garson sadece POS'a erişir

#### Rol Tipleri
- **Sahip (Owner)**: Tüm modüllere tam erişim, değiştirilemez
- **Yönetici (Manager)**: POS, Personel, Şube, Menü, Finans, Raporlama - finansal verileri görebilir
- **Garson (Waiter)**: Sadece POS modülü - finansal verileri göremez, fiyat değiştiremez, **ödeme alma yetkisi yok** (sadece sipariş kaydedebilir)
- **Kasiyer (Cashier)**: POS ve Raporlama - sınırlı finansal görünüm
- **Şef (Chef)**: Menü Mühendisliği - reçete ve malzeme yönetimi
- **Personel (Staff)**: Sınırlı erişim

#### Özel Yetkiler
- **Finansal Verileri Görüntüleme**: Ciro, kar-zarar gibi hassas bilgilere erişim
- **Fiyat Düzenleme**: Ürün fiyatlarını değiştirme yetkisi
- **Kullanıcı Yönetimi**: Personel ekleme/silme/düzenleme yetkisi
- **Ödeme Onaylama**: Maaş ve fatura onaylama yetkisi

### 9. Raporlama Modülü
- **İşlevsellik**: Detaylı satış raporları, şube karşılaştırması, garson performansı, ürün analizi
- **Amaç**: Veri odaklı karar vermeyi desteklemek, performans takibi yapmak
- **Tetikleyici**: Yönetici "Raporlama" modülünü açar
- **Akış**: Rapor türü seç → Tarih aralığı/şube filtrele → Verileri görüntüle → İstatistikleri analiz et
- **Başarı Kriterleri**: Gerçek zamanlı veriler, karşılaştırmalı analizler, görsel performans göstergeleri

#### Şube Karşılaştırma Raporu
- **İşlevsellik**: Haftalık şube satış karşılaştırması (geçen hafta - bu hafta)
- **Gösterimler**:
  - Bu hafta ciro
  - Geçen hafta ciro
  - Tutar farkı (₺)
  - Yüzde farkı (%)
  - Performans durumu (Mükemmel/İyi/Dikkat/Düşük)
- **Başarı Kriterleri**: Şubeler arasında objektif karşılaştırma, trend analizi

#### Garson Satış Raporu
- **İşlevsellik**: Garsonların bireysel satış performansı
- **Gösterimler**:
  - Toplam satış tutarı
  - İşlem sayısı
  - Ortalama sepet tutarı
  - En çok sattığı ürün
  - Performans sıralaması
- **Başarı Kriterleri**: Garson motivasyonu için objektif metrikler, adil performans değerlendirmesi

#### Ürün Satış Raporu
- **İşlevsellik**: En çok satılan ürünler ve satış istatistikleri
- **Gösterimler**:
  - Satılan adet
  - Toplam ciro
  - Ortalama satış fiyatı
  - Kategori bilgisi
  - Popülerlik sıralaması
- **Başarı Kriterleri**: Stok planlaması için veri, menü optimizasyon kararları

### 9. Demo Veri Sistemi
- **İşlevsellik**: Otomatik 1-2 haftalık gerçekçi demo veri oluşturma
- **Amaç**: Sistemi denemek için anlamlı test verileri sağlamak
- **Kapsam**:
  - 3 şube (Kadıköy, Beşiktaş, Üsküdar)
  - 8 çalışan (5 garson dahil)
  - 15+ ürün (11 satılabilir + 4 malzeme)
  - 5 kategori (Malzeme kategorisi POS'ta gizli)
  - 700-1000 satış işlemi (son 14 gün)
  - Gerçekçi satış dağılımı (günde 50-80 işlem)
- **Başarı Kriterleri**: Tüm raporlama ve analiz özellikleri demo veriyle test edilebilir

## İstisna Durumları

- **Çevrimdışı Mod**: Offline satış işlemleri kuyruğa alınır, internet geldiğinde senkronize edilir
- **Stok Yetersizliği**: Satış sırasında uyarı gösterilir, eksi stoka izin verilmez (yetki gerektirir)
- **Fiyat Çakışması**: Çoklu şube güncellemelerinde son güncelleme kazanır, audit log tutar
- **Hatalı Maaş Hesabı**: Onay öncesi düzeltme yapılabilir, onay sonrası revizyon kaydı oluşturulur
- **Yetersiz Yetki**: İşlem reddedilir, yöneticiye bildirim gönderilir

## Tasarım Yönü

Modern, profesyonel ve "Apple'ı andıran minimalist" bir tasarım dili. Karmaşık iş süreçlerini basitleştiren, görsel hiyerarşi ve tipografi ile yönlendiren, veri yoğun ekranlarda bile hava veren bir arayüz. İşlevsellik ön planda ama estetik detaylar marka güvenilirliği inşa eder.

## Renk Seçimi

**Triadic renk şeması** - Profesyonel mavi (güven), enerji veren turuncu (aksiyon), ve dengeleyen mor (premium). Finans ve iş uygulamaları için klasik mavi temel, CTA'lar için turuncu aksan, premium özellikler (AI, raporlar) için mor vurgular.

- **Primary Color (Deep Blue)**: `oklch(0.45 0.15 250)` - Güven, profesyonellik, stabilite. Ana navigasyon, başlıklar, kritik butonlar.
- **Secondary Colors**: 
  - Neutral Gray `oklch(0.65 0.02 250)` - Destekleyici UI elementleri, kartlar, borders
  - Light Background `oklch(0.98 0.005 250)` - Sayfa arka planları, minimal kontrast
- **Accent Color (Vibrant Orange)**: `oklch(0.68 0.18 45)` - CTA butonları, önemli bildirimler, success durumları
- **Foreground/Background Pairings**:
  - Background (Light Gray `oklch(0.98 0.005 250)`): Foreground (`oklch(0.25 0.02 250)`) - Ratio 12.3:1 ✓
  - Card (White `oklch(1 0 0)`): Foreground (`oklch(0.25 0.02 250)`) - Ratio 13.5:1 ✓
  - Primary (Deep Blue `oklch(0.45 0.15 250)`): White text (`oklch(1 0 0)`) - Ratio 7.8:1 ✓
  - Accent (Orange `oklch(0.68 0.18 45)`): Dark text (`oklch(0.25 0.02 250)`) - Ratio 5.2:1 ✓
  - Secondary (Neutral Gray `oklch(0.65 0.02 250)`): Dark text (`oklch(0.25 0.02 250)`) - Ratio 4.6:1 ✓

## Font Seçimi

**Inter** font ailesi - Okunabilirlik, profesyonellik ve modern hissiyat. Sayısal verilerin net görünmesi, tabloların rahat okunması için geometric sans-serif. Variable font teknolojisi ile ağırlık esnekliği.

- **Typographic Hierarchy**:
  - H1 (Modül Başlıkları): Inter SemiBold / 32px / -0.02em letter spacing
  - H2 (Bölüm Başlıkları): Inter SemiBold / 24px / -0.01em letter spacing
  - H3 (Kart Başlıkları): Inter Medium / 18px / normal letter spacing
  - Body (Normal Metin): Inter Regular / 15px / 1.5 line height
  - Caption (Destekleyici Bilgi): Inter Regular / 13px / 1.4 line height / muted color
  - Numbers (Finansal Veriler): Inter Medium / Tabular figures / 16px

## Animasyonlar

**Fonksiyonel ve zarif** - Animasyonlar kullanıcıyı yönlendirmeli, hız hissi vermeli ama dikkat dağıtmamalı. Kartların açılması, modal geçişleri, başarı onayları için 200-300ms smooth easing. Sayısal değerlerde count-up animasyonları (finansal veriler için güven hissi). Page transition'larda fade+slide kombinasyonu.

- **Purposeful Meaning**: Satış tamamlandığında success checkmark animasyonu, stok azaldığında pulse efekti
- **Hierarchy of Movement**: CTA butonları (hover scale), modal açılışları (priority), background updates (subtle fade)

## Bileşen Seçimi

- **Components**: 
  - **Card** - Modül kartları, istatistik panelleri, ürün listesi
  - **Table** - Satış geçmişi, personel listesi, stok tabloları
  - **Dialog** - Satış tamamlama, maaş onaylama, ürün ekleme
  - **Button** - Primary (satış tamamla), Secondary (iptal), Ghost (düzenle)
  - **Input** - Ürün arama, fiyat girişi, personel bilgileri
  - **Select** - Şube seçimi, ödeme yöntemi, dönem seçimi
  - **Badge** - Stok durumu, ödeme durumu, vardiya statüsü
  - **Tabs** - Modüller arası navigasyon
  - **Avatar** - Kullanıcı profili, kasiyer gösterimi
  - **Progress** - Maaş hesaplama, AI analiz ilerlemesi
  
- **Customizations**: 
  - Custom number input with stepper (miktar seçimi)
  - Product grid with image thumbnails
  - Financial chart components (Recharts integration)
  - Real-time notification toasts (Sonner)
  
- **States**: 
  - Buttons: default, hover (subtle scale), active (pressed), disabled (muted)
  - Inputs: default, focus (blue ring), error (red border+text), success (green icon)
  - Cards: default, hover (shadow lift), selected (border highlight)
  
- **Icon Selection**: 
  - @phosphor-icons/react: ShoppingCart (POS), Users (Personel), Buildings (Şube), ForkKnife (Menü), ChartLine (Finans)
  - Plus/Minus (quantity), Trash (remove), Pencil (edit), Check (confirm), X (cancel)
  
- **Spacing**: 
  - Container padding: 6 (24px)
  - Section gap: 4 (16px)
  - Card padding: 5 (20px)
  - Input margin: 2 (8px)
  
- **Mobile**: 
  - Bottom navigation for main modules
  - Stack cards vertically
  - Collapsible tables to detail views
  - Full-screen modals for forms
  - Touch-optimized button sizes (min 44px)
