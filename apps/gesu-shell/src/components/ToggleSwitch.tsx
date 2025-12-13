import { useRef, useEffect, useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// ToggleSwitch Component - Gesu Ecosystem Design System
// 
// A sliding toggle switch with squircle shape and equal-width options.
// Uses pale brand colors: indigo for light, green for dark.
// Container: white for light, gesu black for dark.
// ─────────────────────────────────────────────────────────────────────────────

export interface ToggleOption {
    id: string;
    label: string;
}

export interface ToggleSwitchProps {
    options: ToggleOption[];
    value: string;
    onChange: (value: string) => void;
    label?: string;
    fullWidth?: boolean;
    className?: string;
}

export function ToggleSwitch({
    options,
    value,
    onChange,
    label,
    fullWidth = false,
    className = ''
}: ToggleSwitchProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

    // Update indicator position when value changes
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const activeIndex = options.findIndex(opt => opt.id === value);
        const buttons = container.querySelectorAll<HTMLButtonElement>('[data-toggle-option]');

        if (buttons[activeIndex]) {
            setIndicatorStyle({
                left: buttons[activeIndex].offsetLeft,
                width: buttons[activeIndex].offsetWidth,
            });
        }
    }, [value, options]);

    return (
        <div className={`flex flex-col gap-2 ${fullWidth ? 'w-full' : ''} ${className}`}>
            {label && (
                <label className="text-sm font-medium text-tokens-muted">
                    {label}
                </label>
            )}

            {/* Toggle Container - White (light) / Gesu Black (dark) */}
            <div
                ref={containerRef}
                className={`relative inline-flex items-center p-1 rounded-lg 
                           bg-white dark:bg-[#1a1a1a]
                           border border-gray-200 dark:border-gray-700
                           ${fullWidth ? 'w-full' : 'w-fit'}`}
            >
                {/* Sliding Indicator - Pale Indigo (light) / Pale Green (dark) */}
                <div
                    className="absolute top-1 bottom-1 rounded-md transition-all duration-300 ease-out
                               bg-[#4141b9]/15 dark:bg-[#7cb342]/20
                               border border-[#4141b9]/25 dark:border-[#7cb342]/30"
                    style={{
                        left: `${indicatorStyle.left}px`,
                        width: `${indicatorStyle.width}px`,
                    }}
                />

                {/* Option Buttons - Equal width when fullWidth */}
                {options.map((option) => {
                    const isActive = value === option.id;
                    return (
                        <button
                            key={option.id}
                            data-toggle-option={option.id}
                            onClick={() => onChange(option.id)}
                            className={`
                                relative z-10 px-4 py-1.5 text-xs font-medium rounded-md
                                transition-colors duration-200
                                ${fullWidth ? 'flex-1' : ''}
                                ${isActive
                                    ? 'text-[#4141b9] dark:text-[#7cb342]'
                                    : 'text-tokens-muted hover:text-tokens-fg'
                                }
                            `}
                        >
                            {option.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
