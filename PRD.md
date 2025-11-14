# Entegre POS Sistemi - Ürün Gereksinimleri Dokümanı

Restoran ve perakende işletmeler için kapsamlı, modern, çoklu şube destekli satış noktası yönetim sistemi.

## Deneyim Nitelikleri

1. **Profesyonel** - İş süreçlerini hızlandıran, güvenilir ve sağlam bir platform
2. **Sezgisel** - Minimum eğitimle kullanılabilen, akıcı iş akışları
3. **Kapsamlı** - Satıştan personel yönetimine, menü optimizasyonundan finansal raporlamaya tüm operasyonları kapsayan

## Karmaşıklık Seviyesi

**Kompleks Uygulama** (gelişmiş işlevsellik, hesaplar) - Bu sistem, çoklu modüller, rol tabanlı erişim, gerçek zamanlı senkronizasyon, AI destekli analizler ve kapsamlı finansal yönetim içeren kurumsal düzeyde bir çözümdür.

## Temel Özellikler

### 0. Kullanıcı Kimlik Doğrulama ve Admin Sistemi
- **İşlevsellik**: E-posta/şifre ile kayıt ve giriş, admin hesabı yönetimi, branch (şube) bağlantısı, rol tabanlı erişim
- **Amaç**: Her admin'in kendi işletmesini bağımsız yönetebilmesini ve birden fazla şube oluşturabilmesini sağlamak
- **Tetikleyici**: Uygulama açılışında veya çıkış yapıldığında
- **Akış**: 
  - **Kayıt**: RegisterLogin ekranı → Kayıt Ol sekmesi → E-posta, şifre, işletme adı, telefon gir → İlk şube bilgileri gir → Kayıt Ol → Otomatik giriş
  - **Giriş**: RegisterLogin ekranı → Giriş Yap sekmesi → E-posta ve şifre gir → Giriş Yap → Şube seçimi (ilk şube otomatik) → Dashboard
  - **Demo Giriş**: "Demo Giriş" butonu ile eski PIN sistemi (test için)
- **Başarı Kriterleri**: 
  - E-posta benzersizliği kontrol edilir
  - Şifre en az 6 karakter olmalı
  - Kayıt sırasında ilk şube otomatik oluşturulur
  - Admin ID ve Branch ID tüm verilere eklenir (opsiyonel, geriye uyumlu)
  - Aynı admin farklı şubeler oluşturabilir
  - Her admin sadece kendi verilerini görür
  - Modern, profesyonel UI/UX (gradient background, icon'lu input'lar)

#### Admin ve Branch ID Sistemi
- **Veri Yapısı Güncellemesi**: 
  - Tüm ana veri tipleri (`Product`, `MenuItem`, `Employee`, `Category`, `Branch`, `SalaryCalculation`) artık `adminId` ve `branchId` (opsiyonel) içerir
  - Geriye uyumluluk için mevcut veriler çalışmaya devam eder
  - Yeni eklenen veriler otomatik olarak mevcut admin ve branch ID'si ile etiketlenir
- **Data Filtreleme**: 
  - Her modül sadece ilgili admin'in ve şubenin verilerini gösterir
  - Çoklu şube desteği için merkezi veri yönetimi
  - Şubeler arası transfer ve senkronizasyon hazırlığı
  - `useBranchFilter` hook'u ile otomatik filtreleme
  - Tüm modüller `authSession` prop'unu alır ve branch bazlı filtreleme yapar

#### Şube İzolasyon Sistemi
- **Merkezi Filtreleme**: 
  - `lib/branch-filter.ts` - Tüm filtreleme mantığını içeren merkezi kütüphane
  - `hooks/use-branch-filter.ts` - React bileşenleri için kolay kullanım hook'u
  - Her veri okuma işleminde otomatik branch bazlı filtreleme
- **Filtreleme Kuralları**:
  - Veri, mevcut admin'e ait olmalı (`adminId === session.adminId`)
  - Veri, mevcut şubeye ait olmalı (`branchId === session.branchId`)
  - adminId/branchId olmayan eski veriler geriye uyumluluk için gösterilir
- **Veri Ekleme**:
  - Tüm yeni veriler otomatik olarak mevcut `adminId` ve `branchId` ile etiketlenir
  - `addItem` fonksiyonu ile branch bilgisi otomatik eklenir
- **Güncelleme ve Silme**:
  - Sadece mevcut admin ve şubeye ait veriler güncellenebilir/silinebilir
  - İzinsiz erişim engellenmiştir

#### Varsayılan Kullanıcılar (Demo Giriş)
- **Admin (PIN: 3010)** - Owner rolü, tüm yetkilere sahip
- **Yönetici (PIN: 1234)** - Manager rolü, kullanıcı yönetimi hariç tüm yetkilere sahip
- **Kasiyer (PIN: 5678)** - Cashier rolü, kasa görüntüleme ve para ekleme yetkisi var
- **Garson (PIN: 9999)** - Waiter rolü, sadece POS erişimi, ödeme alamaz

### 1. POS (Satış Noktası) Modülü
- **İşlevsellik**: Hızlı ürün satışı, masa yönetimi, ödeme işlemleri, ekran klavyesi ile metin ve sayı girişi
- **Amaç**: Kasiyer işlemlerini hızlandırmak, masa bazlı sipariş yönetimi sağlamak, satış verilerini otomatik kaydetmek ve dokunmatik ekranlarda kolay veri girişi
- **Tetikleyici**: Kasiyer masa seçer veya doğrudan ürün ekler
- **Akış**: Masa seç (opsiyonel) → Ürün ara/seç (ekran klavyesi ile) → Sepete ekle → Miktarı ayarla → Ödeme butonlarından birini seç (Nakit/Kart/Mobil) → Tamamla
- **Başarı Kriterleri**: 30 saniye içinde satış tamamlanır, masa durumu otomatik güncellenir, fatura oluşturulur, dokunmatik ekranda kolay veri girişi

#### Numpad ve Klavye Girişi
- **İşlevsellik**: Ekran klavyesi (numpad + Türkçe Q klavye), input alanlarında klavye butonu, modal popup klavye
- **Amaç**: Tablet ve dokunmatik ekranlarda kolay veri girişi, fiziksel klavye olmadan kullanım
- **Tetikleyici**: Input alanının yanındaki klavye ikonu veya input'a tıklama
- **Akış**: Input alanı → Klavye ikonu → Modal açılır → Harfler/Rakamlar sekmesi → Tuşlara tıkla → Tamam
- **Başarı Kriterleri**: 
  - Ürün arama kutusunda ekran klavyesi kullanılabilir
  - İndirim ve tutar girişlerinde sayısal klavye kullanılabilir
  - Misafir sayısı ve miktar girişlerinde sayısal klavye kullanılabilir
  - Türkçe karakterler (ğ, ü, ş, ı, ö, ç) desteklenir
  - Büyük/küçük harf geçişi çalışır
  - Boşluk, silme ve temizleme tuşları çalışır
  - Harfler ve rakamlar arasında kolay geçiş
  - Enter/Tamam ile onaylama

#### Masa Yönetimi
- **İşlevsellik**: Masa durumu takibi (Boş/Dolu/Rezerve), masa kapasitesi görüntüleme, sipariş zamanı takibi, tembel masa uyarıları, masa bölgeleri ile organizasyon
- **Amaç**: Restoran masalarını verimli yönetmek, masa bazlı sipariş takibi ve bölgelere göre düzenli organizasyon
- **Tetikleyici**: Kasiyer/garson masa seçer veya masa durumu değişir
- **Akış**: Masa listesi görüntüle → Masa seç → Sipariş ekle → Kaydet → Masalar ekranına yönlendir → Ödeme al (sadece yetkili kullanıcılar) → Masa otomatik boşalt
- **Başarı Kriterleri**: 
  - Masa durumları gerçek zamanlı güncellenir
  - Sipariş girilmiş masalar amber/turuncu, boş masalar yeşil renkle gösterilir
  - Her masada ilk sipariş zamanı ve son sipariş arası geçen süre görünür
  - Son sipariş dakikası gösterilir
  - Kullanıcı tarafından ayarlanabilir süre sonunda (varsayılan 120 dk) "TEMBEL MASA" uyarısı gösterilir
  - Sipariş kaydedildikten sonra otomatik olarak masalar ekranına yönlendirilir
  - Masalar bölgelere (İç Salon, Dış Mekan, VIP Salon vb.) göre gruplandırılabilir
  - Her bölge kendine özel renk ile görselleştirilir
  - Masa seçim ekranında bölgelere göre organize görünüm sunulur

#### Masa Bölge Yönetimi (Ayarlar Modülünde)
- **İşlevsellik**: Masa bölgeleri oluşturma, düzenleme, silme, aktif/pasif yapma, renklendirme
- **Amaç**: Restoranın fiziksel alanlarını organize etmek, masaları kategorize etmek
- **Tetikleyici**: Yönetici Ayarlar → Masa Yönetimi sekmesine gider
- **Akış**: 
  - **Bölge Oluşturma**: Yeni Bölge → Bölge adı gir (İç Salon, Dış Mekan vb.) → Açıklama ekle → Renk seç → Oluştur
  - **Masa Oluşturma**: Yeni Masa → Masa numarası gir → Kapasite belirle → Bölge seç → Oluştur
  - **Masa Düzenleme**: Masa kartında Düzenle → Bilgileri güncelle → Kaydet
  - **Bölge/Masa Silme**: Sil butonuna tıkla → Onay → (Bölgede/masada işlem yoksa) Silinir
- **Başarı Kriterleri**:
  - Bölgeler renk kodlu olarak görüntülenir
  - Her bölgede kaç masa olduğu gösterilir
  - Masalar bölge renginde vurgulanır
  - Aktif işlem olan masalar silinemez
  - Masaları olan bölgeler silinemez
  - Masa numaraları benzersiz olmalı
  - Masa kapasitesi 1-20 arası seçilebilir

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
- **İşlevsellik**: Çoklu şube yönetimi, şube ekleme/düzenleme/silme, şube seçim ekranı, şubeler arası geçiş, merkezi ürün yönetimi, şubeler arası stok transferi
- **Amaç**: Çok şubeli işletmelerde tutarlılığı sağlamak, merkezi kontrolü güçlendirmek ve admin kullanıcıların birden fazla şube arasında kolayca geçiş yapabilmesini sağlamak
- **Tetikleyici**: Admin şube yönetimine gider, yeni şube ekler veya mevcut şubeyi düzenler; veya şube seçim ekranını açar
- **Akış**: 
  - **Yeni Şube Ekleme**: Şube Yönetimi → Yeni Şube butonu → Şube bilgileri (ad, kod, adres, telefon, e-posta, yönetici) gir → Ekle → Başarı bildirimi
  - **Şube Düzenleme**: Şube kartında Düzenle → Bilgileri güncelle → Güncelle → Başarı bildirimi
  - **Şube Silme**: Şube kartında Sil → Onay → Şube pasif olur → Başarı bildirimi
  - **Şube Geçişi**: Üst menüden şube adı butonuna tıkla → Şube seçim ekranı → Şube kartına tıkla → Seçili şubeye geçiş yap → Dashboard

#### Şube Seçim Ekranı
- **İşlevsellik**: Admin kullanıcıların tüm şubelerini görmesi ve aralarında geçiş yapabilmesi
- **Amaç**: Çoklu şube yönetimini kolaylaştırmak ve hızlı şube değiştirme imkanı sunmak
- **Tetikleyici**: Admin birden fazla şubeye sahipse üst menüde şube butonuna tıklar
- **Akış**: Şube butonu tıkla → Şube seçim ekranı aç → Tüm aktif şubeler grid görünümünde listelenir → İstenen şubeye tıkla → Yeni şubeye geçiş yap → Toast bildirimi
- **Başarı Kriterleri**: 
  - Sadece ilgili admin'in şubeleri görünür
  - Aktif şube işaretli gösterilir
  - Her şube kartında: ad, kod, adres, telefon, yönetici bilgisi görünür
  - Smooth animasyonlar ile modern görünüm
  - Şube yoksa bilgilendirici boş durum mesajı
  - Seçim sonrası authSession güncellenir ve uygulama yeni şubeye göre filtrelenir

#### Şube CRUD İşlemleri
- **İşlevsellik**: Yeni şube ekleme, mevcut şube düzenleme, şube silme (pasif yapma)
- **Amaç**: Admin kullanıcıların işletmelerine şube ekleyip yönetebilmesi
- **Tetikleyici**: Şube yönetimi modülünde "Yeni Şube" butonu veya şube kartında "Düzenle/Sil" butonları
- **Akış**: 
  - **Ekleme**: Dialog aç → Form doldur (ad*, kod*, adres*, telefon*, e-posta, yönetici) → Validasyon → Ekle → Başarı
  - **Düzenleme**: Düzenle butonu → Mevcut bilgiler dolu form → Değiştir → Güncelle → Başarı
  - **Silme**: Sil butonu → Onay dialogu → İsActive = false → Başarı
- **Başarı Kriterleri**: 
  - Zorunlu alanlar (*) doldurulmadan kayıt yapılamaz
  - Her şubeye benzersiz ID atanır
  - AdminId otomatik eklenir
  - CreatedAt ve updatedAt timestamp'leri saklanır
  - Silinen şubeler listeden kalkar ama veri korunur

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
  - Tüm şubeler senkronize çalışır

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

### 5. Cari Hesaplar Modülü
- **İşlevsellik**: Müşteri açık hesapları (cari hesap) yönetimi, kredi limiti kontrolü, hesap ekstreleri, personel otomatik hesap oluşturma
- **Amaç**: Müşterilerin ve personelin veresiye (açık hesap) alışveriş yapmalarını sağlamak, borç/alacak takibi yapmak
- **Tetikleyici**: Kullanıcı cari hesaplar modülünü açar veya POS'ta "Cari Hesap" ödeme yöntemini seçer
- **Akış**: Cari Hesaplar → Yeni hesap ekle → Kredi limiti belirle → POS'ta ödeme al → Hesaba borç ekle → Ödeme al → Borcu azalt
- **Başarı Kriterleri**: 
  - Her müşteri için kredi limiti tanımlanabilir (varsayılan 5000₺)
  - Kredi limiti aşıldığında satış engellenir
  - Tüm işlemler hesap ekstresinde görünür
  - Hesap detaylarında toplam borç, toplam ödeme, mevcut bakiye gösterilir
  - Yeni personel eklendiğinde otomatik cari hesap oluşturulur
  - Mevcut tüm personeller için otomatik cari hesap oluşturulur

#### Hesap Türleri ve Bilgiler
- **İşlevsellik**: Şahıs ve tüzel kişi hesap tanımlama, TC kimlik/vergi numarası ekleme (opsiyonel)
- **Amaç**: Müşteri tipine göre doğru bilgileri toplamak
- **Hesap Tipleri**:
  - **Şahıs**: Bireysel müşteriler için, TC kimlik numarası opsiyonel
  - **Tüzel**: Kurumsal müşteriler için, vergi numarası opsiyonel
- **Zorunlu Alanlar**: Müşteri adı, telefon, kredi limiti
- **Opsiyonel Alanlar**: E-posta, adres, TC kimlik no / vergi no, notlar
- **Başarı Kriterleri**: 
  - Vergi numarası ve TC kimlik numarası zorunlu değil
  - Form geçerli olmadan kayıt yapılamaz
  - Telefon numarası benzersiz olmalı

#### Harcama Limiti Yönetimi
- **İşlevsellik**: Müşteri bazında harcama limiti belirleme, limit kullanım takibi, limit aşım uyarıları
- **Amaç**: Müşteri risk yönetimi ve borç kontrolü
- **Tetikleyici**: Hesap oluşturma/düzenleme veya satış işlemi
- **Akış**: Hesap oluştur/düzenle → Harcama limiti gir → Satış yap → Sistem limit kontrol eder → Limit aşımında işlem reddedilir
- **Başarı Kriterleri**:
  - Varsayılan limit 5000₺
  - Limit düzenlenebilir (0₺ ve üzeri)
  - Mevcut borç limitten fazla olamaz
  - Satış anında anlık limit kontrolü
  - Kullanılabilir limit miktarı görünür
  - Limit aşım durumunda net uyarı

#### Hesap Ekstreleri
- **İşlevsellik**: Tüm işlemlerin tarihsel kayıtları, borç/alacak hareketleri, satış detayları
- **Amaç**: Müşteri hesap geçmişini detaylı görmek
- **İşlem Tipleri**:
  - **Borç (Debit)**: Satış işlemleri - bakiyeyi artırır
  - **Alacak (Credit)**: Ödeme işlemleri - bakiyeyi azaltır
- **Görünen Bilgiler**: İşlem açıklaması, tutar, tarih, fiş numarası, ödeme yöntemi, önceki/sonraki bakiye, notlar
- **Başarı Kriterleri**:
  - İşlemler tarih sırasına göre listelenir (en yeni üstte)
  - Her işlem için bakiye değişimi görünür
  - Satış işlemlerinde fiş numarası gösterilir
  - Ödeme işlemlerinde ödeme yöntemi belirtilir
  - Boş durum mesajı gösterilir

#### POS Entegrasyonu
- **İşlevsellik**: POS ödeme ekranında "Cari Hesap" ödeme yöntemi
- **Amaç**: Kasada hızlı açık hesap satışı yapmak
- **Tetikleyici**: Kasiyer ödeme ekranında "Cari Hesap" butonuna tıklar
- **Akış**: Sepet doldur → Ödeme Al → Cari Hesap seç → Müşteri seç → Limit kontrol → Satış tamamla → Hesaba borç ekle
- **Başarı Kriterleri**:
  - Sadece aktif hesaplar listelenir
  - Her müşteri için kullanılabilir limit görünür
  - Limit yetersiz müşteriler seçilemez
  - Satış sonrası hesap bakiyesi güncellenir
  - Fiş notu ile müşteri bilgisi kaydedilir
  - Başarılı satış sonrası yeni borç miktarı gösterilir

#### Personel Otomatik Hesapları
- **İşlevsellik**: Yeni personel eklendiğinde otomatik cari hesap oluşturma, mevcut personeller için toplu hesap oluşturma
- **Amaç**: Personelin işletmeden veresiye alışveriş yapabilmesini sağlamak
- **Tetikleyici**: Yeni personel eklendiğinde veya uygulama yüklendiğinde
- **Akış**: Personel ekle → Sistem otomatik cari hesap oluşturur → Personel POS'tan alışveriş yapabilir
- **Başarı Kriterleri**:
  - Her aktif personel için cari hesap oluşturulur
  - Personel bilgileri (ad, telefon, e-posta) hesaba aktarılır
  - Varsayılan 5000₺ harcama limiti atanır
  - Hesap tipi "Şahıs" olarak belirlenir
  - Hesap notunda personel rolü belirtilir
  - Personel hesapları düzenlenemez/silinemez
  - İşlem otomatik ve arka planda çalışır

#### Ödeme Alma İşlemleri
- **İşlevsellik**: Müşteri borcunu ödeme alma, kısmi/tam ödeme, ödeme yöntemi seçimi (nakit, kredi kartı, havale, mobil ödeme)
- **Amaç**: Müşteri borçlarını tahsil etmek
- **Tetikleyici**: Hesap listesinde müşteri satırındaki ödeme butonu veya hesap detaylarında "Ödeme Al" butonuna tıklanır
- **Akış**: Ödeme butonuna tıkla → Tutar gir → Ödeme yöntemi seç (nakit/kart/havale/mobil) → İsteğe bağlı not ekle → Onayla → Bakiye güncellenir
- **Başarı Kriterleri**:
  - Ödeme butonu sadece borcu olan müşterilerde görünür
  - Ödeme tutarı mevcut borçtan fazla olamaz
  - Dört ödeme yöntemi: Nakit, Kredi Kartı, Havale, Mobil Ödeme
  - Ödeme yöntemleri icon'larla görsel olarak sunulur (POS ekranındaki gibi)
  - Ödeme notu eklenebilir
  - İşlem ekstrede ödeme yöntemi ile birlikte görünür
  - Başarılı ödeme sonrası bildirim
  - Liste üzerinden hızlı ödeme alma imkanı

#### Hesap Durumları
- **İşlevsellik**: Hesap aktif etme, askıya alma, kapatma
- **Amaç**: Sorunlu hesapları yönetmek
- **Durumlar**:
  - **Aktif**: Normal işlem yapılabilir
  - **Askıda**: Yeni satış yapılamaz, ödeme alınabilir
  - **Kapalı**: Hiçbir işlem yapılamaz
- **Başarı Kriterleri**:
  - Borcu olan hesap kapatılamaz
  - Personel hesapları askıya alınamaz/kapatılamaz
  - Durum değişiklikleri anlık yansır
  - POS'ta sadece aktif hesaplar görünür

#### Dashboard ve Raporlama
- **İşlevsellik**: Toplam harcama limiti, toplam borç, kullanılabilir limit, aktif hesap sayısı göstergeleri
- **Amaç**: Cari hesapları genel durumunu özetlemek
- **Göstergeler**:
  - Toplam Harcama Limiti: Tüm aktif hesapların limitleri toplamı
  - Toplam Borç: Tüm hesapların mevcut borcu
  - Kullanılabilir Limit: Kullanılmayan limit miktarı
  - Aktif Hesaplar: Aktif durumdaki hesap sayısı
- **Başarı Kriterleri**:
  - Göstergeler gerçek zamanlı güncellenir
  - Sadece aktif hesaplar hesaplamaya dahil edilir
  - Görsel ve okunabilir tasarım

### 6. Finans Modülü
- **İşlevsellik**: Gelir-gider takibi, kar-zarar raporu, bütçe planlama, satış tahmini
- **Amaç**: Finansal sağlığı görünür kılmak ve öngörülebilir planlama sağlamak
- **Tetikleyici**: Satış tamamlanır (otomatik gelir), maaş onaylanır (otomatik gider)
- **Akış**: Dashboard → Dönem seç → Gelir/gider raporu görüntüle → Trend analizi → Export
- **Başarı Kriterleri**: Gerçek zamanlı güncellemeler, doğru kar/zarar hesaplaması

### 7. Ayarlar Modülü
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
  - Ürün ekleme ve düzenleme formlarında görsel URL alanı aktif
  - Görsel önizleme özelliği çalışır

#### Ürün Seçenekleri ve Varyantlar
- **İşlevsellik**: Her ürün için özelleştirilebilir seçenekler tanımlama (şeker durumu, boyut, ekstra malzeme vb.), fiyat değişiklikleri uygulama
- **Amaç**: Müşterilerin ürünleri kendi tercihlerine göre özelleştirmelerini sağlamak, ek gelir kaynakları yaratmak
- **Tetikleyici**: Menü mühendisliğinde veya ürün yönetiminde "Seçenek Ekle" butonuna tıklama
- **Akış**: 
  - Ürün oluştur/düzenle → Seçenek Ekle → Seçenek adı gir (örn: "Şeker Durumu") → Zorunlu/Opsiyonel belirle
  - Seçim türü belirle (tekli/çoklu) → Seçim seçenekleri ekle → Her seçeneğe fiyat değişikliği ata
  - POS'ta ürün seçildiğinde → Seçenekler dialog açılır → Müşteri seçim yapar → Fiyat otomatik hesaplanır
  - Seçilen seçenekler sipariş detayında görünür → Fatura ve raporlarda detaylı kayıt tutulur
- **Başarı Kriterleri**:
  - Seçenek ekleme arayüzü sezgisel ve kullanımı kolay
  - Zorunlu seçenekler seçilmeden sipariş tamamlanamaz
  - Çoklu seçim özelliği çalışır (örn: pizzaya birden fazla malzeme)
  - Fiyat değişiklikleri doğru hesaplanır ve toplam fiyata yansır
  - Seçenekler sipariş geçmişinde görünür
  - Seed data'da Türk Kahvesi (şeker durumu) ve Pizza (boyut, ekstra malzeme) örnekleri mevcut
  - KDV hesaplaması seçeneklerle birlikte doğru çalışır

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

### 10. B2B Marketplace Modülü (Gizli Tedarikçi Modeli)
- **İşlevsellik**: Anonimleştirilmiş tedarikçi-müşteri entegrasyonu, ürün katalog yönetimi, komisyon bazlı aracılık, numune talep sistemi, tasarım dosyası yönetimi, otomatik mockup oluşturma, sipariş akış yönetimi, kargo entegrasyonu
- **Amaç**: Kafe/restoran sahiplerinin tedarik ihtiyaçlarını karşılarken tedarikçi isimlerini gizleyerek aracılık komisyonu almak, doğrudan iletişimi engellemek
- **Temel Mantık**: Müşteriler tedarikçi isimlerini değil, sadece ürünleri ve kategorileri görebilir. Tedarikçi "Tedarikçi A", "Tedarikçi B" gibi anonimleştirilmiş kodlarla gösterilir. Sipariş ve iletişim tamamıyla platform üzerinden yapılır. Kafe sahibi hem alıcı hem de (opsiyonel) tedarikçi olabilir.
- **Tetikleyici**: Tedarikçi ürün ekler veya müşteri ürün kataloğuna göz atar
- **Akış**: 
  - **Tedarikçi**: Tedarikçi paneli aç (opsiyonel buton) → Ürün ekle → Min. sipariş adedi, fiyat, numune durumu belirle → Kargo koşulları ayarla → Yayınla → Müşteri talebi gelir (müşteri adı görünmez, sadece "Müşteri X") → Talep onayla/reddet → Tasarım varsa mockup oluştur → Sipariş durumunu güncelle → Kargo takibi → Teslimat
  - **Müşteri**: Ürün kataloğuna göz at → Tedarikçi ismi görünmez, sadece "Tedarikçi A", "Tedarikçi B" vs. → Ürün filtrele (kategori, fiyat, min. sipariş) → Numune talep et → Tasarım yükle (baskılı ürünlerde) → Sipariş oluştur → Platform aracılık yapar → Mockup onayı → Ödeme (platforma) → Takip → Teslim alındı onayla → Platform tedarikçiye ödeme yapar (komisyon kesintisi ile)
- **Başarı Kriterleri**:
  - Tedarikçi isimleri müşterilerden tamamen gizlidir
  - Müşteriler "Tedarikçi A", "Tedarikçi B" gibi kodlarla tedarikçileri görür
  - Tedarikçi paneli varsayılan olarak gizlidir, sadece "Tedarikçi Ol" butonu ile açılır
  - Numune talepleri otomatik iletilir (anonim)
  - Baskılı ürünlerde tasarım dosyası platformdan geçer
  - Tedarikçi onayında sistem otomatik mockup üretir
  - Sipariş durumu e-ticaret akışında güncellenir
  - Kargo entegrasyonu ile sevkiyat yönetimi yapılır
  - Teslim alındığında stoklar otomatik güncellenir
  - Reçetelerdeki alış fiyatları senkronize edilir
  - Platform komisyon oranı ayarlanabilir (varsayılan %10)

#### B2B Kullanıcı Rolleri
- **Tedarikçi (Supplier)**: Ürün ekler, numune taleplerini yönetir (anonim müşteri), siparişleri işler, kargo düzenler. Tedarikçi paneli opsiyonel olarak açılır.
- **Müşteri (Customer)**: Ürünleri görür (tedarikçi ismi gizli), numune talep eder, sipariş verir, tasarım yükler. Varsayılan rol, herkes sipariş verebilir.
- **Hibrit (Hem Müşteri Hem Tedarikçi)**: Kafe sahibi hem ürün sipariş edebilir, hem de kendi ürettiği ürünleri (kahve, pasta vb.) satabilir.

#### Tedarikçi Ürün Yönetimi (Opsiyonel Panel)
- **İşlevsellik**: Ürün katalog oluşturma, min. sipariş adedi, fiyat, numune durumu belirleme, anonim olarak yayınlama, ürün aktif/pasif kontrolü, varyant yönetimi, panel durumu yönetimi
- **Amaç**: Tedarikçilerin ürünlerini detaylı şekilde sunması, müşterilerden kimliklerini gizlemesi, ürün ve panel kontrolünü sağlaması
- **Tetikleyici**: Kullanıcı "Tedarikçi Panelini Aç" butonuna tıklar (ilk kez)
- **Akış**: Tedarikçi panelini aktifleştir → Şirket bilgileri gir (sadece platform için) → Ürün bilgileri gir → Görsel yükle → Min. sipariş adedi belirle → Birim fiyat gir → "Numune Verilebilir" toggle → Baskılı ürün ise işaretle → Kargo koşulları belirle → Varyantlı ürün ise varyantlar ekle → Kaydet → Ürün anonim kodla yayınlanır → İstediğinde ürünleri aktif/pasif yap → Panel durumunu yönet (aktif/duraklatıldı/tatil)
- **Başarı Kriterleri**:
  - Tedarikçi paneli varsayılan olarak kapalıdır
  - Kullanıcı isteğe bağlı olarak tedarikçi panelini aktifleştirir
  - Tüm ürün bilgileri doğru kaydedilir
  - Ürünler müşterilere anonim kod ile gösterilir (örn: "Tedarikçi A")
  - Numune durumu açıkça belirtilir
  - Baskılı/tasarım gerektiren ürünler işaretlenir
  - Kargo koşulları (ücretsiz/alıcı ödemeli) seçilebilir
  - Ürünler tek tıkla aktif/pasif yapılabilir
  - Pasif ürünler müşterilere gösterilmez
  - Varyantlar ayrı ayrı aktif/pasif yapılabilir
  - Varyantlı ürünlerde her varyant için farklı fiyat, stok ve min. sipariş adedi belirlenebilir
  - Panel durumu (aktif/duraklatıldı/tatil) yönetilebilir
  - Duraklatıldı veya tatil modunda yeni sipariş alınamaz
  - Tatil modunda dönüş tarihi belirlenebilir

#### Ürün Varyant Yönetimi
- **İşlevsellik**: Her ürün için çoklu seçenekler (gramaj, boyut vb.) oluşturma, varyanta özel fiyat, stok ve min. sipariş belirleme
- **Amaç**: Aynı ürünün farklı gramaj veya boyutlarını ayrı fiyatlarla satabilme
- **Tetikleyici**: Tedarikçi ürün eklerken "Varyantlı Ürün" seçeneğini aktifleştirir
- **Akış**: Ürün ekle → Varyantlı Ürün toggle'ı aç → Varyant adı gir (örn: "250 gram") → Varyant fiyatı belirle → Stok ve min. sipariş adedi gir → Varyant ekle → Daha fazla varyant ekle → Kaydet → Her varyant müşterilere seçenek olarak gösterilir
- **Başarı Kriterleri**:
  - Varyant ekleme arayüzü kolay kullanılabilir
  - Her varyant için ayrı fiyat, stok ve min. sipariş adedi belirlenebilir
  - Varyantlar müşteri panelinde seçenek olarak listelenir
  - Müşteri sipariş verirken varyant seçebilir
  - Her varyant ayrı ayrı aktif/pasif yapılabilir
  - Pasif varyantlar müşterilere gösterilmez
  - Sipariş detaylarında varyant bilgisi görünür
  - Varyantlı ürünlerde ana ürün fiyatı kullanılmaz, sadece varyant fiyatları geçerlidir
  - Örnek: "Kahve" ürünü için "250gr - 500₺", "500gr - 850₺", "1kg - 1000₺" varyantları

#### Ürün Aktif/Pasif Kontrolü
- **İşlevsellik**: Tedarikçi her ürünü ve varyantı tek tıkla aktif veya pasif yapabilir
- **Amaç**: Stokta olmayan veya satışa kapalı ürünleri geçici olarak gizlemek
- **Tetikleyici**: Tedarikçi ürün listesinde aktif/pasif butonu tıklar
- **Akış**: Ürün listesi → Ürünün yanındaki aktif/pasif butonuna tıkla → Durum anında güncellenir → Pasif ürünler müşteri kataloğundan gizlenir → Aktif yapınca tekrar gösterilir
- **Başarı Kriterleri**:
  - Tek tıkla ürün durumu değiştirilebilir
  - Pasif ürünler müşteri kataloğunda görünmez
  - Aktif ürünler anında müşteri kataloğuna eklenir
  - Varyantlı ürünlerde her varyant ayrı kontrol edilebilir
  - Pasif varyantlar sipariş seçeneklerinde görünmez
  - Ürün durumu badge ile açıkça gösterilir
  - Müşteri sadece aktif ürünleri ve aktif varyantları görebilir

#### Tedarikçi Panel Durumu Yönetimi
- **İşlevsellik**: Tedarikçi panelini tamamen aktif, duraklatılmış veya tatil moduna alma
- **Amaç**: Tedarikçinin geçici olarak sipariş almayı durdurabilmesi, tatil dönemlerini yönetebilmesi
- **Tetikleyici**: Tedarikçi "Durumu Değiştir" butonuna tıklar
- **Akış**: 
  - **Aktif**: Normal şekilde sipariş alınır, tüm ürünler görünür
  - **Duraklatıldı**: Geçici olarak sipariş alınmaz, ürünler müşterilere gösterilmez
  - **Tatil Modu**: Belirli bir tarihe kadar sipariş alınmaz, tatil bitiş tarihi gösterilir → Tarih gir → Tatil modunu aktifleştir
- **Başarı Kriterleri**:
  - Panel durumu kolayca değiştirilebilir
  - Duraklatıldı veya tatil modunda ürünler müşteri kataloğunda görünmez
  - Tatil modunda dönüş tarihi belirlenebilir
  - Tatil bitiş tarihi tedarikçi panelinde görünür
  - Panel durumu badge ile açıkça gösterilir (aktif/duraklatıldı/tatil)
  - Aktif moda döndüğünde ürünler tekrar görünür hale gelir
  - Durum değişiklikleri anında uygulanır

#### Müşteri Ürün Görüntüleme (Anonim Tedarikçi)
- **İşlevsellik**: Ürünleri kategorize ederek listeleme, tedarikçi isimlerini gizleme
- **Amaç**: Müşterilerin ürünleri kolayca keşfetmesi, tedarikçilere doğrudan ulaşamaması
- **Tetikleyici**: Müşteri B2B modülünü açar
- **Akış**: Ürün kataloğu yükle → Kategori filtrele (Ambalaj, Kahve, İçecek, Gıda vb.) → Tedarikçi anonim kodla gösterilir → Ürün seç → Ürün filtrele/ara
- **Başarı Kriterleri**:
  - Tedarikçi isimleri asla gösterilmez
  - Her ürün "Tedarikçi A", "Tedarikçi B" gibi kodlarla işaretlenir
  - Müşteriler direkt iletişim kuramaz
  - Katalog hızlı yüklenir
  - Kategori bazlı filtreleme çalışır

#### Numune Talep Sistemi
- **İşlevsellik**: "Numune İstiyorum" butonu ile talep oluşturma, tedarikçiye bildirim
- **Amaç**: Müşterilerin ürünleri test etmesi için numune süreci başlatma
- **Tetikleyici**: Müşteri ürün detayında "Numune İstiyorum" butonuna tıklar
- **Akış**: Numune talep et → Teslimat adresi gir → Onay → Tedarikçiye bildirim git → Tedarikçi onayla/reddet → Müşteriye bildirim
- **Başarı Kriterleri**:
  - Sadece "numune verilebilir" ürünlerde buton görünür
  - Talep tedarikçiye anında iletilir
  - Onay/red durumu müşteriye bildirilir

#### Tasarım Dosyası Yönetimi
- **İşlevsellik**: Baskılı ürünlerde logo/tasarım dosyası yükleme, tedarikçiye iletim
- **Amaç**: Özel baskılı siparişler için tasarım transferi
- **Tetikleyici**: Müşteri baskılı ürün sipariş ederken
- **Akış**: Sipariş oluştur → Sistem tasarım dosyası iste → Logo/tasarım yükle → Tedarikçiye ilet → Tedarikçi incele ve onayla
- **Başarı Kriterleri**:
  - Dosya yükleme arayüzü kullanıcı dostu
  - Desteklenen formatlar: PNG, JPG, PDF, AI, SVG
  - Dosya tedarikçi panelinde görünür
  - Tasarım onay/red mekanizması çalışır

#### Otomatik Mockup Oluşturma
- **İşlevsellik**: Tedarikçi onayında sistem otomatik mockup üretir ve mail atar
- **Amaç**: Her iki tarafa görsel önizleme sunma
- **Tetikleyici**: Tedarikçi tasarımı onaylar
- **Akış**: Tedarikçi onayla → Sistem mockup oluştur → Mockup'ı müşteri ve tedarikçiye mail at → Her iki taraf da önizle
- **Başarı Kriterleri**:
  - Mockup otomatik oluşturulur
  - E-posta her iki tarafa da gönderilir
  - Mockup kaliteli ve profesyonel görünür

#### Sipariş Akış Yönetimi
- **İşlevsellik**: E-ticaret mantığında sipariş durumu takibi
- **Amaç**: Siparişin her aşamasını şeffaf şekilde göstermek
- **Durumlar**: Onaylandı → Hazırlanıyor → Kargoda → Teslim Edildi / İptal Edildi
- **Tetikleyici**: Tedarikçi durum güncellemesi yapar
- **Akış**: Sipariş oluştur → Tedarikçi onayla → Hazırlanıyor durumuna al → Kargoya ver → Kargoda olarak işaretle → Müşteri teslim aldı butonuna bas → Teslim edildi
- **Başarı Kriterleri**:
  - Her durum değişikliği otomatik bildirim gönderir
  - Müşteri ve tedarikçi aynı durumu görür
  - Zaman damgaları kaydedilir
  - İptal durumunda sebep belirtilir

#### Kargo Entegrasyonu
- **İşlevsellik**: Tedarikçi kargo firması ve koşulları belirler
- **Amaç**: Sevkiyat yönetimini kolaylaştırma
- **Tetikleyici**: Tedarikçi ürün eklerken veya sipariş kargoya verilirken
- **Akış**: Kargo koşulu seç (ücretsiz/alıcı ödemeli) → Kargo firması belirle → Takip numarası gir → Müşteriye ilet
- **Başarı Kriterleri**:
  - Kargo koşulları ürün bazında ayarlanabilir
  - Takip numarası müşteri ile paylaşılır
  - Kargo durumu izlenebilir

#### Stok ve Reçete Senkronizasyonu
- **İşlevsellik**: Teslim alındığında otomatik stok ve maliyet güncelleme
- **Amaç**: Menü mühendisliği ile entegrasyon, otomatik maliyet takibi
- **Tetikleyici**: Müşteri "Teslim Alındı" butonuna basar
- **Akış**: Teslim alındı → Sistem sipariş detaylarını al → Stok güncelle → Reçetelerdeki alış fiyatını güncelle → Kar marjını yeniden hesapla
- **Başarı Kriterleri**:
  - Stok miktarı otomatik artar
  - Alış fiyatı sipariş fiyatına göre güncellenir
  - Reçetelerdeki maliyetler otomatik hesaplanır
  - Menü öğelerinin kar marjı güncellenir

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
