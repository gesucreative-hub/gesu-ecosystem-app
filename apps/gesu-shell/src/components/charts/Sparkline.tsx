/**
 * Sparkline Component
 * 
 * Tiny trend line for stat cards.
 * Minimal, lightweight visualization.
 */

interface SparklineProps {
    data: number[];
    color?: string;
    width?: number;
    height?: number;
    className?: string;
}

export function Sparkline({
    data,
    color = 'var(--brand)',
    width = 60,
    height = 20,
    className = ''
}: SparklineProps) {
    if (data.length === 0) {
        return null;
    }

    const padding = 2;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Calculate min/max for scaling
    const minValue = Math.min(...data);
    const maxValue = Math.max(...data);
    const valueRange = maxValue - minValue || 1;

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

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            className={`inline-block ${className}`}
            style={{ width, height }}
        >
            <path
                d={pathD}
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.8}
            />
        </svg>
    );
}
