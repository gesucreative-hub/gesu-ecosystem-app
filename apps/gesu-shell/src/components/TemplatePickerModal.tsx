// Template Picker Modal - Sprint 21.3 Phase 7
// Enhanced Sprint 21.5: Added search, AI prompt, and import features

import { useState, useMemo, useRef } from 'react';
import { X, Layers, Search, Copy, Upload, Check, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { Button } from './Button';
import { WorkflowBlueprint, TemplateCategory } from '../types/workflowBlueprints';
import { getTemplatesGroupedByCategory, duplicateTemplate } from '../services/blueprintTemplates';
import { getHiddenTemplates, hideTemplate, unhideTemplate } from '../services/templatePreferencesService';
import { useTranslation } from 'react-i18next';

interface TemplatePickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (blueprint: WorkflowBlueprint) => void;
}

const CATEGORY_KEYS: Record<TemplateCategory, string> = {
    creative: 'initiator:templatePicker.categories.creative',
    development: 'initiator:templatePicker.categories.development',
    general: 'initiator:templatePicker.categories.general',
};

// AI Prompt templates - scalable for i18n
const AI_PROMPTS: Record<string, { title: string; prompt: string }> = {
    en: {
        title: 'Generate Blueprint with AI',
        prompt: `Create a detailed workflow blueprint for [PROJECT TYPE] with the following specifications:

1. Define 4-6 phases (e.g., Planning, Design, Development, Review, Delivery)
2. For each phase, include 2-5 specific steps
3. Each step should have:
   - A clear title
   - A brief description
   - 2-3 Definition of Done (DoD) criteria
   - Estimated effort (hours)

Format the response as a structured JSON that matches this schema:
{
  "name": "Blueprint Name",
  "phases": [
    { "id": "phase-1", "label": "Phase Name", "color": "#4CAF50" }
  ],
  "nodes": [
    {
      "id": "step-1",
      "title": "Step Title",
      "description": "Step description",
      "phase": "phase-1",
      "dod": ["DoD item 1", "DoD item 2"],
      "effort": 4
    }
  ]
}

Project Type: [Describe your project]`
    }
};

export function TemplatePickerModal({ isOpen, onClose, onSelect }: TemplatePickerModalProps) {
    const { t } = useTranslation(['modals', 'common', 'initiator']);
    const [search, setSearch] = useState('');
    const [copied, setCopied] = useState(false);
    const [showHidden, setShowHidden] = useState(false);
    const [hiddenTemplates, setHiddenTemplates] = useState<string[]>(() => getHiddenTemplates());
    const fileInputRef = useRef<HTMLInputElement>(null);
    const currentLang = 'en'; // Future: Get from i18n context

    const groupedTemplates = getTemplatesGroupedByCategory();

    // Filter templates by search (template name OR category name) and hidden status
    const filteredTemplates = useMemo(() => {
        if (!search.trim()) return groupedTemplates;

        const term = search.toLowerCase();
        const filtered: typeof groupedTemplates = {
            creative: [],
            development: [],
            general: [],
        };

        (Object.keys(groupedTemplates) as TemplateCategory[]).forEach(category => {
            const categoryLabel = t(CATEGORY_KEYS[category]).toLowerCase();
            const categoryMatches = categoryLabel.includes(term);

            // Show all templates if category matches, otherwise filter by template name
            filtered[category] = categoryMatches
                ? groupedTemplates[category]
                : groupedTemplates[category].filter(t => t.name.toLowerCase().includes(term));
        });

        return filtered;
    }, [groupedTemplates, search]);

    // Filter out hidden templates unless showing hidden
    const visibleTemplates = useMemo(() => {
        if (showHidden) return filteredTemplates;

        const visible: typeof filteredTemplates = {
            creative: [],
            development: [],
            general: [],
        };

        (Object.keys(filteredTemplates) as TemplateCategory[]).forEach(category => {
            visible[category] = filteredTemplates[category].filter(
                t => !hiddenTemplates.includes(t.id)
            );
        });

        return visible;
    }, [filteredTemplates, hiddenTemplates, showHidden]);

    const handleHideTemplate = (templateId: string) => {
        hideTemplate(templateId);
        setHiddenTemplates(getHiddenTemplates());
    };

    const handleUnhideTemplate = (templateId: string) => {
        unhideTemplate(templateId);
        setHiddenTemplates(getHiddenTemplates());
    };

    const handleSelectTemplate = (template: WorkflowBlueprint) => {
        const newBlueprint = duplicateTemplate(template.id, template.name);
        if (newBlueprint) {
            onSelect(newBlueprint);
            onClose();
        }
    };

    const handleCopyAIPrompt = async () => {
        const prompt = AI_PROMPTS[currentLang]?.prompt || AI_PROMPTS.en.prompt;
        await navigator.clipboard.writeText(prompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        // Don't show the prompt panel, just copy
    };

    const handleImportFile = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const data = JSON.parse(text);

            // Validate basic structure
            if (!data.name || !data.nodes || !Array.isArray(data.nodes)) {
                alert(t('common:alerts.invalidBlueprintFile', 'Invalid blueprint file. Must contain "name" and "nodes" array.'));
                return;
            }

            // Generate new IDs
            const newId = `imported-${Date.now()}`;
            const importedBlueprint: WorkflowBlueprint = {
                id: newId,
                name: data.name,
                version: 1,
                categoryId: 'general',
                nodes: data.nodes.map((node: any, idx: number) => ({
                    ...node,
                    id: `${newId}-step-${idx}`,
                })),
                phases: data.phases?.map((phase: any, idx: number) => ({
                    ...phase,
                    id: `${newId}-phase-${idx}`,
                })) || [],
            };

            onSelect(importedBlueprint);
            onClose();
        } catch (err) {
            alert(t('common:alerts.failedToParseJson', 'Failed to parse JSON file. Please check the format.'));
            console.error('[TemplatePickerModal] Import error:', err);
        }

        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const hasResults = Object.values(visibleTemplates).some(arr => arr.length > 0);

    // Render nothing if not open (after all hooks to maintain hook order)
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-tokens-panel border border-tokens-border rounded-xl shadow-2xl max-w-3xl w-full mx-4 max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-tokens-border">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-tokens-brand-DEFAULT/20 rounded-lg flex items-center justify-center">
                            <Layers size={18} className="text-tokens-brand-DEFAULT" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-tokens-fg">{t('modals:templatePicker.title', 'Choose Template')}</h2>
                            <p className="text-xs text-tokens-muted">{t('modals:templatePicker.subtitle', 'Start with a ready-made workflow')}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-tokens-muted hover:text-tokens-fg p-1 rounded-lg hover:bg-tokens-panel2 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="px-6 py-3 border-b border-tokens-border flex items-center gap-3">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-tokens-muted" />
                        <input
                            type="text"
                            placeholder={t('modals:templatePicker.searchPlaceholder', 'Search templates...')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-tokens-panel2 border border-tokens-border rounded-lg text-sm text-tokens-fg placeholder:text-tokens-muted focus:outline-none focus:ring-2 focus:ring-tokens-brand-DEFAULT/40"
                        />
                    </div>

                    {/* AI Prompt Button - Just copies without showing panel */}
                    <Button
                        variant={copied ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={handleCopyAIPrompt}
                        icon={copied ? <Check size={14} /> : <Copy size={14} />}
                        iconPosition="left"
                        className="shrink-0"
                    >
                        {copied ? t('initiator:templatePicker.copied', 'Copied!') : t('initiator:templatePicker.copyAiPrompt', 'Copy AI Prompt')}
                    </Button>

                    {/* Import Button */}
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleImportFile}
                        icon={<Upload size={14} />}
                        iconPosition="left"
                        className="shrink-0"
                    >
                        {t('initiator:templatePicker.import', 'Import')}
                    </Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json,.blueprint.json"
                        onChange={handleFileChange}
                        className="hidden"
                    />

                    {/* Show/Hide Hidden Templates Toggle */}
                    {hiddenTemplates.length > 0 && (
                        <Button
                            variant={showHidden ? 'primary' : 'ghost'}
                            size="sm"
                            onClick={() => setShowHidden(!showHidden)}
                            icon={showHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                            iconPosition="left"
                            className="shrink-0"
                        >
                            {showHidden ? t('initiator:templatePicker.hideHidden', 'Hide') : t('initiator:templatePicker.showHidden', { count: hiddenTemplates.length, defaultValue: `Show Hidden (${hiddenTemplates.length})` })}
                        </Button>
                    )}
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[50vh] space-y-6">
                    {hasResults ? (
                        (Object.keys(visibleTemplates) as TemplateCategory[]).map(category => {
                            const templates = visibleTemplates[category];
                            if (templates.length === 0) return null;

                            return (
                                <div key={category}>
                                    <div className="text-xs font-semibold text-tokens-muted uppercase tracking-wider mb-3">
                                        {t(CATEGORY_KEYS[category])}
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {templates.map(template => (
                                            <div
                                                key={template.id}
                                                className="relative group"
                                            >
                                                <button
                                                    onClick={() => handleSelectTemplate(template)}
                                                    className="w-full text-left p-4 rounded-lg border border-tokens-border bg-tokens-panel2 hover:bg-tokens-panel hover:border-tokens-brand-DEFAULT/50 transition-all"
                                                >
                                                    <div className="font-medium text-sm text-tokens-fg group-hover:text-tokens-brand-DEFAULT transition-colors truncate">
                                                        {template.nameKey ? t(template.nameKey, template.name) : template.name}
                                                    </div>
                                                    <div className="text-xs text-tokens-muted mt-1">
                                                        {t('initiator:templatePicker.phaseStepCount', { phases: template.phases?.length || 5, steps: template.nodes.length, defaultValue: `${template.phases?.length || 5} phases · ${template.nodes.length} steps` })}
                                                    </div>
                                                </button>
                                                {/* Hide/Restore button */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (hiddenTemplates.includes(template.id)) {
                                                            handleUnhideTemplate(template.id);
                                                        } else {
                                                            handleHideTemplate(template.id);
                                                        }
                                                    }}
                                                    className="absolute top-2 right-2 p-1 rounded bg-tokens-panel border border-tokens-border opacity-0 group-hover:opacity-100 hover:bg-tokens-panel2 transition-all"
                                                    title={hiddenTemplates.includes(template.id) ? t('initiator:templatePicker.restoreTemplate', 'Restore template') : t('initiator:templatePicker.hideTemplate', 'Hide template')}
                                                >
                                                    {hiddenTemplates.includes(template.id) ? (
                                                        <RotateCcw size={12} className="text-tokens-brand-DEFAULT" />
                                                    ) : (
                                                        <X size={12} className="text-tokens-muted hover:text-red-400" />
                                                    )}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-8 text-tokens-muted">
                            <Search size={32} className="mx-auto mb-2 opacity-50" />
                            <p>{t('initiator:templatePicker.noResults', { query: search, defaultValue: `No templates match "${search}"` })}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-tokens-border flex justify-end">
                    <Button variant="secondary" size="sm" onClick={onClose}>
                        {t('initiator:templatePicker.cancel', 'Cancel')}
                    </Button>
                </div>
            </div>
        </div>
    );
}
