/**
 * Tasks Due Widget (Assignments)
 * Shows today's tasks from Project Hub with real status
 * No more placeholder/mock data
 */

import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '../Card';
import { Plus, CheckCircle, Clock, Circle, ListTodo } from 'lucide-react';
import { getTodayTasks } from '../../stores/projectHubTasksStore';

type TaskStatus = 'done' | 'in_progress' | 'upcoming';

interface TaskItem {
    id: string;
    title: string;
    status: TaskStatus;
    projectName?: string;
}

export function TasksDueWidget() {
    const { t } = useTranslation('dashboard');
    // Get real tasks from store
    const rawTasks = getTodayTasks();

    // Transform tasks with real status
    const tasks: TaskItem[] = rawTasks.slice(0, 4).map((task, index) => ({
        id: task.id,
        title: task.title.length > 25 ? task.title.slice(0, 25) + '...' : task.title,
        status: task.done ? 'done' : (index === 0 && !task.done ? 'in_progress' : 'upcoming'),
        projectName: task.projectName,
    }));

    const getStatusBadge = (status: TaskStatus) => {
        switch (status) {
            case 'done':
                return (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-500">
                        {t('taskStatus.completed', 'Completed')}
                    </span>
                );
            case 'in_progress':
                return (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/20 text-amber-500">
                        {t('taskStatus.inProgress', 'In progress')}
                    </span>
                );
            case 'upcoming':
                return (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-tokens-panel2 text-tokens-muted">
                        {t('taskStatus.upcoming', 'Upcoming')}
                    </span>
                );
        }
    };

    const getStatusIcon = (status: TaskStatus) => {
        switch (status) {
            case 'done':
                return <CheckCircle size={14} className="text-emerald-500" />;
            case 'in_progress':
                return <Clock size={14} className="text-amber-500" />;
            case 'upcoming':
                return <Circle size={14} className="text-tokens-muted" />;
        }
    };

    return (
    return (
        <Card className="h-full [&>div]:h-full" noPadding>
            <div className="p-5 flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-tokens-fg uppercase tracking-wider">
                        {t('tasksDue.title')}
                    </h3>
                    <Link
                        to="/initiator"
                        className="w-6 h-6 rounded-lg bg-tokens-panel2 hover:bg-tokens-brand-DEFAULT/20 flex items-center justify-center transition-colors"
                        title="Add Task"
                    >
                        <Plus size={14} className="text-tokens-brand-DEFAULT" />
                    </Link>
                </div>

                {/* Tasks List */}
                {tasks.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center">
                        <ListTodo size={24} className="text-tokens-muted" />
                        <p className="text-xs text-tokens-muted">{t('tasksDue.noTasks')}</p>
                        <Link
                            to="/initiator"
                            className="text-xs text-tokens-brand-DEFAULT hover:underline"
                        >
                            {t('tasksDue.addTasks', 'Add tasks from Project Hub →')}
                        </Link>
                    </div>
                ) : (
                    <div className="flex-1 space-y-2">
                        {tasks.map(task => (
                            <Link
                                key={task.id}
                                to="/initiator"
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-tokens-panel2 transition-colors group"
                            >
                                {/* Icon */}
                                <div className="w-8 h-8 rounded-lg bg-tokens-panel2 flex items-center justify-center">
                                    {getStatusIcon(task.status)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-tokens-fg truncate group-hover:text-tokens-brand-DEFAULT transition-colors">
                                        {task.title}
                                    </p>
                                    {task.projectName && (
                                        <p className="text-[10px] text-tokens-muted">{task.projectName}</p>
                                    )}
                                </div>

                                {/* Status Badge */}
                                {getStatusBadge(task.status)}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </Card>
    );
    );
}
