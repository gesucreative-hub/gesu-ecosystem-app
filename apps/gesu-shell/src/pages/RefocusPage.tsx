import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/PageContainer';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { start as startTimer } from '../stores/focusTimerStore';
import { Brain, Wind, Shield, Cloud, PlayCircle, FileText } from 'lucide-react';

// --- Types ---

type RefocusState = 'overwhelm' | 'restless' | 'avoiding' | 'foggy';

interface StateOption {
    id: RefocusState;
    label: string;
    icon: typeof Brain;
    color: string;
    bg: string;
    border: string;
    description: string;
    actions: string[];
}

const STATE_OPTIONS: StateOption[] = [
    {
        id: 'overwhelm',
        label: 'Overwhelmed',
        icon: Brain,
        color: 'text-red-500',
        bg: 'bg-red-500',
        border: 'border-red-500/30',
        description: 'Too many things, brain overloaded',
        actions: ['Close extra tabs', 'Write 1 priority', '5 deep breaths']
    },
    {
        id: 'restless',
        label: 'Restless',
        icon: Wind,
        color: 'text-amber-500',
        bg: 'bg-amber-500',
        border: 'border-amber-500/30',
        description: 'Can\'t sit still, need to move',
        actions: ['Stand + stretch', '2-min walk', 'Phone to drawer']
    },
    {
        id: 'avoiding',
        label: 'Avoiding',
        icon: Shield,
        color: 'text-purple-500',
        bg: 'bg-purple-500',
        border: 'border-purple-500/30',
        description: 'Know what to do, but not doing it',
        actions: ['Name the fear', '2-min timer on task', 'Split into 3 pieces']
    },
    {
        id: 'foggy',
        label: 'Foggy',
        icon: Cloud,
        color: 'text-blue-500',
        bg: 'bg-blue-500',
        border: 'border-blue-500/30',
        description: 'Brain fog, can\'t think clearly',
        actions: ['Drink water', 'Look out window', 'Write brain dump']
    }
];

export function RefocusPage() {
    const navigate = useNavigate();
    const [selectedState, setSelectedState] = useState<RefocusState | null>(null);

    const currentState = STATE_OPTIONS.find(s => s.id === selectedState);

    const handleStartRescueFocus = () => {
        startTimer({ focusMinutes: 15 });
        navigate('/compass');
    };

    const handleLostMode = () => {
        navigate('/refocus/lost');
    };

    return (
        <PageContainer>
            {/* Header */}
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h1 className="text-3xl font-bold text-tokens-fg tracking-tight">Gesu Refocus</h1>
                    <p className="text-tokens-muted text-sm mt-1">Quick rescue loop to get back on track.</p>
                </div>
                <Link to="/" className="px-4 py-2 bg-tokens-panel border border-tokens-border hover:bg-tokens-panel2 text-tokens-fg rounded-lg text-sm transition-colors">
                    ← Back
                </Link>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">

                {/* LEFT COLUMN - State Selection */}
                <div className="flex-1 flex flex-col gap-6">

                    {/* State Selection Card */}
                    <Card title={
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-primary-700 dark:bg-secondary-300 rounded-full"></span>
                            How are you feeling right now?
                        </div>
                    }>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {STATE_OPTIONS.map((state) => {
                                const Icon = state.icon;
                                const isSelected = selectedState === state.id;
                                return (
                                    <button
                                        key={state.id}
                                        onClick={() => setSelectedState(state.id)}
                                        className={`p-4 rounded-lg border-2 text-left transition-all ${isSelected
                                            ? `${state.border} ${state.bg} bg-opacity-10`
                                            : 'border-tokens-border hover:border-tokens-brand-DEFAULT/30 bg-tokens-panel2'
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <Icon size={20} className={isSelected ? state.color : 'text-tokens-muted'} />
                                            <div className="flex-1">
                                                <div className={`font-semibold text-sm ${isSelected ? state.color : 'text-tokens-fg'}`}>
                                                    {state.label}
                                                </div>
                                                <div className="text-xs text-tokens-muted mt-1">
                                                    {state.description}
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <div className={`w-2 h-2 rounded-full ${state.bg}`}></div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </Card>

                    {/* Suggested Actions Card */}
                    {currentState && (
                        <Card title={
                            <div className="flex items-center gap-2">
                                <span className={`w-1.5 h-6 rounded-full ${currentState.bg}`}></span>
                                Tiny Actions (2 minutes or less)
                            </div>
                        } className={`border-2 ${currentState.border} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                            <div className="flex flex-col gap-2">
                                {currentState.actions.map((action, index) => (
                                    <div key={index} className="flex items-center gap-3 p-3 bg-tokens-panel2 rounded-lg">
                                        <Badge variant="neutral" className="shrink-0">
                                            {index + 1}
                                        </Badge>
                                        <span className="text-sm text-tokens-fg">{action}</span>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-tokens-muted mt-4">
                                Pick one action, do it now, then start your rescue focus session.
                            </p>
                        </Card>
                    )}

                </div>

                {/* RIGHT COLUMN - Actions */}
                <div className="lg:w-80 xl:w-96 flex flex-col gap-4">

                    {/* Rescue Focus CTA */}
                    <Card title={
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-primary-700 dark:bg-secondary-300 rounded-full"></span>
                            Rescue Focus (15 min)
                        </div>
                    } className="sticky top-24">
                        <p className="text-sm text-tokens-muted mb-6 leading-relaxed">
                            Start a short 15-minute focus session to regain momentum.
                            Pick one tiny action above and commit to it.
                        </p>

                        <Button
                            variant="primary"
                            onClick={handleStartRescueFocus}
                            disabled={!selectedState}
                            icon={<PlayCircle size={18} />}
                            fullWidth
                            className="justify-center mb-4"
                        >
                            Start 15-min Rescue Focus
                        </Button>

                        {!selectedState && (
                            <p className="text-xs text-tokens-muted text-center">
                                Select your current state to continue
                            </p>
                        )}

                        <div className="h-px bg-tokens-border my-6"></div>

                        {/* Lost Mode CTA */}
                        <div className="space-y-3">
                            <div className="text-xs font-semibold text-tokens-muted uppercase tracking-wider">
                                Feeling stuck?
                            </div>
                            <Button
                                variant="secondary"
                                onClick={handleLostMode}
                                icon={<FileText size={16} />}
                                fullWidth
                                className="justify-center"
                            >
                                Try Lost Mode
                            </Button>
                            <p className="text-xs text-tokens-muted">
                                3 quick prompts to help you identify the smallest next step.
                            </p>
                        </div>
                    </Card>

                </div>
            </div>
        </PageContainer>
    );
}
