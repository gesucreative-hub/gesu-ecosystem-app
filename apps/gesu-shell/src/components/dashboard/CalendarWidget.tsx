/**
 * Calendar Widget
 * Mini month calendar showing current month with activity indicators
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../Card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { listSnapshots } from '../../services/compassSnapshotsService';
import { useAuth } from '../../contexts/AuthContext';

export function CalendarWidget() {
    const { i18n } = useTranslation();
    const currentLocale = i18n.language === 'id' ? 'id-ID' : 'en-US';
    const { workspace } = useAuth();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [activityDays, setActivityDays] = useState<Set<number>>(new Set());

    const today = new Date();
    const isCurrentMonth = currentMonth.getMonth() === today.getMonth() &&
        currentMonth.getFullYear() === today.getFullYear();

    // Get month details
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay(); // 0 = Sunday

    const monthName = currentMonth.toLocaleDateString(currentLocale, { month: 'long', year: 'numeric' });

    // Load activity data for the month
    useEffect(() => {
        const loadActivityData = async () => {
            try {
                const snapshots = await listSnapshots(workspace?.workspacePath, 60);
                const days = new Set<number>();

                snapshots.forEach(snapshot => {
                    const date = new Date(snapshot.timestamp);
                    if (date.getMonth() === month && date.getFullYear() === year) {
                        days.add(date.getDate());
                    }
                });

                setActivityDays(days);
            } catch (err) {
                console.error('Failed to load calendar activity:', err);
            }
        };

        if (workspace) {
            loadActivityData();
        }
    }, [workspace, month, year]);

    const prevMonth = () => {
        setCurrentMonth(new Date(year, month - 1, 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(year, month + 1, 1));
    };

    // Build calendar grid
    const days = [];
    // Generate localized narrow weekday labels
    const weekDays = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(2024, 0, i); // Jan 2024 starts on Monday, so 0=Sun
        return new Intl.DateTimeFormat(currentLocale, { weekday: 'narrow' }).format(date);
    });

    // Empty cells before first day
    for (let i = 0; i < startingDay; i++) {
        days.push(<div key={`empty-${i}`} className="w-6 h-6" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = isCurrentMonth && day === today.getDate();
        const hasActivity = activityDays.has(day);

        days.push(
            <div
                key={day}
                className={`w-6 h-6 flex items-center justify-center text-[10px] rounded-full relative cursor-default
                    ${isToday
                        ? 'bg-tokens-brand-DEFAULT text-white font-bold'
                        : hasActivity
                            ? 'text-tokens-fg font-medium'
                            : 'text-tokens-muted'
                    }`}
            >
                {day}
                {hasActivity && !isToday && (
                    <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-500" />
                )}
            </div>
        );
    }

    return (
        <Card className="h-full p-4 flex flex-col">
            {/* Header with navigation */}
            <div className="flex items-center justify-between mb-3">
                <button
                    onClick={prevMonth}
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-tokens-panel2 transition-colors"
                >
                    <ChevronLeft size={14} className="text-tokens-muted" />
                </button>
                <span className="text-xs font-semibold text-tokens-fg">{monthName}</span>
                <button
                    onClick={nextMonth}
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-tokens-panel2 transition-colors"
                >
                    <ChevronRight size={14} className="text-tokens-muted" />
                </button>
            </div>

            {/* Week day headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
                {weekDays.map((day, i) => (
                    <div key={i} className="w-6 h-6 flex items-center justify-center text-[9px] font-medium text-tokens-muted">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1 flex-1">
                {days}
            </div>
        </Card>
    );
}
