import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, Trash2, AlertCircle } from 'lucide-react';
import { Project, ProjectType } from '../stores/projectStore';
import { useTranslation } from 'react-i18next';

// ─────────────────────────────────────────────────────────────────────────────
// Searchable Project Dropdown - Grouped by type with search and validation
// ─────────────────────────────────────────────────────────────────────────────

interface SearchableProjectDropdownProps {
    projects: Project[];
    value: string;
    onChange: (projectId: string) => void;
    onCleanupInvalid?: () => void;
    validateExists?: (project: Project) => boolean;
    label?: React.ReactNode;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

interface GroupedProjects {
    client: Project[];
    gesuCreative: Project[];
    other: Project[];
    invalid: Project[];
}

const TYPE_INFO: Record<ProjectType | 'invalid', { label: string; icon: string }> = {
    'client': { label: 'Client Projects', icon: '👥' },
    'gesu-creative': { label: 'Personal project', icon: '🎨' },
    'other': { label: 'Other', icon: '📦' },
    'invalid': { label: 'Invalid (Missing)', icon: '⚠️' }
};

export function SearchableProjectDropdown({
    projects,
    value,
    onChange,
    onCleanupInvalid,
    validateExists,
    label,
    placeholder = 'Select project...',
    className = '',
    disabled = false
}: SearchableProjectDropdownProps) {
    const { t } = useTranslation(['common', 'initiator']);
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Group and filter projects
    const groupedProjects = useMemo<GroupedProjects>(() => {
        const groups: GroupedProjects = {
            client: [],
            gesuCreative: [],
            other: [],
            invalid: []
        };

        projects.forEach(project => {
            // Check if project exists on disk (if validator provided)
            const isValid = validateExists ? validateExists(project) : true;

            if (!isValid) {
                groups.invalid.push(project);
            } else if (project.type === 'client') {
                groups.client.push(project);
            } else if (project.type === 'gesu-creative') {
                groups.gesuCreative.push(project);
            } else {
                groups.other.push(project);
            }
        });

        return groups;
    }, [projects, validateExists]);

    // Filter by search term
    const filteredGroups = useMemo<GroupedProjects>(() => {
        if (!search.trim()) return groupedProjects;

        const term = search.toLowerCase();
        return {
            client: groupedProjects.client.filter(p => p.name.toLowerCase().includes(term)),
            gesuCreative: groupedProjects.gesuCreative.filter(p => p.name.toLowerCase().includes(term)),
            other: groupedProjects.other.filter(p => p.name.toLowerCase().includes(term)),
            invalid: groupedProjects.invalid.filter(p => p.name.toLowerCase().includes(term))
        };
    }, [groupedProjects, search]);

    // Get selected project name
    const selectedProject = projects.find(p => p.id === value);

    // Handle click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus search input when opened
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    const handleSelect = (projectId: string) => {
        onChange(projectId);
        setIsOpen(false);
        setSearch('');
    };

    const renderGroup = (
        type: 'client' | 'gesuCreative' | 'other' | 'invalid',
        projectList: Project[]
    ) => {
        if (projectList.length === 0) return null;

        const typeKey = type === 'gesuCreative' ? 'gesu-creative' : type;
        const info = TYPE_INFO[typeKey as keyof typeof TYPE_INFO];

        return (
            <div key={type} className="py-1">
                {/* Group Header */}
                <div className="px-3 py-1.5 text-[10px] font-semibold text-tokens-muted uppercase tracking-wider flex items-center gap-2">
                    <span>{info.icon}</span>
                    <span>{info.label} ({projectList.length})</span>
                </div>

                {/* Group Items */}
                {projectList.map(project => {
                    // For client projects, show projectTitle without client prefix
                    const displayName = project.projectTitle || project.name;
                    return (
                        <button
                            key={project.id}
                            className={`
                            w-full px-3 py-2 text-left text-sm transition-colors
                            flex items-center gap-2
                            ${type === 'invalid'
                                    ? 'text-red-500/70 hover:bg-red-500/10 cursor-not-allowed'
                                    : 'text-tokens-fg hover:bg-tokens-panel2'
                                }
                            ${value === project.id ? 'bg-tokens-brand-DEFAULT/10 text-tokens-brand-DEFAULT' : ''}
                        `}
                            onClick={() => type !== 'invalid' && handleSelect(project.id)}
                            disabled={type === 'invalid'}
                        >
                            <span className="flex-1 truncate">{displayName}</span>
                            {type === 'invalid' && <AlertCircle size={14} className="text-red-500" />}
                            {project.clientName && type === 'client' && (
                                <span className="text-[10px] text-tokens-muted">{project.clientName}</span>
                            )}
                        </button>
                    );
                })}

                {/* Cleanup button for invalid projects */}
                {type === 'invalid' && onCleanupInvalid && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onCleanupInvalid();
                        }}
                        className="w-full px-3 py-2 text-left text-xs text-red-500 hover:bg-red-500/10 flex items-center gap-2 border-t border-tokens-border mt-1"
                    >
                        <Trash2 size={12} />
                        <span>Remove {projectList.length} Invalid Projects</span>
                    </button>
                )}
            </div>
        );
    };

    const hasResults =
        filteredGroups.client.length > 0 ||
        filteredGroups.gesuCreative.length > 0 ||
        filteredGroups.other.length > 0 ||
        filteredGroups.invalid.length > 0;

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {/* Label */}
            {label && (
                <label className="block text-sm font-medium text-tokens-fg mb-1.5">
                    {label}
                </label>
            )}

            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
                    w-full flex items-center justify-between gap-2 px-4 py-3
                    bg-tokens-panel border border-tokens-border rounded-lg
                    text-sm text-left transition-all
                    ${disabled
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-tokens-panel2 cursor-pointer'
                    }
                    ${isOpen ? 'ring-2 ring-tokens-brand-DEFAULT/40' : ''}
                `}
            >
                <span className={selectedProject ? 'text-tokens-fg' : 'text-tokens-muted'}>
                    {selectedProject?.name || placeholder}
                </span>
                <ChevronDown
                    size={16}
                    className={`text-tokens-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="absolute z-50 mt-1 w-full bg-tokens-panel border border-tokens-border rounded-lg shadow-xl overflow-hidden">
                    {/* Search Input */}
                    <div className="p-2 border-b border-tokens-border">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-tokens-muted" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder={t('common:placeholders.searchProjects', 'Search projects...')}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-tokens-panel2 border border-tokens-border rounded-md text-sm text-tokens-fg placeholder:text-tokens-muted focus:outline-none focus:ring-2 focus:ring-tokens-brand-DEFAULT/40"
                            />
                        </div>
                    </div>

                    {/* Project List */}
                    <div className="max-h-64 overflow-y-auto">
                        {hasResults ? (
                            <>
                                {renderGroup('client', filteredGroups.client)}
                                {renderGroup('gesuCreative', filteredGroups.gesuCreative)}
                                {renderGroup('other', filteredGroups.other)}
                                {renderGroup('invalid', filteredGroups.invalid)}
                            </>
                        ) : (
                            <div className="px-3 py-4 text-center text-sm text-tokens-muted">
                                {search ? t('initiator:filter.noBlueprintProjects', 'No projects with this blueprint') : 'No projects available'}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
