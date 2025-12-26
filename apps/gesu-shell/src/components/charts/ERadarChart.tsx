/**
 * ERadarChart - ECharts-based radar/spider chart
 * Drop-in replacement for the custom SVG RadarChart
 */
import { useMemo, useState, useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts/core';
import { RadarChart as EChartsRadarChart } from 'echarts/charts';
import { TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

// Register required components
echarts.use([EChartsRadarChart, TooltipComponent, CanvasRenderer]);

interface ERadarChartProps {
    data: Record<string, number>; // Label -> Value (0-10)
    width?: number;
    height?: number;
    maxValue?: number;
    className?: string;
    showLabels?: boolean;
    showTooltip?: boolean;
    animated?: boolean;
}

export function ERadarChart({
    data,
    width = 300,
    height = 300,
    maxValue = 10,
    className = '',
    showLabels = true,
    showTooltip = true,
    animated = true,
}: ERadarChartProps) {
    const labels = Object.keys(data);
    const values = Object.values(data);

    // Animation guard - only animate on first render
    const hasAnimated = useRef(false);
    const shouldAnimate = animated && !hasAnimated.current;

    useEffect(() => {
        if (animated) {
            hasAnimated.current = true;
        }
    }, [animated]);

    // Detect dark mode - check multiple sources and poll on mount
    const checkTheme = () => {
        const isDarkClass = document.documentElement.classList.contains('dark');
        const isDarkAttr = document.documentElement.getAttribute('data-theme') === 'dark';
        return isDarkClass || isDarkAttr;
    };

    const [isDark, setIsDark] = useState(checkTheme);

    // Watch for theme changes and poll heavily on mount
    useEffect(() => {
        const updateTheme = () => {
            const dark = checkTheme();
            console.log('[ERadarChart] Theme check:', dark ? 'dark' : 'light');
            setIsDark(dark);
        };

        // Initial check
        updateTheme();

        // Poll every 100ms for the first second (catches delayed hydration)
        const intervals = [100, 300, 500, 1000].map(delay =>
            setTimeout(updateTheme, delay)
        );

        const observer = new MutationObserver(updateTheme);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class', 'data-theme'],
        });

        return () => {
            observer.disconnect();
            intervals.forEach(clearTimeout);
        };
    }, []);

    // Theme-aware colors
    const colors = useMemo(() => ({
        axisName: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(50, 50, 50, 0.8)',
        axisLine: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.2)', // Almost solid white
        splitLine: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.15)', // Highly visible white
        tooltipBg: isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        tooltipBorder: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(230, 211, 211, 0.1)',
        tooltipText: isDark ? 'rgba(255, 255, 255, 1)' : 'rgba(30, 30, 30, 0.9)',
    }), [isDark]);

    const option = useMemo(() => ({
        animation: shouldAnimate,
        animationDuration: 600,
        animationEasing: 'cubicOut',
        grid: {
            left: 20,
            right: 20,
            top: 20,
            bottom: 20,
        },
        tooltip: showTooltip ? {
            trigger: 'item',
            backgroundColor: colors.tooltipBg,
            borderColor: colors.tooltipBorder,
            borderWidth: 1,
            textStyle: {
                color: colors.tooltipText,
                fontSize: 12,
            },
            extraCssText: 'border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);',
            formatter: (params: any) => {
                const dataItems = params.value.map((val: number, idx: number) =>
                    `<div style="display: flex; justify-content: space-between; gap: 12px;">
                        <span style="color: ${isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'}">${labels[idx]}</span>
                        <span style="font-weight: 600">${val}/10</span>
                    </div>`
                ).join('');
                return `<div style="padding: 4px 0">${dataItems}</div>`;
            },
        } : undefined,
        radar: {
            indicator: labels.map(name => ({
                name: showLabels ? name : '',
                max: maxValue,
            })),
            shape: 'polygon',
            center: ['50%', '50%'],
            radius: showLabels ? '50%' : '75%', // Further reduced for label space
            nameGap: 8, // Add gap between chart and labels
            axisName: {
                color: colors.axisName,
                fontSize: 11,
                fontWeight: 500,
            },
            axisLine: {
                lineStyle: {
                    color: colors.axisLine,
                },
            },
            splitLine: {
                lineStyle: {
                    color: colors.splitLine,
                },
            },
            splitArea: {
                show: false,
            },
        },
        series: [{
            type: 'radar',
            symbol: 'circle',
            symbolSize: 6,
            emphasis: {
                lineStyle: {
                    width: 3,
                },
                areaStyle: {
                    opacity: 0.4,
                },
            },
            data: [{
                value: values,
                name: 'Focus Balance',
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(34, 197, 94, 0.4)' },
                        { offset: 1, color: 'rgba(34, 197, 94, 0.1)' },
                    ]),
                },
                lineStyle: {
                    color: '#22c55e',
                    width: 2,
                },
                itemStyle: {
                    color: '#22c55e',
                    borderColor: '#22c55e',
                    borderWidth: 2,
                },
            }],
        }],
    }), [data, labels, values, maxValue, showLabels, showTooltip, animated, colors, isDark]);

    // Debug logging
    console.log('[ERadarChart] Data:', data, 'Dimensions:', width, height);

    return (
        <ReactECharts
            option={option}
            style={{ width: `${width}px`, height: `${height}px` }}
            className={className}
            opts={{ renderer: 'canvas' }}
        />
    );
}
