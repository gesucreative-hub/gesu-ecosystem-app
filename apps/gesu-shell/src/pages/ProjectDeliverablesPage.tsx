// Project Deliverables Page - S7-B: Per-project deliverable packs
// BUSINESS persona only

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '../components/PageContainer';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Badge } from '../components/Badge';
import { Select } from '../components/Select';
import { 
    Plus, Trash2, CheckSquare, Square, Package, Link as LinkIcon, 
    ChevronDown, ChevronRight, FileStack, X 
} from 'lucide-react';
import { usePersona } from '../hooks/usePersona';
import { listProjects, type Project } from '../stores/projectStore';
import { 
    listTemplates, 
    subscribe as subscribeTemplates,
    type DeliverableTemplate 
} from '../stores/deliverableTemplateStore';
import {
    listPacksByProjectId,
    createPackFromTemplate,
    createCustomPack,
    deletePack,
    toggleItemStatus,
    updatePackItem,
    addItemToPack,
    removePackItem,
    getPackStats,
    subscribe as subscribePacks,
    type DeliverablePack,
    type DeliverablePackItem
} from '../stores/deliverablePackStore';

export function ProjectDeliverablesPage() {
    const { t } = useTranslation(['deliverables', 'common']);
    const navigate = useNavigate();
    const { activePersona } = usePersona();

    // Project selection
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    
    // Data
    const [templates, setTemplates] = useState<DeliverableTemplate[]>([]);
    const [packs, setPacks] = useState<DeliverablePack[]>([]);
    const [expandedPackId, setExpandedPackId] = useState<string | null>(null);
    
    // Create modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [customPackName, setCustomPackName] = useState('');

    // Redirect if not business persona
    useEffect(() => {
        if (activePersona !== 'business') {
            navigate('/compass', { replace: true });
        }
    }, [activePersona, navigate]);

    // Load projects
    useEffect(() => {
        setProjects(listProjects());
    }, []);

    // Load templates and packs
    const loadData = useCallback(() => {
        setTemplates(listTemplates());
        if (selectedProjectId) {
            setPacks(listPacksByProjectId(selectedProjectId));
        } else {
            setPacks([]);
        }
    }, [selectedProjectId]);

    useEffect(() => {
        loadData();
        const unsub1 = subscribeTemplates(loadData);
        const unsub2 = subscribePacks(loadData);
        return () => { unsub1(); unsub2(); };
    }, [loadData]);

    // Handlers
    const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedProjectId(e.target.value);
        setExpandedPackId(null);
    };

    const openCreateModal = () => {
        setSelectedTemplateId('');
        setCustomPackName('');
        setShowCreateModal(true);
    };

    const handleCreatePack = () => {
        if (!selectedProjectId) return;
        
        if (selectedTemplateId) {
            createPackFromTemplate(selectedProjectId, selectedTemplateId);
        } else if (customPackName.trim()) {
            createCustomPack(selectedProjectId, customPackName);
        } else {
            return; // Nothing to create
        }
        
        setShowCreateModal(false);
        loadData();
    };

    const handleDeletePack = (packId: string) => {
        if (confirm(t('deliverables:packs.deleteConfirm', 'Delete this deliverable pack?'))) {
            deletePack(packId);
            loadData();
        }
    };

    const handleToggleItem = (packId: string, itemId: string) => {
        toggleItemStatus(packId, itemId);
        loadData();
    };

    const handleItemFileLinksChange = (packId: string, itemId: string, links: string[]) => {
        updatePackItem(packId, itemId, { fileLinks: links });
        loadData();
    };

    const handleAddItem = (packId: string, title: string) => {
        if (!title.trim()) return;
        addItemToPack(packId, { title });
        loadData();
    };

    const handleRemoveItem = (packId: string, itemId: string) => {
        removePackItem(packId, itemId);
        loadData();
    };

    const toggleExpand = (packId: string) => {
        setExpandedPackId(expandedPackId === packId ? null : packId);
    };

    // Component for pack item
    const PackItemRow = ({ pack, item }: { pack: DeliverablePack; item: DeliverablePackItem }) => {
        const [newLink, setNewLink] = useState('');
        
        const addLink = () => {
            if (!newLink.trim()) return;
            handleItemFileLinksChange(pack.id, item.id, [...item.fileLinks, newLink]);
            setNewLink('');
        };

        const removeLink = (linkIndex: number) => {
            handleItemFileLinksChange(pack.id, item.id, item.fileLinks.filter((_, i) => i !== linkIndex));
        };

        return (
            <div className="py-3 border-b border-tokens-border last:border-b-0">
                <div className="flex items-start gap-3">
                    <button
                        onClick={() => handleToggleItem(pack.id, item.id)}
                        className="mt-0.5 text-tokens-muted hover:text-tokens-brand-DEFAULT"
                    >
                        {item.status === 'done' ? (
                            <CheckSquare size={18} className="text-green-500" />
                        ) : (
                            <Square size={18} />
                        )}
                    </button>
                    <div className="flex-1">
                        <div className={`font-medium ${item.status === 'done' ? 'line-through text-tokens-muted' : ''}`}>
                            {item.title}
                        </div>
                        {item.description && (
                            <p className="text-sm text-tokens-muted mt-0.5">{item.description}</p>
                        )}
                        
                        {/* File Links */}
                        <div className="mt-2">
                            <div className="flex items-center gap-1.5 text-xs text-tokens-muted mb-1">
                                <LinkIcon size={12} />
                                <span>{t('deliverables:item.fileLinks', 'File Links')}</span>
                            </div>
                            <div className="space-y-1">
                                {item.fileLinks.map((link, index) => (
                                    <div key={index} className="flex items-center gap-2 text-sm">
                                        <a 
                                            href={link} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-tokens-brand-DEFAULT hover:underline truncate flex-1"
                                        >
                                            {link}
                                        </a>
                                        <button
                                            onClick={() => removeLink(index)}
                                            className="text-tokens-muted hover:text-red-500"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                                <div className="flex items-center gap-2">
                                    <Input
                                        value={newLink}
                                        onChange={(e) => setNewLink(e.target.value)}
                                        placeholder={t('deliverables:item.linkPlaceholder', 'https://... or file path')}
                                        className="text-sm flex-1"
                                        onKeyDown={(e) => e.key === 'Enter' && addLink()}
                                    />
                                    <Button size="sm" variant="ghost" onClick={addLink}>
                                        {t('deliverables:item.addLink', 'Add')}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => handleRemoveItem(pack.id, item.id)}
                        className="p-1 text-tokens-muted hover:text-red-500"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
        );
    };

    // Component for adding new item
    const AddItemInput = ({ packId }: { packId: string }) => {
        const [title, setTitle] = useState('');
        
        const handleAdd = () => {
            if (title.trim()) {
                handleAddItem(packId, title);
                setTitle('');
            }
        };

        return (
            <div className="flex items-center gap-2 pt-3">
                <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t('deliverables:packs.itemTitle', 'Item Title')}
                    className="text-sm flex-1"
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
                <Button size="sm" variant="outline" icon={<Plus size={14} />} onClick={handleAdd}>
                    {t('deliverables:packs.addItem', 'Add')}
                </Button>
            </div>
        );
    };

    return (
        <PageContainer>
            {/* Header */}
            <Card className="mb-6">
                <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <Package size={24} className="text-tokens-brand-DEFAULT" />
                            <div>
                                <h1 className="text-xl font-semibold">{t('deliverables:packs.title', 'Project Deliverables')}</h1>
                                <p className="text-sm text-tokens-muted">{t('deliverables:packs.subtitle', 'Track deliverables for your projects')}</p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Project Selector */}
                    <div className="flex items-center gap-4">
                        <Select
                            label={t('deliverables:packs.selectProject', 'Select a project')}
                            value={selectedProjectId}
                            onChange={handleProjectChange}
                            options={[
                                { value: '', label: t('deliverables:packs.selectProject', 'Select a project') },
                                ...projects.map(p => ({ value: p.id, label: p.name }))
                            ]}
                            className="flex-1"
                        />
                        {selectedProjectId && (
                            <Button icon={<Plus size={16} />} onClick={openCreateModal}>
                                {t('deliverables:packs.createFromTemplate', 'Create from Template')}
                            </Button>
                        )}
                    </div>
                </div>
            </Card>

            {/* No Project Selected */}
            {!selectedProjectId && (
                <Card className="p-8 text-center">
                    <Package size={40} className="mx-auto mb-4 text-tokens-muted opacity-50" />
                    <p className="text-tokens-muted">
                        {projects.length === 0 
                            ? t('deliverables:packs.noProjects', 'No projects found')
                            : t('deliverables:packs.selectProject', 'Select a project')}
                    </p>
                </Card>
            )}

            {/* Packs List */}
            {selectedProjectId && packs.length === 0 && (
                <Card className="p-8 text-center">
                    <FileStack size={40} className="mx-auto mb-4 text-tokens-muted opacity-50" />
                    <p className="text-tokens-muted">{t('deliverables:packs.noPacks', 'No deliverable packs for this project')}</p>
                </Card>
            )}

            {selectedProjectId && packs.length > 0 && (
                <div className="space-y-4">
                    {packs.map((pack) => {
                        const stats = getPackStats(pack.id);
                        const isExpanded = expandedPackId === pack.id;
                        
                        return (
                            <Card key={pack.id}>
                                {/* Pack Header */}
                                <div 
                                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-tokens-panel/50 transition-colors"
                                    onClick={() => toggleExpand(pack.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                        <div>
                                            <h3 className="font-medium">{pack.name}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant={stats?.percent === 100 ? 'success' : 'neutral'}>
                                                    {t('deliverables:packs.progress', '{{done}}/{{total}} completed', {
                                                        done: stats?.done || 0,
                                                        total: stats?.total || 0
                                                    })}
                                                </Badge>
                                                {stats?.percent === 100 && (
                                                    <Badge variant="success">✓</Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDeletePack(pack.id); }}
                                        className="p-2 text-tokens-muted hover:text-red-500"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                {/* Pack Items (Expanded) */}
                                {isExpanded && (
                                    <div className="px-4 pb-4">
                                        <div className="border-t border-tokens-border pt-2">
                                            {pack.items.map((item) => (
                                                <PackItemRow key={item.id} pack={pack} item={item} />
                                            ))}
                                            <AddItemInput packId={pack.id} />
                                        </div>
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Create Pack Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md">
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold">{t('deliverables:packs.createFromTemplate', 'Create from Template')}</h3>
                                <button onClick={() => setShowCreateModal(false)} className="text-tokens-muted hover:text-tokens-fg">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <Select
                                    label={t('deliverables:nav.templates', 'Template')}
                                    value={selectedTemplateId}
                                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                                    options={[
                                        { value: '', label: `-- ${t('deliverables:packs.createCustom', 'Custom Pack')} --` },
                                        ...templates.map(t => ({ value: t.id, label: `${t.name} (${t.items.length} items)` }))
                                    ]}
                                />
                                
                                {!selectedTemplateId && (
                                    <Input
                                        label={t('deliverables:packs.packName', 'Pack Name')}
                                        value={customPackName}
                                        onChange={(e) => setCustomPackName(e.target.value)}
                                        placeholder={t('deliverables:templates.namePlaceholder', 'e.g. Brand Design Package')}
                                    />
                                )}
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
                                    {t('common:buttons.cancel', 'Cancel')}
                                </Button>
                                <Button 
                                    onClick={handleCreatePack}
                                    disabled={!selectedTemplateId && !customPackName.trim()}
                                >
                                    {t('common:buttons.create', 'Create')}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </PageContainer>
    );
}
