const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('gesu', {
    ping: (payload) => ipcRenderer.invoke('ping', payload),
    checkTools: (payload) => ipcRenderer.invoke('tools:check', payload),
    jobs: {
        enqueue: (payload) => ipcRenderer.invoke('jobs:enqueue', payload),
        list: () => ipcRenderer.invoke('jobs:list'),
    },
    settings: {
        read: () => ipcRenderer.invoke('gesu:settings:read'),
        write: (settings) => ipcRenderer.invoke('gesu:settings:write', settings),
    },
    dialog: {
        pickFolder: (defaultPath) => ipcRenderer.invoke('gesu:dialog:pickFolder', defaultPath),
        pickFile: (opts) => ipcRenderer.invoke('gesu:dialog:pickFile', opts),
    },
    mediaSuite: {
        getRecentJobs: () => ipcRenderer.invoke('mediaSuite:getRecentJobs'),
        openFolder: (target) => ipcRenderer.invoke('mediaSuite:openFolder', target),
        pickSourceFile: () => ipcRenderer.invoke('mediaSuite:pickSourceFile'),
    },
});
