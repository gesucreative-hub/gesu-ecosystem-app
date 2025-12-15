// Project Scaffolding Service Interface
// Provides a clean boundary for project scaffolding operations
// Mock implementation for now; real FS can be swapped in later

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

export interface ScaffoldResult {
    success: boolean;
    projectCode: string;
    projectPath: string;
    message: string;
    createdFolders: string[];
}

// Interface for the scaffolding service
export interface IScaffoldingService {
    generateProjectCode(type: string, name: string): string;
    scaffold(config: ProjectConfig): Promise<ScaffoldResult>;
    getProjectsRoot(): Promise<string>;
}

// --- Mock Implementation ---

function mockGenerateProjectCode(type: string, name: string): string {
    const typePrefix = type.split(' ')[0]?.substring(0, 2).toUpperCase() || 'PR';
    const dateCode = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const nameCode = name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase() || 'PROJ';
    return `${typePrefix}-${dateCode}-${nameCode}`;
}

async function mockScaffold(config: ProjectConfig): Promise<ScaffoldResult> {
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 500));

    const projectCode = mockGenerateProjectCode(config.type, config.name);
    const projectPath = `D:/Projects/${projectCode}`;
    const createdFolders: string[] = [projectPath];

    // Mock folder creation based on options
    if (config.options.includeMedia) {
        createdFolders.push(`${projectPath}/Media`);
    }
    if (config.options.includeNotion) {
        createdFolders.push(`${projectPath}/Notion`);
    }
    if (config.options.includeLog) {
        createdFolders.push(`${projectPath}/Log`);
    }
    if (config.options.gitInit) {
        createdFolders.push(`${projectPath}/.git`);
    }

    console.log('[MockScaffolding] Created project:', {
        projectCode,
        projectPath,
        createdFolders,
    });

    return {
        success: true,
        projectCode,
        projectPath,
        message: `Project ${projectCode} created successfully (mock).`,
        createdFolders,
    };
}

async function mockGetProjectsRoot(): Promise<string> {
    return 'D:/Projects';
}

// --- Service Instance ---

export const scaffoldingService: IScaffoldingService = {
    generateProjectCode: mockGenerateProjectCode,
    scaffold: mockScaffold,
    getProjectsRoot: mockGetProjectsRoot,
};

// --- Real Implementation Placeholder ---
// When Electron FS is available, create a realScaffoldingService that implements IScaffoldingService
// and swap it in by updating the export above.

/*
export async function createRealScaffoldingService(): Promise<IScaffoldingService> {
    // Uses window.gesu.fs or similar Electron bridge
    return {
        generateProjectCode: (type, name) => { ... },
        scaffold: async (config) => { ... use real FS ... },
        getProjectsRoot: async () => { ... }
    };
}
*/
