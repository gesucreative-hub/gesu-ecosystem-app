import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageContainer } from '../components/PageContainer';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { SelectDropdown } from '../components/Dropdown';
import { Tabs } from '../components/Tabs';
import { WorkflowCanvas } from './WorkflowCanvas';
import { Zap, FileText } from 'lucide-react';
import {
    listProjects,
    getActiveProject,
    setActiveProject,
    createProject,
    ensureDefaultProject,
    Project,
} from '../stores/projectStore';
import { scaffoldingService, ScaffoldPreviewResult } from '../services/scaffoldingService';


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

    // Derived State
    const projectCode = useMemo(() => generateProjectCode(type, name), [type, name]);
    const selectedTemplate = TEMPLATES.find(t => t.id === templateId) || TEMPLATES[0];
    const isSimulationMode = scaffoldingService.isSimulationMode();

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
            const result = await scaffoldingService.scaffold(name.trim(), templateId);
            if (result.ok) {
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
                        <span className="w-1.5 h-6 bg-tokens-brand-DEFAULT rounded-full"></span>
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
                                    label="Category / Discipline"
                                    value={category}
                                    onChange={(value) => setCategory(value)}
                                    options={CATEGORIES}
                                />
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
                        <span className="w-1.5 h-6 bg-tokens-brand-muted/50 rounded-full"></span>
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
                            <div className="text-sm text-tokens-fg bg-tokens-panel2/50 rounded p-3 border border-tokens-border flex flex-col gap-1 font-mono">
                                <div>📁 00_Admin</div>
                                {options.includeNotion && <div>&nbsp;&nbsp;📄 Brief.md</div>}
                                <div>📁 01_Work</div>
                                {options.includeMedia && <div>📁 02_Assets</div>}
                                {options.includeMedia && <div>📁 03_Render</div>}
                                <div>📁 99_Delivery</div>
                                <div>📄 project.meta.json</div>
                            </div>
                        </div>

                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-600 dark:text-amber-400 leading-relaxed">
                            <strong>Note:</strong> Actual folder creation will be handled by the Electron backend in a future update. This is currently a UI mockup.
                        </div>

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
    const activeTab = tabFromUrl === 'generator' ? 'generator' : 'workflow';

    // Project state
    const [activeProject, setActiveProjectState] = useState<Project | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [showNewProjectInput, setShowNewProjectInput] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [refreshKey, setRefreshKey] = useState(0);

    // Load projects on mount
    useEffect(() => {
        const active = ensureDefaultProject();
        setActiveProjectState(active);
        setProjects(listProjects());
    }, []);

    const handleTabChange = (tabId: string) => {
        setSearchParams({ tab: tabId });
    };

    const handleProjectChange = useCallback((projectId: string) => {
        if (projectId === '__new__') {
            setShowNewProjectInput(true);
            return;
        }
        setActiveProject(projectId);
        const active = getActiveProject();
        setActiveProjectState(active);
        setRefreshKey(k => k + 1); // Force canvas refresh
    }, []);

    const handleCreateProject = useCallback(() => {
        if (!newProjectName.trim()) return;
        const project = createProject(newProjectName.trim());
        setActiveProjectState(project);
        setProjects(listProjects());
        setNewProjectName('');
        setShowNewProjectInput(false);
        setRefreshKey(k => k + 1);
    }, [newProjectName]);

    const tabs = [
        { id: 'workflow', label: 'Workflow', icon: <FileText size={16} /> },
        { id: 'generator', label: 'Generator', icon: <Zap size={16} /> }
    ];

    const projectOptions = [
        ...projects.map(p => ({ value: p.id, label: p.name })),
        { value: '__new__', label: '+ New Project' },
    ];

    return (
        <PageContainer>
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-tokens-fg tracking-tight">Project Hub</h1>
                    <p className="text-tokens-muted text-sm mt-1">Manage projects from start to finish.</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Project Selector */}
                    <div className="flex items-center gap-2">
                        {showNewProjectInput ? (
                            <div className="flex items-center gap-2">
                                <Input
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                    placeholder="Project name"
                                    className="w-40"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleCreateProject();
                                        if (e.key === 'Escape') setShowNewProjectInput(false);
                                    }}
                                />
                                <Button size="sm" variant="primary" onClick={handleCreateProject}>
                                    Create
                                </Button>
                                <Button size="sm" variant="secondary" onClick={() => setShowNewProjectInput(false)}>
                                    Cancel
                                </Button>
                            </div>
                        ) : (
                            <SelectDropdown
                                value={activeProject?.id || ''}
                                options={projectOptions}
                                onChange={handleProjectChange}
                                className="min-w-[180px]"
                            />
                        )}
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
                {activeTab === 'workflow' && <WorkflowCanvas />}

                {activeTab === 'generator' && <ProjectGeneratorForm />}
            </div>
        </PageContainer>
    );
}
