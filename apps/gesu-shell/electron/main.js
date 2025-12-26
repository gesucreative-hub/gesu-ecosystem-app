import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron';
import { runGlobalToolsCheck, resolveToolPath } from './tools-check.js';
import path from 'path';
import { randomUUID, createHash } from 'crypto';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { appendJobLog, getRecentJobs } from './job-logger.js';
import { registerSettingsHandlers, loadGlobalSettings } from './settings-store.js';
import { buildPlan, applyPlan, appendProjectLog, initializeGitRepo } from './scaffolding.js';
import { listProjects } from './projects-registry.js';
import { appendSnapshot, listSnapshots } from './compass-snapshots.js';
import { getBlueprints, saveBlueprints } from './workflow-blueprints.js';
import { initDatabase, getDatabase, closeDatabase, saveDatabase, switchUserDatabase, getCurrentUserId } from './database.js';
import { ProjectWatcher } from './project-watcher.js';

// Use createRequire for CommonJS modules
const require = createRequire(import.meta.url);
const { initJobManager, enqueueJob, cancelJob, cancelAllJobs, getQueue, getRecentHistory } = require('./media-jobs.cjs');

// ProjectWatcher instance
let projectWatcher = null;


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

    return mainWindow;
}

app.whenReady().then(async () => {
    // Load settings first
    const settings = await loadGlobalSettings();
    const workflowRoot = settings.paths?.workflowRoot || 'D:\\03. Resources\\_Gesu\'s\\WorkFlowDatabase';

    // Initialize database with default user (async for sql.js)
    try {
        await initDatabase(null, workflowRoot); // null = default user initially
        console.log('[Main] Database initialized for default user');
    } catch (error) {
        console.error('[Main] Failed to initialize database:', error);
    }

    const mainWindow = createWindow();

    // Initialize ProjectWatcher with projects root from settings
    try {
        const settings = await loadGlobalSettings();
        const projectsRoot = settings.paths?.projectsRoot || 'D:\\01. Projects';
        projectWatcher = new ProjectWatcher(mainWindow, projectsRoot);
        projectWatcher.start();
        console.log('[Main] ProjectWatcher initialized');
    } catch (error) {
        console.error('[Main] Failed to initialize ProjectWatcher:', error);
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    // Stop ProjectWatcher
    if (projectWatcher) {
        projectWatcher.stop();
        projectWatcher = null;
    }

    // Close database before quitting
    closeDatabase();

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

// --- Media Jobs Manager ---
let mediaJobsInitialized = false;

async function ensureMediaJobsInit() {
    const settings = await loadGlobalSettings();
    const workflowRoot = settings.paths?.workflowRoot || null;

    // Get mainWindow to pass webContents
    const windows = BrowserWindow.getAllWindows();
    const mainWindow = windows[0];

    if (mainWindow) {
        // Always reinit if workflowRoot available - ensures fresh history load
        initJobManager(workflowRoot, mainWindow.webContents);
        mediaJobsInitialized = true;
    }
}

ipcMain.handle('media:job:enqueue', async (event, payload) => {
    await ensureMediaJobsInit();
    const jobId = enqueueJob(payload);
    return jobId;
});

ipcMain.handle('media:job:list', async () => {
    await ensureMediaJobsInit();
    return getQueue();
});

ipcMain.handle('media:job:cancel', async (event, jobId) => {
    await ensureMediaJobsInit();
    return cancelJob(jobId);
});

ipcMain.handle('media:job:cancelAll', async () => {
    await ensureMediaJobsInit();
    return cancelAllJobs();
});

ipcMain.handle('media:job:history', async (event, { limit = 50, offset = 0 }) => {
    await ensureMediaJobsInit();
    return getRecentHistory(limit, offset);
});

// --- Job System (Legacy In-Memory Skeleton) ---
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
    return filePaths[0];
});

// Multi-file selection for batch convert
ipcMain.handle('mediaSuite:pickMultipleFiles', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openFile', 'multiSelections'],
        filters: [
            { name: 'Media Files', extensions: ['mp4', 'mkv', 'mp3', 'wav', 'flac', 'avi', 'mov', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'tiff'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });
    if (canceled || filePaths.length === 0) return [];
    return filePaths;
});

ipcMain.handle('mediaSuite:pickOutputFolder', async (event, defaultPath) => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        defaultPath: defaultPath || undefined,
        properties: ['openDirectory', 'createDirectory']
    });
    if (canceled || filePaths.length === 0) return null;
    return filePaths[0];
});

ipcMain.handle('shell:openPath', async (event, targetPath) => {
    try {
        await shell.openPath(targetPath);
        return { ok: true };
    } catch (err) {
        return { ok: false, error: err.message };
    }
});

// ===== File System Handlers =====
ipcMain.handle('fs:ensureDir', async (event, dirPath) => {
    try {
        await fs.promises.mkdir(dirPath, { recursive: true });
        return { ok: true };
    } catch (err) {
        console.error('[fs:ensureDir]', err);
        return { ok: false, error: err.message };
    }
});

ipcMain.handle('fs:pathExists', async (event, targetPath) => {
    try {
        await fs.promises.access(targetPath);
        return true;
    } catch (err) {
        return false;
    }
});

ipcMain.handle('fs:readDir', async (event, dirPath) => {
    try {
        const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
        return entries.map(entry => ({
            name: entry.name,
            isDirectory: entry.isDirectory()
        }));
    } catch (err) {
        console.error('[fs:readDir]', err);
        throw err;
    }
});

ipcMain.handle('fs:readFile', async (event, filePath) => {
    try {
        const data = await fs.promises.readFile(filePath, 'utf-8');
        return data;
    } catch (err) {
        console.error('[fs:readFile]', err);
        throw err;
    }
});

ipcMain.handle('fs:writeFile', async (event, filePath, data) => {
    try {
        await fs.promises.writeFile(filePath, data, 'utf-8');
        return { ok: true };
    } catch (err) {
        console.error('[fs:writeFile]', err);
        return { ok: false, error: err.message };
    }
});

// ===== Database Handlers =====
ipcMain.handle('database:switchUser', async (event, userId) => {
    try {
        const settings = await loadGlobalSettings();
        const workflowRoot = settings.paths?.workflowRoot || 'D:\\03. Resources\\_Gesu\'s\\WorkFlowDatabase';
        await switchUserDatabase(userId, workflowRoot);
        console.log('[database:switchUser] Switched to user:', userId || 'default');
        return { ok: true };
    } catch (err) {
        console.error('[database:switchUser]', err);
        return { ok: false, error: err.message };
    }
});

ipcMain.handle('database:getCurrentUser', async () => {
    return getCurrentUserId();
});

// Update yt-dlp
ipcMain.handle('mediaSuite:updateYtDlp', async () => {
    const { spawn } = require('child_process');
    return new Promise((resolve) => {
        const child = spawn('yt-dlp', ['-U'], { shell: true });
        let output = '';
        let error = '';

        child.stdout.on('data', (data) => { output += data.toString(); });
        child.stderr.on('data', (data) => { error += data.toString(); });

        child.on('close', (code) => {
            if (code === 0) {
                resolve({ success: true, message: output.trim() || 'yt-dlp updated successfully' });
            } else {
                resolve({ success: false, error: error.trim() || output.trim() || `Update failed with code ${code}` });
            }
        });

        child.on('error', (err) => {
            resolve({ success: false, error: `Failed to run update: ${err.message}` });
        });
    });
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

// --- Scaffolding Handlers ---

ipcMain.handle('scaffold:preview', async (event, { projectName, templateId, folderTemplateFolders }) => {
    try {
        const settings = await loadGlobalSettings();
        const projectsRoot = settings.paths?.projectsRoot;

        if (!projectsRoot || projectsRoot.trim() === '') {
            throw new Error('Projects root not configured. Please set it in Settings.');
        }

        const { projectPath, plan } = buildPlan({ projectsRoot, projectName, templateId, folderTemplateFolders });

        return {
            ok: true,
            projectPath,
            plan
        };
    } catch (err) {
        return {
            ok: false,
            error: err.message
        };
    }
});

ipcMain.handle('scaffold:create', async (event, { projectName, templateId, categoryId, blueprintId, blueprintVersion, folderTemplateFolders, projectType, clientName, briefContent, displayName, options }) => {
    try {
        const settings = await loadGlobalSettings();
        const projectsRoot = settings.paths?.projectsRoot;

        if (!projectsRoot || projectsRoot.trim() === '') {
            throw new Error('Projects root not configured. Please set it in Settings.');
        }

        const { projectPath, plan } = buildPlan({ 
            projectsRoot, 
            projectName, 
            templateId, 
            categoryId, 
            blueprintId, 
            blueprintVersion, 
            folderTemplateFolders,
            projectType,
            clientName,
            briefContent,
            displayName
        });
        const result = await applyPlan({ projectsRoot, plan, projectPath });

        if (result.ok) {
            // Extract project ID from the created project.meta.json
            const metaItem = plan.find(item => item.relativePath === 'project.meta.json');
            let projectId = 'unknown';

            if (metaItem && metaItem.content) {
                try {
                    const meta = JSON.parse(metaItem.content);
                    projectId = meta.id;
                } catch (err) {
                    console.error('[scaffold:create] Failed to parse project meta:', err);
                }
            }

            // Sprint 6.6: Initialize git repo if requested
            if (options && options.gitInit) {
                try {
                    await initializeGitRepo(result.projectPath);
                } catch (err) {
                    console.error('[scaffold:create] Git init failed (non-fatal):', err);
                    // Add warning to result but don't fail the whole creation
                    result.warnings = [...(result.warnings || []), `Git init failed: ${err.message}`];
                }
            }

            // Append to ProjectLog
            await appendProjectLog({
                projectsRoot,
                projectId,
                projectName,
                projectPath,
                templateId
            });

            // Return metadata for renderer to register
            return {
                ...result,
                projectId,
                projectName
            };
        }

        return result;
    } catch (err) {
        return {
            ok: false,
            error: err.message
        };
    }
});

// Sprint 6.6: Standalone Git Init for existing projects
ipcMain.handle('scaffold:gitInit', async (event, projectPath) => {
    try {
        return await initializeGitRepo(projectPath);
    } catch (err) {
        return { success: false, error: err.message };
    }
});



ipcMain.handle('projects:list', async () => {
    try {
        const settings = await loadGlobalSettings();
        const projectsRoot = settings.paths?.projectsRoot;

        console.log('[projects:list] projectsRoot from settings:', projectsRoot);

        if (!projectsRoot || projectsRoot.trim() === '') {
            console.log('[projects:list] No projectsRoot configured, returning empty');
            return [];
        }

        const projects = await listProjects(projectsRoot);
        console.log('[projects:list] Found', projects.length, 'projects');
        return projects;
    } catch (err) {
        console.error('[projects:list] Error:', err);
        return [];
    }
});


// --- Compass Snapshots Handlers ---

// Helper to get current user's workspace path
async function getCurrentUserWorkspace() {
    const settings = await loadGlobalSettings();
    const workflowRoot = settings.paths?.workflowRoot;

    if (!workflowRoot || workflowRoot.trim() === '') {
        console.log('[getCurrentUserWorkspace] No workflowRoot configured');
        return null;
    }

    // Get current user from database module
    const userId = getCurrentUserId();
    const userDir = userId || 'default';

    console.log('[getCurrentUserWorkspace] Current user ID:', userId, '-> userDir:', userDir);

    // User-specific workspace: workflowRoot/users/{userId}/
    const userWorkspace = path.join(workflowRoot, 'users', userDir);

    // Ensure directory exists
    if (!fs.existsSync(userWorkspace)) {
        fs.mkdirSync(userWorkspace, { recursive: true });
        console.log('[getCurrentUserWorkspace] Created user workspace:', userWorkspace);
    }

    return userWorkspace;
}

ipcMain.handle('compass:snapshots:append', async (event, snapshot) => {
    try {
        const userWorkspace = await getCurrentUserWorkspace();

        if (!userWorkspace) {
            return { ok: false, error: 'Workflow root not configured. Please set it in Settings.' };
        }

        console.log('[compass:snapshots:append] Using user workspace:', userWorkspace);
        const result = await appendSnapshot(userWorkspace, snapshot);
        return result;
    } catch (err) {
        return { ok: false, error: err.message };
    }
});

ipcMain.handle('compass:snapshots:list', async (event, options) => {
    try {
        const userWorkspace = await getCurrentUserWorkspace();

        if (!userWorkspace) {
            return [];
        }

        console.log('[compass:snapshots:list] Using user workspace:', userWorkspace);
        const snapshots = await listSnapshots(userWorkspace, options || {});
        return snapshots;
    } catch (err) {
        console.error('[compass:snapshots:list] Error:', err);
        return [];
    }
});


// --- User Settings Handlers ---

ipcMain.handle('user-settings:read', async () => {
    try {
        const userWorkspace = await getCurrentUserWorkspace();

        if (!userWorkspace) {
            console.log('[user-settings:read] No workspace, returning defaults');
            return null;
        }

        const settingsPath = path.join(userWorkspace, 'settings.json');

        // Check if file exists
        if (!fs.existsSync(settingsPath)) {
            console.log('[user-settings:read] No settings file found, will use defaults');
            return null;
        }

        const data = await fs.promises.readFile(settingsPath, 'utf-8');
        const settings = JSON.parse(data);
        console.log('[user-settings:read] Loaded user settings from:', settingsPath);
        return settings;
    } catch (err) {
        console.error('[user-settings:read] Error:', err);
        return null;
    }
});

ipcMain.handle('user-settings:write', async (event, settings) => {
    try {
        const userWorkspace = await getCurrentUserWorkspace();

        if (!userWorkspace) {
            throw new Error('No user workspace available');
        }

        const settingsPath = path.join(userWorkspace, 'settings.json');
        await fs.promises.writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
        console.log('[user-settings:write] Saved user settings to:', settingsPath);
    } catch (err) {
        console.error('[user-settings:write] Error:', err);
        throw err;
    }
});


// --- Workflow Blueprints Handlers ---

ipcMain.handle('workflow:blueprints:get', async () => {
    try {
        const settings = await loadGlobalSettings();
        const workflowRoot = settings.paths?.workflowRoot;

        // Return null if not configured - renderer will use defaults/localStorage
        if (!workflowRoot || workflowRoot.trim() === '') {
            return null;
        }

        const blueprints = await getBlueprints(workflowRoot);
        return blueprints;
    } catch (err) {
        console.error('[workflow:blueprints:get] Error:', err);
        return null;
    }
});

ipcMain.handle('workflow:blueprints:save', async (event, data) => {
    try {
        const settings = await loadGlobalSettings();
        const workflowRoot = settings.paths?.workflowRoot;

        if (!workflowRoot || workflowRoot.trim() === '') {
            return { ok: false, error: 'Workflow root not configured. Please set it in Settings.' };
        }

        const result = await saveBlueprints(workflowRoot, data);
        return result;
    } catch (err) {
        return { ok: false, error: err.message };
    }
});


// --- Schema Backups Handlers (S0-1: Safe Migrations) ---

const SCHEMA_BACKUPS_DIR = 'schema-backups';
const MAX_BACKUPS_PER_STORE = 10;

/**
 * Get the schema backups directory path under userData
 */
function getSchemaBackupsDir() {
    return path.join(app.getPath('userData'), SCHEMA_BACKUPS_DIR);
}

ipcMain.handle('schemaBackups:getPath', async () => {
    return getSchemaBackupsDir();
});

ipcMain.handle('schemaBackups:create', async (event, { storeKey, rawData, meta }) => {
    try {
        const backupsDir = getSchemaBackupsDir();
        
        // Ensure directory exists
        if (!fs.existsSync(backupsDir)) {
            fs.mkdirSync(backupsDir, { recursive: true });
        }
        
        const timestamp = Date.now();
        const filename = `${storeKey}-${timestamp}.json`;
        const backupPath = path.join(backupsDir, filename);
        
        // Create backup payload
        const backupPayload = {
            storeKey,
            timestamp,
            meta: meta || {},
            rawData
        };
        
        await fs.promises.writeFile(backupPath, JSON.stringify(backupPayload, null, 2), 'utf-8');
        console.log(`[schemaBackups:create] Created backup: ${filename}`);
        
        // Enforce retention: keep only last MAX_BACKUPS_PER_STORE per store
        await enforceBackupRetention(storeKey);
        
        return { ok: true, backupPath, filename };
    } catch (err) {
        console.error('[schemaBackups:create] Error:', err);
        return { ok: false, error: err.message };
    }
});

ipcMain.handle('schemaBackups:list', async (event, { storeKey }) => {
    try {
        const backupsDir = getSchemaBackupsDir();
        
        if (!fs.existsSync(backupsDir)) {
            return [];
        }
        
        const files = await fs.promises.readdir(backupsDir);
        const storeBackups = files
            .filter(f => f.startsWith(`${storeKey}-`) && f.endsWith('.json'))
            .map(f => {
                const match = f.match(/-(\d+)\.json$/);
                return {
                    filename: f,
                    timestamp: match ? parseInt(match[1], 10) : 0,
                    path: path.join(backupsDir, f)
                };
            })
            .sort((a, b) => b.timestamp - a.timestamp); // Newest first
        
        return storeBackups;
    } catch (err) {
        console.error('[schemaBackups:list] Error:', err);
        return [];
    }
});

ipcMain.handle('schemaBackups:read', async (event, { filename }) => {
    try {
        const backupsDir = getSchemaBackupsDir();
        const backupPath = path.join(backupsDir, filename);
        
        if (!fs.existsSync(backupPath)) {
            return { ok: false, error: 'Backup not found' };
        }
        
        const data = await fs.promises.readFile(backupPath, 'utf-8');
        const parsed = JSON.parse(data);
        return { ok: true, backup: parsed };
    } catch (err) {
        console.error('[schemaBackups:read] Error:', err);
        return { ok: false, error: err.message };
    }
});

/**
 * Enforce retention policy: keep only last MAX_BACKUPS_PER_STORE backups per store
 */
async function enforceBackupRetention(storeKey) {
    try {
        const backupsDir = getSchemaBackupsDir();
        
        if (!fs.existsSync(backupsDir)) return;
        
        const files = await fs.promises.readdir(backupsDir);
        const storeBackups = files
            .filter(f => f.startsWith(`${storeKey}-`) && f.endsWith('.json'))
            .map(f => {
                const match = f.match(/-(\d+)\.json$/);
                return {
                    filename: f,
                    timestamp: match ? parseInt(match[1], 10) : 0
                };
            })
            .sort((a, b) => b.timestamp - a.timestamp); // Newest first
        
        // Delete oldest backups beyond limit
        if (storeBackups.length > MAX_BACKUPS_PER_STORE) {
            const toDelete = storeBackups.slice(MAX_BACKUPS_PER_STORE);
            for (const backup of toDelete) {
                const backupPath = path.join(backupsDir, backup.filename);
                await fs.promises.unlink(backupPath);
                console.log(`[schemaBackups] Deleted old backup: ${backup.filename}`);
            }
        }
    } catch (err) {
        console.error('[schemaBackups] Retention cleanup error:', err);
    }
}


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

// =============================================
// Activity Tracking IPC Handlers (sql.js API)
// =============================================

// Start an activity session
ipcMain.handle('activity:start-session', async (event, { type, taskId, projectId }) => {
    try {
        const db = getDatabase();
        const id = randomUUID();
        const now = new Date().toISOString();
        const userId = 'local-user';

        db.run(`
            INSERT INTO activity_sessions (id, user_id, start_time, type, task_id, project_id)
            VALUES ($id, $userId, $now, $type, $taskId, $projectId)
        `, {
            $id: id,
            $userId: userId,
            $now: now,
            $type: type,
            $taskId: taskId || null,
            $projectId: projectId || null
        });

        saveDatabase();
        return { ok: true, sessionId: id };
    } catch (error) {
        console.error('[Activity] Failed to start session:', error);
        return { ok: false, error: error.message };
    }
});

// End an activity session
ipcMain.handle('activity:end-session', async (event, { sessionId }) => {
    try {
        const db = getDatabase();
        const now = new Date().toISOString();

        db.run(`
            UPDATE activity_sessions 
            SET end_time = $now
            WHERE id = $sessionId
        `, {
            $now: now,
            $sessionId: sessionId
        });

        saveDatabase();
        return { ok: true };
    } catch (error) {
        console.error('[Activity] Failed to end session:', error);
        return { ok: false, error: error.message };
    }
});

// Get activity summary
ipcMain.handle('activity:get-summary', async (event, { startDate, endDate }) => {
    try {
        const db = getDatabase();
        const userId = 'local-user';

        const stmt = db.prepare(`
            SELECT * FROM activity_sessions
            WHERE user_id = $userId
            AND start_time >= $startDate
            AND start_time <= $endDate
            ORDER BY start_time DESC
        `);
        stmt.bind({
            $userId: userId,
            $startDate: startDate,
            $endDate: endDate
        });

        const sessions = [];
        while (stmt.step()) {
            sessions.push(stmt.getAsObject());
        }
        stmt.free();

        return { ok: true, sessions };
    } catch (error) {
        console.error('[Activity] Failed to get summary:', error);
        return { ok: false, error: error.message };
    }
});

// Record task completion
ipcMain.handle('activity:record-task-completion', async (event, { taskId, duration }) => {
    try {
        const db = getDatabase();
        const id = randomUUID();
        const now = new Date().toISOString();
        const userId = 'local-user';

        db.run(`
            INSERT INTO task_completions (id, user_id, task_id, completed_at, duration)
            VALUES ($id, $userId, $taskId, $now, $duration)
        `, {
            $id: id,
            $userId: userId,
            $taskId: taskId,
            $now: now,
            $duration: duration || null
        });

        saveDatabase();
        return { ok: true, completionId: id };
    } catch (error) {
        console.error('[Activity] Failed to record task completion:', error);
        return { ok: false, error: error.message };
    }
});

// Clear activity sessions (for data cleanup)
// Accepts optional afterDate to delete sessions after a specific date
ipcMain.handle('activity:clear-all-sessions', async (event, { afterDate } = {}) => {
    try {
        const db = getDatabase();
        const userId = 'local-user';

        if (afterDate) {
            // Delete sessions after the specified date (for today/week/month options)
            db.run(`
                DELETE FROM activity_sessions
                WHERE user_id = $userId AND start_time >= $afterDate
            `, {
                $userId: userId,
                $afterDate: afterDate
            });
            console.log('[Activity] Cleared sessions after:', afterDate);
        } else {
            // Delete all sessions
            db.run(`
                DELETE FROM activity_sessions
                WHERE user_id = $userId
            `, {
                $userId: userId
            });
            console.log('[Activity] Cleared all sessions for user:', userId);
        }

        saveDatabase();
        return { ok: true };
    } catch (error) {
        console.error('[Activity] Failed to clear sessions:', error);
        return { ok: false, error: error.message };
    }
});

