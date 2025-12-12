import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron';
import { runGlobalToolsCheck, resolveToolPath } from './tools-check.js';
import path from 'path';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { appendJobLog, getRecentJobs } from './job-logger.js';
import { registerSettingsHandlers, loadGlobalSettings } from './settings-store.js';

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

// --- Tool Resolution Helpers ---

async function resolveExecutable(settings, engineId, defaultBin) {
    const configuredPath = settings?.engines?.[`${engineId}Path`];
    // resolveToolPath handles validation of configuredPath and fallback to defaultBin
    const { path } = await resolveToolPath(configuredPath, defaultBin);
    return path;
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
    // Merge provided payload with saved settings
    const settings = await loadGlobalSettings();
    const input = {
        ytDlpPath: payload?.ytDlpPath || settings.engines?.ytDlpPath,
        ffmpegPath: payload?.ffmpegPath || settings.engines?.ffmpegPath,
        imageMagickPath: payload?.imageMagickPath || settings.engines?.imageMagickPath,
        libreOfficePath: payload?.libreOfficePath || settings.engines?.libreOfficePath
    };

    const result = await runGlobalToolsCheck(input);
    return result;
});

// --- Settings Persistence ---
// Now handled by settings-store.js
registerSettingsHandlers();

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
        if (!payload.payload?.preset) throw new Error('Missing preset for convert job');
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
    return { success: false, error: 'Directory does not exist' };
});

ipcMain.handle('mediaSuite:pickSourceFile', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
            { name: 'Media Files', extensions: ['mp4', 'mkv', 'mp3', 'wav', 'flac', 'avi', 'mov'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });
    if (canceled || filePaths.length === 0) return null;
    if (canceled || filePaths.length === 0) return null;
    return filePaths[0];
});

// --- Generic Dialog Handlers (Settings v2) ---

ipcMain.handle('gesu:dialog:pickFolder', async (event, defaultPath) => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        defaultPath,
        properties: ['openDirectory']
    });
    if (canceled || filePaths.length === 0) return null;
    return filePaths[0];
});

ipcMain.handle('gesu:dialog:pickFile', async (event, { defaultPath, filters }) => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        defaultPath,
        properties: ['openFile'],
        filters: filters || [{ name: 'All Files', extensions: ['*'] }]
    });
    if (canceled || filePaths.length === 0) return null;
    return filePaths[0];
});

// Re-add helpers removed during replacement block optimization
function buildPresetArgs(preset, downloadsDir) {
    const outputTemplate = path.join(downloadsDir, '%(title)s.%(ext)s');
    switch (preset) {
        case 'music-mp3': return ['-x', '--audio-format', 'mp3', '-o', outputTemplate];
        case 'video-1080p': return ['-f', 'bestvideo[height<=1080]+bestaudio/best[height<=1080]', '--merge-output-format', 'mp4', '-o', outputTemplate];
        default: return ['-f', 'bestvideo+bestaudio/best', '--merge-output-format', 'mp4', '-o', outputTemplate];
    }
}
function buildNetworkArgs(network) {
    switch (network) {
        case 'hemat': return ['--limit-rate', '250K'];
        case 'gaspol': return ['--limit-rate', '5M'];
        default: return [];
    }
}

async function processDownloadJob(jobId, payload) {
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



    // Resolve Tool
    const settings = await loadGlobalSettings();
    const ytdlpPath = await resolveExecutable(settings, 'ytDlp', 'yt-dlp');

    if (!ytdlpPath) {
        const errMsg = 'yt-dlp not found in PATH or config';
        job.status = 'failed';
        job.errorMessage = errMsg;
        appendJobLog({ id: job.id, url, preset, network, target, status: 'failed', errorMessage: errMsg });
        return;
    }

    const child = spawn(ytdlpPath, args, { shell: false, windowsHide: true });

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

// --- Media Suite Helpers ---

const CONVERT_PRESETS = {
    'audio-mp3-320': {
        category: 'audio',
        label: 'Audio MP3 – 320 kbps',
        extension: 'mp3',
        args: ['-vn', '-acodec', 'libmp3lame', '-b:a', '320k']
    },
    'audio-mp3-192': {
        category: 'audio',
        label: 'Audio MP3 – 192 kbps',
        extension: 'mp3',
        args: ['-vn', '-acodec', 'libmp3lame', '-b:a', '192k']
    },
    'audio-wav-48k': {
        category: 'audio',
        label: 'Audio WAV – 48 kHz',
        extension: 'wav',
        args: ['-vn', '-acodec', 'pcm_s16le', '-ar', '48000', '-ac', '2']
    },
    'audio-aac-256': {
        category: 'audio',
        label: 'Audio AAC – 256 kbps',
        extension: 'm4a',
        args: ['-vn', '-c:a', 'aac', '-b:a', '256k']
    },
    'video-mp4-1080p': {
        category: 'video',
        label: 'Video MP4 – 1080p (HQ)',
        extension: 'mp4',
        args: ['-vf', 'scale=-2:1080', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-c:a', 'aac', '-b:a', '192k']
    },
    'video-mp4-720p': {
        category: 'video',
        label: 'Video MP4 – 720p',
        extension: 'mp4',
        args: ['-vf', 'scale=-2:720', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-c:a', 'aac', '-b:a', '160k']
    },
    'video-mp4-540p-lite': {
        category: 'video',
        label: 'Video MP4 – 540p (Lite)',
        extension: 'mp4',
        args: ['-vf', 'scale=-2:540', '-c:v', 'libx264', '-preset', 'faster', '-crf', '23', '-c:a', 'aac', '-b:a', '128k']
    },
    'video-advanced': {
        category: 'video',
        label: 'Video (Advanced)',
        extension: 'mp4',
        dynamic: true
    }
};

async function processConvertJob(jobId, payload) {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    job.status = 'running';
    job.updatedAt = new Date().toISOString();

    const inputPath = payload.inputPath;
    const preset = payload.preset;
    const target = payload.target || 'shell';

    // 1. Validate Preset
    const presetCfg = CONVERT_PRESETS[preset];
    if (!presetCfg) {
        const errMsg = `Unknown convert preset: ${preset}`;
        job.status = 'failed';
        job.errorMessage = errMsg;
        appendJobLog({
            id: job.id, type: 'convert', sourcePath: inputPath, preset, target,
            status: 'failed', errorMessage: errMsg
        });
        return;
    }

    // 2. Determine Output Path
    const outputDir = getDownloadOutputDir(target);
    const parsed = path.parse(inputPath);
    // Explicitly use extension from map
    const outputName = `${parsed.name}.${presetCfg.extension}`;
    const outputPath = path.join(outputDir, outputName);

    // Create output dir if needed
    try {
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
    } catch (e) {
        console.error('Failed to create output dir', e);
    }

    console.log('[convert job]', {
        id: job.id,
        source: inputPath,
        output: outputPath,
        preset
    });



    const settings = await loadGlobalSettings();
    const ffmpegPath = await resolveExecutable(settings, 'ffmpeg', 'ffmpeg');

    if (!ffmpegPath) {
        const errMsg = 'FFmpeg not found in PATH or config';
        job.status = 'failed';
        job.errorMessage = errMsg;

        appendJobLog({
            id: job.id, type: 'convert', sourcePath: inputPath, preset, target,
            status: 'failed', errorMessage: errMsg
        });
        return;
    }

    // 3. Build FFmpeg args
    let convertArgs = [];

    if (preset === 'video-advanced') {
        const opts = payload.advancedOptions || {};
        console.log('[convert job] Building advanced args for:', opts);

        // Resolution
        if (opts.resolution && opts.resolution !== 'source') {
            const h = opts.resolution.replace('p', '');
            convertArgs.push('-vf', `scale=-2:${h}`);
        }

        // Quality (CRF)
        let crf = '20'; // medium default
        if (opts.quality === 'high') crf = '18';
        if (opts.quality === 'lite') crf = '23';
        convertArgs.push('-c:v', 'libx264', '-preset', 'medium', '-crf', crf);

        // Audio
        if (opts.audio === 'copy') {
            convertArgs.push('-c:a', 'copy');
        } else if (opts.audio === 'aac-128') {
            convertArgs.push('-c:a', 'aac', '-b:a', '128k');
        } else if (opts.audio === 'aac-192') {
            convertArgs.push('-c:a', 'aac', '-b:a', '192k');
        } else {
            // default to aac 128 if undefined
            convertArgs.push('-c:a', 'aac', '-b:a', '128k');
        }

    } else {
        convertArgs = presetCfg.args || [];
    }

    const args = [
        '-y',               // Overwrite output
        '-i', inputPath,    // Input
        ...convertArgs,     // Preset/Dynamic args
        outputPath          // Output
    ];

    console.log(`[Job:${jobId}] Spawning ffmpeg with args:`, args);

    // LOG: Spawned
    appendJobLog({
        id: job.id,
        type: 'convert',
        sourcePath: inputPath,
        preset, target,
        status: 'spawned',
        args,
        advancedOptions: payload.advancedOptions
    });

    const child = spawn(ffmpegPath, args, { shell: false, windowsHide: true });

    let stderr = '';
    child.stderr.on('data', (d) => { stderr += d.toString(); });

    child.on('close', (code) => {
        const finishedJob = jobs.find(j => j.id === jobId);
        if (!finishedJob) return;

        finishedJob.updatedAt = new Date().toISOString();

        if (code === 0) {
            finishedJob.status = 'success';
            finishedJob.payload = { ...finishedJob.payload, outputPath };

            // LOG: Success
            appendJobLog({
                id: finishedJob.id,
                type: 'convert',
                sourcePath: inputPath,
                preset, target,
                outputPath, // Log output path
                status: 'success'
            });
        } else {
            finishedJob.status = 'failed';
            const shortError = stderr.split('\n').slice(-5).join(' ').trim();
            finishedJob.errorMessage = `ffmpeg exited with code ${code}. ${shortError}`;

            // LOG: Failed
            appendJobLog({
                id: finishedJob.id,
                type: 'convert',
                sourcePath: inputPath,
                preset, target,
                status: 'failed',
                errorMessage: finishedJob.errorMessage
            });
        }
    });

    child.on('error', (err) => {
        const errorJob = jobs.find(j => j.id === jobId);
        if (!errorJob) return;
        errorJob.status = 'failed';
        errorJob.errorMessage = `Failed to start ffmpeg: ${err.message}`;

        appendJobLog({
            id: errorJob.id,
            type: 'convert',
            sourcePath: inputPath,
            preset, target,
            status: 'failed',
            errorMessage: errorJob.errorMessage
        });
    });
}
