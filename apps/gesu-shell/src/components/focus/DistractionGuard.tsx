// Distraction Guard - Prompts when user tries to navigate during active focus session
// Uses beforeunload for page close and provides context for Link components

import { useEffect } from 'react';
import { isSessionActive } from '../../stores/focusTimerStore';

interface DistractionGuardProps {
    children: React.ReactNode;
}

export function DistractionGuard({ children }: DistractionGuardProps) {
    // Handle browser/tab close during active session
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isSessionActive()) {
                e.preventDefault();
                e.returnValue = 'Focus session is active. Are you sure you want to leave?';
                return e.returnValue;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);

    // Note: For in-app navigation blocking, we would need to use a data router
    // (createBrowserRouter) or wrap navigation components. For now, we handle
    // browser close/refresh and rely on the timer pill visibility to remind
    // users of active sessions.

    return <>{children}</>;
}
