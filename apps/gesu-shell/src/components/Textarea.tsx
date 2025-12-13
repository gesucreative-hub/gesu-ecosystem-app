import React, { TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    fullWidth?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({
    className = '',
    label,
    error,
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
            <textarea
                ref={ref}
                disabled={disabled}
                className={`
                    flex w-full rounded-lg border bg-tokens-bg px-3 py-2 text-sm text-tokens-fg shadow-sm transition-colors
                    placeholder:text-tokens-muted/50
                    border-tokens-border
                    focus:outline-none focus:ring-2 focus:ring-tokens-ring focus:border-tokens-brand-DEFAULT/50
                    disabled:cursor-not-allowed disabled:opacity-50
                    min-h-[80px]
                    ${error ? 'border-red-500 focus:ring-red-500/30' : ''}
                    ${className}
                `}
                {...props}
            />
            {error && (
                <p className="text-xs text-red-500 animate-in slide-in-from-top-1">{error}</p>
            )}
        </div>
    );
});

Textarea.displayName = "Textarea";
