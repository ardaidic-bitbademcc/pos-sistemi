# Test Coverage Dokümantasyonu

## 🧪 Test Altyapısı

### Kurulum Yapıldı
- **Vitest** - Modern ve hızlı test framework
- **React Testing Library** - React component testleri için
- **@testing-library/user-event** - Kullanıcı etkileşimlerini simüle etmek için
- **@vitest/ui** - Test sonuçları için görsel arayüz
- **@vitest/coverage-v8** - Code coverage raporları

## 📝 Test Komutları

```bash
# Testleri çalıştır
npm test

# Test UI'ı aç (tarayıcıda)
npm run test:ui

# Coverage raporu oluştur
npm run test:coverage

# Watch modda testleri çalıştır
npm run test:watch
```

## 📊 Coverage Hedefleri

Proje için belirlenen minimum coverage hedefleri:
- **Lines**: 70%
- **Functions**: 70%
- **Branches**: 70%
- **Statements**: 70%

## 🧪 Oluşturulan Test Dosyaları

### 1. Helper Function Testleri
**Dosya**: `src/lib/__tests__/helpers.test.ts`

Test edilen fonksiyonlar:
- ✅ `formatCurrency` - Para birimi formatlama
- ✅ `formatNumber` - Sayı formatlama
- ✅ `formatDate` - Tarih formatlama
- ✅ `formatDateTime` - Tarih-saat formatlama
- ✅ `formatTime` - Saat formatlama
- ✅ `generateId` - Benzersiz ID üretme
- ✅ `generateSaleNumber` - Satış numarası üretme
- ✅ `calculateTax` - Vergi hesaplama
- ✅ `calculateHoursWorked` - Çalışma saati hesaplama

### 2. UI Component Testleri

#### Button Component
**Dosya**: `src/components/ui/__tests__/button.test.tsx`
- Farklı variant'lar (default, destructive, outline)
- Farklı boyutlar (sm, lg)
- Disabled durumu
- onClick event'leri
- asChild prop ile render

#### Input Component
**Dosya**: `src/components/ui/__tests__/input.test.tsx`
- Farklı input tipleri (text, email, password, number)
- Disabled durumu
- Readonly durumu
- User input handling
- Custom className'ler

#### Numpad Component
**Dosya**: `src/components/__tests__/Numpad.test.tsx`
- Sayı butonları
- Decimal point
- Clear butonu
- Enter/Tamam butonu
- Backspace işlevi

## ⚙️ Test Setup

### Global Setup (`src/test/setup.ts`)
- `@testing-library/jest-dom` matchers
- `window.spark` mock'u (KV store için)
- `matchMedia` mock
- `ResizeObserver` mock
- `IntersectionObserver` mock
- Her test sonrası otomatik cleanup

## 📈 Coverage Raporları

Coverage raporları şu formatlarda oluşturulur:
- **text** - Terminal'de özet
- **json** - JSON formatında detaylı rapor
- **html** - Tarayıcıda görüntülenebilir HTML rapor
- **lcov** - CI/CD araçları için

HTML rapor konumu: `coverage/index.html`

## 🎯 Örnek Test Çalıştırma

```bash
# 1. Bağımlılıkları yükle
npm install

# 2. Testleri çalıştır
npm test

# 3. Coverage raporu oluştur
npm run test:coverage

# 4. HTML raporu tarayıcıda aç
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
start coverage/index.html  # Windows
```

## 🚀 Sonraki Adımlar

### Eklenebilecek Testler

1. **Integration Tests**
   - Module'ler arası etkileşimler
   - Veri akışı testleri

2. **E2E Tests**
   - Kullanıcı senaryoları
   - Tam iş akışı testleri

3. **API Tests**
   - KV store işlemleri
   - Data migration testleri

4. **Performance Tests**
   - Rendering performansı
   - Büyük veri setleri ile testler

### Best Practices

- ✅ Her yeni feature için test yaz
- ✅ Bug fix'lerde önce test, sonra fix
- ✅ Coverage'ı %70'in üzerinde tut
- ✅ Test'leri CI/CD pipeline'a entegre et
- ✅ Test'leri düzenli olarak refactor et

## 🐛 Debugging

Vitest UI kullanarak testleri debug edebilirsiniz:

```bash
npm run test:ui
```

Tarayıcıda açılan arayüzde:
- Test sonuçlarını görüntüle
- Başarısız testleri incele
- Coverage raporu gör
- Testleri tek tek çalıştır

## 📚 Kaynaklar

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
