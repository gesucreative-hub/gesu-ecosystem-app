const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('gesu', {
    ping: (payload) => ipcRenderer.invoke('ping', payload),
    checkTools: (payload) => ipcRenderer.invoke('tools:check', payload),
    jobs: {
        enqueue: (payload) => ipcRenderer.invoke('jobs:enqueue', payload),
        list: () => ipcRenderer.invoke('jobs:list'),
    },
});
