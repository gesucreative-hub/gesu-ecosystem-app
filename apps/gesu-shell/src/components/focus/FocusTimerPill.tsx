// Focus Timer Pill - Compact global timer indicator with premium styling
// The ONE timer for the entire Gesu Ecosystem app

import { useState } from 'react';
import { Timer, Pause, Play, Zap } from 'lucide-react';
import { useFocusTimer } from '../../hooks/useFocusTimer';
import { FocusTimerPanel } from './FocusTimerPanel';
import { useTranslation } from 'react-i18next';

export function FocusTimerPill() {
    const { t } = useTranslation(['dashboard', 'common']);
    const { state, pause, resume } = useFocusTimer();
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    const minutes = Math.floor(state.remainingSeconds / 60);
    const seconds = state.remainingSeconds % 60;
    const timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Premium phase-specific styling
    const phaseStyles = {
        focus: {
            bg: 'bg-gradient-to-r from-tokens-brand-DEFAULT/20 to-tokens-brand-DEFAULT/10',
            border: 'border-tokens-brand-DEFAULT/40',
            text: 'text-tokens-brand-DEFAULT',
            glow: 'shadow-[0_0_15px_rgba(var(--brand-rgb),0.2)]',
            icon: <Zap size={14} className="animate-pulse" />,
        },
        shortBreak: {
            bg: 'bg-gradient-to-r from-emerald-500/20 to-emerald-500/10',
            border: 'border-emerald-500/40',
            text: 'text-emerald-500',
            glow: 'shadow-[0_0_15px_rgba(16,185,129,0.2)]',
            icon: <Timer size={14} />,
        },
        longBreak: {
            bg: 'bg-gradient-to-r from-violet-500/20 to-violet-500/10',
            border: 'border-violet-500/40',
            text: 'text-violet-500',
            glow: 'shadow-[0_0_15px_rgba(139,92,246,0.2)]',
            icon: <Timer size={14} />,
        },
        idle: {
            bg: 'bg-tokens-bg-secondary',
            border: 'border-tokens-border',
            text: 'text-tokens-muted',
            glow: '',
            icon: <Timer size={14} />,
        },
    };

    const phaseLabels = {
        focus: t('dashboard:focusPill.focusing', 'Focusing'),
        shortBreak: t('dashboard:focusPill.break', 'Break'),
        longBreak: t('dashboard:focusPill.longBreak', 'Long Break'),
        idle: t('dashboard:focusPill.idle', 'Idle'),
    };

    const style = phaseStyles[state.phase];
    const isBreak = state.phase === 'shortBreak' || state.phase === 'longBreak';

    return (
        <>
            <div className="flex items-center gap-2">
                {state.sessionActive ? (
                    <>
                        {/* Active Session - Premium Pill */}
                        <button
                            onClick={() => setIsPanelOpen(true)}
                            className={`
                                group/timer flex items-center gap-2 px-3 py-1.5 rounded-full
                                border ${style.border} ${style.bg} ${style.glow}
                                hover:scale-105 active:scale-100
                                transition-all duration-200
                                text-xs font-medium
                            `}
                            title={t('dashboard:tooltips.focusTimerPill', `${phaseLabels[state.phase]} - Click to open timer`)}
                        >
                            {/* Phase indicator dot */}
                            <span className={`w-2 h-2 rounded-full ${!state.isPaused ? 'animate-pulse' : ''}`} style={isBreak ? { backgroundColor: 'var(--brand)' } : { backgroundColor: 'var(--brand)' }} />

                            {/* Time */}
                            <span className={`font-mono font-bold ${style.text}`}>
                                {timeDisplay}
                            </span>

                            {/* Phase label or task title */}
                            <span className={`text-tokens-muted group-hover/timer:text-tokens-fg transition-colors max-w-[200px] truncate`}>
                                {state.taskContext ? state.taskContext.taskTitle : phaseLabels[state.phase]}
                            </span>

                            {/* Cycle count badge */}
                            {state.cycleCount > 0 && (
                                <span className="px-1.5 py-0.5 rounded bg-tokens-bg-secondary text-tokens-muted text-[10px] font-medium">
                                    ×{state.cycleCount}
                                </span>
                            )}
                        </button>

                        {/* Quick pause/resume */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (state.isPaused) {
                                    resume();
                                } else {
                                    pause();
                                }
                            }}
                            className={`
                                p-1.5 rounded-full border transition-all
                                ${state.isPaused
                                    ? 'bg-tokens-brand-DEFAULT/20 border-tokens-brand-DEFAULT/40 text-tokens-brand-DEFAULT hover:bg-tokens-brand-DEFAULT/30'
                                    : 'hover:bg-tokens-panel2 border-tokens-border text-tokens-muted hover:text-tokens-fg'
                                }
                            `}
                            title={t('dashboard:tooltips.pauseResumeTimer', state.isPaused ? 'Resume' : 'Pause')}
                        >
                            {state.isPaused ? <Play size={14} /> : <Pause size={14} />}
                        </button>
                    </>
                ) : (
                    /* Idle - Premium Timer Icon Button */
                    <button
                        onClick={() => setIsPanelOpen(true)}
                        className="
                            group p-2 rounded-full 
                            bg-tokens-bg-secondary hover:bg-tokens-brand-DEFAULT/10
                            border border-tokens-border hover:border-tokens-brand-DEFAULT/40
                            text-tokens-muted hover:text-tokens-brand-DEFAULT 
                            transition-all duration-200
                        "
                        title={t('dashboard:tooltips.startTimer', 'Start Focus Timer')}
                    >
                        <Timer size={18} className="group-hover:scale-110 transition-transform" />
                    </button>
                )}
            </div>

            {/* Panel */}
            {isPanelOpen && (
                <FocusTimerPanel
                    isOpen={isPanelOpen}
                    onClose={() => setIsPanelOpen(false)}
                />
            )}
        </>
    );
}
