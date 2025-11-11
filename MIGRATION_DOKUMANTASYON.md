# Veri Migration Dokümantasyonu

## Genel Bakış

Bu migration, POSACA sistemindeki tüm mevcut verilere `adminId` ve `branchId` alanlarını ekler. Bu işlem, çoklu admin ve şube desteği için veri izolasyonunu sağlamak amacıyla yapılmıştır.

## Migration Kapsamı

Aşağıdaki veri tabloları migration'a dahildir:

### 1. Çalışanlar (employees)
- `adminId`: string (default: 'admin-1')
- `branchId`: string (default: 'branch-1')

### 2. Ürünler (products)
- `adminId`: string (default: 'admin-1')
- `branchId`: string (default: 'branch-1')

### 3. Menü Ögeleri (menuItems)
- `adminId`: string (default: 'admin-1')
- `branchId`: string (default: 'branch-1')

### 4. Kategoriler (categories)
- `adminId`: string (default: 'admin-1')
- `branchId`: string (default: 'branch-1')

### 5. Şubeler (branches)
- `adminId`: string (default: 'admin-1')

### 6. Satışlar (sales)
- Zaten `branchId` mevcut, değişiklik yok

### 7. Maaş Hesaplamaları (salaryCalculations)
- `adminId`: string (default: 'admin-1')
- `branchId`: string (default: 'branch-1')

### 8. Görevler (tasks)
- Zaten `branchId` mevcut, değişiklik yok

### 9. Cari Hesaplar (customer-accounts)
- `adminId`: string (default: 'admin-1')
- `branchId`: string (default: 'branch-1')

### 10. B2B Tedarikçiler (b2b-suppliers)
- `adminId`: string (default: 'admin-1')

### 11. B2B Ürünler (b2b-products)
- `adminId`: string (default: 'admin-1')

### 12. B2B Siparişler (b2b-orders)
- `adminId`: string (default: 'admin-1')
- `branchId`: string (default: 'branch-1')

### 13. Numune Talepleri (b2b-sample-requests)
- `adminId`: string (default: 'admin-1')
- `branchId`: string (default: 'branch-1')

### 14. Faturalar (invoices)
- `adminId`: string (default: 'admin-1')
- Zaten `branchId` mevcut

### 15. Giderler (expenses)
- `adminId`: string (default: 'admin-1')
- Zaten `branchId` mevcut

### 16. Kasa İşlemleri (cash-transactions)
- `adminId`: string (default: 'admin-1')
- Zaten `branchId` mevcut

### 17. Reçeteler (recipes)
- `adminId`: string (default: 'admin-1')
- `branchId`: string (default: 'branch-1')

## Migration Süreci

### Adım 1: Durum Kontrolü
Uygulama başlatıldığında `checkMigrationStatus()` fonksiyonu çağrılır ve migration'ın daha önce yapılıp yapılmadığı kontrol edilir.

### Adım 2: Migration Ekranı
Eğer migration yapılmamışsa, kullanıcıya migration ekranı gösterilir:
- Migration hakkında bilgi verilir
- Hangi tabloların etkileneceği listelenir
- Kullanıcı migration'ı başlatabilir

### Adım 3: Migration İşlemi
`migrateAllData()` fonksiyonu çağrıldığında:
1. Her tablo için ilgili migration fonksiyonu çağrılır
2. Mevcut veriler okunur
3. `adminId` ve/veya `branchId` alanları eklenir
4. Güncellenmiş veriler tekrar kaydedilir

### Adım 4: Durum Kaydı
Migration tamamlandığında:
- `data-migration-completed` key'i ile migration durumu kaydedilir
- Tarih ve migrate edilen tablolar bilgisi saklanır

### Adım 5: Uygulama Yeniden Başlatma
Kullanıcı "Uygulamayı Yeniden Başlat" butonuna tıklayarak uygulamayı normal modda kullanmaya devam edebilir.

## Önemli Notlar

⚠️ **Dikkat:** 
- Bu işlem geri alınamaz!
- Tüm veriler kalıcı olarak güncellenir
- Migration sırasında uygulama kullanılamaz durumda olacaktır

## Varsayılan Değerler

Tüm mevcut veriler için:
- `DEFAULT_ADMIN_ID = 'admin-1'`
- `DEFAULT_BRANCH_ID = 'branch-1'`

Bu değerler, mevcut verilerin tamamının varsayılan admin ve şubeye ait olduğunu varsayar.

## Migration'ı Sıfırlama

Geliştirme aşamasında migration'ı tekrar çalıştırmak isterseniz:
1. Migration ekranında "Migration'ı Sıfırla" butonuna tıklayın
2. Onay verin
3. Migration'ı tekrar başlatın

## Kod Yapısı

### Dosyalar
- `/src/lib/data-migration.ts` - Migration işlem fonksiyonları
- `/src/components/DataMigration.tsx` - Migration UI bileşeni
- `/src/lib/types.ts` - Güncellenmiş tip tanımlamaları

### Fonksiyonlar
- `migrateAllData()` - Tüm migration'ları çalıştırır
- `checkMigrationStatus()` - Migration durumunu kontrol eder
- `resetMigration()` - Migration durumunu sıfırlar
- `migrate[TableName]()` - Belirli bir tablo için migration yapar

## Sonraki Adımlar

Migration tamamlandıktan sonra:
1. Tüm yeni veriler otomatik olarak `adminId` ve `branchId` ile oluşturulacaktır
2. Branch filtreleme sistemi aktif olacaktır
3. Admin bazlı veri izolasyonu sağlanacaktır
4. Login/Register sistemleri tam olarak işlevsel hale gelecektir
