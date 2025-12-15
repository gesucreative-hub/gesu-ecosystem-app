// Compass Snapshot Store - Persists daily calibration snapshots
// Uses localStorage with schemaVersion for safe migrations

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

const STORAGE_KEY = 'gesu-compass-snapshots';
const CURRENT_SCHEMA_VERSION = 1;
const MAX_SNAPSHOTS = 30; // Keep last 30 days

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

function loadState(): CompassSnapshotState {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { schemaVersion: CURRENT_SCHEMA_VERSION, snapshots: [] };

        const parsed: CompassSnapshotState = JSON.parse(raw);

        if (parsed.schemaVersion !== CURRENT_SCHEMA_VERSION) {
            console.warn('Compass snapshot schema mismatch. Resetting.');
            return { schemaVersion: CURRENT_SCHEMA_VERSION, snapshots: [] };
        }

        return parsed;
    } catch {
        return { schemaVersion: CURRENT_SCHEMA_VERSION, snapshots: [] };
    }
}

function saveState(state: CompassSnapshotState): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
