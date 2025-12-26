import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { ActivitySession } from '../../services/activityTrackingService';

interface DailyHourlyChartProps {
    sessions: ActivitySession[];
    /** The date to display data for */
    date: Date;
}

/**
 * Pure chart renderer for hourly breakdown of a single day.
 * Navigation is handled by parent ChartCarousel.
 */
export function DailyHourlyChart({ sessions, date }: DailyHourlyChartProps) {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    // Filter sessions for the specified date
    const filteredSessions = useMemo(() => {
        const dateStr = date.toISOString().split('T')[0];
        return sessions.filter(session => {
            const sessionDate = new Date(session.start_time).toISOString().split('T')[0];
            return sessionDate === dateStr;
        });
    }, [sessions, date]);

    // Process data: Buckets per hour (0-23)
    const chartData = useMemo(() => {
        const buckets = new Array(24).fill(0);

        filteredSessions.forEach(session => {
            if (session.type !== 'focus' || !session.end_time) return;

            const start = new Date(session.start_time);
            const end = new Date(session.end_time);
            const hour = start.getHours();
            const duration = (end.getTime() - start.getTime()) / 1000 / 60; // minutes

            buckets[hour] += duration;
        });

        const hours = Array.from({ length: 24 }, (_, i) =>
            i.toString().padStart(2, '0') + ':00'
        );

        const data = buckets.map(mins => Math.round(mins));

        return { hours, data };
    }, [filteredSessions]);

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
            formatter: '{b}: {c} mins',
            backgroundColor: isDark ? '#3d3d3d' : '#ffffff',
            borderColor: isDark ? '#525252' : '#e5e7eb',
            textStyle: {
                color: isDark ? '#f6f6f6' : '#1f2937'
            }
        },
        xAxis: {
            type: 'category',
            data: chartData.hours,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: {
                color: isDark ? '#888888' : '#6b7280',
                fontSize: 10,
                interval: 3 // Show every 4th label (00, 04, 08...)
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
                formatter: '{value}m'
            }
        },
        series: [
            {
                data: chartData.data,
                type: 'bar',
                barWidth: '60%',
                itemStyle: {
                    borderRadius: [2, 2, 0, 0],
                    color: '#10b981'
                },
                showBackground: true,
                backgroundStyle: {
                    color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    borderRadius: [2, 2, 0, 0]
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
