import { useState } from 'react';
import { Link } from 'react-router-dom';

// --- Types & Interfaces ---

interface FocusAreas {
    [key: string]: number;
}

interface Session {
    id: string;
    label: string;
    completed: boolean;
}

// --- Helper Components ---

const SliderControl = ({
    label,
    value,
    onChange,
    colorClass = "accent-cyan-500"
}: {
    label: React.ReactNode;
    value: number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    colorClass?: string;
}) => (
    <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
            <span className="text-gray-300 font-medium text-sm">{label}</span>
            <span className="text-cyan-400 font-bold bg-cyan-950/30 px-2 py-0.5 rounded text-xs border border-cyan-900/50">
                {value}/10
            </span>
        </div>
        <input
            type="range"
            min="0"
            max="10"
            value={value}
            onChange={onChange}
            className={`w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer ${colorClass} hover:bg-gray-650 transition-colors`}
        />
    </div>
);

// --- Main Component ---

export function CompassPage() {
    // State
    const [energy, setEnergy] = useState<number>(5);

    const [focusAreas, setFocusAreas] = useState<FocusAreas>({
        'Money': 5,
        'Creative': 5,
        'Relations': 5,
        'Learning': 5,
        'Content': 5,
        'Self Care': 5
    });

    const [sessions, setSessions] = useState<Session[]>([
        { id: '1', label: 'Deep Work Block', completed: false },
        { id: '2', label: 'Admin & Email', completed: false },
        { id: '3', label: 'Learning Session', completed: false },
        { id: '4', label: 'Physical Activity', completed: false }
    ]);

    // Derived State
    const getEnergyLabel = (val: number) => {
        if (val <= 3) return { text: "Low Energy", color: "text-red-400" };
        if (val <= 7) return { text: "Medium Energy", color: "text-yellow-400" };
        return { text: "High Energy", color: "text-emerald-400" };
    };

    const energyStatus = getEnergyLabel(energy);

    // Handlers
    const handleFocusChange = (area: string, val: string) => {
        setFocusAreas(prev => ({ ...prev, [area]: parseInt(val) }));
    };

    const toggleSession = (id: string) => {
        setSessions(prev => prev.map(s =>
            s.id === id ? { ...s, completed: !s.completed } : s
        ));
    };

    const saveSnapshot = () => {
        const snapshot = {
            timestamp: new Date().toISOString(),
            energy: { value: energy, label: energyStatus.text },
            focusAreas,
            sessions
        };
        console.log("Mock Log Saved:", snapshot);
        alert("Snapshot saved to console (mock)!");
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">

            {/* Header */}
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Gesu Compass</h1>
                    <p className="text-gray-400 text-sm mt-1">Daily calibration & focus integrity.</p>
                </div>
                <Link to="/" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm border border-gray-700 transition-colors">
                    ← Back
                </Link>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">

                {/* LEFT COLUMN (2/3 width) */}
                <div className="flex-1 flex flex-col gap-6">

                    {/* Energy Card */}
                    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 p-6 rounded-xl shadow-lg">
                        <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-cyan-500 rounded-full"></span>
                            Today's Energy
                        </h2>

                        <div className="px-4 pb-2">
                            <div className="flex justify-between items-end mb-4">
                                <span className={`text-2xl font-bold ${energyStatus.color}`}>
                                    {energyStatus.text}
                                </span>
                                <span className="text-5xl font-black text-gray-700/50 select-none">
                                    {energy}
                                </span>
                            </div>

                            <input
                                type="range"
                                min="0"
                                max="10"
                                value={energy}
                                onChange={(e) => setEnergy(parseInt(e.target.value))}
                                className="w-full h-4 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400"
                            />
                            <div className="flex justify-between mt-2 text-xs text-gray-500 font-medium">
                                <span>Exhausted</span>
                                <span>Optimized</span>
                            </div>
                        </div>
                    </div>

                    {/* Focus Areas Card */}
                    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 p-6 rounded-xl shadow-lg">
                        <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-purple-500 rounded-full"></span>
                            Focus Areas
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8">
                            {Object.entries(focusAreas).map(([area, value]) => (
                                <SliderControl
                                    key={area}
                                    label={area}
                                    value={value}
                                    onChange={(e) => handleFocusChange(area, e.target.value)}
                                    colorClass="accent-purple-500"
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN (1/3 width) */}
                <div className="lg:w-80 xl:w-96 flex flex-col gap-6">

                    {/* Sessions Card */}
                    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 p-6 rounded-xl shadow-lg flex-1 flex flex-col h-full">
                        <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
                            Sessions Today
                        </h2>

                        <div className="flex flex-col gap-2 mb-6">
                            {sessions.map(session => (
                                <label
                                    key={session.id}
                                    className={`
                    flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                    ${session.completed
                                            ? 'bg-emerald-900/20 border-emerald-900/50 shadow-inner'
                                            : 'bg-gray-800/30 border-gray-700 hover:bg-gray-800/50 hover:border-gray-600'}
                  `}
                                >
                                    <input
                                        type="checkbox"
                                        checked={session.completed}
                                        onChange={() => toggleSession(session.id)}
                                        className="w-5 h-5 rounded border-gray-600 text-emerald-500 focus:ring-emerald-500/20 bg-gray-700 cursor-pointer"
                                    />
                                    <span className={`text-sm ${session.completed ? 'text-emerald-400/80 line-through' : 'text-gray-200'}`}>
                                        {session.label}
                                    </span>
                                </label>
                            ))}
                        </div>

                        <div className="mt-auto pt-6 border-t border-gray-800">
                            <button
                                onClick={saveSnapshot}
                                className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold shadow-lg shadow-cyan-900/40 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                <span>Save Snapshot</span>
                                <span className="text-xs bg-cyan-800/50 px-1.5 py-0.5 rounded border border-cyan-400/20">(Mock)</span>
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
