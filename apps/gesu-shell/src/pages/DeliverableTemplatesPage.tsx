// Deliverable Templates Page - S7-B: CRUD for reusable deliverable templates
// BUSINESS persona only

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '../components/PageContainer';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { SearchInput } from '../components/SearchInput';
import { Badge } from '../components/Badge';
import { SidePanel } from '../components/SidePanel';
import { Plus, Edit2, Trash2, FileStack, ChevronUp, ChevronDown, X } from 'lucide-react';
import { usePersona } from '../hooks/usePersona';
import {
    listTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    subscribe,
    type DeliverableTemplate
} from '../stores/deliverableTemplateStore';

interface EditableItem {
    id?: string;
    title: string;
    description: string;
}

export function DeliverableTemplatesPage() {
    const { t } = useTranslation(['deliverables', 'common']);
    const navigate = useNavigate();
    const { activePersona } = usePersona();

    const [templates, setTemplates] = useState<DeliverableTemplate[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    
    // Form state
    const [formName, setFormName] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formItems, setFormItems] = useState<EditableItem[]>([]);

    // Redirect if not business persona
    useEffect(() => {
        if (activePersona !== 'business') {
            navigate('/compass', { replace: true });
        }
    }, [activePersona, navigate]);

    const loadData = useCallback(() => {
        setTemplates(listTemplates());
    }, []);

    useEffect(() => {
        loadData();
        const unsub = subscribe(loadData);
        return unsub;
    }, [loadData]);

    // Filter templates by search
    const filteredTemplates = templates.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Open modal for create/edit
    const openCreateModal = () => {
        setEditingId(null);
        setFormName('');
        setFormDescription('');
        setFormItems([{ title: '', description: '' }]);
        setShowModal(true);
    };

    const openEditModal = (template: DeliverableTemplate) => {
        setEditingId(template.id);
        setFormName(template.name);
        setFormDescription(template.description);
        setFormItems(template.items.map(i => ({ id: i.id, title: i.title, description: i.description })));
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingId(null);
    };

    // Form handlers
    const addItem = () => {
        setFormItems([...formItems, { title: '', description: '' }]);
    };

    const removeItem = (index: number) => {
        setFormItems(formItems.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: 'title' | 'description', value: string) => {
        const updated = [...formItems];
        updated[index][field] = value;
        setFormItems(updated);
    };

    const moveItem = (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= formItems.length) return;
        const updated = [...formItems];
        [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
        setFormItems(updated);
    };

    const handleSave = () => {
        if (!formName.trim()) {
            alert(t('deliverables:templates.errorNoName', 'Template name is required'));
            return;
        }
        const validItems = formItems.filter(i => i.title.trim());
        if (validItems.length === 0) {
            alert(t('deliverables:templates.errorNoItems', 'Add at least one item'));
            return;
        }

        if (editingId) {
            updateTemplate(editingId, {
                name: formName,
                description: formDescription,
                items: validItems
            });
        } else {
            createTemplate({
                name: formName,
                description: formDescription,
                items: validItems
            });
        }
        closeModal();
        loadData();
    };

    const handleDelete = (id: string) => {
        if (confirm(t('deliverables:templates.deleteConfirm', 'Delete this template?'))) {
            deleteTemplate(id);
            loadData();
        }
    };

    return (
        <PageContainer>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                     <h1 className="text-3xl font-bold text-tokens-fg tracking-tight flex items-center gap-3">
                        <FileStack size={32} className="text-tokens-brand-DEFAULT" />
                        {t('deliverables:templates.title', 'Deliverable Templates')}
                    </h1>
                    <p className="text-tokens-muted text-sm mt-1">
                        {t('deliverables:templates.subtitle', 'Create reusable checklists for your projects')}
                    </p>
                </div>
                <Button variant="primary" icon={<Plus size={16} />} onClick={openCreateModal}>
                    {t('deliverables:templates.create', 'New Template')}
                </Button>
            </div>
            
            {/* Search */}
            <div className="mb-6">
                <SearchInput
                    placeholder={t('common:search', 'Search...')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Templates List */}
            {filteredTemplates.length === 0 ? (
                <Card className="p-8 text-center">
                    <FileStack size={40} className="mx-auto mb-4 text-tokens-muted opacity-50" />
                    <p className="text-tokens-muted">
                        {searchQuery
                            ? t('common:noResults', 'No results found')
                            : t('deliverables:templates.noTemplates', 'No templates yet. Create your first template!')}
                    </p>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {filteredTemplates.map((template) => (
                        <Card key={template.id} className="p-4 hover:border-tokens-brand-DEFAULT/50 transition-colors">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="font-medium text-lg">{template.name}</h3>
                                    {template.description && (
                                        <p className="text-sm text-tokens-muted mt-1">{template.description}</p>
                                    )}
                                    <div className="flex items-center gap-2 mt-2">
                                        <Badge variant="neutral">
                                            {t('deliverables:templates.itemsCount', '{{count}} items', { count: template.items.length })}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => openEditModal(template)}
                                        className="p-2 text-tokens-muted hover:text-tokens-brand-DEFAULT transition-colors"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(template.id)}
                                        className="p-2 text-tokens-muted hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create/Edit Panel */}
            <SidePanel
                isOpen={showModal}
                onClose={closeModal}
                title={editingId 
                    ? t('deliverables:templates.editTitle', 'Edit Template')
                    : t('deliverables:templates.createTitle', 'Create Template')}
                width="700px"
            >
                <div className="space-y-6">
                    <div className="space-y-4">
                        <Input
                            label={t('deliverables:templates.name', 'Template Name')}
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            placeholder={t('deliverables:templates.namePlaceholder', 'e.g. Brand Design Package')}
                            autoFocus
                        />
                        <Input
                            label={t('deliverables:templates.description', 'Description')}
                            value={formDescription}
                            onChange={(e) => setFormDescription(e.target.value)}
                            placeholder={t('deliverables:templates.descriptionPlaceholder', 'What this template includes...')}
                        />
                    </div>

                    {/* Items List */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-medium text-tokens-fg">
                                {t('deliverables:templates.items', 'Checklist Items')}
                            </label>
                            <span className="text-xs text-tokens-muted">
                                {formItems.length} items
                            </span>
                        </div>
                        
                        <div className="space-y-3">
                            <div className="max-h-[400px] overflow-y-auto pr-2 space-y-3 scrollbar-hide">
                                {formItems.map((item, index) => (
                                    <div key={index} className="flex gap-3 p-3 bg-tokens-panel2 border border-tokens-border/50 rounded-xl group/item">
                                        <div className="flex flex-col gap-1 pt-1">
                                            <button
                                                onClick={() => moveItem(index, 'up')}
                                                disabled={index === 0}
                                                className="p-1 text-tokens-muted hover:text-tokens-fg disabled:opacity-30 transition-colors"
                                                title="Move Up"
                                            >
                                                <ChevronUp size={14} />
                                            </button>
                                            <button
                                                onClick={() => moveItem(index, 'down')}
                                                disabled={index === formItems.length - 1}
                                                className="p-1 text-tokens-muted hover:text-tokens-fg disabled:opacity-30 transition-colors"
                                                title="Move Down"
                                            >
                                                <ChevronDown size={14} />
                                            </button>
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <Input
                                                value={item.title}
                                                onChange={(e) => updateItem(index, 'title', e.target.value)}
                                                placeholder={t('deliverables:templates.itemTitlePlaceholder', 'e.g. Logo Design')}
                                                className="text-sm font-medium"
                                            />
                                            <Input
                                                value={item.description}
                                                onChange={(e) => updateItem(index, 'description', e.target.value)}
                                                placeholder={t('deliverables:templates.itemDescription', 'Description (optional)')}
                                                className="text-sm text-tokens-muted bg-tokens-bg/50"
                                            />
                                        </div>
                                        <button
                                            onClick={() => removeItem(index)}
                                            className="self-start p-2 text-tokens-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover/item:opacity-100 focus:opacity-100"
                                            title="Remove Item"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <Button
                                variant="secondary"
                                size="sm"
                                icon={<Plus size={14} />}
                                onClick={addItem}
                                fullWidth
                                className="border-dashed border-tokens-border hover:border-tokens-brand-DEFAULT/50"
                            >
                                {t('deliverables:templates.addItem', 'Add Checklist Item')}
                            </Button>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-tokens-border">
                        <Button variant="secondary" onClick={closeModal}>
                            {t('common:buttons.cancel', 'Cancel')}
                        </Button>
                        <Button variant="primary" onClick={handleSave}>
                            {t('common:buttons.save', 'Save Template')}
                        </Button>
                    </div>
                </div>
            </SidePanel>
        </PageContainer>
    );
}
