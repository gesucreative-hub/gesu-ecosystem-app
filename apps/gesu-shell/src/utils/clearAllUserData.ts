/**
 * clearAllUserData - Clears all user-specific localStorage data on sign-out
 * 
 * Called during sign-out to ensure no previous user data remains.
 * This provides account data isolation without requiring user-scoped storage keys.
 */

// All localStorage keys that should be cleared on sign-out
const USER_DATA_KEYS = [
    // Business Toolkit Stores
    'gesu-clients',
    'gesu-invoices', 
    'gesu-contracts',
    'gesu-projects',
    'gesu-service-catalog',
    'gesu-deliverable-packs',
    'gesu-deliverable-templates',
    'gesu-payments',
    'gesu-business-profile',
    'gesu-projecthub-tasks',
    
    // Personal Toolkit Stores
    'gesu-second-brain',
    'gesu-compass-snapshots',
    'gesu-focus-timer',
    'gesu-finish-mode',
    'gesu-daily-checkin',
    'gesu-workflow-progress',
    'gesu-media-queue',
    
    // Settings & Preferences (per user request)
    'gesu-global-settings',
    'gesu-active-persona',
    'gesu.theme',
    'gesu.sidebarCollapsed',
    'gesu.userId',
    
    // Gamification (local cache - cloud is source of truth)
    'gesu-gamification',
];

/**
 * Clears all user-specific data from localStorage
 * Call this on sign-out to ensure data isolation between accounts
 */
export function clearAllUserData(): void {
    console.log('[clearAllUserData] Clearing all user data from localStorage...');
    
    let clearedCount = 0;
    
    for (const key of USER_DATA_KEYS) {
        if (localStorage.getItem(key) !== null) {
            localStorage.removeItem(key);
            clearedCount++;
            console.log(`[clearAllUserData] Cleared: ${key}`);
        }
    }
    
    // Also clear any user-scoped gamification keys (gesu-gamification-{userId})
    const allKeys = Object.keys(localStorage);
    for (const key of allKeys) {
        if (key.startsWith('gesu-gamification-')) {
            localStorage.removeItem(key);
            clearedCount++;
            console.log(`[clearAllUserData] Cleared user-scoped: ${key}`);
        }
    }
    
    console.log(`[clearAllUserData] Cleared ${clearedCount} keys total`);
}

/**
 * Gets a list of all user data keys that currently have data
 * Useful for debugging/verification
 */
export function getUserDataKeys(): string[] {
    return USER_DATA_KEYS.filter(key => localStorage.getItem(key) !== null);
}
