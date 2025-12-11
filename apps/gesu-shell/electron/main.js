import { app, BrowserWindow, ipcMain } from 'electron';
import { runGlobalToolsCheck } from './tools-check.js';
import path from 'path';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import fs from 'node:fs';
import { spawn } from 'node:child_process';

const DOWNLOADS_DIR = path.join(process.cwd(), 'downloads');
if (!fs.existsSync(DOWNLOADS_DIR)) {
    fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

const YTDLP_BIN = 'yt-dlp'; // Assumes PATH access

function buildPresetArgs(preset, downloadsDir) {
    const outputTemplate = path.join(downloadsDir, '%(title)s.%(ext)s');

    switch (preset) {
        case 'music-mp3':
            return [
                '-x',
                '--audio-format', 'mp3',
                '-o', outputTemplate,
            ];
        case 'video-1080p':
            return [
                '-f', 'bestvideo[height<=1080]+bestaudio/best[height<=1080]',
                '--merge-output-format', 'mp4',
                '-o', outputTemplate,
            ];
        case 'video-best':
        default:
            return [
                '-f', 'bestvideo+bestaudio/best',
                '--merge-output-format', 'mp4',
                '-o', outputTemplate,
            ];
    }
}

function buildNetworkArgs(network) {
    switch (network) {
        case 'hemat':
            return ['--limit-rate', '250K'];
        case 'gaspol':
            return ['--limit-rate', '5M'];
        case 'normal':
        default:
            return [];
    }
}

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
    // Validation
    if (type === 'download' && !payload.payload?.url) {
        throw new Error('Missing URL for download job');
    }
    if (type === 'convert') {
        if (!payload.payload?.inputPath) throw new Error('Missing inputPath for convert job');
        if (!payload.payload?.targetFormat) throw new Error('Missing targetFormat for convert job');
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

    // Dispatch processing
    if (type === 'download') {
        processDownloadJob(newJob.id, payload.payload);
    } else if (type === 'convert') {
        processConvertJob(newJob.id, payload.payload);
    } else if (type === 'test') {
        processMockJob(newJob.id);
    }

    return newJob;
});

function processDownloadJob(jobId, payload) {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    job.status = 'running';
    job.updatedAt = new Date().toISOString();

    const url = payload.url;
    const preset = payload.preset || 'video-best';
    const network = payload.network || 'normal';

    const presetArgs = buildPresetArgs(preset, DOWNLOADS_DIR);
    const networkArgs = buildNetworkArgs(network);

    const args = [
        ...presetArgs,
        ...networkArgs,
        url,
    ];

    console.log(`[Job:${jobId}] Spawning yt-dlp with args:`, args);

    const child = spawn(YTDLP_BIN, args, { shell: false, windowsHide: true });

    let stderr = '';

    // Optional: capture stdout for progress parsing later
    child.stdout.on('data', () => { });

    child.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
    });

    child.on('close', (code) => {
        const finishedJob = jobs.find(j => j.id === jobId);
        if (!finishedJob) return;

        finishedJob.updatedAt = new Date().toISOString();

        if (code === 0) {
            finishedJob.status = 'success';
            finishedJob.errorMessage = undefined;
        } else {
            finishedJob.status = 'error';
            // simple short error
            const shortError = stderr.split('\n').slice(0, 3).join(' ').trim();
            finishedJob.errorMessage = `yt-dlp exited with code ${code}. ${shortError}`;
        }
    });

    child.on('error', (err) => {
        const errorJob = jobs.find(j => j.id === jobId);
        if (!errorJob) return;

        errorJob.status = 'error';
        errorJob.errorMessage = `Failed to start yt-dlp: ${err.message}`;
        errorJob.updatedAt = new Date().toISOString();
    });
}

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

function processConvertJob(jobId, payload) {
    const { targetFormat } = payload;

    // 1. Start "Running"
    setTimeout(() => {
        const job = jobs.find(j => j.id === jobId);
        if (!job) return;

        job.status = 'running';
        job.updatedAt = new Date().toISOString();

        // 2. Mock Conversion Work
        setTimeout(() => {
            const finishedJob = jobs.find(j => j.id === jobId);
            if (!finishedJob) return;

            finishedJob.status = 'success';
            finishedJob.updatedAt = new Date().toISOString();
            // Optional: add a result message if we decide to add that field later
            // finishedJob.resultMessage = `Converted to ${targetFormat} (mock)`;
        }, 2500);

    }, 500);
}
