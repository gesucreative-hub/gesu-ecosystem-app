import { useState, useRef, useEffect, ReactNode } from 'react';
import { ChevronDown, Search, Plus } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Combobox Component - Searchable Dropdown
// 
// API-compatible with SelectDropdown but adds search/filter capability.
// Best for large datasets (100+ items).
// ─────────────────────────────────────────────────────────────────────────────

export interface ComboboxOption {
    value: string;
    label: string;
    icon?: ReactNode;
}

export interface ComboboxProps {
    value: string;
    onChange: (value: string) => void;
    options: ComboboxOption[];
    placeholder?: string;
    label?: ReactNode;
    className?: string;
    disabled?: boolean;
    onCreateNew?: () => void; // Optional: Shows "+ Create New" button at top of dropdown
    createNewLabel?: string; // Optional: Custom label for create button (default: "Create New")
}

export function Combobox({
    value,
    onChange,
    options,
    placeholder = 'Search...',
    label,
    className = '',
    disabled = false,
    onCreateNew,
    createNewLabel = 'Create New'
}: ComboboxProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    // Filter options based on search query
    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchQuery('');
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Focus input when opening
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) {
            if (e.key === 'Enter' || e.key === 'ArrowDown') {
                e.preventDefault();
                setIsOpen(true);
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setFocusedIndex(prev =>
                    prev < filteredOptions.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setFocusedIndex(prev =>
                    prev > 0 ? prev - 1 : filteredOptions.length - 1
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
                    onChange(filteredOptions[focusedIndex].value);
                    setIsOpen(false);
                    setSearchQuery('');
                    setFocusedIndex(-1);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                setSearchQuery('');
                setFocusedIndex(-1);
                break;
        }
    };

    const handleOptionClick = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
        setSearchQuery('');
        setFocusedIndex(-1);
    };

    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            {label && (
                <label className="text-sm font-medium text-tokens-muted">
                    {label}
                </label>
            )}

            <div ref={containerRef} className="relative">
                {/* Trigger / Input */}
                <div className="relative">
                    <input
                        ref={inputRef}
                        type="text"
                        value={isOpen ? searchQuery : (selectedOption?.label || '')}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            if (!isOpen) setIsOpen(true);
                        }}
                        onFocus={() => setIsOpen(true)}
                        onKeyDown={handleKeyDown}
                        disabled={disabled}
                        placeholder={selectedOption?.label || placeholder}
                        className={`
                            w-full flex items-center gap-2 
                            px-4 py-2.5 pr-10 rounded-xl
                            bg-tokens-panel
                            border border-tokens-border
                            text-tokens-fg
                            transition-colors duration-150
                            focus:outline-none focus:ring-2 focus:ring-tokens-ring
                            ${disabled
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:bg-tokens-panel2 cursor-text'
                            }
                        `}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1">
                        {isOpen && <Search size={14} className="text-tokens-muted" />}
                        <ChevronDown
                            size={16}
                            className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        />
                    </div>
                </div>

                {/* Options Dropdown */}
                {isOpen && (
                    <div
                        className={`
                            absolute z-50 mt-2 left-0 right-0
                            py-2 rounded-2xl max-h-60 overflow-y-auto
                            bg-tokens-panel border border-tokens-border
                            shadow-xl shadow-black/10 dark:shadow-black/30
                            animate-in fade-in slide-in-from-top-2 duration-200
                        `}
                    >
                        {/* Create New Action */}
                        {onCreateNew && (
                            <>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onCreateNew();
                                        setIsOpen(false);
                                    }}
                                    className="
                                        w-full flex items-center gap-3
                                        px-4 py-2.5 text-left text-sm font-medium
                                        text-tokens-brand-DEFAULT
                                        hover:bg-tokens-brand-DEFAULT/10
                                        transition-colors duration-100 cursor-pointer
                                    "
                                >
                                    <Plus size={16} />
                                    <span>{createNewLabel}</span>
                                </button>
                                <div className="border-t border-tokens-border my-1" />
                            </>
                        )}

                        {/* Filtered Options */}
                        {filteredOptions.length === 0 ? (
                            <div className="px-4 py-6 text-center text-sm text-tokens-muted">
                                No results found for "{searchQuery}"
                            </div>
                        ) : (
                            filteredOptions.map((option, index) => (
                                <button
                                    key={option.value}
                                    onClick={() => handleOptionClick(option.value)}
                                    onMouseEnter={() => setFocusedIndex(index)}
                                    className={`
                                        w-full flex items-center gap-3
                                        px-4 py-2.5 text-left text-sm
                                        transition-colors duration-100 cursor-pointer
                                        ${option.value === value
                                            ? 'bg-tokens-brand-DEFAULT/10 text-tokens-brand-DEFAULT font-medium'
                                            : focusedIndex === index
                                                ? 'bg-tokens-panel2 text-tokens-fg'
                                                : 'text-tokens-fg hover:bg-tokens-panel2'
                                        }
                                    `}
                                >
                                    {option.icon && (
                                        <span className={option.value === value ? '' : 'text-tokens-muted'}>
                                            {option.icon}
                                        </span>
                                    )}
                                    <span>{option.label}</span>
                                </button>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
