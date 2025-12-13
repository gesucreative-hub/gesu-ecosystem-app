import { useState, useEffect, useCallback } from 'react';
import { GesuSettings } from '../types/settings';



export function useGesuSettings() {
    const [settings, setSettings] = useState<GesuSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadSettings = useCallback(async () => {
        if (!window.gesu?.settings) {
            setError('Bridge not available');
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const loaded = await window.gesu.settings.read();
            setSettings(loaded);
            setError(null);
        } catch (err) {
            console.error('[useGesuSettings] Load Error:', err);
            setError(err instanceof Error ? err.message : 'Unknown load error');
        } finally {
            setLoading(false);
        }
    }, []);

    const saveSettings = useCallback(async (newSettings: GesuSettings) => {
        if (!window.gesu?.settings) {
            console.warn('Bridge not available (mock save)');
            return;
        }
        try {
            await window.gesu.settings.write(newSettings);
            // We assume the backend emits 'changed' event which updates us, 
            // but we can opt. update locally if needed. 
            // The IPC event is safer for consistency.
        } catch (err) {
            console.error('[useGesuSettings] Save Error:', err);
            throw err;
        }
    }, []);

    useEffect(() => {
        loadSettings();

        if (window.gesu?.settings?.onSettingsChanged) {
            const unsubscribe = window.gesu.settings.onSettingsChanged((newSettings) => {
                console.log('[useGesuSettings] Received external update:', newSettings);
                setSettings(newSettings);
            });
            return unsubscribe;
        }
    }, [loadSettings]);

    return {
        settings,
        loading,
        error,
        refresh: loadSettings,
        saveSettings
    };
}
