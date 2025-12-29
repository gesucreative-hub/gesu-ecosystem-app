/**
 * Daily Check-in Store
 * Manages daily energy/why/focus check-ins with 90-day retention
 * S1-2a: Operationalize Daily Check-in v0
 */

export interface DailyPlan {
    topOutcome: string;          // One sentence describing today's win condition
    tasks: string[];             // Up to 3 task descriptions
}

export interface DailyCheckIn {
    id: string;                     // uuid
    date: string;                   // 'YYYY-MM-DD' local
    energy: number;                 // 1-5
    why: string;                    // text (can be empty)
    topFocusType: 'project' | 'task' | 'text';
    topFocusRefId?: string;         // project.id or task.id (reference only, not activation)
    topFocusText?: string;          // free text fallback
    createdAt: string;              // ISO timestamp
    isComplete?: boolean;           // S1-2c: true if user completed full check-in flow, false if only focus set
    plan?: DailyPlan;               // S3-0b: Optional daily plan (top outcome + tasks)
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

    const raw = readRaw(STORAGE_KEY);
    if (!raw) return defaultState;

    const parseResult = parse(raw);
    if (!parseResult) {
        registerSchemaWarning(STORAGE_KEY, 'CORRUPT');
        createBackupSnapshot(STORAGE_KEY, raw);
        return defaultState;
    }

    // CRITICAL FIX: parse() returns {success: true, data: {...}}, not the raw object
    const parsed = (parseResult as any).data || parseResult;

    const detectedVersion = detectVersion(parsed);
    if (detectedVersion !== null && detectedVersion > CURRENT_SCHEMA_VERSION) {
        registerSchemaWarning(STORAGE_KEY, 'FUTURE_VERSION');
        createBackupSnapshot(STORAGE_KEY, raw);
        return defaultState;
    }

    // No migration needed for v1
    if (typeof parsed === 'object' && parsed !== null && 'schemaVersion' in parsed && 'checkIns' in parsed) {
        return parsed as DailyCheckInStoreState;
    }
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
    return state.checkIns.find(c => c.date === todayKey) || null;
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

/**
 * Update today's check-in topFocus without requiring full check-in flow
 * If no check-in exists, creates minimal one with neutral defaults
 * S1-2b: Focus First workflow
 * S1-2c: Does NOT mark isComplete=true (only full check-in flow does)
 */
export function updateTodayTopFocus(
    type: 'project' | 'task' | 'text',
    refId?: string,
    text?: string
): DailyCheckIn {
    const todayKey = getTodayKey();
    const existing = getTodayCheckIn();
    
    if (existing) {
        // Update existing check-in's topFocus, preserve isComplete status
        return saveCheckIn({
            date: todayKey,
            energy: existing.energy,
            why: existing.why,
            topFocusType: type,
            topFocusRefId: refId,
            topFocusText: text,
            isComplete: existing.isComplete, // Preserve existing completion status
        });
    } else {
        // Create minimal check-in with neutral defaults
        // isComplete=false because user hasn't done full check-in
        return saveCheckIn({
            date: todayKey,
            energy: 3, // neutral default (scale 1-5)
            why: '',
            topFocusType: type,
            topFocusRefId: refId,
            topFocusText: text,
            isComplete: false, // S1-2c: Not a complete check-in, just focus preference
        });
    }
}

export function subscribe(callback: () => void): () => void {
    subscribers.add(callback);
    return () => subscribers.delete(callback);
}

export function getState(): DailyCheckInStoreState {
    return { ...state };
}

// --- S3-0b: Daily Plan Functions ---

/**
 * Get count of today's plan tasks (for WIP calculation in taskGuardrail)
 */
export function getTodayPlanTaskCount(): number {
    const checkIn = getTodayCheckIn();
    return checkIn?.plan?.tasks.length || 0;
}

/**
 * Get today's plan (convenience helper)
 */
export function getTodayPlan(): DailyPlan | null {
    const checkIn = getTodayCheckIn();
    return checkIn?.plan || null;
}

export interface SavePlanResult {
    success: boolean;
    error?: 'check_in_required' | 'max_exceeded';
    max?: number;
}

/**
 * Save today's plan (local validation only - cross-store WIP is UI's responsibility)
 * - Requires completed check-in
 * - Enforces max 3 tasks within plan (local rule)
 * - Does NOT truncate - returns error if over max
 */
export function saveTodayPlan(topOutcome: string, tasks: string[]): SavePlanResult {
    const existing = getTodayCheckIn();
    
    if (!existing || !existing.isComplete) {
        console.warn('[dailyCheckInStore] Cannot save plan: no completed check-in for today');
        return { success: false, error: 'check_in_required' };
    }
    
    // Local enforcement: max 3 tasks in plan
    if (tasks.length > 3) {
        console.warn('[dailyCheckInStore] Cannot save plan: max 3 tasks allowed');
        return { success: false, error: 'max_exceeded', max: 3 };
    }
    
    // Save with plan
    saveCheckIn({
        ...existing,
        plan: { topOutcome, tasks }
    });
    
    console.log('[dailyCheckInStore] Plan saved:', { topOutcome, tasks });
    return { success: true };
}

