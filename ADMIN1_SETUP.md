# Admin1 Test Hesabı - Kurulum Tamamlandı ✅

## Giriş Bilgileri
- **Email:** admin1@test.com
- **Password:** admin1test
- **Admin ID:** 5f8aa328-b72a-4781-9ffc-b6fecbf3eefc
- **Branch ID:** 9ba74565-2c7e-4b47-809b-f7372bf76621

## Yüklenen Demo Data

### 1. Branch (Şube)
- **Ana Şube** (MAIN)
  - Adres: İstanbul
  - Telefon: 0555 000 0001

### 2. Categories (4 adet)
- **cat-1:** Kahvaltı
- **cat-2:** Ana Yemekler
- **cat-3:** İçecekler
- **cat-4:** Tatlılar

### 3. Products (5 adet)
| ID | SKU | Ürün | Kategori | Fiyat | Stok |
|----|-----|------|----------|-------|------|
| prod-1 | SKU-001 | Menemen | Kahvaltı | ₺85 | 50 |
| prod-2 | SKU-002 | Izgara Köfte | Ana Yemekler | ₺180 | 30 |
| prod-3 | SKU-003 | Çay | İçecekler | ₺15 | 100 |
| prod-4 | SKU-004 | Türk Kahvesi | İçecekler | ₺45 | 50 |
| prod-5 | SKU-005 | Künefe | Tatlılar | ₺120 | 20 |

### 4. Employees (2 adet)
| ID | İsim | Email | Rol | PIN | Saatlik Ücret |
|----|------|-------|-----|-----|---------------|
| emp-1 | Ahmet Yılmaz | ahmet@admin1test.com | Kasiyer | 1111 | ₺85 |
| emp-2 | Ayşe Demir | ayse@admin1test.com | Garson | 2222 | ₺75 |

## Test Adımları

### 1. Login Testi
```bash
curl -X POST https://pos-sistemi-67au2y9ex-ardaidic-bitbademccs-projects.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin1@test.com","password":"admin1test"}'
```

### 2. Categories Görüntüleme
```bash
curl https://pos-sistemi-67au2y9ex-ardaidic-bitbademccs-projects.vercel.app/api/kv/5f8aa328-b72a-4781-9ffc-b6fecbf3eefc_categories
```

### 3. Products Görüntüleme
```bash
curl https://pos-sistemi-67au2y9ex-ardaidic-bitbademccs-projects.vercel.app/api/kv/5f8aa328-b72a-4781-9ffc-b6fecbf3eefc_products
```

## Yapılanlar

1. ✅ Admin hesabı zaten mevcut (database'de)
2. ✅ Branch oluşturuldu (Ana Şube - UUID: 9ba74565-2c7e-4b47-809b-f7372bf76621)
3. ✅ Categories KV storage'a yüklendi
4. ✅ Products KV storage'a yüklendi
5. ✅ Employees KV storage'a yüklendi
6. ✅ Login endpoint'ine detaylı loglar eklendi
7. ✅ Login testi başarılı

## Database Sync

Data KV storage'da. Database'e sync için otomatik sync çalışacak veya manuel:

```bash
# Categories sync
curl -X POST https://pos-sistemi-67au2y9ex-ardaidic-bitbademccs-projects.vercel.app/api/sync \
  -H "Content-Type: application/json" \
  -d '{"adminId":"5f8aa328-b72a-4781-9ffc-b6fecbf3eefc","type":"categories","items":[...]}'

# Products sync
curl -X POST https://pos-sistemi-67au2y9ex-ardaidic-bitbademccs-projects.vercel.app/api/sync \
  -H "Content-Type: application/json" \
  -d '{"adminId":"5f8aa328-b72a-4781-9ffc-b6fecbf3eefc","type":"products","items":[...]}'

# Employees sync
curl -X POST https://pos-sistemi-67au2y9ex-ardaidic-bitbademccs-projects.vercel.app/api/sync \
  -H "Content-Type: application/json" \
  -d '{"adminId":"5f8aa328-b72a-4781-9ffc-b6fecbf3eefc","type":"employees","items":[...]}'
```

## Sorun Giderme

### Login Hatası: "Aktif şubeniz bulunmuyor"
**Çözüm:** Branch oluşturuldu ✅

### Login Hatası: "Geçersiz e-posta veya şifre"
**Kontrol:**
- Email: admin1@test.com
- Password: admin1test
- Admin database'de var mı: ✅
- is_active = true: ✅

### Data görünmüyor
**Çözüm:** Demo data KV storage'a yüklendi. Frontend login olduğunda otomatik yüklenecek.

## Production URL
https://pos-sistemi-67au2y9ex-ardaidic-bitbademccs-projects.vercel.app
