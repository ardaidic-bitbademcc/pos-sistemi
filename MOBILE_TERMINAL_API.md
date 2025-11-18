# Mobil Terminal API Client

Bu dosya, iOS ve Android uygulamalarından Electron sunucusuna bağlanmak için kullanılacak API client örneğini içerir.

## React Native Örneği

```typescript
// api/sparkClient.ts
import { useState, useEffect, useCallback } from 'react';

interface ServerConfig {
  apiUrl: string;
  wsUrl: string;
  isConnected: boolean;
}

class SparkPOSClient {
  private apiUrl: string = '';
  private wsUrl: string = '';
  private ws: WebSocket | null = null;
  private reconnectInterval: NodeJS.Timeout | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  async connect(serverIP: string, apiPort: number = 3333, wsPort: number = 3334) {
    this.apiUrl = `http://${serverIP}:${apiPort}`;
    this.wsUrl = `ws://${serverIP}:${wsPort}`;
    
    // Test API connection
    const isConnected = await this.testConnection();
    if (isConnected) {
      this.connectWebSocket();
    }
    
    return isConnected;
  }

  async connectFromQRCode(qrData: string) {
    // Parse: spark://connect/192.168.1.100:3333
    const match = qrData.match(/spark:\/\/connect\/(.+):(\d+)/);
    if (match) {
      const [, ip, port] = match;
      return this.connect(ip, parseInt(port), parseInt(port) + 1);
    }
    return false;
  }

  private async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/api/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      console.log('✅ Connected to:', data);
      return data.status === 'ok';
    } catch (error) {
      console.error('❌ Connection failed:', error);
      return false;
    }
  }

  private connectWebSocket() {
    if (this.ws) {
      this.ws.close();
    }

    this.ws = new WebSocket(this.wsUrl);

    this.ws.onopen = () => {
      console.log('🔌 WebSocket connected');
      this.startHeartbeat();
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('📨 Received:', message);
        
        // Notify listeners
        const listeners = this.listeners.get(message.key);
        if (listeners) {
          listeners.forEach(callback => callback(message));
        }
        
        // Notify wildcard listeners
        const wildcardListeners = this.listeners.get('*');
        if (wildcardListeners) {
          wildcardListeners.forEach(callback => callback(message));
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('🔌 WebSocket disconnected');
      this.stopHeartbeat();
      // Auto-reconnect after 5 seconds
      this.reconnectInterval = setTimeout(() => {
        this.connectWebSocket();
      }, 5000);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  private startHeartbeat() {
    this.reconnectInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Ping every 30 seconds
  }

  private stopHeartbeat() {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }
  }

  // Subscribe to data updates
  subscribe(key: string, callback: (data: any) => void) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(callback);
    
    return () => {
      const listeners = this.listeners.get(key);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }

  // REST API Methods
  async getData<T>(key: string): Promise<T | null> {
    try {
      const response = await fetch(`${this.apiUrl}/api/data/${key}`);
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error(`Failed to get data for ${key}:`, error);
      return null;
    }
  }

  async setData<T>(key: string, data: T): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/api/data/${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data })
      });
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error(`Failed to set data for ${key}:`, error);
      return false;
    }
  }

  async getSales(): Promise<any[]> {
    try {
      const response = await fetch(`${this.apiUrl}/api/sales`);
      const result = await response.json();
      return result.sales;
    } catch (error) {
      console.error('Failed to get sales:', error);
      return [];
    }
  }

  async addSale(sale: any): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/api/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sale })
      });
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Failed to add sale:', error);
      return false;
    }
  }

  async getProducts(): Promise<any[]> {
    try {
      const response = await fetch(`${this.apiUrl}/api/products`);
      const result = await response.json();
      return result.products;
    } catch (error) {
      console.error('Failed to get products:', error);
      return [];
    }
  }

  async updateProduct(product: any): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product })
      });
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Failed to update product:', error);
      return false;
    }
  }

  disconnect() {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
  }
}

// Singleton instance
export const sparkClient = new SparkPOSClient();

// React Hook
export function useSparkPOS() {
  const [isConnected, setIsConnected] = useState(false);
  const [serverInfo, setServerInfo] = useState<ServerConfig | null>(null);

  const connect = useCallback(async (serverIP: string) => {
    const success = await sparkClient.connect(serverIP);
    setIsConnected(success);
    if (success) {
      setServerInfo({
        apiUrl: `http://${serverIP}:3333`,
        wsUrl: `ws://${serverIP}:3334`,
        isConnected: true
      });
    }
    return success;
  }, []);

  const connectQR = useCallback(async (qrData: string) => {
    const success = await sparkClient.connectFromQRCode(qrData);
    setIsConnected(success);
    return success;
  }, []);

  const disconnect = useCallback(() => {
    sparkClient.disconnect();
    setIsConnected(false);
    setServerInfo(null);
  }, []);

  return {
    isConnected,
    serverInfo,
    connect,
    connectQR,
    disconnect,
    client: sparkClient
  };
}
```

## Kullanım Örneği

```typescript
// screens/POSScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Button } from 'react-native';
import { useSparkPOS, sparkClient } from '../api/sparkClient';

export default function POSScreen() {
  const { isConnected, connect } = useSparkPOS();
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);

  useEffect(() => {
    if (isConnected) {
      loadData();
      
      // Subscribe to real-time updates
      const unsubscribe = sparkClient.subscribe('*', (message) => {
        console.log('Real-time update:', message);
        if (message.key === 'products') {
          setProducts(message.data);
        } else if (message.key === 'sales') {
          setSales(message.data);
        }
      });

      return () => {
        unsubscribe();
      };
    }
  }, [isConnected]);

  const loadData = async () => {
    const products = await sparkClient.getProducts();
    const sales = await sparkClient.getSales();
    setProducts(products);
    setSales(sales);
  };

  const handleSale = async (saleData: any) => {
    const success = await sparkClient.addSale(saleData);
    if (success) {
      console.log('✅ Sale recorded');
    }
  };

  if (!isConnected) {
    return (
      <View>
        <Text>Sunucuya bağlanılmadı</Text>
        <Button title="Bağlan" onPress={() => connect('192.168.1.100')} />
      </View>
    );
  }

  return (
    <View>
      <Text>Bağlı: ✅</Text>
      <Text>Ürünler: {products.length}</Text>
      <Text>Satışlar: {sales.length}</Text>
    </View>
  );
}
```

## QR Kod Tarama Örneği

```typescript
// screens/ConnectScreen.tsx
import React from 'react';
import { View, Button } from 'react-native';
import { Camera } from 'expo-camera';
import { useSparkPOS } from '../api/sparkClient';

export default function ConnectScreen() {
  const { connectQR } = useSparkPOS();

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (data.startsWith('spark://connect/')) {
      const success = await connectQR(data);
      if (success) {
        console.log('✅ Connected via QR Code');
        // Navigate to POS screen
      }
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Camera
        style={{ flex: 1 }}
        onBarCodeScanned={handleBarCodeScanned}
      />
      <Button title="Manuel Bağlan" onPress={() => {/* Show IP input */}} />
    </View>
  );
}
```

## Bağlantı Testi

```bash
# Terminal'de test et
curl http://192.168.1.100:3333/api/health

# Ürünleri çek
curl http://192.168.1.100:3333/api/products

# Satış ekle
curl -X POST http://192.168.1.100:3333/api/sales \
  -H "Content-Type: application/json" \
  -d '{"sale": {"id": "test-123", "total": 100, "date": "2024-01-01"}}'
```
