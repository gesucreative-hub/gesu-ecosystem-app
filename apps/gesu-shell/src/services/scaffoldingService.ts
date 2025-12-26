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
    projectId?: string;
    projectName?: string;
    warnings?: string[];
    error?: string;
}

// Interface for the scaffolding service
export interface IScaffoldingService {
    isSimulationMode(): boolean;
    preview(projectName: string, templateId: string, folderTemplateFolders?: string[]): Promise<ScaffoldPreviewResult>;
    scaffold(projectName: string, templateId: string, blueprintOptions?: {
        categoryId?: string;
        blueprintId?: string;
        blueprintVersion?: number;
        folderTemplateFolders?: string[];  // Sprint 21.3: Blueprint-driven folder generation
        projectType?: 'client' | 'gesu-creative' | 'other';  // Sprint 23: Project type
        clientName?: string;                // Sprint 23: Client name for folder naming
        briefContent?: string;              // Sprint 23: Brief/description content
        displayName?: string;               // Sprint 23: Original project name for display
        options?: {                        // Sprint 6.6: Project options wrapper
            gitInit?: boolean;
            includeMedia?: boolean;
            includeNotion?: boolean;
            includeLog?: boolean;
        };
    }): Promise<ScaffoldResult>;
}

// --- Real Implementation (Electron Bridge) ---

async function realPreview(projectName: string, templateId: string, folderTemplateFolders?: string[]): Promise<ScaffoldPreviewResult> {
    if (!window.gesu?.scaffold?.preview) {
        throw new Error('Scaffold bridge not available');
    }

    return await window.gesu.scaffold.preview({ projectName, templateId, folderTemplateFolders });
}

async function realScaffold(
    projectName: string,
    templateId: string,
    blueprintOptions?: {
        categoryId?: string;
        blueprintId?: string;
        blueprintVersion?: number;
        folderTemplateFolders?: string[];
        projectType?: 'client' | 'gesu-creative' | 'other';
        clientName?: string;
        briefContent?: string;
        displayName?: string;
        options?: {
            gitInit?: boolean;
            includeMedia?: boolean;
            includeNotion?: boolean;
            includeLog?: boolean;
        };
    }
): Promise<ScaffoldResult> {
    if (!window.gesu?.scaffold?.create) {
        throw new Error('Scaffold bridge not available');
    }

    return await window.gesu.scaffold.create({
        projectName,
        templateId,
        ...blueprintOptions,
        options: blueprintOptions?.options // Explicitly pass nested options
    });
}

// --- Simulation Mode ---

async function simulationPreview(projectName: string, _templateId: string, folderTemplateFolders?: string[]): Promise<ScaffoldPreviewResult> {
    await new Promise(resolve => setTimeout(resolve, 300));

    // Sprint 21.3: Use folder template folders if provided, otherwise fallback to static preview
    const plan: ScaffoldPlanItem[] = [
        { kind: 'dir', relativePath: '.' },
        { kind: 'file', relativePath: 'project.meta.json', content: '{}' },
        { kind: 'file', relativePath: 'Brief.md', content: '# ' + projectName },
    ];

    if (folderTemplateFolders && folderTemplateFolders.length > 0) {
        // Add folders from the template
        folderTemplateFolders.forEach(folder => {
            plan.push({ kind: 'dir', relativePath: folder });
        });
    } else {
        // Fallback to default static folders
        plan.push({ kind: 'dir', relativePath: 'Media' });
        plan.push({ kind: 'dir', relativePath: 'Output' });
    }

    return {
        ok: true,
        projectPath: `D:/Projects/${projectName}`,
        plan
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
    preview: async (projectName, templateId, folderTemplateFolders) => {
        if (window.gesu?.scaffold?.preview) {
            return await realPreview(projectName, templateId, folderTemplateFolders);
        } else {
            return await simulationPreview(projectName, templateId, folderTemplateFolders);
        }
    },
    scaffold: async (projectName, templateId, blueprintOptions) => {
        if (window.gesu?.scaffold?.create) {
            return await realScaffold(projectName, templateId, blueprintOptions);
        } else {
            return await simulationScaffold();
        }
    }
};
