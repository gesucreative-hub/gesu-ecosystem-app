/**
 * Daily Schedule Widget
 * Shows today's planned items from focus sessions and tasks
 */

import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '../Card';
import { ChevronRight, Target, CheckSquare, Clock, Zap } from 'lucide-react';
import { getTodayTasks } from '../../stores/projectHubTasksStore';

interface ScheduleItem {
    id: string;
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    to: string;
    color: string;
}

export function DailyScheduleWidget() {
    const { t } = useTranslation('dashboard');
    // Get tasks for today
    const tasks = getTodayTasks();
    const pendingTasks = tasks.filter(t => !t.done).slice(0, 3);

    // Build schedule items
    const scheduleItems: ScheduleItem[] = [
        {
            id: 'focus',
            icon: <Target size={16} />,
            title: t('dailySchedule.focusSession'),
            subtitle: t('dailySchedule.focusSessionDesc'),
            to: '/refocus',
            color: 'emerald',
        },
        ...pendingTasks.map(task => ({
            id: task.id,
            icon: <CheckSquare size={16} />,
            title: task.title.length > 25 ? task.title.slice(0, 25) + '...' : task.title,
            subtitle: t('task', 'Task'),
            to: '/initiator',
            color: 'brand',
        })),
    ];

    // If no tasks, add placeholder items
    if (pendingTasks.length === 0) {
        scheduleItems.push(
            {
                id: 'compass',
                icon: <Zap size={16} />,
                title: t('dailySchedule.logEnergy'),
                subtitle: t('dailySchedule.logEnergyDesc'),
                to: '/compass',
                color: 'amber',
            },
            {
                id: 'review',
                icon: <Clock size={16} />,
                title: t('dailySchedule.reviewActivity'),
                subtitle: t('dailySchedule.reviewActivityDesc'),
                to: '/activity',
                color: 'purple',
            }
        );
    }

    const colorClasses: Record<string, string> = {
        emerald: 'bg-emerald-500/20 text-emerald-500',
        brand: 'bg-tokens-brand-DEFAULT/20 text-tokens-brand-DEFAULT',
        amber: 'bg-amber-500/20 text-amber-500',
        purple: 'bg-purple-500/20 text-purple-500',
    };

    return (
        <Card className="h-full p-5 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-tokens-fg">{t('dailySchedule.title')}</h3>
            </div>

            {/* Schedule Items */}
            <div className="flex-1 space-y-2">
                {scheduleItems.slice(0, 4).map(item => (
                    <Link
                        key={item.id}
                        to={item.to}
                        className="group flex items-center gap-3 p-2.5 rounded-lg hover:bg-tokens-panel2 transition-colors"
                    >
                        {/* Icon */}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClasses[item.color]}`}>
                            {item.icon}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-tokens-fg truncate group-hover:text-tokens-brand-DEFAULT transition-colors">
                                {item.title}
                            </p>
                            <p className="text-[10px] text-tokens-muted">{item.subtitle}</p>
                        </div>

                        {/* Arrow */}
                        <ChevronRight size={14} className="text-tokens-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                ))}
            </div>
        </Card>
    );
}
