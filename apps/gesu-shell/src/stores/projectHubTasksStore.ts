// Project Hub Tasks Store - Shared state for Project Hub -> Compass integration
// Uses localStorage for date-scoped persistence (MVP - no backend needed)

import { toggleDoDItem } from './workflowProgressStore';

export interface ProjectHubTask {
    id: string;
    dateKey: string;          // YYYY-MM-DD format
    title: string;
    done: boolean;
    source: 'projectHub';
    projectName: string;      // Placeholder for now
    stepId: string;
    stepTitle: string;
    dodItemId: string;
    dodItemLabel: string;
    createdAt: number;        // timestamp
}

const STORAGE_KEY = 'gesu-projecthub-tasks';
const MAX_ACTIVE_TASKS_PER_DAY = 3;

// --- Utility Functions ---

export function getTodayKey(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function generateId(): string {
    return `ph-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// --- Storage Operations (with schemaVersion) ---

interface StoredTasksState {
    schemaVersion: number;
    tasks: ProjectHubTask[];
}

const CURRENT_SCHEMA_VERSION = 1;

function loadState(): StoredTasksState {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { schemaVersion: CURRENT_SCHEMA_VERSION, tasks: [] };

        const parsed = JSON.parse(raw);

        // Handle legacy format (array without schema wrapper)
        if (Array.isArray(parsed)) {
            console.log('Migrating projectHubTasksStore to schemaVersion 1');
            return { schemaVersion: CURRENT_SCHEMA_VERSION, tasks: parsed };
        }

        // Handle new format with schemaVersion
        if (parsed.schemaVersion !== CURRENT_SCHEMA_VERSION) {
            console.warn('ProjectHubTasks schema mismatch. Resetting.');
            return { schemaVersion: CURRENT_SCHEMA_VERSION, tasks: [] };
        }

        return parsed;
    } catch {
        return { schemaVersion: CURRENT_SCHEMA_VERSION, tasks: [] };
    }
}

function saveState(tasks: ProjectHubTask[]): void {
    const payload: StoredTasksState = { schemaVersion: CURRENT_SCHEMA_VERSION, tasks };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function loadTasksForDate(dateKey: string): ProjectHubTask[] {
    const state = loadState();
    return state.tasks.filter(t => t.dateKey === dateKey);
}

export function loadAllTasks(): ProjectHubTask[] {
    return loadState().tasks;
}

export function saveAllTasks(tasks: ProjectHubTask[]): void {
    saveState(tasks);
}

export function saveTasksForDate(dateKey: string, dateTasks: ProjectHubTask[]): void {
    const allTasks = loadAllTasks();
    // Remove tasks for this date, then add new ones
    const otherDayTasks = allTasks.filter(t => t.dateKey !== dateKey);
    const updatedTasks = [...otherDayTasks, ...dateTasks];
    saveAllTasks(updatedTasks);
}

// --- Query Helpers ---

export function getTodayTasks(): ProjectHubTask[] {
    return loadTasksForDate(getTodayKey());
}

export function countActiveProjectHubTasksToday(): number {
    const tasks = getTodayTasks();
    return tasks.filter(t => !t.done).length;
}

export function isDodItemAlreadySentToday(stepId: string, dodItemId: string): boolean {
    const tasks = getTodayTasks();
    return tasks.some(t => t.stepId === stepId && t.dodItemId === dodItemId);
}

export function canAddMoreTasksToday(): boolean {
    return countActiveProjectHubTasksToday() < MAX_ACTIVE_TASKS_PER_DAY;
}

export function getRemainingSlots(): number {
    return Math.max(0, MAX_ACTIVE_TASKS_PER_DAY - countActiveProjectHubTasksToday());
}

// --- Actions ---

export function addTaskToToday(params: {
    stepId: string;
    stepTitle: string;
    dodItemId: string;
    dodItemLabel: string;
    projectName?: string;
}): ProjectHubTask | null {
    if (!canAddMoreTasksToday()) return null;
    if (isDodItemAlreadySentToday(params.stepId, params.dodItemId)) return null;

    const dateKey = getTodayKey();
    const task: ProjectHubTask = {
        id: generateId(),
        dateKey,
        title: params.dodItemLabel,
        done: false,
        source: 'projectHub',
        projectName: params.projectName || 'Current Project',
        stepId: params.stepId,
        stepTitle: params.stepTitle,
        dodItemId: params.dodItemId,
        dodItemLabel: params.dodItemLabel,
        createdAt: Date.now(),
    };

    const tasks = getTodayTasks();
    tasks.push(task);
    saveTasksForDate(dateKey, tasks);
    notifySubscribers(); // Notify subscribers immediately
    return task;
}

export function toggleTaskDone(taskId: string): void {
    const dateKey = getTodayKey();
    const tasks = getTodayTasks();

    // Find the task being toggled to get its stepId/dodItemId
    const task = tasks.find(t => t.id === taskId);

    const updated = tasks.map(t =>
        t.id === taskId ? { ...t, done: !t.done } : t
    );
    saveTasksForDate(dateKey, updated);

    // Sync with workflow DoD: toggle the matching DoD item in workflow progress
    if (task) {
        toggleDoDItem(task.stepId, task.dodItemId);
    }

    notifySubscribers(); // Notify after mutation
}

export function removeTask(taskId: string): void {
    const dateKey = getTodayKey();
    const tasks = getTodayTasks();
    const filtered = tasks.filter(t => t.id !== taskId);
    saveTasksForDate(dateKey, filtered);
    notifySubscribers(); // Notify after mutation
}

// Mark all today's tasks for a step as done (used when Workflow step is marked as done)
export function markAllTasksDoneForStep(stepId: string): void {
    const dateKey = getTodayKey();
    const tasks = getTodayTasks();
    const updated = tasks.map(t =>
        t.stepId === stepId ? { ...t, done: true } : t
    );
    saveTasksForDate(dateKey, updated);
    notifySubscribers();
}

// Mark all today's tasks for a step as undone (used when Workflow step is reopened)
export function markAllTasksUndoneForStep(stepId: string): void {
    const dateKey = getTodayKey();
    const tasks = getTodayTasks();
    const updated = tasks.map(t =>
        t.stepId === stepId ? { ...t, done: false } : t
    );
    saveTasksForDate(dateKey, updated);
    notifySubscribers();
}

// Toggle a specific task for a DoD item (used when individual DoD item is toggled in Workflow)
export function toggleTaskForDoDItem(stepId: string, dodItemId: string, isDone: boolean): void {
    const dateKey = getTodayKey();
    const tasks = getTodayTasks();

    // Find task matching stepId and dodItemId
    const taskExists = tasks.some(t => t.stepId === stepId && t.dodItemId === dodItemId);

    if (taskExists) {
        const updated = tasks.map(t =>
            t.stepId === stepId && t.dodItemId === dodItemId
                ? { ...t, done: isDone }
                : t
        );
        saveTasksForDate(dateKey, updated);
        notifySubscribers();
    }
    // If task doesn't exist, do nothing (user hasn't sent it to Compass yet)
}

// --- Reactive Subscription Pattern ---

const subscribers = new Set<() => void>();

/**
 * Subscribe to task changes (add/remove/toggle)
 * Returns unsubscribe function
 */
export function subscribe(callback: () => void): () => void {
    subscribers.add(callback);
    return () => subscribers.delete(callback);
}

/**
 * Notify all subscribers that tasks have changed
 */
function notifySubscribers(): void {
    subscribers.forEach(callback => callback());
}

