# Sistem Log Yönetimi

Bu dokümantasyon, BENDO sistemine eklenen yeni log yönetimi özelliğini açıklar.

## Genel Bakış

Sistem artık tüm kritik işlemleri otomatik olarak kaydeder ve Admin panelinde görüntülenebilir bir log sistemi içerir. Bu, hata ayıklama, güvenlik denetimi ve sistem performansı takibi için kullanılır.

## Log Seviyeleri

Sistem 5 farklı log seviyesini destekler:

- **Debug** (🐛): Geliştirme ve hata ayıklama için detaylı bilgiler
- **Info** (ℹ️): Genel bilgilendirme mesajları
- **Warn** (⚠️): Uyarı mesajları, hatalara dönüşebilecek durumlar
- **Error** (❌): Hata durumları
- **Success** (✅): Başarılı işlemler

## Log Kategorileri

Loglar kategorilere ayrılmıştır:

- **AUTH**: Kimlik doğrulama işlemleri (giriş, kayıt, PIN doğrulama)
- **SHIFT**: Vardiya yönetimi (giriş, çıkış)
- **POS**: Satış işlemleri
- **PAYMENT**: Ödeme işlemleri
- **INVENTORY**: Stok işlemleri
- **CUSTOMER**: Müşteri işlemleri
- **EMPLOYEE**: Personel işlemleri
- **BRANCH**: Şube işlemleri
- **SYSTEM**: Sistem işlemleri

## Log Görüntüleme

Loglar Admin Paneli'nden görüntülenebilir:

1. Admin Paneli'ne gidin
2. "Loglar" sekmesini seçin
3. Logları filtreleyin:
   - Seviyeye göre (Debug, Info, Warn, Error, Success)
   - Kategoriye göre (AUTH, SHIFT, POS, vb.)
   - Arama kelimesine göre

## Log Özellikleri

Her log kaydı şu bilgileri içerir:

- **Timestamp**: Log kaydının oluşturulma zamanı
- **Level**: Log seviyesi
- **Category**: Log kategorisi
- **Message**: Log mesajı
- **Data**: Ek veri (JSON formatında)
- **User Info**: Kullanıcı bilgisi (varsa)
  - User ID
  - User Name
  - Branch ID
  - Branch Name
- **Session ID**: Oturum ID (varsa)

## Örnek Log Kayıtları

### PIN Doğrulama Başarılı
```
[SUCCESS] [AUTH] PIN doğrulama başarılı
Data: {
  employeeId: "emp-123",
  employeeName: "Ahmet Yılmaz",
  branchId: "branch-1"
}
```

### Vardiya Başlatıldı
```
[SUCCESS] [SHIFT] Vardiya başlatıldı
Data: {
  shiftId: "shift-456",
  employeeId: "emp-123",
  employeeName: "Ahmet Yılmaz",
  startTime: "2024-01-15T09:00:00.000Z"
}
```

### Login Başarısız
```
[ERROR] [AUTH] Login başarısız: Geçersiz kimlik bilgileri
Data: {
  email: "user@example.com"
}
```

## Log Yönetimi

### Log Temizleme
Admin panelinden tüm logları temizleyebilirsiniz. Bu işlem geri alınamaz.

### Log Dışa Aktarma
Logları JSON formatında dışa aktarabilirsiniz:
1. Admin Paneli > Loglar sekmesi
2. "Dışa Aktar" butonuna tıklayın
3. JSON dosyası otomatik olarak indirilir

### Log Limiti
Sistem maksimum 1000 log kaydı tutar. Bu sayı aşıldığında en eski kayıtlar otomatik olarak silinir.

### Otomatik Yenileme
Log ekranında "Otomatik Yenileme" özelliğini aktif ederek logları her 5 saniyede bir otomatik olarak güncelleyebilirsiniz.

## Kod Kullanımı

### Logger'ı İçe Aktarma
```typescript
import { Logger } from '@/lib/logger';
```

### Temel Kullanım
```typescript
// Debug log
Logger.debug('CATEGORY', 'Mesaj', { additionalData: 'value' });

// Info log
Logger.info('CATEGORY', 'Mesaj', { additionalData: 'value' });

// Warn log
Logger.warn('CATEGORY', 'Mesaj', { additionalData: 'value' });

// Error log
Logger.error('CATEGORY', 'Mesaj', { error: errorObject });

// Success log
Logger.success('CATEGORY', 'Mesaj', { result: 'success' });
```

### Kullanıcı Bağlamı ile
```typescript
Logger.success('AUTH', 'Login başarılı', 
  {
    adminId: admin.id,
    branchCount: branches.length
  }, 
  {
    userId: admin.id,
    userName: admin.businessName,
    branchId: session.branchId
  }
);
```

## En İyi Pratikler

1. **Doğru Kategori Seçimi**: Her log için uygun kategoriyi kullanın
2. **Detaylı Veri**: Hata ayıklamayı kolaylaştıracak yeterli veriyi ekleyin
3. **Hassas Bilgiler**: Şifreler ve hassas verileri loglara eklemeyin
4. **Anlamlı Mesajlar**: Log mesajlarını açık ve anlaşılır yazın
5. **Uygun Seviye**: Duruma uygun log seviyesini kullanın

## Güvenlik

- Loglar sadece Owner rolüne sahip kullanıcılar tarafından görüntülenebilir
- Hassas veriler (şifreler, kredi kartı bilgileri) otomatik olarak loglanmaz
- Log verileri tarayıcı deposunda (IndexedDB) tutulur

## Sık Karşılaşılan Sorunlar

### Loglar Görünmüyor
- Admin panelindeki filtreleri kontrol edin
- Tarayıcı konsolunu kontrol edin (hatalar görünebilir)
- Sayfayı yenileyin

### Log Limiti Doldu
- Eski logları temizleyin veya dışa aktarın
- Log limiti kodda değiştirilebilir (logger.ts dosyasında MAX_LOGS)

### Performans Sorunları
- Otomatik yenilemeyi kapatın
- Logları daha az sıklıkla kullanın (production'da debug logları devre dışı bırakın)

## Gelecek Geliştirmeler

- [ ] Log filtreleme için tarih aralığı seçimi
- [ ] Log istatistikleri ve grafikler
- [ ] E-posta ile kritik log bildirimleri
- [ ] Sunucu tarafında log saklama
- [ ] Gelişmiş arama ve filtreleme özellikleri
