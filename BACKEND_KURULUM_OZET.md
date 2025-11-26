# 🎯 Backend Kurulum Özeti

## ✅ Tamamlanan İşlemler

### 1. **Prisma Schema Oluşturuldu**
- 📁 `prisma/schema.prisma`
- 18 model (Admin, Branch, Employee, Product, MenuItem, Sale, vb.)
- İlişkiler ve foreign key'ler tanımlandı

### 2. **Backend Yapısı**
```
server/
├── index.ts       # Express API (CRUD endpoints)
├── db.ts          # Prisma client
├── seed.ts        # JSON → DB seed script
└── tsconfig.json  # TypeScript config
```

### 3. **JSON Seed Data**
```
data/
├── admins.json      # 1 admin
├── branches.json    # 3 şube
└── employees.json   # 8 personel
```

### 4. **Bağımlılıklar Yüklendi**
```bash
✅ @prisma/client
✅ prisma
✅ express
✅ cors
✅ dotenv
✅ tsx
✅ @types/express, @types/cors, @types/node
```

### 5. **Veritabanı Kurulumu**
```bash
✅ prisma generate   # Prisma Client oluşturuldu
✅ prisma db push    # SQLite DB oluşturuldu (dev.db)
✅ npm run db:seed   # JSON veriler yüklendi
```

**Seed Sonuçları:**
```
🌱 Veritabanı seed işlemi başlıyor...
📋 Admins yükleniyor...
✅ 1 admin eklendi
📋 Branches yükleniyor...
✅ 3 şube eklendi
📋 Employees yükleniyor...
✅ 8 personel eklendi
🎉 Seed işlemi başarıyla tamamlandı!
```

---

## 🚀 Backend Nasıl Çalıştırılır

### Tek Terminal'de (Önerilen)
```bash
npm run server:dev
```

Server çıktısı:
```
🚀 Server running on http://localhost:3001
📊 API docs: http://localhost:3001/health
```

---

## 📡 API Endpoints

### Health Check
```bash
curl http://localhost:3001/health
# {"status":"ok","message":"Server is running"}
```

### Employees API
```bash
# Tüm personelleri listele
curl http://localhost:3001/api/employees

# Tek personel
curl http://localhost:3001/api/employees/emp-001

# Şubeye göre filtrele
curl http://localhost:3001/api/employees?branchId=branch-1

# Yeni personel ekle
curl -X POST http://localhost:3001/api/employees \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test User","email":"test@example.com",...}'

# Personel güncelle
curl -X PUT http://localhost:3001/api/employees/emp-001 \
  -H "Content-Type: application/json" \
  -d '{"hourlyRate":100}'

# Personel sil
curl -X DELETE http://localhost:3001/api/employees/emp-001
```

### Branches API
```bash
# Tüm şubeler
curl http://localhost:3001/api/branches

# Tek şube (personel sayısı dahil)
curl http://localhost:3001/api/branches/branch-1
```

### Admin Login
```bash
curl -X POST http://localhost:3001/api/admins/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@posaca.com","password":"demo123"}'
```

---

## 🗄️ Veritabanı Yönetimi

### Prisma Studio (GUI)
```bash
npm run db:studio
# Tarayıcıda: http://localhost:5555
```

### Seed Yeniden Yükle
```bash
npm run db:seed
```

### Veritabanını Sıfırla
```bash
npm run db:reset  # Tüm verileri siler ve seed'i yeniden yükler
```

---

## 📂 Dosya Konumları

```
pos-sistemi/
├── prisma/
│   └── schema.prisma        ✅ Veritabanı şeması
├── server/
│   ├── index.ts             ✅ Express API
│   ├── db.ts                ✅ Prisma client
│   ├── seed.ts              ✅ Seed script
│   └── tsconfig.json        ✅ TS config
├── data/
│   ├── admins.json          ✅ Admin verisi
│   ├── branches.json        ✅ Şube verisi
│   └── employees.json       ✅ Personel verisi
├── .env                     ✅ Environment variables
├── dev.db                   ✅ SQLite database
└── BACKEND_DOKUMANTASYON.md ✅ Detaylı döküman
```

---

## 🎓 Employees Tablosu Örneği

**JSON Format** (`data/employees.json`):
```json
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
  "adminId": "demo-admin"
}
```

**Prisma Schema**:
```prisma
model Employee {
  id          String  @id @default(uuid())
  fullName    String
  email       String  @unique
  phone       String?
  role        String
  branchId    String
  isActive    Boolean @default(true)
  hourlyRate  Float
  employeePin String  @unique
  qrCode      String  @unique
  adminId     String

  admin   Admin  @relation(...)
  branch  Branch @relation(...)
  
  @@map("employees")
}
```

**SQL (SQLite)**:
```sql
CREATE TABLE employees (
  id TEXT PRIMARY KEY,
  fullName TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT NOT NULL,
  branchId TEXT NOT NULL,
  isActive INTEGER DEFAULT 1,
  hourlyRate REAL NOT NULL,
  employeePin TEXT UNIQUE NOT NULL,
  qrCode TEXT UNIQUE NOT NULL,
  adminId TEXT NOT NULL,
  FOREIGN KEY (adminId) REFERENCES admins(id),
  FOREIGN KEY (branchId) REFERENCES branches(id)
);
```

---

## 🔄 Veri Akışı

```
JSON Dosyası          Seed Script         SQLite DB          Express API
(data/employees.json) → (server/seed.ts) → (dev.db)       → (server/index.ts)
                                              ↓
                                         Prisma Client
                                              ↓
                                         Frontend (React)
```

---

## ✨ Sonraki Adımlar

1. ✅ Backend kurulumu **TAMAMLANDI**
2. ✅ Seed data yüklendi **TAMAMLANDI**
3. ✅ API endpoints hazır **TAMAMLANDI**
4. 🔜 Frontend'e axios entegrasyonu
5. 🔜 Diğer tablolar için seed JSON'ları ekle
6. 🔜 Authentication (JWT)

---

**Backend başarıyla kuruldu! 🎉**

Server çalıştırmak için:
```bash
npm run server:dev
```
