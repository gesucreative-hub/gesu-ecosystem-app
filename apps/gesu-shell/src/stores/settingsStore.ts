// Global Settings Model and Storage Adapter
// Provides typed settings interface and localStorage persistence
// Uses the existing GesuSettings interface from types/settings.ts

import { GesuSettings } from '../types/settings';
import { getUserStorageKey } from '../utils/getUserStorageKey';

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
    ai: {
        enabled: false,
        provider: 'none',
        endpoint: 'http://localhost:11434',
        model: 'llama3.2',
    },
    installPreference: 'manual',
};

const BASE_STORAGE_KEY = 'gesu-global-settings';
const CURRENT_SCHEMA_VERSION = 1;

// Get user-scoped storage key
const getStorageKey = () => getUserStorageKey(BASE_STORAGE_KEY);

// Internal storage type with schema version
interface StoredSettings extends GesuSettings {
    schemaVersion: number;
}

// --- Storage Adapter ---

import {
    readRaw,
    parse,
    detectVersion,
    createBackupSnapshot,
    registerSchemaWarning
} from '../services/persistence/safeMigration';

export function loadSettings(): GesuSettings {
    try {
        const raw = readRaw(getStorageKey());
        if (!raw) return { ...DEFAULT_SETTINGS };

        const parseResult = parse<StoredSettings>(raw);

        if (!parseResult.success) {
            // CORRUPT: backup + warning, DO NOT reset localStorage
            void createBackupSnapshot(getStorageKey(), raw, { reason: 'corrupt' })
                .then(filename => registerSchemaWarning(getStorageKey(), 'CORRUPT', filename || undefined))
                .catch(err => console.error('[settingsStore] Backup failed:', err));
            console.warn('[settingsStore] Parse failed, data preserved. Using defaults.');
            return { ...DEFAULT_SETTINGS };
        }

        const parsed = parseResult.data!;
        const version = detectVersion(parsed);

        // Schema migration: preserve on version mismatch
        if (version !== CURRENT_SCHEMA_VERSION) {
            void createBackupSnapshot(getStorageKey(), raw, { 
                reason: version && version > CURRENT_SCHEMA_VERSION ? 'future-version' : 'unknown-version',
                fromVersion: version || undefined 
            })
                .then(filename => {
                    registerSchemaWarning(
                        getStorageKey(), 
                        version && version > CURRENT_SCHEMA_VERSION ? 'FUTURE_VERSION' : 'CORRUPT',
                        filename || undefined
                    );
                })
                .catch(err => console.error('[settingsStore] Backup failed:', err));
            console.warn(`[settingsStore] Schema v${version} mismatch. Data preserved, using defaults.`);
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
        localStorage.setItem(getStorageKey(), JSON.stringify(payload));
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
