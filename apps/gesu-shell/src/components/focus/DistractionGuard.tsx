// Distraction Guard - Prompts when user tries to navigate during active focus session
// Handles both browser close (beforeunload) and in-app navigation
// S1-1: Added route-specific policies (blocked/allowed/prompt)

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { isSessionActive, pause, stop } from '../../stores/focusTimerStore';
import { getRoutePolicy } from '../../config/guardrails';
import { DistractionModal } from './DistractionModal';
import { BlockedRouteToast } from './BlockedRouteToast';

interface DistractionGuardProps {
    children: React.ReactNode;
}

export function DistractionGuard({ children }: DistractionGuardProps) {
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    const [pendingPath, setPendingPath] = useState<string | null>(null);
    const [blockedPath, setBlockedPath] = useState<string | null>(null);

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
                const href = link.getAttribute('href')!;
                
                // Skip if already on the same path
                if (window.location.pathname === href) return;

                // Check route policy
                const policy = getRoutePolicy(href);

                if (policy === 'allowed') {
                    // Allow navigation silently - don't prevent default
                    return;
                }

                if (policy === 'blocked') {
                    // Block navigation entirely, show toast
                    e.preventDefault();
                    e.stopPropagation();
                    setBlockedPath(href);
                    // Auto-hide toast after 3 seconds
                    setTimeout(() => setBlockedPath(null), 3000);
                    return;
                }

                // policy === 'prompt': Show modal with Pause/End/Continue options
                e.preventDefault();
                e.stopPropagation();
                setPendingPath(href);
                setShowModal(true);
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

    const handleDismissModal = useCallback(() => {
        // User cancelled, stay on current page
        setShowModal(false);
        setPendingPath(null);
    }, []);

    // Handle ESC key - dismiss without navigating
    useEffect(() => {
        if (!showModal) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleDismissModal();
            }
        };

        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [showModal, handleDismissModal]);

    return (
        <>
            {children}
            {blockedPath && <BlockedRouteToast path={blockedPath} />}
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

