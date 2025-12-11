import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

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
    if (level <= 3) return { label: "Calm", color: "text-emerald-400", bg: "bg-emerald-500", border: "border-emerald-500/30" };
    if (level <= 6) return { label: "Distracted", color: "text-yellow-400", bg: "bg-yellow-500", border: "border-yellow-500/30" };
    return { label: "Overwhelmed", color: "text-red-400", bg: "bg-red-500", border: "border-red-500/30" };
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
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">

            {/* Header */}
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Gesu Refocus</h1>
                    <p className="text-gray-400 text-sm mt-1">Regain clarity when things get chaotic.</p>
                </div>
                <Link to="/" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm border border-gray-700 transition-colors">
                    ← Back
                </Link>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">

                {/* LEFT COLUMN (2/3 width) - Input & Reflection */}
                <div className="flex-1 flex flex-col gap-6">

                    {/* Current State Card */}
                    <div className={`bg-gray-900/50 backdrop-blur-sm border p-6 rounded-xl shadow-lg transition-colors duration-500 ${status.border} border-opacity-50`}>
                        <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                            <span className={`w-1.5 h-6 rounded-full transition-colors duration-500 ${status.bg}`}></span>
                            Current State
                        </h2>

                        <div className="px-4 pb-2">
                            <div className="flex justify-between items-end mb-4">
                                <span className={`text-2xl font-bold transition-colors duration-500 ${status.color}`}>
                                    {status.label}
                                </span>
                                <span className="text-5xl font-black text-gray-700/50 select-none">
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
                                    className={`w-full h-4 bg-gray-700 rounded-lg appearance-none cursor-pointer hover:opacity-90 transition-opacity`}
                                    style={{ accentColor: status.bg.replace('bg-', '') }} // Fallback/Hint for accent color
                                />
                                {/* Custom colored track simulation via CSS accent-color is browser dependent, using reliable Tailwind colors for text/borders instead */}
                            </div>

                            <div className="flex justify-between mt-3 text-xs text-gray-500 font-medium">
                                <span>Zen</span>
                                <span>Chaos</span>
                            </div>
                        </div>
                    </div>

                    {/* Journaling Card */}
                    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 p-6 rounded-xl shadow-lg">
                        <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
                            What's going on?
                        </h2>

                        <div className="flex flex-col gap-6">
                            {PROMPTS.map((prompt) => (
                                <div key={prompt.id} className="flex flex-col gap-2">
                                    <label htmlFor={prompt.id} className="text-sm font-medium text-gray-300">
                                        {prompt.question}
                                    </label>
                                    <textarea
                                        id={prompt.id}
                                        value={answers[prompt.id]}
                                        onChange={(e) => handleAnswerChange(prompt.id, e.target.value)}
                                        rows={3}
                                        className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder-gray-600 resize-none"
                                        placeholder="Type your thoughts here..."
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN (1/3 width) - Actions */}
                <div className="lg:w-80 xl:w-96 flex flex-col gap-6">

                    {/* Actions Card */}
                    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 p-6 rounded-xl shadow-lg flex-1 flex flex-col h-full sticky top-24">
                        <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-orange-500 rounded-full"></span>
                            Refocus Actions
                        </h2>

                        <p className="text-sm text-gray-400 mb-8 leading-relaxed">
                            Choose an action based on your current energy and overwhelm level.
                            Small steps are better than no steps.
                        </p>

                        <div className="flex flex-col gap-4">
                            <button
                                onClick={() => logAction('Quick Reset')}
                                className="w-full py-4 px-4 bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-emerald-500/50 rounded-xl text-left group transition-all"
                            >
                                <div className="font-semibold text-gray-200 group-hover:text-emerald-400 transition-colors">⚡ Quick 10-15m Reset</div>
                                <div className="text-xs text-gray-500 mt-1">Short break, breathe, hydrating.</div>
                            </button>

                            <button
                                onClick={() => logAction('Lost Mode')}
                                className="w-full py-4 px-4 bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-purple-500/50 rounded-xl text-left group transition-all"
                            >
                                <div className="font-semibold text-gray-200 group-hover:text-purple-400 transition-colors">📝 Lost Mode Journaling</div>
                                <div className="text-xs text-gray-500 mt-1">Deep dive into what's wrong.</div>
                            </button>

                            <div className="h-px bg-gray-800 my-2"></div>

                            <button
                                onClick={() => logAction('Back to Compass')}
                                className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold shadow-lg shadow-cyan-900/40 transition-all active:scale-[0.98] text-center"
                            >
                                Back to Compass
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
