import { InputHTMLAttributes, forwardRef } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Checkbox Component - Gesu Ecosystem Design System
// 
// A styled checkbox with consistent design, focus rings, and optional label.
// Uses brand color for checked state.
// ─────────────────────────────────────────────────────────────────────────────

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: string;
    description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({
    label,
    description,
    className = '',
    disabled,
    id,
    ...props
}, ref) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).slice(2, 9)}`;

    return (
        <div className={`flex items-start gap-3 ${disabled ? 'opacity-50' : ''}`}>
            <div className="relative flex items-center justify-center">
                <input
                    ref={ref}
                    type="checkbox"
                    id={checkboxId}
                    disabled={disabled}
                    className={`
                        peer
                        w-5 h-5 
                        rounded-md
                        border-2 border-tokens-border
                        bg-tokens-bg
                        cursor-pointer
                        transition-all duration-200
                        checked:bg-tokens-brand-DEFAULT
                        checked:border-tokens-brand-DEFAULT
                        hover:border-tokens-muted
                        focus:outline-none focus:ring-2 focus:ring-tokens-ring focus:ring-offset-2 focus:ring-offset-tokens-bg
                        disabled:cursor-not-allowed
                        appearance-none
                        ${className}
                    `}
                    {...props}
                />
                {/* Custom Checkmark */}
                <svg
                    className="absolute w-3.5 h-3.5 text-tokens-brand-foreground pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M3.5 8L6.5 11L12.5 5" />
                </svg>
            </div>

            {(label || description) && (
                <label
                    htmlFor={checkboxId}
                    className={`flex flex-col gap-0.5 cursor-pointer ${disabled ? 'cursor-not-allowed' : ''}`}
                >
                    {label && (
                        <span className="text-sm font-medium text-tokens-fg">
                            {label}
                        </span>
                    )}
                    {description && (
                        <span className="text-xs text-tokens-muted">
                            {description}
                        </span>
                    )}
                </label>
            )}
        </div>
    );
});

Checkbox.displayName = 'Checkbox';
