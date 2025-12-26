/**
 * ECharts Theme Configuration
 * Matches the Gesu Ecosystem design system
 */

export const gesuDarkTheme = {
    // Background colors
    backgroundColor: 'transparent',

    // Text colors
    textStyle: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontFamily: 'Inter, system-ui, sans-serif',
    },

    // Title styling
    title: {
        textStyle: {
            color: 'rgba(255, 255, 255, 0.9)',
            fontWeight: 600,
        },
        subtextStyle: {
            color: 'rgba(255, 255, 255, 0.5)',
        },
    },

    // Color palette (brand colors)
    color: [
        '#22c55e', // Primary green
        '#3b82f6', // Blue
        '#f59e0b', // Amber
        '#ec4899', // Pink
        '#8b5cf6', // Purple
        '#06b6d4', // Cyan
    ],

    // Radar chart specific
    radar: {
        axisName: {
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: 10,
            fontWeight: 500,
        },
        axisLine: {
            lineStyle: {
                color: 'rgba(255, 255, 255, 0.1)',
            },
        },
        splitLine: {
            lineStyle: {
                color: 'rgba(255, 255, 255, 0.1)',
            },
        },
        splitArea: {
            show: false,
        },
    },

    // Line chart specific
    line: {
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: {
            width: 2,
        },
    },

    // Tooltip styling
    tooltip: {
        backgroundColor: 'rgba(30, 30, 30, 0.95)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        textStyle: {
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: 12,
        },
        extraCssText: 'border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);',
    },

    // Axis styling (for line charts)
    categoryAxis: {
        axisLine: {
            show: false,
        },
        axisTick: {
            show: false,
        },
        axisLabel: {
            color: 'rgba(255, 255, 255, 0.4)',
            fontSize: 10,
        },
    },
    valueAxis: {
        axisLine: {
            show: false,
        },
        axisTick: {
            show: false,
        },
        axisLabel: {
            color: 'rgba(255, 255, 255, 0.4)',
            fontSize: 10,
        },
        splitLine: {
            lineStyle: {
                color: 'rgba(255, 255, 255, 0.05)',
            },
        },
    },
};
