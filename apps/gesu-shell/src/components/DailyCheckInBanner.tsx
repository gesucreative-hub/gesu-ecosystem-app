/**
 * Daily Check-in Banner
 * Non-blocking prompt shown on app launch if no check-in exists for today
 * Hidden when focus session is active
 * S1-2a: Entry point for daily check-in flow
 * S1-3b: Fixed to check isComplete field (minimal vs full check-in)
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sunrise, X } from 'lucide-react';
import { getTodayCheckIn, subscribe } from '../stores/dailyCheckInStore';
import { isSessionActive, subscribe as subscribeFocusTimer } from '../stores/focusTimerStore';
import { DailyCheckInModal } from './DailyCheckInModal';

export function DailyCheckInBanner() {
    const { t } = useTranslation('common');
    const [showBanner, setShowBanner] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const [focusActive, setFocusActive] = useState(isSessionActive());

    // S1-3b: Subscribe to focus timer for reactive focusActive state
    useEffect(() => {
        const unsubscribe = subscribeFocusTimer(() => {
            setFocusActive(isSessionActive());
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        const checkShouldShow = () => {
            const today = getTodayCheckIn();
            const hasCompletedCheckIn = today !== null && today.isComplete === true;
            const shouldShow = !hasCompletedCheckIn && !focusActive && !dismissed;

            // S1-3b: Dev diagnostic
            if (import.meta.env.DEV) {
                console.log('[DailyCheckInBanner] Show logic:', {
                    recordExists: today !== null,
                    isComplete: today?.isComplete,
                    focusActive,
                    dismissed,
                    shouldShow,
                    reason: !shouldShow
                        ? (focusActive ? 'focus active' : dismissed ? 'dismissed' : 'completed')
                        : 'no completed check-in'
                });
            }

            setShowBanner(shouldShow);
        };

        checkShouldShow();

        // Subscribe to check-in updates
        const unsubCheckIn = subscribe(checkShouldShow);

        return unsubCheckIn;
    }, [dismissed, focusActive]); // S1-3b: focusActive in deps

    const handleDismiss = () => {
        setDismissed(true);
        setShowBanner(false);
    };

    const handleOpenModal = () => {
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setShowBanner(false); // Hide banner after saving (getTodayCheckIn will be non-null)
    };

    if (!showBanner) return null;

    return (
        <>
            <div className="mx-6 mb-4">
                <div
                    className="bg-gradient-to-r from-brand/10 to-purple-500/10 border border-brand/30 rounded-lg overflow-hidden cursor-pointer hover:border-brand/50 transition-colors"
                    onClick={handleOpenModal}
                >
                    <div className="flex items-center gap-3 px-4 py-3">
                        <div className="p-2 bg-brand/20 rounded-lg shrink-0">
                            <Sunrise size={20} className="text-brand" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-tokens-fg">
                                {t('dailyCheckIn.bannerTitle', 'Quick check-in: How are you today?')}
                            </p>
                            <p className="text-xs text-tokens-muted">
                                {t('dailyCheckIn.bannerHint', 'Energy · Why · Top Focus · <60s')}
                            </p>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDismiss();
                            }}
                            className="p-1 rounded-lg hover:bg-tokens-panel transition-colors shrink-0"
                            aria-label="Dismiss"
                        >
                            <X size={16} className="text-tokens-muted" />
                        </button>
                    </div>
                </div>
            </div>

            {showModal && <DailyCheckInModal onClose={handleCloseModal} />}
        </>
    );
}
