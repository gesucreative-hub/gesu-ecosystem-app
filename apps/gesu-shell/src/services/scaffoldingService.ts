// Project Scaffolding Service Interface
// Provides a clean boundary for project scaffolding operations

export interface ProjectConfig {
    name: string;
    type: string;
    workflowSlot: string;
    options: {
        includeMedia: boolean;
        includeNotion: boolean;
        includeLog: boolean;
        gitInit: boolean;
    };
}

export interface ScaffoldPlanItem {
    kind: 'dir' | 'file';
    relativePath: string;
    content?: string;
}

export interface ScaffoldPreviewResult {
    ok: boolean;
    projectPath?: string;
    plan?: ScaffoldPlanItem[];
    error?: string;
}

export interface ScaffoldResult {
    ok: boolean;
    projectPath?: string;
    warnings?: string[];
    error?: string;
}

// Interface for the scaffolding service
export interface IScaffoldingService {
    isSimulationMode(): boolean;
    preview(projectName: string, templateId: string): Promise<ScaffoldPreviewResult>;
    scaffold(projectName: string, templateId: string): Promise<ScaffoldResult>;
}

// --- Real Implementation (Electron Bridge) ---

async function realPreview(projectName: string, templateId: string): Promise<ScaffoldPreviewResult> {
    if (!window.gesu?.scaffold?.preview) {
        throw new Error('Scaffold bridge not available');
    }

    return await window.gesu.scaffold.preview({ projectName, templateId });
}

async function realScaffold(projectName: string, templateId: string): Promise<ScaffoldResult> {
    if (!window.gesu?.scaffold?.create) {
        throw new Error('Scaffold bridge not available');
    }

    return await window.gesu.scaffold.create({ projectName, templateId });
}

// --- Simulation Mode ---

async function simulationPreview(projectName: string, templateId: string): Promise<ScaffoldPreviewResult> {
    await new Promise(resolve => setTimeout(resolve, 300));

    return {
        ok: true,
        projectPath: `D:/Projects/${projectName}`,
        plan: [
            { kind: 'dir', relativePath: '.' },
            { kind: 'file', relativePath: 'project.meta.json', content: '{}' },
            { kind: 'file', relativePath: 'Brief.md', content: '# ' + projectName },
            { kind: 'dir', relativePath: 'Media' },
            { kind: 'dir', relativePath: 'Output' }
        ]
    };
}

async function simulationScaffold(): Promise<ScaffoldResult> {
    // Block scaffold in simulation mode
    return {
        ok: false,
        error: 'Scaffold not available in simulation mode. Please run in Electron.'
    };
}

// --- Service Instance ---

export const scaffoldingService: IScaffoldingService = {
    isSimulationMode: () => !window.gesu?.scaffold?.preview,
    preview: async (projectName, templateId) => {
        if (window.gesu?.scaffold?.preview) {
            return await realPreview(projectName, templateId);
        } else {
            return await simulationPreview(projectName, templateId);
        }
    },
    scaffold: async (projectName, templateId) => {
        if (window.gesu?.scaffold?.create) {
            return await realScaffold(projectName, templateId);
        } else {
            return await simulationScaffold();
        }
    }
};
