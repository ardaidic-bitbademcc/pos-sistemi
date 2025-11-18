import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { WifiIcon, DevicePhoneMobileIcon, QrCodeIcon } from '@heroicons/react/24/outline';

interface ServerInfo {
  ip: string;
  apiPort: number;
  wsPort: number;
  apiUrl: string;
  wsUrl: string;
  qrCode: string;
}

export default function ElectronServerInfo() {
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
  const [isElectron, setIsElectron] = useState(false);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    // Check if running in Electron
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      setIsElectron(true);
      loadServerInfo();
    }
  }, []);

  const loadServerInfo = async () => {
    try {
      const info = await (window as any).electronAPI.getServerInfo();
      setServerInfo(info);
      console.log('📡 Server Info:', info);
    } catch (error) {
      console.error('Failed to load server info:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Panoya kopyalandı!');
  };

  const generateQRCode = () => {
    if (!serverInfo) return;
    
    // QR code generation using a simple library or API
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(serverInfo.qrCode)}`;
    
    return (
      <div className="flex flex-col items-center gap-4 p-4 bg-white rounded-lg">
        <img src={qrUrl} alt="QR Code" className="w-64 h-64" />
        <p className="text-sm text-gray-600 text-center">
          Mobil terminalde bu QR kodu okutun
        </p>
        <code className="text-xs bg-gray-100 p-2 rounded">
          {serverInfo.qrCode}
        </code>
      </div>
    );
  };

  if (!isElectron) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sunucu Bilgileri</CardTitle>
          <CardDescription>
            Bu özellik sadece Electron masaüstü uygulamasında çalışır
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!serverInfo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sunucu Bilgileri Yükleniyor...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WifiIcon className="w-6 h-6 text-green-600" />
            Sunucu Bilgileri
          </CardTitle>
          <CardDescription>
            Mobil terminaller bu sunucuya bağlanabilir
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Sunucu IP Adresi</p>
              <div className="flex items-center gap-2">
                <code className="text-lg font-mono bg-gray-100 px-3 py-2 rounded flex-1">
                  {serverInfo.ip}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(serverInfo.ip)}
                >
                  Kopyala
                </Button>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">API Port</p>
              <Badge variant="secondary" className="text-lg">
                {serverInfo.apiPort}
              </Badge>
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-sm text-gray-500 mb-2">REST API URL</p>
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono bg-blue-50 px-3 py-2 rounded flex-1 text-blue-700">
                {serverInfo.apiUrl}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(serverInfo.apiUrl)}
              >
                Kopyala
              </Button>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-2">WebSocket URL</p>
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono bg-purple-50 px-3 py-2 rounded flex-1 text-purple-700">
                {serverInfo.wsUrl}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(serverInfo.wsUrl)}
              >
                Kopyala
              </Button>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DevicePhoneMobileIcon className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium">Mobil Terminal Bağlantısı</span>
            </div>
            <Button
              onClick={() => setShowQR(!showQR)}
              variant={showQR ? "secondary" : "default"}
              className="gap-2"
            >
              <QrCodeIcon className="w-5 h-5" />
              {showQR ? 'QR Kodu Gizle' : 'QR Kod Göster'}
            </Button>
          </div>

          {showQR && (
            <div className="mt-4">
              {generateQRCode()}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mobil Terminal Bağlantı Talimatları</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
            <li>Mobil cihazınızda Spark POS uygulamasını açın</li>
            <li>Ayarlar menüsünden "Sunucuya Bağlan" seçeneğini seçin</li>
            <li>Yukarıdaki QR kodu okutun veya manuel olarak sunucu bilgilerini girin</li>
            <li>Bağlantı kurulduğunda mobil terminal kullanıma hazır olacak</li>
          </ol>
          
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              <strong>Not:</strong> Mobil cihazınız ve bu bilgisayar aynı WiFi ağında olmalıdır.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
