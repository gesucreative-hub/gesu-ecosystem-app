/**
 * QuickAccessCard - Compact module card with icon, title, and stat
 * Used for the Quick Access row on Dashboard
 */

import { Link } from 'react-router-dom';
import { type ReactNode } from 'react';

interface QuickAccessCardProps {
    icon: ReactNode;
    title: string;
    stat: string;
    statLabel?: string;
    to: string;
    color?: string;
}

export function QuickAccessCard({ icon, title, stat, statLabel, to, color = 'brand' }: QuickAccessCardProps) {
    const colorClasses = {
        brand: 'from-tokens-brand-DEFAULT/20 to-tokens-brand-DEFAULT/5 hover:from-tokens-brand-DEFAULT/30',
        emerald: 'from-emerald-500/20 to-emerald-500/5 hover:from-emerald-500/30',
        purple: 'from-purple-500/20 to-purple-500/5 hover:from-purple-500/30',
        amber: 'from-amber-500/20 to-amber-500/5 hover:from-amber-500/30',
    };

    const iconColorClasses = {
        brand: 'text-tokens-brand-DEFAULT',
        emerald: 'text-emerald-500',
        purple: 'text-purple-500',
        amber: 'text-amber-500',
    };

    return (
        <Link
            to={to}
            className={`group w-full h-full flex flex-col items-center justify-center p-5 rounded-xl bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses] || colorClasses.brand} border border-tokens-border/30 hover:border-tokens-brand-DEFAULT/40 transition-all hover:shadow-md text-center gap-2`}
        >
            {/* Icon */}
            <div className={`w-10 h-10 rounded-lg bg-tokens-panel/50 flex items-center justify-center ${iconColorClasses[color as keyof typeof iconColorClasses] || iconColorClasses.brand}`}>
                {icon}
            </div>

            {/* Content */}
            <div className="flex flex-col items-center">
                <h3 className="text-sm font-semibold text-tokens-fg group-hover:text-tokens-brand-DEFAULT transition-colors mb-0.5">
                    {title}
                </h3>
                <div className="flex flex-col items-center">
                    <span className="text-lg font-bold text-tokens-fg leading-tight">{stat}</span>
                    {statLabel && (
                        <span className="text-[10px] text-tokens-muted leading-tight">{statLabel}</span>
                    )}
                </div>
            </div>
        </Link>
    );
}
