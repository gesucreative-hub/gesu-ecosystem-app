// Project Hub Tasks Store - Shared state for Project Hub -> Compass integration
// Uses localStorage for date-scoped persistence (MVP - no backend needed)

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

// --- Storage Operations ---

export function loadTasksForDate(dateKey: string): ProjectHubTask[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const allTasks: ProjectHubTask[] = JSON.parse(raw);
        return allTasks.filter(t => t.dateKey === dateKey);
    } catch {
        return [];
    }
}

export function loadAllTasks(): ProjectHubTask[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

export function saveAllTasks(tasks: ProjectHubTask[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
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
    return task;
}

export function toggleTaskDone(taskId: string): void {
    const dateKey = getTodayKey();
    const tasks = getTodayTasks();
    const updated = tasks.map(t =>
        t.id === taskId ? { ...t, done: !t.done } : t
    );
    saveTasksForDate(dateKey, updated);
}

export function removeTask(taskId: string): void {
    const dateKey = getTodayKey();
    const tasks = getTodayTasks();
    const filtered = tasks.filter(t => t.id !== taskId);
    saveTasksForDate(dateKey, filtered);
}
