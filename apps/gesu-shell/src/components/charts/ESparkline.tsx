/**
 * ESparkline - ECharts-based sparkline/mini line chart
 * Drop-in replacement for the custom SVG Sparkline
 */
import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { TooltipComponent, GridComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

// Register required components
echarts.use([LineChart, TooltipComponent, GridComponent, CanvasRenderer]);

interface ESparklineProps {
    data: number[];
    width?: number;
    height?: number;
    color?: string;
    className?: string;
    showTooltip?: boolean;
    animated?: boolean;
    showArea?: boolean;
}

export function ESparkline({
    data,
    width = 120,
    height = 30,
    color = '#22c55e',
    className = '',
    showTooltip = true,
    animated = true,
    showArea = true,
}: ESparklineProps) {
    if (data.length < 2) {
        return (
            <div
                className={`flex items-center justify-center text-xs text-tokens-muted ${className}`}
                style={{ width, height }}
            >
                Not enough data
            </div>
        );
    }

    const option = useMemo(() => ({
        animation: animated,
        animationDuration: 400,
        animationEasing: 'cubicOut',
        tooltip: showTooltip ? {
            trigger: 'axis',
            backgroundColor: 'rgba(30, 30, 30, 0.95)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            textStyle: {
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: 11,
            },
            extraCssText: 'border-radius: 6px; box-shadow: 0 2px 10px rgba(0,0,0,0.3); padding: 4px 8px;',
            formatter: (params: any) => {
                const value = params[0]?.value;
                return `<span style="font-weight: 600">${value}</span>`;
            },
            axisPointer: {
                type: 'none',
            },
        } : undefined,
        grid: {
            left: 0,
            right: 0,
            top: 2,
            bottom: 2,
            containLabel: false,
        },
        xAxis: {
            type: 'category',
            show: false,
            boundaryGap: false,
            data: data.map((_, i) => i),
        },
        yAxis: {
            type: 'value',
            show: false,
            min: 0,
            max: Math.max(...data, 10),
        },
        series: [{
            type: 'line',
            data: data,
            smooth: true,
            symbol: 'circle',
            symbolSize: 4,
            showSymbol: false,
            emphasis: {
                focus: 'series',
                lineStyle: {
                    width: 3,
                },
                itemStyle: {
                    borderWidth: 2,
                },
            },
            lineStyle: {
                color: color,
                width: 2,
            },
            itemStyle: {
                color: color,
            },
            areaStyle: showArea ? {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: `${color}40` },
                    { offset: 1, color: `${color}05` },
                ]),
            } : undefined,
        }],
    }), [data, color, showTooltip, animated, showArea]);

    return (
        <ReactECharts
            option={option}
            style={{ width, height }}
            className={className}
            opts={{ renderer: 'canvas' }}
        />
    );
}
