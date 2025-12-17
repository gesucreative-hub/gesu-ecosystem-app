// Focus Timer Pill - Compact global timer indicator
// Shows when session is active, opens panel on click

import { useState } from 'react';
import { Timer, Pause, Play } from 'lucide-react';
import { useFocusTimer } from '../../hooks/useFocusTimer';
import { FocusTimerPanel } from './FocusTimerPanel';

export function FocusTimerPill() {
    const { state, pause, resume } = useFocusTimer();
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    const minutes = Math.floor(state.remainingSeconds / 60);
    const seconds = state.remainingSeconds % 60;
    const timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    const phaseColors = {
        focus: 'bg-emerald-500/20 text-emerald-600 dark:bg-emerald-500/30 dark:text-emerald-400',
        shortBreak: 'bg-cyan-500/20 text-cyan-600 dark:bg-cyan-500/30 dark:text-cyan-400',
        longBreak: 'bg-purple-500/20 text-purple-600 dark:bg-purple-500/30 dark:text-purple-400',
        idle: 'bg-gray-500/20 text-gray-600 dark:bg-gray-500/30 dark:text-gray-400',
    };

    const phaseLabels = {
        focus: 'Focus',
        shortBreak: 'Short Break',
        longBreak: 'Long Break',
        idle: 'Idle',
    };

    const colorClass = phaseColors[state.phase];

    // Always show a timer button - full pill when active, icon only when idle
    return (
        <>
            <div className="flex items-center gap-2">
                {state.sessionActive ? (
                    <>
                        {/* Active Session - Full Pill */}
                        <button
                            onClick={() => setIsPanelOpen(true)}
                            className={`
                                group/timer flex items-center gap-2 px-3 py-1.5 rounded-full
                                border border-tokens-border
                                ${colorClass}
                                hover:shadow-md hover:scale-105
                                transition-all duration-200
                                text-xs font-medium
                            `}
                            title={`${phaseLabels[state.phase]} - Click to open timer`}
                        >
                            <span className="flex items-center gap-1.5">
                                {state.isRunning && !state.isPaused ? (
                                    <Timer size={14} className="animate-pulse" />
                                ) : (
                                    <Pause size={14} />
                                )}
                                <span className="font-mono font-bold">{timeDisplay}</span>
                            </span>
                            {state.taskContext ? (
                                <span className="opacity-90 group-hover/timer:opacity-100 transition-opacity max-w-[320px] truncate" title={state.taskContext.taskTitle}>
                                    {state.taskContext.taskTitle}
                                </span>
                            ) : (
                                <span className="opacity-70 group-hover/timer:opacity-100 transition-opacity">
                                    {phaseLabels[state.phase]}
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
                            className="p-1.5 rounded-full hover:bg-tokens-panel2 border border-tokens-border transition-colors"
                            title={state.isPaused ? 'Resume' : 'Pause'}
                        >
                            {state.isPaused ? <Play size={14} /> : <Pause size={14} />}
                        </button>
                    </>
                ) : (
                    /* Idle - Just Timer Icon Button */
                    <button
                        onClick={() => setIsPanelOpen(true)}
                        className="p-2 rounded-full hover:bg-tokens-panel2 border border-tokens-border text-tokens-muted hover:text-tokens-fg transition-all"
                        title="Open Focus Timer"
                    >
                        <Timer size={18} />
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
