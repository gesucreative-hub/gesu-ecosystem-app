/**
 * SwipeableBarChart - Fixed-axis chart with sliding bar data
 * The axis labels remain stationary while bar data slides on swipe
 */
import { useRef, useState, useCallback, useMemo } from 'react';
import { Circle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '../Card';
import { useTranslation } from 'react-i18next';

interface BarData {
    label: string;
    value: number;
}

interface SwipeableBarChartProps {
    /** Function to generate bar data for a given date */
    getDataForDate: (date: Date) => BarData[];
    /** Current selected date */
    selectedDate: Date;
    /** Callback when date changes via swipe */
    onDateChange: (date: Date) => void;
    /** Title generator function */
    getTitle: (date: Date, isToday: boolean) => string;
    /** Y-axis formatter (e.g., "{value}m" or "{value}h") */
    yAxisFormatter?: (value: number) => string;
    /** Bar color */
    barColor?: string;
    /** Chart height */
    height?: number;
}

export function SwipeableBarChart({
    getDataForDate,
    selectedDate,
    onDateChange,
    getTitle,
    yAxisFormatter = (v) => `${v}`,
    barColor = '#10b981',
    height = 200
}: SwipeableBarChartProps) {
    const { t } = useTranslation(['activity']);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState(0);
    const dragStartX = useRef(0);
    const dragStartOffset = useRef(0);

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const normalizedSelected = new Date(selectedDate);
    normalizedSelected.setHours(0, 0, 0, 0);
    const isToday = normalizedSelected.toDateString() === today.toDateString();

    // Get data for current, previous, and next dates
    const currentData = useMemo(() => getDataForDate(selectedDate), [getDataForDate, selectedDate]);

    const prevDate = useMemo(() => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() - 1);
        return d;
    }, [selectedDate]);

    const nextDate = useMemo(() => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + 1);
        return d;
    }, [selectedDate]);

    // Calculate max value for Y-axis scaling
    const maxValue = useMemo(() => {
        const max = Math.max(...currentData.map(d => d.value), 1);
        // Round up to nice number
        const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
        return Math.ceil(max / magnitude) * magnitude || 10;
    }, [currentData]);

    // Y-axis ticks
    const yTicks = useMemo(() => {
        const ticks = [];
        const step = maxValue / 4;
        for (let i = 0; i <= 4; i++) {
            ticks.push(Math.round(step * i));
        }
        return ticks;
    }, [maxValue]);

    // Drag handlers
    const handleDragStart = useCallback((clientX: number) => {
        setIsDragging(true);
        dragStartX.current = clientX;
        dragStartOffset.current = dragOffset;
    }, [dragOffset]);

    const handleDragMove = useCallback((clientX: number) => {
        if (!isDragging) return;
        const delta = clientX - dragStartX.current;
        setDragOffset(dragStartOffset.current + delta);
    }, [isDragging]);

    const handleDragEnd = useCallback(() => {
        if (!isDragging) return;
        setIsDragging(false);

        const threshold = 60;

        if (dragOffset > threshold) {
            // Swiped right - go to previous day
            onDateChange(prevDate);
        } else if (dragOffset < -threshold) {
            // Swiped left - go to next day (if not future)
            const normalizedNext = new Date(nextDate);
            normalizedNext.setHours(0, 0, 0, 0);
            if (normalizedNext <= today) {
                onDateChange(nextDate);
            }
        }

        // Reset offset with animation
        setDragOffset(0);
    }, [isDragging, dragOffset, prevDate, nextDate, today, onDateChange]);

    // Mouse events
    const onMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        handleDragStart(e.clientX);
    };
    const onMouseMove = (e: React.MouseEvent) => handleDragMove(e.clientX);
    const onMouseUp = () => handleDragEnd();
    const onMouseLeave = () => isDragging && handleDragEnd();

    // Touch events
    const onTouchStart = (e: React.TouchEvent) => handleDragStart(e.touches[0].clientX);
    const onTouchMove = (e: React.TouchEvent) => handleDragMove(e.touches[0].clientX);
    const onTouchEnd = () => handleDragEnd();

    const handleToday = useCallback(() => {
        onDateChange(new Date());
    }, [onDateChange]);

    const title = getTitle(selectedDate, isToday);

    // Calculate bar dimensions
    const chartPadding = { top: 10, right: 10, bottom: 30, left: 40 };
    const barCount = currentData.length;
    const chartWidth = containerRef.current?.clientWidth || 400;
    const availableWidth = chartWidth - chartPadding.left - chartPadding.right;
    const barWidth = Math.max(availableWidth / barCount * 0.6, 4);
    const barGap = availableWidth / barCount;
    const chartHeight = height - chartPadding.top - chartPadding.bottom;

    // Opacity based on drag distance
    const dragOpacity = Math.max(0, 1 - Math.abs(dragOffset) / 200);

    return (
        <Card className="p-6 overflow-hidden">
            {/* Header with Navigation and Today Button */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-tokens-fg transition-all duration-200">
                    {title}
                </h3>

                {/* Navigation Buttons */}
                <div className="flex items-center gap-1 bg-tokens-bg-secondary rounded-lg p-1">
                    <button
                        onClick={() => {
                            const newDate = new Date(selectedDate);
                            newDate.setDate(newDate.getDate() - 1);
                            onDateChange(newDate);
                        }}
                        className="p-1.5 hover:bg-tokens-bg-tertiary rounded transition-colors"
                        title={t('activity:tooltips.previousDay', 'Previous day')}
                    >
                        <ChevronLeft size={16} className="text-tokens-muted" />
                    </button>
                    <button
                        onClick={handleToday}
                        disabled={isToday}
                        className={`p-1.5 rounded transition-colors ${isToday
                                ? 'opacity-30 cursor-default'
                                : 'hover:bg-tokens-bg-tertiary'
                            }`}
                        title={t('activity:tooltips.backToToday', 'Back to today')}
                    >
                        <Circle size={14} className={isToday ? 'text-tokens-muted' : 'text-tokens-fg fill-none'} />
                    </button>
                    <button
                        onClick={() => {
                            const newDate = new Date(selectedDate);
                            newDate.setDate(newDate.getDate() + 1);
                            const normalizedNew = new Date(newDate);
                            normalizedNew.setHours(0, 0, 0, 0);
                            const normalizedToday = new Date();
                            normalizedToday.setHours(0, 0, 0, 0);
                            if (normalizedNew <= normalizedToday) {
                                onDateChange(newDate);
                            }
                        }}
                        className={`p-1.5 rounded transition-colors ${isToday
                                ? 'opacity-30 cursor-default'
                                : 'hover:bg-tokens-bg-tertiary'
                            }`}
                        title={t('activity:tooltips.nextDay', 'Next day')}
                        disabled={isToday}
                    >
                        <ChevronRight size={16} className="text-tokens-muted" />
                    </button>
                </div>
            </div>

            {/* Chart Container */}
            <div
                ref={containerRef}
                className="relative select-none cursor-grab active:cursor-grabbing"
                style={{ height }}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseLeave}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                {/* Y-Axis (Fixed) */}
                <div
                    className="absolute left-0 top-0 bottom-0 flex flex-col justify-between pointer-events-none"
                    style={{ width: chartPadding.left, paddingTop: chartPadding.top, paddingBottom: chartPadding.bottom }}
                >
                    {yTicks.slice().reverse().map((tick, i) => (
                        <span
                            key={i}
                            className="text-[10px] text-right pr-2"
                            style={{ color: isDark ? '#888' : '#6b7280' }}
                        >
                            {yAxisFormatter(tick)}
                        </span>
                    ))}
                </div>

                {/* Grid Lines (Fixed) */}
                <svg
                    className="absolute pointer-events-none"
                    style={{
                        left: chartPadding.left,
                        top: chartPadding.top,
                        width: `calc(100% - ${chartPadding.left + chartPadding.right}px)`,
                        height: chartHeight
                    }}
                >
                    {yTicks.map((_, i) => (
                        <line
                            key={i}
                            x1="0"
                            y1={`${(i / (yTicks.length - 1)) * 100}%`}
                            x2="100%"
                            y2={`${(i / (yTicks.length - 1)) * 100}%`}
                            stroke={isDark ? '#525252' : '#e5e7eb'}
                            strokeDasharray="4,4"
                            strokeOpacity="0.5"
                        />
                    ))}
                </svg>

                {/* Bars (Sliding) */}
                <div
                    className="absolute transition-transform duration-150 ease-out"
                    style={{
                        left: chartPadding.left,
                        top: chartPadding.top,
                        width: `calc(100% - ${chartPadding.left + chartPadding.right}px)`,
                        height: chartHeight,
                        transform: `translateX(${dragOffset}px)`,
                        opacity: dragOpacity
                    }}
                >
                    {currentData.map((bar, i) => {
                        const barHeight = (bar.value / maxValue) * chartHeight;
                        const x = i * barGap + (barGap - barWidth) / 2;

                        return (
                            <div
                                key={i}
                                className="absolute bottom-0 rounded-t transition-all duration-200"
                                style={{
                                    left: x,
                                    width: barWidth,
                                    height: barHeight,
                                    backgroundColor: barColor,
                                    opacity: bar.value > 0 ? 1 : 0.2
                                }}
                            />
                        );
                    })}
                </div>

                {/* X-Axis Labels (Fixed) */}
                <div
                    className="absolute left-0 right-0 bottom-0 flex justify-between pointer-events-none"
                    style={{
                        paddingLeft: chartPadding.left,
                        paddingRight: chartPadding.right,
                        height: chartPadding.bottom
                    }}
                >
                    {currentData.map((bar, i) => {
                        // Only show every Nth label to avoid crowding
                        const showLabel = barCount <= 12 || i % Math.ceil(barCount / 8) === 0;
                        if (!showLabel) return null;

                        return (
                            <span
                                key={i}
                                className="text-[10px] text-center"
                                style={{
                                    color: isDark ? '#888' : '#6b7280',
                                    position: 'absolute',
                                    left: `calc(${chartPadding.left}px + ${(i + 0.5) * (100 / barCount)}%)`,
                                    transform: 'translateX(-50%)',
                                    bottom: 4
                                }}
                            >
                                {bar.label}
                            </span>
                        );
                    })}
                </div>
            </div>

            {/* Swipe Hint */}
            <p className="text-[10px] text-tokens-muted text-center mt-2 opacity-60">
                ← {t('swipeHint', 'Swipe to navigate')} →
            </p>
        </Card>
    );
}
