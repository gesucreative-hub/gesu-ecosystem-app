import { useState, useEffect, useCallback } from 'react';
import {
    GesuSettings,
    loadSettings,
    saveSettings as persistSettings
} from '../stores/settingsStore';

export function useGesuSettings() {
    const [settings, setSettings] = useState<GesuSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadSettingsFromStore = useCallback(() => {
        try {
            setLoading(true);
            const loaded = loadSettings();
            setSettings(loaded);
            setError(null);
        } catch (err) {
            console.error('[useGesuSettings] Load Error:', err);
            setError(err instanceof Error ? err.message : 'Unknown load error');
        } finally {
            setLoading(false);
        }
    }, []);

    const saveSettingsToStore = useCallback((newSettings: GesuSettings) => {
        try {
            const success = persistSettings(newSettings);
            if (success) {
                setSettings(newSettings);
            } else {
                throw new Error('Failed to persist settings');
            }
        } catch (err) {
            console.error('[useGesuSettings] Save Error:', err);
            throw err;
        }
    }, []);

    useEffect(() => {
        loadSettingsFromStore();
    }, [loadSettingsFromStore]);

    return {
        settings,
        loading,
        error,
        refresh: loadSettingsFromStore,
        saveSettings: saveSettingsToStore
    };
}
