import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import ReactECharts from 'echarts-for-react';
import { ActivitySession } from '../../services/activityTrackingService';

interface PeriodActivityChartProps {
    sessions: ActivitySession[];
    /** Number of days to show (7 = weekly, 30 = monthly) */
    days: number;
    /** The end date of the period */
    endDate: Date;
}

/**
 * Pure chart renderer for period-based activity.
 * Navigation is handled by parent ChartCarousel.
 */
export function PeriodActivityChart({ sessions, days, endDate }: PeriodActivityChartProps) {
    const { i18n } = useTranslation();
    const dateLocale = i18n.language === 'id' ? 'id-ID' : 'en-US';
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    // Process data: Aggregate seconds per day
    const chartData = useMemo(() => {
        const result = new Map<string, number>(); // ISO Key (YYYY-MM-DD) -> seconds

        // Initialize last N days from endDate
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date(endDate);
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0];
            result.set(key, 0);
        }

        sessions.forEach(session => {
            if (session.type !== 'idle' && session.end_time) {
                const start = new Date(session.start_time);
                const end = new Date(session.end_time);

                const key = start.toISOString().split('T')[0];
                const duration = (end.getTime() - start.getTime()) / 1000;

                if (result.has(key)) {
                    result.set(key, (result.get(key) || 0) + duration);
                }
            }
        });

        // Convert to arrays
        const dates = Array.from(result.keys()).map(isoDate => {
            const date = new Date(isoDate);
            if (days > 14) {
                return date.toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' });
            }
            return date.toLocaleDateString(dateLocale, { weekday: 'short', day: 'numeric' });
        });

        const hours = Array.from(result.values()).map(seconds =>
            Number((seconds / 3600).toFixed(1))
        );

        return { dates, hours };
    }, [sessions, days, endDate]);

    const option = {
        backgroundColor: 'transparent',
        grid: {
            top: 10,
            right: 0,
            bottom: 20,
            left: 30,
            containLabel: true
        },
        tooltip: {
            trigger: 'axis',
            formatter: '{b}: {c} hrs',
            backgroundColor: isDark ? '#3d3d3d' : '#ffffff',
            borderColor: isDark ? '#525252' : '#e5e7eb',
            textStyle: {
                color: isDark ? '#f6f6f6' : '#1f2937'
            }
        },
        xAxis: {
            type: 'category',
            data: chartData.dates,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: {
                color: isDark ? '#888888' : '#6b7280',
                fontSize: 10,
                interval: days > 14 ? 'auto' : 0
            }
        },
        yAxis: {
            type: 'value',
            splitLine: {
                lineStyle: {
                    type: 'dashed',
                    color: isDark ? '#525252' : '#e5e7eb',
                    opacity: 0.5
                }
            },
            axisLabel: {
                color: isDark ? '#888888' : '#6b7280',
                formatter: '{value}h'
            }
        },
        series: [
            {
                data: chartData.hours,
                type: 'bar',
                barWidth: days > 14 ? '40%' : '50%',
                itemStyle: {
                    borderRadius: [4, 4, 0, 0],
                    color: '#4141b9'
                },
                showBackground: true,
                backgroundStyle: {
                    color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    borderRadius: [4, 4, 0, 0]
                }
            }
        ]
    };

    return (
        <div className="h-full w-full">
            <ReactECharts
                option={option}
                style={{ height: '100%', width: '100%' }}
                opts={{ renderer: 'svg' }}
            />
        </div>
    );
}
