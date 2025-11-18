// Standalone API Server (GUI olmadan test için)
const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const os = require('os');
const fs = require('fs');
const path = require('path');

// Simple file-based storage for testing
const STORAGE_FILE = path.join(__dirname, '../.electron-storage.json');

class SimpleStore {
  constructor() {
    this.store = {};
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(STORAGE_FILE)) {
        const data = fs.readFileSync(STORAGE_FILE, 'utf8');
        this.store = JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load storage:', error);
      this.store = {};
    }
  }

  save() {
    try {
      fs.writeFileSync(STORAGE_FILE, JSON.stringify(this.store, null, 2));
    } catch (error) {
      console.error('Failed to save storage:', error);
    }
  }

  get(key, defaultValue = null) {
    return this.store[key] !== undefined ? this.store[key] : defaultValue;
  }

  set(key, value) {
    this.store[key] = value;
    this.save();
  }

  delete(key) {
    delete this.store[key];
    this.save();
  }

  clear() {
    this.store = {};
    this.save();
  }

  keys() {
    return Object.keys(this.store);
  }
}

const store = new SimpleStore();

const API_PORT = 3333;
const WS_PORT = 3334;
const app = express();
let wss = null;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Get server IP
function getServerIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Broadcast WebSocket update
function broadcastUpdate(key, data, action = 'update') {
  if (wss) {
    const message = JSON.stringify({ 
      type: action,
      key, 
      data,
      timestamp: Date.now()
    });
    
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    server: 'Spark POS Desktop API',
    version: '1.0.0',
    uptime: process.uptime(),
    serverIP: getServerIP()
  });
});

app.get('/api/keys', (req, res) => {
  const keys = store.keys();
  res.json({ keys });
});

app.get('/api/data/:key', (req, res) => {
  const { key } = req.params;
  const data = store.get(key, null);
  res.json({ key, data });
});

app.post('/api/data/:key', (req, res) => {
  const { key } = req.params;
  const { data } = req.body;
  
  store.set(key, data);
  broadcastUpdate(key, data);
  
  res.json({ success: true, key, data });
});

app.delete('/api/data/:key', (req, res) => {
  const { key } = req.params;
  store.delete(key);
  broadcastUpdate(key, null, 'delete');
  res.json({ success: true, key });
});

app.post('/api/clear', (req, res) => {
  store.clear();
  broadcastUpdate('*', null, 'clear');
  res.json({ success: true });
});

app.get('/api/sales', (req, res) => {
  const sales = store.get('sales', []);
  res.json({ sales });
});

app.post('/api/sales', (req, res) => {
  const { sale } = req.body;
  const sales = store.get('sales', []);
  sales.push(sale);
  store.set('sales', sales);
  
  broadcastUpdate('sales', sales);
  
  res.json({ success: true, sale });
});

app.get('/api/products', (req, res) => {
  const products = store.get('products', []);
  res.json({ products });
});

app.post('/api/products', (req, res) => {
  const { product } = req.body;
  const products = store.get('products', []);
  
  const existingIndex = products.findIndex(p => p.id === product.id);
  if (existingIndex >= 0) {
    products[existingIndex] = product;
  } else {
    products.push(product);
  }
  
  store.set('products', products);
  broadcastUpdate('products', products);
  
  res.json({ success: true, product });
});

// Start Express server
app.listen(API_PORT, '0.0.0.0', () => {
  const serverIP = getServerIP();
  console.log('');
  console.log('🚀 Spark POS API Server Started');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📡 REST API: http://${serverIP}:${API_PORT}`);
  console.log(`🔌 WebSocket: ws://${serverIP}:${WS_PORT}`);
  console.log(`📱 QR Code: spark://connect/${serverIP}:${API_PORT}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('Test komutları:');
  console.log(`  curl http://${serverIP}:${API_PORT}/api/health`);
  console.log(`  curl http://${serverIP}:${API_PORT}/api/products`);
  console.log('');
});

// Start WebSocket server
wss = new WebSocket.Server({ 
  port: WS_PORT,
  host: '0.0.0.0'
});

wss.on('connection', (ws, req) => {
  const clientIP = req.socket.remoteAddress;
  console.log(`📡 New WebSocket connection from ${clientIP}`);
  
  ws.send(JSON.stringify({ 
    type: 'connected',
    message: 'Connected to Spark POS Desktop',
    serverIP: getServerIP(),
    timestamp: Date.now()
  }));
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });
  
  ws.on('close', () => {
    console.log(`📴 WebSocket connection closed from ${clientIP}`);
  });
});

console.log(`🔌 WebSocket Server listening on ws://${getServerIP()}:${WS_PORT}`);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down servers...');
  wss.close();
  process.exit(0);
});
