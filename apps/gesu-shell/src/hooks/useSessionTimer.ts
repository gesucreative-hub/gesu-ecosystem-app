import { useState, useEffect } from 'react';

/**
 * Hook to track elapsed time for an active session
 * @param startTime ISO timestamp string, number, or null
 * @returns Formatted time string (MM:SS) that updates every second
 */
export function useSessionTimer(startTime: string | number | null | undefined): string {
    const [elapsed, setElapsed] = useState<string>('00:00');

    useEffect(() => {
        if (!startTime) {
            setElapsed('00:00');
            return;
        }

        const tick = () => {
            const start = new Date(startTime).getTime();
            const now = new Date().getTime();
            const diff = Math.max(0, Math.floor((now - start) / 1000));

            const minutes = Math.floor(diff / 60);
            const seconds = diff % 60;

            setElapsed(
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            );
        };

        tick(); // Initial tick
        const interval = setInterval(tick, 1000);

        return () => clearInterval(interval);
    }, [startTime]);

    return elapsed;
}
