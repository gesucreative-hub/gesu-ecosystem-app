/**
 * Gamification Sync Service
 * Handles cloud synchronization of gamification data with Firebase Firestore
 * Offline-first architecture: localStorage is primary, cloud is sync backup
 */

import { 
    doc, 
    getDoc, 
    setDoc, 
    onSnapshot, 
    serverTimestamp,
    Unsubscribe 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
    getState, 
    GamificationState, 
    subscribe as subscribeToStore,
    unlockEligibleCosmetics
} from '../stores/gamificationStore';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface CloudGamificationData {
    xp: number;
    level: number;
    streak: number;
    achievements: string[];
    unlockedCosmetics: string[];
    equippedCosmetics: {
        hat?: string;
        cape?: string;
        accessory?: string;
        aura?: string;
        background?: string;
    };
    totalTasksCompleted: number;
    totalProjectsCompleted: number;
    lastSyncAt: unknown;
    version: number;
}

export interface SyncStatus {
    isSyncing: boolean;
    lastSyncAt: number | null;
    error: string | null;
    isOnline: boolean;
    retryCount: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const SYNC_DEBOUNCE_MS = 2000; // 2 second debounce

// ─────────────────────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────────────────────

let syncStatus: SyncStatus = {
    isSyncing: false,
    lastSyncAt: null,
    error: null,
    isOnline: navigator.onLine,
    retryCount: 0,
};

let syncDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let realtimeUnsubscribe: Unsubscribe | null = null;
// Flag to prevent sync loop when receiving cloud updates
let isReceivingCloudUpdate = false;

type SyncStatusListener = (status: SyncStatus) => void;
const syncStatusListeners = new Set<SyncStatusListener>();

// ─────────────────────────────────────────────────────────────────────────────
// Status Management
// ─────────────────────────────────────────────────────────────────────────────

export function getSyncStatus(): SyncStatus {
    return { ...syncStatus };
}

export function subscribeSyncStatus(callback: SyncStatusListener): () => void {
    syncStatusListeners.add(callback);
    return () => syncStatusListeners.delete(callback);
}

function updateSyncStatus(updates: Partial<SyncStatus>) {
    syncStatus = { ...syncStatus, ...updates };
    syncStatusListeners.forEach(cb => cb(syncStatus));
}

// ─────────────────────────────────────────────────────────────────────────────
// Core Sync Functions
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Core Sync Functions
// ─────────────────────────────────────────────────────────────────────────────

function getGamificationDocRef(userId: string) {
    return doc(db, 'users', userId, 'gamification', 'data');
}

function localToCloud(state: GamificationState): Omit<CloudGamificationData, 'lastSyncAt'> {
    return {
        xp: state.xp,
        level: state.level,
        streak: state.streak,
        achievements: state.achievements,
        unlockedCosmetics: state.unlockedCosmetics,
        equippedCosmetics: state.equippedCosmetics,
        totalTasksCompleted: state.totalTasksCompleted,
        totalProjectsCompleted: state.totalProjectsCompleted,
        version: Date.now(),
    };
}

/**
 * Push local state to cloud
 */
export async function syncToCloud(userId: string): Promise<boolean> {
    if (!userId || !navigator.onLine) {
        console.log('[Sync] Skipping - offline or no user');
        return false;
    }

    updateSyncStatus({ isSyncing: true, error: null, retryCount: 0 });

    try {
        const localState = getState();
        const cloudData = {
            ...localToCloud(localState),
            lastSyncAt: serverTimestamp(),
        };

        await setDoc(getGamificationDocRef(userId), cloudData, { merge: true });
        
        updateSyncStatus({ 
            isSyncing: false, 
            lastSyncAt: Date.now(),
            error: null,
            retryCount: 0
        });
        
        console.log('[Sync] ✓ Pushed to cloud');
        return true;
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Sync failed';
        console.error('[Sync] ✗ Failed:', message);
        updateSyncStatus({ 
            isSyncing: false, 
            error: message,
            retryCount: 0
        });
        return false;
    }
}

/**
 * Pull cloud state and merge with local
 */
export async function syncFromCloud(userId: string): Promise<boolean> {
    if (!userId || !navigator.onLine) {
        return false;
    }

    updateSyncStatus({ isSyncing: true, error: null, retryCount: 0 });

    try {
        const docSnap = await getDoc(getGamificationDocRef(userId));
        
        if (!docSnap.exists()) {
            console.log('[Sync] No cloud data, pushing local');
            await syncToCloud(userId);
            updateSyncStatus({ isSyncing: false });
            return true;
        }

        const cloudData = docSnap.data() as CloudGamificationData;
        const localState = getState();
        const mergedState = mergeStates(localState, cloudData);
        
        // Set flag to prevent sync loop
        isReceivingCloudUpdate = true;
        try {
            const { saveStateDirect } = await import('../stores/gamificationStore');
            saveStateDirect(mergedState);
            unlockEligibleCosmetics();
        } finally {
            // Reset flag after state is saved
            isReceivingCloudUpdate = false;
        }

        updateSyncStatus({ 
            isSyncing: false, 
            lastSyncAt: Date.now(),
            error: null,
            retryCount: 0
        });

        console.log('[Sync] ✓ Merged cloud state');
        return true;
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Sync failed';
        console.error('[Sync] ✗ Pull failed:', message);
        updateSyncStatus({ 
            isSyncing: false, 
            error: message,
            retryCount: 0
        });
        return false;
    }
}

function mergeStates(local: GamificationState, cloud: CloudGamificationData): GamificationState {
    return {
        ...local,
        xp: Math.max(local.xp, cloud.xp),
        level: Math.max(local.level, cloud.level),
        streak: Math.max(local.streak, cloud.streak),
        totalTasksCompleted: Math.max(local.totalTasksCompleted, cloud.totalTasksCompleted),
        totalProjectsCompleted: Math.max(local.totalProjectsCompleted, cloud.totalProjectsCompleted),
        achievements: [...new Set([...local.achievements, ...cloud.achievements])],
        unlockedCosmetics: [...new Set([...local.unlockedCosmetics, ...cloud.unlockedCosmetics])],
        equippedCosmetics: Object.keys(local.equippedCosmetics).length > 0 
            ? local.equippedCosmetics 
            : cloud.equippedCosmetics,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Realtime Sync
// ─────────────────────────────────────────────────────────────────────────────

export function setupRealtimeSync(userId: string): () => void {
    if (!userId) return () => {};

    if (realtimeUnsubscribe) {
        realtimeUnsubscribe();
    }

    console.log('[Sync] Setting up realtime sync');

    realtimeUnsubscribe = onSnapshot(
        getGamificationDocRef(userId),
        (snapshot) => {
            if (snapshot.exists() && snapshot.metadata.hasPendingWrites === false) {
                console.log('[Sync] Received cloud update');
                syncFromCloud(userId);
            }
        },
        (error) => {
            console.error('[Sync] Realtime error:', error);
            updateSyncStatus({ error: error.message });
        }
    );

    const unsubscribeStore = subscribeToStore(() => {
        // Don't sync back to cloud if we're receiving a cloud update
        if (isReceivingCloudUpdate) {
            return;
        }
        if (syncDebounceTimer) clearTimeout(syncDebounceTimer);
        syncDebounceTimer = setTimeout(() => {
            syncToCloud(userId);
        }, SYNC_DEBOUNCE_MS);
    });

    return () => {
        if (realtimeUnsubscribe) {
            realtimeUnsubscribe();
            realtimeUnsubscribe = null;
        }
        unsubscribeStore();
        if (syncDebounceTimer) {
            clearTimeout(syncDebounceTimer);
            syncDebounceTimer = null;
        }
    };
}

export function stopRealtimeSync(): void {
    if (realtimeUnsubscribe) {
        realtimeUnsubscribe();
        realtimeUnsubscribe = null;
    }
    if (syncDebounceTimer) {
        clearTimeout(syncDebounceTimer);
        syncDebounceTimer = null;
    }
}

/**
 * Manual retry function for UI
 */
export async function retrySync(): Promise<boolean> {
    const userId = localStorage.getItem('gesu.userId');
    if (!userId) return false;
    return syncToCloud(userId);
}

// ─────────────────────────────────────────────────────────────────────────────
// Online/Offline Handling
// ─────────────────────────────────────────────────────────────────────────────

if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
        updateSyncStatus({ isOnline: true, error: null });
        const userId = localStorage.getItem('gesu.userId');
        if (userId) {
            syncToCloud(userId);
        }
    });

    window.addEventListener('offline', () => {
        updateSyncStatus({ isOnline: false });
    });
}
