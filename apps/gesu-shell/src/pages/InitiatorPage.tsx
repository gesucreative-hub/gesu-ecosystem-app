import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageContainer } from '../components/PageContainer';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { SelectDropdown } from '../components/Dropdown';
import { Tabs } from '../components/Tabs';
import { WorkflowCanvas } from './WorkflowCanvas';
import { Zap, FileText, Settings, RefreshCw } from 'lucide-react';
import {
    listProjects,
    getActiveProject,
    setActiveProject,
    importFromDisk,
    refreshFromDisk,
    Project,
} from '../stores/projectStore';
import { scaffoldingService, ScaffoldPreviewResult } from '../services/scaffoldingService';
import { StandardsTab } from './StandardsTab';
import {
    loadBlueprints,
    getDefaultBlueprintForCategory,
} from '../services/workflowBlueprintsService';
import { DEFAULT_CATEGORY_ID, DEFAULT_BLUEPRINT_ID, BlueprintFileShape } from '../types/workflowBlueprints';


// --- Types & Interfaces ---

interface ProjectOptions {
    includeMedia: boolean;
    includeNotion: boolean;
    includeLog: boolean;
    gitInit: boolean;
}

// --- Constants ---

const PROJECT_TYPES = [
    { value: 'Client Project', label: 'Client Project' },
    { value: 'Personal Exploration', label: 'Personal Exploration' },
    { value: 'Content Series', label: 'Content Series' },
    { value: 'Internal Tool', label: 'Internal Tool' },
    { value: 'Asset Library', label: 'Asset Library' }
];

const CATEGORIES = [
    { value: '3D / ArchViz', label: '3D / ArchViz' },
    { value: 'Event / Wedding', label: 'Event / Wedding' },
    { value: 'Motion / VJ', label: 'Motion / VJ' },
    { value: 'Dev / Code', label: 'Dev / Code' },
    { value: 'Admin / Ops', label: 'Admin / Ops' },
    { value: 'Audio / Sound', label: 'Audio / Sound' }
];

const TEMPLATES = [
    { id: 'archviz', name: 'Event ArchViz (Standard)', desc: 'Structure for venue modeling and rendering.' },
    { id: 'wedding', name: 'Wedding Visual', desc: 'Optimized for high-volume video processing.' },
    { id: 'general', name: 'General Creative', desc: 'Blank slate for mixed media.' },
    { id: 'admin', name: 'Admin / Ops', desc: 'Documentation and spreadsheet focus.' },
    { id: 'empty', name: 'Empty / Custom', desc: 'Minimal structure.' }
];

// --- Mock Project Code Generator ---
const generateProjectCode = (type: string, name: string) => {
    const prefix = type === 'Client Project' ? 'CLT'
        : type === 'Personal Exploration' ? 'EXP'
            : type === 'Internal Tool' ? 'INT'
                : 'GEN';

    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    // Simple slug for name
    const slug = name.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');

    return `${prefix}-${year}${month}-${slug || '001'}`;
};

// --- Project Generator Form Component ---
function ProjectGeneratorForm() {
    // State
    const [name, setName] = useState('');
    const [type, setType] = useState(PROJECT_TYPES[0].value);
    const [category, setCategory] = useState(CATEGORIES[0].value);
    const [description, setDescription] = useState('');
    const [templateId, setTemplateId] = useState(TEMPLATES[0].id);

    const [options, setOptions] = useState<ProjectOptions>({
        includeMedia: true,
        includeNotion: true,
        includeLog: true,
        gitInit: false
    });

    // Preview/Generate state
    const [previewResult, setPreviewResult] = useState<ScaffoldPreviewResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Blueprint categories loaded from Standards
    const [blueprintData, setBlueprintData] = useState<BlueprintFileShape | null>(null);

    // Load blueprint categories on mount
    useEffect(() => {
        loadBlueprints().then(data => {
            setBlueprintData(data);
            console.log('[Generator] Loaded blueprints:', data.categories.length, 'categories');
        }).catch(err => {
            console.error('[Generator] Failed to load blueprints:', err);
        });
    }, []);

    // Derived State
    const projectCode = useMemo(() => generateProjectCode(type, name), [type, name]);
    const selectedTemplate = TEMPLATES.find(t => t.id === templateId) || TEMPLATES[0];
    const isSimulationMode = scaffoldingService.isSimulationMode();

    // Map template to blueprint category (fallback to default if not found)
    const categoryIdForTemplate = useMemo(() => {
        if (!blueprintData) return DEFAULT_CATEGORY_ID;
        // Map template IDs to category IDs (best effort matching)
        const templateCategoryMap: Record<string, string> = {
            'archviz': 'archviz',
            'wedding': 'event',
            'general': 'general',
            'admin': 'admin',
            'empty': 'general'
        };
        const mappedCategoryId = templateCategoryMap[templateId] || 'general';
        // Check if this category exists in blueprint data
        const exists = blueprintData.categories.some(c => c.id === mappedCategoryId);
        return exists ? mappedCategoryId : DEFAULT_CATEGORY_ID;
    }, [blueprintData, templateId]);

    // Get default blueprint for the selected category
    const selectedBlueprint = useMemo(() => {
        if (!blueprintData) return null;
        return getDefaultBlueprintForCategory(blueprintData, categoryIdForTemplate);
    }, [blueprintData, categoryIdForTemplate]);

    // Handlers
    const handleOptionToggle = (key: keyof ProjectOptions) => {
        setOptions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handlePreview = async () => {
        if (!name.trim()) {
            setError('Please enter a project name.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await scaffoldingService.preview(name.trim(), templateId);
            if (result.ok) {
                setPreviewResult(result);
            } else {
                setError(result.error || 'Failed to generate preview');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerate = async () => {
        if (!name.trim()) {
            setError('Please enter a project name.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Sprint 20: Pass blueprint fields to scaffold service
            const result = await scaffoldingService.scaffold(name.trim(), templateId, {
                categoryId: categoryIdForTemplate,
                blueprintId: selectedBlueprint?.id || DEFAULT_BLUEPRINT_ID,
                blueprintVersion: selectedBlueprint?.version || 1,
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
                        categoryId: categoryIdForTemplate,
                        blueprintId: selectedBlueprint?.id || DEFAULT_BLUEPRINT_ID,
                        blueprintVersion: selectedBlueprint?.version || 1,
                    };

                    // Import and set active
                    importFromDisk([diskProject]);
                    setActiveProject(result.projectId);
                }

                alert(`Project created successfully!\n\nPath: ${result.projectPath}`);

                // Reset form
                setName('');
                setPreviewResult(null);
            } else {
                setError(result.error || 'Failed to create project');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
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
                        Project Setup
                    </div>
                }>
                    <div className="flex flex-col gap-6">

                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <Input
                                label={<span>Project Name <span className="text-tokens-brand-DEFAULT">*</span></span>}
                                placeholder="e.g. Neo Tokyo Tower"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoFocus
                            />

                            <SelectDropdown
                                label="Project Type"
                                value={type}
                                onChange={(value) => setType(value)}
                                options={PROJECT_TYPES}
                            />

                            <div className="md:col-span-2">
                                <SelectDropdown
                                    label="Category / Discipline (Blueprint)"
                                    value={categoryIdForTemplate}
                                    onChange={(value) => {
                                        // Find template that maps to this category
                                        const templateCategoryMap: Record<string, string> = {
                                            'archviz': 'archviz',
                                            'wedding': 'event',
                                            'general': 'general',
                                            'admin': 'admin',
                                            'empty': 'general'
                                        };
                                        const matchingTemplate = Object.entries(templateCategoryMap).find(([_, catId]) => catId === value)?.[0];
                                        if (matchingTemplate) setTemplateId(matchingTemplate);
                                    }}
                                    options={blueprintData?.categories.map(cat => ({
                                        value: cat.id,
                                        label: `${cat.name} (${blueprintData?.blueprints.find((b: { id: string }) => b.id === cat.defaultBlueprintId)?.nodes.length || 0} steps)`
                                    })) || [{ value: DEFAULT_CATEGORY_ID, label: 'General Creative' }]}
                                />
                                {selectedBlueprint && (
                                    <div className="text-xs text-tokens-muted mt-1">
                                        Blueprint: {selectedBlueprint.name} v{selectedBlueprint.version}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-tokens-muted">Description / Brief</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={2}
                                placeholder="Optional project summary..."
                                className="bg-tokens-panel2 border border-tokens-border rounded-lg px-4 py-2.5 text-tokens-fg focus:outline-none focus:ring-2 focus:ring-tokens-brand-DEFAULT/50 resize-y placeholder:text-tokens-muted/50"
                            />
                        </div>

                        <div className="h-px bg-tokens-border my-2"></div>

                        {/* Templates & Options */}
                        <h3 className="text-md font-medium text-tokens-fg">Template & Options</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-tokens-muted">Directory Template</label>
                                <div className="flex flex-col gap-2">
                                    {TEMPLATES.map(t => (
                                        <label key={t.id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${templateId === t.id ? 'bg-tokens-brand-DEFAULT/10 border-tokens-brand-DEFAULT/50' : 'bg-tokens-bg border-tokens-border hover:bg-tokens-panel2'}`}>
                                            <input
                                                type="radio"
                                                name="template"
                                                checked={templateId === t.id}
                                                onChange={() => setTemplateId(t.id)}
                                                className="mt-1 text-tokens-brand-DEFAULT focus:ring-tokens-brand-DEFAULT bg-tokens-bg border-tokens-border"
                                            />
                                            <div>
                                                <div className="text-sm font-medium text-tokens-fg">{t.name}</div>
                                                <div className="text-xs text-tokens-muted">{t.desc}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <label className="text-sm font-medium text-tokens-muted">Features</label>

                                <label className="flex items-center gap-3 text-sm text-tokens-fg cursor-pointer group">
                                    <input type="checkbox" checked={options.includeMedia} onChange={() => handleOptionToggle('includeMedia')} className="rounded border-tokens-border bg-tokens-panel2 text-tokens-brand-DEFAULT focus:ring-tokens-brand-DEFAULT/40" />
                                    <span className="group-hover:text-tokens-brand-DEFAULT transition-colors">Include Media Folders</span>
                                </label>

                                <label className="flex items-center gap-3 text-sm text-tokens-fg cursor-pointer group">
                                    <input type="checkbox" checked={options.includeNotion} onChange={() => handleOptionToggle('includeNotion')} className="rounded border-tokens-border bg-tokens-panel2 text-tokens-brand-DEFAULT focus:ring-tokens-brand-DEFAULT/40" />
                                    <span className="group-hover:text-tokens-brand-DEFAULT transition-colors">Include Docs / Notion</span>
                                </label>

                                <label className="flex items-center gap-3 text-sm text-tokens-fg cursor-pointer group">
                                    <input type="checkbox" checked={options.includeLog} onChange={() => handleOptionToggle('includeLog')} className="rounded border-tokens-border bg-tokens-panel2 text-tokens-brand-DEFAULT focus:ring-tokens-brand-DEFAULT/40" />
                                    <span className="group-hover:text-tokens-brand-DEFAULT transition-colors">Create Project Log Entry</span>
                                </label>

                                <label className="flex items-center gap-3 text-sm text-tokens-fg cursor-pointer group">
                                    <input type="checkbox" checked={options.gitInit} onChange={() => handleOptionToggle('gitInit')} className="rounded border-tokens-border bg-tokens-panel2 text-tokens-brand-DEFAULT focus:ring-tokens-brand-DEFAULT/40" />
                                    <span className="group-hover:text-tokens-brand-DEFAULT transition-colors">Initialize Git Repository</span>
                                </label>
                            </div>
                        </div>

                        {/* Error Display */}
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Buttons */}
                        <div className="flex gap-3 mt-4">
                            <Button
                                variant="secondary"
                                size="lg"
                                onClick={handlePreview}
                                disabled={isLoading || !name.trim()}
                                className="flex-1 justify-center"
                            >
                                {isLoading ? 'Loading...' : 'Preview'}
                            </Button>
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={handleGenerate}
                                disabled={isLoading || !previewResult || isSimulationMode}
                                className="flex-1 justify-center shadow-md shadow-tokens-brand-DEFAULT/20"
                            >
                                Generate Project
                            </Button>
                        </div>

                        {isSimulationMode && (
                            <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/50 rounded px-2 py-1 text-center">
                                Simulation Mode - Generate disabled. Run in Electron for real scaffolding.
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* RIGHT COLUMN (1/3 width) - Preview */}
            <div className="lg:w-80 xl:w-96">
                <Card title={
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-primary-700 dark:bg-secondary-300 rounded-full"></span>
                        Preview
                    </div>
                } className="h-fit">
                    <div className="flex flex-col gap-6">
                        <div>
                            <div className="text-xs font-semibold text-tokens-muted uppercase tracking-wider mb-1">Project Code</div>
                            <div className="font-mono text-xl text-tokens-brand-DEFAULT">{projectCode}</div>
                        </div>

                        <div>
                            <div className="text-xs font-semibold text-tokens-muted uppercase tracking-wider mb-1">Target Path</div>
                            <div className="font-mono text-xs text-tokens-muted break-all bg-tokens-panel2 p-2 rounded border border-tokens-border">
                                {previewResult?.projectPath || '(click Preview to generate)'}
                            </div>
                        </div>

                        <div>
                            <div className="text-xs font-semibold text-tokens-muted uppercase tracking-wider mb-2">Structure Preview</div>
                            <div className="text-sm text-tokens-fg bg-tokens-panel2/50 rounded p-3 border border-tokens-border flex flex-col gap-0.5 font-mono max-h-64 overflow-y-auto">
                                {previewResult?.plan ? (
                                    // Sprint 20.1: Dynamic file tree from previewResult.plan
                                    (() => {
                                        // Build tree structure
                                        const folders = new Set<string>();
                                        const files: string[] = [];

                                        previewResult.plan.forEach((item: { kind: string; relativePath: string }) => {
                                            if (item.kind === 'directory') {
                                                folders.add(item.relativePath);
                                            } else if (item.kind === 'file') {
                                                files.push(item.relativePath);
                                            }
                                        });

                                        return (
                                            <>
                                                {Array.from(folders).sort().map(folder => (
                                                    <div key={folder} className="text-tokens-fg">📁 {folder}</div>
                                                ))}
                                                {files.sort().map(file => {
                                                    const depth = (file.match(/\//g) || []).length;
                                                    const indent = '  '.repeat(depth);
                                                    return (
                                                        <div key={file} className="text-tokens-muted">
                                                            {indent}📄 {file.split('/').pop()}
                                                        </div>
                                                    );
                                                })}
                                            </>
                                        );
                                    })()
                                ) : (
                                    // Fallback: show static preview based on options
                                    <>
                                        <div>📁 00_Admin</div>
                                        {options.includeNotion && <div>&nbsp;&nbsp;📄 Brief.md</div>}
                                        <div>📁 01_Work</div>
                                        {options.includeMedia && <div>📁 02_Assets</div>}
                                        {options.includeMedia && <div>📁 03_Render</div>}
                                        <div>📁 99_Delivery</div>
                                        <div>📄 project.meta.json</div>
                                    </>
                                )}
                            </div>
                        </div>

                        {previewResult && (
                            <div className="text-xs text-tokens-muted text-center">
                                {previewResult.plan?.length || 0} items to create
                            </div>
                        )}

                    </div>
                </Card>
            </div>

        </div>
    );
}

// --- Main Project Hub Page Component ---
export function ProjectHubPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const tabFromUrl = searchParams.get('tab') || 'workflow';
    const activeTab = ['workflow', 'standards', 'generator'].includes(tabFromUrl) ? tabFromUrl : 'workflow';

    // Project state
    const [activeProject, setActiveProjectState] = useState<Project | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoadingProjects, setIsLoadingProjects] = useState(true);
    const [projectKey, setProjectKey] = useState(0); // For auto-swap workflow

    // Sprint 20.1: Blueprint filter state
    const [blueprintFilter, setBlueprintFilter] = useState<string>('all'); // 'all' or categoryId

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
        loadDiskProjects();
    }, []);

    const handleTabChange = (tabId: string) => {
        setSearchParams({ tab: tabId });
    };

    // Sprint 20.1: Auto-swap - update projectKey to force WorkflowCanvas remount
    const handleProjectChange = useCallback((projectId: string) => {
        setActiveProject(projectId);
        const active = getActiveProject();
        setActiveProjectState(active);
        setProjectKey(k => k + 1); // Force workflow refresh via key change
    }, []);

    const tabs = [
        { id: 'workflow', label: 'Workflow', icon: <FileText size={16} /> },
        { id: 'standards', label: 'Standards', icon: <Settings size={16} /> },
        { id: 'generator', label: 'Generator', icon: <Zap size={16} /> }
    ];

    // Sprint 20.1: Blueprint filter options - build from unique categoryIds
    const blueprintFilterOptions = useMemo(() => {
        const categories = new Set<string>();
        projects.forEach(p => {
            if (p.categoryId) categories.add(p.categoryId.toLowerCase());
        });

        const options: { value: string; label: string }[] = [
            { value: 'all', label: 'All Projects' },
            { value: 'none', label: 'No Blueprint' },
        ];

        // Add category options - capitalize first letter
        Array.from(categories).sort().forEach(cat => {
            options.push({
                value: cat,
                label: cat.charAt(0).toUpperCase() + cat.slice(1)
            });
        });

        return options;
    }, [projects]);

    // Sprint 20.1: Filter projects by blueprint category
    const filteredProjects = useMemo(() => {
        if (blueprintFilter === 'all') return projects;
        if (blueprintFilter === 'none') return projects.filter(p => !p.blueprintId);
        return projects.filter(p => p.categoryId?.toLowerCase() === blueprintFilter);
    }, [projects, blueprintFilter]);

    // Sprint 20.1: Show only project name (parse from folder name or use name field)
    const projectOptions = filteredProjects.map(p => {
        // Extract display name: prefer stored name, or parse from folder name
        // Format: YYMMDD_Category001_ProjectName → show "ProjectName"
        let displayName = p.name;
        if (p.projectPath) {
            const folderName = p.projectPath.split(/[/\\]/).pop() || '';
            const parts = folderName.split('_');
            if (parts.length >= 3) {
                // Take everything after the second underscore as the project name
                displayName = parts.slice(2).join(' ').replace(/-/g, ' ');
            }
        }
        return { value: p.id, label: displayName };
    });

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
                    <h1 className="text-3xl font-bold text-tokens-fg tracking-tight">Project Hub</h1>
                    <p className="text-tokens-muted text-sm mt-1">Manage projects from start to finish.</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Sprint 20.1: Blueprint Filter + Project Selector */}
                    <div className="flex items-center gap-2">
                        {/* Blueprint Filter Dropdown */}
                        <SelectDropdown
                            value={blueprintFilter}
                            options={blueprintFilterOptions}
                            onChange={setBlueprintFilter}
                            className="min-w-[140px]"
                        />

                        {/* Project Dropdown - filtered by blueprint */}
                        {isLoadingProjects ? (
                            <div className="text-sm text-tokens-muted px-4">Loading...</div>
                        ) : (
                            <SelectDropdown
                                value={activeProject?.id || ''}
                                options={projectOptions.length > 0 ? projectOptions : [{ value: '', label: 'No projects...' }]}
                                onChange={handleProjectChange}
                                className="min-w-[200px]"
                                disabled={projectOptions.length === 0}
                            />
                        )}

                        {/* Refresh button */}
                        <button
                            onClick={handleRefreshProjects}
                            disabled={isLoadingProjects}
                            className="p-2 bg-tokens-panel border border-tokens-border hover:bg-tokens-panel2 text-tokens-muted hover:text-tokens-fg rounded-lg transition-colors disabled:opacity-50"
                            title="Refresh projects from disk"
                        >
                            <RefreshCw size={16} className={isLoadingProjects ? 'animate-spin' : ''} />
                        </button>
                    </div>
                    <Link to="/" className="px-4 py-2 bg-tokens-panel border border-tokens-border hover:bg-tokens-panel2 text-tokens-fg rounded-lg text-sm transition-colors">
                        Back
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
                {activeTab === 'workflow' && <WorkflowCanvas key={`workflow-${projectKey}`} />}

                {activeTab === 'standards' && <StandardsTab />}

                {activeTab === 'generator' && <ProjectGeneratorForm />}
            </div>
        </PageContainer>
    );
}
