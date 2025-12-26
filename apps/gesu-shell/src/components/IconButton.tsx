import { ReactNode, ButtonHTMLAttributes } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// IconButton Component - Gesu Ecosystem Design System
// 
// A compact button for icon-only actions with consistent sizing and hover states.
// Used for: Settings gear, collapse/expand, refresh, close buttons, etc.
// ─────────────────────────────────────────────────────────────────────────────

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    icon: ReactNode;
    variant?: 'ghost' | 'outline' | 'solid';
    size?: 'sm' | 'md' | 'lg';
}

export function IconButton({
    icon,
    variant = 'ghost',
    size = 'md',
    className = '',
    disabled,
    ...props
}: IconButtonProps) {
    const sizeClasses = {
        sm: 'w-7 h-7',
        md: 'w-9 h-9',
        lg: 'w-11 h-11'
    };

    const variantClasses = {
        ghost: 'bg-transparent hover:bg-tokens-panel2 text-tokens-muted hover:text-tokens-fg',
        outline: 'bg-transparent border border-tokens-border hover:bg-tokens-panel2 text-tokens-muted hover:text-tokens-fg',
        solid: 'bg-tokens-brand-DEFAULT text-tokens-brand-foreground hover:bg-tokens-brand-hover'
    };

    return (
        <button
            type="button"
            disabled={disabled}
            className={`
                ${sizeClasses[size]}
                ${variantClasses[variant]}
                inline-flex items-center justify-center rounded-lg
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-tokens-ring
                disabled:opacity-50 disabled:cursor-not-allowed
                ${className}
            `}
            {...props}
        >
            {icon}
        </button>
    );
}
