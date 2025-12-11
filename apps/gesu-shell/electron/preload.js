import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('gesu', {
    ping: (payload) => ipcRenderer.invoke('ping', payload),
});