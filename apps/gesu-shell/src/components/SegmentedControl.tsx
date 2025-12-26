import { ReactNode, useRef, useEffect, useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// SegmentedControl Component - Gesu Ecosystem Design System
// 
// A horizontal group of buttons for selecting one option from a set.
// Used for: Theme switcher, Energy levels, Install methods, etc.
// Now with smooth sliding pill animation!
// ─────────────────────────────────────────────────────────────────────────────

interface SegmentedControlOption {
    value: string;
    label: string;
    icon?: ReactNode;
}

interface SegmentedControlProps {
    options: SegmentedControlOption[];
    value: string;
    onChange: (value: string) => void;
    size?: 'sm' | 'md';
    fullWidth?: boolean;
    equalWidth?: boolean;  // Make all options equal width
    className?: string;
}

export function SegmentedControl({
    options,
    value,
    onChange,
    size = 'md',
    fullWidth = false,
    equalWidth = false,
    className = ''
}: SegmentedControlProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

    const sizeClasses = {
        sm: 'py-1.5 px-3 text-xs',
        md: 'py-2.5 px-4 text-sm'
    };

    // Update indicator position when value changes
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const activeButton = container.querySelector(`[data-value="${value}"]`) as HTMLButtonElement;
        if (activeButton) {
            setIndicatorStyle({
                left: activeButton.offsetLeft,
                width: activeButton.offsetWidth,
            });
        }
    }, [value, options]);

    return (
        <div
            ref={containerRef}
            className={`
            relative inline-flex bg-tokens-bg-secondary/50 p-1 rounded-full border border-tokens-border/50
            ${fullWidth ? 'w-full' : ''}
            ${className}
        `}
            role="radiogroup"
        >
            {/* Sliding Active Indicator */}
            <div
                className="absolute top-1 bottom-1 rounded-full transition-all duration-300 ease-out shadow-sm"
                style={{
                    left: `${indicatorStyle.left}px`,
                    width: `${indicatorStyle.width}px`,
                    backgroundColor: 'var(--brand)'
                }}
            />

            {options.map((option) => {
                const isSelected = value === option.value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        data-value={option.value}
                        onClick={() => onChange(option.value)}
                        className={`
                            relative z-10
                            ${fullWidth ? 'flex-1' : ''}
                            ${equalWidth ? 'min-w-[72px]' : ''}
                            ${sizeClasses[size]}
                            rounded-full font-medium transition-colors duration-300
                            flex items-center justify-center gap-2
                            ${isSelected
                                ? 'text-white'
                                : 'text-tokens-fg/70 hover:text-tokens-fg'
                            }
                        `}
                    >
                        {option.icon && <span className="shrink-0">{option.icon}</span>}
                        <span className={isSelected ? 'font-semibold' : 'font-medium'}>{option.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
