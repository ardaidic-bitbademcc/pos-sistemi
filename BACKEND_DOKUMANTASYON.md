# 🗄️ Backend Kurulum ve Çalıştırma Kılavuzu

## 📋 İçindekiler
- [Kurulum](#kurulum)
- [Veritabanı Setup](#veritabanı-setup)
- [Backend Çalıştırma](#backend-çalıştırma)
- [API Endpoints](#api-endpoints)
- [Veritabanı Yönetimi](#veritabanı-yönetimi)

---

## 🚀 Kurulum

### 1. Bağımlılıkları Yükleyin
```bash
npm install
```

### 2. Environment Variables Ayarlayın
`.env` dosyası oluşturun (`.env.example` dosyasını kopyalayın):

```bash
cp .env.example .env
```

`.env` içeriği:
```env
DATABASE_URL="file:./dev.db"
PORT=3001
NODE_ENV=development
JWT_SECRET="your-super-secret-jwt-key"
CORS_ORIGIN="http://localhost:5173"
```

---

## 🗄️ Veritabanı Setup

### Adım 1: Prisma Client Oluşturun
```bash
npm run db:generate
```

### Adım 2: Veritabanını Oluşturun (SQLite)
```bash
npm run db:push
```

### Adım 3: Seed Data Yükleyin
```bash
npm run db:seed
```

**Yüklenen veriler:**
- ✅ 1 Admin (demo@posaca.com / demo123)
- ✅ 3 Şube (Kadıköy, Beşiktaş, Üsküdar)
- ✅ 8 Personel (Ahmet, Ayşe, Mehmet, vb.)

---

## 🏃 Backend Çalıştırma

### Development Mode (Watch)
```bash
npm run server:dev
```

Server başladığında:
```
🚀 Server running on http://localhost:3001
📊 API docs: http://localhost:3001/health
```

### Health Check
```bash
curl http://localhost:3001/health
```

Yanıt:
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

---

## 📡 API Endpoints

### Base URL
```
http://localhost:3001/api
```

---

### 👥 **Employees**

#### GET /api/employees
Tüm personelleri listele

**Query Parameters:**
- `branchId` (opsiyonel): Şube ID'sine göre filtrele
- `adminId` (opsiyonel): Admin ID'sine göre filtrele

**Örnek:**
```bash
curl http://localhost:3001/api/employees
curl http://localhost:3001/api/employees?branchId=branch-1
```

**Yanıt:**
```json
[
  {
    "id": "emp-001",
    "fullName": "Ahmet Yılmaz",
    "email": "ahmet@restoran.com",
    "phone": "0555 111 2233",
    "role": "cashier",
    "branchId": "branch-1",
    "isActive": true,
    "hourlyRate": 85,
    "employeePin": "1234",
    "qrCode": "QR001",
    "adminId": "demo-admin",
    "branch": {
      "id": "branch-1",
      "name": "Kadıköy Şubesi",
      "code": "KDK001"
    }
  }
]
```

---

#### GET /api/employees/:id
Tek bir personeli getir

**Örnek:**
```bash
curl http://localhost:3001/api/employees/emp-001
```

---

#### POST /api/employees
Yeni personel ekle

**Request Body:**
```json
{
  "fullName": "Yeni Personel",
  "email": "yeni@restoran.com",
  "phone": "0555 999 8877",
  "role": "waiter",
  "branchId": "branch-1",
  "isActive": true,
  "hourlyRate": 75,
  "employeePin": "4567",
  "qrCode": "QR009",
  "adminId": "demo-admin"
}
```

**Örnek:**
```bash
curl -X POST http://localhost:3001/api/employees \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Yeni Personel",
    "email": "yeni@restoran.com",
    "phone": "0555 999 8877",
    "role": "waiter",
    "branchId": "branch-1",
    "isActive": true,
    "hourlyRate": 75,
    "employeePin": "4567",
    "qrCode": "QR009",
    "adminId": "demo-admin"
  }'
```

---

#### PUT /api/employees/:id
Personel bilgilerini güncelle

**Örnek:**
```bash
curl -X PUT http://localhost:3001/api/employees/emp-001 \
  -H "Content-Type: application/json" \
  -d '{
    "hourlyRate": 90,
    "role": "manager"
  }'
```

---

#### DELETE /api/employees/:id
Personeli sil

**Örnek:**
```bash
curl -X DELETE http://localhost:3001/api/employees/emp-001
```

---

### 🏢 **Branches**

#### GET /api/branches
Tüm şubeleri listele

```bash
curl http://localhost:3001/api/branches
```

#### GET /api/branches/:id
Tek bir şubeyi getir (personel sayısı, satış sayısı dahil)

```bash
curl http://localhost:3001/api/branches/branch-1
```

#### POST /api/branches
Yeni şube ekle

```bash
curl -X POST http://localhost:3001/api/branches \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Yeni Şube",
    "code": "YNS004",
    "address": "İstanbul",
    "phone": "0212 555 0004",
    "isActive": true,
    "adminId": "demo-admin"
  }'
```

#### PUT /api/branches/:id
Şube bilgilerini güncelle

#### DELETE /api/branches/:id
Şubeyi sil

---

### 👤 **Admins**

#### GET /api/admins
Tüm adminleri listele (password hariç)

```bash
curl http://localhost:3001/api/admins
```

#### POST /api/admins/login
Admin girişi

```bash
curl -X POST http://localhost:3001/api/admins/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@posaca.com",
    "password": "demo123"
  }'
```

**Başarılı Yanıt:**
```json
{
  "id": "demo-admin",
  "email": "demo@posaca.com",
  "businessName": "Demo Restoran",
  "phone": "0555 000 0000",
  "createdAt": "2025-11-12T00:00:00.000Z",
  "isActive": true
}
```

---

## 🗃️ Veritabanı Yönetimi

### Prisma Studio (GUI)
Veritabanını görsel olarak yönetin:

```bash
npm run db:studio
```

Tarayıcıda açılır: `http://localhost:5555`

---

### Migration Oluşturma
Schema değişikliklerinden sonra migration oluşturun:

```bash
npm run db:migrate
```

---

### Veritabanını Sıfırlama
**⚠️ DİKKAT: Tüm verileri siler!**

```bash
npm run db:reset
```

Bu komut:
1. Tüm verileri siler
2. Schema'yı yeniden oluşturur
3. Seed data'yı yeniden yükler

---

### Seed Data Yeniden Yükleme
Sadece seed verilerini yeniden yükleyin:

```bash
npm run db:seed
```

---

## 📁 Dosya Yapısı

```
pos-sistemi/
├── server/
│   ├── index.ts           # Express server
│   ├── db.ts              # Prisma client
│   ├── seed.ts            # Seed script
│   └── tsconfig.json      # TypeScript config
├── prisma/
│   └── schema.prisma      # Database schema
├── data/
│   ├── admins.json        # Admin seed data
│   ├── branches.json      # Branches seed data
│   └── employees.json     # Employees seed data
├── .env                   # Environment variables
└── dev.db                 # SQLite database (git'te yok)
```

---

## 🔧 Package.json Scripts

```json
{
  "server": "tsx watch server/index.ts",
  "server:dev": "NODE_ENV=development tsx watch server/index.ts",
  "db:generate": "prisma generate",
  "db:migrate": "prisma migrate dev",
  "db:push": "prisma db push",
  "db:seed": "tsx server/seed.ts",
  "db:studio": "prisma studio",
  "db:reset": "prisma migrate reset && npm run db:seed"
}
```

---

## 🔄 Frontend Entegrasyonu

Frontend'den API'yi kullanmak için:

### Axios ile Örnek
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
});

// Tüm personelleri getir
const employees = await api.get('/employees');

// Yeni personel ekle
const newEmployee = await api.post('/employees', {
  fullName: "Yeni Personel",
  email: "yeni@restoran.com",
  // ...
});
```

### Fetch ile Örnek
```typescript
const response = await fetch('http://localhost:3001/api/employees');
const employees = await response.json();
```

---

## 🛠️ Troubleshooting

### Port zaten kullanımda
```bash
# Port 3001'i kullanıma kapatın
lsof -ti:3001 | xargs kill -9
```

### Prisma Client bulunamıyor
```bash
npm run db:generate
```

### Veritabanı bağlantı hatası
```bash
# .env dosyasını kontrol edin
cat .env

# Veritabanını yeniden oluşturun
npm run db:push
```

### Migration hataları
```bash
# Tüm veritabanını sıfırlayın
npm run db:reset
```

---

## 📚 Ek Kaynaklar

- [Prisma Documentation](https://www.prisma.io/docs)
- [Express Documentation](https://expressjs.com/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)

---

## 🎯 Sonraki Adımlar

1. ✅ Backend kurulumu tamamlandı
2. ✅ Seed data yüklendi
3. ✅ API endpoints hazır
4. 🔜 Frontend'e API entegrasyonu
5. 🔜 Authentication (JWT)
6. 🔜 Diğer modüller (Products, Sales, vb.)

---

**Hazırlayan:** AI Assistant  
**Tarih:** 12 Kasım 2025
