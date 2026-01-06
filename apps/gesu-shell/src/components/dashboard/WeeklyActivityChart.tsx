/**
 * Weekly Activity Widget - Bar Chart Version
 * Shows activity/energy over the last 7 days using ECharts bar chart
 */

import { useMemo, useEffect, useState, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import { useTranslation } from 'react-i18next';
import { Card } from '../Card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { listSnapshots } from '../../services/compassSnapshotsService';
import { useAuth } from '../../contexts/AuthContext';

export function WeeklyActivityChart() {
    const { t, i18n } = useTranslation('dashboard');
    const { workspace } = useAuth();
    const [weeklyData, setWeeklyData] = useState<{ day: string; value: number }[]>([]);
    const [trendPercent, setTrendPercent] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    
    // Get theme-aware chart color
    const chartColor = useRef('#10b981'); // Default emerald
    useEffect(() => {
        const computedColor = getComputedStyle(document.documentElement).getPropertyValue('--status-success').trim();
        if (computedColor) chartColor.current = computedColor;
    }, []);

    useEffect(() => {
        const loadWeeklyActivity = async () => {
            setLoading(true);
            try {
                const snapshots = await listSnapshots(workspace?.workspacePath, 30);

                const today = new Date();
                const dateLocale = i18n.language === 'id' ? 'id-ID' : 'en-US';
                const data: { day: string; value: number }[] = [];

                // Group by date
                const dailyEnergy: { [date: string]: number[] } = {};
                snapshots.forEach(snapshot => {
                    const snapshotDate = new Date(snapshot.timestamp);
                    const dateKey = snapshotDate.toISOString().split('T')[0];
                    if (!dailyEnergy[dateKey]) {
                        dailyEnergy[dateKey] = [];
                    }
                    dailyEnergy[dateKey].push(snapshot.energy);
                });

                // Build last 7 days with locale-aware day names
                for (let i = 6; i >= 0; i--) {
                    const date = new Date(today);
                    date.setDate(today.getDate() - i);
                    const dateKey = date.toISOString().split('T')[0];
                    const dayName = new Intl.DateTimeFormat(dateLocale, { weekday: 'short' }).format(date);

                    if (dailyEnergy[dateKey] && dailyEnergy[dateKey].length > 0) {
                        const avg = dailyEnergy[dateKey].reduce((a, b) => a + b, 0) / dailyEnergy[dateKey].length;
                        data.push({ day: dayName, value: Math.round(avg) });
                    } else {
                        data.push({ day: dayName, value: 0 });
                    }
                }

                setWeeklyData(data);

                // Calculate trend (last 3 days vs previous 4 days)
                const recent = data.slice(-3).map(d => d.value).filter(v => v > 0);
                const older = data.slice(0, 4).map(d => d.value).filter(v => v > 0);

                if (recent.length > 0 && older.length > 0) {
                    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
                    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
                    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
                    setTrendPercent(Math.round(change));
                }
            } catch (err) {
                console.error('Failed to load weekly activity:', err);
            } finally {
                setLoading(false);
            }
        };

        if (workspace) {
            loadWeeklyActivity();
        }
    }, [workspace]);

    const chartOption = useMemo(() => ({
        animation: true,
        animationDuration: 500,
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(30, 30, 30, 0.95)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            textStyle: { color: '#fff', fontSize: 11 },
            formatter: (params: any) => {
                const value = params[0]?.value || 0;
                return `<span style="font-weight: 600">${value}/10</span>`;
            },
        },
        grid: {
            left: 0,
            right: 0,
            top: 10,
            bottom: 20,
            containLabel: false,
        },
        xAxis: {
            type: 'category',
            data: weeklyData.map(d => d.day),
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: {
                color: '#666666',
                fontSize: 10,
            },
        },
        yAxis: {
            type: 'value',
            show: true,
            max: 10,
            splitNumber: 5,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { show: false },
            splitLine: {
                show: true,
                lineStyle: {
                    type: 'dashed',
                    color: 'rgba(128, 128, 128, 0.2)',
                },
            },
        },
        series: [{
            type: 'bar',
            data: weeklyData.map(d => d.value),
            barWidth: '60%',
            itemStyle: {
                color: {
                    type: 'linear',
                    x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                        { offset: 0, color: chartColor.current },
                        { offset: 1, color: `${chartColor.current}66` }, // 40% opacity
                    ],
                },
                borderRadius: [4, 4, 0, 0],
            },
            emphasis: {
                itemStyle: {
                    color: chartColor.current,
                },
            },
        }],
    }), [weeklyData]);

    const hasData = weeklyData.some(d => d.value > 0);

    return (

        <Card className="h-full [&>div]:h-full" noPadding>
            <div className="p-5 flex flex-col h-full">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <h3 className="text-sm font-semibold text-tokens-fg">{t('hoursActivity.title')}</h3>
                        <div className="flex items-center gap-1 mt-1">
                            <span className="text-[10px] text-tokens-muted">{t('hoursActivity.weekly')}</span>
                        </div>
                    </div>
                    {trendPercent !== 0 && (
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${trendPercent > 0
                                ? 'bg-emerald-500/10 text-emerald-500'
                                : 'bg-red-500/10 text-red-500'
                            }`}>
                            {trendPercent > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                            {trendPercent > 0 ? '+' : ''}{trendPercent}%
                            <span className="text-tokens-muted ml-1">{t('hoursActivity.vsLastWeek')}</span>
                        </div>
                    )}
                </div>

                {/* Chart */}
                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-xs text-tokens-muted">{t('common:status.loading', 'Loading...')}</p>
                    </div>
                ) : !hasData ? (
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-xs text-tokens-muted">{t('hoursActivity.noData')}</p>
                    </div>
                ) : (
                    <div className="h-[120px] w-full">
                        <ReactECharts
                            option={chartOption}
                            style={{ height: '100%', width: '100%' }}
                            opts={{ renderer: 'canvas' }}
                            notMerge={true}
                            lazyUpdate={true}
                        />
                    </div>
                )}
            </div>
        </Card>
    );

}
