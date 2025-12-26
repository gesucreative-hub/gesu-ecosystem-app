/**
 * Sparkline - Lightweight SVG line chart for visualizing energy trends
 */

interface SparklineProps {
    data: number[]; // Array of values (e.g., energy scores)
    width?: number;
    height?: number;
    color?: string;
    className?: string;
}

export function Sparkline({
    data,
    width = 120,
    height = 30,
    color = 'currentColor',
    className = '',
}: SparklineProps) {
    if (data.length < 2) {
        // Not enough data to draw a line
        return (
            <div
                className={`flex items-center justify-center text-xs text-tokens-muted ${className}`}
                style={{ width, height }}
            >
                Not enough data
            </div>
        );
    }

    const max = Math.max(...data, 10); // At least 10 for energy scale
    const min = Math.min(...data, 0);
    const range = max - min || 1; // Avoid division by zero

    // Calculate points for the polyline
    const step = width / (data.length - 1);
    const points = data
        .map((value, index) => {
            const x = index * step;
            const y = height - ((value - min) / range) * height;
            return `${x},${y}`;
        })
        .join(' ');

    return (
        <svg
            width={width}
            height={height}
            className={className}
            style={{ display: 'block' }}
        >
            {/* Polyline for the trend */}
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/* Dots at data points */}
            {data.map((value, index) => {
                const x = index * step;
                const y = height - ((value - min) / range) * height;
                return (
                    <circle
                        key={index}
                        cx={x}
                        cy={y}
                        r="2"
                        fill={color}
                    />
                );
            })}
        </svg>
    );
}
