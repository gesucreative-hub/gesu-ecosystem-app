import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '../components/PageContainer';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { SelectDropdown } from '../components/Dropdown';
import { SearchableProjectDropdown } from '../components/SearchableProjectDropdown';
import { Tabs } from '../components/Tabs';
import { SegmentedControl } from '../components/SegmentedControl';
import { ProjectSearch } from '../components/ProjectSearch'; // NEW
import { BlueprintFilter } from '../components/BlueprintFilter'; // NEW
import { WorkflowCanvas } from './WorkflowCanvas';
import { FolderTemplateEditorModal } from '../components/FolderTemplateEditorModal';
import { Zap, FileText, Settings } from 'lucide-react';
import { useAlertDialog } from '../components/AlertDialog';
import {
    listProjects,
    getActiveProject,
    setActiveProject,
    clearActiveProject,
    updateProjectBlueprint,
    importFromDisk,
    refreshFromDisk,
    validateProjectExists,
    Project,
} from '../stores/projectStore';
import { scaffoldingService } from '../services/scaffoldingService';
import { StandardsTab } from './StandardsTab';
import {
    loadBlueprints,
    getDefaultBlueprintForCategory,
} from '../services/workflowBlueprintsService';
import { loadFolderTemplates } from '../services/workflowFolderTemplatesService';
import { generateFolderName, getNextBlueprintCount } from '../services/projectCounterService';
import { migrateFlatTemplate } from '../utils/folderTemplateUtils';
import { DEFAULT_BLUEPRINT_ID, BlueprintFileShape, FolderTemplateExtended } from '../types/workflowBlueprints';
import { getProgressForProject, mergeNodesWithProgress } from '../stores/workflowProgressStore';
import { calculateOverallProgress } from '../utils/workflowProgress';
import { blueprintToWorkflowNodes } from '../services/workflowBlueprintRenderer';
import { WORKFLOW_NODES } from './workflowData';
import { usePersona } from '../hooks/usePersona';


// --- Types & Interfaces ---

interface ProjectOptions {
    includeMedia: boolean;
    includeNotion: boolean;
    includeLog: boolean;
    gitInit: boolean;
}

// --- Constants ---

// Sprint 21: Project type categorization - matches projectStore.ProjectType
const PROJECT_TYPES: Array<{ value: 'client' | 'gesu-creative' | 'other'; label: string; icon: string }> = [
    { value: 'client', label: 'Client Project', icon: '👥' },  // Fallback - will use t() in render
    { value: 'gesu-creative', label: 'Personal project', icon: '🎨' },  // Fallback
    { value: 'other', label: 'Other', icon: '📦' }  // Fallback
];

// Sprint 21.3 Phase 8: Removed static CATEGORIES and TEMPLATES - now uses dynamic data from Standards tab
// Sprint 21.3: Removed generateProjectCode - replaced with generateFolderName from projectCounterService

// --- Project Generator Form Component ---
function ProjectGeneratorForm({
    onTabChange,
    projects,
    onRefresh
}: {
    onTabChange: (tabId: string) => void;
    projects: Project[];
    onRefresh: () => Promise<void>;
}) {
    // State
    const [searchParams] = useSearchParams();
    const [name, setName] = useState('');
    const [type, setType] = useState<'client' | 'gesu-creative' | 'other'>('client');
    const [clientName, setClientName] = useState('');  // Sprint 21.3: Client name for folder naming
    const [description, setDescription] = useState('');

    // UI - Polished Alert
    const { alert, AlertDialogComponent } = useAlertDialog();

    // Sprint 21.3 Phase 8: Dynamic folder template selection
    const [selectedFolderTemplateId, setSelectedFolderTemplateId] = useState<string | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [showTemplateEditor, setShowTemplateEditor] = useState(false);  // Phase 8: Template editor modal

    // Generator mode: 'new' = create new project, 'exist' = assign blueprint to existing folder
    // Sprint 21: Auto-select mode from URL param
    const [generatorMode, setGeneratorMode] = useState<'new' | 'exist'>(() => {
        return searchParams.get('mode') === 'exist' ? 'exist' : 'new';
    });

    const { t } = useTranslation(['initiator', 'common']);

    // Tab definitions with translated labels (inside component to access t)
    const _tabs = [
        { id: 'workflow', label: t('initiator:tabs.workflow', 'Workflow'), icon: <FileText size={16} /> },
        { id: 'generator', label: t('initiator:tabs.generator', 'Generator'), icon: <Zap size={16} /> },
        { id: 'standards', label: t('initiator:tabs.standards', 'Standards'), icon: <Settings size={16} /> }
    ];

    // Update mode when URL param changes
    useEffect(() => {
        const modeParam = searchParams.get('mode');
        if (modeParam === 'exist' || modeParam === 'new') {
            setGeneratorMode(modeParam);
        }
    }, [searchParams]);
    const [selectedExistingFolder, setSelectedExistingFolder] = useState<string>('');
    const [unassignedProjects, setUnassignedProjects] = useState<Project[]>([]);
    const [folderLoadError, setFolderLoadError] = useState<string | null>(null);

    const [options, setOptions] = useState<ProjectOptions>({
        includeMedia: true,
        includeNotion: true,
        includeLog: true,
        gitInit: false
    });

    // Preview/Generate state
    // Preview result state removed Sprint 21.3 Phase 8 - using live preview
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Blueprint categories loaded from Standards
    const [blueprintData, setBlueprintData] = useState<BlueprintFileShape | null>(null);
    // Sprint 21.3: Folder templates for preview (Phase 8: converted to extended format)
    const [folderTemplatesData, setFolderTemplatesData] = useState<FolderTemplateExtended[] | null>(null);

    // Load blueprint categories and folder templates on mount
    useEffect(() => {
        loadBlueprints().then(data => {
            setBlueprintData(data);
            console.log('[Generator] Loaded blueprints:', data.categories.length, 'categories');
        }).catch(err => {
            console.error('[Generator] Failed to load blueprints:', err);
        });
        // Sprint 21.3 Phase 8: Load and migrate folder templates
        loadFolderTemplates().then(data => {
            const extendedTemplates = data.templates.map(t => migrateFlatTemplate(t));
            setFolderTemplatesData(extendedTemplates);
        });
    }, []);

    // Load projects without blueprints when in 'exist' mode
    useEffect(() => {
        if (generatorMode !== 'exist') {
            setUnassignedProjects([]);
            setFolderLoadError(null);
            return;
        }

        // Get projects that don't have blueprints assigned
        // Use props.projects which is already filtered and fresh from parent
        const projectsWithoutBlueprints = projects.filter(p => !p.blueprintId);

        if (projectsWithoutBlueprints.length === 0) {
            setFolderLoadError('All projects already have blueprints assigned. Create a new project or use the header dropdown.');
        } else {
            setFolderLoadError(null);
        }

        setUnassignedProjects(projectsWithoutBlueprints);
        console.log('[Generator] Found', projectsWithoutBlueprints.length, 'projects without blueprints');
    }, [generatorMode]);

    // Phase 8: Handle template save from modal
    const handleTemplateSave = useCallback((updatedTemplates: FolderTemplateExtended[], selectedId: string) => {
        setFolderTemplatesData(updatedTemplates);
        setSelectedFolderTemplateId(selectedId);
        // TODO: Persist templates to file system
        console.log('[Generator] Templates updated, selected:', selectedId);
    }, []);

    // Derived State
    // projectCode removed Sprint 21.3 - replaced with folderName
    const isSimulationMode = scaffoldingService.isSimulationMode();

    // Sprint 21.3 Phase 8: Use selectedCategoryId only - don't auto-select first
    const effectiveCategoryId = useMemo(() => {
        // Return null if no explicit selection - dropdown will show "Select Blueprint..."
        return selectedCategoryId || null;
    }, [selectedCategoryId]);

    // Get default blueprint for the selected category
    const selectedBlueprint = useMemo(() => {
        if (!blueprintData || !effectiveCategoryId) return null;
        return getDefaultBlueprintForCategory(blueprintData, effectiveCategoryId);
    }, [blueprintData, effectiveCategoryId]);

    // Sprint 21.3 Phase 8: Get selected folder template (from blueprint link or manual selection)
    const selectedFolderTemplate = useMemo(() => {
        if (!folderTemplatesData) return null;
        // Priority: manual selection > blueprint link > first template
        if (selectedFolderTemplateId) {
            return folderTemplatesData.find(t => t.id === selectedFolderTemplateId) || null;
        }
        if (selectedBlueprint?.folderTemplateId) {
            return folderTemplatesData.find(t => t.id === selectedBlueprint.folderTemplateId) || null;
        }
        return folderTemplatesData[0] || null;
    }, [folderTemplatesData, selectedFolderTemplateId, selectedBlueprint]);

    // Sprint 21.3 Phase 8: Auto-select folder template when blueprint changes
    useEffect(() => {
        if (selectedBlueprint?.folderTemplateId && !selectedFolderTemplateId) {
            setSelectedFolderTemplateId(selectedBlueprint.folderTemplateId);
        }
    }, [selectedBlueprint, selectedFolderTemplateId]);

    // Sprint 21.3: Check if this is a client project (for conditional client name field)
    const isClientProject = type === 'client';

    // Sprint 21.3: Generate folder name with convention: YYYYMMDD_Blueprint000_Client_ProjectName
    const folderName = useMemo(() => {
        if (!name.trim() || !selectedBlueprint) return '';
        const nextCount = getNextBlueprintCount(selectedBlueprint.id);
        return generateFolderName(
            name.trim(),
            selectedBlueprint.name,
            nextCount,
            isClientProject ? clientName.trim() : undefined
        );
    }, [name, selectedBlueprint, clientName, isClientProject]);

    // Handlers
    const handleOptionToggle = (key: keyof ProjectOptions) => {
        setOptions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // Sprint 21.3 Phase 8: handlePreview removed - using live preview instead

    const handleGenerate = async () => {
        if (!name.trim()) {
            setError('Please enter a project name.');
            return;
        }

        // Sprint 21.3 Phase 8: Require blueprint selection
        if (!selectedBlueprint) {
            setError('Please select a blueprint.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Sprint 21.3 Phase 8: Use selectedFolderTemplate directly
            // Pass folderName instead of name.trim() for auto-naming convention
            const result = await scaffoldingService.scaffold(folderName || name.trim(), selectedFolderTemplate?.id || 'general', {
                categoryId: selectedBlueprint.categoryId || '',
                blueprintId: selectedBlueprint?.id || DEFAULT_BLUEPRINT_ID,
                blueprintVersion: selectedBlueprint?.version || 1,
                folderTemplateFolders: selectedFolderTemplate?.folders,
                projectType: type,
                clientName: isClientProject ? clientName.trim() : undefined,
                briefContent: description.trim() || undefined,
                displayName: name.trim(),  // Original project name for display
                options: {
                    gitInit: options.gitInit,
                    includeMedia: options.includeMedia,
                    includeNotion: options.includeNotion,
                    includeLog: options.includeLog
                }
            });
            if (result.ok) {
                // Register the created project and set it active
                if (result.projectId && result.projectName) {
                    // Import the created project into the store with blueprint fields
                    const diskProject = {
                        id: result.projectId,
                        name: result.projectName,
                        projectPath: result.projectPath || '',
                        createdAt: new Date().toISOString(),
                        // Sprint 20: Include blueprint assignment
                        categoryId: selectedBlueprint.categoryId || '',
                        blueprintId: selectedBlueprint?.id || DEFAULT_BLUEPRINT_ID,
                        blueprintVersion: selectedBlueprint?.version || 1,
                    };

                    // Import and set active
                    importFromDisk([diskProject]);
                    setActiveProject(result.projectId);
                }


                alert({
                    title: t('common:alerts.projectCreated', 'Project Created'),
                    message: t('common:alerts.projectCreatedMessage', 'Project created successfully!'),
                    type: 'success'
                });

                // Reset form
                // Reset form (preview reset removed - using live preview)
                setName('');
            } else {
                setError(result.error || 'Failed to create project');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle assigning blueprint to existing folder
    const handleAssignBlueprint = async () => {
        if (!selectedExistingFolder || !selectedBlueprint) {
            setError('Please select both a folder and a blueprint');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Update existing project with blueprint
            const project = updateProjectBlueprint(selectedExistingFolder, {
                categoryId: selectedBlueprint.categoryId,
                blueprintId: selectedBlueprint.id,
                blueprintVersion: selectedBlueprint.version
            });


            if (!project) {
                setError('Project not found');
                return;
            }

            // Sprint 6.6: Git Init for existing project
            if (options.gitInit && project.projectPath) {
                try {
                    console.log('[Generator] Initializing git for existing project:', project.projectPath);
                    if (window.gesu?.scaffold?.initializeGit) {
                        await window.gesu.scaffold.initializeGit(project.projectPath);
                    }
                } catch (gitErr) {
                    console.error('[Generator] Git init failed:', gitErr);
                    // Non-fatal, just log it
                }
            }

            console.log('[Generator] Assigned blueprint to existing project:', project);

            // Switch to Workflow tab
            onTabChange('workflow');

            // Reset form
            setSelectedExistingFolder('');
            setSelectedCategoryId(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to assign blueprint');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">

            {/* LEFT COLUMN (2/3 width) - Form */}
            <div className="flex-1">
                <Card title={
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-primary-700 dark:bg-secondary-300 rounded-full"></span>
                        {t('initiator:generator.projectSetup', 'Project Setup')}
                    </div>
                }>
                    <div className="flex flex-col gap-6">

                        {/* Mode Toggle */}
                        <div className="w-fit">
                            <SegmentedControl
                                options={[
                                    { value: 'new', label: t('initiator:generator.newProject', 'New Project') },
                                    { value: 'exist', label: t('initiator:generator.existingProject', 'Existing Project') }
                                ]}
                                value={generatorMode}
                                onChange={(val) => setGeneratorMode(val as 'new' | 'exist')}
                                size="sm"
                            />
                        </div>

                        {/* Basic Info */}
                        {generatorMode === 'new' && (
                            <>
                                <div className="flex flex-col gap-4">
                                    <Input
                                        label={<span>{t('initiator:createProject.name', 'Project Name')} <span className="text-tokens-brand-DEFAULT">*</span></span>}
                                        placeholder={t('initiator:placeholders.projectName', 'Enter project name...')}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        autoFocus
                                    />

                                    <SelectDropdown
                                        label={t('initiator:generator.projectType', 'Project Type')}
                                        value={type}
                                        onChange={(value) => setType(value as 'client' | 'gesu-creative' | 'other')}
                                        options={PROJECT_TYPES.map(type => ({
                                            value: type.value,
                                            label: t(`initiator:projectTypes.${type.value}`, type.label)
                                        }))}
                                    />

                                    <SelectDropdown
                                        label={t('initiator:generator.blueprint', 'Blueprint')}
                                        value={selectedBlueprint?.id || ''}
                                        onChange={(value) => {
                                            if (value === '') {
                                                setSelectedCategoryId(null);
                                                return;
                                            }
                                            // Find the blueprint and set its category
                                            const blueprint = blueprintData?.blueprints.find(b => b.id === value);
                                            if (blueprint) {
                                                setSelectedCategoryId(blueprint.categoryId);
                                            }
                                        }}
                                        options={[
                                            { value: '', label: t('initiator:placeholders.selectBlueprint', 'Select Blueprint...') },
                                            // Only show blueprints that have a matching category (filter out orphaned copies)
                                            ...(blueprintData?.blueprints
                                                .filter(bp => {
                                                    // Check if any category references this blueprint
                                                    return blueprintData.categories.some(cat => cat.defaultBlueprintId === bp.id);
                                                })
                                                .map(bp => ({
                                                    value: bp.id,
                                                    label: `${bp.name} v${bp.version} (${bp.nodes.length} steps)`
                                                })) || [])
                                        ]}
                                    />

                                    {/* Sprint 21.3: Conditional Client Name field */}
                                    {isClientProject && (
                                        <Input
                                            label={t('initiator:generator.clientName', 'Client Name')}
                                            placeholder={t('initiator:placeholders.clientName', 'Enter client name...')}
                                            value={clientName}
                                            onChange={(e) => setClientName(e.target.value)}
                                        />
                                    )}
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium text-tokens-muted">{t('initiator:generator.descriptionBrief', 'Description / Brief')}</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={2}
                                        placeholder={t('initiator:placeholders.description', 'Optional project summary...')}
                                        className="bg-tokens-panel2 border border-tokens-border rounded-lg px-4 py-2.5 text-tokens-fg focus:outline-none focus:ring-2 focus:ring-tokens-brand-DEFAULT/50 resize-y placeholder:text-tokens-muted/50"
                                    />
                                </div>

                                <div className="h-px bg-tokens-border my-2"></div>

                                {/* Sprint 21.3 Phase 8: Folder Template Dropdown */}
                                <h3 className="text-md font-medium text-tokens-fg">{t('initiator:generator.folderTemplate', 'Folder Template')}</h3>

                                <div className="space-y-3">
                                    {/* Manage Templates Button */}
                                    <button
                                        onClick={() => setShowTemplateEditor(true)}
                                        className="w-full flex items-center justify-between px-4 py-3 bg-tokens-panel2 border border-tokens-border rounded-lg hover:bg-tokens-panel hover:border-tokens-brand-DEFAULT/50 transition-colors text-left"
                                    >
                                        <div className="flex-1">
                                            {selectedFolderTemplate ? (
                                                <>
                                                    <div className="text-sm font-medium text-tokens-fg">
                                                        {selectedFolderTemplate.name}
                                                    </div>
                                                    <div className="text-xs text-tokens-muted mt-0.5">
                                                        {selectedFolderTemplate.folders.length} folders
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-sm text-tokens-muted">{t('initiator:generator.selectFolderTemplate', 'Select Folder Template...')}</div>
                                            )}
                                        </div>
                                        <div className="text-xs text-tokens-brand-DEFAULT font-medium">
                                            📁 {t('initiator:generator.manage', 'Manage')}
                                        </div>
                                    </button>

                                    {/* Compact folder preview */}
                                    {selectedFolderTemplate && (
                                        <div className="bg-tokens-panel2/50 border border-tokens-border rounded-lg p-3 text-sm font-mono max-h-32 overflow-y-auto">
                                            {options.gitInit && (
                                                <div className="text-tokens-brand-DEFAULT font-medium">📁 .git</div>
                                            )}
                                            {selectedFolderTemplate.folders.slice(0, 5).map((folder: string, idx: number) => (
                                                <div key={idx} className="text-tokens-muted">📁 {folder}</div>
                                            ))}
                                            {selectedFolderTemplate.folders.length > 5 && (
                                                <div className="text-tokens-muted/60 text-xs mt-1">
                                                    +{selectedFolderTemplate.folders.length - 5} more...
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Compact options */}
                                    <div className="flex flex-wrap gap-4">
                                        <label className="flex items-center gap-2 text-xs text-tokens-fg cursor-pointer">
                                            <input type="checkbox" checked={options.gitInit} onChange={() => handleOptionToggle('gitInit')} className="rounded border-tokens-border bg-tokens-panel2 text-tokens-brand-DEFAULT" />
                                            Git Init
                                        </label>
                                    </div>
                                </div>

                                {/* Error Display */}
                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}

                                {/* Generate Button Only (live preview) */}
                                <div className="flex gap-3 mt-4">
                                    <Button
                                        variant="primary"
                                        size="lg"
                                        onClick={handleGenerate}
                                        disabled={isLoading || !name.trim() || isSimulationMode}
                                        className="flex-1 justify-center shadow-md shadow-tokens-brand-DEFAULT/20"
                                    >
                                        {isLoading ? t('initiator:createProject.generating', 'Generating...') : t('initiator:createProject.generate', 'Generate Project')}
                                    </Button>
                                </div>

                                {isSimulationMode && (
                                    <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/50 rounded px-2 py-1 text-center">
                                        Simulation Mode - Generate disabled. Run in Electron for real scaffolding.
                                    </div>
                                )}
                            </>
                        )}

                        {/* Existing Project Form */}
                        {generatorMode === 'exist' && (
                            <div className="flex flex-col gap-6">
                                <div className="text-sm text-tokens-muted">
                                    Assign a workflow blueprint to an existing project folder.
                                </div>

                                {folderLoadError && (
                                    <div className="bg-amber-500/10 border border-amber-500/50 rounded-lg p-3 text-amber-400 text-sm">
                                        <div className="font-medium mb-1">⚠️ {folderLoadError}</div>
                                        <div className="text-xs opacity-80">
                                            Go to Settings → Paths to configure your project root directory.
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col gap-4">
                                    <SearchableProjectDropdown
                                        label={<span>Project <span className="text-tokens-brand-DEFAULT">*</span></span>}
                                        projects={unassignedProjects}
                                        value={selectedExistingFolder}
                                        onChange={(projectId) => setSelectedExistingFolder(projectId)}
                                        placeholder={t('initiator:placeholders.selectProject', 'Select project...')}
                                        validateExists={validateProjectExists}
                                        onCleanupInvalid={async () => {
                                            // Trigger refresh in parent to scan disk and prune zombies
                                            await onRefresh();
                                            // No need to setUnassignedProjects manually, 
                                            // the useEffect will run when props.projects changes
                                            alert({ title: t('common:alerts.refreshed', 'Refreshed'), message: t('common:alerts.projectListRefreshed', 'Project list refreshed and invalid projects removed.'), type: 'info' });
                                        }}
                                    />

                                    <SelectDropdown
                                        label={<span>Blueprint <span className="text-tokens-brand-DEFAULT">*</span></span>}
                                        value={selectedBlueprint?.id || ''}
                                        onChange={(value) => {
                                            if (value === '') {
                                                setSelectedCategoryId(null);
                                                return;
                                            }
                                            const blueprint = blueprintData?.blueprints.find(b => b.id === value);
                                            if (blueprint) {
                                                setSelectedCategoryId(blueprint.categoryId);
                                            }
                                        }}
                                        options={[
                                            { value: '', label: t('initiator:placeholders.selectBlueprint', 'Select Blueprint...') },
                                            ...(blueprintData?.blueprints
                                                .filter(bp => blueprintData.categories.some(c => c.id === bp.categoryId))
                                                .map(bp => ({
                                                    value: bp.id,
                                                    label: `${bp.name} v${bp.version} (${bp.nodes.length} steps)`
                                                })) || [])
                                        ]}
                                    />
                                </div>

                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}

                                <div>
                                    <label className="flex items-center gap-2 text-xs text-tokens-fg cursor-pointer select-none w-fit">
                                        <input
                                            type="checkbox"
                                            checked={options.gitInit}
                                            onChange={() => handleOptionToggle('gitInit')}
                                            className="rounded border-tokens-border bg-tokens-panel2 text-tokens-brand-DEFAULT focus:ring-1 focus:ring-tokens-brand-DEFAULT"
                                        />
                                        Git Init
                                    </label>
                                </div>

                                <div className="flex gap-3 mt-4">
                                    <Button
                                        variant="primary"
                                        size="lg"
                                        onClick={handleAssignBlueprint}
                                        disabled={isLoading || !selectedExistingFolder || !selectedBlueprint}
                                        className="flex-1 justify-center shadow-md shadow-tokens-brand-DEFAULT/20"
                                    >
                                        {isLoading ? 'Assigning...' : 'Assign Blueprint'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* RIGHT COLUMN (1/3 width) - Live Preview */}
            <div className="lg:w-80 xl:w-96">
                <Card title={
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-primary-700 dark:bg-secondary-300 rounded-full"></span>
                        {t('initiator:generator.livePreview', 'Live Preview')}
                    </div>
                } className="h-fit">
                    <div className="flex flex-col gap-4">
                        {/* Folder Name Preview */}
                        <div>
                            <div className="text-xs font-semibold text-tokens-muted uppercase tracking-wider mb-1">{t('initiator:generator.folderNameLabel', 'Folder Name')}</div>
                            <div className="font-mono text-sm text-tokens-brand-DEFAULT break-all bg-tokens-panel2 p-2 rounded border border-tokens-border">
                                {folderName || <span className="text-tokens-muted italic">{t('initiator:placeholders.projectName', 'Enter project name...')}</span>}
                            </div>
                        </div>

                        {/* Folder Template Preview */}
                        <div>
                            <div className="text-xs font-semibold text-tokens-muted uppercase tracking-wider mb-2">
                                {t('initiator:generator.folderStructureLabel', 'Folder Structure')} {selectedFolderTemplate && <span className="text-tokens-brand-DEFAULT">({selectedFolderTemplate.folders.length})</span>}
                            </div>
                            <div className="text-sm text-tokens-fg bg-tokens-panel2/50 rounded p-3 border border-tokens-border flex flex-col gap-0.5 font-mono max-h-48 overflow-y-auto">
                                {selectedFolderTemplate ? (
                                    <>
                                        {options.gitInit && (
                                            <div className="text-tokens-brand-DEFAULT font-medium">📁 .git</div>
                                        )}
                                        <div className="text-tokens-muted">📄 project.meta.json</div>
                                        <div className="text-tokens-muted">📄 Brief.md</div>
                                        {selectedFolderTemplate.folders.map((folder: string, idx: number) => (
                                            <div key={idx} className="text-tokens-fg">📁 {folder}</div>
                                        ))}
                                    </>
                                ) : (
                                    <div className="text-tokens-muted italic">Loading templates...</div>
                                )}
                            </div>
                        </div>

                        {/* Items count */}
                        {selectedFolderTemplate && (
                            <div className="text-xs text-tokens-muted text-center">
                                {t('initiator:generator.itemsToCreate', '{{count}} items to create', { count: selectedFolderTemplate.folders.length + 2 })}
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Folder Template Editor Modal */}
            {folderTemplatesData && (
                <FolderTemplateEditorModal
                    isOpen={showTemplateEditor}
                    onClose={() => setShowTemplateEditor(false)}
                    templates={folderTemplatesData}
                    onSave={handleTemplateSave}
                    initialSelectedId={selectedFolderTemplateId || undefined}
                />
            )}
            <AlertDialogComponent />
        </div>
    );
}

// --- Main Project Hub Page Component ---
export function ProjectHubPage() {
    const { t } = useTranslation(['initiator', 'common']);
    
    const [searchParams, setSearchParams] = useSearchParams();
    const tabFromUrl = searchParams.get('tab') || 'workflow';
    const activeTab = ['workflow', 'standards', 'generator'].includes(tabFromUrl) ? tabFromUrl : 'workflow';

    // Project state
    const [activeProject, setActiveProjectState] = useState<Project | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [_isLoadingProjects, setIsLoadingProjects] = useState(true);
    const [projectKey, setProjectKey] = useState(0); // For auto-swap workflow

    // Sprint 21: Load blueprints for robust filtering
    const [blueprintData, setBlueprintData] = useState<BlueprintFileShape | null>(null);

    // S2-3: Persona context for filtering
    const { activePersona } = usePersona();

    // Sprint 20.1: Blueprint filter state
    const [blueprintFilter, setBlueprintFilter] = useState<string>('all');
    const [statusFilters, setStatusFilters] = useState<string[]>([]); // Sprint 6.8: Status filtering
    const [typeFilters, setTypeFilters] = useState<string[]>([]); // Project type filtering


    // Sprint 20.1: Auto-load disk projects on mount
    useEffect(() => {
        const loadDiskProjects = async () => {
            setIsLoadingProjects(true);
            try {
                // First refresh from disk to get latest
                await refreshFromDisk();
                // Then get all projects
                const allProjects = listProjects();
                // Filter: only show projects that exist (have path) and are not done
                // Sprint 20.1: Only show disk projects (those with projectPath)
                const diskProjects = allProjects.filter(p => p.projectPath);
                setProjects(diskProjects);

                // Set active project
                const current = getActiveProject();
                if (current) {
                    setActiveProjectState(current);
                } else if (allProjects.length > 0) {
                    // Auto-select first project
                    setActiveProject(allProjects[0].id);
                    setActiveProjectState(allProjects[0]);
                }
            } catch (err) {
                console.error('[ProjectHub] Failed to load projects:', err);
                // Fallback to localStorage projects
                setProjects(listProjects());
                const current = getActiveProject();
                setActiveProjectState(current);
            } finally {
                setIsLoadingProjects(false);
            }
        };

        // Initial load
        loadDiskProjects();

        // Real-time file system watcher (Electron) with fallback to polling
        if (window.gesu?.projects?.onChange) {
            console.log('[ProjectHub] Using real-time file watcher');
            const cleanup = window.gesu.projects.onChange(() => {
                console.log('[ProjectHub] File system change detected, refreshing...');
                loadDiskProjects();
            });
            return () => cleanup();
        } else {
            // Fallback: 5-second polling for non-Electron environments
            console.log('[ProjectHub] Using polling fallback (5s interval)');
            const refreshInterval = setInterval(async () => {
                try {
                    const importCount = await refreshFromDisk();
                    if (importCount > 0) {
                        console.log('[ProjectHub] Auto-refresh detected', importCount, 'new projects');
                        const allProjects = listProjects();
                        const diskProjects = allProjects.filter(p => p.projectPath);
                        setProjects(diskProjects);
                    }
                } catch (err) {
                    console.error('[ProjectHub] Auto-refresh failed:', err);
                }
            }, 5000);
            return () => clearInterval(refreshInterval);
        }
    }, []);

    const handleTabChange = (tabId: string) => {
        setSearchParams({ tab: tabId });
    };

    // Sprint 20.1: Auto-swap - update projectKey to force WorkflowCanvas remount
    const handleProjectChange = useCallback((projectId: string) => {
        if (!projectId) {
            // No project selected - clear active project and show empty canvas
            clearActiveProject();
            setActiveProjectState(null);
        } else {
            setActiveProject(projectId);
            const active = getActiveProject();
            setActiveProjectState(active);
        }
        setProjectKey(k => k + 1); // Force workflow refresh via key change
    }, []);

    // Tab definitions with translated labels (moved here to access t from useTranslation hook)
    const tabs = [
        { id: 'workflow', label: t('initiator:tabs.workflow', 'Workflow'), icon: <FileText size={16} /> },
        { id: 'generator', label: t('initiator:tabs.generator', 'Generator'), icon: <Zap size={16} /> },
        { id: 'standards', label: t('initiator:tabs.standards', 'Standards'), icon: <Settings size={16} /> }
    ];

    useEffect(() => {
        loadBlueprints().then(data => setBlueprintData(data));
    }, [activeTab]);

    // Sprint 20.1: Filter projects by blueprint ID
    const filteredProjects = useMemo(() => {
        let result = projects; // Start with all projects

        // S2-3: Filter by persona FIRST
        result = result.filter(p => p.persona === activePersona);

        // 1. Filter by Blueprint
        if (blueprintFilter === 'none') {
            result = result.filter(p => !p.blueprintId);
        } else if (blueprintFilter !== 'all') {
            result = result.filter(p => p.blueprintId === blueprintFilter);
        }

        // 3. Filter by Status (Sprint 6.8)
        if (statusFilters.length > 0) {
            result = result.filter(project => {
                // Resolve blueprint to get total steps
                let nodes = WORKFLOW_NODES; // Default
                if (project.blueprintId && blueprintData) {
                    const bp = blueprintData.blueprints.find(b => b.id === project.blueprintId);
                    if (bp) {
                        nodes = blueprintToWorkflowNodes(bp);
                    }
                }

                // Get progress
                const progress = getProgressForProject(project.id);

                // Calculate stats
                // We must merge to get accurate completion
                const mergedNodes = mergeNodesWithProgress(nodes, progress);
                const stats = calculateOverallProgress(mergedNodes);

                // Determine status
                let status = 'On progress';
                if (stats.percent === 0) status = 'Ready to start';
                else if (stats.percent === 100) status = 'Completed';

                return statusFilters.includes(status);
            });
        }

        // 4. Filter by Type
        if (typeFilters.length > 0) {
            result = result.filter(project => typeFilters.includes(project.type));
        }

        return result;
    }, [projects, activePersona, blueprintFilter, statusFilters, typeFilters, blueprintData]);



    // Sprint 20.1: Manual refresh handler
    const handleRefreshProjects = useCallback(async () => {
        setIsLoadingProjects(true);
        try {
            const count = await refreshFromDisk();
            const allProjects = listProjects();
            const diskProjects = allProjects.filter(p => p.projectPath);
            setProjects(diskProjects);
            console.log(`[ProjectHub] Refreshed ${count} projects from disk`);
        } catch (err) {
            console.error('[ProjectHub] Failed to refresh:', err);
        } finally {
            setIsLoadingProjects(false);
        }
    }, []);

    return (
        <PageContainer>
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-tokens-fg tracking-tight">{t('initiator:hub.title', 'Project Hub')}</h1>
                    <p className="text-sm text-tokens-muted">{t('initiator:hub.subtitle', 'Manage projects from start to finish')}</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Sprint 20.1: Blueprint Filter + Project Selector - ONLY on Workflow tab */}
                    {activeTab === 'workflow' && (
                        <div className="flex items-center gap-2">
                            {/* NEW: Project Search */}
                            <ProjectSearch
                                projects={filteredProjects}
                                activeProjectId={activeProject?.id}
                                onSelect={handleProjectChange}
                            />

                            {/* NEW: Blueprint Filter Button */}
                            <BlueprintFilter
                                value={blueprintFilter}
                                onChange={setBlueprintFilter}
                                statusFilters={statusFilters}
                                onStatusFilterChange={setStatusFilters}
                                typeFilters={typeFilters}
                                onTypeFilterChange={setTypeFilters}
                                blueprintData={blueprintData}
                            />

                        </div>
                    )}
                    <Link to="/" className="px-4 py-2 bg-tokens-panel border border-tokens-border hover:bg-tokens-panel2 text-tokens-fg rounded-lg text-sm transition-colors">
                        {t('common:buttons.back', 'Back')}
                    </Link>
                </div>
            </div>

            {/* Tabs */}
            <Tabs
                tabs={tabs}
                activeTab={activeTab}
                onChange={handleTabChange}
            />

            {/* Tab Content */}
            <div className="mt-6">
                {/* Sprint 20.1: key={projectKey} forces remount on project switch for auto-swap */}
                {activeTab === 'workflow' && (
                    <WorkflowCanvas
                        key={`workflow-${projectKey}`}
                        project={activeProject || undefined}
                    />
                )}

                {activeTab === 'standards' && <StandardsTab />}

                {activeTab === 'generator' && (
                    <ProjectGeneratorForm
                        onTabChange={handleTabChange}
                        projects={projects}
                        onRefresh={handleRefreshProjects}
                    />
                )}
            </div>
        </PageContainer>
    );
}
