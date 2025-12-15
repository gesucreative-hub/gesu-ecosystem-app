// Engine Status Store - Unified source of truth for engine status
// Derives status from Settings, provides refresh capability

import { loadSettings } from './settingsStore';
import { GesuSettings } from '../types/settings';

export type EngineStatusValue = 'ready_configured' | 'missing' | 'unknown' | 'checking';

export interface EngineStatusInfo {
    id: string;
    name: string;
    status: EngineStatusValue;
    path: string | null;
}

export interface EngineStatusState {
    engines: EngineStatusInfo[];
    lastCheckedAt: number | null;
    isRefreshing: boolean;
}

const STORAGE_KEY = 'gesu-engine-status-cache';
const CURRENT_SCHEMA_VERSION = 1;

interface StoredState {
    schemaVersion: number;
    lastCheckedAt: number | null;
}

// --- State Management ---

let currentState: EngineStatusState = {
    engines: [],
    lastCheckedAt: null,
    isRefreshing: false,
};

const listeners: Set<() => void> = new Set();

function notifyListeners(): void {
    listeners.forEach(fn => fn());
}

export function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export function getEngineStatusState(): EngineStatusState {
    return { ...currentState };
}

// --- Derive Status from Settings ---

function deriveStatusFromPath(path: string | null | undefined): EngineStatusValue {
    if (path === null || path === undefined || path.trim() === '') {
        return 'missing';
    }
    return 'ready_configured';
}

function deriveEnginesFromSettings(settings: GesuSettings): EngineStatusInfo[] {
    return [
        {
            id: 'ytDlp',
            name: 'yt-dlp',
            status: deriveStatusFromPath(settings.engines.ytDlpPath),
            path: settings.engines.ytDlpPath,
        },
        {
            id: 'ffmpeg',
            name: 'ffmpeg',
            status: deriveStatusFromPath(settings.engines.ffmpegPath),
            path: settings.engines.ffmpegPath,
        },
        {
            id: 'imageMagick',
            name: 'ImageMagick',
            status: deriveStatusFromPath(settings.engines.imageMagickPath),
            path: settings.engines.imageMagickPath,
        },
        {
            id: 'libreOffice',
            name: 'LibreOffice',
            status: deriveStatusFromPath(settings.engines.libreOfficePath),
            path: settings.engines.libreOfficePath,
        },
    ];
}

// --- Persistence (cache) ---

function loadCache(): StoredState | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (parsed.schemaVersion !== CURRENT_SCHEMA_VERSION) return null;
        return parsed;
    } catch {
        return null;
    }
}

function saveCache(lastCheckedAt: number): void {
    const payload: StoredState = { schemaVersion: CURRENT_SCHEMA_VERSION, lastCheckedAt };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

// --- Public API ---

export function refreshEngineStatus(): void {
    currentState = { ...currentState, isRefreshing: true };
    notifyListeners();

    // Small delay to show refreshing state
    setTimeout(() => {
        const settings = loadSettings();
        const engines = deriveEnginesFromSettings(settings);
        const now = Date.now();

        currentState = {
            engines,
            lastCheckedAt: now,
            isRefreshing: false,
        };

        saveCache(now);
        notifyListeners();
    }, 100);
}

export function initEngineStatus(): void {
    const cache = loadCache();
    const settings = loadSettings();
    const engines = deriveEnginesFromSettings(settings);

    currentState = {
        engines,
        lastCheckedAt: cache?.lastCheckedAt ?? null,
        isRefreshing: false,
    };

    notifyListeners();
}

export function getEngineById(id: string): EngineStatusInfo | undefined {
    return currentState.engines.find(e => e.id === id);
}

export function getLastCheckedLabel(): string {
    if (!currentState.lastCheckedAt) return 'Never';
    const diff = Date.now() - currentState.lastCheckedAt;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins === 1) return '1 min ago';
    if (mins < 60) return `${mins} mins ago`;
    const hours = Math.floor(mins / 60);
    if (hours === 1) return '1 hour ago';
    return `${hours} hours ago`;
}

// Initialize on module load
initEngineStatus();
