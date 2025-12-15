import { useState, useEffect, useCallback } from 'react';
import {
    GesuSettings,
    loadSettings as loadFromLocalStorage,
    saveSettings as saveToLocalStorage
} from '../stores/settingsStore';

export function useGesuSettings() {
    const [settings, setSettings] = useState<GesuSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadSettingsFromStore = useCallback(async () => {
        try {
            setLoading(true);

            // Prioritize window.gesu.settings (file-backed) when available
            if (window.gesu?.settings?.read) {
                const loaded = await window.gesu.settings.read();
                setSettings(loaded);
            } else {
                // Fallback to localStorage for web dev
                const loaded = loadFromLocalStorage();
                setSettings(loaded);
            }

            setError(null);
        } catch (err) {
            console.error('[useGesuSettings] Load Error:', err);
            setError(err instanceof Error ? err.message : 'Unknown load error');
        } finally {
            setLoading(false);
        }
    }, []);

    const saveSettingsToStore = useCallback(async (newSettings: GesuSettings) => {
        try {
            // Prioritize window.gesu.settings (file-backed) when available
            if (window.gesu?.settings?.write) {
                const saved = await window.gesu.settings.write(newSettings);
                setSettings(saved);
            } else {
                // Fallback to localStorage for web dev
                const success = saveToLocalStorage(newSettings);
                if (success) {
                    setSettings(newSettings);
                } else {
                    throw new Error('Failed to persist settings');
                }
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
