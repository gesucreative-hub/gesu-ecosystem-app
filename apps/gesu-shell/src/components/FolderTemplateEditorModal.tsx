import { useState, useMemo, useRef, useEffect } from 'react';
import { X, Copy, Upload, Settings as SettingsIcon, Edit3, Copy as DuplicateIcon, Trash2, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';
import { AlertDialog } from './AlertDialog';
import { FolderTreeEditor } from './FolderTreeEditor';
import { FolderTemplateExtended, FolderNode } from '../types/workflowBlueprints';
import {
    createEmptyTemplate,
    syncTemplateStructure,
    migrateFlatTemplate,
    flatToHierarchical
} from '../utils/folderTemplateUtils';

interface FolderTemplateEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    templates: FolderTemplateExtended[];
    onSave: (updatedTemplates: FolderTemplateExtended[], selectedTemplateId: string) => void;
    initialSelectedId?: string;
}

export function FolderTemplateEditorModal({
    isOpen,
    onClose,
    templates: initialTemplates,
    onSave,
    initialSelectedId
}: FolderTemplateEditorModalProps) {
    const { t } = useTranslation(['modals', 'common', 'initiator']);
    // Ensure all templates have hierarchical structure
    const migratedTemplates = useMemo(() => {
        return initialTemplates.map(t =>
            t.hierarchicalFolders ? t : migrateFlatTemplate(t)
        );
    }, [initialTemplates]);

    const [templates, setTemplates] = useState<FolderTemplateExtended[]>(migratedTemplates);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
        initialSelectedId || (migratedTemplates.length > 0 ? migratedTemplates[0].id : null)
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [showSettingsMenu, setShowSettingsMenu] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [renameValue, setRenameValue] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const settingsRef = useRef<HTMLDivElement>(null);

    // Alert dialog state
    const [alertDialog, setAlertDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'success' | 'error' | 'warning' | 'info';
    }>({ isOpen: false, title: '', message: '', type: 'info' });

    const showAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
        setAlertDialog({ isOpen: true, title, message, type });
    };

    // Click outside to close settings menu
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
                setShowSettingsMenu(false);
            }
        };
        if (showSettingsMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showSettingsMenu]);

    // Selected template
    const selectedTemplate = useMemo(
        () => templates.find(t => t.id === selectedTemplateId) || null,
        [templates, selectedTemplateId]
    );

    // Filtered templates based on search
    const filteredTemplates = useMemo(() => {
        if (!searchQuery) return templates;
        return templates.filter(t =>
            t.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [templates, searchQuery]);

    // Update folder structure for selected template
    const handleFoldersChange = (newFolders: FolderNode[]) => {
        if (!selectedTemplateId) return;

        setTemplates(prev => prev.map(t => {
            if (t.id === selectedTemplateId) {
                const updated = {
                    ...t,
                    hierarchicalFolders: newFolders
                };
                return syncTemplateStructure(updated);
            }
            return t;
        }));
    };

    // AI Prompt generation
    const handleCopyAIPrompt = () => {
        const prompt = `Generate a folder template structure in JSON format for a project. Include the following:
- Main deliverable folders
- Asset organization
- Output/render folders
- Documentation folders

Format as:
{
  "name": "Template Name",
  "folders": [
    "01. Brief",
    "02. Research/References",
    "03. Assets/Images"
  ]
}`;

        navigator.clipboard.writeText(prompt);
        showAlert('Copied!', 'AI prompt copied to clipboard!', 'success');
    };

    // File import
    const handleImportFile = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,.gesutemplate';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            try {
                const text = await file.text();
                const imported = JSON.parse(text);

                // Validate structure
                if (!imported.name || !Array.isArray(imported.folders)) {
                    throw new Error('Invalid template format');
                }

                const newTemplate: FolderTemplateExtended = {
                    id: `imported-${Date.now()}`,
                    name: imported.name,
                    folders: imported.folders,
                    hierarchicalFolders: flatToHierarchical(imported.folders),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    isUserCreated: true
                };

                setTemplates(prev => [...prev, newTemplate]);
                setSelectedTemplateId(newTemplate.id);
                showAlert('Imported!', `Template "${newTemplate.name}" imported successfully!`, 'success');
            } catch (error) {
                showAlert('Import Failed', 'Failed to import template. Please check the file format.', 'error');
                console.error(error);
            }
        };
        input.click();
    };

    // Create new template
    const handleNewTemplate = () => {
        const newTemplate = createEmptyTemplate('New Template');
        setTemplates(prev => [...prev, newTemplate]);
        setSelectedTemplateId(newTemplate.id);
    };

    // Save and close
    const handleSaveAndUse = () => {
        if (selectedTemplateId) {
            onSave(templates, selectedTemplateId);
        }
        onClose();
    };

    // Settings menu actions
    const handleRename = () => {
        if (!selectedTemplate) return;
        setRenameValue(selectedTemplate.name);
        setIsRenaming(true);
        setShowSettingsMenu(false);
    };

    const handleRenameSubmit = () => {
        if (!selectedTemplateId || !renameValue.trim()) return;
        setTemplates(prev => prev.map(t =>
            t.id === selectedTemplateId
                ? { ...t, name: renameValue.trim(), updatedAt: new Date().toISOString() }
                : t
        ));
        setIsRenaming(false);
    };

    const handleDuplicate = () => {
        if (!selectedTemplate) return;
        const duplicated: FolderTemplateExtended = {
            ...selectedTemplate,
            id: `copy-${Date.now()}`,
            name: `${selectedTemplate.name} (Copy)`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isUserCreated: true
        };
        setTemplates(prev => [...prev, duplicated]);
        setSelectedTemplateId(duplicated.id);
        setShowSettingsMenu(false);
    };

    const handleDelete = () => {
        if (!selectedTemplate) return;
        setShowDeleteConfirm(true);
        setShowSettingsMenu(false);
    };

    const confirmDelete = () => {
        if (!selectedTemplateId) return;
        setTemplates(prev => prev.filter(t => t.id !== selectedTemplateId));
        setSelectedTemplateId(templates[0]?.id !== selectedTemplateId ? templates[0]?.id : templates[1]?.id || null);
        setShowDeleteConfirm(false);
        showAlert('Deleted', `Template deleted successfully.`, 'success');
    };

    const handleExport = () => {
        if (!selectedTemplate) return;
        const exportData = {
            name: selectedTemplate.name,
            folders: selectedTemplate.folders
        };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedTemplate.name.replace(/\s+/g, '-').toLowerCase()}.gesutemplate.json`;
        a.click();
        URL.revokeObjectURL(url);
        setShowSettingsMenu(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-tokens-bg rounded-xl border border-tokens-border shadow-2xl w-full max-w-6xl h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-tokens-border">
                    <h2 className="text-lg font-semibold text-tokens-fg">{t('modals:folderTemplate.title')}</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-tokens-panel2 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-tokens-muted" />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-3 px-6 py-3 border-b border-tokens-border bg-tokens-panel/30">
                    <Button
                        onClick={handleCopyAIPrompt}
                        variant="secondary"
                        size="sm"
                        icon={<Copy size={14} />}
                        iconPosition="left"
                    >
                        {t('modals:folderTemplate.copyAiPrompt', 'Copy AI Prompt')}
                    </Button>
                    <Button
                        onClick={handleImportFile}
                        variant="secondary"
                        size="sm"
                        icon={<Upload size={14} />}
                        iconPosition="left"
                    >
                        {t('modals:folderTemplate.importFile', 'Import from File')}
                    </Button>
                </div>

                {/* Main Content - Two Columns */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Panel - Template List */}
                    <div className="w-64 border-r border-tokens-border flex flex-col bg-tokens-panel/20">
                        {/* Search */}
                        <div className="p-4 border-b border-tokens-border">
                            <input
                                type="text"
                                placeholder={t('modals:templatePicker.searchPlaceholder', '🔍 Search templates...')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-3 py-2 bg-tokens-panel2 border border-tokens-border rounded-lg text-sm text-tokens-fg placeholder:text-tokens-muted/50 focus:outline-none focus:ring-2 focus:ring-tokens-brand-DEFAULT/50"
                            />
                        </div>

                        {/* Template List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {filteredTemplates.map(template => (
                                <button
                                    key={template.id}
                                    onClick={() => setSelectedTemplateId(template.id)}
                                    className={`w-full text-left p-3 rounded-lg border transition-all ${selectedTemplateId === template.id
                                        ? 'bg-tokens-brand-DEFAULT/10 border-tokens-brand-DEFAULT text-tokens-brand-DEFAULT'
                                        : 'bg-tokens-panel border-tokens-border text-tokens-fg hover:bg-tokens-panel2'
                                        }`}
                                >
                                    <div className="font-medium text-sm">{template.nameKey ? t(template.nameKey, template.name) : template.name}</div>
                                    <div className="text-xs text-tokens-muted mt-1">
                                        {t('modals:folderTemplate.folders.folderCount', { 
                                            count: template.folders.length,
                                            defaultValue: `${template.folders.length} folders`
                                        })}
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* New Template Button */}
                        <div className="p-4 border-t border-tokens-border">
                            <Button
                                onClick={handleNewTemplate}
                                variant="primary"
                                size="sm"
                                className="w-full"
                            >
                                {t('modals:folderTemplate.newTemplate', '+ New Template')}
                            </Button>
                        </div>
                    </div>

                    {/* Right Panel - Editor */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {selectedTemplate ? (
                            <>
                                {/* Editor Header */}
                                <div className="px-6 py-4 border-b border-tokens-border flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-tokens-muted">Template:</span>
                                        {isRenaming ? (
                                            <input
                                                type="text"
                                                value={renameValue}
                                                onChange={(e) => setRenameValue(e.target.value)}
                                                onBlur={handleRenameSubmit}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleRenameSubmit();
                                                    if (e.key === 'Escape') setIsRenaming(false);
                                                }}
                                                autoFocus
                                                className="text-sm font-medium text-tokens-fg bg-tokens-panel2 border border-tokens-brand-DEFAULT rounded px-2 py-1 focus:outline-none"
                                            />
                                        ) : (
                                            <span className="text-sm font-medium text-tokens-fg">
                                                {selectedTemplate.nameKey ? t(selectedTemplate.nameKey, selectedTemplate.name) : selectedTemplate.name}
                                            </span>
                                        )}
                                    </div>

                                    {/* Settings Dropdown */}
                                    <div className="relative" ref={settingsRef}>
                                        <button
                                            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                                            className="p-2 hover:bg-tokens-panel2 rounded-lg transition-colors"
                                        >
                                            <SettingsIcon size={18} className="text-tokens-muted" />
                                        </button>

                                        {showSettingsMenu && (
                                            <div className="absolute right-0 top-full mt-1 w-48 bg-tokens-bg border border-tokens-border rounded-lg shadow-xl z-10 overflow-hidden">
                                                <button
                                                    onClick={handleRename}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-tokens-fg hover:bg-tokens-panel2 transition-colors"
                                                >
                                                    <Edit3 size={14} className="text-tokens-muted" />
                                                    {t('common:buttons.rename')}
                                                </button>
                                                <button
                                                    onClick={handleDuplicate}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-tokens-fg hover:bg-tokens-panel2 transition-colors"
                                                >
                                                    <DuplicateIcon size={14} className="text-tokens-muted" />
                                                    {t('common:buttons.duplicate')}
                                                </button>
                                                <button
                                                    onClick={handleExport}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-tokens-fg hover:bg-tokens-panel2 transition-colors"
                                                >
                                                    <Download size={14} className="text-tokens-muted" />
                                                    {t('common:buttons.export')} JSON
                                                </button>
                                                <div className="border-t border-tokens-border" />
                                                <button
                                                    onClick={handleDelete}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                    {t('common:buttons.delete')}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Folder Editor */}
                                <div className="flex-1 overflow-y-auto p-6">
                                    <FolderTreeEditor
                                        folders={selectedTemplate.hierarchicalFolders || []}
                                        onChange={handleFoldersChange}
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-tokens-muted text-sm">
                                    Select a template or create a new one
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-tokens-border">
                    <Button onClick={onClose} variant="secondary">
                        {t('common:buttons.cancel')}
                    </Button>
                    <Button onClick={handleSaveAndUse} variant="primary" disabled={!selectedTemplateId}>
                        {t('modals:folderTemplate.saveAndUse', 'Save & Use')}
                    </Button>
                </div>
            </div>

            {/* Alert Dialog */}
            <AlertDialog
                isOpen={alertDialog.isOpen}
                title={alertDialog.title}
                message={alertDialog.message}
                type={alertDialog.type}
                onClose={() => setAlertDialog(prev => ({ ...prev, isOpen: false }))}
            />

            {/* Delete Confirmation Dialog */}
            {showDeleteConfirm && selectedTemplate && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-tokens-bg border border-tokens-border rounded-xl shadow-2xl p-6 w-full max-w-sm">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-red-500/10">
                                <Trash2 size={24} className="text-red-500" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-tokens-fg">Delete Template?</h2>
                                <p className="text-sm text-tokens-muted mt-1">
                                    Delete "{selectedTemplate.name}"? This cannot be undone.
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
                                Cancel
                            </Button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full text-sm font-medium transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
