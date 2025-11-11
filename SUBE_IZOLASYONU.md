# Şube İzolasyonu ve Veri Filtreleme Sistemi

## Genel Bakış

Bu sistem, her şubenin verilerinin tamamen izole edilmesini ve yalnızca ilgili admin ve şubeye ait verilerin görüntülenmesini sağlar.

## Temel Kavramlar

### 1. AuthSession (Kimlik Doğrulama Oturumu)
```typescript
interface AuthSession {
  adminId: string;      // İşletme sahibinin benzersiz kimliği
  branchId: string;     // Mevcut şubenin benzersiz kimliği
  userRole: UserRole;   // Kullanıcı rolü (owner, manager, cashier, vb.)
  userName: string;     // Kullanıcı adı
  loginTime: string;    // Giriş zamanı
}
```

### 2. Branch Filterable Data (Şubeye Göre Filtrelenebilir Veri)
Tüm ana veri tipleri artık şu alanları içerir:
```typescript
interface BranchFilterableItem {
  adminId?: string;   // Bu verinin sahibi olan admin
  branchId?: string;  // Bu verinin ait olduğu şube
}
```

## Veri Filtreleme Mantığı

### Filtre Kuralları
1. **Admin Uyumluluğu**: Veri, mevcut admin'e ait olmalı (`adminId === session.adminId`)
2. **Şube Uyumluluğu**: Veri, mevcut şubeye ait olmalı (`branchId === session.branchId`)
3. **Geriye Uyumluluk**: `adminId` ve `branchId` olmayan eski veriler görüntülenir

### Filtreleme Fonksiyonları

#### `filterByBranch<T>(items, session)`
Hem admin hem de şube bazında filtreleme yapar.
```typescript
// Kullanım örneği
const filteredProducts = filterByBranch(allProducts, authSession);
```

#### `filterByAdminOnly<T>(items, session)`
Yalnızca admin bazında filtreleme yapar (tüm şubeler dahil).
```typescript
// Kullanım örneği - şube yönetimi için
const adminBranches = filterByAdminOnly(allBranches, authSession);
```

## Kullanım Kılavuzu

### Hook ile Kullanım (Önerilen)

```typescript
import { useBranchFilter } from '@/hooks/use-branch-filter';

function MyComponent({ authSession }: { authSession: AuthSession | null }) {
  const [products] = useKV<Product[]>('products', []);
  
  // Otomatik filtreleme
  const { 
    filteredItems,        // Filtrelenmiş ürünler
    addItem,             // Yeni ürün eklerken branch bilgisi ekler
    updateItem,          // Güncelleme yaparken branch bilgisi korur
    isOwnedByCurrentBranch  // Bir ögenin mevcut şubeye ait olup olmadığını kontrol eder
  } = useBranchFilter(products, authSession);

  // Yeni ürün ekleme
  const handleAddProduct = () => {
    const newProduct = addItem({
      id: generateId(),
      name: 'Yeni Ürün',
      // ... diğer alanlar
    });
    setProducts([...products, newProduct]);
  };

  return (
    <div>
      {filteredItems.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}
```

### Manuel Kullanım

```typescript
import { createBranchManager } from '@/lib/branch-filter';

const manager = createBranchManager<Product>(authSession);

// Filtreleme
const filtered = manager.filter(allProducts);

// Yeni öğe ekleme
const newProduct = manager.addBranchInfo({
  id: 'prod-123',
  name: 'Ürün',
  // ... diğer alanlar
});

// Güncelleme
const updated = manager.update(allProducts, modifiedProduct);

// Silme
const remaining = manager.remove(allProducts, 'prod-123');
```

## Module Props Pattern

Tüm modüller artık `authSession` prop'unu alır:

```typescript
interface ModuleProps {
  onBack: () => void;
  authSession?: AuthSession | null;
}

export default function MyModule({ onBack, authSession }: ModuleProps) {
  const [data] = useKV<DataType[]>('dataKey', []);
  const { filteredItems } = useBranchFilter(data, authSession);
  
  // filteredItems kullan
}
```

## Güncellenen Modüller

### ✅ Tamamlanan
1. **Dashboard** - Satışlar, çalışanlar ve ürünler için branch filtreleme aktif
2. **Branch Filter Library** - Merkezi filtreleme sistemi oluşturuldu
3. **useBranchFilter Hook** - Kolay kullanım için React hook

### 🔄 Güncellenmesi Gerekenler
1. **POSModule** - Satışlar, masalar, menü öğeleri
2. **PersonnelModule** - Çalışanlar, vardiyalar
3. **MenuModule** - Menü öğeleri, tarifler, ürünler
4. **FinanceModule** - Faturalar, gelir-gider
5. **SettingsModule** - Kategoriler, ödeme yöntemleri
6. **ReportsModule** - Tüm raporlar
7. **RoleManagementModule** - Rol izinleri
8. **CashModule** - Kasa hareketleri
9. **QRMenuModule** - QR menü öğeleri
10. **TaskManagementModule** - Görevler
11. **B2BModule** - B2B siparişler (özel durum - tedarikçiler global)
12. **CustomerAccountModule** - Cari hesaplar

## Veri Tipleri ve Branch Desteği

### Tam Branch Desteği Olan Tipler
- ✅ `Product` - adminId, branchId
- ✅ `MenuItem` - adminId, branchId
- ✅ `Employee` - adminId (branchId zaten var)
- ✅ `Category` - adminId, branchId
- ✅ `SalaryCalculation` - adminId, branchId
- ✅ `Sale` - branchId (zaten var, adminId eklenecek)
- ✅ `Table` - branchId (zaten var, adminId eklenecek)
- ✅ `Task` - branchId (zaten var, adminId eklenecek)
- ✅ `Invoice` - branchId (zaten var, adminId eklenecek)
- ✅ `CustomerAccount` - adminId, branchId eklenecek
- ✅ `CashTransaction` - branchId (zaten var, adminId eklenecek)

### Özel Durumlar
- `Branch` - Sadece adminId ile filtrelenir (bir admin birden fazla şube görebilir)
- `Admin` - Global, filtrelenmez
- `B2BSupplier` - Global, tüm adminler görebilir
- `B2BProduct` - Tedarikçi bazlı, filtrelenmez
- `B2BOrder` - Müşteri bazlı filtreleme (customerId ile)

## Migration (Geçiş) Stratejisi

### Mevcut Veriler
Mevcut verilerin `adminId` ve `branchId` alanları olmayabilir. Sistem geriye uyumludur:
- Eski veriler (adminId/branchId olmayan) görüntülenir
- Yeni veriler otomatik olarak mevcut session bilgileriyle etiketlenir
- Veri güncelleme yapıldığında, branch bilgileri otomatik eklenir

### Veri Temizleme (Opsiyonel)
Mevcut verileri güncellemek için:
```typescript
const [data, setData] = useKV<DataType[]>('dataKey', []);

// Tüm verilere mevcut admin/branch bilgisi ekle
const migrateData = () => {
  const updated = data.map(item => ({
    ...item,
    adminId: authSession.adminId,
    branchId: authSession.branchId,
  }));
  setData(updated);
};
```

## Test Senaryoları

### Senaryo 1: Çoklu Şube Testi
1. Admin1, Branch A'da veri oluştur
2. Admin1, Branch B'ye geç
3. Branch A verilerinin görünmediğini doğrula
4. Branch B'de yeni veri oluştur
5. Branch A'ya geri dön, sadece A verilerini gör

### Senaryo 2: Çoklu Admin Testi
1. Admin1, Branch A'da veri oluştur
2. Çıkış yap
3. Admin2, Branch C'de giriş yap
4. Admin1'in verilerinin görünmediğini doğrula

### Senaryo 3: Geriye Uyumluluk
1. Eski veri (adminId/branchId yok) yükle
2. Veriyi görüntüle (başarılı)
3. Veriyi güncelle
4. Branch bilgilerinin eklendiğini doğrula

## Performans Notları

- Filtreleme `useMemo` ile optimize edilmiştir
- Büyük veri setleri için client-side filtreleme yeterlidir
- 10,000+ kayıt için server-side filtreleme düşünülebilir
- Hook-based yaklaşım re-render'ları minimize eder

## Güvenlik

- Tüm veri filtreleme client-side yapılır
- Gerçek üretim ortamında, API seviyesinde de filtreleme yapılmalıdır
- `authSession` güvenli bir şekilde saklanmalıdır
- Admin değiştirme işlemleri denetlenmelidir
