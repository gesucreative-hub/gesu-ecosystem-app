import React, { ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right' | 'circle'; // 'circle' = the pill + icon circle style
    fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
    className = '',
    variant = 'primary',
    size = 'md',
    icon,
    iconPosition = 'left',
    fullWidth = false,
    children,
    ...props
}, ref) => {

    const baseStyles = "inline-flex items-center justify-between font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-tokens-ring focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none rounded-full select-none";

    const variants = {
        primary: "bg-tokens-brand-DEFAULT text-tokens-brand-foreground hover:bg-tokens-brand-hover shadow-lg shadow-tokens-brand-DEFAULT/20 border border-transparent",
        secondary: "bg-tokens-brand-DEFAULT/15 text-tokens-brand-DEFAULT hover:bg-tokens-brand-DEFAULT/25 border border-transparent",
        outline: "bg-transparent border border-tokens-border text-tokens-fg hover:bg-tokens-panel2 hover:border-tokens-brand-DEFAULT/50",
        ghost: "bg-transparent text-tokens-muted hover:text-tokens-fg hover:bg-tokens-sidebar-hover border border-transparent"
    };

    const sizes = {
        sm: "text-xs px-3 py-1.5 gap-2",
        md: "text-sm px-5 py-2.5 gap-3",
        lg: "text-base px-6 py-3 gap-4"
    };

    const widthClass = fullWidth ? 'w-full' : '';

    return (
        <button
            ref={ref}
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
            {...props}
        >
            {/* Left Icon (standard) */}
            {icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}

            <span className={fullWidth ? 'flex-1 text-center' : ''}>{children}</span>

            {/* Right Icon (standard) */}
            {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}

            {/* Circle Icon (Special Pill Style) */}
            {icon && iconPosition === 'circle' && (
                <div className={`
                    flex items-center justify-center rounded-full shrink-0 transition-transform group-hover:scale-110 ml-1
                    ${size === 'sm' ? 'w-5 h-5 -mr-1' : ''}
                    ${size === 'md' ? 'w-7 h-7 -mr-2 p-1' : ''}
                    ${size === 'lg' ? 'w-9 h-9 -mr-2 p-1.5' : ''}
                    ${variant === 'primary'
                        ? 'bg-tokens-brand-foreground/20 text-tokens-brand-foreground'
                        : 'bg-tokens-brand-DEFAULT text-tokens-brand-foreground shadow-sm'}
                `}>
                    {icon}
                </div>
            )}
        </button>
    );
});

Button.displayName = "Button";
