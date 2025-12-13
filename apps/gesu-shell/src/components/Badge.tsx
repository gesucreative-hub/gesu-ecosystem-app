import { ReactNode } from 'react';

export type BadgeVariant = 'neutral' | 'brand' | 'success' | 'warning' | 'error' | 'outline';

interface BadgeProps {
    children: ReactNode;
    variant?: BadgeVariant;
    className?: string;
}

export function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
    const variants = {
        neutral: "bg-tokens-panel2 text-tokens-muted border border-tokens-border",
        brand: "bg-tokens-brand-DEFAULT/15 text-tokens-brand-DEFAULT border border-tokens-brand-DEFAULT/20",
        success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
        warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
        error: "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20",
        outline: "bg-transparent text-tokens-fg border border-tokens-border"
    };

    return (
        <span className={`
            inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors
            ${variants[variant]} 
            ${className}
        `}>
            {children}
        </span>
    );
}
