import React, { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    fullWidth?: boolean;
    options: { value: string; label: string }[] | string[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({
    className = '',
    label,
    error,
    fullWidth = false,
    children,
    options,
    disabled,
    ...props
}, ref) => {
    // Normalize options to object format
    const normalizedOptions = options.map(opt =>
        typeof opt === 'string' ? { value: opt, label: opt } : opt
    );

    return (
        <div className={`flex flex-col gap-1.5 ${fullWidth ? 'w-full' : ''}`}>
            {label && (
                <label className="text-sm font-medium text-tokens-fg">
                    {label}
                </label>
            )}
            <div className="relative">
                <select
                    ref={ref}
                    disabled={disabled}
                    className={`
                        flex w-full rounded-lg border bg-tokens-bg px-3 py-2 text-sm text-tokens-fg shadow-sm transition-colors appearance-none
                        border-tokens-border
                        focus:outline-none focus:ring-2 focus:ring-tokens-ring focus:border-tokens-brand-DEFAULT/50
                        disabled:cursor-not-allowed disabled:opacity-50
                        ${error ? 'border-tokens-error focus:ring-tokens-error/30' : ''}
                        ${className}
                    `}
                    {...props}
                >
                    {normalizedOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                    {children}
                </select>
                {/* Custom Chevron */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-tokens-muted">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            </div>
            {error && (
                <p className="text-xs text-tokens-error animate-in slide-in-from-top-1">{error}</p>
            )}
        </div>
    );
});

Select.displayName = "Select";
