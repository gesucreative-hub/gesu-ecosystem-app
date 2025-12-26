import { useMemo, useState, useEffect } from 'react';
import { Card } from '../Card';
import { ActivitySession } from '../../services/activityTrackingService';
import { ChevronLeft, ChevronRight, Circle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ActivityHeatmapProps {
    sessions: ActivitySession[];
    year: number;
    onYearChange?: (year: number) => void;
}

interface DayData {
    date: string;
    hours: number;
    level: 0 | 1 | 2 | 3 | 4;
    month: number;
    weekday: number;
}

export function ActivityHeatmap({ sessions, year, onYearChange }: ActivityHeatmapProps) {
    const { t, i18n } = useTranslation('activity');
    const [isDark, setIsDark] = useState(document.documentElement.getAttribute('data-theme') === 'dark');
    const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);

    // Listen for theme changes
    useEffect(() => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
                    setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
                }
            });
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme']
        });

        return () => observer.disconnect();
    }, []);

    // Process sessions into grid data
    const { stats, months } = useMemo(() => {
        const dailyHours = new Map<string, number>();
        const activeDays = new Set<string>();

        // Aggregate hours per day
        sessions.forEach(session => {
            if (session.type !== 'idle' && session.end_time) {
                const start = new Date(session.start_time);
                const end = new Date(session.end_time);
                const dateKey = start.toISOString().split('T')[0];
                const hours = (end.getTime() - start.getTime()) / 1000 / 3600;

                dailyHours.set(dateKey, (dailyHours.get(dateKey) || 0) + hours);
                activeDays.add(dateKey);
            }
        });

        // Generate full year data
        const data: DayData[] = [];
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31);
        const maxHours = Math.max(1, ...Array.from(dailyHours.values()));

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            const hours = dailyHours.get(dateStr) || 0;

            let level: 0 | 1 | 2 | 3 | 4 = 0;
            if (hours > 0) {
                const ratio = hours / maxHours;
                if (ratio >= 0.75) level = 4;
                else if (ratio >= 0.5) level = 3;
                else if (ratio >= 0.25) level = 2;
                else level = 1;
            }

            data.push({
                date: dateStr,
                hours: Math.round(hours * 100) / 100,
                level,
                month: d.getMonth(),
                weekday: d.getDay()
            });
        }

        // Group by month for positioning
        const monthGroups: { month: number; name: string; weeks: DayData[][] }[] = [];
        let currentMonth = -1;
        let currentWeek: DayData[] = [];

        data.forEach((day) => {
            if (day.month !== currentMonth) {
                if (currentWeek.length > 0 && currentMonth !== -1) {
                    monthGroups[monthGroups.length - 1].weeks.push(currentWeek);
                }
                currentMonth = day.month;
                const locale = i18n.language === 'id' ? 'id-ID' : 'en-US';
                monthGroups.push({
                    month: currentMonth,
                    name: new Date(year, currentMonth, 1).toLocaleString(locale, { month: 'short' }),
                    weeks: []
                });
                currentWeek = [];
            }

            // Start new week on Sunday
            if (day.weekday === 0 && currentWeek.length > 0) {
                monthGroups[monthGroups.length - 1].weeks.push(currentWeek);
                currentWeek = [];
            }

            currentWeek.push(day);
        });

        // Push final week
        if (currentWeek.length > 0) {
            monthGroups[monthGroups.length - 1].weeks.push(currentWeek);
        }

        // Calculate stats
        const totalHours = Array.from(dailyHours.values()).reduce((a, b) => a + b, 0);
        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        // Streak calculation
        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;

        const today = new Date().toISOString().split('T')[0];
        const sortedDates = Array.from(activeDays).sort().reverse();

        for (let i = 0; i < sortedDates.length; i++) {
            const date = new Date(sortedDates[i]);
            const prevDate = i > 0 ? new Date(sortedDates[i - 1]) : null;

            if (prevDate) {
                const diffDays = Math.round((prevDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays === 1) {
                    tempStreak++;
                } else {
                    longestStreak = Math.max(longestStreak, tempStreak);
                    tempStreak = 1;
                }
            } else {
                tempStreak = 1;
            }

            if (sortedDates[0] === today || sortedDates[0] === new Date(Date.now() - 86400000).toISOString().split('T')[0]) {
                currentStreak = tempStreak;
            }
        }
        longestStreak = Math.max(longestStreak, tempStreak);

        return {
            gridData: data,
            months: monthGroups,
            stats: {
                dailyAverage: Math.round((totalHours / totalDays) * 60),
                daysLearned: Math.round((activeDays.size / totalDays) * 100),
                longestStreak,
                currentStreak,
                totalDays: activeDays.size
            }
        };
    }, [sessions, year]);

    // Visual constants - optimized for fixed card height
    const cellSize = 12; // Increased from 10 to fill space better
    const cellGap = 2; // Reduced from 3 for tighter spacing
    const monthGap = 4; // Reduced from 6 for tighter spacing
    const labelOffset = 30;

    // Anki-style colors
    const getColor = (level: number): string => {
        if (isDark) {
            // Dark mode: slate grey → brand green gradient
            const colors = ['#2d3748', '#a4db7440', '#a4db7470', '#a4db74a0', '#a4db74'];
            return colors[level];
        } else {
            // Light mode: light grey → brand blue gradient (Anki uses green, we use brand)
            const colors = ['#ebedf0', '#4141b930', '#4141b960', '#4141b990', '#4141b9'];
            return colors[level];
        }
    };

    // Calculate SVG dimensions
    let totalWidth = labelOffset;
    months.forEach(month => {
        totalWidth += (month.weeks.length * (cellSize + cellGap)) + monthGap;
    });
    // Match total card height with other chart views
    // SwipeableBarChart: ~60px header + 200px chart + ~20px hint = ~280px
    // ActivityHeatmap: ~60px header + SVG + ~40px stats = should total ~280px
    // So SVG should be ~160px to account for stats section
    const height = 160;

    // Dynamic weekday labels based on current locale
    const weekdayLabels = useMemo(() => {
        // Create dates for Sun-Sat of a specific week (using 2024-01-07 which starts on Sunday)
        return [0, 1, 2, 3, 4, 5, 6].map(dayOffset => {
            const date = new Date(2024, 0, 7 + dayOffset); // Jan 7, 2024 is a Sunday
            return date.toLocaleDateString(i18n.language === 'id' ? 'id-ID' : 'en-US', { weekday: 'narrow' });
        });
    }, [i18n.language]);

    const currentYear = new Date().getFullYear();

    return (
        <Card className="p-6">
            {/* Header with Year and Navigation */}
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-tokens-fg">{t('heatmap.yearActivity', { year })}</h3>

                {/* Year Navigation Buttons */}
                {onYearChange && (
                    <div className="flex items-center gap-1 bg-tokens-bg-secondary rounded-lg p-1">
                        <button
                            onClick={() => onYearChange(year - 1)}
                            className="p-1.5 hover:bg-tokens-bg-tertiary rounded transition-colors"
                            title={t('activity:tooltips.previousYear', 'Previous year')}
                        >
                            <ChevronLeft size={16} className="text-tokens-muted" />
                        </button>
                        <button
                            onClick={() => onYearChange(currentYear)}
                            className={`p-1.5 rounded transition-colors ${year === currentYear
                                ? 'opacity-30 cursor-default'
                                : 'hover:bg-tokens-bg-tertiary'
                                }`}
                            title={t('activity:tooltips.backToToday', 'Back to current year')}
                            disabled={year === currentYear}
                        >
                            <Circle size={14} className="text-tokens-muted" />
                        </button>
                        <button
                            onClick={() => onYearChange(year + 1)}
                            className={`p-1.5 rounded transition-colors ${year >= currentYear
                                ? 'opacity-30 cursor-default'
                                : 'hover:bg-tokens-bg-tertiary'
                                }`}
                            title={t('activity:tooltips.nextYear', 'Next year')}
                            disabled={year >= currentYear}
                        >
                            <ChevronRight size={16} className="text-tokens-muted" />
                        </button>
                    </div>
                )}
            </div>

            {/* Custom SVG Heatmap - Scales to Fill */}
            <div className="w-full pb-1 relative overflow-x-auto">
                <svg
                    width="100%"
                    height={height}
                    viewBox={`0 0 ${totalWidth} ${height}`}
                    preserveAspectRatio="xMidYMin meet"
                    className="select-none w-full min-w-full"
                >
                    {/* Weekday labels - positioned for each row */}
                    {weekdayLabels.map((label, idx) => (
                        <text
                            key={`day-${idx}`}
                            x={20}
                            y={idx * (cellSize + cellGap) + cellSize / 2 + 2}
                            fontSize="10"
                            fill={isDark ? '#888' : '#666'}
                            textAnchor="end"
                            dominantBaseline="middle"
                        >
                            {label}
                        </text>
                    ))}

                    {/* Month groups */}
                    {months.map((monthGroup, monthIdx) => {
                        let monthX = labelOffset;
                        for (let i = 0; i < monthIdx; i++) {
                            monthX += (months[i].weeks.length * (cellSize + cellGap)) + monthGap;
                        }

                        return (
                            <g key={`month-${monthIdx}`}>
                                {/* Month label */}
                                <text
                                    x={monthX}
                                    y={height - 15}
                                    fontSize="11"
                                    fill={isDark ? '#888' : '#666'}
                                    fontWeight="400"
                                >
                                    {monthGroup.name}
                                </text>

                                {/* Week columns */}
                                {monthGroup.weeks.map((week, weekIdx) => {
                                    const weekX = monthX + weekIdx * (cellSize + cellGap);

                                    return (
                                        <g key={`week-${weekIdx}`}>
                                            {week.map((day) => {
                                                const y = day.weekday * (cellSize + cellGap);

                                                return (
                                                    <rect
                                                        key={day.date}
                                                        x={weekX}
                                                        y={y}
                                                        width={cellSize}
                                                        height={cellSize}
                                                        rx={2}
                                                        fill={getColor(day.level)}
                                                        className="transition-opacity cursor-pointer"
                                                        style={{ opacity: hoveredDay?.date === day.date ? 0.8 : 1 }}
                                                        onMouseEnter={() => setHoveredDay(day)}
                                                        onMouseLeave={() => setHoveredDay(null)}
                                                    >
                                                        <title>{`${day.date}: ${day.hours} hours`}</title>
                                                    </rect>
                                                );
                                            })}
                                        </g>
                                    );
                                })}
                            </g>
                        );
                    })}
                </svg>

                {/* Tooltip */}
                {hoveredDay && (
                    <div
                        className="absolute bg-tokens-panel border border-tokens-border rounded-lg px-3 py-2 shadow-lg text-xs pointer-events-none z-10"
                        style={{
                            left: '50%',
                            top: '10px',
                            transform: 'translateX(-50%)'
                        }}
                    >
                        <div className="font-semibold text-tokens-fg">{hoveredDay.date}</div>
                        <div className="text-tokens-muted">{hoveredDay.hours} {t('heatmap.hoursTracked', 'hours tracked')}</div>
                    </div>
                )}
            </div>

            {/* Stats Footer - Compact Single Line */}
            <div className="flex items-center justify-center mt-4">
                <div className="flex items-center gap-3 px-4 py-3 border border-tokens-border/30 rounded-lg text-xs">
                    <div className="flex items-center gap-1.5">
                        <span className="text-tokens-muted">{t('heatmap.dailyAverage', 'Daily average:')}</span>
                        <span className="font-semibold text-tokens-brand-DEFAULT">{stats.dailyAverage} {t('heatmap.mins', 'mins')}</span>
                    </div>
                    <span className="text-tokens-border">|</span>
                    <div className="flex items-center gap-1.5">
                        <span className="text-tokens-muted">{t('heatmap.daysLearned', 'Days learned:')}</span>
                        <span className="font-semibold text-tokens-brand-DEFAULT">{stats.daysLearned}%</span>
                    </div>
                    <span className="text-tokens-border">|</span>
                    <div className="flex items-center gap-1.5">
                        <span className="text-tokens-muted">{t('heatmap.longestStreak', 'Longest streak:')}</span>
                        <span className="font-semibold text-tokens-brand-DEFAULT">{stats.longestStreak} {t('heatmap.days', 'days')}</span>
                    </div>
                    <span className="text-tokens-border">|</span>
                    <div className="flex items-center gap-1.5">
                        <span className="text-tokens-muted">{t('heatmap.currentStreak', 'Current streak:')}</span>
                        <span className="font-semibold text-tokens-brand-DEFAULT">{stats.currentStreak} {t('heatmap.days', 'days')}</span>
                    </div>
                </div>
            </div>
        </Card>
    );
}
