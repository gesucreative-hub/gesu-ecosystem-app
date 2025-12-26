/**
 * User Settings Service
 * Manages user-specific settings (separate from global app settings)
 * Each user has their own settings.json in users/{userId}/settings.json
 */

export interface UserSettings {
    // Compass defaults
    focusAreas: {
        Money: number;
        Creative: number;
        Relations: number;
        Learning: number;
        Content: number;
        'Self Care': number;
    };
    energy: number;
    lastCalibration: string | null;
}

/**
 * Create default settings for a brand new user
 */
export function createDefaultUserSettings(): UserSettings {
    return {
        focusAreas: {
            Money: 5,
            Creative: 5,
            Relations: 5,
            Learning: 5,
            Content: 5,
            'Self Care': 5
        },
        energy: 5,
        lastCalibration: null
    };
}

/**
 * Load user settings from workspace
 */
export async function loadUserSettings(): Promise<UserSettings> {
    if (!window.gesu?.userSettings?.read) {
        console.warn('[userSettingsService] No IPC bridge available, using defaults');
        return createDefaultUserSettings();
    }

    try {
        const settings = await window.gesu.userSettings.read();
        return settings || createDefaultUserSettings();
    } catch (err) {
        console.error('[userSettingsService] Failed to load settings:', err);
        return createDefaultUserSettings();
    }
}

/**
 * Save user settings to workspace
 */
export async function saveUserSettings(settings: UserSettings): Promise<boolean> {
    if (!window.gesu?.userSettings?.write) {
        console.warn('[userSettingsService] No IPC bridge available');
        return false;
    }

    try {
        await window.gesu.userSettings.write(settings);
        return true;
    } catch (err) {
        console.error('[userSettingsService] Failed to save settings:', err);
        return false;
    }
}
