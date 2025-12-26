import { Filter, Check } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { BlueprintFileShape } from '../types/workflowBlueprints';

interface BlueprintFilterProps {
    value: string;
    onChange: (value: string) => void;
    statusFilters: string[];
    onStatusFilterChange: (filters: string[]) => void;
    typeFilters: string[];
    onTypeFilterChange: (filters: string[]) => void;
    blueprintData: BlueprintFileShape | null;
}

export function BlueprintFilter({ value, onChange, statusFilters, onStatusFilterChange, typeFilters, onTypeFilterChange, blueprintData }: BlueprintFilterProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Get active label
    const activeLabel = (() => {
        if (value === 'all') return 'All Blueprints';
        if (value === 'none') return 'No Blueprint';
        const bp = blueprintData?.blueprints.find(b => b.id === value);
        return bp ? bp.name : 'Unknown';
    })();

    // Build safe options (filtering out orphans)
    const options = (() => {
        if (!blueprintData) return [];

        // 1. Get valid blueprints (must have a corresponding category)
        // This is the CRITICAL ZOMBIE CHECK requested by user
        const validBlueprints = blueprintData.blueprints.filter(bp =>
            blueprintData.categories.some(c => c.id === bp.categoryId)
        ).sort((a, b) => a.name.localeCompare(b.name));

        return [
            { id: 'all', label: 'All Projects' },
            { id: 'none', label: 'No Blueprint' },
            ...validBlueprints.map(bp => ({
                id: bp.id,
                label: bp.name
            }))
        ];
    })();

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all
                    ${value !== 'all'
                        ? 'bg-tokens-brand-DEFAULT/10 border-tokens-brand-DEFAULT/50 text-tokens-brand-DEFAULT'
                        : 'bg-tokens-panel border-tokens-border text-tokens-muted hover:text-tokens-fg hover:border-tokens-fg/20'
                    }
                `}
            >
                <Filter size={16} />
                <span>{value !== 'all' ? activeLabel : 'Filter'}</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-tokens-panel border border-tokens-border rounded-lg shadow-xl z-50 p-1 animate-in fade-in zoom-in-95 duration-200">
                    <div className="text-xs font-semibold text-tokens-muted px-2 py-1.5 uppercase tracking-wider">
                        Filter by Status
                    </div>
                    <div className="px-2 pb-2 mb-2 border-b border-tokens-border space-y-1">
                        {['Ready to start', 'On progress', 'Completed'].map(status => (
                            <label key={status} className="flex items-center gap-2 cursor-pointer py-1 hover:bg-tokens-panel2 rounded px-1 -mx-1 transition-colors">
                                <input
                                    type="checkbox"
                                    className="rounded border-tokens-border bg-tokens-panel2 text-tokens-brand-DEFAULT focus:ring-1 focus:ring-tokens-brand-DEFAULT"
                                    checked={statusFilters.includes(status)}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            onStatusFilterChange([...statusFilters, status]);
                                        } else {
                                            onStatusFilterChange(statusFilters.filter(s => s !== status));
                                        }
                                    }}
                                />
                                <span className="text-sm text-tokens-fg">{status}</span>
                            </label>
                        ))}
                    </div>

                    <div className="text-xs font-semibold text-tokens-muted px-2 py-1.5 uppercase tracking-wider">
                        Filter by Type
                    </div>
                    <div className="px-2 pb-2 mb-2 border-b border-tokens-border space-y-1">
                        {[
                            { value: 'client', label: 'Client Project' },
                            { value: 'gesu-creative', label: 'Personal Project' },
                            { value: 'other', label: 'Other Project' }
                        ].map(type => (
                            <label key={type.value} className="flex items-center gap-2 cursor-pointer py-1 hover:bg-tokens-panel2 rounded px-1 -mx-1 transition-colors">
                                <input
                                    type="checkbox"
                                    className="rounded border-tokens-border bg-tokens-panel2 text-tokens-brand-DEFAULT focus:ring-1 focus:ring-tokens-brand-DEFAULT"
                                    checked={typeFilters.includes(type.value)}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            onTypeFilterChange([...typeFilters, type.value]);
                                        } else {
                                            onTypeFilterChange(typeFilters.filter(t => t !== type.value));
                                        }
                                    }}
                                />
                                <span className="text-sm text-tokens-fg">{type.label}</span>
                            </label>
                        ))}
                    </div>

                    <div className="text-xs font-semibold text-tokens-muted px-2 py-1.5 uppercase tracking-wider">
                        Filter by Blueprint
                    </div>
                    {options.map((option) => (
                        <button
                            key={option.id}
                            onClick={() => {
                                onChange(option.id);
                                setIsOpen(false);
                            }}
                            className={`
                                w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm text-left transition-colors
                                ${value === option.id
                                    ? 'bg-tokens-brand-DEFAULT/10 text-tokens-brand-DEFAULT'
                                    : 'text-tokens-fg hover:bg-tokens-panel2'
                                }
                            `}
                        >
                            <span className="truncate">{option.label}</span>
                            {value === option.id && <Check size={14} />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
