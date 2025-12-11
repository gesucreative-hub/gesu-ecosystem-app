import { app, BrowserWindow, ipcMain } from 'electron';
import { runGlobalToolsCheck } from './tools-check.js';
import path from 'path';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const preloadPath = path.join(__dirname, 'preload.cjs');

// DEV-ONLY: This entry file is designed to bootstrap the React dev server in Electron.
// In a future phase, this will be replaced/bundled for production.

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        title: 'Gesu Ecosystem v2 - Dev Shell',
        webPreferences: {
            preload: preloadPath,
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    // Load the Vite dev server URL
    const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    console.log(`[Electron] Loading URL: ${devUrl}`);
    mainWindow.loadURL(devUrl);

    // Optional: Open DevTools automatically in dev
    // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

ipcMain.handle('ping', async (event, payload) => {
    return {
        message: 'pong from main',
        receivedAt: new Date().toISOString(),
        payload,
    };
});

ipcMain.handle('tools:check', async (event, payload) => {
    const input = payload || {};
    const result = await runGlobalToolsCheck(input);
    return result;
});

// --- Job System (In-Memory Skeleton) ---
let jobs = [];

ipcMain.handle('jobs:list', async () => {
    return jobs;
});

ipcMain.handle('jobs:enqueue', async (event, payload) => {
    const type = payload.type || 'unknown';

    // Validation
    if (type === 'download' && !payload.payload?.url) {
        throw new Error('Missing URL for download job');
    }

    const newJob = {
        id: randomUUID().slice(0, 8),
        type,
        label: payload.label || 'Untitled Job',
        status: 'queued',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        payload: payload.payload || {},
    };

    jobs.unshift(newJob); // Add to top

    // Mock Processing Logic based on Type
    if (type === 'download' || type === 'test') {
        processMockJob(newJob.id);
    }

    return newJob;
});

function processMockJob(jobId) {
    // 1. Start "Running"
    setTimeout(() => {
        const idx = jobs.findIndex(j => j.id === jobId);
        if (idx === -1) return;

        jobs[idx].status = 'running';
        jobs[idx].updatedAt = new Date().toISOString();

        // 2. Finish "Success" or "Error"
        setTimeout(() => {
            const idx2 = jobs.findIndex(j => j.id === jobId);
            if (idx2 === -1) return;

            // 90% chance of success
            const isSuccess = Math.random() > 0.1;
            jobs[idx2].status = isSuccess ? 'success' : 'error';
            if (!isSuccess) jobs[idx2].errorMessage = "Simulated download failure (random).";
            jobs[idx2].updatedAt = new Date().toISOString();

        }, 3000); // 3s execution time

    }, 1000); // 1s queue time
}
