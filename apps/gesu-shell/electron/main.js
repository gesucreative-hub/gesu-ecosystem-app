import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { runGlobalToolsCheck } from './tools-check.js';
import path from 'path';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { appendJobLog, getRecentJobs } from './job-logger.js';

const DOWNLOADS_DIR = path.join(process.cwd(), 'downloads');
if (!fs.existsSync(DOWNLOADS_DIR)) {
    fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

function getDownloadOutputDir(target) {
    if (target === 'workflow') {
        // TODO: Read from Gesu.GlobalSettings.json later
        // Minimal hardcoded path for MVP as requested
        const wfDir = 'D:\\03. Resources\\_Gesu\'s\\WorkFlowDatabase\\_Apps\\GesuMediaSuite\\Downloads';
        if (!fs.existsSync(wfDir)) {
            try { fs.mkdirSync(wfDir, { recursive: true }); } catch (e) { console.error('Failed to create WF dir:', e); }
        }
        return wfDir;
    }
    // Default: Gesu Shell downloads folder
    return DOWNLOADS_DIR;
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

function resolveFfmpegExecutable(settings) {
    const configured = settings?.engines?.ffmpegPath;

    // If configured looks like a path and exists, use as-is
    if (configured && configured.trim() !== '' && fs.existsSync(configured)) {
        console.log('[Electron] Using configured FFmpeg:', configured);
        return configured;
    }

    // Otherwise, fall back to 'ffmpeg' (from PATH)
    if (configured) {
        console.warn('[Electron] Configured FFmpeg path invalid or not found, falling back to PATH:', configured);
    }
    return 'ffmpeg';
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

// --- Settings Persistence ---

const SETTINGS_FILE_PATH = path.join(app.getPath('userData'), 'gesu-settings.json');

async function loadSettingsFromDisk() {
    try {
        if (!fs.existsSync(SETTINGS_FILE_PATH)) return null;
        const data = await fs.promises.readFile(SETTINGS_FILE_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Failed to load settings:', err);
        return null;
    }
}

async function saveSettingsToDisk(settings) {
    try {
        await fs.promises.writeFile(SETTINGS_FILE_PATH, JSON.stringify(settings, null, 2), 'utf-8');
        console.log('Settings saved to:', SETTINGS_FILE_PATH);
    } catch (err) {
        console.error('Failed to save settings:', err);
        throw err;
    }
}

ipcMain.handle('gesu:settings:load', async () => {
    return await loadSettingsFromDisk();
});

ipcMain.handle('gesu:settings:save', async (event, settings) => {
    await saveSettingsToDisk(settings);
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
        const { url, preset, network, target } = payload.payload || {};
        // Log "queued" state immediately for downloads
        appendJobLog({
            id: newJob.id,
            url: url || 'unknown',
            preset: preset || 'unknown',
            network: network || 'unknown',
            target: target || 'shell',
            status: 'queued'
        });

        processDownloadJob(newJob.id, payload.payload);
    } else if (type === 'convert') {
        processConvertJob(newJob.id, payload.payload);
    } else if (type === 'test') {
        processMockJob(newJob.id);
    }

    return newJob;
});

ipcMain.handle('mediaSuite:getRecentJobs', async () => {
    return getRecentJobs();
});

ipcMain.handle('mediaSuite:openFolder', async (event, target) => {
    const dir = getDownloadOutputDir(target || 'shell');
    if (fs.existsSync(dir)) {
        await shell.openPath(dir);
        return { success: true };
    }
    return { success: false, error: 'Directory does not exist' };
});

function processDownloadJob(jobId, payload) {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    job.status = 'running';
    job.updatedAt = new Date().toISOString();

    const url = payload.url;
    const preset = payload.preset || 'video-best';
    const network = payload.network || 'normal';
    const target = payload.target || 'shell';

    console.log('[download job]', {
        id: job.id,
        url: job.payload.url,
        preset: job.payload.preset,
        network: job.payload.network,
        target: target,
    });

    const outputDir = getDownloadOutputDir(target);
    const presetArgs = buildPresetArgs(preset, outputDir);
    const networkArgs = buildNetworkArgs(network);

    const args = [
        ...presetArgs,
        ...networkArgs,
        url,
    ];

    console.log(`[Job:${jobId}] Spawning yt-dlp with args:`, args);

    // LOG: Spawned
    appendJobLog({
        id: job.id,
        url,
        preset,
        network,
        target,
        status: 'spawned',
        args
    });

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

            // LOG: Success
            appendJobLog({
                id: finishedJob.id,
                url,
                preset,
                network,
                target,
                status: 'success'
            });
        } else {
            finishedJob.status = 'error';
            // simple short error
            const shortError = stderr.split('\n').slice(0, 3).join(' ').trim();
            finishedJob.errorMessage = `yt-dlp exited with code ${code}. ${shortError}`;

            // LOG: Failed (Non-zero exit)
            appendJobLog({
                id: finishedJob.id,
                url,
                preset,
                network,
                target,
                status: 'failed',
                errorMessage: finishedJob.errorMessage
            });
        }
    });

    child.on('error', (err) => {
        const errorJob = jobs.find(j => j.id === jobId);
        if (!errorJob) return;

        errorJob.status = 'error';
        errorJob.errorMessage = `Failed to start yt-dlp: ${err.message}`;
        errorJob.updatedAt = new Date().toISOString();

        // LOG: Failed (Spawn error)
        appendJobLog({
            id: errorJob.id,
            url,
            preset,
            network,
            target,
            status: 'failed',
            errorMessage: errorJob.errorMessage
        });
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

async function processConvertJob(jobId, payload) {
    const { inputPath, targetFormat } = payload;

    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    job.status = 'running';
    job.updatedAt = new Date().toISOString();

    // 1. Resolve FFmpeg Path
    const settings = await loadSettingsFromDisk();
    const ffmpegBin = resolveFfmpegExecutable(settings);

    // 2. Determine Output Path
    const dir = path.dirname(inputPath);
    const name = path.basename(inputPath, path.extname(inputPath));
    const outputPath = path.join(dir, `${name}.${targetFormat}`);

    const args = [
        '-y',               // Overwrite output
        '-i', inputPath,    // Input
        outputPath          // Output
    ];

    console.log(`[Job:${jobId}] Spawning FFmpeg: "${ffmpegBin}" with args:`, args);

    const child = spawn(ffmpegBin, args, { shell: false, windowsHide: true });

    let stderr = '';

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
            // Optionally store the output path in the job payload or a new result field
            finishedJob.payload.outputPath = outputPath;
        } else {
            finishedJob.status = 'error';
            const shortError = stderr.split('\n').slice(-3).join(' ').trim();
            finishedJob.errorMessage = `FFmpeg exited with code ${code}. ${shortError}`;
        }
    });

    child.on('error', (err) => {
        const errorJob = jobs.find(j => j.id === jobId);
        if (!errorJob) return;

        errorJob.status = 'error';
        errorJob.errorMessage = `Failed to start FFmpeg: ${err.message}`;
        errorJob.updatedAt = new Date().toISOString();
    });
}
