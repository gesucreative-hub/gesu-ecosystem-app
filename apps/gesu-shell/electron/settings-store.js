
import fs from 'node:fs';
import path from 'node:path';
import { ipcMain } from 'electron';

// --- Configuration ---

export function resolveGlobalSettingsPath() {
    // 1. Env Override (Safe escape hatch)
    if (process.env.GESU_GLOBAL_SETTINGS_PATH) {
        return process.env.GESU_GLOBAL_SETTINGS_PATH;
    }

    // 2. Default Legacy Path (as per Wave 1 Requirement)
    // Structure: D:\03. Resources\_Gesu's\WorkFlowDatabase\_Apps\GesuSettings\config\Gesu.GlobalSettings.json
    // We construct this relatively safely assuming standard Windows paths.

    // NOTE: In a real production build, we might want to discover the WorkFlowDatabase root first,
    // but for now we hardcode the target location to ensure compatibility with the existing PS stack.
    const defaultPath = String.raw`D:\03. Resources\_Gesu's\WorkFlowDatabase\_Apps\GesuSettings\config\Gesu.GlobalSettings.json`;

    return defaultPath;
}

const SETTINGS_FILE_PATH = resolveGlobalSettingsPath();

// --- Core Logic ---

// --- Defaults ---

const DEFAULT_SETTINGS = {
    paths: {
        workflowRoot: String.raw`D:\03. Resources\_Gesu's\WorkFlowDatabase`,
        projectsRoot: String.raw`D:\01. Projects`,
        backupRoot: String.raw`D:\03. Resources\_Gesu's\Backup`
    },
    engines: {
        ytDlpPath: null,
        ffmpegPath: null, // Will use internal/system if null
        imageMagickPath: null,
        libreOfficePath: null
    },
    appearance: {
        theme: 'dark',
        accentColor: 'cyan',
        glassmorphism: true
    },
    installPreference: 'manual'
};

// --- Core Logic ---

function mergeSettings(loaded) {
    if (!loaded) return DEFAULT_SETTINGS;

    return {
        ...DEFAULT_SETTINGS,
        ...loaded,
        // Deep merge critical sections
        paths: { ...DEFAULT_SETTINGS.paths, ...(loaded.paths || {}) },
        engines: { ...DEFAULT_SETTINGS.engines, ...(loaded.engines || {}) },
        appearance: { ...DEFAULT_SETTINGS.appearance, ...(loaded.appearance || {}) }
    };
}

async function loadGlobalSettings() {
    try {
        if (!fs.existsSync(SETTINGS_FILE_PATH)) {
            console.log('[Settings] File not found, returning defaults:', SETTINGS_FILE_PATH);
            return DEFAULT_SETTINGS; // Return full defaults
        }

        const raw = await fs.promises.readFile(SETTINGS_FILE_PATH, 'utf-8');
        try {
            const parsed = JSON.parse(raw);
            return mergeSettings(parsed);
        } catch (parseErr) {
            console.error('[Settings] JSON Parse Error:', parseErr);
            return DEFAULT_SETTINGS;
        }
    } catch (err) {
        console.error('[Settings] Read Error:', err);
        return DEFAULT_SETTINGS;
    }
}

async function saveGlobalSettings(partial) {
    try {
        // 1. Load current state (to merge, ensuring we don't wipe unknown keys)
        const current = await loadGlobalSettings();

        // 2. Shallow merge
        // Note: For deep nesting (like 'paths' or 'engines'), the partial update from frontend 
        // usually sends the whole sub-object. Use caution if frontend sends partial sub-objects.
        // For Wave 1, we assume the frontend sends complete sub-sections or we merge carefully.

        // To be safer for legacy keys, we do a shallow merge at top level.
        // If 'partial' contains 'paths', it replaces 'current.paths'.
        // Ideally, we should do a deep merge or let the frontend handle the merging state 
        // and send the full desired object.
        // For this specific requirement, 'saveGlobalSettings' in request description says:
        // "Create next = { ...current, ...partial }"
        const next = { ...current, ...partial };

        // 3. Ensure dir exists
        const dir = path.dirname(SETTINGS_FILE_PATH);
        if (!fs.existsSync(dir)) {
            await fs.promises.mkdir(dir, { recursive: true });
        }

        // 4. Write
        await fs.promises.writeFile(SETTINGS_FILE_PATH, JSON.stringify(next, null, 2) + '\n', 'utf-8');
        console.log('[Settings] Saved to:', SETTINGS_FILE_PATH);

        return next;
    } catch (err) {
        console.error('[Settings] Save Error:', err);
        throw err; // Propagate to renderer so UI shows error
    }
}

// --- IPC Registration ---

export function registerSettingsHandlers() {
    console.log('[Settings] Registering handlers. Target:', SETTINGS_FILE_PATH);

    // Get current settings
    ipcMain.handle('gesu:settings:load', async () => {
        return await loadGlobalSettings();
    });

    // Save settings (partial update)
    ipcMain.handle('gesu:settings:save', async (event, partial) => {
        return await saveGlobalSettings(partial || {});
    });
}
