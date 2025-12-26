/**
 * MiniBarChart Component
 * 
 * Compact bar chart for focus scores.
 * Shows 7 bars with auto-scaling.
 */

interface MiniBarChartProps {
    data: number[];
    maxValue?: number;
    color?: string;
    height?: number;
    className?: string;
}

export function MiniBarChart({
    data,
    maxValue = 10,
    color = 'var(--brand)',
    height = 60,
    className = ''
}: MiniBarChartProps) {
    if (data.length === 0) {
        return (
            <div className={`flex items-center justify-center ${className}`} style={{ height }}>
                <span className="text-xs text-tokens-muted">No data</span>
            </div>
        );
    }

    const width = 200;
    const padding = 8;
    const chartHeight = height - padding * 2;
    const barGap = 4;
    const barWidth = (width - padding * 2 - barGap * (data.length - 1)) / data.length;

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            className={`w-full ${className}`}
            style={{ height }}
        >
            {data.map((value, index) => {
                const barHeight = (value / maxValue) * chartHeight;
                const x = padding + index * (barWidth + barGap);
                const y = height - padding - barHeight;

                return (
                    <g key={index}>
                        {/* Bar */}
                        <rect
                            x={x}
                            y={y}
                            width={barWidth}
                            height={barHeight}
                            fill={color}
                            opacity={0.8}
                            rx={2}
                            className="transition-all duration-200 hover:opacity-100"
                        />

                        {/* Value label (on hover) */}
                        <title>{value.toFixed(1)}</title>
                    </g>
                );
            })}
        </svg>
    );
}
