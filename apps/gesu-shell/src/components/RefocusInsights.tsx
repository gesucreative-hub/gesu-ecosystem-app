/**
 * RefocusInsights - Premium analytics component for Refocus page
 * Shows Flow State Radar, Recovery Patterns, and Weekly Insights
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from './Card';
import {
    TrendingUp, Zap, Target, Calendar,
    Brain, Wind, Shield, Cloud,
    Award, Clock, BarChart3
} from 'lucide-react';
import { getRefocusStats, type RefocusState } from '../services/refocusService';

const STATE_CONFIG: Record<RefocusState, { label: string; icon: typeof Brain; color: string; bgColor: string }> = {
    overwhelm: { label: 'Overwhelmed', icon: Brain, color: 'text-rose-400', bgColor: 'bg-rose-500' },
    restless: { label: 'Restless', icon: Wind, color: 'text-amber-400', bgColor: 'bg-amber-500' },
    avoiding: { label: 'Avoiding', icon: Shield, color: 'text-violet-400', bgColor: 'bg-violet-500' },
    foggy: { label: 'Foggy', icon: Cloud, color: 'text-sky-400', bgColor: 'bg-sky-500' }
};

// Map state IDs to locale key names
const STATE_KEY_MAP: Record<RefocusState, string> = {
    overwhelm: 'overwhelmed',
    restless: 'restless',
    avoiding: 'avoiding',
    foggy: 'foggy'
};


interface RefocusInsightsProps {
    className?: string;
}

export function RefocusInsights({ className = '' }: RefocusInsightsProps) {
    const { t, i18n } = useTranslation(['refocus', 'common']);
    const dateLocale = i18n.language === 'id' ? 'id-ID' : 'en-US';
    const stats = useMemo(() => getRefocusStats(), []);

    // Don't show if no data
    if (stats.totalResets < 3) {
        return null;
    }

    const maxStateCount = Math.max(...Object.values(stats.stateFrequency));
    const weeklyMax = Math.max(...stats.weeklyTrend.map(d => d.count), 1);

    // Calculate "flow score" - percentage of resets that led to focus sessions
    const flowScore = stats.completedResets > 0
        ? Math.round((stats.completedResets / stats.totalResets) * 100)
        : 0;

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Section Title */}
            <div className="flex items-center gap-2 mb-2">
                <BarChart3 size={18} className="text-tokens-brand-DEFAULT" />
                <h2 className="text-lg font-semibold text-tokens-fg">{t('refocus:analytics.recoveryPatterns', 'Your Recovery Patterns')}</h2>
            </div>

            {/* Top Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Flow Score */}
                <Card className="p-4 text-center">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-tokens-brand-DEFAULT/20 text-tokens-brand-DEFAULT mb-2">
                        <Zap size={20} />
                    </div>
                    <div className="text-2xl font-bold text-tokens-fg">{flowScore}%</div>
                    <div className="text-xs text-tokens-muted">{t('refocus:analytics.flowRate', 'Flow Rate')}</div>
                </Card>

                {/* Total Resets */}
                <Card className="p-4 text-center">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-violet-500/20 text-violet-400 mb-2">
                        <TrendingUp size={20} />
                    </div>
                    <div className="text-2xl font-bold text-tokens-fg">{stats.totalResets}</div>
                    <div className="text-xs text-tokens-muted">{t('refocus:analytics.totalResets', 'Total Resets')}</div>
                </Card>

                {/* Avg Time */}
                <Card className="p-4 text-center">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-sky-500/20 text-sky-400 mb-2">
                        <Clock size={20} />
                    </div>
                    <div className="text-2xl font-bold text-tokens-fg">
                        {stats.averageCompletionTime > 60
                            ? `${Math.round(stats.averageCompletionTime / 60)}m`
                            : `${stats.averageCompletionTime}s`
                        }
                    </div>
                    <div className="text-xs text-tokens-muted">{t('refocus:analytics.avgResetTime', 'Avg Reset Time')}</div>
                </Card>

                {/* Top Protocol */}
                <Card className="p-4 text-center">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 mb-2">
                        <Award size={20} />
                    </div>
                    <div className="text-sm font-bold text-tokens-fg truncate">
                        {stats.mostEffectiveProtocols[0]?.name || '—'}
                    </div>
                    <div className="text-xs text-tokens-muted">{t('refocus:analytics.topProtocol', 'Top Protocol')}</div>
                </Card>
            </div>

            {/* State Distribution Radar */}
            <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Target size={16} className="text-tokens-brand-DEFAULT" />
                    <h3 className="font-semibold text-tokens-fg">{t('refocus:analytics.stateDistribution', 'State Distribution')}</h3>
                </div>

                <div className="space-y-3">
                    {(Object.keys(STATE_CONFIG) as RefocusState[]).map(state => {
                        const config = STATE_CONFIG[state];
                        const count = stats.stateFrequency[state];
                        const percentage = maxStateCount > 0 ? (count / maxStateCount) * 100 : 0;
                        const Icon = config.icon;

                        return (
                            <div key={state} className="flex items-center gap-3">
                                <div className={`p-1.5 rounded-lg ${config.bgColor}/20`}>
                                    <Icon size={14} className={config.color} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm text-tokens-fg">{t(`refocus:mentalStates.${STATE_KEY_MAP[state]}`, config.label)}</span>
                                        <span className="text-xs text-tokens-muted">{count}x</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-tokens-bg-secondary overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${config.bgColor} transition-all duration-500`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>

            {/* Weekly Activity */}
            <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Calendar size={16} className="text-tokens-brand-DEFAULT" />
                    <h3 className="font-semibold text-tokens-fg">{t('refocus:analytics.thisWeek', 'This Week')}</h3>
                </div>

                <div className="flex items-end justify-between gap-2 h-24">
                    {stats.weeklyTrend.map((day, i) => {
                        const height = weeklyMax > 0 ? (day.count / weeklyMax) * 100 : 0;
                        const dayLabel = new Date(day.date).toLocaleDateString(dateLocale, { weekday: 'short' });
                        const isToday = day.date === new Date().toISOString().split('T')[0];

                        return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <div className="relative w-full flex-1 flex items-end justify-center">
                                    <div
                                        className={`
                                            w-full max-w-[24px] rounded-t transition-all duration-500
                                            ${isToday ? 'bg-tokens-brand-DEFAULT' : 'bg-tokens-brand-DEFAULT/40'}
                                        `}
                                        style={{ height: `${Math.max(height, 4)}%` }}
                                    />
                                    {day.count > 0 && (
                                        <span className="absolute -top-5 text-[10px] text-tokens-muted">
                                            {day.count}
                                        </span>
                                    )}
                                </div>
                                <span className={`text-[10px] ${isToday ? 'text-tokens-brand-DEFAULT font-semibold' : 'text-tokens-muted'}`}>
                                    {dayLabel}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </Card>

            {/* Effective Protocols */}
            {stats.mostEffectiveProtocols.length > 0 && (
                <Card className="p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Award size={16} className="text-tokens-brand-DEFAULT" />
                        <h3 className="font-semibold text-tokens-fg">{t('refocus:analytics.whatWorks', 'What Works For You')}</h3>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {stats.mostEffectiveProtocols.slice(0, 6).map((protocol, i) => (
                            <div
                                key={protocol.name}
                                className={`
                                    px-3 py-1.5 rounded-full text-xs font-medium
                                    ${i === 0
                                        ? 'bg-tokens-brand-DEFAULT/20 text-tokens-brand-DEFAULT border border-tokens-brand-DEFAULT/30'
                                        : 'bg-tokens-bg-secondary text-tokens-muted'
                                    }
                                `}
                            >
                                {protocol.name}
                                {protocol.helpfulCount > 1 && (
                                    <span className="ml-1 opacity-60">×{protocol.helpfulCount}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}
