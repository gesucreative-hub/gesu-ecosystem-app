// Focus Timer Panel - Premium control panel rendered as Portal for correct z-index
// THE focus timer for the entire Gesu Ecosystem

import { X, Play, Pause, SkipForward, Square, Settings, Target } from 'lucide-react';
import { useFocusTimer } from '../../hooks/useFocusTimer';
import { Button } from '../Button';
import { ConfirmDialog } from '../ConfirmDialog';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import { setSessionGoal } from '../../stores/focusTimerStore';

interface FocusTimerPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

// Break activity suggestions - IDs for i18n
const BREAK_ACTIVITIES = [
    { id: 'water', emoji: '💧' },
    { id: 'breathe', emoji: '🧘' },
    { id: 'lookFar', emoji: '👀' },
    { id: 'walk', emoji: '🚶' },
    { id: 'stretch', emoji: '🙆' },
    { id: 'window', emoji: '🪟' },
];

function getRandomBreakActivities(count: number = 3) {
    const shuffled = [...BREAK_ACTIVITIES].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

// Circular Progress Ring
function CircularProgress({
    progress,
    size = 140,
    strokeWidth = 8,
    phase
}: {
    progress: number;
    size?: number;
    strokeWidth?: number;
    phase: 'focus' | 'shortBreak' | 'longBreak' | 'idle';
}) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    const colors = {
        focus: 'var(--brand)',
        shortBreak: '#10b981',
        longBreak: '#8b5cf6',
        idle: 'var(--muted)'
    };

    return (
        <svg width={size} height={size} className="transform -rotate-90">
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className="text-tokens-border opacity-30"
            />
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={colors[phase]}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="transition-all duration-1000 ease-linear"
            />
        </svg>
    );
}

// Celebration Component
function CelebrationOverlay({ show, cycleCount }: { show: boolean; cycleCount: number }) {
    if (!show) return null;

    return (
        <div className="absolute inset-0 flex items-center justify-center bg-tokens-panel/95 backdrop-blur-sm rounded-2xl z-10 animate-in fade-in zoom-in-95 duration-300">
            <div className="text-center p-6">
                <div className="text-5xl mb-4">🎉</div>
                <h3 className="text-xl font-bold text-tokens-fg mb-2">
                    {cycleCount === 1 ? 'First Cycle!' : `${cycleCount} Cycles!`}
                </h3>
                <p className="text-sm text-tokens-muted">Great focus! Time for a break.</p>
            </div>
        </div>
    );
}

export function FocusTimerPanel({ isOpen, onClose }: FocusTimerPanelProps) {
    const { t } = useTranslation(['focus', 'common']);
    const navigate = useNavigate();
    const { state, start, pause, resume, skip, stop, setConfig } = useFocusTimer();
    const [showConfig, setShowConfig] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);
    const [lastCycleCount, setLastCycleCount] = useState(state.cycleCount);
    const [autoStart, setAutoStart] = useState(false);
    const [goalInput, setGoalInput] = useState(state.sessionGoal || '');

    const [localConfig, setLocalConfig] = useState({
        focusMinutes: state.config.focusMinutes,
        shortBreakMinutes: state.config.shortBreakMinutes,
        longBreakMinutes: state.config.longBreakMinutes,
    });

    const breakActivities = useMemo(() => getRandomBreakActivities(3), [state.phase]);

    useEffect(() => {
        if (state.cycleCount > lastCycleCount && state.phase !== 'focus') {
            setShowCelebration(true);
            setLastCycleCount(state.cycleCount);
            const timer = setTimeout(() => setShowCelebration(false), 2500);
            return () => clearTimeout(timer);
        }
    }, [state.cycleCount, state.phase, lastCycleCount]);

    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        type?: 'confirm' | 'warning' | 'danger';
    }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

    if (!isOpen) return null;

    const minutes = Math.floor(state.remainingSeconds / 60);
    const seconds = state.remainingSeconds % 60;
    const progress = state.totalSeconds > 0
        ? ((state.totalSeconds - state.remainingSeconds) / state.totalSeconds) * 100
        : 0;

    const phaseConfig = {
        focus: { label: t('focus:timer.focus').toUpperCase(), color: 'text-tokens-brand-DEFAULT', desc: t('focus:session.active', 'Deep work mode') },
        shortBreak: { label: t('focus:timer.break').toUpperCase(), color: 'text-emerald-500', desc: t('focus:session.takeBreak', 'Quick recharge') },
        longBreak: { label: t('focus:config.longBreakDuration', 'LONG BREAK').toUpperCase(), color: 'text-violet-500', desc: t('focus:session.takeBreak', 'Extended rest') },
        idle: { label: t('focus:timer.start', 'READY').split(' ')[0].toUpperCase(), color: 'text-tokens-muted', desc: t('focus:timer.start', 'Start a focus session') },
    };

    const phase = phaseConfig[state.phase];
    const isBreakPhase = state.phase === 'shortBreak' || state.phase === 'longBreak';

    const handleStart = () => {
        // Save goal if provided
        if (goalInput.trim()) {
            setSessionGoal(goalInput.trim());
        } else {
            setSessionGoal(null);
        }
        start();
    };
    const handleConfigSave = () => { setConfig(localConfig); setShowConfig(false); };
    const handlePreset = (focusMin: number, breakMin: number) => {
        const newConfig = { focusMinutes: focusMin, shortBreakMinutes: breakMin, longBreakMinutes: breakMin * 3 };
        setLocalConfig(newConfig);
        setConfig(newConfig);
    };
    const handleNeedRefocus = () => { onClose(); navigate('/refocus'); };

    // Use portal to render outside any stacking context
    const panelContent = (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
                style={{ zIndex: 100 }}
                onClick={onClose}
            />

            {/* Panel */}
            <div
                className="fixed animate-in fade-in slide-in-from-top-2 duration-200"
                style={{ zIndex: 101, top: '56px', right: '24px', width: '340px' }}
            >
                <div className="bg-tokens-panel border border-tokens-border rounded-2xl shadow-2xl overflow-hidden relative">
                    <CelebrationOverlay show={showCelebration} cycleCount={state.cycleCount} />

                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-tokens-border">
                        <div className="flex items-center gap-2">
                            <h2 className="text-base font-semibold text-tokens-fg">{t('focus:timer.title')}</h2>
                            {state.sessionActive && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wide" style={{ backgroundColor: 'var(--brand-light)', color: 'var(--brand)' }}>
                                    {isBreakPhase ? t('focus:timer.break') : t('focus:timer.focus')}
                                </span>
                            )}
                        </div>
                        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-tokens-bg-secondary text-tokens-muted hover:text-tokens-fg transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-5">
                        {/* Timer */}
                        <div className="flex flex-col items-center">
                            <div className="relative">
                                <CircularProgress progress={progress} size={180} strokeWidth={10} phase={state.phase} />
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <div className={`text-4xl font-bold font-mono tabular-nums ${phase.color}`}>
                                        {minutes}:{seconds.toString().padStart(2, '0')}
                                    </div>
                                    <div className={`text-xs font-medium uppercase tracking-widest mt-1 ${phase.color}`}>
                                        {phase.label}
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-tokens-muted mt-3">{phase.desc}</p>

                            {/* Session Goal Display - During Focus */}
                            {state.sessionActive && state.phase === 'focus' && state.sessionGoal && (
                                <div className="mt-3 p-2.5 rounded-lg bg-tokens-brand-DEFAULT/10 border border-tokens-brand-DEFAULT/20 max-w-full">
                                    <div className="flex items-start gap-2">
                                        <Target size={14} className="text-tokens-brand-DEFAULT mt-0.5 shrink-0" />
                                        <div className="text-xs text-tokens-fg break-words">{state.sessionGoal}</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Break Activities */}
                        {isBreakPhase && state.sessionActive && (
                            <div className="p-3 rounded-xl border border-tokens-brand-DEFAULT/20" style={{ backgroundColor: 'var(--brand-light)' }}>
                                <div className="text-[10px] font-semibold uppercase tracking-wider mb-2 text-tokens-brand-DEFAULT">{t('focus:break.activities', 'Break Activities')}</div>
                                <div className="space-y-1.5">
                                    {breakActivities.map((a, i) => (
                                        <div key={i} className="flex items-center gap-2 text-xs">
                                            <span className="text-sm">{a.emoji}</span>
                                            <span className="text-tokens-fg">{t(`focus:break.activity.${a.id}`, a.id)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Stats */}
                        {state.sessionActive && (
                            <div className="flex justify-center gap-8 text-center">
                                <div>
                                    <div className="text-xl font-bold text-tokens-fg">{state.cycleCount}</div>
                                    <div className="text-[10px] text-tokens-muted uppercase">{t('focus:stats.completed', 'Completed')}</div>
                                </div>
                                <div className="w-px bg-tokens-border" />
                                <div>
                                    <div className="text-xl font-bold text-tokens-fg">
                                        {state.config.longBreakEvery - (state.cycleCount % state.config.longBreakEvery)}
                                    </div>
                                    <div className="text-[10px] text-tokens-muted uppercase">{t('focus:stats.untilLongBreak', 'Until Long Break')}</div>
                                </div>
                            </div>
                        )}

                        {/* Controls */}
                        {!state.sessionActive ? (
                            <div className="space-y-2">
                                {/* Session Goal Input - Optional */}
                                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-tokens-border bg-tokens-bg-secondary focus-within:border-tokens-brand-DEFAULT transition-colors">
                                    <Target size={14} className="text-tokens-muted" />
                                    <input
                                        type="text"
                                        value={goalInput}
                                        onChange={(e) => setGoalInput(e.target.value)}
                                        placeholder={t('focus:goal.placeholder', 'Session goal (optional)')}
                                        className="flex-1 bg-transparent border-none outline-none text-sm text-tokens-fg placeholder:text-tokens-muted"
                                    />
                                </div>
                                <Button variant="primary" fullWidth onClick={handleStart} icon={<Play size={16} />}>
                                    {t('focus:timer.start')}
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                {state.isPaused ? (
                                    <Button variant="primary" fullWidth onClick={resume} icon={<Play size={16} />}>{t('focus:timer.resume')}</Button>
                                ) : (
                                    <Button variant="secondary" fullWidth onClick={pause} icon={<Pause size={16} />}>{t('focus:timer.pause')}</Button>
                                )}
                                <Button variant="ghost" onClick={skip} icon={<SkipForward size={16} />} />
                                <Button
                                    variant="ghost"
                                    onClick={() => setConfirmDialog({
                                        isOpen: true,
                                        title: t('focus:session.endSession', 'End session?'),
                                        message: t('focus:session.progressSaved', 'Your progress will be saved.'),
                                        type: 'warning',
                                        onConfirm: () => { stop(); onClose(); setConfirmDialog({ ...confirmDialog, isOpen: false }); },
                                    })}
                                    icon={<Square size={16} />}
                                />
                            </div>
                        )}

                        {/* Refocus Link */}
                        {isBreakPhase && state.sessionActive && (
                            <button onClick={handleNeedRefocus} className="w-full p-2.5 rounded-lg border border-tokens-border hover:bg-tokens-bg-secondary transition-colors text-center">
                                <div className="text-sm font-medium text-tokens-fg">{t('focus:hints.needRefocus', 'Need to refocus?')}</div>
                                <div className="text-[10px] text-tokens-muted">{t('focus:hints.openRefocus', 'Open the Refocus page →')}</div>
                            </button>
                        )}

                        {/* Auto-start */}
                        {state.sessionActive && (
                            <div className="flex items-center justify-between p-2.5 rounded-lg bg-tokens-bg-secondary">
                                <div>
                                    <div className="text-xs font-medium text-tokens-fg">{t('focus:config.autoStartNext', 'Auto-start next')}</div>
                                    <div className="text-[10px] text-tokens-muted">{t('focus:config.autoStartDesc', 'Begin automatically')}</div>
                                </div>
                                <button
                                    onClick={() => setAutoStart(!autoStart)}
                                    className={`relative w-10 h-5 rounded-full transition-colors ${autoStart ? 'bg-tokens-brand-DEFAULT' : 'bg-tokens-border'}`}
                                >
                                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${autoStart ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                </button>
                            </div>
                        )}

                        {/* Presets */}
                        {!state.sessionActive && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-medium text-tokens-muted uppercase tracking-wide">{t('focus:presets.title', 'Presets')}</span>
                                    <button onClick={() => setShowConfig(!showConfig)} className="text-[10px] text-tokens-muted hover:text-tokens-fg flex items-center gap-1">
                                        <Settings size={10} />
                                        {showConfig ? t('focus:presets.hide', 'Hide') : t('focus:presets.custom', 'Custom')}
                                    </button>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {[{ f: 15, b: 3, key: 'quick' }, { f: 25, b: 5, key: 'classic' }, { f: 50, b: 10, key: 'deep' }].map(p => (
                                        <button key={p.f} onClick={() => handlePreset(p.f, p.b)} className="p-2 rounded-lg border border-tokens-border hover:bg-tokens-bg-secondary text-center transition-colors">
                                            <div className="text-sm font-semibold text-tokens-fg">{p.f}/{p.b}</div>
                                            <div className="text-[10px] text-tokens-muted">{t(`focus:presets.${p.key}`, p.key)}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Config */}
                        {showConfig && !state.sessionActive && (
                            <div className="space-y-3 p-3 bg-tokens-bg-secondary rounded-lg animate-in slide-in-from-top-2 duration-200">
                                {[
                                    { key: 'focusMinutes', labelKey: 'focus:config.focusMin', label: 'Focus (min)', max: 120 },
                                    { key: 'shortBreakMinutes', labelKey: 'focus:config.shortBreak', label: 'Short break', max: 30 },
                                    { key: 'longBreakMinutes', labelKey: 'focus:config.longBreak', label: 'Long break', max: 60 },
                                ].map(f => (
                                    <div key={f.key} className="flex items-center justify-between">
                                        <label className="text-xs text-tokens-fg">{t(f.labelKey, f.label)}</label>
                                        <input
                                            type="number" min="1" max={f.max}
                                            value={localConfig[f.key as keyof typeof localConfig]}
                                            onChange={(e) => setLocalConfig({ ...localConfig, [f.key]: parseInt(e.target.value) || 1 })}
                                            className="w-16 px-2 py-1 bg-tokens-panel border border-tokens-border rounded text-sm text-tokens-fg text-center focus:outline-none focus:ring-1 focus:ring-tokens-brand-DEFAULT/50"
                                        />
                                    </div>
                                ))}
                                <Button variant="secondary" size="sm" fullWidth onClick={handleConfigSave}>{t('common:buttons.apply', 'Apply')}</Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.title}
                message={confirmDialog.message}
                type={confirmDialog.type}
                onConfirm={confirmDialog.onConfirm}
                onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
            />
        </>
    );

    // Render as portal to document.body
    return createPortal(panelContent, document.body);
}
