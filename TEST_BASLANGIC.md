# Test Coverage Başlangıç Rehberi

## 🎯 Hızlı Başlangıç

Test altyapınız hazır! Aşağıdaki adımları izleyin:

### 1️⃣ Bağımlılıkları Yükleyin

```bash
npm install
```

### 2️⃣ İlk Testi Çalıştırın

```bash
# Tüm testleri çalıştır
npm test

# Veya watch modda çalıştır (otomatik yeniden çalışır)
npm run test:watch
```

### 3️⃣ Test UI'ı Açın

```bash
npm run test:ui
```

Tarayıcınızda `http://localhost:51204` adresinde test arayüzü açılacak.

### 4️⃣ Coverage Raporu Oluşturun

```bash
npm run test:coverage
```

## 📂 Oluşturulan Dosyalar

```
pos-sistemi/
├── vitest.config.ts                    # Vitest yapılandırması
├── TEST_COVERAGE.md                    # Detaylı dokümantasyon
├── src/
│   ├── test/
│   │   └── setup.ts                    # Test ortamı setup
│   ├── lib/
│   │   └── __tests__/
│   │       └── helpers.test.ts         # Helper testleri
│   └── components/
│       ├── __tests__/
│       │   └── Numpad.test.tsx        # Numpad testleri
│       └── ui/
│           └── __tests__/
│               ├── button.test.tsx     # Button testleri
│               └── input.test.tsx      # Input testleri
└── package.json                        # Test scriptleri eklendi
```

## 🧪 Eklenen Test Scripts

| Script | Açıklama |
|--------|----------|
| `npm test` | Testleri bir kez çalıştır |
| `npm run test:ui` | Test UI'ı tarayıcıda aç |
| `npm run test:coverage` | Coverage raporu oluştur |
| `npm run test:watch` | Watch modda çalıştır |

## ✅ Örnek Test Çıktısı

Test çalıştırdığınızda göreceğiniz çıktı:

```
 ✓ src/lib/__tests__/helpers.test.ts (15)
   ✓ Helpers - Formatting Functions (6)
     ✓ formatCurrency (3)
     ✓ formatNumber (2)
     ✓ formatDate (2)
   ✓ Helpers - Generation Functions (4)
     ✓ generateId (2)
     ✓ generateSaleNumber (3)
   ✓ Helpers - Calculation Functions (5)
     ✓ calculateTax (3)
     ✓ calculateHoursWorked (4)

 ✓ src/components/ui/__tests__/button.test.tsx (8)
 ✓ src/components/ui/__tests__/input.test.tsx (7)
 ✓ src/components/__tests__/Numpad.test.tsx (6)

Test Files  4 passed (4)
Tests  36 passed (36)
```

## 📊 Coverage Raporu

Coverage raporu şu bilgileri gösterir:

```
File                  | % Stmts | % Branch | % Funcs | % Lines
----------------------|---------|----------|---------|--------
All files             |   75.5  |   68.2   |   82.1  |   75.5
 helpers.ts           |   95.0  |   88.0   |  100.0  |   95.0
 button.tsx           |   88.0  |   75.0   |   90.0  |   88.0
 input.tsx            |   92.0  |   80.0   |  100.0  |   92.0
```

## 🚀 Yeni Test Yazma

### Helper Fonksiyon Testi

```typescript
// src/lib/__tests__/myFunction.test.ts
import { describe, it, expect } from 'vitest';
import { myFunction } from '../myFunction';

describe('myFunction', () => {
  it('should do something', () => {
    expect(myFunction('input')).toBe('expected');
  });
});
```

### Component Testi

```typescript
// src/components/__tests__/MyComponent.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('should render', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should handle click', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    
    render(<MyComponent onClick={onClick} />);
    await user.click(screen.getByRole('button'));
    
    expect(onClick).toHaveBeenCalled();
  });
});
```

## 🎨 Test UI Özellikleri

Test UI'da yapabilecekleriniz:

- 📊 Test sonuçlarını görselleştirme
- 🔍 Başarısız testleri detaylı inceleme
- 📈 Coverage grafiklerini görüntüleme
- ⚡ Tek bir testi çalıştırma
- 🔄 Otomatik yeniden çalıştırma
- 🎯 Test dosyalarını filtreleme

## 💡 İpuçları

1. **Test İsimlendirme**: Test isimlerini açıklayıcı yap
   ```typescript
   it('should calculate tax correctly for 18% rate', () => {})
   ```

2. **Arrange-Act-Assert**: Test yapısını düzenli tut
   ```typescript
   it('should format currency', () => {
     // Arrange
     const amount = 100;
     
     // Act
     const result = formatCurrency(amount);
     
     // Assert
     expect(result).toBe('₺100,00');
   });
   ```

3. **Mock'ları Temizle**: Her test öncesi mock'ları temizle
   ```typescript
   beforeEach(() => {
     vi.clearAllMocks();
   });
   ```

## 🔧 Sorun Giderme

### Testler Çalışmıyor?

```bash
# Cache'i temizle
npm run test -- --clearCache

# Bağımlılıkları yeniden yükle
rm -rf node_modules package-lock.json
npm install
```

### Coverage Raporu Oluşmuyor?

```bash
# Coverage klasörünü temizle
rm -rf coverage
npm run test:coverage
```

## 📚 Daha Fazla Bilgi

- Detaylı dokümantasyon: `TEST_COVERAGE.md`
- Vitest Dokümantasyonu: https://vitest.dev
- React Testing Library: https://testing-library.com/react

---

**Hazırsınız!** 🎉 Testlerinizi çalıştırabilirsiniz.
