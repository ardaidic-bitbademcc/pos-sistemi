# Cari Hesaplar (Customer Accounts) - Özellik Dokümantasyonu

## Genel Bakış

Bu güncellemede, işletmelerin müşterilerine ve personeline açık hesap (veresiye) satış yapabilmesini sağlayan kapsamlı bir **Cari Hesaplar** sistemi eklenmiştir.

## Yeni Özellikler

### 1. Cari Hesap Modülü (`CustomerAccountModule.tsx`)

Müşteri hesaplarını yönetmek için tam özellikli bir modül:

#### Temel Özellikler:
- ✅ Müşteri hesabı oluşturma (Şahıs/Tüzel)
- ✅ Kredi limiti yönetimi (varsayılan: 5000₺)
- ✅ Hesap durumu kontrolü (Aktif/Askıda/Kapalı)
- ✅ TC Kimlik / Vergi Numarası (opsiyonel)
- ✅ İletişim bilgileri (telefon, e-posta, adres)
- ✅ Hesap ekstreleri ve işlem geçmişi
- ✅ Ödeme alma işlemleri
- ✅ Borç/Alacak takibi
- ✅ Dashboard özet göstergeleri

#### Hesap Bilgileri:
```typescript
- Hesap Numarası: CA-YYMM-XXXXX (otomatik)
- Müşteri Adı: Zorunlu
- Hesap Tipi: Şahıs / Tüzel
- Telefon: Zorunlu
- E-posta: Opsiyonel
- TC Kimlik No: Opsiyonel (Şahıs için)
- Vergi Numarası: Opsiyonel (Tüzel için)
- Kredi Limiti: Varsayılan 5000₺
- Adres: Opsiyonel
- Notlar: Opsiyonel
```

#### Hesap Ekstreleri:
- Tüm borç/alacak hareketleri
- Satış işlemleri (Fiş numarası ile)
- Ödeme işlemleri (Ödeme yöntemi ile)
- Her işlem için önceki/sonraki bakiye
- Tarih ve saat bilgisi
- İşlem notları

### 2. POS Entegrasyonu

Satış noktasında cari hesaba satış yapma özelliği:

#### Nasıl Kullanılır:
1. POS'ta sepeti doldurun
2. "Ödeme Al" butonuna tıklayın
3. "Cari Hesap (Açık Hesap)" butonunu seçin
4. Müşteri listesinden seçim yapın
5. Kredi limiti kontrolü otomatik yapılır
6. Satış tamamlanır ve hesaba borç eklenir

#### Özellikler:
- ✅ Sadece aktif hesaplar görünür
- ✅ Her müşteri için kullanılabilir kredi gösterilir
- ✅ Limit yetersiz müşteriler seçilemez
- ✅ Satış sonrası yeni borç miktarı gösterilir
- ✅ Masa satışları desteklenir
- ✅ İndirim uygulamaları desteklenir

### 3. Otomatik Personel Hesapları

Personel ekleme sistemi ile entegre otomatik hesap oluşturma:

#### Çalışma Prensibi:
- Her yeni personel eklendiğinde otomatik cari hesap oluşturulur
- Mevcut tüm personeller için de otomatik hesap oluşturulur
- Personel bilgileri hesaba aktarılır
- Varsayılan 5000₺ kredi limiti atanır
- Hesap notunda "Personel - [Rol]" bilgisi eklenir

#### Hook: `use-auto-employee-accounts.ts`
```typescript
- Arka planda çalışır
- useEffect ile otomatik tetiklenir
- Duplicate hesap oluşturmaz
- Sadece aktif personeller için çalışır
```

### 4. Yeni Veri Yapıları

#### `CustomerAccount` Type:
```typescript
{
  id: string;
  accountNumber: string;
  customerName: string;
  accountType: 'individual' | 'corporate';
  taxNumber?: string;
  identityNumber?: string;
  email?: string;
  phone: string;
  address?: string;
  creditLimit: number;
  currentBalance: number;
  totalDebt: number;
  totalPaid: number;
  status: 'active' | 'suspended' | 'closed';
  createdAt: string;
  isEmployee?: boolean;
  employeeId?: string;
  notes?: string;
}
```

#### `CustomerTransaction` Type:
```typescript
{
  id: string;
  customerAccountId: string;
  type: 'debit' | 'credit';
  amount: number;
  description: string;
  saleId?: string;
  saleNumber?: string;
  paymentMethod?: PaymentMethod;
  date: string;
  createdBy: string;
  createdByName: string;
  balanceBefore: number;
  balanceAfter: number;
  notes?: string;
}
```

## Teknik Detaylar

### Yeni Dosyalar:
1. `/src/components/modules/CustomerAccountModule.tsx` - Ana cari hesap modülü
2. `/src/hooks/use-auto-employee-accounts.ts` - Otomatik personel hesabı hook'u
3. `/src/lib/types.ts` - Güncellendi (CustomerAccount ve CustomerTransaction eklendi)
4. `/src/lib/helpers.ts` - Güncellendi (generateAccountNumber eklendi)

### Güncellenen Dosyalar:
1. `/src/App.tsx` - CustomerAccountModule import ve routing eklendi
2. `/src/components/Dashboard.tsx` - Cari hesaplar kartı eklendi
3. `/src/components/modules/POSModule.tsx` - Cari hesap ödeme entegrasyonu
4. `/PRD.md` - Cari hesaplar dokümantasyonu eklendi

### State Management:
- `customerAccounts` - KV storage ile persist edilir
- `customerTransactions` - KV storage ile persist edilir
- Otomatik personel hesapları useEffect ile yönetilir

## Mobil Optimizasyonlar

Tüm bileşenler mobil uyumlu tasarlandı:

### Responsive Design:
- ✅ Grid sistemleri (1/2/3/4 kolonlar)
- ✅ Text boyutları (xs/sm/base/lg/xl)
- ✅ Button boyutları (sm için optimize)
- ✅ Dialog genişlikleri (max-w-[95vw] mobilde)
- ✅ Table overflow (horizontal scroll)
- ✅ Hidden kolonlar (sm:table-cell, md:table-cell, lg:table-cell)
- ✅ Flexible padding (p-2 sm:p-4)
- ✅ Gap ayarlamaları (gap-2 sm:gap-4)

### Mobile-First Patterns:
```css
- Breakpoints: sm (640px), md (768px), lg (1024px)
- Touch targets: minimum 44x44px
- Readable text: 14px+ on mobile
- Scrollable sections: max-height with ScrollArea
- Truncate uzun metinler
```

## Kullanım Senaryoları

### Senaryo 1: Yeni Müşteri Hesabı
1. "Cari Hesaplar" modülüne git
2. "Yeni Hesap" butonuna tıkla
3. Form doldur (müşteri adı, telefon zorunlu)
4. Kredi limiti belirle (varsayılan 5000₺)
5. "Oluştur" - Hesap aktif edilir

### Senaryo 2: Açık Hesap Satışı
1. POS'ta ürünleri ekle
2. "Ödeme Al" → "Cari Hesap"
3. Müşteri seç (kullanılabilir kredi görünür)
4. Limit kontrolü geçerse satış tamamla
5. Hesaba borç otomatik eklenir

### Senaryo 3: Müşteri Ödemesi
1. Cari hesaplar listesinde müşteriyi bul
2. "Detay" butonuna tıkla
3. "Ödeme Al" butonuna tıkla
4. Tutar gir, ödeme yöntemi seç
5. Onayla - Borç azalır

### Senaryo 4: Personel Alışverişi
1. Personel Yönetimi'nden yeni personel ekle
2. Sistem otomatik cari hesap oluşturur
3. Personel POS'tan alışveriş yapabilir
4. Cari hesaptan ödeme alınır
5. Maaş kesintisi veya nakit ödeme

## Güvenlik ve Validasyon

### Kontroller:
- ✅ Kredi limiti aşımı engellenir
- ✅ Borcu olan hesap kapatılamaz
- ✅ Personel hesapları silinemez
- ✅ Negatif tutarlar engellenir
- ✅ Ödeme mevcut borçtan fazla olamaz
- ✅ Sadece aktif hesaplara satış yapılır
- ✅ Telefon numarası gereklidir

### Hata Mesajları:
```typescript
- "Kredi limiti aşılıyor!"
- "Geçerli bir tutar girin"
- "Müşteri adı ve telefon zorunludur"
- "Bu hesap aktif değil"
- "Ödeme tutarı bakiyeden fazla olamaz"
- "Borcu olan hesap silinemez"
```

## Dashboard Metrikleri

```typescript
- Toplam Kredi Limiti: Tüm aktif hesapların limitleri
- Toplam Borç: Mevcut toplam borç
- Kullanılabilir Kredi: Limit - Borç
- Aktif Hesaplar: Aktif durumdaki hesap sayısı
```

## İleri Seviye Özellikler (Gelecek Sürümler İçin)

Potansiyel geliştirmeler:
- [ ] Vade takibi ve gecikme faizi
- [ ] Otomatik SMS/E-posta borç bildirimi
- [ ] Toplu tahsilat raporu
- [ ] Müşteri risk skoru
- [ ] Ödeme planı oluşturma
- [ ] Excel/PDF dışa aktarma
- [ ] Hesap özeti yazdırma
- [ ] Çek/Senet takibi

## Test Senaryoları

### Manuel Test Checklist:
- [ ] Yeni şahıs hesabı oluştur
- [ ] Yeni tüzel hesap oluştur
- [ ] Personel ekle (otomatik hesap kontrolü)
- [ ] POS'tan cari hesaba satış yap
- [ ] Limit aşımı dene (reddedilmeli)
- [ ] Ödeme al
- [ ] Hesap ekstresini kontrol et
- [ ] Hesabı askıya al
- [ ] Askıdaki hesaba satış dene (reddedilmeli)
- [ ] Mobil görünümü test et
- [ ] Tablet görünümü test et

## Performans

### Optimizasyonlar:
- KV storage kullanımı (client-side persistence)
- Lazy loading ile büyük listeler
- Memoization ile gereksiz render'lar önlenir
- Debounce ile search optimizasyonu
- Virtual scrolling (gelecekte eklenebilir)

## Sonuç

Cari Hesaplar modülü, POSACA sistemine kritik bir B2B/B2C özellik kazandırır. Müşteri sadakati artırır, nakit akışını yönetmeyi kolaylaştırır ve personel alışverişlerini sistematik hale getirir.
