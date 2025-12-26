/**
 * Daily Check-in Store
 * Manages daily energy/why/focus check-ins with 90-day retention
 * S1-2a: Operationalize Daily Check-in v0
 */

export interface DailyCheckIn {
    id: string;                     // uuid
    date: string;                   // 'YYYY-MM-DD' local
    energy: number;                 // 1-5
    why: string;                    // text (can be empty)
    topFocusType: 'project' | 'task' | 'text';
    topFocusRefId?: string;         // project.id or task.id (reference only, not activation)
    topFocusText?: string;          // free text fallback
    createdAt: string;              // ISO timestamp
}

interface DailyCheckInStoreState {
    schemaVersion: number;
    checkIns: DailyCheckIn[];       // Append-only, keep last 90 days
}

const STORAGE_KEY = 'gesu-daily-checkin';
const CURRENT_SCHEMA_VERSION = 1;
const MAX_RETENTION_DAYS = 90;

// --- Utility ---

function generateId(): string {
    return `checkin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getTodayKey(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function cleanupOldCheckIns(checkIns: DailyCheckIn[]): DailyCheckIn[] {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - MAX_RETENTION_DAYS);
    const cutoffStr = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}-${String(cutoff.getDate()).padStart(2, '0')}`;
    return checkIns.filter(c => c.date >= cutoffStr);
}

// --- Storage ---

import {
    readRaw,
    parse,
    detectVersion,
    createBackupSnapshot,
    registerSchemaWarning
} from '../services/persistence/safeMigration';

function loadState(): DailyCheckInStoreState {
    const defaultState: DailyCheckInStoreState = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        checkIns: []
    };

    console.log('[dailyCheckInStore] loadState: starting');
    const raw = readRaw(STORAGE_KEY);
    if (!raw) {
        console.log('[dailyCheckInStore] loadState: no raw data');
        return defaultState;
    }
    console.log('[dailyCheckInStore] loadState: raw data found', raw.substring(0, 100));

    const parseResult = parse(raw);
    if (!parseResult) {
        console.log('[dailyCheckInStore] loadState: parse failed, registering CORRUPT');
        registerSchemaWarning(STORAGE_KEY, 'CORRUPT');
        createBackupSnapshot(STORAGE_KEY, raw);
        return defaultState;
    }
    console.log('[dailyCheckInStore] loadState: parsed successfully', parseResult);

    // CRITICAL FIX: parse() returns {success: true, data: {...}}, not the raw object
    const parsed = (parseResult as any).data || parseResult;
    console.log('[dailyCheckInStore] loadState: unwrapped data', parsed);

    const detectedVersion = detectVersion(parsed);
    console.log('[dailyCheckInStore] loadState: detectedVersion=', detectedVersion, 'CURRENT=', CURRENT_SCHEMA_VERSION);
    if (detectedVersion !== null && detectedVersion > CURRENT_SCHEMA_VERSION) {
        console.log('[dailyCheckInStore] loadState: FUTURE_VERSION detected');
        registerSchemaWarning(STORAGE_KEY, 'FUTURE_VERSION');
        createBackupSnapshot(STORAGE_KEY, raw);
        return defaultState;
    }

    // No migration needed for v1
    const hasSchema = 'schemaVersion' in parsed;
    const hasCheckIns = 'checkIns' in parsed;
    console.log('[dailyCheckInStore] loadState: schema check', { hasSchema, hasCheckIns, parsed });
    if (typeof parsed === 'object' && parsed !== null && hasSchema && hasCheckIns) {
        console.log('[dailyCheckInStore] loadState: returning parsed state with', parsed.checkIns?.length, 'check-ins');
        return parsed as DailyCheckInStoreState;
    }
    console.log('[dailyCheckInStore] loadState: schema check failed, returning defaultState');
    return defaultState;
}

function saveState(state: DailyCheckInStoreState): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// --- State Management ---

let state: DailyCheckInStoreState = loadState();
const subscribers = new Set<() => void>();

function notifySubscribers(): void {
    subscribers.forEach(callback => callback());
}

// --- Public API ---

export function getTodayCheckIn(): DailyCheckIn | null {
    const todayKey = getTodayKey();
    console.log('[dailyCheckInStore] getTodayCheckIn:', { 
        todayKey, 
        checkInsCount: state.checkIns.length,
        checkInDates: state.checkIns.map(c => c.date),
        state: state 
    });
    const result = state.checkIns.find(c => c.date === todayKey) || null;
    console.log('[dailyCheckInStore] Found check-in:', result !== null);
    return result;
}

export function getCheckInByDate(date: string): DailyCheckIn | null {
    return state.checkIns.find(c => c.date === date) || null;
}

export function getRecentCheckIns(days: number): DailyCheckIn[] {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}-${String(cutoff.getDate()).padStart(2, '0')}`;
    
    return state.checkIns
        .filter(c => c.date >= cutoffStr)
        .sort((a, b) => b.date.localeCompare(a.date));
}

export function saveCheckIn(data: Omit<DailyCheckIn, 'id' | 'createdAt'>): DailyCheckIn {
    const checkIn: DailyCheckIn = {
        id: generateId(),
        ...data,
        createdAt: new Date().toISOString()
    };

    // Remove existing check-in for this date if any
    state.checkIns = state.checkIns.filter(c => c.date !== data.date);
    
    // Add new check-in
    state.checkIns.push(checkIn);
    
    // Cleanup old entries
    state.checkIns = cleanupOldCheckIns(state.checkIns);
    
    saveState(state);
    notifySubscribers();
    
    return checkIn;
}

export function subscribe(callback: () => void): () => void {
    subscribers.add(callback);
    return () => subscribers.delete(callback);
}

export function getState(): DailyCheckInStoreState {
    return { ...state };
}
