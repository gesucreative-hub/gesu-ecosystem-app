// Compass Snapshot Store - Persists daily calibration snapshots
// Uses localStorage with schemaVersion for safe migrations

import { getUserStorageKey } from '../utils/getUserStorageKey';

export interface FocusAreaData {
    [key: string]: number;
}

export interface SessionData {
    id: string;
    label: string;
    completed: boolean;
}

export interface CompassSnapshot {
    id: string;
    dateKey: string; // YYYY-MM-DD
    energy: number;
    focusAreas: FocusAreaData;
    sessions: SessionData[];
    createdAt: number;
}

interface CompassSnapshotState {
    schemaVersion: number;
    snapshots: CompassSnapshot[];
}

const BASE_STORAGE_KEY = 'gesu-compass-snapshots';
const CURRENT_SCHEMA_VERSION = 1;
const MAX_SNAPSHOTS = 30; // Keep last 30 days

// Get user-scoped storage key
const getStorageKey = () => getUserStorageKey(BASE_STORAGE_KEY);

// --- Utility ---

export function getTodayKey(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function generateId(): string {
    return `snap-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// --- Storage ---

import {
    readRaw,
    parse,
    detectVersion,
    createBackupSnapshot,
    registerSchemaWarning
} from '../services/persistence/safeMigration';

function loadState(): CompassSnapshotState {
    const defaultState = { schemaVersion: CURRENT_SCHEMA_VERSION, snapshots: [] };
    
    try {
        const raw = readRaw(getStorageKey());
        if (!raw) return defaultState;

        const parseResult = parse<CompassSnapshotState>(raw);
        
        if (!parseResult.success) {
            void createBackupSnapshot(getStorageKey(), raw, { reason: 'corrupt' })
                .then(filename => registerSchemaWarning(getStorageKey(), 'CORRUPT', filename || undefined))
                .catch(err => console.error('[compassSnapshotStore] Backup failed:', err));
            console.warn('[compassSnapshotStore] Parse failed, data preserved. NOT resetting.');
            return defaultState;
        }

        const parsed = parseResult.data!;
        const version = detectVersion(parsed);

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
                .catch(err => console.error('[compassSnapshotStore] Backup failed:', err));
            console.warn(`[compassSnapshotStore] Schema v${version} not current. Data preserved, NOT resetting.`);
            return defaultState;
        }

        return parsed;
    } catch (err) {
        console.error('[compassSnapshotStore] Unexpected error:', err);
        return defaultState;
    }
}

function saveState(state: CompassSnapshotState): void {
    localStorage.setItem(getStorageKey(), JSON.stringify(state));
}

// --- Public API ---

export function saveSnapshot(data: {
    energy: number;
    focusAreas: FocusAreaData;
    sessions: SessionData[];
}): CompassSnapshot {
    const state = loadState();
    const dateKey = getTodayKey();

    // Check if snapshot for today already exists
    const existingIndex = state.snapshots.findIndex(s => s.dateKey === dateKey);

    const snapshot: CompassSnapshot = {
        id: existingIndex >= 0 ? state.snapshots[existingIndex].id : generateId(),
        dateKey,
        energy: data.energy,
        focusAreas: { ...data.focusAreas },
        sessions: data.sessions.map(s => ({ ...s })),
        createdAt: Date.now(),
    };

    if (existingIndex >= 0) {
        // Update existing
        state.snapshots[existingIndex] = snapshot;
    } else {
        // Add new
        state.snapshots.push(snapshot);
    }

    // Trim old snapshots
    if (state.snapshots.length > MAX_SNAPSHOTS) {
        state.snapshots = state.snapshots
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, MAX_SNAPSHOTS);
    }

    saveState(state);
    return snapshot;
}

export function getTodaySnapshot(): CompassSnapshot | null {
    const state = loadState();
    const dateKey = getTodayKey();
    return state.snapshots.find(s => s.dateKey === dateKey) || null;
}

export function getSnapshotByDate(dateKey: string): CompassSnapshot | null {
    const state = loadState();
    return state.snapshots.find(s => s.dateKey === dateKey) || null;
}

export function getAllSnapshots(): CompassSnapshot[] {
    return loadState().snapshots.sort((a, b) => b.createdAt - a.createdAt);
}

export function deleteSnapshot(id: string): void {
    const state = loadState();
    state.snapshots = state.snapshots.filter(s => s.id !== id);
    saveState(state);
}

export function clearAllSnapshots(): void {
    saveState({ schemaVersion: CURRENT_SCHEMA_VERSION, snapshots: [] });
}
