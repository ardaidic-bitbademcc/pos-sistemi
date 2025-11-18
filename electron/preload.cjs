const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Data operations
  getData: (key) => ipcRenderer.invoke('get-data', key),
  setData: (key, value) => ipcRenderer.invoke('set-data', key, value),
  deleteData: (key) => ipcRenderer.invoke('delete-data', key),
  clearData: () => ipcRenderer.invoke('clear-data'),
  getAllKeys: () => ipcRenderer.invoke('get-all-keys'),
  
  // Server info
  getServerInfo: () => ipcRenderer.invoke('get-server-info'),
  
  // Platform info
  platform: process.platform,
  isElectron: true
});

// Add console logging for debugging
console.log('🔌 Preload script loaded - Electron API bridge ready');
