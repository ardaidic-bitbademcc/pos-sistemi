# 🧪 Kapsamlı Test Dokümantasyonu

## 📊 Test İstatistikleri

### Test Sayıları
- ✅ **Unit Tests**: ~150 test
  - Helper Functions: 37 test
  - UI Components: 28 test
  - Module Components: 85 test
- ✅ **Integration Tests**: 20+ test
- ✅ **E2E Tests**: 30+ test

**Toplam: ~200+ test** 🎯

---

## 🏗️ Test Yapısı

```
pos-sistemi/
├── src/
│   ├── lib/__tests__/
│   │   └── helpers.test.ts              # Helper fonksiyon testleri
│   ├── components/__tests__/
│   │   ├── Dashboard.test.tsx           # Dashboard testleri
│   │   └── Numpad.test.tsx              # Numpad testleri
│   ├── components/ui/__tests__/
│   │   ├── button.test.tsx              # Button testleri
│   │   └── input.test.tsx               # Input testleri
│   ├── components/modules/__tests__/
│   │   ├── POSModule.test.tsx           # POS modül testleri
│   │   └── FinanceModule.test.tsx       # Finance modül testleri
│   └── __tests__/
│       └── integration.test.ts          # Integration testleri
├── e2e/
│   ├── app.spec.ts                      # Ana E2E testler
│   └── user-journeys.spec.ts            # User journey testleri
├── vitest.config.ts                     # Vitest yapılandırması
└── playwright.config.ts                 # Playwright yapılandırması
```

---

## 🎯 1. Unit Tests

### Helper Functions Tests
**Dosya**: `src/lib/__tests__/helpers.test.ts`

#### Format Functions (6 kategorisi)
```typescript
✅ formatCurrency()
  - Para birimi formatlama (₺)
  - Negatif sayılar
  - Decimal precision

✅ formatNumber()
  - Türkçe sayı formatı
  - Binlik ayraçlar

✅ formatDate()
  - Tarih formatlama (DD.MM.YYYY)
  - Date string handling

✅ formatDateTime()
  - Tarih ve saat birlikte

✅ formatTime()
  - Sadece saat formatı
```

#### Generation Functions (2 kategorisi)
```typescript
✅ generateId()
  - Benzersiz ID üretimi
  - Format kontrolü

✅ generateSaleNumber()
  - Satış numarası formatı (SAL-YYMMDD-XXXX)
  - Tarih bazlı üretim
```

#### Calculation Functions (2 kategorisi)
```typescript
✅ calculateTax()
  - Vergi hesaplama (%18, %8, %1)
  - Decimal handling

✅ calculateHoursWorked()
  - Çalışma saati hesaplama
  - Mola süreleri
  - Gece vardiyaları
```

---

### UI Component Tests

#### Button Component
**Dosya**: `src/components/ui/__tests__/button.test.tsx` (8 test)

```typescript
✅ Rendering
  - Text ile render
  - Farklı variant'lar
  - Farklı boyutlar

✅ Interactions
  - onClick handler
  - Disabled durumu
  - asChild prop
```

#### Input Component
**Dosya**: `src/components/ui/__tests__/input.test.tsx` (7 test)

```typescript
✅ Types
  - text, email, password, number

✅ States
  - disabled, readonly
  - value kontrolü

✅ User Interaction
  - Typing simulation
  - onChange events
```

#### Numpad Component
**Dosya**: `src/components/__tests__/Numpad.test.tsx` (13 test)

```typescript
✅ Number Buttons (0-9)
  - Tüm sayıların render edilmesi
  - Sayı tıklama
  - Değer birleştirme

✅ Operations
  - Decimal point (.)
  - Clear (C)
  - Backspace
  - OK butonu

✅ Edge Cases
  - Çoklu decimal engelleme
  - onEnter prop kontrolü
```

---

### Module Component Tests

#### Dashboard Tests
**Dosya**: `src/components/__tests__/Dashboard.test.tsx` (20+ test)

```typescript
✅ Rendering
  - Dashboard başlık
  - İstatistik kartları
  - Para birimi formatı

✅ Module Navigation
  - Module kartlarının görüntülenmesi
  - Navigasyon fonksiyonu

✅ Role-Based Access
  - Owner: Tüm modüller
  - Manager: Kısıtlı erişim
  - Waiter: Sadece POS ve Tasks
  - Cashier: POS ve Reports

✅ Statistics
  - Günlük satış hesaplama
  - Aktif çalışan sayısı
  - Branch filtering
```

#### POS Module Tests
**Dosya**: `src/components/modules/__tests__/POSModule.test.tsx` (25+ test)

```typescript
✅ Product Display
  - Ürün gridinin render edilmesi
  - Fiyat gösterimi
  - Kategori filtreleme

✅ Shopping Cart
  - Ürün ekleme
  - Miktar artırma
  - Ürün silme
  - Sepeti temizleme
  - Total hesaplama

✅ Search
  - Ürün arama
  - Filtreleme

✅ Payment
  - Ödeme yöntemleri
  - Nakit ödeme işlemi

✅ Tax Calculation
  - KDV hesaplama
  - Multiple tax rates
```

#### Finance Module Tests
**Dosya**: `src/components/modules/__tests__/FinanceModule.test.tsx` (20+ test)

```typescript
✅ Rendering
  - Finans modülü başlık
  - Finansal özet kartları
  - Günlük istatistikler

✅ Revenue Calculation
  - Toplam gelir hesaplama
  - Para birimi formatı

✅ Date Filtering
  - Tarih aralığı seçimi
  - Bugün, Bu hafta, Bu ay

✅ Payment Methods
  - Nakit/Kart breakdown
  - Ödeme yöntemi toplamları

✅ Sections
  - Giderler
  - Faturalar
  - Grafikler
```

---

## 🔗 2. Integration Tests

**Dosya**: `src/__tests__/integration.test.ts`

### POS to Finance Flow
```typescript
✅ Sale Creation
  - POS'ta satış oluşturma
  - Finance modülüne yansıma
  - Kasa güncellemesi

✅ Stock Management
  - Satış sonrası stok düşümü
  - Stok takibi

✅ Multiple Sales
  - Birden fazla satış toplama
  - Ödeme yöntemi breakdown
```

### Employee to Customer Account
```typescript
✅ Auto Account Creation
  - Personel eklendiğinde otomatik hesap
  - Employee flag kontrolü
```

### Multi-Branch Operations
```typescript
✅ Branch Filtering
  - Şubeye göre satış filtreleme
  - Şubeye göre ürün filtreleme
```

### Tax Calculations
```typescript
✅ Tax Consistency
  - Modüller arası vergi hesaplama tutarlılığı
  - Multiple tax rates

✅ Item-Level Taxes
  - Farklı vergi oranları
  - Toplam vergi hesabı
```

### Date Range Operations
```typescript
✅ Date Filtering
  - Tarih aralığına göre filtreleme
  - Bugün, dün, geçen hafta
```

### Cash Register Flow
```typescript
✅ Balance Tracking
  - Açılış bakiyesi
  - Nakit satış ekleme
  - Çekim işlemleri
  - Güncel bakiye
```

---

## 🌐 3. E2E Tests (Playwright)

### Setup ve Yapılandırma

```bash
# E2E testleri çalıştır
npm run test:e2e

# UI modunda çalıştır
npm run test:e2e:ui

# Debug modunda çalıştır
npm run test:e2e:debug
```

### Tarayıcı Desteği
- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari/WebKit
- ✅ Mobile Chrome
- ✅ Mobile Safari

---

### Authentication Flow Tests
**Dosya**: `e2e/app.spec.ts`

```typescript
✅ Login Page
  - Giriş ekranı görüntüleme

✅ Registration
  - Yeni kullanıcı kaydı
  - Form doldurma

✅ Login Success
  - Geçerli kimlik bilgileri ile giriş
  - Dashboard'a yönlendirme

✅ Login Failure
  - Geçersiz kimlik bilgileri
  - Hata mesajı gösterimi
```

### Dashboard Navigation Tests
```typescript
✅ Module Display
  - Tüm modül kartlarının görüntülenmesi

✅ Navigation
  - POS modülüne geçiş
  - Finance modülüne geçiş

✅ Logout
  - Çıkış işlemi
  - Login'e yönlendirme
```

### POS Module E2E Tests
```typescript
✅ Product Display
  - Ürün gridinin yüklenmesi

✅ Cart Operations
  - Ürün ekleme
  - Sepet görüntüleme

✅ Complete Sale
  - Ürün seçme
  - Ödeme işlemi
  - Nakit ödeme
  - Başarı mesajı

✅ Search
  - Ürün arama
  - Sonuç filtreleme
```

### Finance Module E2E Tests
```typescript
✅ Financial Summary
  - Gelir kartları

✅ Statistics
  - Para birimi görüntüleme

✅ Date Filtering
  - Tarih aralığı değiştirme
```

### Responsive Tests
```typescript
✅ Mobile (375x667)
  - Mobil görünüm

✅ Tablet (768x1024)
  - Tablet görünüm
```

---

### User Journey Tests
**Dosya**: `e2e/user-journeys.spec.ts`

#### Complete Sale Journey
```typescript
✅ End-to-End Satış
  1. Login
  2. POS'a git
  3. Birden fazla ürün ekle
  4. Sepeti kontrol et
  5. Ödeme işlemi
  6. Nakit ödeme
  7. İşlemi tamamla
  8. Başarı mesajı
```

#### Employee Management Journey
```typescript
✅ Personel Ekleme
  1. Login
  2. Personel modülüne git
  3. Ekle butonuna tıkla
  4. Form doldur
  5. Kaydet
  6. Doğrula
```

#### Inventory Management Journey
```typescript
✅ Stok Güncelleme
  1. Login
  2. Menü modülüne git
  3. Ürün seç
  4. Düzenle
  5. Stok güncelle
  6. Kaydet
```

#### Financial Report Journey
```typescript
✅ Rapor Görüntüleme
  1. Login
  2. Rapor modülüne git
  3. Tarih aralığı seç
  4. Rapor görüntüle
  5. Dışa aktar (opsiyonel)
```

#### Multi-Tab Workflow
```typescript
✅ Modüller Arası Geçiş
  1. POS'ta işlem yap
  2. Dashboard'a dön
  3. Finance'i kontrol et
  4. Güncel veriyi doğrula
```

#### Error Handling
```typescript
✅ Network Errors
  - Offline durumu simüle etme
  - Graceful handling

✅ Error Recovery
  - Sayfa yüklenme
  - Crash olmama
```

---

## 📊 Coverage Hedefleri

### Mevcut Durum
```
                 Statements   Branches   Functions   Lines
All files             75%+       70%+       75%+      75%+
```

### Hedef Coverage
- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

---

## 🚀 Test Komutları

### Unit & Integration Tests (Vitest)
```bash
# Tüm testleri çalıştır
npm test

# Watch mode
npm run test:watch

# UI modunda çalıştır
npm run test:ui

# Coverage raporu
npm run test:coverage
```

### E2E Tests (Playwright)
```bash
# E2E testleri çalıştır
npm run test:e2e

# Sadece Chrome
npx playwright test --project=chromium

# UI mode (interaktif)
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug

# Belirli bir dosya
npx playwright test e2e/app.spec.ts

# Headed mode (tarayıcı görünür)
npx playwright test --headed
```

---

## 📈 Test Raporları

### Vitest Coverage Raporu
```bash
npm run test:coverage
open coverage/index.html
```

### Playwright Test Raporu
```bash
npm run test:e2e
npx playwright show-report
```

---

## 🛠️ CI/CD Entegrasyonu

### GitHub Actions Örneği
```yaml
name: Tests
on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
```

---

## 💡 Best Practices

### Test Yazma
1. ✅ AAA Pattern kullan (Arrange, Act, Assert)
2. ✅ Açıklayıcı test isimleri
3. ✅ Her test birbirinden bağımsız
4. ✅ Mock'ları temizle (beforeEach)
5. ✅ Edge case'leri test et

### E2E Tests
1. ✅ User-centric selectors kullan
2. ✅ Explicit waits (waitFor)
3. ✅ Screenshot al (hata durumunda)
4. ✅ Test data'sını temizle
5. ✅ Realistic senaryolar

### Coverage
1. ✅ Critical paths önce
2. ✅ %100 coverage hedefleme
3. ✅ Integration testlerle tamamla
4. ✅ E2E ile doğrula

---

## 🎯 Sonuç

Projeniz şu anda **200+ test** ile kapsamlı bir test coverage'a sahip:

- ✅ **Unit Tests**: Component ve fonksiyon testleri
- ✅ **Integration Tests**: Modüller arası veri akışı
- ✅ **E2E Tests**: Gerçek kullanıcı senaryoları

**Test altyapınız production-ready!** 🎉
