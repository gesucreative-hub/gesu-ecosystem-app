// Global Settings Model and Storage Adapter
// Provides typed settings interface and localStorage persistence
// Uses the existing GesuSettings interface from types/settings.ts

import { GesuSettings } from '../types/settings';

// Default settings matching the existing interface structure
export const DEFAULT_SETTINGS: GesuSettings = {
    paths: {
        workflowRoot: '',
        projectsRoot: '',
        backupRoot: '',
    },
    engines: {
        ytDlpPath: null,
        ffmpegPath: null,
        imageMagickPath: null,
        libreOfficePath: null,
    },
    appearance: {
        theme: 'dark',
        accentColor: 'cyan',
        glassmorphism: true,
    },
    installPreference: 'manual',
};

const STORAGE_KEY = 'gesu-global-settings';
const CURRENT_SCHEMA_VERSION = 1;

// Internal storage type with schema version
interface StoredSettings extends GesuSettings {
    schemaVersion: number;
}

// --- Storage Adapter ---

export function loadSettings(): GesuSettings {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { ...DEFAULT_SETTINGS };

        const parsed: StoredSettings = JSON.parse(raw);

        // Schema migration: reset if incompatible version
        if (parsed.schemaVersion !== CURRENT_SCHEMA_VERSION) {
            console.warn(`Settings schema mismatch (found v${parsed.schemaVersion}, expected v${CURRENT_SCHEMA_VERSION}). Resetting to defaults.`);
            return { ...DEFAULT_SETTINGS };
        }

        return parsed;
    } catch (error) {
        console.error('Failed to load settings:', error);
        return { ...DEFAULT_SETTINGS };
    }
}

export function saveSettings(settings: GesuSettings): boolean {
    try {
        const payload: StoredSettings = {
            ...settings,
            schemaVersion: CURRENT_SCHEMA_VERSION,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        return true;
    } catch (error) {
        console.error('Failed to save settings:', error);
        return false;
    }
}

export function resetSettings(): GesuSettings {
    const defaults = { ...DEFAULT_SETTINGS };
    saveSettings(defaults);
    return defaults;
}

// --- Engine Status Helpers ---

export type EngineStatus = 'configured' | 'missing' | 'unknown';

export interface EngineInfo {
    name: string;
    status: EngineStatus;
    path: string | null;
}

export function getEngineStatus(path: string | null | undefined): EngineStatus {
    if (!path || path.trim() === '') return 'missing';
    return 'configured';
}

export function getAllEngineStatuses(settings: GesuSettings): EngineInfo[] {
    return [
        { name: 'yt-dlp', status: getEngineStatus(settings.engines.ytDlpPath), path: settings.engines.ytDlpPath },
        { name: 'ffmpeg', status: getEngineStatus(settings.engines.ffmpegPath), path: settings.engines.ffmpegPath },
        { name: 'imagemagick', status: getEngineStatus(settings.engines.imageMagickPath), path: settings.engines.imageMagickPath },
        { name: 'libreoffice', status: getEngineStatus(settings.engines.libreOfficePath), path: settings.engines.libreOfficePath },
    ];
}

// Re-export the GesuSettings type for convenience
export type { GesuSettings };
