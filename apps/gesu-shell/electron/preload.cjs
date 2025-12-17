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
        onSettingsChanged: (callback) => {
            const subscription = (event, newSettings) => callback(newSettings);
            ipcRenderer.on('gesu:settings:changed', subscription);
            // Return unsubscribe function
            return () => ipcRenderer.removeListener('gesu:settings:changed', subscription);
        },
    },
    dialog: {
        pickFolder: (defaultPath) => ipcRenderer.invoke('gesu:dialog:pickFolder', defaultPath),
        pickFile: (opts) => ipcRenderer.invoke('gesu:dialog:pickFile', opts),
    },
    scaffold: {
        preview: (input) => ipcRenderer.invoke('scaffold:preview', input),
        create: (input) => ipcRenderer.invoke('scaffold:create', input),
    },
    projects: {
        list: () => ipcRenderer.invoke('projects:list'),
    },
    compassSnapshots: {
        append: (snapshot) => ipcRenderer.invoke('compass:snapshots:append', snapshot),
        list: (options) => ipcRenderer.invoke('compass:snapshots:list', options),
    },
    workflowBlueprints: {
        get: () => ipcRenderer.invoke('workflow:blueprints:get'),
        save: (data) => ipcRenderer.invoke('workflow:blueprints:save', data),
    },
    mediaJobs: {
        enqueue: (payload) => ipcRenderer.invoke('media:job:enqueue', payload),
        list: () => ipcRenderer.invoke('media:job:list'),
        cancel: (jobId) => ipcRenderer.invoke('media:job:cancel', jobId),
        cancelAll: () => ipcRenderer.invoke('media:job:cancelAll'),
        onProgress: (callback) => {
            const subscription = (event, data) => callback(data);
            ipcRenderer.on('media:job:progress', subscription);
            return () => ipcRenderer.removeListener('media:job:progress', subscription);
        },
        onComplete: (callback) => {
            const subscription = (event, data) => callback(data);
            ipcRenderer.on('media:job:complete', subscription);
            return () => ipcRenderer.removeListener('media:job:complete', subscription);
        },
        onUpdate: (callback) => {
            const subscription = (event, data) => callback(data);
            ipcRenderer.on('media:job:update', subscription);
            return () => ipcRenderer.removeListener('media:job:update', subscription);
        },
    },
    mediaSuite: {
        getRecentJobs: () => ipcRenderer.invoke('mediaSuite:getRecentJobs'),
        openFolder: (target) => ipcRenderer.invoke('mediaSuite:openFolder', target),
        pickSourceFile: () => ipcRenderer.invoke('mediaSuite:pickSourceFile'),
        pickOutputFolder: (defaultPath) => ipcRenderer.invoke('mediaSuite:pickOutputFolder', defaultPath),
        updateYtDlp: () => ipcRenderer.invoke('mediaSuite:updateYtDlp'),
    },
    shell: {
        openPath: (path) => ipcRenderer.invoke('shell:openPath', path),
    },
});

