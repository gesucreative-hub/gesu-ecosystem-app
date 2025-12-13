import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Dropdown Menu Component - Gesu Ecosystem Design System
// 
// A floating dropdown menu with trigger button support.
// Theme-aware: Light mode uses white/gray, Dark mode uses dark panels.
// ─────────────────────────────────────────────────────────────────────────────

export interface DropdownMenuItem {
    id: string;
    label: string;
    icon?: ReactNode;
    shortcut?: string;
    hasSubmenu?: boolean;
    disabled?: boolean;
    danger?: boolean;
    onClick?: () => void;
}

export interface DropdownMenuSection {
    items: DropdownMenuItem[];
}

export interface DropdownProps {
    trigger: ReactNode;
    triggerClassName?: string;
    sections: DropdownMenuSection[];
    align?: 'left' | 'right';
    width?: 'auto' | 'sm' | 'md' | 'lg';
    className?: string;
}

export function Dropdown({
    trigger,
    triggerClassName = '',
    sections,
    align = 'left',
    width = 'md',
    className = ''
}: DropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Close on Escape
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);

    const widthClasses = {
        auto: 'w-auto min-w-[160px]',
        sm: 'w-48',
        md: 'w-56',
        lg: 'w-72'
    };

    const alignClasses = {
        left: 'left-0',
        right: 'right-0'
    };

    return (
        <div ref={containerRef} className={`relative inline-block ${className}`}>
            {/* Trigger */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    inline-flex items-center justify-between gap-2 
                    px-4 py-2.5 rounded-xl
                    bg-white dark:bg-[#1a1a1a]
                    border border-gray-200 dark:border-gray-700
                    text-gray-900 dark:text-gray-100
                    hover:bg-gray-50 dark:hover:bg-[#222]
                    transition-colors duration-150
                    focus:outline-none focus:ring-2 focus:ring-tokens-ring
                    ${triggerClassName}
                `}
            >
                {trigger}
                <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Menu */}
            {isOpen && (
                <div
                    className={`
                        absolute z-50 mt-2 ${alignClasses[align]} ${widthClasses[width]}
                        py-2 rounded-2xl
                        bg-white dark:bg-[#1a1a1a]
                        border border-gray-200/80 dark:border-gray-700/50
                        shadow-xl shadow-black/10 dark:shadow-black/30
                        animate-in fade-in slide-in-from-top-2 duration-200
                    `}
                >
                    {sections.map((section, sectionIndex) => (
                        <div key={sectionIndex}>
                            {/* Section Divider */}
                            {sectionIndex > 0 && (
                                <div className="my-2 mx-3 h-px bg-gray-200 dark:bg-gray-700" />
                            )}

                            {/* Menu Items */}
                            {section.items.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        if (!item.disabled && !item.hasSubmenu) {
                                            item.onClick?.();
                                            setIsOpen(false);
                                        }
                                    }}
                                    disabled={item.disabled}
                                    className={`
                                        w-full flex items-center justify-between gap-3
                                        px-4 py-2.5 text-left text-sm
                                        transition-colors duration-100
                                        ${item.disabled
                                            ? 'opacity-50 cursor-not-allowed'
                                            : 'cursor-pointer'
                                        }
                                        ${item.danger
                                            ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                                            : 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }
                                    `}
                                >
                                    {/* Left side: Icon + Label */}
                                    <span className="flex items-center gap-3">
                                        {item.icon && (
                                            <span className="text-gray-500 dark:text-gray-400">
                                                {item.icon}
                                            </span>
                                        )}
                                        <span className="font-medium">{item.label}</span>
                                    </span>

                                    {/* Right side: Shortcut or Submenu Arrow */}
                                    {item.shortcut && (
                                        <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                                            {item.shortcut}
                                        </span>
                                    )}
                                    {item.hasSubmenu && (
                                        <ChevronRight size={14} className="text-gray-400" />
                                    )}
                                </button>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Simple Select Dropdown - For form usage
// ─────────────────────────────────────────────────────────────────────────────

export interface SelectDropdownOption {
    value: string;
    label: string;
    icon?: ReactNode;
}

export interface SelectDropdownProps {
    value: string;
    onChange: (value: string) => void;
    options: SelectDropdownOption[];
    placeholder?: string;
    label?: ReactNode;
    className?: string;
    disabled?: boolean;
}

export function SelectDropdown({
    value,
    onChange,
    options,
    placeholder = 'Select...',
    label,
    className = '',
    disabled = false
}: SelectDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            {label && (
                <label className="text-sm font-medium text-tokens-muted">
                    {label}
                </label>
            )}

            <div ref={containerRef} className="relative">
                {/* Trigger */}
                <button
                    type="button"
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    disabled={disabled}
                    className={`
                        w-full flex items-center justify-between gap-2 
                        px-4 py-2.5 rounded-xl
                        bg-white dark:bg-[#1a1a1a]
                        border border-gray-200 dark:border-gray-700
                        text-left
                        transition-colors duration-150
                        focus:outline-none focus:ring-2 focus:ring-tokens-ring
                        ${disabled
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:bg-gray-50 dark:hover:bg-[#222] cursor-pointer'
                        }
                    `}
                >
                    <span className={`flex items-center gap-2 ${selectedOption ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400'}`}>
                        {selectedOption?.icon}
                        {selectedOption?.label || placeholder}
                    </span>
                    <ChevronDown
                        size={16}
                        className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    />
                </button>

                {/* Options Menu */}
                {isOpen && (
                    <div
                        className={`
                            absolute z-50 mt-2 left-0 right-0
                            py-2 rounded-2xl max-h-60 overflow-y-auto
                            bg-white dark:bg-[#1a1a1a]
                            border border-gray-200/80 dark:border-gray-700/50
                            shadow-xl shadow-black/10 dark:shadow-black/30
                            animate-in fade-in slide-in-from-top-2 duration-200
                        `}
                    >
                        {options.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`
                                    w-full flex items-center gap-3
                                    px-4 py-2.5 text-left text-sm
                                    transition-colors duration-100 cursor-pointer
                                    ${option.value === value
                                        ? 'bg-[#4141b9]/10 dark:bg-[#7cb342]/20 text-[#4141b9] dark:text-[#7cb342] font-medium'
                                        : 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                                    }
                                `}
                            >
                                {option.icon && (
                                    <span className={option.value === value ? '' : 'text-gray-500 dark:text-gray-400'}>
                                        {option.icon}
                                    </span>
                                )}
                                <span>{option.label}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
