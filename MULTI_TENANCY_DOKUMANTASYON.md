# Multi-Tenancy ve Admin Yönetimi Dokümantasyonu

## 📋 Genel Bakış

POSACA sistemine gerçek admin hesapları ve gelişmiş multi-tenancy desteği eklenmiştir. Bu özellikler sayesinde her admin kendi işletmesini bağımsız olarak yönetebilir, birden fazla şube oluşturabilir ve sistem üzerinden diğer admin hesaplarını da yönetebilir.

## 🎯 Temel Özellikler

### 1. Gelişmiş Login Sistemi

#### Kayıt Ol
- ✅ E-posta adresi (benzersiz, otomatik küçük harfe çevrilir)
- ✅ Şifre (minimum 6 karakter)
- ✅ Şifre doğrulama
- ✅ E-posta format validasyonu (regex)
- ✅ İşletme adı
- ✅ Yetkili adı soyadı (yeni alan)
- ✅ Telefon
- ✅ İlk şube bilgileri (ad, adres, telefon)
- ✅ Otomatik şube kodu oluşturma
- ✅ İlk şubeye manager name atama

#### Giriş Yap

**Tek Şubeli Admin:**
- E-posta ve şifre girişi
- Otomatik şube seçimi
- Direkt dashboard'a yönlendirme

**Çoklu Şubeli Admin:**
- E-posta ve şifre girişi
- Şube seçim ekranı gösterimi
- Şubeler listesi (ad ve kod ile)
- Şube seçimi
- Dashboard'a yönlendirme
- "Geri" butonu ile login ekranına dönüş

#### Güvenlik Özellikleri
- ✅ E-posta benzersizlik kontrolü
- ✅ Şifre uzunluk kontrolü
- ✅ E-posta format validasyonu
- ✅ Aktif olmayan admin girişi engelleme
- ✅ Şubesi olmayan admin girişi engelleme
- ✅ Şifre alanları gizli (type="password")

### 2. Admin Yönetim Paneli

Owner rolündeki kullanıcılar Admin Paneli'nden admin hesaplarını yönetebilir.

#### Adminler Sekmesi

**Listeleme:**
- İşletme adı
- Yetkili adı soyadı
- E-posta
- Telefon
- Şube sayısı (badge ile)
- Aktif/Pasif durumu (switch ile)
- Oluşturulma tarihi
- Mevcut admin işareti ("Sen" badge'i)

**Filtreleme ve Arama:**
- İşletme adına göre arama
- E-postaya göre arama
- Yetkili adına göre arama
- Aktif/Pasif filtresi

**Yeni Admin Ekleme:**
- E-posta (gerekli)
- Şifre (gerekli, min 6 karakter)
- İşletme adı (gerekli)
- Yetkili adı soyadı (opsiyonel)
- Telefon (gerekli)
- Aktif/Pasif durumu (switch)
- E-posta benzersizlik kontrolü
- E-posta format validasyonu

**Admin Düzenleme:**
- E-posta değiştirilemez (disabled input)
- Şifre opsiyonel (boş bırakılırsa değişmez)
- Diğer tüm alanlar güncellenebilir
- E-posta benzersizlik kontrolü (kendisi hariç)

**Admin Silme:**
- Kendi hesabını silemez
- Şubesi olan admin silinemez
- Onay dialog'u

**Durum Değiştirme:**
- Kendi hesabını pasif edemez
- Switch ile aktif/pasif yapma
- Anlık güncelleme

### 3. Multi-Tenancy Yapısı

#### Admin Veri Modeli

```typescript
interface Admin {
  id: string;
  email: string;                 // Benzersiz, küçük harf
  password: string;              // Hash edilmeli (production'da)
  businessName: string;          // İşletme adı
  ownerName?: string;           // Yetkili adı soyadı
  phone: string;                // İletişim
  createdAt: string;            // ISO timestamp
  lastLoginAt?: string;         // Son giriş (gelecekte)
  isActive: boolean;            // Aktif/Pasif
}
```

#### Branch (Şube) İlişkisi

```typescript
interface Branch {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  email?: string;
  managerName?: string;         // Şube yöneticisi
  isActive: boolean;
  adminId?: string;             // Admin ile ilişki
  createdAt?: string;
  updatedAt?: string;
}
```

#### AuthSession

```typescript
interface AuthSession {
  userId?: string;
  adminId: string;              // Hangi admin
  branchId: string;             // Hangi şube
  userRole: UserRole;           // Rol (owner, manager, vb.)
  userName: string;             // Görünen isim
  loginTime: string;            // Giriş zamanı
}
```

## 🔄 Kullanım Akışları

### Yeni İşletme Kaydı

1. **Kayıt Ol** sekmesine tıkla
2. E-posta, şifre (2x), işletme adı, yetkili adı, telefon gir
3. İlk şube bilgilerini gir (ad, adres, telefon)
4. **Kayıt Ol** butonuna tıkla
5. Sistem:
   - Admin hesabını oluşturur
   - İlk şubeyi oluşturur
   - AuthSession oluşturur
   - Dashboard'a yönlendirir

### Tek Şubeyle Giriş

1. **Giriş Yap** sekmesinde e-posta ve şifre gir
2. **Giriş Yap** butonuna tıkla
3. Sistem:
   - Admin'i doğrular
   - Tek şube varsa otomatik seçer
   - Dashboard'a yönlendirir

### Çoklu Şubeyle Giriş

1. **Giriş Yap** sekmesinde e-posta ve şifre gir
2. **Giriş Yap** butonuna tıkla
3. Sistem şube seçim ekranını gösterir
4. Dropdown'dan şube seç
5. **Devam Et** butonuna tıkla
6. Dashboard'a yönlendirilir

### Admin Yönetimi

1. Dashboard'da **Admin** butonuna tıkla (sağ üst)
2. **Adminler** sekmesine geç
3. İşlemler:
   - **Yeni Admin**: Artı butonuna tıkla, formu doldur, kaydet
   - **Düzenle**: Kalem ikonuna tıkla, değişiklikleri yap, güncelle
   - **Sil**: Çöp kutusu ikonuna tıkla, onayla
   - **Aktif/Pasif**: Switch'e tıkla

## 🛡️ Güvenlik ve Validasyonlar

### Kayıt/Login Validasyonları

```typescript
// E-posta formatı
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Şifre uzunluğu
password.length >= 6

// E-posta benzersizliği
admins.some((a) => a.email.toLowerCase() === email.toLowerCase())

// Aktif admin kontrolü
admin.isActive === true

// Aktif şube kontrolü
branches.some((b) => b.adminId === adminId && b.isActive)
```

### Admin Yönetim Validasyonları

```typescript
// Kendi hesabını silme
admin.id !== authSession.adminId

// Kendi hesabını pasif etme
admin.id !== authSession.adminId

// Şubeli admin silme
branches.filter(b => b.adminId === admin.id).length === 0

// E-posta benzersizliği (düzenlemede)
admins.some((a) => 
  a.email === email && 
  a.id !== selectedAdmin.id
)
```

## 📊 Veri İzolasyonu

Her admin yalnızca kendi verilerine erişebilir:

```typescript
// Branch filtreleme
branches.filter(b => b.adminId === authSession.adminId)

// Employee filtreleme
employees.filter(e => e.adminId === authSession.adminId)

// Product filtreleme
products.filter(p => p.adminId === authSession.adminId)

// MenuItem filtreleme
menuItems.filter(m => m.adminId === authSession.adminId)
```

## 🎨 UI/UX İyileştirmeleri

### RegisterLogin Ekranı
- ✅ Gradient arka plan
- ✅ Icon'lu input alanları
- ✅ Tab'lı tasarım (Giriş/Kayıt)
- ✅ Responsive tasarım
- ✅ Loading durumları
- ✅ Toast bildirimler

### Şube Seçim Ekranı
- ✅ Merkezi card layout
- ✅ Dropdown şube seçimi
- ✅ Geri butonu
- ✅ Devam et butonu
- ✅ İşletme adı gösterimi
- ✅ Responsive tasarım

### Admin Paneli - Adminler Sekmesi
- ✅ Tablo görünümü
- ✅ Arama ve filtreleme
- ✅ Icon'lu bilgiler
- ✅ Switch'lerle durum değiştirme
- ✅ Badge'lerle görsel vurgular
- ✅ İşlem butonları (düzenle/sil)
- ✅ Scroll area (600px)
- ✅ Responsive tasarım

## 🔮 Gelecek Geliştirmeler

### Güvenlik
- [ ] Şifre hashleme (bcrypt)
- [ ] JWT token sistemi
- [ ] Refresh token
- [ ] İki faktörlü kimlik doğrulama (2FA)
- [ ] Şifre sıfırlama (e-posta)
- [ ] Hesap doğrulama (e-posta)
- [ ] Login geçmişi
- [ ] Şüpheli giriş algılama

### Yönetim
- [ ] Admin rolleri (super admin, admin)
- [ ] Şube transferi (admin'ler arası)
- [ ] Toplu şube ekleme
- [ ] Admin aktivite logları
- [ ] Şube istatistikleri (admin bazında)
- [ ] Admin profil sayfası
- [ ] Avatar yükleme
- [ ] Hesap ayarları

### Kullanıcı Deneyimi
- [ ] Unutulan şifre akışı
- [ ] E-posta değiştirme
- [ ] Son giriş yapılan şubeyi hatırlama
- [ ] Favori şubeler
- [ ] Şube arama/filtreleme (giriş ekranında)
- [ ] Dark mode desteği
- [ ] Dil seçimi

## 📝 Notlar

- E-posta adresleri otomatik olarak küçük harfe çevrilir
- Şifre güncellemesi opsiyoneldir (boş bırakılırsa değişmez)
- Admin kendi hesabını silemez veya pasif edemez
- Şubesi olan admin hesabı silinemez
- Tüm admin işlemleri authSession kontrolü ile yapılır
- Demo giriş butonu test amaçlı kullanılabilir
- Geriye dönük uyumluluk korunmuştur (adminId ve branchId opsiyonel)

## 🐛 Bilinen Sorunlar

Şu an için bilinen kritik sorun bulunmamaktadır.

## 📞 Destek

Sorularınız için lütfen dokümantasyonu inceleyin veya geliştirici ile iletişime geçin.
