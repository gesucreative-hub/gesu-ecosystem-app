// Focus Timer Store - Global Pomodoro timer with phase management
// Single instance shared across the app, survives navigation
import { startActivitySession, endActivitySession } from '../services/activityTrackingService';
import { getUserStorageKey } from '../utils/getUserStorageKey';

export type TimerPhase = 'idle' | 'focus' | 'shortBreak' | 'longBreak';

export interface TimerConfig {
    focusMinutes: number;
    shortBreakMinutes: number;
    longBreakMinutes: number;
    longBreakEvery: number; // every N focus sessions
}

export interface TaskContext {
    taskId: string;
    taskTitle: string;
    projectName?: string;
    stepTitle?: string;
}

export interface FocusTimerState {
    phase: TimerPhase;
    remainingSeconds: number;
    totalSeconds: number;
    isRunning: boolean;
    isPaused: boolean;
    cycleCount: number; // completed focus sessions
    config: TimerConfig;
    sessionActive: boolean; // for distraction shield
    taskContext: TaskContext | null; // linked task
    activitySessionId: string | null; // linked activity session
    sessionGoal: string | null; // optional user-defined goal for current session
}

const DEFAULT_CONFIG: TimerConfig = {
    focusMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    longBreakEvery: 4,
};

const BASE_STORAGE_KEY = 'gesu-focus-timer';
const SCHEMA_VERSION = 1;

// Get user-scoped storage key
const getStorageKey = () => getUserStorageKey(BASE_STORAGE_KEY);

interface StoredState {
    schemaVersion: number;
    state: FocusTimerState | null;
}

// --- Global State ---
let state: FocusTimerState = {
    sessionGoal: null,
    phase: 'idle',
    remainingSeconds: 0,
    totalSeconds: 0,
    isRunning: false,
    isPaused: false,
    cycleCount: 0,
    config: DEFAULT_CONFIG,
    sessionActive: false,
    taskContext: null,
    activitySessionId: null,
};

let tickInterval: number | null = null;
const subscribers = new Set<() => void>();

// --- Persistence ---

function loadState(): FocusTimerState | null {
    try {
        const raw = localStorage.getItem(getStorageKey());
        if (!raw) return null;

        const parsed: StoredState = JSON.parse(raw);
        if (parsed.schemaVersion !== SCHEMA_VERSION) {
            console.warn('Focus timer schema mismatch. Ignoring persisted state.');
            return null;
        }

        return parsed.state;
    } catch {
        return null;
    }
}

function saveState(): void {
    const payload: StoredState = {
        schemaVersion: SCHEMA_VERSION,
        state: state.sessionActive ? state : null,
    };
    localStorage.setItem(getStorageKey(), JSON.stringify(payload));
}

// --- Phase Transitions ---

function getNextPhase(): TimerPhase {
    if (state.phase === 'focus') {
        // Determine if it's time for a long break
        const completedCycles = state.cycleCount + 1;
        if (completedCycles % state.config.longBreakEvery === 0) {
            return 'longBreak';
        }
        return 'shortBreak';
    }
    // After any break, go back to focus
    return 'focus';
}

function getDurationForPhase(phase: TimerPhase): number {
    switch (phase) {
        case 'focus':
            return state.config.focusMinutes * 60;
        case 'shortBreak':
            return state.config.shortBreakMinutes * 60;
        case 'longBreak':
            return state.config.longBreakMinutes * 60;
        default:
            return 0;
    }
}

async function transitionToPhase(phase: TimerPhase): Promise<void> {
    // End previous activity session if exists
    if (state.activitySessionId) {
        await endActivitySession(state.activitySessionId);
        state.activitySessionId = null;
    }

    const duration = getDurationForPhase(phase);
    state.phase = phase;
    state.remainingSeconds = duration;
    state.totalSeconds = duration;

    if (phase === 'focus') {
        state.cycleCount++;
    }

    // Start new activity session for the new phase
    if (phase === 'focus') {
        const result = await startActivitySession('focus');
        state.activitySessionId = result.sessionId || null;
    } else if (phase === 'shortBreak' || phase === 'longBreak') {
        const result = await startActivitySession('break');
        state.activitySessionId = result.sessionId || null;
    }

    saveState();
    notifySubscribers();

    // Trigger phase complete notification and sound
    if (phase !== 'idle') {
        triggerPhaseComplete(phase);
    }
}

// --- Timer Tick Logic ---

async function tick(): Promise<void> {
    if (!state.isRunning || state.isPaused) return;

    state.remainingSeconds--;

    if (state.remainingSeconds <= 0) {
        // Phase complete - transition to next
        const nextPhase = getNextPhase();
        await transitionToPhase(nextPhase);
    } else {
        saveState();
    }

    notifySubscribers();
}

function startTicking(): void {
    if (tickInterval) return; // Already ticking

    tickInterval = setInterval(tick, 1000);
}

function stopTicking(): void {
    if (tickInterval) {
        clearInterval(tickInterval);
        tickInterval = null;
    }
}

// --- Actions ---

export async function start(config?: Partial<TimerConfig>): Promise<void> {
    // Merge config if provided
    if (config) {
        state.config = { ...state.config, ...config };
    }

    state.phase = 'focus';
    state.remainingSeconds = state.config.focusMinutes * 60;
    state.totalSeconds = state.remainingSeconds;
    state.isRunning = true;
    state.isPaused = false;
    state.cycleCount = 0;
    state.sessionActive = true;
    state.taskContext = null;

    // Start activity tracking session
    const result = await startActivitySession('focus');
    state.activitySessionId = result.sessionId || null;

    saveState();
    startTicking();
    notifySubscribers();

    // Request notification permission on first start
    requestNotificationPermission();
}

export async function startWithTask(taskContext: TaskContext, config?: Partial<TimerConfig>): Promise<void> {
    // Merge config if provided
    if (config) {
        state.config = { ...state.config, ...config };
    }

    state.phase = 'focus';
    state.remainingSeconds = state.config.focusMinutes * 60;
    state.totalSeconds = state.remainingSeconds;
    state.isRunning = true;
    state.isPaused = false;
    state.cycleCount = 0;
    state.sessionActive = true;
    state.taskContext = taskContext;

    // Start activity tracking session with task context
    const result = await startActivitySession('focus', taskContext.taskId);
    state.activitySessionId = result.sessionId || null;

    saveState();
    startTicking();
    notifySubscribers();

    // Request notification permission on first start
    requestNotificationPermission();
}

export function pause(): void {
    if (!state.isRunning) return;

    state.isPaused = true;
    stopTicking();
    saveState();
    notifySubscribers();
}

export function resume(): void {
    if (!state.isPaused) return;

    state.isPaused = false;
    startTicking();
    saveState();
    notifySubscribers();
}

export function skip(): void {
    if (!state.sessionActive) return;

    const nextPhase = getNextPhase();
    transitionToPhase(nextPhase);
}

export async function stop(): Promise<void> {
    // End activity tracking session if active
    if (state.activitySessionId) {
        await endActivitySession(state.activitySessionId);
    }

    state.phase = 'idle';
    state.remainingSeconds = 0;
    state.totalSeconds = 0;
    state.isRunning = false;
    state.isPaused = false;
    state.sessionActive = false;
    state.taskContext = null;
    state.activitySessionId = null;
    state.sessionGoal = null; // Clear goal on stop

    stopTicking();
    saveState();
    notifySubscribers();
}

export function setConfig(config: Partial<TimerConfig>): void {
    state.config = { ...state.config, ...config };
    saveState();
    notifySubscribers();
}

export function setSessionGoal(goal: string | null): void {
    state.sessionGoal = goal;
    saveState();
    notifySubscribers();
}


// --- Getters ---

export function getState(): FocusTimerState {
    return { ...state };
}

export function isSessionActive(): boolean {
    return state.sessionActive;
}

// --- Subscription ---

export function subscribe(callback: () => void): () => void {
    subscribers.add(callback);
    return () => subscribers.delete(callback);
}

function notifySubscribers(): void {
    subscribers.forEach(cb => cb());
}

// --- Notifications & Sound ---

let notificationPermissionGranted = false;

async function requestNotificationPermission(): Promise<void> {
    if (!('Notification' in window)) return;

    try {
        const permission = await Notification.requestPermission();
        notificationPermissionGranted = permission === 'granted';
    } catch {
        notificationPermissionGranted = false;
    }
}

function triggerPhaseComplete(newPhase: TimerPhase): void {
    // Notification
    if (notificationPermissionGranted) {
        const titles = {
            focus: 'Focus Time!',
            shortBreak: 'Short Break',
            longBreak: 'Long Break - Well Done!',
            idle: '',
        };

        const bodies = {
            focus: 'Time to focus. Let\'s get to work!',
            shortBreak: 'Take a quick break. You earned it!',
            longBreak: `You completed ${state.cycleCount} focus sessions. Take a longer break!`,
            idle: '',
        };

        if (titles[newPhase]) {
            new Notification(titles[newPhase], {
                body: bodies[newPhase],
                icon: '/icon.png', // Optional if you have an icon
            });
        }
    }

    // Sound hook
    playSoundCue(newPhase);
}

// --- Sound Hook (no bundled assets) ---

let soundCuePath: string | null = null;

export function setSoundCuePath(path: string | null): void {
    soundCuePath = path;
}

function playSoundCue(_phase: TimerPhase): void {
    // Call the hook - if user has configured a sound, play it
    if (soundCuePath) {
        try {
            const audio = new Audio(soundCuePath);
            audio.play().catch(() => {
                // Silent fail if sound can't play
            });
        } catch {
            // Silent fail
        }
    }

    // Safe default: no-op if no sound configured
    // Future: could use Web Audio API for a tiny beep
}

// --- Initialization ---

// Try to restore state on module load
const restoredState = loadState();
if (restoredState && restoredState.sessionActive) {
    state = restoredState;
    // If was running, resume ticking
    if (state.isRunning && !state.isPaused) {
        startTicking();
    }
}
