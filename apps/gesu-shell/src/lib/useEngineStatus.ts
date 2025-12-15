// React hook for consuming engine status store
import { useState, useEffect, useCallback } from 'react';
import {
    getEngineStatusState,
    subscribe,
    refreshEngineStatus,
    EngineStatusState,
    getLastCheckedLabel,
} from '../stores/engineStatusStore';

export function useEngineStatus() {
    const [state, setState] = useState<EngineStatusState>(getEngineStatusState);

    useEffect(() => {
        // Subscribe to store updates
        const unsubscribe = subscribe(() => {
            setState(getEngineStatusState());
        });
        return unsubscribe;
    }, []);

    const refresh = useCallback(() => {
        refreshEngineStatus();
    }, []);

    const lastCheckedLabel = getLastCheckedLabel();

    return {
        engines: state.engines,
        lastCheckedAt: state.lastCheckedAt,
        isRefreshing: state.isRefreshing,
        lastCheckedLabel,
        refresh,
    };
}
