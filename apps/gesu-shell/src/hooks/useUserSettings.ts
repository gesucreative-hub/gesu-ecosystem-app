/**
 * useUserSettings Hook
 * Loads and manages user-specific settings from file system
 */

import { useState, useEffect } from 'react';
import type { UserSettings } from '../services/userSettingsService';
import {
    loadUserSettings,
    saveUserSettings,
    createDefaultUserSettings
} from '../services/userSettingsService';

export function useUserSettings() {
    const [settings, setSettings] = useState<UserSettings | null>(null);
    const [loading, setLoading] = useState(true);

    // Load settings on mount
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const loaded = await loadUserSettings();
            setSettings(loaded);
            setLoading(false);
        };
        load();
    }, []);

    // Save settings helper
    const updateSettings = async (newSettings: Partial<UserSettings>) => {
        const updated = { ...(settings || createDefaultUserSettings()), ...newSettings };
        setSettings(updated);
        await saveUserSettings(updated);
    };

    return {
        settings,
        loading,
        updateSettings
    };
}
