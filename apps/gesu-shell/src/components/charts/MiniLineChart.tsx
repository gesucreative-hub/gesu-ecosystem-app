/**
 * MiniLineChart Component
 * 
 * Lightweight SVG line chart for energy trends.
 * Auto-scales data to fit container.
 */

interface MiniLineChartProps {
    data: number[];
    color?: string;
    height?: number;
    showDots?: boolean;
    className?: string;
}

export function MiniLineChart({
    data,
    color = 'var(--brand)',
    height = 60,
    showDots = false,
    className = ''
}: MiniLineChartProps) {
    if (data.length === 0) {
        return (
            <div className={`flex items-center justify-center ${className}`} style={{ height }}>
                <span className="text-xs text-tokens-muted">No data</span>
            </div>
        );
    }

    const width = 200;
    const padding = 8;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Calculate min/max for scaling
    const minValue = Math.min(...data);
    const maxValue = Math.max(...data);
    const valueRange = maxValue - minValue || 1; // Avoid division by zero

    // Generate points
    const points = data.map((value, index) => {
        const x = padding + (index / (data.length - 1)) * chartWidth;
        const y = padding + chartHeight - ((value - minValue) / valueRange) * chartHeight;
        return { x, y };
    });

    // Create path string
    const pathD = points
        .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
        .join(' ');

    // Create area path (for gradient fill)
    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`;

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            className={`w-full ${className}`}
            style={{ height }}
        >
            {/* Gradient */}
            <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.2 }} />
                    <stop offset="100%" style={{ stopColor: color, stopOpacity: 0 }} />
                </linearGradient>
            </defs>

            {/* Area fill */}
            <path
                d={areaD}
                fill="url(#lineGradient)"
            />

            {/* Line */}
            <path
                d={pathD}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* Dots */}
            {showDots && points.map((point, index) => (
                <circle
                    key={index}
                    cx={point.x}
                    cy={point.y}
                    r="3"
                    fill={color}
                    className="opacity-80"
                />
            ))}
        </svg>
    );
}
