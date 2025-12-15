import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Target, Play, Square, Trash2, Database, TestTube } from 'lucide-react';
import { PageContainer } from '../components/PageContainer';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import {
    getTodayTasks,
    toggleTaskDone,
    ProjectHubTask
} from '../stores/projectHubTasksStore';
import {
    getFinishSession,
    isActiveToday,
    toggleAction,
    startSession,
    endSession,
    clearSession,
    FinishSession,
} from '../stores/finishModeStore';
import { useGesuSettings } from '../lib/gesuSettings';
import {
    listSnapshots,
    appendSnapshot,
    getStorageMode,
    CompassSnapshotListItem,
} from '../services/compassSnapshotsService';

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
    // Settings
    const { settings } = useGesuSettings();
    const workflowRoot = settings?.paths?.workflowRoot;

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

    // Recent Snapshots State
    const [recentSnapshots, setRecentSnapshots] = useState<CompassSnapshotListItem[]>([]);
    const [snapshotsLoading, setSnapshotsLoading] = useState(true);

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

    // Load recent snapshots on mount
    const loadRecentSnapshots = useCallback(async () => {
        setSnapshotsLoading(true);
        try {
            const snapshots = await listSnapshots(workflowRoot, 10);
            setRecentSnapshots(snapshots);
        } catch (err) {
            console.error('Failed to load recent snapshots:', err);
        } finally {
            setSnapshotsLoading(false);
        }
    }, [workflowRoot]);

    useEffect(() => {
        loadRecentSnapshots();
    }, [loadRecentSnapshots]);

    // Handler for toggling project hub task
    const handleToggleProjectHubTask = useCallback((taskId: string) => {
        toggleTaskDone(taskId);
        setProjectHubTasks(getTodayTasks());
    }, []);

    // --- Finish Mode State ---
    const [finishSession, setFinishSession] = useState<FinishSession | null>(null);

    // Load Finish Mode session on mount and refresh periodically
    useEffect(() => {
        const loadSession = () => {
            if (isActiveToday()) {
                setFinishSession(getFinishSession());
            } else {
                setFinishSession(null);
            }
        };
        loadSession();
        const interval = setInterval(loadSession, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleToggleFinishAction = useCallback((actionId: string) => {
        toggleAction(actionId);
        setFinishSession(getFinishSession());
    }, []);

    const handleStartSession = useCallback(() => {
        startSession();
        setFinishSession(getFinishSession());
    }, []);

    const handleEndSession = useCallback(() => {
        endSession();
        setFinishSession(getFinishSession());
    }, []);

    const handleClearSession = useCallback(() => {
        if (confirm('Hapus Finish Mode session ini? Ini tidak bisa dibatalkan.')) {
            clearSession();
            setFinishSession(null);
        }
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

    const saveSnapshot = async () => {
        try {
            // Calculate focus from focusAreas average (meaningful representation)
            const focusValues = Object.values(focusAreas);
            const focus = Math.round(
                focusValues.reduce((sum, val) => sum + val, 0) / focusValues.length
            );

            // Get completed sessions only
            const completedSessions = sessions
                .filter(s => s.completed)
                .map(s => s.label);

            const result = await appendSnapshot(workflowRoot, {
                energy,
                focus, // Focus derived from focusAreas average
                sessions: completedSessions,
            });

            if (result.ok) {
                alert('Snapshot saved successfully!');
                // Refresh the recent snapshots list
                await loadRecentSnapshots();
            } else {
                alert(`Failed to save snapshot: ${result.error}`);
            }
        } catch (err) {
            console.error('Failed to save snapshot:', err);
            alert('Failed to save snapshot.');
        }
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

            {/* Finish Mode Card - Top when active */}
            {finishSession && (
                <Card
                    title={
                        <div className="flex items-center gap-2">
                            <Target size={18} className="text-amber-500" />
                            <span className="text-amber-500">Finish Mode</span>
                        </div>
                    }
                    className="mb-6 border-amber-500/30 bg-amber-500/5"
                >
                    <div className="space-y-4">
                        {/* Current Step */}
                        <div>
                            <p className="text-xs text-tokens-muted mb-1">Current Step</p>
                            <p className="text-sm font-medium text-tokens-fg">{finishSession.stepTitle}</p>
                            <p className="text-xs text-tokens-muted">{finishSession.projectName}</p>
                        </div>

                        {/* Actions Checklist */}
                        <div>
                            <p className="text-xs text-tokens-muted mb-2">Actions ({finishSession.actions.filter(a => a.done).length}/{finishSession.actions.length})</p>
                            <div className="space-y-2">
                                {finishSession.actions.map(action => (
                                    <label
                                        key={action.id}
                                        className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all
                                            ${action.done
                                                ? 'bg-emerald-500/10 border-emerald-500/30'
                                                : 'bg-tokens-bg border-tokens-border hover:bg-tokens-panel2'}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={action.done}
                                            onChange={() => handleToggleFinishAction(action.id)}
                                            className="w-4 h-4 rounded border-tokens-border text-amber-500 focus:ring-amber-500/20 bg-tokens-bg cursor-pointer"
                                        />
                                        <span className={`text-sm ${action.done ? 'text-emerald-600/80 dark:text-emerald-400/80 line-through' : 'text-tokens-fg'}`}>
                                            {action.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Guidance */}
                        <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2 rounded">
                            Selesaikan 3 aksi ini sebelum menambah task baru.
                        </p>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            {!finishSession.startedAt ? (
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={handleStartSession}
                                    icon={<Play size={14} />}
                                    className="flex-1 !bg-amber-500 hover:!bg-amber-600"
                                >
                                    Start Session
                                </Button>
                            ) : !finishSession.endedAt ? (
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={handleEndSession}
                                    icon={<Square size={14} />}
                                    className="flex-1"
                                >
                                    End Session
                                </Button>
                            ) : (
                                <span className="text-xs text-emerald-600 dark:text-emerald-400 flex-1 text-center py-2">
                                    Session completed!
                                </span>
                            )}
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={handleClearSession}
                                icon={<Trash2 size={14} />}
                            >
                                Clear
                            </Button>
                        </div>

                        {/* Link to Project Hub */}
                        <Link
                            to={`/initiator?stepId=${finishSession.stepId}`}
                            className="text-xs text-tokens-brand-DEFAULT hover:underline block text-center"
                        >
                            Open in Project Hub
                        </Link>
                    </div>
                </Card>
            )}

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
                            <div className="flex items-center gap-2 mb-2">
                                {getStorageMode(workflowRoot) === 'file-backed' ? (
                                    <Badge variant="success" className="text-xs">
                                        <Database size={12} className="mr-1" />
                                        File-backed
                                    </Badge>
                                ) : (
                                    <Badge variant="warning" className="text-xs">
                                        <TestTube size={12} className="mr-1" />
                                        Simulation
                                    </Badge>
                                )}
                                {!workflowRoot && (
                                    <span className="text-xs text-tokens-muted">
                                        <Link to="/settings" className="text-tokens-brand-DEFAULT hover:underline">
                                            Set Workflow Root in Settings
                                        </Link>
                                    </span>
                                )}
                            </div>
                            <Button
                                variant="primary"
                                size="lg"
                                fullWidth
                                onClick={saveSnapshot}
                                className="shadow-lg shadow-tokens-brand-DEFAULT/20"
                            >
                                Save Snapshot
                            </Button>
                        </div>
                    </Card>

                    {/* Recent Snapshots Card */}
                    <Card
                        title={
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
                                Recent Snapshots
                            </div>
                        }
                        className="flex flex-col"
                    >
                        {snapshotsLoading ? (
                            <div className="text-sm text-tokens-muted text-center py-4">
                                Loading snapshots...
                            </div>
                        ) : recentSnapshots.length === 0 ? (
                            <div className="text-sm text-tokens-muted text-center py-4">
                                No snapshots yet. Save your first snapshot!
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
                                {recentSnapshots.map((snapshot) => {
                                    const date = new Date(snapshot.timestamp);
                                    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

                                    return (
                                        <div
                                            key={snapshot.id}
                                            className="p-3 rounded-lg border border-tokens-border bg-tokens-bg hover:bg-tokens-panel2 transition-colors"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="text-xs text-tokens-muted">
                                                    {dateStr} at {timeStr}
                                                </div>
                                                <div className="flex gap-1">
                                                    <Badge
                                                        variant={snapshot.energy >= 7 ? 'success' : snapshot.energy >= 4 ? 'warning' : 'error'}
                                                        className="text-xs"
                                                    >
                                                        Energy {snapshot.energy}/10
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="text-xs text-tokens-muted">
                                                Focus: {snapshot.focus}/10 • {snapshot.sessions.length} session{snapshot.sessions.length !== 1 ? 's' : ''} completed
                                            </div>
                                            {snapshot.sessions.length > 0 && (
                                                <div className="mt-2 flex flex-wrap gap-1">
                                                    {snapshot.sessions.slice(0, 3).map((session, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded"
                                                        >
                                                            {session}
                                                        </span>
                                                    ))}
                                                    {snapshot.sessions.length > 3 && (
                                                        <span className="text-xs text-tokens-muted px-2 py-0.5">
                                                            +{snapshot.sessions.length - 3} more
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Card>



                </div>
            </div>
        </PageContainer >
    );
}
