/**
 * Activity Page
 * Track focus sessions, productivity metrics, and daily activity
 */
import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Timer, Target, Pause, Calendar, Flame, Clock, Zap, Coffee, Trash2, ChevronDown } from 'lucide-react';
import { PageContainer } from '../components/PageContainer';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import {
    getActivitySummary,
    ActivitySession
} from '../services/activityTrackingService';
import { subscribe as subscribeToTimer, getState as getTimerState, FocusTimerState, start, stop as stopTimer } from '../stores/focusTimerStore';
import { SegmentedControl } from '../components/SegmentedControl';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ActivityHeatmap } from '../components/charts/ActivityHeatmap';
import { SwipeableBarChart } from '../components/charts/SwipeableBarChart';

export function ActivityPage() {
    const { t, i18n } = useTranslation('activity');
    const dateLocale = i18n.language === 'id' ? 'id-ID' : 'en-US';
    // 1. Local Mirror of Timer Store
    const [timerState, setTimerState] = useState<FocusTimerState>(getTimerState());

    // 2. Database Data 
    const [weeklySessions, setWeeklySessions] = useState<ActivitySession[]>([]);
    const [monthlySessions, setMonthlySessions] = useState<ActivitySession[]>([]);
    const [yearlySessions, setYearlySessions] = useState<ActivitySession[]>([]);
    const [todaySessions, setTodaySessions] = useState<ActivitySession[]>([]);
    const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isLoading, setIsLoading] = useState(true);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [showClearMenu, setShowClearMenu] = useState(false);
    const [clearOption, setClearOption] = useState<'today' | 'week' | 'month' | 'all'>('all');
    const clearMenuRef = useRef<HTMLDivElement>(null);

    // Subscribe to store updates
    useEffect(() => {
        // Initial fetch
        loadData(true);
        if (viewMode === 'yearly') loadYearlyStats();

        const unsubscribe = subscribeToTimer(() => {
            const newState = getTimerState();
            setTimerState(newState);

            setTimerState((prev) => {
                if ((prev.phase !== newState.phase) || (prev.isRunning && !newState.isRunning)) {
                    loadData(false);
                    if (viewMode === 'monthly') loadMonthlyStats();
                    if (viewMode === 'yearly') loadYearlyStats();
                }
                return newState;
            });
        });

        return unsubscribe;
    }, []);

    // Click outside to close clear menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (clearMenuRef.current && !clearMenuRef.current.contains(event.target as Node)) {
                setShowClearMenu(false);
            }
        };

        if (showClearMenu) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showClearMenu]);

    async function loadData(showLoading = false) {
        if (showLoading) setIsLoading(true);

        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);
        lastWeek.setHours(0, 0, 0, 0);

        // Fetch Weekly (Source for History List + Weekly Chart)
        const weeklyResult = await getActivitySummary(lastWeek.toISOString(), tomorrow.toISOString());
        if (weeklyResult.ok && weeklyResult.sessions) {
            setWeeklySessions(weeklyResult.sessions);

            // Filter for Today (for Hourly Chart & Today Stats)
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            setTodaySessions(weeklyResult.sessions.filter(s => new Date(s.start_time) >= todayStart));
        }

        if (showLoading) setIsLoading(false);
    }

    async function loadYearlyStats() {
        const today = new Date();
        const yearStart = new Date(today.getFullYear(), 0, 1); // Jan 1st
        today.setHours(23, 59, 59, 999);

        const result = await getActivitySummary(yearStart.toISOString(), today.toISOString());
        if (result.ok && result.sessions) {
            setYearlySessions(result.sessions);
        }
    }

    // Effect to load data when switching view
    useEffect(() => {
        if (viewMode === 'monthly' && monthlySessions.length === 0) loadMonthlyStats();
        if (viewMode === 'yearly' && yearlySessions.length === 0) loadYearlyStats();
    }, [viewMode]);

    async function loadMonthlyStats() {
        const today = new Date();
        const start = new Date(today);
        start.setDate(today.getDate() - 30);
        start.setHours(0, 0, 0, 0);
        today.setHours(23, 59, 59, 999);

        const result = await getActivitySummary(start.toISOString(), today.toISOString());
        if (result.ok && result.sessions) {
            setMonthlySessions(result.sessions);
        }
    }

    // --- Actions ---
    const handleStartFocus = () => {
        start({ focusMinutes: 25 });
    };

    const handleEndSession = () => {
        stopTimer();
    };


    // --- Calculations ---
    // FOCUS TIME: Count ALL focus time (including incomplete sessions)
    // SESSIONS: Only count sessions that lasted for at least one complete pomodoro cycle
    const MIN_SESSION_DURATION = timerState.config.focusMinutes * 60;

    // Calculate total focus time from ALL completed focus sessions (no minimum duration)
    const allFocusTime = todaySessions
        .filter(s => s.type === 'focus' && s.end_time)
        .reduce((acc, s) => {
            const start = new Date(s.start_time).getTime();
            const end = new Date(s.end_time!).getTime();
            return acc + (end - start) / 1000;
        }, 0);

    // Add current session elapsed time if in focus mode
    let currentSessionElapsed = 0;
    if (timerState.sessionActive) {
        if (timerState.phase === 'focus') {
            const totalDuration = timerState.config.focusMinutes * 60;
            currentSessionElapsed = Math.max(0, totalDuration - timerState.remainingSeconds);
        } else if (timerState.phase === 'shortBreak') {
            const totalDuration = timerState.config.shortBreakMinutes * 60;
            currentSessionElapsed = Math.max(0, totalDuration - timerState.remainingSeconds);
        } else if (timerState.phase === 'longBreak') {
            const totalDuration = timerState.config.longBreakMinutes * 60;
            currentSessionElapsed = Math.max(0, totalDuration - timerState.remainingSeconds);
        }
    }

    const totalFocusTime = allFocusTime + currentSessionElapsed;

    // For session count: only count completed pomodoro cycles
    const completedFocusSessions = todaySessions.filter(s => {
        if (s.type !== 'focus' || !s.end_time) return false;
        const start = new Date(s.start_time).getTime();
        const end = new Date(s.end_time).getTime();
        const duration = (end - start) / 1000;
        return duration >= MIN_SESSION_DURATION;
    });

    const activeSessionQualifies = timerState.phase === 'focus' && timerState.sessionActive && currentSessionElapsed >= MIN_SESSION_DURATION;
    const sessionCount = completedFocusSessions.length + (activeSessionQualifies ? 1 : 0);


    // --- Helpers ---
    const formatDuration = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        const h = hrs.toString().padStart(2, '0');
        const m = mins.toString().padStart(2, '0');
        const s = secs.toString().padStart(2, '0');

        const mLabel = t('activity:time.m', 'm');
        const sLabel = t('activity:time.s', 's');
        const hLabel = t('activity:time.h', 'h');

        if (hrs > 0) return `${h}${hLabel} ${m}${mLabel} ${s} ${sLabel}`;
        if (mins > 0) return `${m}${mLabel} ${s} ${sLabel}`;
        return `00${mLabel} ${s} ${sLabel}`;
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' });
    };

    // Data generation callbacks for charts (must be before JSX to avoid hooks order issues)
    const getDailyData = useCallback((date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        const buckets = new Array(24).fill(0);

        todaySessions.forEach(session => {
            if (session.type !== 'focus' || !session.end_time) return;
            const sessionDate = new Date(session.start_time).toISOString().split('T')[0];
            if (sessionDate !== dateStr) return;

            const start = new Date(session.start_time);
            const end = new Date(session.end_time);
            const hour = start.getHours();
            const duration = (end.getTime() - start.getTime()) / 1000 / 60;
            buckets[hour] += duration;
        });

        return Array.from({ length: 24 }, (_, i) => ({
            label: `${i.toString().padStart(2, '0')}:00`,
            value: Math.round(buckets[i])
        }));
    }, [todaySessions]);

    const getWeeklyData = useCallback((endDate: Date) => {
        const result: { label: string; value: number }[] = [];

        for (let i = 6; i >= 0; i--) {
            const d = new Date(endDate);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];

            let totalSeconds = 0;
            weeklySessions.forEach(session => {
                if (session.type === 'idle' || !session.end_time) return;
                const sessionDate = new Date(session.start_time).toISOString().split('T')[0];
                if (sessionDate !== dateStr) return;

                const start = new Date(session.start_time);
                const end = new Date(session.end_time);
                totalSeconds += (end.getTime() - start.getTime()) / 1000;
            });

            result.push({
                label: d.toLocaleDateString(dateLocale, { weekday: 'short' }),
                value: Number((totalSeconds / 3600).toFixed(1))
            });
        }

        return result;
    }, [weeklySessions]);

    const getMonthlyData = useCallback((endDate: Date) => {
        const result: { label: string; value: number }[] = [];

        for (let i = 29; i >= 0; i--) {
            const d = new Date(endDate);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];

            let totalSeconds = 0;
            monthlySessions.forEach(session => {
                if (session.type === 'idle' || !session.end_time) return;
                const sessionDate = new Date(session.start_time).toISOString().split('T')[0];
                if (sessionDate !== dateStr) return;

                const start = new Date(session.start_time);
                const end = new Date(session.end_time);
                totalSeconds += (end.getTime() - start.getTime()) / 1000;
            });

            result.push({
                label: d.getDate().toString(),
                value: Number((totalSeconds / 3600).toFixed(1))
            });
        }

        return result;
    }, [monthlySessions]);


    // Group sessions by time categories (matching Compass pattern)
    const historyGroups = useMemo(() => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);

        const categorized = {
            today: weeklySessions.filter(s => new Date(s.start_time) >= today),
            yesterday: weeklySessions.filter(s => {
                const date = new Date(s.start_time);
                return date >= yesterday && date < today;
            }),
            lastWeek: weeklySessions.filter(s => {
                const date = new Date(s.start_time);
                return date >= lastWeek && date < yesterday;
            }),
            older: weeklySessions.filter(s => new Date(s.start_time) < lastWeek)
        };

        const groups: Array<{ label: string; sessions: ActivitySession[] }> = [];

        // Filter out orphaned sessions (no end_time) from DB - we'll add one virtual active session if timer is running
        // This prevents multiple "Active" entries when sessions weren't properly ended
        const todayCompletedSessions = categorized.today.filter(s => s.end_time);
        const yesterdayCompletedSessions = categorized.yesterday.filter(s => s.end_time);
        const lastWeekCompletedSessions = categorized.lastWeek.filter(s => s.end_time);
        const olderCompletedSessions = categorized.older.filter(s => s.end_time);

        // Add virtual active session if timer is running (this is the single source of truth for "Active")
        let todaySessions = todayCompletedSessions;
        if (timerState.sessionActive && timerState.phase !== 'idle') {
            // Create a virtual session for the active timer
            const activeSession: ActivitySession = {
                id: 'active-session-virtual',
                user_id: 'current',
                start_time: new Date(Date.now() - currentSessionElapsed * 1000).toISOString(),
                type: timerState.phase === 'focus' ? 'focus' : 'break',
                // No end_time since it's active
            };
            // Prepend to today's sessions
            todaySessions = [activeSession, ...todayCompletedSessions];
        }

        if (todaySessions.length > 0) {
            groups.push({ label: t('timeGroups.today', 'Today'), sessions: todaySessions });
        }
        if (yesterdayCompletedSessions.length > 0) {
            groups.push({ label: t('timeGroups.yesterday', 'Yesterday'), sessions: yesterdayCompletedSessions });
        }
        if (lastWeekCompletedSessions.length > 0) {
            groups.push({ label: t('timeGroups.lastWeek', 'Last Week'), sessions: lastWeekCompletedSessions });
        }
        if (olderCompletedSessions.length > 0) {
            groups.push({ label: t('timeGroups.older', 'Older'), sessions: olderCompletedSessions });
        }


        return groups;
    }, [weeklySessions, timerState.sessionActive, timerState.phase, currentSessionElapsed]);


    const isSessionActive = timerState.phase !== 'idle' && timerState.sessionActive;

    return (
        <PageContainer className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-tokens-fg tracking-tight">
                        {t('title')}
                    </h1>
                    <p className="text-tokens-muted text-sm mt-1">
                        {t('subtitle')}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Clear Data Dropdown */}
                    <div className="relative" ref={clearMenuRef}>
                        <button
                            onClick={() => setShowClearMenu(!showClearMenu)}
                            className="p-2 rounded-lg hover:bg-tokens-error/10 text-tokens-muted hover:text-tokens-error transition-colors flex items-center gap-1"
                            title={t('activity:tooltips.clearData', 'Clear activity data')}
                        >
                            <Trash2 size={16} />
                            <ChevronDown size={12} />
                        </button>
                        {showClearMenu && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-tokens-panel border border-tokens-border rounded-lg shadow-xl z-50 overflow-hidden">
                                <div className="p-2 border-b border-tokens-border bg-tokens-panel2">
                                    <span className="text-xs text-tokens-muted uppercase tracking-wider">{t('clearData.title')}</span>
                                </div>
                                <div className="py-1">
                                                                    {[
                                        { key: 'today' as const, labelKey: 'clearData.todayOnly', label: 'Today only', descKey: 'clearData.todayDesc', desc: 'Sessions from today' },
                                        { key: 'week' as const, labelKey: 'clearData.last7Days', label: 'Last 7 days', descKey: 'clearData.last7DaysDesc', desc: 'Sessions from this week' },
                                        { key: 'month' as const, labelKey: 'clearData.last30Days', label: 'Last 30 days', descKey: 'clearData.last30DaysDesc', desc: 'Sessions from this month' },
                                        { key: 'all' as const, labelKey: 'clearData.allData', label: 'All data', descKey: 'clearData.allDataDesc', desc: 'Delete everything' },
                                    ].map(opt => (
                                        <button
                                            key={opt.key}
                                            onClick={() => {
                                                setClearOption(opt.key);
                                                setShowClearMenu(false);
                                                setShowClearConfirm(true);
                                            }}
                                            className="w-full px-3 py-2 text-left hover:bg-tokens-error/10 transition-colors group"
                                        >
                                            <div className="text-sm text-tokens-fg group-hover:text-tokens-error">{t(opt.labelKey, opt.label)}</div>
                                            <div className="text-xs text-tokens-muted">{t(opt.descKey, opt.desc)}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <Badge variant="neutral" className="px-3 py-1.5">
                        <Calendar size={14} className="mr-1.5" />
                        {new Date().toLocaleDateString(dateLocale, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </Badge>
                </div>
            </div>

            {/* --- TOP ROW: KEY METRICS --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-4 text-center">
                    <div className="w-8 h-8 rounded-lg bg-tokens-brand-DEFAULT/10 flex items-center justify-center mx-auto mb-2">
                        <Clock className="text-tokens-brand-DEFAULT" size={16} />
                    </div>
                    <div className="text-xl font-bold text-tokens-fg font-mono tabular-nums">{formatDuration(totalFocusTime)}</div>
                    <div className="text-[10px] text-tokens-muted uppercase tracking-wider mt-1">{t('stats.focusToday')}</div>
                </Card>
                <Card className="p-4 text-center">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center mx-auto mb-2">
                        <Zap className="text-amber-500" size={16} />
                    </div>
                    <div className="text-xl font-bold text-tokens-fg">{sessionCount}</div>
                    <div className="text-[10px] text-tokens-muted uppercase tracking-wider mt-1">{t('stats.sessions')}</div>
                </Card>
                <Card className="p-4 text-center">
                    <div className="w-10 h-10 rounded-lg bg-gray-500/10 flex items-center justify-center mx-auto mb-2">
                        <Flame className="text-gray-500" size={20} />
                    </div>
                    <div className="text-2xl font-bold text-tokens-fg">0</div>
                    <div className="text-xs text-tokens-muted uppercase tracking-wider mt-1">{t('stats.dayStreak')}</div>
                </Card>
            </div >

            {/* --- MIDDLE ROW: MAIN VISUALS (CHARTS) --- */}
            < div className="w-full overflow-hidden" >
                {/* View Controls - Centered above charts */}
                < div className="flex justify-center mb-6" >
                    <SegmentedControl
                        options={[
                            { value: 'daily', label: t('viewModes.daily') },
                            { value: 'weekly', label: t('viewModes.weekly') },
                            { value: 'monthly', label: t('viewModes.monthly') },
                            { value: 'yearly', label: t('viewModes.annual') }
                        ]}
                        value={viewMode}
                        onChange={(val) => setViewMode(val as 'daily' | 'weekly' | 'monthly' | 'yearly')}
                        size="sm"
                        equalWidth
                    />
                </div >

                {/* Charts Area - Unified with parent width */}
                < div className="mb-6 w-full overflow-hidden" >
                    {viewMode === 'daily' && (
                        <SwipeableBarChart
                            selectedDate={selectedDate}
                            onDateChange={setSelectedDate}
                            getTitle={(date, isToday) =>
                                isToday
                                    ? t('activity:charts.todaysFocusMinutes', "Today's Focus (Minutes)")
                                    : `${date.toLocaleDateString(dateLocale, { month: 'short', day: 'numeric', year: 'numeric' })} Focus (Minutes)`
                            }
                            yAxisFormatter={(v) => `${v}${t('activity:time.m', 'm')}`}
                            barColor="#10b981"
                            getDataForDate={getDailyData}
                        />
                    )
                    }

                    {
                        viewMode === 'weekly' && (
                            <SwipeableBarChart
                                selectedDate={selectedDate}
                                onDateChange={setSelectedDate}
                                getTitle={(date, isToday) => {
                                    if (isToday) return t('activity:charts.last7DaysFocusHours', 'Last 7 Days Focus (Hours)');
                                    const endDate = date;
                                    const startDate = new Date(date);
                                    startDate.setDate(startDate.getDate() - 6);
                                    return `${startDate.toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' })} Focus (Hours)`;
                                }}
                                yAxisFormatter={(v) => `${v}${t('activity:time.h', 'h')}`}
                                barColor="#4141b9"
                                getDataForDate={getWeeklyData}
                            />
                        )
                    }

                    {
                        viewMode === 'monthly' && (
                            <SwipeableBarChart
                                selectedDate={selectedDate}
                                onDateChange={setSelectedDate}
                                getTitle={(date, isToday) => {
                                    if (isToday) return t('activity:charts.last30DaysFocusHours', 'Last 30 Days Focus (Hours)');
                                    const endDate = date;
                                    const startDate = new Date(date);
                                    startDate.setDate(startDate.getDate() - 29);
                                    return `${startDate.toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' })} Focus (Hours)`;
                                }}
                                yAxisFormatter={(v) => `${v}${t('activity:time.h', 'h')}`}
                                barColor="#4141b9"
                                getDataForDate={getMonthlyData}
                            />
                        )
                    }

                    {
                        viewMode === 'yearly' && (
                            <div className="w-full">
                                <ActivityHeatmap
                                    sessions={yearlySessions}
                                    year={selectedYear}
                                    onYearChange={setSelectedYear}
                                />
                            </div>
                        )
                    }
                </div >
            </div >

            {/* --- BOTTOM ROW: ACTION & HISTORY --- */}
            < div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full" >

                {/* Bottom Left: Start Focus (Action) */}
                < div className="lg:col-span-1 min-w-0" >
                    <Card className={`p - 6 transition - all h - full ${isSessionActive ? 'border-tokens-brand-DEFAULT bg-tokens-brand-DEFAULT/5' : ''} `}>
                        {isSessionActive ? (
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-2 mb-3">
                                    <div className="w-3 h-3 bg-tokens-success rounded-full animate-pulse" />
                                    <span className="text-sm font-medium text-tokens-fg uppercase tracking-wider">
                                        {timerState.phase === 'focus' ? t('session.deepFocus') : t('session.breakTime')}
                                    </span>
                                </div>
                                <div className="max-w-[300px] mx-auto text-5xl font-bold text-tokens-fg font-mono tabular-nums mb-4 flex justify-center overflow-hidden">
                                    {formatDuration(currentSessionElapsed)}
                                </div>
                                <p className="text-sm text-tokens-muted mb-6">
                                    {timerState.phase === 'focus' ? t('session.stayInZone') : t('session.recharge')}
                                </p>
                                <button
                                    onClick={handleEndSession}
                                    className="px-6 py-3 bg-tokens-error hover:bg-tokens-error/90 text-white rounded-xl font-medium transition-all flex items-center gap-2 mx-auto"
                                >
                                    <Pause size={20} />
                                    {t('session.stopSession')}
                                </button>
                            </div>
                        ) : (
                            <div className="text-center flex flex-col justify-center h-full">
                                <div className="text-lg font-medium text-tokens-fg mb-6">
                                    {t('session.readyToStart')}
                                </div>
                                <button
                                    onClick={handleStartFocus}
                                    style={{ backgroundColor: 'var(--brand)' }}
                                    className="w-full max-w-[300px] mx-auto py-4 hover:opacity-90 text-white rounded-xl font-bold text-lg transition-all flex flex-col items-center gap-2 shadow-lg"
                                >
                                    <Target size={28} className="text-white" />
                                    <span>{t('session.startFocus')}</span>
                                </button>
                            </div>
                        )}
                    </Card>
                </div >

                {/* Bottom Right: History (Log) */}
                < div className="lg:col-span-2 min-w-0" >
                    <Card className="overflow-hidden h-full flex flex-col">
                        <div className="px-4 py-3 border-b border-tokens-border bg-tokens-bg-secondary/30">
                            <h3 className="text-sm font-semibold text-tokens-fg">{t('history.title')}</h3>
                        </div>
                        {isLoading ? (
                            <div className="p-8 text-center text-tokens-muted">{t('history.loading')}</div>
                        ) : historyGroups.length === 0 ? (
                            <div className="p-8 text-center text-tokens-muted">
                                <Timer size={32} className="mx-auto mb-3 opacity-40" />
                                <p>{t('history.noHistory')}</p>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto max-h-[400px]">
                                {historyGroups.map((group) => (
                                    <div key={group.label}>
                                        <div className="px-4 py-2 bg-tokens-bg-secondary/50 text-xs font-bold text-tokens-muted uppercase tracking-wider sticky top-0 backdrop-blur-sm z-10">
                                            {group.label}
                                        </div>
                                        <div className="divide-y divide-tokens-border">
                                            {group.sessions.map((session) => {
                                                const start = new Date(session.start_time);
                                                const end = session.end_time ? new Date(session.end_time) : null;
                                                const duration = end ? (end.getTime() - start.getTime()) / 1000 : 0;
                                                const isFocus = session.type === 'focus';
                                                const isActive = !session.end_time;

                                                // For "Last Week" and "Older", show date; for Today/Yesterday, show time only
                                                const showDate = group.label === 'Last Week' || group.label === 'Older';
                                                const dateStr = showDate
                                                    ? start.toLocaleDateString(dateLocale, { weekday: 'short', month: 'short', day: 'numeric' })
                                                    : '';

                                                return (
                                                    <div
                                                        key={session.id}
                                                        className={`flex items-center justify-between p-4 transition-colors ${isActive
                                                            ? 'bg-tokens-brand-DEFAULT/5 border-l-2 border-tokens-brand-DEFAULT'
                                                            : 'hover:bg-tokens-bg/50'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isFocus
                                                                ? 'bg-tokens-brand-DEFAULT/10 text-tokens-brand-DEFAULT'
                                                                : 'bg-amber-500/10 text-amber-500'
                                                                }`}>
                                                                {isFocus ? <Target size={16} /> : <Coffee size={16} />}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm font-medium text-tokens-fg capitalize">
                                                                        {session.type === 'focus' ? t('activity:sessionTypes.focus', 'Focus') : t('activity:sessionTypes.break', 'Break')}
                                                                    </span>
                                                                    {isActive && (
                                                                        <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-tokens-brand-DEFAULT/20 text-tokens-brand-DEFAULT font-medium">
                                                                            <span className="w-1.5 h-1.5 rounded-full bg-tokens-brand-DEFAULT animate-pulse" />
                                                                            {t('session.active', 'Active')}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="text-xs text-tokens-muted">
                                                                    {showDate && <span className="mr-2">{dateStr}</span>}
                                                                    {formatTime(start)} {end && `- ${formatTime(end)}`}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-sm font-mono font-medium text-tokens-fg">
                                                                {end ? formatDuration(duration) : formatDuration(currentSessionElapsed)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div >
            </div >

            {/* Clear Data Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showClearConfirm}
                title={t(`activity:clearData.${clearOption}Title`, `Clear ${clearOption === 'all' ? 'All Activity' : clearOption === 'today' ? "Today's" : clearOption === 'week' ? 'Last 7 Days' : 'Last 30 Days'} Data`)}
                message={
                    clearOption === 'all'
                        ? t('activity:clearData.allMessage', 'This will permanently delete ALL your activity sessions. This action cannot be undone.')
                        : clearOption === 'today'
                            ? t('activity:clearData.todayMessage', "This will delete today's focus and break sessions.")
                            : clearOption === 'week'
                                ? t('activity:clearData.weekMessage', 'This will delete sessions from the last 7 days.')
                                : t('activity:clearData.monthMessage', 'This will delete sessions from the last 30 days.')
                }
                confirmLabel={clearOption === 'all' ? t('activity:clearData.confirmAll', 'Clear All Data') : t('activity:clearData.confirmSelected', 'Clear Selected')}
                cancelLabel={t('common:buttons.cancel', 'Cancel')}
                type="danger"
                onConfirm={async () => {
                    setShowClearConfirm(false);

                    // Calculate afterDate based on option
                    let afterDate: string | undefined;
                    const now = new Date();

                    if (clearOption === 'today') {
                        // Delete sessions from start of today
                        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                        afterDate = startOfToday.toISOString();
                    } else if (clearOption === 'week') {
                        // Delete sessions from 7 days ago
                        const weekAgo = new Date(now);
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        weekAgo.setHours(0, 0, 0, 0);
                        afterDate = weekAgo.toISOString();
                    } else if (clearOption === 'month') {
                        // Delete sessions from 30 days ago
                        const monthAgo = new Date(now);
                        monthAgo.setDate(monthAgo.getDate() - 30);
                        monthAgo.setHours(0, 0, 0, 0);
                        afterDate = monthAgo.toISOString();
                    }
                    // For 'all', afterDate stays undefined (deletes everything)

                    // TODO: Re-enable when clearAllSessions API is available
                    // const result = await clearAllActivitySessions(afterDate);
                    console.warn('Clear sessions temporarily disabled - API not yet implemented');
                    const result = { ok: false, error: 'Feature temporarily disabled' };
                    
                    if (result.ok) {
                        loadData(true);
                        loadYearlyStats();
                    } else {
                        console.warn('Clear sessions not available:', result.error);
                    }
                }}
                onCancel={() => setShowClearConfirm(false)}
            />
        </PageContainer >
    );
}
