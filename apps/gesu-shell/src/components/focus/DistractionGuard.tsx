// Distraction Guard - Prompts when user tries to navigate during active focus session
// Handles both browser close (beforeunload) and in-app navigation

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { isSessionActive, pause, stop } from '../../stores/focusTimerStore';
import { DistractionModal } from './DistractionModal';

interface DistractionGuardProps {
    children: React.ReactNode;
}

export function DistractionGuard({ children }: DistractionGuardProps) {
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    const [pendingPath, setPendingPath] = useState<string | null>(null);

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

    // Intercept Link clicks globally when session is active
    useEffect(() => {
        const handleLinkClick = (e: MouseEvent) => {
            if (!isSessionActive()) return;

            const target = e.target as HTMLElement;
            const link = target.closest('a[href]');

            if (link && link.getAttribute('href')?.startsWith('/')) {
                e.preventDefault();
                e.stopPropagation();
                const href = link.getAttribute('href');
                if (href && window.location.pathname !== href) {
                    setPendingPath(href);
                    setShowModal(true);
                }
            }
        };

        document.addEventListener('click', handleLinkClick, true);
        return () => document.removeEventListener('click', handleLinkClick, true);
    }, []);

    const handlePause = useCallback(() => {
        pause();
        setShowModal(false);
        if (pendingPath) {
            navigate(pendingPath);
            setPendingPath(null);
        }
    }, [navigate, pendingPath]);

    const handleEnd = useCallback(() => {
        stop();
        setShowModal(false);
        if (pendingPath) {
            navigate(pendingPath);
            setPendingPath(null);
        }
    }, [navigate, pendingPath]);

    const handleContinue = useCallback(() => {
        // Don't change timer state, just proceed
        setShowModal(false);
        if (pendingPath) {
            navigate(pendingPath);
            setPendingPath(null);
        }
    }, [navigate, pendingPath]);

    // Handle ESC key
    useEffect(() => {
        if (!showModal) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleContinue();
            }
        };

        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [showModal, handleContinue]);

    return (
        <>
            {children}
            {showModal && (
                <DistractionModal
                    onPause={handlePause}
                    onEnd={handleEnd}
                    onContinue={handleContinue}
                />
            )}
        </>
    );
}
