// Finish Mode Store - Anti-planning trap guardrails
// Helps user focus on finishing projects by constraining to 1 step + max 3 actions

import { toggleDoDItem } from './workflowProgressStore';

export interface FinishAction {
    id: string;
    label: string;
    done: boolean;
}

export interface FinishSession {
    id: string;
    dateKey: string;           // YYYY-MM-DD format
    projectName: string;       // placeholder OK for MVP
    stepId: string;
    stepTitle: string;
    actions: FinishAction[];   // max 3
    startedAt?: number;        // timestamp when session started
    endedAt?: number;          // timestamp when session ended
}

interface FinishModeState {
    schemaVersion: number;
    finishSession: FinishSession | null;
}

const STORAGE_KEY = 'gesu-finish-mode';
const CURRENT_SCHEMA_VERSION = 1;
const MAX_ACTIONS = 3;

// --- Utility Functions ---

export function getTodayKey(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function generateId(): string {
    return `fm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// --- Storage Operations ---

function loadState(): FinishModeState {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { schemaVersion: CURRENT_SCHEMA_VERSION, finishSession: null };

        const parsed: FinishModeState = JSON.parse(raw);

        // Schema migration: reset if incompatible
        if (parsed.schemaVersion !== CURRENT_SCHEMA_VERSION) {
            console.warn(`Finish Mode schema mismatch. Resetting.`);
            return { schemaVersion: CURRENT_SCHEMA_VERSION, finishSession: null };
        }

        return parsed;
    } catch {
        return { schemaVersion: CURRENT_SCHEMA_VERSION, finishSession: null };
    }
}

function saveState(state: FinishModeState): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// --- Public API ---

export function getFinishSession(): FinishSession | null {
    return loadState().finishSession;
}

export function isActiveToday(): boolean {
    const session = getFinishSession();
    if (!session) return false;
    return session.dateKey === getTodayKey() && !session.endedAt;
}

export function isActiveForStep(stepId: string): boolean {
    const session = getFinishSession();
    if (!session) return false;
    return session.dateKey === getTodayKey() && session.stepId === stepId && !session.endedAt;
}

export function startFinishMode(params: {
    projectName: string;
    stepId: string;
    stepTitle: string;
    actions: Array<{ id: string; label: string }>;
}): FinishSession | null {
    // Validate: must have 1-3 actions
    if (params.actions.length === 0 || params.actions.length > MAX_ACTIONS) {
        console.error(`Finish Mode requires 1-${MAX_ACTIONS} actions`);
        return null;
    }

    const session: FinishSession = {
        id: generateId(),
        dateKey: getTodayKey(),
        projectName: params.projectName,
        stepId: params.stepId,
        stepTitle: params.stepTitle,
        actions: params.actions.map(a => ({ ...a, done: false })),
    };

    saveState({ schemaVersion: CURRENT_SCHEMA_VERSION, finishSession: session });
    return session;
}

export function toggleAction(actionId: string): void {
    const state = loadState();
    if (!state.finishSession) return;

    const { stepId } = state.finishSession;

    state.finishSession.actions = state.finishSession.actions.map(a =>
        a.id === actionId ? { ...a, done: !a.done } : a
    );
    saveState(state);

    // Sync with workflow DoD: toggle the matching DoD item in workflow progress
    // actionId in Finish Mode corresponds to dodItemId in Workflow
    toggleDoDItem(stepId, actionId);
}

export function startSession(): void {
    const state = loadState();
    if (!state.finishSession) return;
    if (state.finishSession.startedAt) return; // already started

    state.finishSession.startedAt = Date.now();
    saveState(state);
}

export function endSession(): void {
    const state = loadState();
    if (!state.finishSession) return;

    state.finishSession.endedAt = Date.now();
    saveState(state);
}

export function clearSession(): void {
    saveState({ schemaVersion: CURRENT_SCHEMA_VERSION, finishSession: null });
}

export function getCompletedCount(): number {
    const session = getFinishSession();
    if (!session) return 0;
    return session.actions.filter(a => a.done).length;
}

export function getAllActionsCompleted(): boolean {
    const session = getFinishSession();
    if (!session) return false;
    return session.actions.every(a => a.done);
}

// Mark all Finish Mode actions as done (used when Workflow step is marked as done)
export function markAllActionsDone(): void {
    const state = loadState();
    if (!state.finishSession) return;

    state.finishSession.actions = state.finishSession.actions.map(a => ({ ...a, done: true }));
    saveState(state);
}

// Mark all Finish Mode actions as undone (used when Workflow step is reopened)
export function markAllActionsUndone(): void {
    const state = loadState();
    if (!state.finishSession) return;

    state.finishSession.actions = state.finishSession.actions.map(a => ({ ...a, done: false }));
    saveState(state);
}

// Check if Finish Mode is active for a specific step
export function isFinishModeForStep(stepId: string): boolean {
    const session = getFinishSession();
    if (!session) return false;
    return session.stepId === stepId && session.dateKey === getTodayKey();
}

// Set action done state (used when Workflow DoD item is toggled - avoids circular sync)
export function setActionDone(actionId: string, isDone: boolean): void {
    const state = loadState();
    if (!state.finishSession) return;

    state.finishSession.actions = state.finishSession.actions.map(a =>
        a.id === actionId ? { ...a, done: isDone } : a
    );
    saveState(state);
    // Note: Does NOT sync back to workflow to avoid circular updates
}
