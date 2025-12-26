/**
 * Radar Chart - SVG spider web chart for visualizing multi-dimensional data
 */

interface RadarChartProps {
    data: Record<string, number>; // Label -> Value (0-10)
    width?: number;
    height?: number;
    maxValue?: number;
    className?: string;
    showLabels?: boolean;
}

export function RadarChart({
    data,
    width = 300,
    height = 300,
    maxValue = 10,
    className = '',
    showLabels = true,
}: RadarChartProps) {
    const labels = Object.keys(data);
    const values = Object.values(data);
    const numPoints = labels.length;
    const radius = Math.min(width, height) / 2 - (showLabels ? 60 : 10); // Padding
    const centerX = width / 2;
    const centerY = height / 2;
    const angleStep = (Math.PI * 2) / numPoints;

    // Helper to calculate coordinates
    const getCoordinates = (value: number, index: number, scale: number = 1) => {
        const angle = index * angleStep - Math.PI / 2; // Start from top
        const r = (value / maxValue) * radius * scale;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;
        return { x, y };
    };

    // Generate web circles (grid)
    const renderGrid = () => {
        const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];
        return gridLevels.map((level, i) => {
            const points = labels.map((_, index) => {
                const { x, y } = getCoordinates(maxValue, index, level);
                return `${x},${y}`;
            }).join(' ');

            return (
                <polygon
                    key={`grid-${i}`}
                    points={points}
                    fill="none"
                    stroke="currentColor"
                    strokeOpacity={0.1}
                    className="text-tokens-muted"
                />
            );
        });
    };

    // Generate axis lines
    const renderAxes = () => {
        return labels.map((_, index) => {
            const { x, y } = getCoordinates(maxValue, index);
            return (
                <line
                    key={`axis-${index}`}
                    x1={centerX}
                    y1={centerY}
                    x2={x}
                    y2={y}
                    stroke="currentColor"
                    strokeOpacity={0.1}
                    className="text-tokens-muted"
                />
            );
        });
    };

    // Generate data polygon
    const points = values.map((val, index) => {
        const { x, y } = getCoordinates(val, index);
        return `${x},${y}`;
    }).join(' ');

    // Generate labels
    const renderLabels = () => {
        if (!showLabels) return null;

        return labels.map((label, index) => {
            const { x, y } = getCoordinates(maxValue, index, 1.2); // Push label out
            // Adjust anchor based on position
            const angle = index * angleStep - Math.PI / 2;
            let anchor: 'middle' | 'start' | 'end' = 'middle';

            if (Math.abs(Math.cos(angle)) < 0.1) anchor = 'middle';
            else if (Math.cos(angle) > 0) anchor = 'start';
            else anchor = 'end';

            return (
                <text
                    key={`label-${label}`}
                    x={x}
                    y={y}
                    textAnchor={anchor}
                    dy="0.35em"
                    className="text-[10px] fill-tokens-muted font-medium uppercase tracking-wider"
                >
                    {label}
                </text>
            );
        });
    };

    return (
        <svg
            width={width}
            height={height}
            className={className}
            viewBox={`0 0 ${width} ${height}`}
        >
            {/* Grid & Axes */}
            {renderGrid()}
            {renderAxes()}

            {/* Data Polygon */}
            <polygon
                points={points}
                fill="currentColor"
                fillOpacity={0.2}
                stroke="currentColor"
                strokeWidth={2}
                className="text-tokens-brand-DEFAULT transition-all duration-300 ease-out"
            />

            {/* Data Points */}
            {values.map((val, index) => {
                const { x, y } = getCoordinates(val, index);
                return (
                    <circle
                        key={`point-${index}`}
                        cx={x}
                        cy={y}
                        r={3}
                        className="fill-tokens-brand-DEFAULT hover:r-4 transition-all"
                    />
                );
            })}

            {renderLabels()}
        </svg>
    );
}
