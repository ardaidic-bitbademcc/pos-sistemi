const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const Store = require('electron-store');
const os = require('os');

// Electron store for local data persistence
const store = new Store({
  name: 'spark-pos-data',
  encryptionKey: 'spark-pos-2024'
});

// Express API server configuration
const API_PORT = 3333;
const WS_PORT = 3334;
const expressApp = express();
let mainWindow = null;
let wss = null;

// Middleware
expressApp.use(cors());
expressApp.use(express.json({ limit: '50mb' }));

// API Routes
expressApp.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    server: 'Spark POS Desktop',
    version: app.getVersion(),
    uptime: process.uptime()
  });
});

// Get all keys
expressApp.get('/api/keys', (req, res) => {
  const keys = Object.keys(store.store);
  res.json({ keys });
});

// Get data by key
expressApp.get('/api/data/:key', (req, res) => {
  const { key } = req.params;
  const data = store.get(key, null);
  res.json({ key, data });
});

// Set data
expressApp.post('/api/data/:key', (req, res) => {
  const { key } = req.params;
  const { data } = req.body;
  
  store.set(key, data);
  
  // Broadcast update to all connected WebSocket clients
  broadcastUpdate(key, data);
  
  res.json({ success: true, key, data });
});

// Delete data
expressApp.delete('/api/data/:key', (req, res) => {
  const { key } = req.params;
  store.delete(key);
  
  // Broadcast deletion
  broadcastUpdate(key, null, 'delete');
  
  res.json({ success: true, key });
});

// Clear all data
expressApp.post('/api/clear', (req, res) => {
  store.clear();
  broadcastUpdate('*', null, 'clear');
  res.json({ success: true });
});

// Sales endpoint
expressApp.get('/api/sales', (req, res) => {
  const sales = store.get('sales', []);
  res.json({ sales });
});

expressApp.post('/api/sales', (req, res) => {
  const { sale } = req.body;
  const sales = store.get('sales', []);
  sales.push(sale);
  store.set('sales', sales);
  
  broadcastUpdate('sales', sales);
  
  res.json({ success: true, sale });
});

// Products endpoint
expressApp.get('/api/products', (req, res) => {
  const products = store.get('products', []);
  res.json({ products });
});

expressApp.post('/api/products', (req, res) => {
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

// Get server IP address
function getServerIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (i.e. 127.0.0.1) and non-ipv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// WebSocket broadcast function
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

// Start Express API server
function startAPIServer() {
  expressApp.listen(API_PORT, '0.0.0.0', () => {
    const serverIP = getServerIP();
    console.log(`🚀 Spark POS API Server running on http://${serverIP}:${API_PORT}`);
    console.log(`📱 Mobile terminals can connect to: http://${serverIP}:${API_PORT}`);
  });
}

// Start WebSocket server
function startWebSocketServer() {
  wss = new WebSocket.Server({ 
    port: WS_PORT,
    host: '0.0.0.0'
  });
  
  wss.on('connection', (ws, req) => {
    const clientIP = req.socket.remoteAddress;
    console.log(`📡 New WebSocket connection from ${clientIP}`);
    
    // Send welcome message
    ws.send(JSON.stringify({ 
      type: 'connected',
      message: 'Connected to Spark POS Desktop',
      serverIP: getServerIP(),
      timestamp: Date.now()
    }));
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        console.log('Received:', data);
        
        // Handle ping/pong
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
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });
  
  const serverIP = getServerIP();
  console.log(`🔌 WebSocket Server running on ws://${serverIP}:${WS_PORT}`);
}

// Create main window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    },
    icon: path.join(__dirname, '../public/icon.png')
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers
ipcMain.handle('get-data', async (event, key) => {
  return store.get(key, null);
});

ipcMain.handle('set-data', async (event, key, value) => {
  store.set(key, value);
  broadcastUpdate(key, value);
  return true;
});

ipcMain.handle('delete-data', async (event, key) => {
  store.delete(key);
  broadcastUpdate(key, null, 'delete');
  return true;
});

ipcMain.handle('clear-data', async () => {
  store.clear();
  broadcastUpdate('*', null, 'clear');
  return true;
});

ipcMain.handle('get-all-keys', async () => {
  return Object.keys(store.store);
});

ipcMain.handle('get-server-info', async () => {
  const serverIP = getServerIP();
  return {
    ip: serverIP,
    apiPort: API_PORT,
    wsPort: WS_PORT,
    apiUrl: `http://${serverIP}:${API_PORT}`,
    wsUrl: `ws://${serverIP}:${WS_PORT}`,
    qrCode: `spark://connect/${serverIP}:${API_PORT}`
  };
});

// App lifecycle
app.whenReady().then(() => {
  // Start servers
  startAPIServer();
  startWebSocketServer();
  
  // Create window
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (wss) {
      wss.close();
    }
    app.quit();
  }
});

app.on('before-quit', () => {
  console.log('🛑 Shutting down servers...');
  if (wss) {
    wss.close();
  }
});
