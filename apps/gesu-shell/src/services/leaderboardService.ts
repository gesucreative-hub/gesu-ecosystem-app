/**
 * Leaderboard Service
 * Handles leaderboard data in Firestore with privacy controls
 * Users must opt-in to appear on the leaderboard
 */

import { 
    doc, 
    getDoc, 
    setDoc, 
    collection, 
    query, 
    orderBy, 
    limit, 
    getDocs,
    serverTimestamp,
    where,
    deleteDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { getState } from '../stores/gamificationStore';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
    rank: number;
    userId: string;
    displayName: string;
    avatarUrl?: string;
    level: number;
    xp: number;
    weeklyXp: number;
    streak: number;
    isCurrentUser: boolean;
    isAnonymous: boolean;
}

export interface LeaderboardSettings {
    optedIn: boolean;
    displayName: string;
    showAnonymous: boolean; // Display as "Anonymous User"
}

// ─────────────────────────────────────────────────────────────────────────────
// Firestore Collections
// ─────────────────────────────────────────────────────────────────────────────

const LEADERBOARD_COLLECTION = 'leaderboard';
const SETTINGS_SUBCOLLECTION = 'leaderboardSettings';

function getLeaderboardDocRef(userId: string) {
    return doc(db, LEADERBOARD_COLLECTION, userId);
}

function getSettingsDocRef(userId: string) {
    return doc(db, 'users', userId, SETTINGS_SUBCOLLECTION, 'settings');
}

// ─────────────────────────────────────────────────────────────────────────────
// Settings Management
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get user's leaderboard settings
 */
export async function getLeaderboardSettings(userId: string): Promise<LeaderboardSettings | null> {
    if (!userId) return null;
    
    try {
        const docSnap = await getDoc(getSettingsDocRef(userId));
        if (docSnap.exists()) {
            return docSnap.data() as LeaderboardSettings;
        }
        return null;
    } catch (err) {
        console.error('[Leaderboard] Failed to get settings:', err);
        return null;
    }
}

/**
 * Opt-in to leaderboard - with timeout
 */
export async function optInToLeaderboard(
    userId: string, 
    displayName: string, 
    avatarUrl?: string,
    anonymous: boolean = false
): Promise<boolean> {
    if (!userId) return false;
    
    // Create a timeout promise
    const timeout = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Opt-in timed out after 10 seconds')), 10000);
    });
    
    try {
        const gamificationState = getState();
        
        console.log('[Leaderboard] Opting in user:', userId);
        console.log('[Leaderboard] Current state:', { xp: gamificationState.xp, level: gamificationState.level });
        
        // Race between actual work and timeout
        await Promise.race([
            (async () => {
                // Save settings
                const settingsDoc = getSettingsDocRef(userId);
                console.log('[Leaderboard] Writing settings to:', settingsDoc.path);
                await setDoc(settingsDoc, {
                    optedIn: true,
                    displayName: anonymous ? 'Anonymous' : displayName,
                    showAnonymous: anonymous,
                });
                console.log('[Leaderboard] ✓ Settings saved');
                
                // Add to leaderboard
                const leaderboardDoc = getLeaderboardDocRef(userId);
                console.log('[Leaderboard] Writing leaderboard entry to:', leaderboardDoc.path);
                await setDoc(leaderboardDoc, {
                    displayName: anonymous ? 'Anonymous User' : displayName,
                    avatarUrl: anonymous ? null : (avatarUrl || null),
                    level: gamificationState.level,
                    xp: gamificationState.xp,
                    weeklyXp: 0, // Reset weekly on opt-in
                    streak: gamificationState.streak,
                    isAnonymous: anonymous,
                    lastUpdated: serverTimestamp(),
                    weekResetAt: getWeekStart(),
                });
                console.log('[Leaderboard] ✓ Leaderboard entry saved');
            })(),
            timeout
        ]);
        
        console.log('[Leaderboard] User opted in successfully:', userId);
        return true;
    } catch (err) {
        console.error('[Leaderboard] Failed to opt in:', err);
        return false;
    }
}

/**
 * Opt-out from leaderboard - with timeout
 */
export async function optOutFromLeaderboard(userId: string): Promise<boolean> {
    if (!userId) return false;
    
    // Create a timeout promise
    const timeout = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Opt-out timed out after 10 seconds')), 10000);
    });
    
    try {
        console.log('[Leaderboard] Opting out user:', userId);
        
        // Race between actual work and timeout
        await Promise.race([
            (async () => {
                // Update settings first (this should work)
                const settingsDoc = getSettingsDocRef(userId);
                console.log('[Leaderboard] Updating settings at:', settingsDoc.path);
                await setDoc(settingsDoc, {
                    optedIn: false,
                    displayName: '',
                    showAnonymous: false,
                });
                console.log('[Leaderboard] ✓ Settings updated');
                
                // Try to remove from leaderboard (might fail due to permissions)
                const leaderboardDoc = getLeaderboardDocRef(userId);
                console.log('[Leaderboard] Deleting leaderboard entry at:', leaderboardDoc.path);
                try {
                    await deleteDoc(leaderboardDoc);
                    console.log('[Leaderboard] ✓ Leaderboard entry deleted');
                } catch (deleteErr) {
                    console.warn('[Leaderboard] Could not delete leaderboard entry (may not exist):', deleteErr);
                    // Don't fail the whole operation if delete fails
                }
            })(),
            timeout
        ]);
        
        console.log('[Leaderboard] User opted out successfully:', userId);
        return true;
    } catch (err) {
        console.error('[Leaderboard] Failed to opt out:', err);
        return false;
    }
}

/**
 * Update leaderboard entry (called after XP changes)
 */
export async function updateLeaderboardEntry(
    userId: string,
    xpGained: number
): Promise<void> {
    if (!userId) return;
    
    try {
        const settings = await getLeaderboardSettings(userId);
        if (!settings?.optedIn) return;
        
        const gamificationState = getState();
        const docRef = getLeaderboardDocRef(userId);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) return;
        
        const currentData = docSnap.data();
        const weekStart = getWeekStart();
        
        // Reset weekly XP if new week
        const weeklyXp = currentData.weekResetAt === weekStart 
            ? (currentData.weeklyXp || 0) + xpGained
            : xpGained;
        
        await setDoc(docRef, {
            level: gamificationState.level,
            xp: gamificationState.xp,
            weeklyXp,
            streak: gamificationState.streak,
            lastUpdated: serverTimestamp(),
            weekResetAt: weekStart,
        }, { merge: true });
        
    } catch (err) {
        console.error('[Leaderboard] Failed to update entry:', err);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Leaderboard Queries
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get top users by all-time XP
 */
export async function getTopAllTime(count: number = 10): Promise<LeaderboardEntry[]> {
    try {
        console.log('[Leaderboard] Fetching all-time rankings...');
        
        const q = query(
            collection(db, LEADERBOARD_COLLECTION),
            orderBy('xp', 'desc'),
            limit(count)
        );
        
        const snapshot = await getDocs(q);
        const currentUserId = localStorage.getItem('gesu.userId');
        
        console.log(`[Leaderboard] All-time: Found ${snapshot.docs.length} entries`);
        
        return snapshot.docs.map((doc, index) => ({
            rank: index + 1,
            userId: doc.id,
            displayName: doc.data().displayName || 'User',
            avatarUrl: doc.data().avatarUrl,
            level: doc.data().level || 1,
            xp: doc.data().xp || 0,
            weeklyXp: doc.data().weeklyXp || 0,
            streak: doc.data().streak || 0,
            isCurrentUser: doc.id === currentUserId,
            isAnonymous: doc.data().isAnonymous || false,
        }));
    } catch (err) {
        console.error('[Leaderboard] Failed to get all-time rankings:', err);
        return [];
    }
}

/**
 * Get top users by weekly XP
 */
export async function getTopWeekly(count: number = 10): Promise<LeaderboardEntry[]> {
    try {
        const weekStart = getWeekStart();
        console.log('[Leaderboard] Fetching weekly rankings for week:', weekStart);
        
        const q = query(
            collection(db, LEADERBOARD_COLLECTION),
            where('weekResetAt', '==', weekStart),
            orderBy('weeklyXp', 'desc'),
            limit(count)
        );
        
        const snapshot = await getDocs(q);
        const currentUserId = localStorage.getItem('gesu.userId');
        
        console.log(`[Leaderboard] Weekly: Found ${snapshot.docs.length} entries for this week`);
        
        // If no entries for this week, show all entries without week filter
        if (snapshot.docs.length === 0) {
            console.log('[Leaderboard] No weekly entries, falling back to all entries');
            const fallbackQuery = query(
                collection(db, LEADERBOARD_COLLECTION),
                orderBy('xp', 'desc'),
                limit(count)
            );
            const fallbackSnapshot = await getDocs(fallbackQuery);
            return fallbackSnapshot.docs.map((doc, index) => ({
                rank: index + 1,
                userId: doc.id,
                displayName: doc.data().displayName || 'User',
                avatarUrl: doc.data().avatarUrl,
                level: doc.data().level || 1,
                xp: doc.data().xp || 0,
                weeklyXp: doc.data().weeklyXp || 0,
                streak: doc.data().streak || 0,
                isCurrentUser: doc.id === currentUserId,
                isAnonymous: doc.data().isAnonymous || false,
            }));
        }
        
        return snapshot.docs.map((doc, index) => ({
            rank: index + 1,
            userId: doc.id,
            displayName: doc.data().displayName || 'User',
            avatarUrl: doc.data().avatarUrl,
            level: doc.data().level || 1,
            xp: doc.data().xp || 0,
            weeklyXp: doc.data().weeklyXp || 0,
            streak: doc.data().streak || 0,
            isCurrentUser: doc.id === currentUserId,
            isAnonymous: doc.data().isAnonymous || false,
        }));
    } catch (err: any) {
        console.error('[Leaderboard] Failed to get weekly rankings:', err);
        // If this is an index error, provide helpful message
        if (err?.message?.includes('index')) {
            console.warn('[Leaderboard] You may need to create a Firestore composite index for this query');
        }
        return [];
    }
}

/**
 * Get current user's rank
 */
export async function getUserRank(userId: string): Promise<{ allTime: number; weekly: number } | null> {
    if (!userId) return null;
    
    try {
        const docSnap = await getDoc(getLeaderboardDocRef(userId));
        if (!docSnap.exists()) return null;
        
        const userData = docSnap.data();
        
        // Count users with higher XP
        const allTimeQuery = query(
            collection(db, LEADERBOARD_COLLECTION),
            where('xp', '>', userData.xp)
        );
        const allTimeSnap = await getDocs(allTimeQuery);
        
        // Count users with higher weekly XP
        const weeklyQuery = query(
            collection(db, LEADERBOARD_COLLECTION),
            where('weekResetAt', '==', getWeekStart()),
            where('weeklyXp', '>', userData.weeklyXp || 0)
        );
        const weeklySnap = await getDocs(weeklyQuery);
        
        return {
            allTime: allTimeSnap.size + 1,
            weekly: weeklySnap.size + 1,
        };
    } catch (err) {
        console.error('[Leaderboard] Failed to get user rank:', err);
        return null;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get the start of the current week (Monday 00:00:00 UTC)
 */
function getWeekStart(): string {
    const now = new Date();
    const day = now.getUTCDay();
    const diff = now.getUTCDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setUTCDate(diff));
    monday.setUTCHours(0, 0, 0, 0);
    return monday.toISOString().split('T')[0];
}
