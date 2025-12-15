// Project Store - Manages project identity and active project selection
// Uses localStorage with schemaVersion for safe migrations

export interface Project {
    id: string;
    name: string;
    createdAt: number;
    updatedAt: number;
    archived?: boolean;
}

interface ProjectStoreState {
    schemaVersion: number;
    projects: Project[];
    activeProjectId: string | null;
}

const STORAGE_KEY = 'gesu-projects';
const CURRENT_SCHEMA_VERSION = 1;

// --- Utility ---

function generateId(): string {
    return `proj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// --- Storage ---

function loadState(): ProjectStoreState {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return { schemaVersion: CURRENT_SCHEMA_VERSION, projects: [], activeProjectId: null };
        }

        const parsed: ProjectStoreState = JSON.parse(raw);

        if (parsed.schemaVersion !== CURRENT_SCHEMA_VERSION) {
            console.warn('Project store schema mismatch. Resetting.');
            return { schemaVersion: CURRENT_SCHEMA_VERSION, projects: [], activeProjectId: null };
        }

        return parsed;
    } catch {
        return { schemaVersion: CURRENT_SCHEMA_VERSION, projects: [], activeProjectId: null };
    }
}

function saveState(state: ProjectStoreState): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// --- Public API ---

export function listProjects(): Project[] {
    const state = loadState();
    return state.projects.filter(p => !p.archived).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getProjectById(id: string): Project | null {
    const state = loadState();
    return state.projects.find(p => p.id === id) || null;
}

export function createProject(name: string): Project {
    const state = loadState();
    const now = Date.now();

    const project: Project = {
        id: generateId(),
        name: name.trim() || 'Untitled Project',
        createdAt: now,
        updatedAt: now,
    };

    state.projects.push(project);
    state.activeProjectId = project.id;
    saveState(state);

    return project;
}

export function renameProject(id: string, name: string): Project | null {
    const state = loadState();
    const project = state.projects.find(p => p.id === id);
    if (!project) return null;

    project.name = name.trim() || 'Untitled Project';
    project.updatedAt = Date.now();
    saveState(state);

    return project;
}

export function setActiveProject(id: string): boolean {
    const state = loadState();
    const project = state.projects.find(p => p.id === id && !p.archived);
    if (!project) return false;

    state.activeProjectId = id;
    project.updatedAt = Date.now();
    saveState(state);

    return true;
}

export function getActiveProject(): Project | null {
    const state = loadState();
    if (!state.activeProjectId) return null;
    return state.projects.find(p => p.id === state.activeProjectId && !p.archived) || null;
}

export function getActiveProjectId(): string | null {
    return loadState().activeProjectId;
}

export function archiveProject(id: string): boolean {
    const state = loadState();
    const project = state.projects.find(p => p.id === id);
    if (!project) return false;

    project.archived = true;
    project.updatedAt = Date.now();

    // If archiving active project, clear active
    if (state.activeProjectId === id) {
        const remaining = state.projects.filter(p => !p.archived);
        state.activeProjectId = remaining.length > 0 ? remaining[0].id : null;
    }

    saveState(state);
    return true;
}

export function ensureDefaultProject(): Project {
    const active = getActiveProject();
    if (active) return active;

    const projects = listProjects();
    if (projects.length > 0) {
        setActiveProject(projects[0].id);
        return projects[0];
    }

    return createProject('My First Project');
}

/**
 * Import projects from disk and merge into store (avoiding duplicates)
 * @param diskProjects - Array of projects from disk discovery
 */
export function importFromDisk(diskProjects: Array<{
    id: string;
    name: string;
    projectPath: string;
    createdAt?: string;
    updatedAt?: string;
}>): number {
    const state = loadState();
    let importCount = 0;

    for (const diskProject of diskProjects) {
        // Check if already exists by ID or path
        const existsById = state.projects.some(p => p.id === diskProject.id);
        const existsByPath = state.projects.some(p =>
            p.name === diskProject.name &&
            Math.abs(p.createdAt - new Date(diskProject.createdAt || 0).getTime()) < 60000 // within 1 minute
        );

        if (existsById || existsByPath) {
            continue; // Skip duplicates
        }

        // Import new project
        const project: Project = {
            id: diskProject.id,
            name: diskProject.name,
            createdAt: diskProject.createdAt ? new Date(diskProject.createdAt).getTime() : Date.now(),
            updatedAt: diskProject.updatedAt ? new Date(diskProject.updatedAt).getTime() : Date.now(),
        };

        state.projects.push(project);
        importCount++;
    }

    if (importCount > 0) {
        saveState(state);
    }

    return importCount;
}

/**
 * Refresh projects from disk by calling the Electron bridge
 * @returns Number of projects imported
 */
export async function refreshFromDisk(): Promise<number> {
    if (!window.gesu?.projects?.list) {
        console.warn('[projectStore] Disk refresh not available (simulation mode)');
        return 0;
    }

    try {
        const diskProjects = await window.gesu.projects.list();
        const importCount = importFromDisk(diskProjects);
        console.log(`[projectStore] Refreshed from disk: ${importCount} new projects imported`);
        return importCount;
    } catch (err) {
        console.error('[projectStore] Failed to refresh from disk:', err);
        return 0;
    }
}
