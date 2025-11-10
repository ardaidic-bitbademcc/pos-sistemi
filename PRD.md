# Entegre POS Sistemi - Ürün Gereksinimleri Dokümanı

Restoran ve perakende işletmeler için kapsamlı, modern, çoklu şube destekli satış noktası yönetim sistemi.

## Deneyim Nitelikleri

1. **Profesyonel** - İş süreçlerini hızlandıran, güvenilir ve sağlam bir platform
2. **Sezgisel** - Minimum eğitimle kullanılabilen, akıcı iş akışları
3. **Kapsamlı** - Satıştan personel yönetimine, menü optimizasyonundan finansal raporlamaya tüm operasyonları kapsayan

## Karmaşıklık Seviyesi

**Kompleks Uygulama** (gelişmiş işlevsellik, hesaplar) - Bu sistem, çoklu modüller, rol tabanlı erişim, gerçek zamanlı senkronizasyon, AI destekli analizler ve kapsamlı finansal yönetim içeren kurumsal düzeyde bir çözümdür.

## Temel Özellikler

### 1. POS (Satış Noktası) Modülü
- **İşlevsellik**: Hızlı ürün satışı, masa yönetimi, ödeme işlemleri
- **Amaç**: Kasiyer işlemlerini hızlandırmak, masa bazlı sipariş yönetimi sağlamak ve satış verilerini otomatik kaydetmek
- **Tetikleyici**: Kasiyer masa seçer veya doğrudan ürün ekler
- **Akış**: Masa seç (opsiyonel) → Ürün ara/seç → Sepete ekle → Miktarı ayarla → Ödeme butonlarından birini seç (Nakit/Kart/Mobil) → Tamamla
- **Başarı Kriterleri**: 30 saniye içinde satış tamamlanır, masa durumu otomatik güncellenir, fatura oluşturulur

#### Masa Yönetimi
- **İşlevsellik**: Masa durumu takibi (Boş/Dolu/Rezerve), masa kapasitesi görüntüleme
- **Amaç**: Restoran masalarını verimli yönetmek ve masa bazlı sipariş takibi
- **Tetikleyici**: Kasiyer masa seçer veya masa durumu değişir
- **Akış**: Masa listesi görüntüle → Masa seç → Sipariş ekle → Ödeme al → Masa otomatik boşalt
- **Başarı Kriterleri**: Masa durumları gerçek zamanlı güncellenir, müşteri sayısı görünür

#### Ödeme Yöntemleri
- **İşlevsellik**: Buton bazlı ödeme yöntemi seçimi (Nakit, Kredi Kartı, Mobil Ödeme)
- **Amaç**: Hızlı ve kolay ödeme işlemi
- **Tetikleyici**: Kasiyer ödeme ekranında ilgili butona tıklar
- **Akış**: Sepeti kontrol et → Ödeme butonlarından birini seç → Tutarı onayla → Satışı tamamla
- **Başarı Kriterleri**: Tek tıkla ödeme yöntemi seçimi, görsel geri bildirim

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
- **İşlevsellik**: Çoklu şube senkronizasyonu, merkezi ürün yönetimi, şubeler arası transfer
- **Amaç**: Çok şubeli işletmelerde tutarlılığı sağlamak ve merkezi kontrolü güçlendirmek
- **Tetikleyici**: Merkezi yönetici ürün güncellemesi yapar
- **Akış**: Merkezi panel → Ürün seç → Şubeleri seç → Fiyat/stok güncelle → Onayla → Tüm şubelere yayınla
- **Başarı Kriterleri**: Tüm şubeler 5 saniye içinde güncellenir, çakışma yok

### 4. Menü Mühendisliği Modülü
- **İşlevsellik**: Reçete yönetimi, maliyet analizi, AI destekli menü optimizasyonu
- **Amaç**: Karlılığı artırmak ve menü performansını optimize etmek
- **Tetikleyici**: Aşçıbaşı/müdür AI analiz başlatır
- **Akış**: Menü listesi → AI analiz başlat → Satış/maliyet verisi analizi → Yıldız/Köpek kategorileme → Öneriler → Uygula
- **Başarı Kriterleri**: Actionable öneriler, kar marjı artışı tahmini

### 5. Finans Modülü
- **İşlevsellik**: Gelir-gider takibi, kar-zarar raporu, bütçe planlama, satış tahmini
- **Amaç**: Finansal sağlığı görünür kılmak ve öngörülebilir planlama sağlamak
- **Tetikleyici**: Satış tamamlanır (otomatik gelir), maaş onaylanır (otomatik gider)
- **Akış**: Dashboard → Dönem seç → Gelir/gider raporu görüntüle → Trend analizi → Export
- **Başarı Kriterleri**: Gerçek zamanlı güncellemeler, doğru kar/zarar hesaplaması

### 6. Ayarlar Modülü
- **İşlevsellik**: Stok girişi, KDV oranları düzenleme, ödeme yöntemi yönetimi, genel sistem ayarları
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
