# Electron Desktop API Sunucu Testi

Bu belge, Electron uygulamasının API sunucusunu test etmek için kullanılır.

## Test Komutları

### 1. Sadece Node.js ile API Sunucusunu Başlat

Electron GUI olmadan sadece API sunucusunu test etmek için:

```bash
node electron/api-server.js
```

### 2. Sunucu Sağlık Kontrolü

```bash
curl http://localhost:3333/api/health
```

Beklenen yanıt:
```json
{
  "status": "ok",
  "server": "Spark POS Desktop",
  "version": "0.0.0",
  "uptime": 12.345
}
```

### 3. Veri İşlemleri

#### Veri Kaydet
```bash
curl -X POST http://localhost:3333/api/data/test \
  -H "Content-Type: application/json" \
  -d '{"data": {"message": "Hello from mobile terminal"}}'
```

#### Veri Oku
```bash
curl http://localhost:3333/api/data/test
```

#### Tüm Anahtarları Listele
```bash
curl http://localhost:3333/api/keys
```

### 4. Satış İşlemleri

#### Satış Ekle
```bash
curl -X POST http://localhost:3333/api/sales \
  -H "Content-Type: application/json" \
  -d '{
    "sale": {
      "id": "1708000000000-abc123",
      "date": "2024-01-17T20:15:00.000Z",
      "total": 150.50,
      "items": [
        {"productId": "p1", "name": "Kahve", "price": 25, "quantity": 2},
        {"productId": "p2", "name": "Kek", "price": 50.25, "quantity": 2}
      ],
      "employeeId": "emp1",
      "cashRegisterId": "cr1"
    }
  }'
```

#### Satışları Listele
```bash
curl http://localhost:3333/api/sales
```

### 5. Ürün İşlemleri

#### Ürün Ekle/Güncelle
```bash
curl -X POST http://localhost:3333/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "product": {
      "id": "p1",
      "name": "Türk Kahvesi",
      "price": 25,
      "category": "İçecekler",
      "stock": 100
    }
  }'
```

#### Ürünleri Listele
```bash
curl http://localhost:3333/api/products
```

### 6. WebSocket Bağlantı Testi

JavaScript ile:

```javascript
const ws = new WebSocket('ws://localhost:3334');

ws.onopen = () => {
  console.log('✅ Connected to WebSocket');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('📨 Received:', data);
};

// Ping gönder
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'ping' }));
  }
}, 30000);
```

## Standalone API Sunucu

Electron GUI'siz sadece API sunucusu çalıştırmak için ayrı bir dosya:
