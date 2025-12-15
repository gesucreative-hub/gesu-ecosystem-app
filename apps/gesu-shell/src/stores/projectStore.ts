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
