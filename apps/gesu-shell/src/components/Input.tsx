import React, { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: React.ReactNode;
    error?: string;
    icon?: React.ReactNode;
    fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
    className = '',
    label,
    error,
    icon,
    fullWidth = false,
    disabled,
    ...props
}, ref) => {
    return (
        <div className={`flex flex-col gap-1.5 ${fullWidth ? 'w-full' : ''}`}>
            {label && (
                <label className="text-sm font-medium text-tokens-fg">
                    {label}
                </label>
            )}
            <div className="relative group">
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-tokens-muted group-focus-within:text-tokens-brand-DEFAULT transition-colors pointer-events-none">
                        {icon}
                    </div>
                )}
                <input
                    ref={ref}
                    disabled={disabled}
                    className={`
                        flex w-full rounded-lg border bg-tokens-bg px-3 py-2 text-sm text-tokens-fg shadow-sm transition-colors
                        placeholder:text-tokens-muted/50
                        border-tokens-border
                        focus:outline-none focus:ring-2 focus:ring-tokens-ring focus:border-tokens-brand-DEFAULT/50
                        disabled:cursor-not-allowed disabled:opacity-50
                        ${icon ? 'pl-9' : ''}
                        ${error ? 'border-red-500 focus:ring-red-500/30' : ''}
                        ${className}
                    `}
                    {...props}
                />
            </div>
            {error && (
                <p className="text-xs text-red-500 animate-in slide-in-from-top-1">{error}</p>
            )}
        </div>
    );
});

Input.displayName = "Input";
