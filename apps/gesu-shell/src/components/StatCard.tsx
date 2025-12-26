/**
 * StatCard Component
 * 
 * Reusable stat display with optional sparkline trend.
 * Used for productivity metrics on Dashboard.
 */

import { ESparkline } from './charts/ESparkline';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
    label: string;
    value: string | number;
    trend?: number[]; // Optional sparkline data
    change?: number; // Percentage change (e.g., 12.5 for +12.5%)
    icon?: React.ReactNode;
    className?: string;
}

export function StatCard({
    label,
    value,
    trend,
    change,
    icon,
    className = ''
}: StatCardProps) {
    // Determine trend direction
    const trendDirection = change !== undefined
        ? change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
        : 'stable';

    const trendColors = {
        up: 'text-tokens-success',
        down: 'text-tokens-error',
        stable: 'text-tokens-muted'
    };

    const TrendIcon = trendDirection === 'up' ? TrendingUp : trendDirection === 'down' ? TrendingDown : Minus;

    return (
        <div className={`bg-tokens-panel border border-tokens-border rounded-xl p-4 hover:border-tokens-brand-DEFAULT/20 transition-all ${className}`}>
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    {icon && (
                        <div className="w-8 h-8 rounded-lg bg-tokens-panel2 flex items-center justify-center text-tokens-brand-DEFAULT">
                            {icon}
                        </div>
                    )}
                    <span className="text-xs font-medium text-tokens-muted uppercase tracking-wider">
                        {label}
                    </span>
                </div>

                {/* Change indicator */}
                {change !== undefined && (
                    <div className={`flex items-center gap-1 text-xs font-medium ${trendColors[trendDirection]}`}>
                        <TrendIcon size={12} />
                        <span>{Math.abs(change).toFixed(1)}%</span>
                    </div>
                )}
            </div>

            {/* Value */}
            <div className="flex items-end justify-between">
                <div className="text-2xl font-bold text-tokens-fg">
                    {value}
                </div>

                {/* Sparkline */}
                {trend && trend.length > 0 && (
                    <ESparkline
                        data={trend}
                        color="#22c55e"
                        width={60}
                        height={24}
                        showTooltip={false}
                    />
                )}
            </div>
        </div>
    );
}
