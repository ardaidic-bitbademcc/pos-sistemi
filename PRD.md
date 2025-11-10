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
- **İşlevsellik**: Hızlı ürün satışı, stok takibi, fatura oluşturma
- **Amaç**: Kasiyer işlemlerini hızlandırmak ve satış verilerini otomatik kaydetmek
- **Tetikleyici**: Kasiyer "Satış Yap" butonuna tıklar veya barkod okutma
- **Akış**: Ürün ara/seç → Sepete ekle → Miktarı ayarla → Ödeme yöntemini seç → Tamamla → Fatura yazdır
- **Başarı Kriterleri**: 30 saniye içinde satış tamamlanır, stok otomatik güncellenir, gelir kaydı oluşturulur

### 2. Personel Yönetimi Modülü
- **İşlevsellik**: Vardiya planlama, puantaj takibi, maaş hesaplama, izin yönetimi
- **Amaç**: Personel maliyetlerini optimize etmek ve çalışan takibini otomatikleştirmek
- **Tetikleyici**: Çalışan vardiya giriş/çıkış yapar, yönetici maaş hesaplama başlatır
- **Akış**: Vardiya giriş → Çalışma saati takibi → Maaş hesaplama → Onay → Otomatik gider kaydı
- **Başarı Kriterleri**: Doğru maaş hesaplaması, finans modülü ile otomatik entegrasyon

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
