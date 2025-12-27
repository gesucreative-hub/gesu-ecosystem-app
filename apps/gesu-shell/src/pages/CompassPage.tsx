import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Briefcase, Target, Play, Square, Trash2, Database, ChevronDown, ChevronUp, Zap, Info, X, Rocket } from 'lucide-react';
import { calculateInferredEnergy, getEnergyColorClass } from '../utils/inferredEnergy';
import { PageContainer } from '../components/PageContainer';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { useConfirmDialog } from '../components/ConfirmDialog';
import { useAlertDialog } from '../components/AlertDialog';
import { ESparkline } from '../components/charts/ESparkline';
import { ERadarChart } from '../components/charts/ERadarChart';
import { useSessionTimer } from '../hooks/useSessionTimer';
import {
    getTodayTasks,
    toggleTaskDone,
    removeTask,
    updateTaskNextAction,
    ProjectHubTask
} from '../stores/projectHubTasksStore';
import {
    getFinishSession,
    isActiveToday,
    toggleAction,
    startSession,
    endSession,
    clearSession,
    getAllActionsCompleted,
    FinishSession,
} from '../stores/finishModeStore';
import { useGesuSettings } from '../lib/gesuSettings';
import { useAuth } from '../contexts/AuthContext';
import { useUserSettings } from '../hooks/useUserSettings';

import {
    listSnapshots,
    appendSnapshot,
    deleteSnapshot,
    getStorageMode,
    CompassSnapshotListItem,
} from '../services/compassSnapshotsService';
import { startWithTask, isSessionActive as isTimerActive, getState as getTimerState } from '../stores/focusTimerStore';
import { getTodayCheckIn, updateTodayTopFocus } from '../stores/dailyCheckInStore';
import { listProjects } from '../stores/projectStore';
import { getRemainingSlots } from '../utils/taskGuardrail';

// --- Types & Interfaces ---

interface FocusAreas {
    [key: string]: number;
}

// Domain key mapping for i18n translation
const DOMAIN_KEY_MAP: Record<string, string> = {
    'Money': 'money',
    'Creative': 'creative',
    'Relations': 'relations',
    'Learning': 'learning',
    'Content': 'content',
    'Self Care': 'selfCare'
};
// --- Main Component ---

export function CompassPage() {
    // Auth & Workspace
    const { workspace } = useAuth();
    const workflowRoot = workspace?.workspacePath; // User-specific workspace path

    // i18n
    const { t, i18n } = useTranslation('compass');
    const dateLocale = i18n.language === 'id' ? 'id-ID' : 'en-US';

    // Settings (for other configurations)
    useGesuSettings();

    // Navigation
    const navigate = useNavigate();

    // Dialog Hooks
    const { confirm, ConfirmDialogComponent } = useConfirmDialog();
    const { alert, AlertDialogComponent } = useAlertDialog();

    // User settings (per-user defaults) - available for future use
    useUserSettings();

    // State - Energy as 1-10 slider (initialized from user settings)
    const [energyLevel, setEnergyLevel] = useState<number>(5);

    // State - Optional note for context
    const [energyNote, setEnergyNote] = useState<string>('');

    // State - Focus areas (initialized from user settings)
    const [focusAreas, setFocusAreas] = useState<FocusAreas>(() => {
        try {
            const saved = localStorage.getItem('compass_last_focus');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch {
            // Fall through to default
        }
        return {
            'Money': 5,
            'Creative': 5,
            'Relations': 5,
            'Learning': 5,
            'Content': 5,
            'Self Care': 5
        };
    });

    // Focus details expanded/collapsed
    const [isFocusExpanded, setIsFocusExpanded] = useState(false);

    // Recent Snapshots State
    const [recentSnapshots, setRecentSnapshots] = useState<CompassSnapshotListItem[]>([]);
    const [snapshotsLoading, setSnapshotsLoading] = useState(true);
    const [showClearDropdown, setShowClearDropdown] = useState(false);
    const [selectedSnapshot, setSelectedSnapshot] = useState<CompassSnapshotListItem | null>(null);

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

    // --- S1-2b: Focus First State ---
    const [focusFirstMode, setFocusFirstMode] = useState<'select' | 'text'>('select');
    const [selectedFocusType, setSelectedFocusType] = useState<'project' | 'task' | 'text'>('text');
    const [selectedRefId, setSelectedRefId] = useState<string>('');
    const [selectedText, setSelectedText] = useState<string>('');
    const [microStep, setMicroStep] = useState<string>(''); // Resets every session
    const [focusFirstLoading, setFocusFirstLoading] = useState(false);

    // Get check-in and project data for Focus First
    const todayCheckIn = useMemo(() => getTodayCheckIn(), [projectHubTasks]); // Refresh when tasks change
    const activeProjects = useMemo(() => listProjects(), []);
    const timerActive = isTimerActive();
    const timerState = getTimerState();
    const remainingSlots = getRemainingSlots();
    const wipAtLimit = remainingSlots === 0;

    // Initialize FocusFirst selection from today's check-in
    useEffect(() => {
        if (todayCheckIn) {
            setSelectedFocusType(todayCheckIn.topFocusType);
            setSelectedRefId(todayCheckIn.topFocusRefId || '');
            setSelectedText(todayCheckIn.topFocusText || '');
            setFocusFirstMode(todayCheckIn.topFocusType === 'text' ? 'text' : 'select');
        }
    }, [todayCheckIn]);

    // Resolve display label for current focus selection
    const getFocusDisplayLabel = useCallback((): string => {
        if (selectedFocusType === 'text') {
            return selectedText || t('compass:focusFirst.typeManually');
        }
        if (selectedFocusType === 'project' && selectedRefId) {
            const project = activeProjects.find(p => p.id === selectedRefId);
            return project?.name || selectedRefId;
        }
        if (selectedFocusType === 'task' && selectedRefId) {
            const task = projectHubTasks.find(t => t.id === selectedRefId);
            return task?.title || selectedRefId;
        }
        return '';
    }, [selectedFocusType, selectedRefId, selectedText, activeProjects, projectHubTasks, t]);

    // Check if user can start focus (WIP enforcement)
    const canStartFocus = useCallback((): boolean => {
        // If timer already active, user can always switch
        if (timerActive) return true;
        // If WIP at limit, can only start on existing active task
        if (wipAtLimit) {
            return selectedFocusType === 'task' && projectHubTasks.some(t => t.id === selectedRefId && !t.done);
        }
        // Has valid focus selection
        return (selectedFocusType === 'text' && selectedText.trim().length > 0) ||
               (selectedFocusType !== 'text' && selectedRefId.length > 0);
    }, [timerActive, wipAtLimit, selectedFocusType, selectedRefId, selectedText, projectHubTasks]);

    // Handle starting focus
    const handleStartFocusFirst = useCallback(async () => {
        if (!canStartFocus()) return;
        setFocusFirstLoading(true);

        try {
            // Build TaskContext
            const displayLabel = getFocusDisplayLabel();
            const taskContext = {
                taskId: selectedRefId || `focus-${Date.now()}`,
                taskTitle: displayLabel,
                projectName: selectedFocusType === 'project' 
                    ? activeProjects.find(p => p.id === selectedRefId)?.name 
                    : selectedFocusType === 'task' 
                        ? projectHubTasks.find(t => t.id === selectedRefId)?.projectName
                        : undefined,
            };

            // Start timer with context and sessionGoal (micro-step)
            await startWithTask(taskContext, { focusMinutes: 25 });

            // Update daily check-in topFocus if user made a change
            if (!todayCheckIn || 
                todayCheckIn.topFocusType !== selectedFocusType ||
                todayCheckIn.topFocusRefId !== selectedRefId ||
                todayCheckIn.topFocusText !== selectedText) {
                updateTodayTopFocus(
                    selectedFocusType,
                    selectedFocusType !== 'text' ? selectedRefId : undefined,
                    selectedFocusType === 'text' ? selectedText : undefined
                );
            }

            // Reset micro-step for next session
            setMicroStep('');
        } finally {
            setFocusFirstLoading(false);
        }
    }, [canStartFocus, getFocusDisplayLabel, selectedFocusType, selectedRefId, selectedText, activeProjects, projectHubTasks, todayCheckIn]);

    // Inferred Energy - calculated from activity data (depends on projectHubTasks)
    const inferredEnergy = useMemo(() => calculateInferredEnergy(), [projectHubTasks]);

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

    // Handler for deleting a snapshot
    const handleDeleteSnapshot = useCallback(async (snapshotId: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent opening detail modal
        
        if (await confirm({
            title: 'Delete Snapshot?',
            message: 'This will permanently delete this snapshot. This action cannot be undone.',
            confirmLabel: 'Delete',
            type: 'warning'
        })) {
            const success = await deleteSnapshot(workflowRoot, snapshotId);
            if (success) {
                await loadRecentSnapshots();
            }
        }
    }, [confirm, workflowRoot, loadRecentSnapshots]);

    // Handler for toggling project hub task
    const handleToggleProjectHubTask = useCallback((taskId: string) => {
        toggleTaskDone(taskId);
        setProjectHubTasks(getTodayTasks());
    }, []);

    const handleRemoveTask = useCallback(async (taskId: string) => {
        if (await confirm({
            title: 'Remove Task?',
            message: 'Remove this task from today\'s list?',
            confirmLabel: 'Remove',
            type: 'warning'
        })) {
            removeTask(taskId);
            setProjectHubTasks(getTodayTasks());
        }
    }, [confirm]);

    // Handler for starting focus timer with task context
    const handleStartFocusOnTask = useCallback(async (task: ProjectHubTask) => {
        // Check if a session is already active
        if (isTimerActive()) {
            if (await confirm({
                title: 'Switch focus task?',
                message: 'A focus session is already running. Switch to this task?',
                type: 'warning',
                confirmLabel: 'Switch'
            })) {
                startWithTask({
                    taskId: task.id,
                    taskTitle: task.title,
                    projectName: task.projectName,
                    stepTitle: task.stepTitle,
                });
            }
            return;
        }

        // Start timer with task context
        startWithTask({
            taskId: task.id,
            taskTitle: task.title,
            projectName: task.projectName,
            stepTitle: task.stepTitle,
        });
    }, [confirm]);

    // --- Finish Mode State ---
    const [finishSession, setFinishSession] = useState<FinishSession | null>(null);
    const sessionDuration = useSessionTimer(finishSession?.startedAt); // Hook for elapsed time

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

    const handleClearSession = useCallback(async () => {
        if (await confirm({
            title: 'Clear session?',
            message: 'Delete this Finish Mode session? This cannot be undone.',
            type: 'danger',
            confirmLabel: 'Clear Session'
        })) {
            clearSession();
            setFinishSession(null);
        }
    }, [confirm]);

    // Handle focus change for focus areas
    const handleFocusChange = (area: string, val: string) => {
        setFocusAreas(prev => ({ ...prev, [area]: parseInt(val) }));
    };

    const saveSnapshot = async () => {
        try {
            // Energy is already numeric (1-10)
            const energy = energyLevel;

            // Calculate focus from focusAreas average (meaningful representation)
            const focusValues = Object.values(focusAreas);
            const focus = Math.round(
                focusValues.reduce((sum, val) => sum + val, 0) / focusValues.length
            );

            // No more sessions - removed in Sprint 19
            const completedSessions: string[] = [];

            const result = await appendSnapshot(workflowRoot, {
                energy,
                focus, // Focus derived from focusAreas average
                sessions: completedSessions,
                note: energyNote.trim() || undefined, // Only include if not empty
                focusAreas, // Include individual focus areas for radar chart
            });

            if (result.ok) {
                alert({ title: t('common:alerts.success', 'Success'), message: t('common:alerts.snapshotSaved', 'Snapshot saved successfully!'), type: 'success' });

                // Preserve current state in localStorage
                try {
                    localStorage.setItem('compass_last_energy', energyLevel.toString());
                    localStorage.setItem('compass_last_focus', JSON.stringify(focusAreas));
                    localStorage.setItem('compass_last_note', energyNote);
                } catch (err) {
                    console.error('Failed to save compass state:', err);
                }

                // Clear note after successful save
                setEnergyNote('');
                // Refresh the recent snapshots list
                await loadRecentSnapshots();
            } else {
                alert({ title: t('common:alerts.error', 'Error'), message: t('common:alerts.failedWithReason', 'Failed: {{reason}}', { reason: result.error }), type: 'error' });
            }
        } catch (err) {
            console.error('Failed to save snapshot:', err);
            alert({ title: t('common:alerts.error', 'Error'), message: t('common:alerts.snapshotSaveFailed', 'Failed to save snapshot.'), type: 'error' });
        }
    };

    // Calculate derived focus score for summary
    const derivedFocusScore = Math.round(
        Object.values(focusAreas).reduce((sum, val) => sum + val, 0) / Object.keys(focusAreas).length
    );

    // Categorize snapshots by time
    const categorizedSnapshots = useMemo(() => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);

        return {
            today: recentSnapshots.filter(s => new Date(s.timestamp) >= today),
            yesterday: recentSnapshots.filter(s => {
                const date = new Date(s.timestamp);
                return date >= yesterday && date < today;
            }),
            lastWeek: recentSnapshots.filter(s => {
                const date = new Date(s.timestamp);
                return date >= lastWeek && date < yesterday;
            }),
            older: recentSnapshots.filter(s => new Date(s.timestamp) < lastWeek)
        };
    }, [recentSnapshots]);

    // --- Insights Logic ---
    const burnoutRisk = derivedFocusScore >= 8 && energyLevel <= 4;
    const flowState = derivedFocusScore >= 7 && energyLevel >= 7;

    return (
        <>
            <PageContainer>
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-tokens-fg tracking-tight">{t('title')}</h1>
                        <p className="text-tokens-muted text-sm mt-1">{t('subtitle')}</p>
                    </div>

                    {/* State Badges (Flow / Burnout) */}
                    <div className="flex gap-2">
                        {burnoutRisk && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full animate-pulse">
                                <Zap size={14} className="text-red-500" />
                                <span className="text-xs font-semibold text-red-500">{t('insights.burnoutRisk')}</span>
                            </div>
                        )}
                        {flowState && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-tokens-brand-DEFAULT/10 border border-tokens-brand-DEFAULT/20 rounded-full">
                                <ESparkline data={[1, 2, 4, 3, 5, 8, 9, 8, 10]} width={20} height={10} color="#22c55e" showTooltip={false} />
                                <span className="text-xs font-semibold text-tokens-brand-DEFAULT">{t('insights.flowState')}</span>
                            </div>
                        )}
                        <Link to="/initiator?tab=workflow" className="ml-2 px-4 py-2 bg-tokens-panel border border-tokens-border hover:bg-tokens-panel2 text-tokens-fg rounded-lg text-sm transition-colors">
                            ← {t('common:nav.projectHub', 'Workflow')}
                        </Link>
                        
                        {/* Clear Data Dropdown */}
                        <div className="relative ml-2">
                            <button
                                onClick={() => setShowClearDropdown(!showClearDropdown)}
                                className="p-2 bg-tokens-panel border border-tokens-border hover:bg-tokens-panel2 text-tokens-muted hover:text-tokens-fg rounded-lg transition-colors"
                                title={t('compass:tooltips.clearHistory', 'Clear history')}
                            >
                                <Trash2 size={16} />
                            </button>
                            {showClearDropdown && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-tokens-panel border border-tokens-border rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                    <div className="px-3 py-2 text-xs font-semibold text-tokens-muted uppercase tracking-wider border-b border-tokens-border">
                                        {t('clearData.title')}
                                    </div>
                                    {[
                                        { key: 'today', labelKey: 'clearData.todayOnly', label: 'Today only', descKey: 'clearData.todayDesc', desc: 'Sessions from today', filter: (s: CompassSnapshotListItem) => new Date(s.timestamp) >= new Date(new Date().setHours(0,0,0,0)) },
                                        { key: 'week', labelKey: 'clearData.last7Days', label: 'Last 7 days', descKey: 'clearData.last7DaysDesc', desc: 'Sessions from this week', filter: (s: CompassSnapshotListItem) => new Date(s.timestamp) >= new Date(Date.now() - 7*24*60*60*1000) },
                                        { key: 'month', labelKey: 'clearData.last30Days', label: 'Last 30 days', descKey: 'clearData.last30DaysDesc', desc: 'Sessions from this month', filter: (s: CompassSnapshotListItem) => new Date(s.timestamp) >= new Date(Date.now() - 30*24*60*60*1000) },
                                        { key: 'all', labelKey: 'clearData.allData', label: 'All data', descKey: 'clearData.allDataDesc', desc: 'Delete everything', filter: () => true },
                                    ].map(option => (
                                        <button
                                            key={option.key}
                                            onClick={async () => {
                                                setShowClearDropdown(false);
                                                const toDelete = recentSnapshots.filter(option.filter);
                                                if (toDelete.length === 0) {
                                                    alert({ title: t('common:status.noData', 'No data'), message: t('compass:clearData.noSnapshots', 'No snapshots to delete for this period.'), type: 'info' });
                                                    return;
                                                }
                                                const confirmed = await confirm({
                                                    title: t('compass:clearData.deleteSnapshotsTitle', { count: toDelete.length }),
                                                    message: t('compass:clearData.deleteSnapshotsMessage', { label: t(option.labelKey, option.label).toLowerCase() }),
                                                    confirmLabel: t('common:buttons.delete', 'Delete'),
                                                    type: 'danger'
                                                });
                                                if (confirmed) {
                                                    for (const s of toDelete) {
                                                        await deleteSnapshot(workflowRoot, s.id);
                                                    }
                                                    setRecentSnapshots(prev => prev.filter(s => !toDelete.some(d => d.id === s.id)));
                                                    alert({ title: t('common:status.deleted', 'Deleted'), message: t('compass:clearData.snapshotsDeleted', { count: toDelete.length }), type: 'success' });
                                                }
                                            }}
                                            className="w-full px-3 py-2 text-left hover:bg-tokens-panel2 transition-colors"
                                        >
                                            <div className="text-sm text-tokens-fg">{t(option.labelKey, option.label)}</div>
                                            <div className="text-[10px] text-tokens-muted">{t(option.descKey, option.desc)}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3-COLUMN LAYOUT (Responsive) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">

                    {/* LEFT COLUMN (Main Action & Inputs) - Spans 7 cols */}
                    <div className="lg:col-span-7 space-y-6">

                        {/* S1-2b: Focus First Card */}
                        <Card
                            title={
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-2">
                                        <Rocket size={18} className="text-tokens-brand-DEFAULT" />
                                        <span>{t('compass:focusFirst.title')}</span>
                                    </div>
                                    {timerActive && (
                                        <Badge variant="success" className="animate-pulse">
                                            {t('compass:focusFirst.focusActive')}
                                        </Badge>
                                    )}
                                    {wipAtLimit && !timerActive && (
                                        <Badge variant="warning">
                                            {t('compass:focusFirst.wipAtLimit')}
                                        </Badge>
                                    )}
                                    {todayCheckIn && !timerActive && !wipAtLimit && (
                                        <Badge variant="neutral" className="text-xs">
                                            {t('compass:focusFirst.fromCheckIn')}
                                        </Badge>
                                    )}
                                </div>
                            }
                            className={timerActive ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-tokens-brand-DEFAULT/30'}
                        >
                            <div className="space-y-4">
                                {/* Timer Active State */}
                                {timerActive && timerState.taskContext && (
                                    <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-lg">
                                        <p className="text-xs text-tokens-muted mb-1">{t('compass:focusFirst.focusActiveDesc')}</p>
                                        <p className="text-lg font-medium text-tokens-fg">{timerState.taskContext.taskTitle}</p>
                                        {timerState.taskContext.projectName && (
                                            <p className="text-xs text-tokens-muted">{timerState.taskContext.projectName}</p>
                                        )}
                                    </div>
                                )}

                                {/* Step 1: Today's Focus */}
                                {!timerActive && (
                                    <>
                                        <div>
                                            <label className="text-xs font-bold text-tokens-muted uppercase tracking-wider mb-2 block">
                                                {t('compass:focusFirst.step1')}
                                            </label>
                                            
                                            {/* Mode selector: Select vs Text */}
                                            <div className="flex gap-2 mb-2">
                                                <button
                                                    onClick={() => { setFocusFirstMode('select'); setSelectedFocusType('project'); }}
                                                    className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                                                        focusFirstMode === 'select' 
                                                            ? 'bg-tokens-brand-DEFAULT/10 border-tokens-brand-DEFAULT text-tokens-brand-DEFAULT' 
                                                            : 'bg-tokens-bg border-tokens-border text-tokens-muted hover:bg-tokens-panel2'
                                                    }`}
                                                >
                                                    {t('compass:focusFirst.selectProject')}
                                                </button>
                                                <button
                                                    onClick={() => { setFocusFirstMode('text'); setSelectedFocusType('text'); }}
                                                    className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                                                        focusFirstMode === 'text' 
                                                            ? 'bg-tokens-brand-DEFAULT/10 border-tokens-brand-DEFAULT text-tokens-brand-DEFAULT' 
                                                            : 'bg-tokens-bg border-tokens-border text-tokens-muted hover:bg-tokens-panel2'
                                                    }`}
                                                >
                                                    {t('compass:focusFirst.orTypeManually')}
                                                </button>
                                            </div>

                                            {/* Select mode: Project or Task dropdown */}
                                            {focusFirstMode === 'select' && (
                                                <div className="space-y-2">
                                                    {/* Project selection */}
                                                    <select
                                                        value={selectedFocusType === 'project' ? selectedRefId : ''}
                                                        onChange={(e) => {
                                                            setSelectedFocusType('project');
                                                            setSelectedRefId(e.target.value);
                                                        }}
                                                        className="w-full px-3 py-2 text-sm bg-tokens-bg border border-tokens-border rounded-lg focus:outline-none focus:ring-2 focus:ring-tokens-ring text-tokens-fg"
                                                    >
                                                        <option value="">{t('compass:focusFirst.selectProject')}</option>
                                                        {activeProjects.map(p => (
                                                            <option key={p.id} value={p.id}>{p.name}</option>
                                                        ))}
                                                    </select>

                                                    {/* Task selection (for WIP limit case) */}
                                                    {projectHubTasks.filter(t => !t.done).length > 0 && (
                                                        <select
                                                            value={selectedFocusType === 'task' ? selectedRefId : ''}
                                                            onChange={(e) => {
                                                                setSelectedFocusType('task');
                                                                setSelectedRefId(e.target.value);
                                                            }}
                                                            className="w-full px-3 py-2 text-sm bg-tokens-bg border border-tokens-border rounded-lg focus:outline-none focus:ring-2 focus:ring-tokens-ring text-tokens-fg"
                                                        >
                                                            <option value="">{t('compass:focusFirst.selectTask')}</option>
                                                            {projectHubTasks.filter(t => !t.done).map(task => (
                                                                <option key={task.id} value={task.id}>{task.title}</option>
                                                            ))}
                                                        </select>
                                                    )}
                                                </div>
                                            )}

                                            {/* Text mode: Free text input */}
                                            {focusFirstMode === 'text' && (
                                                <input
                                                    type="text"
                                                    value={selectedText}
                                                    onChange={(e) => setSelectedText(e.target.value)}
                                                    placeholder={t('compass:focusFirst.typeManually')}
                                                    className="w-full px-3 py-2 text-sm bg-tokens-bg border border-tokens-border rounded-lg focus:outline-none focus:ring-2 focus:ring-tokens-ring text-tokens-fg placeholder:text-tokens-muted/50"
                                                />
                                            )}
                                        </div>

                                        {/* Step 2: Micro-step (Quick Win) */}
                                        <div>
                                            <label className="text-xs font-bold text-tokens-muted uppercase tracking-wider mb-2 block">
                                                {t('compass:focusFirst.step2')} <span className="font-normal">(optional)</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={microStep}
                                                onChange={(e) => setMicroStep(e.target.value)}
                                                placeholder={t('compass:focusFirst.step2Placeholder')}
                                                className="w-full px-3 py-2 text-sm bg-tokens-bg border border-tokens-border rounded-lg focus:outline-none focus:ring-2 focus:ring-tokens-ring text-tokens-fg placeholder:text-tokens-muted/50"
                                            />
                                        </div>

                                        {/* WIP Warning */}
                                        {wipAtLimit && selectedFocusType !== 'task' && (
                                            <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg">
                                                <p className="text-xs text-amber-600 dark:text-amber-400">
                                                    <strong>{t('compass:focusFirst.wipAtLimit')}:</strong> {t('compass:focusFirst.wipAtLimitDesc')}
                                                </p>
                                            </div>
                                        )}

                                        {/* Step 3: Start Focus Button */}
                                        <Button
                                            variant="primary"
                                            size="lg"
                                            fullWidth
                                            onClick={handleStartFocusFirst}
                                            disabled={!canStartFocus() || focusFirstLoading}
                                            icon={<Play size={18} />}
                                            className="!py-3"
                                        >
                                            {focusFirstLoading ? t('compass:focusFirst.starting') : t('compass:focusFirst.startFocus')}
                                        </Button>
                                    </>
                                )}
                            </div>
                        </Card>

                        {/* Finish Mode Card - Priority */}
                        {finishSession && (
                            <Card
                                title={
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-2">
                                            <Target size={18} className="text-amber-500" />
                                            <span className="text-amber-500 font-bold">{t('compass:finishMode.active')}</span>
                                        </div>
                                        {/* Session Timer */}
                                        {finishSession.startedAt && !finishSession.endedAt && (
                                            <Badge variant="warning" className="animate-pulse">
                                                {t('compass:finishMode.activeTimer', 'Active')}: {sessionDuration}
                                            </Badge>
                                        )}
                                    </div>
                                }
                                className="border-amber-500/30 bg-amber-500/5 shadow-lg shadow-amber-500/5"
                            >
                                <div className="space-y-4">
                                    {/* Current Step */}
                                    <div className="bg-tokens-bg/50 p-3 rounded-lg border border-tokens-border/50">
                                        <p className="text-xs text-tokens-muted mb-1">{t('compass:finishMode.currentObjective', 'CURRENT OBJECTIVE')}</p>
                                        <p className="text-lg font-medium text-tokens-fg">{finishSession.stepTitle}</p>
                                        <p className="text-xs text-tokens-muted mt-0.5">{finishSession.projectName}</p>
                                    </div>

                                    {/* Actions Checklist */}
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="text-xs text-tokens-muted font-bold tracking-wider">ACTIONS CHECKLIST</p>
                                            <span className="text-xs text-tokens-muted">
                                                {finishSession.actions.filter(a => a.done).length} / {finishSession.actions.length} Done
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            {finishSession.actions.map(action => (
                                                <label
                                                    key={action.id}
                                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                                                ${action.done
                                                            ? 'bg-emerald-500/10 border-emerald-500/30'
                                                            : 'bg-tokens-bg border-tokens-border hover:bg-tokens-panel2'}`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={action.done}
                                                        onChange={() => handleToggleFinishAction(action.id)}
                                                        className="w-5 h-5 rounded border-tokens-border text-amber-500 focus:ring-amber-500/20 bg-tokens-bg cursor-pointer"
                                                    />
                                                    <span className={`text-sm ${action.done ? 'text-emerald-600/80 dark:text-emerald-400/80 line-through' : 'text-tokens-fg'}`}>
                                                        {action.label}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Guidance or Completion Message */}
                                    {getAllActionsCompleted() ? (
                                        <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-lg mt-2">
                                            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 text-center mb-3">
                                                🎉 Objective Complete!
                                            </p>
                                            <Button
                                                variant="primary"
                                                size="md"
                                                fullWidth
                                                onClick={() => {
                                                    handleEndSession();
                                                    handleClearSession();
                                                }}
                                                className="!bg-emerald-500 hover:!bg-emerald-600 shadow-md shadow-emerald-500/20"
                                            >
                                                Complete Session & Clear
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="pt-2 border-t border-amber-500/20 mt-2">
                                            {/* Action Buttons */}
                                            <div className="flex gap-2 mt-2">
                                                {!finishSession.startedAt ? (
                                                    <Button
                                                        variant="primary"
                                                        size="md"
                                                        onClick={handleStartSession}
                                                        icon={<Play size={16} />}
                                                        className="flex-1"
                                                    >
                                                        Start Focusing
                                                    </Button>
                                                ) : !finishSession.endedAt ? (
                                                    <Button
                                                        variant="secondary"
                                                        size="md"
                                                        onClick={handleEndSession}
                                                        icon={<Square size={16} />}
                                                        className="flex-1"
                                                    >
                                                        Stop Timer
                                                    </Button>
                                                ) : (
                                                    <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex-1 text-center py-2 bg-emerald-500/10 rounded-lg">
                                                        Session Finished ({sessionDuration})
                                                    </span>
                                                )}
                                                <Button
                                                    variant="secondary"
                                                    size="md"
                                                    onClick={handleClearSession}
                                                    icon={<Trash2 size={16} />}
                                                    className="hover:text-red-500 hover:border-red-500/50"
                                                >
                                                    Clear
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        )}

                        {/* Energy Card - Enhanced Visuals */}
                        <Card title={
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                    <Zap size={18} className="text-tokens-brand-DEFAULT" />
                                    <span>{t('energyCalibration.title')}</span>
                                </div>
                                {/* Inferred Energy Badge */}
                                <div className="flex items-center gap-1.5 group relative px-2 py-1 bg-tokens-bg rounded-md border border-tokens-border">
                                    <span className="text-xs text-tokens-muted">{t('energyCalibration.inferred')}:</span>
                                    <span className={`text-sm font-bold ${getEnergyColorClass(inferredEnergy.score)}`}>
                                        {inferredEnergy.score}/10
                                    </span>
                                    <Info size={12} className="text-tokens-muted ml-1" />

                                    {/* Tooltip */}
                                    <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-tokens-bg border border-tokens-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                        <div className="text-xs font-medium text-tokens-fg mb-2 border-b border-tokens-border pb-1">
                                            Inferred Score Factors
                                        </div>
                                        <div className="space-y-2">
                                            {inferredEnergy.factors.map(factor => (
                                                <div key={factor.id} className="flex justify-between items-center text-xs">
                                                    <span className="text-tokens-muted">{factor.label}</span>
                                                    <span className={`font-mono ${getEnergyColorClass(factor.value)}`}>{factor.value}/10</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-2 text-[10px] text-tokens-muted italic">
                                            Based on activity, time & tasks.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        }>
                            {/* Manual Slider (1-10) */}
                            <div className="space-y-4 py-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-tokens-fg">{t('energyCalibration.howDoYouFeel')}</span>
                                    <span className={`text-3xl font-black ${getEnergyColorClass(energyLevel)} transition-colors duration-300`}>
                                        {energyLevel}
                                    </span>
                                </div>
                                <div className="relative h-6 flex items-center">
                                    <input
                                        type="range"
                                        min="1"
                                        max="10"
                                        value={energyLevel}
                                        onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
                                        className="w-full h-2 bg-gradient-to-r from-red-500 via-yellow-500 to-emerald-500 rounded-lg appearance-none cursor-pointer hover:h-3 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-tokens-ring"
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] uppercase tracking-wider font-medium text-tokens-muted">
                                    <span>{t('energyCalibration.exhausted')}</span>
                                    <span>{t('energyCalibration.neutral')}</span>
                                    <span>{t('energyCalibration.energized')}</span>
                                </div>
                            </div>

                            {/* Optional Note */}
                            <div className="space-y-2 mt-4 pt-4 border-t border-tokens-border/50">
                                <label className="text-xs font-medium text-tokens-muted uppercase tracking-wide">{t('contextNote.label')}</label>
                                <textarea
                                    value={energyNote}
                                    onChange={(e) => setEnergyNote(e.target.value)}
                                    placeholder={t('contextNote.placeholder')}
                                    className="w-full px-3 py-2 text-sm bg-tokens-bg border border-tokens-border rounded-lg focus:outline-none focus:ring-2 focus:ring-tokens-ring text-tokens-fg placeholder:text-tokens-muted/50 resize-none transition-shadow"
                                    rows={2}
                                />
                            </div>
                        </Card>

                        {/* Project Hub Tasks (Today) */}
                        <Card title={
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                    <Briefcase size={18} className="text-tokens-brand-DEFAULT" />
                                    <span>{t('tasks.title')}</span>
                                </div>
                                <Badge variant="neutral" className="ml-2">
                                    {projectHubTasks.filter(t => !t.done).length} {t('tasks.remaining')}
                                </Badge>
                            </div>
                        }>
                            {/* Active Tasks */}
                            {projectHubTasks.filter(t => !t.done).length > 0 ? (
                                <div className="flex flex-col gap-2">
                                    {projectHubTasks.filter(t => !t.done).map(task => (
                                        <div
                                            key={task.id}
                                            className="group flex flex-col gap-2 p-3 rounded-lg border transition-all bg-tokens-bg border-tokens-border hover:border-tokens-brand-DEFAULT/50 hover:shadow-sm"
                                        >
                                            <div className="flex items-start gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={task.done}
                                                    onChange={() => handleToggleProjectHubTask(task.id)}
                                                    className="mt-0.5 w-5 h-5 rounded border-tokens-border text-tokens-brand-DEFAULT focus:ring-tokens-brand-DEFAULT/20 bg-tokens-bg cursor-pointer transition-colors"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <span
                                                        onClick={() => navigate(`/initiator?tab=workflow&stepId=${task.stepId}`)}
                                                        className="text-sm font-medium block cursor-pointer hover:underline text-tokens-fg truncate pr-2"
                                                    >
                                                        {task.title}
                                                    </span>
                                                    <span className="text-xs text-tokens-muted flex items-center gap-1 mt-0.5">
                                                        <span className="inline-block w-2 h-2 rounded-full bg-tokens-brand-DEFAULT/30"></span>
                                                        {task.stepTitle} · {task.projectName}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleRemoveTask(task.id)}
                                                        className="p-1.5 rounded hover:bg-red-500/10 text-tokens-muted hover:text-red-500 transition-colors"
                                                        title={t('compass:tooltips.removeTask', 'Remove task')}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={() => handleStartFocusOnTask(task)}
                                                        className="ml-1"
                                                    >
                                                        Focus
                                                    </Button>
                                                </div>
                                            </div>
                                            {/* S3-1: Next Action Input */}
                                            <div className="pl-8">
                                                <input
                                                    type="text"
                                                    defaultValue={task.nextAction ?? ''}
                                                    placeholder={t('compass:tasks.nextActionPlaceholder', 'Define the next physical step...')}
                                                    onBlur={(e) => updateTaskNextAction(task.id, e.target.value, task.dateKey)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            (e.target as HTMLInputElement).blur();
                                                        }
                                                    }}
                                                    className="w-full px-2 py-1 text-xs bg-tokens-panel border border-tokens-border/50 rounded focus:outline-none focus:ring-1 focus:ring-tokens-brand-DEFAULT/30 text-tokens-fg placeholder:text-tokens-muted/50"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                /* All tasks completed */
                                <div className="text-center py-6 bg-emerald-500/5 rounded-lg border border-emerald-500/20 border-dashed">
                                    <div className="text-emerald-500 text-lg font-semibold mb-2">🎉 {t('tasks.allDone')}</div>
                                    <p className="text-xs text-tokens-muted mb-3">{t('tasks.allDoneDesc')}</p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => navigate('/initiator?tab=workflow')}
                                    >
                                        {t('tasks.findMoreWork')}
                                    </Button>
                                </div>
                            )}

                            {/* Completed Tasks (collapsible) */}
                            {projectHubTasks.filter(t => t.done).length > 0 && (
                                <div className="mt-4 pt-4 border-t border-tokens-border">
                                    <div className="text-xs font-bold text-tokens-muted uppercase tracking-wider mb-2">
                                        Completed ({projectHubTasks.filter(t => t.done).length})
                                    </div>
                                    <div className="space-y-1 opacity-60 hover:opacity-100 transition-opacity">
                                        {projectHubTasks.filter(t => t.done).map(task => (
                                            <div
                                                key={task.id}
                                                className="flex items-center gap-3 p-2 rounded-lg text-xs hover:bg-tokens-panel2 transition-colors"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={task.done}
                                                    onChange={() => handleToggleProjectHubTask(task.id)}
                                                    className="w-4 h-4 rounded border-emerald-500 text-emerald-500 cursor-pointer"
                                                />
                                                <span className="text-emerald-600/80 dark:text-emerald-400/80 line-through flex-1 truncate">
                                                    {task.title}
                                                </span>
                                                <button
                                                    onClick={() => handleRemoveTask(task.id)}
                                                    className="p-1 rounded hover:bg-tokens-panel2 text-tokens-muted hover:text-red-500 transition-colors"
                                                    title={t('compass:tooltips.remove', 'Remove')}
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* RIGHT COLUMN (Visualization & History) - Spans 5 cols */}
                    <div className="lg:col-span-5 space-y-6">

                        {/* Focus Radar Chart */}
                        <Card title={
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                    <Target size={18} className="text-tokens-brand-DEFAULT" />
                                    <span>{t('focusBalance.title')}</span>
                                </div>
                                <Badge variant={derivedFocusScore >= 8 ? "success" : "brand"}>
                                    {t('focusBalance.avg')}: {derivedFocusScore}/10
                                </Badge>
                            </div>
                        } className="overflow-visible">
                            <div className="flex justify-center -mt-2 -mb-4">
                                {(() => {
                                    // Transform focusAreas to use translated labels as keys
                                    const translatedFocusData = Object.entries(focusAreas).reduce((acc, [area, value]) => {
                                        const translationKey = DOMAIN_KEY_MAP[area] || area.toLowerCase();
                                        const label = t(`focusAreas.${translationKey}`, area);
                                        acc[label] = value;
                                        return acc;
                                    }, {} as Record<string, number>);
                                    
                                    return (
                                        <ERadarChart
                                            data={translatedFocusData}
                                            width={280}
                                            height={240}
                                        />
                                    );
                                })()}
                            </div>

                            <div className="mt-4 pt-4 border-t border-tokens-border">
                                <div
                                    className="flex items-center justify-between cursor-pointer group"
                                    onClick={() => setIsFocusExpanded(!isFocusExpanded)}
                                >
                                    <span className="text-xs font-bold text-tokens-muted uppercase tracking-wider group-hover:text-tokens-brand-DEFAULT transition-colors">
                                        {t('focusBalance.adjustValues')}
                                    </span>
                                    <div className="p-1 rounded hover:bg-tokens-panel2 transition-colors">
                                        {isFocusExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                    </div>
                                </div>

                                {isFocusExpanded && (
                                    <div className="space-y-4 pt-4 animate-in fade-in slide-in-from-top-1 duration-200">
                                        {Object.entries(focusAreas).map(([area, value]) => (
                                            <div key={area} className="flex flex-col gap-1">
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-tokens-fg font-medium">{t(`compass:focusAreas.${DOMAIN_KEY_MAP[area] || area.toLowerCase()}`, area)}</span>
                                                    <span className="text-tokens-muted">{value}/10</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="10"
                                                    value={value}
                                                    onChange={(e) => handleFocusChange(area, e.target.value)}
                                                    className="w-full h-1.5 bg-tokens-panel2 rounded-lg appearance-none cursor-pointer accent-tokens-brand-DEFAULT hover:brightness-110 transition-all focus:outline-none focus:ring-2 focus:ring-tokens-ring"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Save Snapshot Button - Prominent */}
                        <Button
                            variant="primary"
                            size="lg"
                            fullWidth
                            onClick={saveSnapshot}
                            className="py-4 shadow-lg shadow-tokens-brand-DEFAULT/20 animate-pulse hover:animate-none transform hover:scale-[1.02] transition-all"
                        >
                            <div className="flex flex-col items-center">
                                <span className="font-bold text-lg">{t('snapshot.title')}</span>
                                <span className="text-[10px] opacity-80 font-normal">{t('snapshot.recordDesc', {energy: energyLevel, focus: derivedFocusScore})}</span>
                            </div>
                        </Button>

                        {/* Recent Snapshots (Compact) */}
                        <Card
                            title={
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-2">
                                        <Database size={16} className="text-tokens-muted" />
                                        <span className="text-sm">{t('history.title')}</span>
                                    </div>
                                    {/* Energy Trend Sparkline */}
                                    {recentSnapshots.length > 1 && (
                                        <div className="bg-tokens-bg px-2 py-1 rounded border border-tokens-border/50">
                                            <ESparkline
                                                data={recentSnapshots.slice(0, 10).reverse().map(s => s.energy)}
                                                width={60}
                                                height={16}
                                                color="#22c55e"
                                                showTooltip={false}
                                            />
                                        </div>
                                    )}
                                </div>
                            }
                            className="bg-tokens-panel/50"
                        >
                            {snapshotsLoading ? (
                                <div className="text-sm text-tokens-muted text-center py-4">
                                    {t('common:status.loading', 'Loading...')}
                                </div>
                            ) : recentSnapshots.length === 0 ? (
                                <div className="text-sm text-tokens-muted text-center py-4 italic">
                                    {t('snapshot.noSnapshots')}
                                </div>
                            ) : (
                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                                    {[
                                        { key: 'today', label: t('history.today'), items: categorizedSnapshots.today },
                                        { key: 'yesterday', label: t('history.yesterday'), items: categorizedSnapshots.yesterday },
                                        { key: 'lastWeek', label: t('history.lastWeek'), items: categorizedSnapshots.lastWeek },
                                        { key: 'older', label: t('history.older'), items: categorizedSnapshots.older }
                                    ].map(category => category.items.length > 0 && (
                                        <div key={category.key} className="space-y-2">
                                            <h4 className="text-[10px] font-bold text-tokens-muted uppercase tracking-widest px-1 sticky top-0 bg-tokens-panel/95 backdrop-blur-sm py-1 -mx-1">
                                                {category.label}
                                            </h4>
                                            {category.items.map((snapshot) => {
                                                const date = new Date(snapshot.timestamp);

                                                // For today/yesterday: show time
                                                // For last week/older: show day and date
                                                let displayStr = '';
                                                if (category.key === 'today' || category.key === 'yesterday') {
                                                    displayStr = date.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' });
                                                } else {
                                                    // Show day name + date for last week/older
                                                    const dayName = date.toLocaleDateString(dateLocale, { weekday: 'short' });
                                                    const dateStr = date.toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' });
                                                    displayStr = `${dayName}, ${dateStr}`;
                                                }

                                                return (
                                                    <button
                                                        key={snapshot.id}
                                                        onClick={() => setSelectedSnapshot(snapshot)}
                                                        className="w-full group p-3 rounded-lg border border-tokens-border bg-tokens-bg hover:border-tokens-brand-DEFAULT/50 hover:bg-tokens-panel/50 transition-all hover:shadow-sm cursor-pointer text-left"
                                                    >
                                                        <div className="flex justify-between items-start mb-1.5">
                                                            <div className="text-[10px] text-tokens-muted uppercase tracking-wider font-medium">
                                                                {displayStr}
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Badge
                                                                    variant={snapshot.energy >= 7 ? 'success' : snapshot.energy >= 4 ? 'warning' : 'error'}
                                                                    className="py-0 px-1.5 text-[10px]"
                                                                >
                                                                    E: {snapshot.energy}
                                                                </Badge>
                                                                {/* Delete button - visible on hover */}
                                                                <button
                                                                    onClick={(e) => handleDeleteSnapshot(snapshot.id, e)}
                                                                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-tokens-muted hover:text-red-500 transition-all"
                                                                    title={t('compass:tooltips.deleteSnapshot', 'Delete snapshot')}
                                                                >
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div className="flex justify-between items-center text-xs text-tokens-fg mb-1">
                                                            <span>{t('history.focusScore')}:</span>
                                                            <span className="font-mono font-medium">{snapshot.focus}/10</span>
                                                        </div>

                                                        {snapshot.note && (
                                                            <div className="mt-2 pt-2 border-t border-tokens-border/50">
                                                                <p className="text-[10px] text-tokens-muted italic line-clamp-1">"{snapshot.note}"</p>
                                                            </div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Workflow Root Status */}
                            <div className="mt-3 text-[10px] text-tokens-muted flex justify-center opacity-60 hover:opacity-100 transition-opacity">
                                {getStorageMode(workflowRoot) === 'file-backed' 
                                    ? t('compass:status.savingToFiles', 'Saving to local files') 
                                    : t('compass:status.simulationMode', 'Simulation Mode')}
                            </div>
                        </Card>

                    </div>
                </div>
            </PageContainer >

            {/* Snapshot Detail Modal */}
            {selectedSnapshot && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setSelectedSnapshot(null)}
                >
                    <div
                        className="bg-tokens-panel max-w-md w-full rounded-xl border border-tokens-border shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between pb-2 border-b border-tokens-border">
                            <h3 className="text-lg font-bold text-tokens-fg flex items-center gap-2">
                                <Database size={20} className="text-tokens-brand-DEFAULT" />
                                Snapshot Details
                            </h3>
                            <button
                                onClick={() => setSelectedSnapshot(null)}
                                className="p-2 hover:bg-tokens-panel2 rounded-lg transition-colors text-tokens-muted hover:text-tokens-fg"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Timestamp */}
                        <div className="bg-tokens-bg p-3 rounded-lg border border-tokens-border/50">
                            <div className="text-xs text-tokens-muted uppercase tracking-wider mb-1">Recorded</div>
                            <div className="text-sm font-medium text-tokens-fg">
                                {new Date(selectedSnapshot.timestamp).toLocaleString(dateLocale, {
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </div>
                        </div>

                        {/* Energy & Focus */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-tokens-bg p-4 rounded-lg border border-tokens-border/50">
                                <div className="text-xs text-tokens-muted uppercase tracking-wider mb-2">{t('compass:metrics.energyLevel')}</div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-bold text-tokens-brand-DEFAULT">{selectedSnapshot.energy}</span>
                                    <span className="text-sm text-tokens-muted">/10</span>
                                </div>
                                <Badge
                                    variant={selectedSnapshot.energy >= 7 ? 'success' : selectedSnapshot.energy >= 4 ? 'warning' : 'error'}
                                    className="mt-2 text-[10px]"
                                >
                                    {selectedSnapshot.energy >= 7 ? 'High' : selectedSnapshot.energy >= 4 ? 'Medium' : 'Low'}
                                </Badge>
                            </div>

                            <div className="bg-tokens-bg p-4 rounded-lg border border-tokens-border/50">
                                <div className="text-xs text-tokens-muted uppercase tracking-wider mb-2">{t('compass:metrics.focusScore')}</div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-bold text-tokens-brand-DEFAULT">{selectedSnapshot.focus}</span>
                                    <span className="text-sm text-tokens-muted">/10</span>
                                </div>
                                <Badge
                                    variant={selectedSnapshot.focus >= 7 ? 'success' : selectedSnapshot.focus >= 4 ? 'warning' : 'error'}
                                    className="mt-2 text-[10px]"
                                >
                                    {selectedSnapshot.focus >= 7 ? 'Focused' : selectedSnapshot.focus >= 4 ? 'Moderate' : 'Scattered'}
                                </Badge>
                            </div>
                        </div>

                        {/* Focus Balance Radar Chart */}
                        {selectedSnapshot.focusAreas ? (
                            <div className="bg-tokens-bg p-4 rounded-lg border border-tokens-border/50">
                                <div className="text-xs text-tokens-muted uppercase tracking-wider mb-3">{t('compass:metrics.focusBalance')}</div>
                                <div className="flex items-center justify-center">
                                    <ERadarChart
                                        data={selectedSnapshot.focusAreas}
                                        width={200}
                                        height={200}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="bg-tokens-bg/50 p-4 rounded-lg border border-dashed border-tokens-border/50">
                                <div className="flex items-center gap-2 text-tokens-muted text-xs">
                                    <Info size={14} className="shrink-0" />
                                    <span className="italic">Focus area breakdown not available for this snapshot</span>
                                </div>
                            </div>
                        )}

                        {/* Note */}
                        {selectedSnapshot.note && (
                            <div className="bg-tokens-bg p-4 rounded-lg border border-tokens-border/50">
                                <div className="text-xs text-tokens-muted uppercase tracking-wider mb-2">Note</div>
                                <p className="text-sm text-tokens-fg italic">"{selectedSnapshot.note}"</p>
                            </div>
                        )}

                        {/* Close Button */}
                        <Button
                            variant="secondary"
                            fullWidth
                            onClick={() => setSelectedSnapshot(null)}
                        >
                            Close
                        </Button>
                    </div>
                </div>
            )}

            {/* Dialogs */}
            <ConfirmDialogComponent />
            <AlertDialogComponent />
        </>
    );
}
