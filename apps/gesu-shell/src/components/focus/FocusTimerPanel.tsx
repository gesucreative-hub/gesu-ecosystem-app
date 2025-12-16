// Focus Timer Panel - Full control panel for Pomodoro timer
// Shows phase, time, controls, and minimal config

import { X, Play, Pause, SkipForward, StopCircle, Settings } from 'lucide-react';
import { useFocusTimer } from '../../hooks/useFocusTimer';
import { Button } from '../Button';
import { useState } from 'react';

interface FocusTimerPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export function FocusTimerPanel({ isOpen, onClose }: FocusTimerPanelProps) {
    const { state, start, pause, resume, skip, stop, setConfig } = useFocusTimer();
    const [showConfig, setShowConfig] = useState(false);

    const [localConfig, setLocalConfig] = useState({
        focusMinutes: state.config.focusMinutes,
        shortBreakMinutes: state.config.shortBreakMinutes,
        longBreakMinutes: state.config.longBreakMinutes,
    });

    if (!isOpen) return null;

    const minutes = Math.floor(state.remainingSeconds / 60);
    const seconds = state.remainingSeconds % 60;
    const progress = state.totalSeconds > 0
        ? ((state.totalSeconds - state.remainingSeconds) / state.totalSeconds) * 100
        : 0;

    const phaseLabels = {
        focus: 'Focus Time',
        shortBreak: 'Short Break',
        longBreak: 'Long Break',
        idle: 'Ready to Start',
    };

    const phaseDescriptions = {
        focus: 'Deep work mode - eliminate distractions',
        shortBreak: 'Quick recharge - stretch and breathe',
        longBreak: 'Extended rest - you earned it!',
        idle: 'Start a focus session to boost productivity',
    };

    const handleStart = () => {
        start();
    };

    const handleConfigSave = () => {
        setConfig(localConfig);
        setShowConfig(false);
    };

    const handlePreset = (focusMin: number, breakMin: number) => {
        const newConfig = {
            focusMinutes: focusMin,
            shortBreakMinutes: breakMin,
            longBreakMinutes: breakMin * 3,
        };
        setLocalConfig(newConfig);
        setConfig(newConfig);
    };

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Panel - Anchored top-right near timer pill */}
            <div
                className="fixed z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                style={{
                    top: '56px',
                    right: '24px',
                    width: 'min(420px, calc(100vw - 200px))',
                }}
            >
                <div className="bg-tokens-panel border border-tokens-border rounded-2xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-tokens-border flex-shrink-0">
                        <h2 className="text-lg font-semibold text-tokens-fg">Focus Timer</h2>
                        <button
                            onClick={onClose}
                            className="p-1 rounded-full hover:bg-tokens-panel2 text-tokens-muted hover:text-tokens-fg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content - Scrollable */}
                    <div className="p-6 space-y-6 overflow-y-auto flex-1">
                        {/* Phase Display */}
                        <div className="text-center space-y-2">
                            <div className="text-sm font-medium text-tokens-muted uppercase tracking-wider">
                                {phaseLabels[state.phase]}
                            </div>
                            <div className="text-6xl font-bold font-mono text-tokens-fg tabular-nums">
                                {minutes}:{seconds.toString().padStart(2, '0')}
                            </div>
                            <p className="text-sm text-tokens-muted">
                                {phaseDescriptions[state.phase]}
                            </p>
                        </div>

                        {/* Progress Bar */}
                        {state.sessionActive && (
                            <div className="relative h-2 bg-tokens-panel2 rounded-full overflow-hidden">
                                <div
                                    className="absolute left-0 top-0 h-full bg-tokens-brand-DEFAULT transition-all duration-1000 ease-linear"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        )}

                        {/* Info Stats */}
                        {state.sessionActive && (
                            <div className="flex justify-around text-center">
                                <div>
                                    <div className="text-2xl font-bold text-tokens-fg">{state.cycleCount}</div>
                                    <div className="text-xs text-tokens-muted">Completed</div>
                                </div>
                                <div className="w-px bg-tokens-border" />
                                <div>
                                    <div className="text-2xl font-bold text-tokens-fg">
                                        {state.config.longBreakEvery - (state.cycleCount % state.config.longBreakEvery)}
                                    </div>
                                    <div className="text-xs text-tokens-muted">Until Long Break</div>
                                </div>
                            </div>
                        )}

                        {/* Controls */}
                        <div className="flex gap-2">
                            {!state.sessionActive ? (
                                <Button
                                    variant="primary"
                                    fullWidth
                                    onClick={handleStart}
                                    icon={<Play size={16} />}
                                    iconPosition="circle"
                                >
                                    Start Focus Session
                                </Button>
                            ) : (
                                <>
                                    {state.isPaused ? (
                                        <Button
                                            variant="primary"
                                            fullWidth
                                            onClick={resume}
                                            icon={<Play size={16} />}
                                            iconPosition="left"
                                        >
                                            Resume
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="secondary"
                                            fullWidth
                                            onClick={pause}
                                            icon={<Pause size={16} />}
                                            iconPosition="left"
                                        >
                                            Pause
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        onClick={skip}
                                        icon={<SkipForward size={16} />}
                                        title="Skip to next phase"
                                    >
                                        Skip
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            if (confirm('End focus session?')) {
                                                stop();
                                                onClose();
                                            }
                                        }}
                                        icon={<StopCircle size={16} />}
                                        title="End session"
                                    >
                                        Stop
                                    </Button>
                                </>
                            )}
                        </div>

                        {/* Quick Presets */}
                        {!state.sessionActive && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-tokens-muted uppercase">Quick Presets</span>
                                    <button
                                        onClick={() => setShowConfig(!showConfig)}
                                        className="text-xs text-tokens-muted hover:text-tokens-fg flex items-center gap-1"
                                    >
                                        <Settings size={12} />
                                        {showConfig ? 'Hide' : 'Configure'}
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => handlePreset(25, 5)}
                                        className="px-3 py-2 rounded-lg border border-tokens-border hover:bg-tokens-panel2 text-sm transition-colors"
                                    >
                                        <div className="font-medium">25/5</div>
                                        <div className="text-xs text-tokens-muted">Classic</div>
                                    </button>
                                    <button
                                        onClick={() => handlePreset(50, 10)}
                                        className="px-3 py-2 rounded-lg border border-tokens-border hover:bg-tokens-panel2 text-sm transition-colors"
                                    >
                                        <div className="font-medium">50/10</div>
                                        <div className="text-xs text-tokens-muted">Extended</div>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Config Editor (Collapsed) */}
                        {showConfig && !state.sessionActive && (
                            <div className="space-y-3 p-4 bg-tokens-panel2/50 rounded-lg border border-tokens-border animate-in slide-in-from-top-2 duration-200">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-tokens-fg">Focus (minutes)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="120"
                                        value={localConfig.focusMinutes}
                                        onChange={(e) => setLocalConfig({ ...localConfig, focusMinutes: parseInt(e.target.value) || 25 })}
                                        className="w-full px-3 py-2 bg-tokens-bg border border-tokens-border rounded-lg text-sm text-tokens-fg focus:outline-none focus:ring-2 focus:ring-tokens-brand-DEFAULT/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-tokens-fg">Short Break (minutes)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="60"
                                        value={localConfig.shortBreakMinutes}
                                        onChange={(e) => setLocalConfig({ ...localConfig, shortBreakMinutes: parseInt(e.target.value) || 5 })}
                                        className="w-full px-3 py-2 bg-tokens-bg border border-tokens-border rounded-lg text-sm text-tokens-fg focus:outline-none focus:ring-2 focus:ring-tokens-brand-DEFAULT/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-tokens-fg">Long Break (minutes)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="120"
                                        value={localConfig.longBreakMinutes}
                                        onChange={(e) => setLocalConfig({ ...localConfig, longBreakMinutes: parseInt(e.target.value) || 15 })}
                                        className="w-full px-3 py-2 bg-tokens-bg border border-tokens-border rounded-lg text-sm text-tokens-fg focus:outline-none focus:ring-2 focus:ring-tokens-brand-DEFAULT/50"
                                    />
                                </div>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    fullWidth
                                    onClick={handleConfigSave}
                                >
                                    Save Configuration
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
