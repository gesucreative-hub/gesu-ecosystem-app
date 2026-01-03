/**
 * getUserStorageKey - Returns a user-scoped localStorage key
 * 
 * Usage: Instead of hardcoding 'gesu-clients', use getUserStorageKey('gesu-clients')
 * This ensures each user has their own isolated data storage.
 * 
 * @param baseKey - The base localStorage key (e.g., 'gesu-clients')
 * @returns User-scoped key (e.g., 'gesu-clients-abc123' or 'gesu-clients-guest')
 */
export function getUserStorageKey(baseKey: string): string {
    const userId = localStorage.getItem('gesu.userId');
    return userId ? `${baseKey}-${userId}` : `${baseKey}-guest`;
}

/**
 * Gets the current user ID from localStorage
 * Returns null if no user is logged in
 */
export function getCurrentUserId(): string | null {
    return localStorage.getItem('gesu.userId');
}
