const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('gesu', {
    ping: (payload) => ipcRenderer.invoke('ping', payload),
    checkTools: (payload) => ipcRenderer.invoke('tools:check', payload),
    jobs: {
        enqueue: (payload) => ipcRenderer.invoke('jobs:enqueue', payload),
        list: () => ipcRenderer.invoke('jobs:list'),
    },
    settings: {
        load: () => ipcRenderer.invoke('gesu:settings:load'),
        save: (settings) => ipcRenderer.invoke('gesu:settings:save', settings),
    },
    mediaSuite: {
        getRecentJobs: () => ipcRenderer.invoke('mediaSuite:getRecentJobs'),
        openFolder: (target) => ipcRenderer.invoke('mediaSuite:openFolder', target),
        pickSourceFile: () => ipcRenderer.invoke('mediaSuite:pickSourceFile'),
    },
});
