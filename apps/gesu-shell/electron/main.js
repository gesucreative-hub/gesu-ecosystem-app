import { app, BrowserWindow, ipcMain } from 'electron';
import { runGlobalToolsCheck } from './tools-check.js';
import path from 'path';
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
