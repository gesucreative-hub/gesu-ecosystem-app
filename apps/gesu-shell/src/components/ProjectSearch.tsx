import { Search, Folder, X, Target } from 'lucide-react';
import { useRef, useState, useEffect, useMemo } from 'react';
import { Project } from '../stores/projectStore';
import { useTranslation } from 'react-i18next';
import { updateTodayTopFocus } from '../stores/dailyCheckInStore';
import { isSessionActive } from '../stores/focusTimerStore';
import { useAlertDialog } from './AlertDialog';
interface ProjectSearchProps {
    projects: Project[];
    activeProjectId?: string | null;
    onSelect: (projectId: string) => void;
    onClear?: () => void; // Added onClear to props interface
    className?: string;
}

export function ProjectSearch({ projects, activeProjectId, onSelect, onClear: _onClear, className = '' }: ProjectSearchProps) {
    const { t } = useTranslation(['common']); // Added useTranslation hook
    const { alert, AlertDialogComponent } = useAlertDialog();
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    
    // S1-2c: Check if focus timer is active (belt-and-suspenders guard)
    const focusActive = isSessionActive();

    // Helper to format display name
    const getDisplayName = (p: Project) => {
        if (p.projectTitle) return p.projectTitle;
        let displayName = p.name;
        
        // Parse folder name convention: YYYYMMDD_BlueprintXXX_Client_ProjectName
        // Remove date prefix (8 digits + underscore)
        displayName = displayName.replace(/^\d{8}_/, '');
        
        // Remove blueprint prefix (e.g., "Default001_" or any Blueprint+digits)
        displayName = displayName.replace(/^[A-Za-z]+\d+_/, '');
        
        // Remove client name if present
        const client = p.clientName;
        if (client && displayName.startsWith(client + '_')) {
            displayName = displayName.substring(client.length + 1);
        }
        
        return displayName || p.name;
    };

    // Sync input with active project
    useEffect(() => {
        if (activeProjectId) {
            const project = projects.find(p => p.id === activeProjectId);
            if (project) {
                setQuery(getDisplayName(project));
            }
        } else {
            setQuery('');
        }
    }, [activeProjectId, projects]);

    // Filter projects
    const results = useMemo(() => {
        if (!query.trim()) return projects.slice(0, 5);
        // If query matches active project exactly, still show suggestions or show all? 
        // Showing suggestions is fine.

        return projects.filter(p => {
            const name = p.name.toLowerCase();
            const client = (p.clientName || '').toLowerCase();
            const display = getDisplayName(p).toLowerCase();
            const q = query.toLowerCase();
            return name.includes(q) || client.includes(q) || display.includes(q);
        }).slice(0, 10);
    }, [projects, query]);

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

    const handleSelect = (projectId: string) => {
        onSelect(projectId);
        setIsOpen(false);
        // Query update handled by useEffect
    };

    const handleClear = () => {
        onSelect(''); // Clear selection
        setQuery('');
        setIsOpen(true);
        inputRef.current?.focus();
    };

    // S1-2c: Set as Today's Focus handler
    const handleSetFocus = (e: React.MouseEvent, project: Project) => {
        e.stopPropagation(); // Don't trigger project selection
        
        // Update daily check-in with project as focus
        updateTodayTopFocus('project', project.id, undefined);
        
        // Show toast
        alert({
            title: t('common:alerts.focusUpdated'),
            message: t('common:alerts.focusUpdatedMessage', { name: getDisplayName(project) }),
            type: 'success'
        });
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-tokens-muted" />
                <input
                    ref={inputRef}
                    type="text"
                    placeholder={t('common:placeholders.searchProjects', 'Search projects...')}
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => {
                        setIsOpen(true);
                        // Optional: Select all text on focus for easy replacement
                        // e.target.select();
                    }}
                    className="w-full bg-tokens-panel2 border border-tokens-border rounded-lg pl-9 pr-8 py-2 text-sm text-tokens-fg placeholder:text-tokens-muted focus:outline-none focus:ring-1 focus:ring-tokens-brand-DEFAULT/50 transition-all min-w-[280px] focus:min-w-[380px]"
                />
                {query && (
                    <button
                        onClick={handleClear}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-tokens-muted hover:text-tokens-fg"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-[320px] bg-tokens-panel border border-tokens-border rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="max-h-[300px] overflow-y-auto p-1">
                        {results.length > 0 ? (
                            results.map(project => (
                                <div
                                    key={project.id}
                                    className={`
                                        w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-left group cursor-pointer
                                        ${project.id === activeProjectId ? 'bg-tokens-brand-DEFAULT/10' : 'hover:bg-tokens-panel2'}
                                    `}
                                    onClick={() => handleSelect(project.id)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSelect(project.id)}
                                >
                                    <div className={`
                                        p-1.5 rounded-md 
                                        ${project.id === activeProjectId ? 'bg-tokens-brand-DEFAULT/20 text-tokens-brand-DEFAULT' : 'bg-tokens-panel2 text-tokens-muted group-hover:text-tokens-fg'}
                                    `}>
                                        <Folder size={16} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className={`text-sm font-medium truncate ${project.id === activeProjectId ? 'text-tokens-brand-DEFAULT' : 'text-tokens-fg'}`}>
                                            {getDisplayName(project)}
                                        </div>
                                        {project.clientName && (
                                            <div className="text-xs text-tokens-muted truncate">
                                                {project.clientName}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* S1-2c: Set Focus button - hover visible only, hidden when focusActive */}
                                    {!focusActive && (
                                        <button
                                            onClick={(e) => handleSetFocus(e, project)}
                                            className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 rounded-md bg-tokens-panel2 hover:bg-tokens-brand-DEFAULT/20 text-tokens-muted hover:text-tokens-brand-DEFAULT transition-all"
                                            title={t('common:buttons.setAsFocus')}
                                            aria-label={t('common:buttons.setAsFocus')}
                                        >
                                            <Target size={14} />
                                        </button>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-8 text-center text-tokens-muted text-sm">
                                No projects found matching "{query}"
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            <AlertDialogComponent />
        </div>
    );
}
