import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '../components/PageContainer';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { start as startTimer } from '../stores/focusTimerStore';
import {
    Brain, Wind, Shield, Cloud,
    Play, CheckCircle2, ArrowRight,
    Sparkles, Clock, RotateCcw,
    ThumbsUp, ThumbsDown, Minus,
    TrendingUp, Zap, Target
} from 'lucide-react';
import {
    startResetSession,
    completeSession,
    rateSession,
    addProtocolToSession,
    getRefocusStats,
    getTodayResetCount,
    type ResetSession,
    type RefocusState
} from '../services/refocusService';
import { RefocusInsights } from '../components/RefocusInsights';
import { FlowStateRadar } from '../components/FlowStateRadar';

// --- Types ---

interface StateOption {
    id: RefocusState;
    label: string;
    icon: typeof Brain;
    gradient: string;
    borderColor: string;
    iconColor: string;
    description: string;
    protocols: Protocol[];
}

interface Protocol {
    id: string;  // Stable identifier
    name: string;  // Fallback English name
    action: string;  // Fallback English action
    duration: string;
}

const STATE_OPTIONS: StateOption[] = [
    {
        id: 'overwhelm',
        label: 'Overwhelmed',  // Fallback - will use t() in render
        icon: Brain,
        gradient: 'from-rose-500/20 to-rose-600/5',
        borderColor: 'border-rose-500/40',
        iconColor: 'text-rose-400',
        description: 'Too many things, brain overloaded',  // Fallback - will use t() in render
        protocols: [
            { id: 'breath', name: 'The Breath', action: 'Take 5 slow, deep breaths (4s in, 4s out)', duration: '40s' },
            { id: 'dump', name: 'The Dump', action: 'Write everything in your head on paper', duration: '2m' },
            { id: 'one', name: 'The One', action: 'Circle the ONE thing that matters most right now', duration: '30s' }
        ]
    },
    {
        id: 'restless',
        label: 'Restless',  // Fallback
        icon: Wind,
        gradient: 'from-amber-500/20 to-amber-600/5',
        borderColor: 'border-amber-500/40',
        iconColor: 'text-amber-400',
        description: "Can't sit still, need to move",  // Fallback
        protocols: [
            { id: 'reset', name: 'The Reset', action: 'Stand up and do 10 shoulder rolls', duration: '30s' },
            { id: 'walk', name: 'The Walk', action: 'Take a 2-minute walk around your space', duration: '2m' },
            { id: 'anchor', name: 'The Anchor', action: 'Put your phone in another room', duration: '20s' }
        ]
    },
    {
        id: 'avoiding',
        label: 'Avoiding',  // Fallback
        icon: Shield,
        gradient: 'from-violet-500/20 to-violet-600/5',
        borderColor: 'border-violet-500/40',
        iconColor: 'text-violet-400',
        description: 'Know what to do, but not doing it',  // Fallback
        protocols: [
            { id: 'fear', name: 'The Fear', action: "Write: 'I'm avoiding this because...'", duration: '1m' },
            { id: 'tiny', name: 'The Tiny', action: 'Do ONLY the first 2 minutes of the task', duration: '2m' },
            { id: 'split', name: 'The Split', action: 'Break the task into 3 tiny pieces', duration: '1m' }
        ]
    },
    {
        id: 'foggy',
        label: 'Foggy',  // Fallback
        icon: Cloud,
        gradient: 'from-sky-500/20 to-sky-600/5',
        borderColor: 'border-sky-500/40',
        iconColor: 'text-sky-400',
        description: "Brain fog, can't think clearly",  // Fallback
        protocols: [
            { id: 'hydrate', name: 'The Hydrate', action: 'Drink a full glass of water slowly', duration: '30s' },
            { id: 'gaze', name: 'The Gaze', action: 'Look out a window for 30 seconds', duration: '30s' },
            { id: 'clarity', name: 'The Clarity', action: 'Write: "Right now I need to..."', duration: '1m' }
        ]
    }
];

// Map state IDs to locale key names
const STATE_KEY_MAP: Record<RefocusState, string> = {
    overwhelm: 'overwhelmed',
    restless: 'restless',
    avoiding: 'avoiding',
    foggy: 'foggy'
};

export function RefocusPage() {
    const navigate = useNavigate();
    const { t } = useTranslation(['refocus', 'common']);
    const [selectedState, setSelectedState] = useState<RefocusState | null>(null);
    const [currentProtocolIndex, setCurrentProtocolIndex] = useState(0);
    const [completedProtocols, setCompletedProtocols] = useState<number[]>([]);
    const [currentSession, setCurrentSession] = useState<ResetSession | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedbackGiven, setFeedbackGiven] = useState(false);

    const currentState = STATE_OPTIONS.find(s => s.id === selectedState);
    const currentProtocol = currentState?.protocols[currentProtocolIndex];
    const allProtocolsComplete = completedProtocols.length === 3;

    // Load stats on mount
    const [stats, setStats] = useState(() => getRefocusStats());
    const [todayCount, setTodayCount] = useState(() => getTodayResetCount());

    useEffect(() => {
        setStats(getRefocusStats());
        setTodayCount(getTodayResetCount());
    }, [feedbackGiven]);

    const handleSelectState = useCallback((stateId: RefocusState) => {
        setSelectedState(stateId);
        setCurrentProtocolIndex(0);
        setCompletedProtocols([]);
        setShowFeedback(false);
        setFeedbackGiven(false);

        // Start tracking session
        const session = startResetSession(stateId);
        setCurrentSession(session);
    }, []);

    const handleCompleteProtocol = useCallback(() => {
        if (!currentState || !currentSession) return;

        // Track protocol completion
        const protocolName = currentState.protocols[currentProtocolIndex].name;
        addProtocolToSession(currentSession.id, protocolName);

        setCompletedProtocols(prev => [...prev, currentProtocolIndex]);

        if (currentProtocolIndex < 2) {
            setCurrentProtocolIndex(prev => prev + 1);
        } else {
            // All protocols complete - show feedback
            setShowFeedback(true);
        }
    }, [currentProtocolIndex, currentState, currentSession]);

    const handleFeedback = useCallback((rating: 'yes' | 'no' | 'somewhat') => {
        if (!currentSession) return;
        rateSession(currentSession.id, rating);
        setFeedbackGiven(true);
    }, [currentSession]);

    const handleStartFocus = useCallback(() => {
        if (currentSession) {
            completeSession(currentSession.id, true);
        }
        startTimer({ focusMinutes: 15 });
        navigate('/compass');
    }, [navigate, currentSession]);

    const handleSkipFocus = useCallback(() => {
        if (currentSession) {
            completeSession(currentSession.id, false);
        }
        handleReset();
    }, [currentSession]);

    const handleReset = useCallback(() => {
        setSelectedState(null);
        setCurrentProtocolIndex(0);
        setCompletedProtocols([]);
        setCurrentSession(null);
        setShowFeedback(false);
        setFeedbackGiven(false);
    }, []);

    const STATE_LABELS: Record<RefocusState, string> = {
        overwhelm: t('refocus:mentalStates.overwhelmed', 'Overwhelmed'),
        restless: t('refocus:mentalStates.restless', 'Restless'),
        avoiding: t('refocus:mentalStates.avoiding', 'Avoiding'),
        foggy: t('refocus:mentalStates.foggy', 'Foggy')
    };

    return (
        <PageContainer>
            {/* Hero Header */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-tokens-brand-DEFAULT/10 text-tokens-brand-DEFAULT text-xs font-medium mb-4">
                    <Sparkles size={14} />
                    {t('refocus:protocol.title', 'Adaptive Mental Reset Protocol')}
                </div>
                <h1 className="text-3xl font-bold text-tokens-fg tracking-tight mb-2">
                    {t('refocus:title')}
                </h1>
                <p className="text-tokens-muted max-w-md mx-auto">
                    {t('refocus:subtitle')}
                </p>
            </div>

            {/* Main Content */}
            <div className="max-w-3xl mx-auto">

                {/* Quick Stats Bar */}
                {stats.totalResets > 0 && !selectedState && (
                    <div className="flex items-center justify-center gap-6 mb-6 p-3 rounded-lg bg-tokens-panel border border-tokens-border text-sm">
                        <div className="flex items-center gap-2">
                            <Zap size={14} className="text-tokens-brand-DEFAULT" />
                            <span className="text-tokens-muted">{t('refocus:stats.today')}:</span>
                            <span className="font-semibold text-tokens-fg">{todayCount} {t('common:status.completed', 'resets')}</span>
                        </div>
                        {stats.mostCommonState && (
                            <>
                                <div className="w-px h-4 bg-tokens-border" />
                                <div className="flex items-center gap-2">
                                    <Target size={14} className="text-tokens-brand-DEFAULT" />
                                    <span className="text-tokens-muted">{t('refocus:stats.mostCommon', 'Most common')}:</span>
                                    <span className="font-semibold text-tokens-fg">{STATE_LABELS[stats.mostCommonState]}</span>
                                </div>
                            </>
                        )}
                        {stats.completedResets > 0 && (
                            <>
                                <div className="w-px h-4 bg-tokens-border" />
                                <div className="flex items-center gap-2">
                                    <TrendingUp size={14} className="text-tokens-brand-DEFAULT" />
                                    <span className="text-tokens-muted">{t('refocus:stats.total', 'Total')}:</span>
                                    <span className="font-semibold text-tokens-fg">{stats.completedResets} {t('refocus:stats.completed', 'completed')}</span>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* State Selection */}
                {!selectedState && (
                    <Card className="mb-6 animate-in fade-in duration-300">
                        <div className="text-center mb-6">
                            <h2 className="text-lg font-semibold text-tokens-fg mb-1">
                                {t('refocus:selection.heading', 'How are you feeling right now?')}
                            </h2>
                            <p className="text-sm text-tokens-muted">
                                {t('refocus:selection.subtitle', 'Select your current mental state to receive a personalized protocol')}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {STATE_OPTIONS.map((state) => {
                                const Icon = state.icon;
                                const isFrequent = stats.mostCommonState === state.id;
                                return (
                                    <button
                                        key={state.id}
                                        onClick={() => handleSelectState(state.id)}
                                        className={`
                                            group relative p-5 rounded-xl border-2 text-left
                                            transition-all duration-300 ease-out
                                            bg-gradient-to-br ${state.gradient}
                                            border-transparent hover:${state.borderColor}
                                            hover:scale-[1.02] hover:shadow-lg
                                        `}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`p-3 rounded-xl bg-tokens-bg/50 ${state.iconColor}`}>
                                                <Icon size={24} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="font-semibold text-tokens-fg">
                                                        {t(`refocus:mentalStates.${STATE_KEY_MAP[state.id]}`, state.label)}
                                                    </div>
                                                    {isFrequent && stats.totalResets >= 3 && (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-tokens-brand-DEFAULT/20 text-tokens-brand-DEFAULT">
                                                            {t('refocus:badges.frequent', 'Frequent')}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-tokens-muted mt-1">
                                                    {t(`refocus:mentalStates.${STATE_KEY_MAP[state.id]}Desc`, state.description)}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Hover indicator */}
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ArrowRight size={18} className="text-tokens-muted" />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </Card>
                )}

                {/* Protocol Flow */}
                {selectedState && currentState && !allProtocolsComplete && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Progress Header */}
                        <div className="flex items-center justify-between mb-4">
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-2 text-sm text-tokens-muted hover:text-tokens-fg transition-colors"
                            >
                                <RotateCcw size={14} />
                                {t('refocus:protocol.startOver', 'Start over')}
                            </button>

                            <div className="flex items-center gap-2">
                                {[0, 1, 2].map((i) => (
                                    <div
                                        key={i}
                                        className={`
                                            w-8 h-1.5 rounded-full transition-colors
                                            ${completedProtocols.includes(i)
                                                ? 'bg-tokens-brand-DEFAULT'
                                                : i === currentProtocolIndex
                                                    ? 'bg-tokens-brand-DEFAULT/50'
                                                    : 'bg-tokens-border'
                                            }
                                        `}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Current Protocol Card */}
                        <Card className={`border-2 ${currentState.borderColor} mb-6`}>
                            <div className="text-center py-8 px-4">
                                {/* Protocol Badge */}
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tokens-bg-secondary text-xs text-tokens-muted mb-6">
                                    <Clock size={12} />
                                    {currentProtocol?.duration}
                                </div>

                                {/* Protocol Name - i18n with fallback */}
                                <h3 className={`text-2xl font-bold mb-4 ${currentState.iconColor}`}>
                                    {currentProtocol && t(`refocus:protocols.${currentProtocol.id}.name`, currentProtocol.name)}
                                </h3>

                                {/* Protocol Action - i18n with fallback */}
                                <p className="text-lg text-tokens-fg mb-8 max-w-md mx-auto leading-relaxed">
                                    {currentProtocol && t(`refocus:protocols.${currentProtocol.id}.action`, currentProtocol.action)}
                                </p>

                                {/* Complete Button */}
                                <Button
                                    variant="primary"
                                    onClick={handleCompleteProtocol}
                                    icon={<CheckCircle2 size={18} />}
                                    className="px-8"
                                >
                                    {t('refocus:protocol.doneNextStep', 'Done — Next Step')}
                                </Button>
                            </div>
                        </Card>

                        {/* Upcoming Protocols */}
                        <div className="flex gap-2">
                            {currentState.protocols.map((protocol, i) => (
                                <div
                                    key={i}
                                    className={`
                                        flex-1 p-3 rounded-lg text-center text-xs
                                        transition-all duration-300
                                        ${completedProtocols.includes(i)
                                            ? 'bg-tokens-brand-DEFAULT/20 text-tokens-brand-DEFAULT'
                                            : i === currentProtocolIndex
                                                ? 'bg-tokens-panel border border-tokens-border text-tokens-fg'
                                                : 'bg-tokens-bg-secondary text-tokens-muted'
                                        }
                                    `}
                                >
                                    {completedProtocols.includes(i) && <CheckCircle2 size={14} className="mx-auto mb-1" />}
                                    {t(`refocus:protocols.${protocol.id}.name`, protocol.name)}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Completion State with Feedback */}
                {allProtocolsComplete && currentState && (
                    <div className="animate-in fade-in zoom-in-95 duration-500">
                        <Card className="text-center py-12 border-2 border-tokens-brand-DEFAULT/30">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-tokens-brand-DEFAULT/20 text-tokens-brand-DEFAULT mb-6">
                                <CheckCircle2 size={32} />
                            </div>

                            <h2 className="text-2xl font-bold text-tokens-fg mb-2">
                                {t('refocus:completion.title', 'Protocol Complete')}
                            </h2>
                            <p className="text-tokens-muted mb-6 max-w-sm mx-auto">
                                {t('refocus:completion.message', "You've completed all reset steps. Ready to focus?")}
                            </p>

                            {/* Feedback Section */}
                            {showFeedback && !feedbackGiven && (
                                <div className="mb-8 p-4 rounded-lg bg-tokens-bg-secondary">
                                    <p className="text-sm text-tokens-fg mb-3">{t('refocus:feedback.question', 'Did this protocol help you?')}</p>
                                    <div className="flex items-center justify-center gap-3">
                                        <button
                                            onClick={() => handleFeedback('yes')}
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                                        >
                                            <ThumbsUp size={16} />
                                            {t('refocus:feedback.yes', 'Yes!')}
                                        </button>
                                        <button
                                            onClick={() => handleFeedback('somewhat')}
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors"
                                        >
                                            <Minus size={16} />
                                            {t('refocus:feedback.somewhat', 'Somewhat')}
                                        </button>
                                        <button
                                            onClick={() => handleFeedback('no')}
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors"
                                        >
                                            <ThumbsDown size={16} />
                                            {t('refocus:feedback.notReally', 'Not really')}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {feedbackGiven && (
                                <div className="mb-8 p-3 rounded-lg bg-tokens-brand-DEFAULT/10 text-tokens-brand-DEFAULT text-sm">
                                    <Sparkles size={14} className="inline mr-2" />
                                    {t('refocus:feedback.thanksMessage', "Thanks! We'll use this to personalize your experience.")}
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <Button
                                    variant="primary"
                                    onClick={handleStartFocus}
                                    icon={<Play size={18} />}
                                    className="px-8"
                                >
                                    {t('refocus:completion.startFocus', 'Start 15-min Focus Session')}
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={handleSkipFocus}
                                    icon={<RotateCcw size={16} />}
                                >
                                    {t('refocus:completion.maybeLater', 'Maybe Later')}
                                </Button>
                            </div>
                        </Card>
                    </div>
                )}

            </div>

            {/* Premium Features Section - Only show when not in active reset */}
            {!selectedState && (
                <div className="max-w-3xl mx-auto mt-8 space-y-6">
                    {/* Flow State Radar */}
                    <FlowStateRadar />

                    {/* Insights */}
                    <RefocusInsights />
                </div>
            )}
        </PageContainer>
    );
}
