import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, ArrowRight, Home, Compass, Zap, Film, Target, FolderOpen } from 'lucide-react';
import { listProjects, setActiveProject } from '../stores/projectStore';

interface CommandPaletteModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type ResultType = 'page' | 'project' | 'action';

interface SearchResult {
    id: string;
    type: ResultType;
    label: string;
    description?: string;
    icon: React.ReactNode;
    action: () => void;
}

export function CommandPaletteModal({ isOpen, onClose }: CommandPaletteModalProps) {
    const { t } = useTranslation(['common', 'modals']);
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Reset when opening
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
        }
    }, [isOpen]);

    // Build searchable items
    const allItems = useMemo(() => {
        const items: SearchResult[] = [];

        // 1. Pages
        items.push(
            { id: 'page-dashboard', type: 'page', label: t('common:nav.dashboard'), icon: <Home size={16} />, action: () => navigate('/dashboard') },
            { id: 'page-compass', type: 'page', label: t('common:nav.compass'), icon: <Compass size={16} />, action: () => navigate('/compass') },
            { id: 'page-hub', type: 'page', label: t('common:nav.projectHub'), icon: <Zap size={16} />, action: () => navigate('/initiator') },
            { id: 'page-media', type: 'page', label: t('common:nav.mediaSuite'), icon: <Film size={16} />, action: () => navigate('/media-suite') },
            { id: 'page-refocus', type: 'page', label: t('common:nav.refocus'), icon: <Target size={16} />, action: () => navigate('/refocus') },
            { id: 'page-settings', type: 'page', label: t('common:nav.settings'), icon: <Search size={16} />, action: () => navigate('/settings') }
        );

        // 2. Projects
        const projects = listProjects();
        projects.forEach(p => {
            const label = p.clientName && p.projectTitle
                ? `${p.clientName} - ${p.projectTitle}`
                : p.name;

            items.push({
                id: `proj-${p.id}`,
                type: 'project',
                label: label,
                description: p.type === 'client' ? 'Client Project' : 'Project',
                icon: <FolderOpen size={16} className="text-tokens-brand-DEFAULT" />,
                action: () => {
                    navigate('/initiator');
                    setActiveProject(p.id);
                }
            });
        });

        return items;
    }, [navigate]);

    // Filter items
    const results = useMemo(() => {
        if (!query.trim()) return allItems.slice(0, 5); // Show top 5 recently/defaults if empty? Or just pages.

        const q = query.toLowerCase();
        return allItems.filter(item =>
            item.label.toLowerCase().includes(q) ||
            item.description?.toLowerCase().includes(q)
        ).slice(0, 10); // Limit to 10
    }, [query, allItems]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (results[selectedIndex]) {
                    results[selectedIndex].action();
                    onClose();
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, results, selectedIndex, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-tokens-panel border border-tokens-border shadow-2xl rounded-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
                {/* Search Input */}
                <div className="flex items-center px-4 py-3 border-b border-tokens-border">
                    <Search className="text-tokens-muted shrink-0 mr-3" size={20} />
                    <input
                        autoFocus
                        type="text"
                        placeholder={t('modals:commandPalette.placeholder')}
                        className="flex-1 bg-transparent border-none outline-none text-tokens-fg placeholder:text-tokens-muted text-lg font-medium"
                        value={query}
                        onChange={e => {
                            setQuery(e.target.value);
                            setSelectedIndex(0);
                        }}
                    />
                    <div className="text-xs font-mono text-tokens-muted border border-tokens-border rounded px-1.5 py-0.5">
                        ESC
                    </div>
                </div>

                {/* Results List */}
                <div className="max-h-[60vh] overflow-y-auto p-2 scrollbar-hide">
                    {results.length === 0 ? (
                        <div className="py-8 text-center text-tokens-muted">
                            {t('modals:commandPalette.noResults')}
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {results.map((item, index) => (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        item.action();
                                        onClose();
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors ${index === selectedIndex
                                        ? 'bg-tokens-brand-DEFAULT/10 text-tokens-brand-DEFAULT'
                                        : 'text-tokens-fg hover:bg-tokens-panel2'
                                        }`}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                >
                                    <div className={`shrink-0 ${index === selectedIndex ? 'text-tokens-brand-DEFAULT' : 'text-tokens-muted'}`}>
                                        {item.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{item.label}</div>
                                        {item.description && (
                                            <div className={`text-xs truncate ${index === selectedIndex ? 'text-tokens-brand-DEFAULT/70' : 'text-tokens-muted'}`}>
                                                {item.description}
                                            </div>
                                        )}
                                    </div>
                                    {index === selectedIndex && (
                                        <ArrowRight size={16} className="text-tokens-brand-DEFAULT shrink-0 animate-in fade-in slide-in-from-left-1" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2 bg-tokens-panel2 border-t border-tokens-border text-[10px] text-tokens-muted flex justify-between">
                    <div>
                        {t('modals:commandPalette.proTip')}
                    </div>
                    <div>
                        Gesu Ecosystem
                    </div>
                </div>
            </div>
        </div>
    );
}
