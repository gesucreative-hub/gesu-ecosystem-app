// React hook for consuming focus timer store

import { useState, useEffect } from 'react';
import * as timerStore from '../stores/focusTimerStore';
import type { FocusTimerState } from '../stores/focusTimerStore';

export function useFocusTimer() {
    const [state, setState] = useState<FocusTimerState>(timerStore.getState());

    useEffect(() => {
        const unsubscribe = timerStore.subscribe(() => {
            setState(timerStore.getState());
        });

        return unsubscribe;
    }, []);

    return {
        state,
        start: timerStore.start,
        pause: timerStore.pause,
        resume: timerStore.resume,
        skip: timerStore.skip,
        stop: timerStore.stop,
        setConfig: timerStore.setConfig,
        isSessionActive: timerStore.isSessionActive,
    };
}
