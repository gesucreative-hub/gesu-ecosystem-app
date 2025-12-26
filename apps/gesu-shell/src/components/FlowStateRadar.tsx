/**
 * FlowStateRadar - Clean, minimal circular visualization
 * Shows mental state balance with a refined aesthetic
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from './Card';
import { Activity, Brain, Wind, Shield, Cloud, Sparkles } from 'lucide-react';
import { getRefocusStats, type RefocusState } from '../services/refocusService';

const STATE_CONFIG: Record<RefocusState, {
    label: string;
    icon: typeof Brain;
    color: string;
    lightColor: string;
}> = {
    overwhelm: { label: 'Overwhelmed', icon: Brain, color: '#f43f5e', lightColor: '#fecdd3' },
    restless: { label: 'Restless', icon: Wind, color: '#f59e0b', lightColor: '#fde68a' },
    avoiding: { label: 'Avoiding', icon: Shield, color: '#8b5cf6', lightColor: '#ddd6fe' },
    foggy: { label: 'Foggy', icon: Cloud, color: '#0ea5e9', lightColor: '#bae6fd' }
};

// Map state IDs to locale key names
const STATE_KEY_MAP: Record<RefocusState, string> = {
    overwhelm: 'overwhelmed',
    restless: 'restless',
    avoiding: 'avoiding',
    foggy: 'foggy'
};

interface FlowStateRadarProps {
    className?: string;
}

export function FlowStateRadar({ className = '' }: FlowStateRadarProps) {
    const { t } = useTranslation(['refocus', 'common']);
    const stats = useMemo(() => getRefocusStats(), []);

    // Calculate flow health score (0-100)
    const flowHealth = useMemo(() => {
        if (stats.totalResets === 0) return 100;
        const completionRate = stats.completedResets / stats.totalResets;
        return Math.round(Math.max(0, Math.min(100, completionRate * 100)));
    }, [stats]);

    const totalResets = stats.totalResets;

    // Don't show if no data
    if (totalResets < 1) {
        return null;
    }

    // Calculate percentages for the donut chart
    const total = Object.values(stats.stateFrequency).reduce((a, b) => a + b, 0);
    const segments = useMemo(() => {
        const states: RefocusState[] = ['overwhelm', 'restless', 'avoiding', 'foggy'];
        let cumulative = 0;

        return states.map(state => {
            const count = stats.stateFrequency[state];
            const percentage = total > 0 ? (count / total) * 100 : 25;
            const startAngle = cumulative;
            cumulative += percentage;

            return {
                state,
                count,
                percentage,
                startAngle,
                endAngle: cumulative,
                config: STATE_CONFIG[state]
            };
        });
    }, [stats.stateFrequency, total]);

    // SVG donut chart calculations
    const size = 160;
    const strokeWidth = 20;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    const healthStatus = useMemo(() => {
        if (flowHealth >= 80) return t('refocus:flowState.healthStatus.excellent', 'Excellent');
        if (flowHealth >= 60) return t('refocus:flowState.healthStatus.good', 'Good');
        if (flowHealth >= 40) return t('refocus:flowState.healthStatus.fair', 'Fair');
        return t('refocus:flowState.healthStatus.needsWork', 'Needs Work');
    }, [flowHealth, t]);

    return (
        <Card className={`p-6 ${className}`}>
            <div className="flex items-center gap-2 mb-6">
                <Activity size={18} className="text-tokens-brand-DEFAULT" />
                <h3 className="text-sm font-semibold text-tokens-fg mb-4">{t('refocus:flowState.title', 'Flow State Radar')}</h3>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Donut Chart - Centered */}
                <div className="relative flex-shrink-0">
                    <svg width={size} height={size} className="transform -rotate-90">
                        {/* Background circle */}
                        <circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            fill="none"
                            stroke="var(--border)"
                            strokeWidth={strokeWidth}
                            opacity={0.3}
                        />

                        {/* Segments */}
                        {segments.map((segment, i) => {
                            const dashLength = (segment.percentage / 100) * circumference;
                            const dashOffset = -(segment.startAngle / 100) * circumference;

                            return (
                                <circle
                                    key={i}
                                    cx={size / 2}
                                    cy={size / 2}
                                    r={radius}
                                    fill="none"
                                    stroke={segment.config.color}
                                    strokeWidth={strokeWidth}
                                    strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                                    strokeDashoffset={dashOffset}
                                    strokeLinecap="round"
                                    className="transition-all duration-700 ease-out"
                                    style={{ opacity: segment.count > 0 ? 1 : 0.2 }}
                                />
                            );
                        })}
                    </svg>

                    {/* Center content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-tokens-brand-DEFAULT">{flowHealth}</span>
                        <span className="text-[10px] text-tokens-muted uppercase tracking-wider">{t('refocus:flowState.flowScore', 'Flow Score')}</span>
                    </div>
                </div>

                {/* Legend and Stats */}
                <div className="flex-1 space-y-4">
                    {/* State Legend */}
                    <div className="grid grid-cols-2 gap-3">
                        {segments.map((segment) => {
                            const Icon = segment.config.icon;
                            return (
                                <div
                                    key={segment.state}
                                    className="flex items-center gap-2 p-2 rounded-lg bg-tokens-bg-secondary"
                                >
                                    <div
                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: segment.config.color }}
                                    />
                                    <Icon size={14} className="text-tokens-muted flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <span className="text-xs text-tokens-fg truncate block">
                                            {t(`refocus:mentalStates.${STATE_KEY_MAP[segment.state]}`, segment.config.label)}
                                        </span>
                                    </div>
                                    <span className="text-xs font-medium text-tokens-muted">
                                        {segment.count}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Flow Health Card */}
                    <div className="p-4 rounded-xl bg-gradient-to-br from-tokens-brand-DEFAULT/10 to-transparent border border-tokens-brand-DEFAULT/20">
                        <div className="flex items-center gap-2 mb-1">
                            <Sparkles size={14} className="text-tokens-brand-DEFAULT" />
                            <div className="text-xs text-tokens-muted mb-2">{t('refocus:flowState.flowHealth', 'Flow Health')}: <span className="font-medium text-tokens-fg">{healthStatus}</span></div>
                        </div>
                        <p className="text-xs text-tokens-muted">
                            {t('refocus:flowState.completionStats', 'Based on {{completed}} of {{total}} resets completed successfully.', { completed: stats.completedResets, total: stats.totalResets })}
                        </p>
                    </div>

                    {/* Tip */}
                    {stats.mostCommonState && (
                        <p className="text-xs text-tokens-muted">
                            💡 {t('refocus:flowState.suggestion', { state: t(`refocus:mentalStates.${STATE_KEY_MAP[stats.mostCommonState]}`, STATE_CONFIG[stats.mostCommonState].label.toLowerCase()) })}
                        </p>
                    )}
                </div>
            </div>
        </Card>
    );
}
