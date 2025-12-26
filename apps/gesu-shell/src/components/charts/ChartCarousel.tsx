/**
 * ChartCarousel - Swipeable chart wrapper for smooth day-by-day navigation
 * Uses Swiper.js for smooth carousel transitions
 */
import { useRef, useCallback, useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperType } from 'swiper';
import { Circle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card } from '../Card';

// Import Swiper styles
import 'swiper/css';

interface ChartCarouselProps {
    /** Current selected date */
    selectedDate: Date;
    /** Callback when date changes via swipe */
    onDateChange: (date: Date) => void;
    /** Number of days to show in the chart (1 = daily, 7 = weekly, 30 = monthly) */
    chartDays: number;
    /** Render function for the chart content */
    renderChart: (date: Date) => React.ReactNode;
    /** Title generator function */
    getTitle: (date: Date, isToday: boolean) => string;
}

export function ChartCarousel({
    selectedDate,
    onDateChange,
    chartDays: _chartDays, // Semantic prop for documentation
    renderChart,
    getTitle
}: ChartCarouselProps) {
    const { t } = useTranslation('activity');
    const swiperRef = useRef<SwiperType | null>(null);
    const [currentIndex, setCurrentIndex] = useState(1); // Start in middle (today)

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const normalizedSelected = new Date(selectedDate);
    normalizedSelected.setHours(0, 0, 0, 0);
    const isToday = normalizedSelected.toDateString() === today.toDateString();

    // Generate dates for slides: [prev, current, next]
    // We use a 3-slide window and reset when user swipes
    const generateSlides = useCallback((centerDate: Date) => {
        const prev = new Date(centerDate);
        prev.setDate(prev.getDate() - 1);

        const next = new Date(centerDate);
        next.setDate(next.getDate() + 1);

        return [prev, new Date(centerDate), next];
    }, []);

    const [slides, setSlides] = useState(() => generateSlides(selectedDate));

    // Update slides when selectedDate changes externally (e.g., Today button)
    useEffect(() => {
        setSlides(generateSlides(selectedDate));
        // Reset to middle slide without animation
        if (swiperRef.current && swiperRef.current.activeIndex !== 1) {
            swiperRef.current.slideTo(1, 0);
        }
        setCurrentIndex(1);
    }, [selectedDate, generateSlides]);

    const handleSlideChange = useCallback((swiper: SwiperType) => {
        const newIndex = swiper.activeIndex;

        if (newIndex === currentIndex) return;

        // Swiper direction: swipe right (finger goes right) = slide 0 = go to previous day
        // Swipe left (finger goes left) = slide 2 = go to next day (toward today)
        const direction = newIndex > currentIndex ? 1 : -1;
        const newDate = new Date(slides[1]);
        newDate.setDate(newDate.getDate() + direction);

        // Normalize dates for comparison
        const normalizedNew = new Date(newDate);
        normalizedNew.setHours(0, 0, 0, 0);

        const normalizedToday = new Date();
        normalizedToday.setHours(0, 0, 0, 0);

        // Only block if going INTO the future (beyond today)
        if (normalizedNew > normalizedToday) {
            swiper.slideTo(1, 200);
            return;
        }

        // Update the date
        onDateChange(newDate);
    }, [currentIndex, slides, onDateChange]);

    const handleToday = useCallback(() => {
        onDateChange(new Date());
    }, [onDateChange]);

    const title = getTitle(slides[1], isToday);

    return (
        <Card className="p-6 overflow-hidden">
            {/* Header with Title and Today Button */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-tokens-fg transition-all duration-200">
                    {title}
                </h3>

                {/* Today Button */}
                <button
                    onClick={handleToday}
                    disabled={isToday}
                    className={`p-2 rounded-lg transition-colors ${isToday
                        ? 'opacity-30 cursor-default'
                        : 'bg-tokens-bg-secondary hover:bg-tokens-bg-tertiary text-tokens-muted'
                        }`}
                    title="Back to today"
                >
                    <Circle size={14} />
                </button>
            </div>

            {/* Swiper Carousel */}
            <Swiper
                onSwiper={(swiper) => { swiperRef.current = swiper; }}
                onSlideChangeTransitionEnd={handleSlideChange}
                initialSlide={1}
                slidesPerView={1}
                spaceBetween={0}
                speed={200}
                resistance={true}
                resistanceRatio={0.5}
                className="h-[200px] w-full"
            >
                {slides.map((date, index) => (
                    <SwiperSlide key={`${date.toISOString()}-${index}`}>
                        <div className="h-full w-full">
                            {renderChart(date)}
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>

            {/* Swipe Hint */}
            <p className="text-[10px] text-tokens-muted text-center mt-2 opacity-60">
                ← {t('swipeHint', 'Swipe to navigate')} →
            </p>
        </Card>
    );
}
