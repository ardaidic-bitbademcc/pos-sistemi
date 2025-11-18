// Electron API type definitions
interface ElectronAPI {
  // Data operations
  getData: (key: string) => Promise<any>;
  setData: (key: string, value: any) => Promise<boolean>;
  deleteData: (key: string) => Promise<boolean>;
  clearData: () => Promise<boolean>;
  getAllKeys: () => Promise<string[]>;
  
  // Server info
  getServerInfo: () => Promise<{
    ip: string;
    apiPort: number;
    wsPort: number;
    apiUrl: string;
    wsUrl: string;
    qrCode: string;
  }>;
  
  // Platform info
  platform: string;
  isElectron: boolean;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
