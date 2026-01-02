import { ReactNode } from 'react';

export type BadgeVariant = 'neutral' | 'brand' | 'success' | 'warning' | 'error' | 'outline';

interface BadgeProps {
    children: ReactNode;
    variant?: BadgeVariant;
    size?: 'sm' | 'md';
    className?: string;
}

export function Badge({ children, variant = 'neutral', size = 'md', className = '' }: BadgeProps) {
    const variants = {
        neutral: "bg-tokens-panel2 text-tokens-muted border border-tokens-border",
        brand: "bg-tokens-brand-DEFAULT/15 text-tokens-brand-DEFAULT border border-tokens-brand-DEFAULT/20",
        success: "bg-tokens-success/10 text-tokens-success border border-tokens-success/20",
        warning: "bg-tokens-warning/10 text-tokens-warning border border-tokens-warning/20",
        error: "bg-tokens-error/10 text-tokens-error border border-tokens-error/20",
        outline: "bg-transparent text-tokens-fg border border-tokens-border"
    };

    const sizes = {
        sm: "px-2 py-0.5 text-[10px] gap-1",
        md: "px-2.5 py-0.5 text-xs gap-1.5"
    };

    return (
        <span className={`
            inline-flex items-center rounded-full font-medium whitespace-nowrap transition-colors
            ${sizes[size]}
            ${variants[variant]} 
            ${className}
        `}>
            {children}
        </span>
    );
}
