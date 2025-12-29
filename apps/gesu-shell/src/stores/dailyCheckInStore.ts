/**
 * Daily Check-in Store
 * Manages daily energy/why/focus check-ins with 90-day retention
 * S1-2a: Operationalize Daily Check-in v0
 */

// S3-3: Task with completion state
export interface PlanTask {
    id: string;      // Unique identifier
    text: string;    // Task description
    done: boolean;   // Completion state
}

export interface DailyPlan {
    topOutcome: string;          // One sentence describing today's win condition
    tasks: PlanTask[];           // Up to 3 task objects (was string[])
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
 * Generate unique ID for plan task
 */
function generatePlanTaskId(): string {
    return `plan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * S3-3: Normalize and migrate plan tasks to ensure consistent format
 * Handles:
 * - Old format: string[] → PlanTask[]
 * - Objects without 'done' → add done: false
 * - Unknown shapes → safe fallback
 */
function normalizePlanTasks(tasks: any): PlanTask[] {
    if (!tasks || !Array.isArray(tasks)) return [];
    if (tasks.length === 0) return [];
    
    const firstTask = tasks[0];
    
    // Format 1: Already PlanTask[] (has id, text, done)
    if (typeof firstTask === 'object' && 'id' in firstTask && 'text' in firstTask) {
        return tasks.map(task => ({
            id: task.id || generatePlanTaskId(),
            text: task.text || '',
            done: task.done ?? false  // Default to false if missing
        }));
    }
    
    // Format 2: Old string[]
    if (typeof firstTask === 'string') {
        return tasks.map((text: string) => ({
            id: generatePlanTaskId(),
            text,
            done: false  // All old tasks default to undone
        }));
    }
    
    // Format 3: Unknown - try to salvage
    return tasks.map(task => ({
        id: generatePlanTaskId(),
        text: typeof task === 'object' && task.text ? task.text : String(task),
        done: false
    }));
}

/**
 * S3-3: Get count of today's ACTIVE (undone) plan tasks (for WIP calculation)
 */
export function getTodayPlanTaskCount(): number {
    const checkIn = getTodayCheckIn();
    if (!checkIn?.plan?.tasks) return 0;
    const normalizedTasks = normalizePlanTasks(checkIn.plan.tasks);
    return normalizedTasks.filter(t => !t.done).length;
}

/**
 * S3-3: Get today's plan with normalized tasks
 */
export function getTodayPlan(): DailyPlan | null {
    const checkIn = getTodayCheckIn();
    if (!checkIn?.plan) return null;
    
    return {
        topOutcome: checkIn.plan.topOutcome,
        tasks: normalizePlanTasks(checkIn.plan.tasks)
    };
}

export interface SavePlanResult {
    success: boolean;
    error?: 'check_in_required' | 'max_exceeded';
    max?: number;
}

/**
 * S3-3: Save today's plan with PlanTask[] format
 * FP1: Enforces MAX 3 ACTIVE (undone) tasks, NOT total tasks
 * FP2: Normalizes tasks before saving
 */
export function saveTodayPlan(topOutcome: string, tasks: PlanTask[]): SavePlanResult {
    const existing = getTodayCheckIn();
    
    if (!existing || !existing.isComplete) {
        console.warn('[dailyCheckInStore] Cannot save plan: no completed check-in for today');
        return { success: false, error: 'check_in_required' };
    }
    
    // FP1: Enforce max 3 ACTIVE (undone) tasks
    const activeTasks = tasks.filter(t => !t.done);
    if (activeTasks.length > 3) {
        console.warn('[dailyCheckInStore] Cannot save plan: max 3 active tasks allowed');
        return { success: false, error: 'max_exceeded', max: 3 };
    }
    
    // Optional safety cap: total tasks <= 50 (prevent abuse)
    if (tasks.length > 50) {
        console.warn('[dailyCheckInStore] Cannot save plan: too many total tasks');
        return { success: false, error: 'max_exceeded', max: 50 };
    }
    
    // FP2: Normalize tasks before saving
    const normalizedTasks = normalizePlanTasks(tasks);
    
    // Save with plan
    saveCheckIn({
        ...existing,
        plan: { topOutcome, tasks: normalizedTasks }
    });
    
    console.log('[dailyCheckInStore] Plan saved:', { topOutcome, activeTasks: activeTasks.length, total: normalizedTasks.length });
    return { success: true };
}

/**
 * S3-3: Toggle a plan task's done state
 */
export function togglePlanTaskDone(taskId: string): boolean {
    const plan = getTodayPlan();
    if (!plan) return false;
    
    const updatedTasks = plan.tasks.map(task =>
        task.id === taskId ? { ...task, done: !task.done } : task
    );
    
    const result = saveTodayPlan(plan.topOutcome, updatedTasks);
    return result.success;
}

/**
 * S3-3: Clear all completed tasks from plan
 */
export function clearCompletedPlanTasks(): SavePlanResult {
    const plan = getTodayPlan();
    if (!plan) return { success: false, error: 'check_in_required' };
    
    const activeTasks = plan.tasks.filter(t => !t.done);
    return saveTodayPlan(plan.topOutcome, activeTasks);
}

