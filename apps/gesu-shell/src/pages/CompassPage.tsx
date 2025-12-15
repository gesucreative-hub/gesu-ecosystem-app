import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase } from 'lucide-react';
import { PageContainer } from '../components/PageContainer';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import {
    getTodayTasks,
    toggleTaskDone,
    ProjectHubTask
} from '../stores/projectHubTasksStore';

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
    colorClass = "accent-tokens-brand-DEFAULT",
    badgeVariant = "brand"
}: {
    label: React.ReactNode;
    value: number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    colorClass?: string;
    badgeVariant?: 'neutral' | 'brand' | 'success' | 'warning' | 'error';
}) => (
    <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
            <span className="text-tokens-muted font-medium text-sm">{label}</span>
            <Badge variant={badgeVariant}>
                {value}/10
            </Badge>
        </div>
        <input
            type="range"
            min="0"
            max="10"
            value={value}
            onChange={onChange}
            className={`w-full h-2 bg-tokens-panel2 rounded-lg appearance-none cursor-pointer ${colorClass} hover:brightness-110 transition-all border border-tokens-border focus:outline-none focus:ring-2 focus:ring-tokens-ring`}
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

    // Project Hub Tasks State
    const [projectHubTasks, setProjectHubTasks] = useState<ProjectHubTask[]>([]);

    // Load project hub tasks on mount and refresh periodically
    useEffect(() => {
        const loadTasks = () => setProjectHubTasks(getTodayTasks());
        loadTasks();
        // Refresh every 5 seconds in case tasks are added from Project Hub
        const interval = setInterval(loadTasks, 5000);
        return () => clearInterval(interval);
    }, []);

    // Handler for toggling project hub task
    const handleToggleProjectHubTask = useCallback((taskId: string) => {
        toggleTaskDone(taskId);
        setProjectHubTasks(getTodayTasks());
    }, []);

    // Derived State
    const getEnergyLabel = (val: number) => {
        if (val <= 3) return { text: "Low Energy", color: "text-red-500" };
        if (val <= 7) return { text: "Medium Energy", color: "text-amber-500" };
        return { text: "High Energy", color: "text-emerald-500" };
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
        <PageContainer>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-tokens-fg tracking-tight">Gesu Compass</h1>
                    <p className="text-tokens-muted text-sm mt-1">Daily calibration & focus integrity.</p>
                </div>
                <Link to="/" className="px-4 py-2 bg-tokens-panel border border-tokens-border hover:bg-tokens-panel2 text-tokens-fg rounded-lg text-sm transition-colors">
                    ← Back
                </Link>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">

                {/* LEFT COLUMN (2/3 width) */}
                <div className="flex-1 flex flex-col gap-6">

                    {/* Energy Card */}
                    <Card title={
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-cyan-500 rounded-full"></span>
                            Today's Energy
                        </div>
                    }>
                        <div className="px-1 pb-2">
                            <div className="flex justify-between items-end mb-4">
                                <span className={`text-2xl font-bold ${energyStatus.color}`}>
                                    {energyStatus.text}
                                </span>
                                <span className="text-5xl font-black text-tokens-panel2 select-none">
                                    {energy}
                                </span>
                            </div>

                            <input
                                type="range"
                                min="0"
                                max="10"
                                value={energy}
                                onChange={(e) => setEnergy(parseInt(e.target.value))}
                                className="w-full h-4 bg-tokens-panel2 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400 border border-tokens-border focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                            />
                            <div className="flex justify-between mt-2 text-xs text-tokens-muted font-medium">
                                <span>Exhausted</span>
                                <span>Optimized</span>
                            </div>
                        </div>
                    </Card>

                    {/* Focus Areas Card */}
                    <Card title={
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-purple-500 rounded-full"></span>
                            Focus Areas
                        </div>
                    }>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8">
                            {Object.entries(focusAreas).map(([area, value]) => (
                                <SliderControl
                                    key={area}
                                    label={area}
                                    value={value}
                                    onChange={(e) => handleFocusChange(area, e.target.value)}
                                    colorClass="accent-purple-500"
                                    badgeVariant="brand" // Using brand styles for now, can be customized
                                />
                            ))}
                        </div>
                    </Card>
                </div>

                {/* RIGHT COLUMN (1/3 width) */}
                <div className="lg:w-80 xl:w-96 flex flex-col gap-6">

                    {/* Sessions Card */}
                    <Card title={
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
                            Sessions Today
                        </div>
                    } className="h-full flex flex-col">
                        <div className="flex flex-col gap-2 mb-6 flex-1">
                            {sessions.map(session => (
                                <label
                                    key={session.id}
                                    className={`
                    flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                    ${session.completed
                                            ? 'bg-emerald-500/10 border-emerald-500/30'
                                            : 'bg-tokens-bg border-tokens-border hover:bg-tokens-panel2'}
                  `}
                                >
                                    <input
                                        type="checkbox"
                                        checked={session.completed}
                                        onChange={() => toggleSession(session.id)}
                                        className="w-5 h-5 rounded border-tokens-border text-emerald-500 focus:ring-emerald-500/20 bg-tokens-bg cursor-pointer"
                                    />
                                    <span className={`text-sm ${session.completed ? 'text-emerald-600/80 dark:text-emerald-400/80 line-through' : 'text-tokens-fg'}`}>
                                        {session.label}
                                    </span>
                                </label>
                            ))}
                        </div>

                        <div className="mt-auto border-t border-tokens-border pt-6">
                            <Button
                                variant="primary"
                                size="lg"
                                fullWidth
                                onClick={saveSnapshot}
                                className="shadow-lg shadow-tokens-brand-DEFAULT/20"
                            >
                                <span>Save Snapshot</span>
                                <span className="text-xs bg-black/20 px-1.5 py-0.5 rounded border border-white/10 ml-2">(Mock)</span>
                            </Button>
                        </div>
                    </Card>

                    {/* Project Hub Tasks (Today) */}
                    {projectHubTasks.length > 0 && (
                        <Card title={
                            <div className="flex items-center gap-2">
                                <Briefcase size={16} className="text-tokens-brand-DEFAULT" />
                                <span>Project Hub Tasks (Today)</span>
                            </div>
                        }>
                            <div className="flex flex-col gap-2">
                                {projectHubTasks.map(task => (
                                    <label
                                        key={task.id}
                                        className={`
                                            flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all
                                            ${task.done
                                                ? 'bg-emerald-500/10 border-emerald-500/30'
                                                : 'bg-tokens-bg border-tokens-border hover:bg-tokens-panel2'}
                                        `}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={task.done}
                                            onChange={() => handleToggleProjectHubTask(task.id)}
                                            className="mt-0.5 w-5 h-5 rounded border-tokens-border text-tokens-brand-DEFAULT focus:ring-tokens-brand-DEFAULT/20 bg-tokens-bg cursor-pointer"
                                        />
                                        <div className="flex-1">
                                            <span className={`text-sm block ${task.done ? 'text-emerald-600/80 dark:text-emerald-400/80 line-through' : 'text-tokens-fg'}`}>
                                                {task.title}
                                            </span>
                                            <span className="text-xs text-tokens-muted">
                                                {task.stepTitle} - {task.projectName}
                                            </span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </Card>
                    )}

                </div>
            </div>
        </PageContainer>
    );
}
