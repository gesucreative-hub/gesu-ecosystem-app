import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/PageContainer';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Textarea } from '../components/Textarea';

// --- Types & Interfaces ---

interface Prompt {
    id: string;
    question: string;
}

const PROMPTS: Prompt[] = [
    { id: 'working_on', question: "What are you trying to work on right now?" },
    { id: 'pulling_away', question: "What is pulling your attention away?" },
    { id: 'next_step', question: "What is the smallest next step that feels doable?" }
];

// --- Helper Functions ---

const getStatus = (level: number) => {
    if (level <= 3) return { label: "Calm", color: "text-emerald-500", bg: "bg-emerald-500", border: "border-emerald-500/30" };
    if (level <= 6) return { label: "Distracted", color: "text-amber-500", bg: "bg-amber-500", border: "border-amber-500/30" };
    return { label: "Overwhelmed", color: "text-red-500", bg: "bg-red-500", border: "border-red-500/30" };
};

export function RefocusPage() {
    const navigate = useNavigate();

    // State
    const [level, setLevel] = useState<number>(5);
    const [answers, setAnswers] = useState<Record<string, string>>({
        working_on: '',
        pulling_away: '',
        next_step: ''
    });

    const status = getStatus(level);

    // Handlers
    const handleAnswerChange = (id: string, value: string) => {
        setAnswers(prev => ({ ...prev, [id]: value }));
    };

    const logAction = (actionName: string) => {
        const snapshot = {
            timestamp: new Date().toISOString(),
            state: {
                overwhelmLevel: level,
                statusLabel: status.label
            },
            answers,
            action: actionName
        };

        console.log("Refocus Action Logged:", snapshot);
        alert(`Action "${actionName}" logged to console (mock).`);

        if (actionName === 'Back to Compass') {
            navigate('/compass');
        }
    };

    return (
        <PageContainer>
            {/* Header */}
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h1 className="text-3xl font-bold text-tokens-fg tracking-tight">Gesu Refocus</h1>
                    <p className="text-tokens-muted text-sm mt-1">Regain clarity when things get chaotic.</p>
                </div>
                <Link to="/" className="px-4 py-2 bg-tokens-panel border border-tokens-border hover:bg-tokens-panel2 text-tokens-fg rounded-lg text-sm transition-colors">
                    ← Back
                </Link>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">

                {/* LEFT COLUMN (2/3 width) - Input & Reflection */}
                <div className="flex-1 flex flex-col gap-6">

                    {/* Current State Card */}
                    <Card title={
                        <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-6 rounded-full transition-colors duration-500 ${status.bg}`}></span>
                            Current State
                        </div>
                    } className={`transition-colors duration-500 ${status.border} border-opacity-50`}>
                        <div className="px-1 pb-2">
                            <div className="flex justify-between items-end mb-4">
                                <span className={`text-2xl font-bold transition-colors duration-500 ${status.color}`}>
                                    {status.label}
                                </span>
                                <span className="text-5xl font-black text-tokens-panel2 select-none">
                                    {level}
                                </span>
                            </div>

                            <div className="relative pt-1">
                                <input
                                    type="range"
                                    min="0"
                                    max="10"
                                    value={level}
                                    onChange={(e) => setLevel(parseInt(e.target.value))}
                                    className={`w-full h-4 bg-tokens-panel2 rounded-lg appearance-none cursor-pointer hover:opacity-90 transition-opacity border border-tokens-border`}
                                    style={{ accentColor: status.bg.replace('bg-', '') }} // Fallback/Hint for accent color
                                />
                                {/* Custom colored track simulation via CSS accent-color is browser dependent, using reliable Tailwind colors for text/borders instead */}
                            </div>

                            <div className="flex justify-between mt-3 text-xs text-tokens-muted font-medium">
                                <span>Zen</span>
                                <span>Chaos</span>
                            </div>
                        </div>
                    </Card>

                    {/* Journaling Card */}
                    <Card title={
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
                            What's going on?
                        </div>
                    }>
                        <div className="flex flex-col gap-6">
                            {PROMPTS.map((prompt) => (
                                <div key={prompt.id} className="flex flex-col gap-2">
                                    <Textarea
                                        id={prompt.id}
                                        label={prompt.question}
                                        value={answers[prompt.id]}
                                        onChange={(e) => handleAnswerChange(prompt.id, e.target.value)}
                                        rows={3}
                                        placeholder="Type your thoughts here..."
                                        className="resize-none"
                                    />
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* RIGHT COLUMN (1/3 width) - Actions */}
                <div className="lg:w-80 xl:w-96 flex flex-col gap-6">

                    {/* Actions Card */}
                    <Card title={
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-orange-500 rounded-full"></span>
                            Refocus Actions
                        </div>
                    } className="h-full flex flex-col sticky top-24">
                        <p className="text-sm text-tokens-muted mb-8 leading-relaxed">
                            Choose an action based on your current energy and overwhelm level.
                            Small steps are better than no steps.
                        </p>

                        <div className="flex flex-col gap-4">
                            <button
                                onClick={() => logAction('Quick Reset')}
                                className="w-full py-4 px-4 bg-tokens-panel2 hover:bg-tokens-border border border-tokens-border hover:border-emerald-500/50 rounded-xl text-left group transition-all"
                            >
                                <div className="font-semibold text-tokens-fg group-hover:text-emerald-500 transition-colors">⚡ Quick 10-15m Reset</div>
                                <div className="text-xs text-tokens-muted mt-1">Short break, breathe, hydrating.</div>
                            </button>

                            <button
                                onClick={() => logAction('Lost Mode')}
                                className="w-full py-4 px-4 bg-tokens-panel2 hover:bg-tokens-border border border-tokens-border hover:border-purple-500/50 rounded-xl text-left group transition-all"
                            >
                                <div className="font-semibold text-tokens-fg group-hover:text-purple-500 transition-colors">📝 Lost Mode Journaling</div>
                                <div className="text-xs text-tokens-muted mt-1">Deep dive into what's wrong.</div>
                            </button>

                            <div className="h-px bg-tokens-border my-2"></div>

                            <Button
                                variant="primary"
                                onClick={() => logAction('Back to Compass')}
                                className="w-full justify-center"
                            >
                                Back to Compass
                            </Button>
                        </div>
                    </Card>

                </div>
            </div>
        </PageContainer>
    );
}
