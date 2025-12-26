// Project Store - Manages project identity and active project selection
// Uses localStorage with schemaVersion for safe migrations

export type ProjectType = 'client' | 'gesu-creative' | 'other';

export interface Project {
    id: string;
    name: string;
    createdAt: number;
    updatedAt: number;
    archived?: boolean;
    // Sprint 21: Project type categorization
    type: ProjectType;              // NEW: client, gesu-creative, or other
    clientName?: string;            // NEW: e.g. 'SERAYA' (for client projects)
    projectTitle?: string;          // NEW: e.g. 'Rony and Lia WD' (for client projects)
    // Sprint 20: Blueprint integration
    categoryId?: string;            // e.g. 'archviz', 'general'
    blueprintId?: string;           // e.g. 'general-default'
    blueprintVersion?: number;      // e.g. 1
    projectPath?: string;           // Disk path (for imported projects)
}

interface ProjectStoreState {
    schemaVersion: number;
    projects: Project[];
    activeProjectId: string | null;
}

const STORAGE_KEY = 'gesu-projects';
const CURRENT_SCHEMA_VERSION = 2;  // Bumped for type migration

// --- Utility ---

function generateId(): string {
    return `proj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Detect project type from name patterns
 */
function detectProjectType(name: string): {
    type: ProjectType;
    clientName?: string;
    projectTitle?: string;
} {
    // Check for SERAYA (client)
    if (name.startsWith('SERAYA')) {
        const parts = name.split(' ');
        return {
            type: 'client',
            clientName: 'SERAYA',
            projectTitle: parts.slice(1).join(' ')
        };
    }

    // Check for Gesu Creative
    if (name.toLowerCase().includes('gesu')) {
        return { type: 'gesu-creative' };
    }

    // Default to other
    return { type: 'other' };
}

/**
 * Migrate projects from v1 to v2 (add type field)
 */
function migrateProjectsV1ToV2(projects: Project[]): Project[] {
    return projects.map(project => {
        if (!project.type) {
            const detected = detectProjectType(project.name);
            return {
                ...project,
                type: detected.type,
                clientName: detected.clientName,
                projectTitle: detected.projectTitle
            };
        }
        return project;
    });
}

// --- Storage ---

import {
    readRaw,
    parse,
    detectVersion,
    createBackupSnapshot,
    registerSchemaWarning
} from '../services/persistence/safeMigration';

// Async-safe: backups are fire-and-forget with error logging

/**
 * Safe loadState with backup-before-migration and no-reset on unknown version.
 * Note: Backup creation is async but we don't block the UI - backups happen in background.
 */
export function loadState(): ProjectStoreState {
    const defaultState = { schemaVersion: CURRENT_SCHEMA_VERSION, projects: [], activeProjectId: null };
    
    try {
        const raw = readRaw(STORAGE_KEY);
        if (!raw) {
            return defaultState;
        }

        const parseResult = parse<ProjectStoreState>(raw);
        
        if (!parseResult.success) {
            // CORRUPT: Create backup (async, don't block), register warning, return default
            // DO NOT write back or modify the original key
            void createBackupSnapshot(STORAGE_KEY, raw, { reason: 'corrupt' })
                .then(filename => {
                    registerSchemaWarning(STORAGE_KEY, 'CORRUPT', filename || undefined);
                })
                .catch(err => console.error('[projectStore] Backup failed:', err));
            
            console.warn('[projectStore] Parse failed, data preserved in backup. NOT resetting.');
            return defaultState;
        }

        const parsed = parseResult.data!;
        const version = detectVersion(parsed);

        // Handle schema migration v1 -> v2
        if (version === 1) {
            console.log('[projectStore] Migrating from schema v1 to v2...');
            
            // Create backup BEFORE migration (async, but we proceed with migration)
            void createBackupSnapshot(STORAGE_KEY, raw, { 
                reason: 'pre-migration', 
                fromVersion: 1, 
                toVersion: 2 
            }).catch(err => console.error('[projectStore] Pre-migration backup failed:', err));
            
            parsed.projects = migrateProjectsV1ToV2(parsed.projects);
            parsed.schemaVersion = 2;
            saveState(parsed);
            console.log('[projectStore] Migration complete!');
            return parsed;
        }
        
        // FUTURE_VERSION or unknown: DO NOT reset, preserve data
        if (version !== CURRENT_SCHEMA_VERSION) {
            // Create backup (async), register warning, return default for UI
            // CRITICAL: DO NOT write back or modify localStorage
            void createBackupSnapshot(STORAGE_KEY, raw, { 
                reason: version && version > CURRENT_SCHEMA_VERSION ? 'future-version' : 'unknown-version',
                fromVersion: version || undefined 
            })
                .then(filename => {
                    registerSchemaWarning(
                        STORAGE_KEY, 
                        version && version > CURRENT_SCHEMA_VERSION ? 'FUTURE_VERSION' : 'CORRUPT',
                        filename || undefined
                    );
                })
                .catch(err => console.error('[projectStore] Backup failed:', err));
            
            console.warn(`[projectStore] Schema v${version} not current (v${CURRENT_SCHEMA_VERSION}). Data preserved, NOT resetting.`);
            return defaultState;
        }

        return parsed;
    } catch (err) {
        console.error('[projectStore] Unexpected error:', err);
        return defaultState;
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

export function createProject(
    name: string,
    options?: {
        type?: ProjectType;
        clientName?: string;
        projectTitle?: string;
        categoryId?: string;
        blueprintId?: string;
        blueprintVersion?: number;
        projectPath?: string;
    }
): Project {
    const state = loadState();
    const now = Date.now();

    // Auto-detect type if not provided
    const detected = options?.type ? null : detectProjectType(name);

    const project: Project = {
        id: generateId(),
        name: name.trim() || 'Untitled Project',
        createdAt: now,
        updatedAt: now,
        type: options?.type || detected?.type || 'other',
        clientName: options?.clientName || detected?.clientName,
        projectTitle: options?.projectTitle || detected?.projectTitle,
        categoryId: options?.categoryId,
        blueprintId: options?.blueprintId,
        blueprintVersion: options?.blueprintVersion,
        projectPath: options?.projectPath,
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

export function clearActiveProject(): void {
    const state = loadState();
    state.activeProjectId = null;
    saveState(state);
}

/**
 * Get all projects using a specific blueprint
 * Used for safe deletion checks
 */
export function getProjectsByBlueprintId(blueprintId: string): Project[] {
    const state = loadState();
    return state.projects.filter(p => p.blueprintId === blueprintId && !p.archived);
}

export function updateProjectBlueprint(
    id: string,
    blueprint: {
        categoryId: string;
        blueprintId: string;
        blueprintVersion: number;
    }
): Project | null {
    const state = loadState();
    const project = state.projects.find(p => p.id === id);
    if (!project) return null;

    project.categoryId = blueprint.categoryId;
    project.blueprintId = blueprint.blueprintId;
    project.blueprintVersion = blueprint.blueprintVersion;
    project.updatedAt = Date.now();

    // Set as active project
    state.activeProjectId = id;
    saveState(state);

    return project;
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

export function deleteProject(id: string): boolean {
    const state = loadState();
    const initialLength = state.projects.length;
    state.projects = state.projects.filter(p => p.id !== id);

    if (state.projects.length === initialLength) return false;

    // If deleting active project, clear active or select next
    if (state.activeProjectId === id) {
        state.activeProjectId = state.projects.length > 0 ? state.projects[0].id : null;
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
    // Sprint 20: Blueprint fields
    categoryId?: string;
    blueprintId?: string;
    blueprintVersion?: number;
    // Sprint 23: Project type and client info
    projectType?: ProjectType;
    clientName?: string;
}>): number {
    const state = loadState();
    let importCount = 0;

    for (const diskProject of diskProjects) {
        // Check if already exists by ID or path
        const existsById = state.projects.some(p => p.id === diskProject.id);
        const existsByPath = state.projects.some(p =>
            p.projectPath === diskProject.projectPath
        );

        if (existsById || existsByPath) {
            // Update existing project with new fields if found by ID
            if (existsById) {
                const existingProject = state.projects.find(p => p.id === diskProject.id);
                if (existingProject) {
                    existingProject.categoryId = diskProject.categoryId || existingProject.categoryId;
                    existingProject.blueprintId = diskProject.blueprintId || existingProject.blueprintId;
                    existingProject.blueprintVersion = diskProject.blueprintVersion || existingProject.blueprintVersion;
                    existingProject.projectPath = diskProject.projectPath || existingProject.projectPath;
                    // Sprint 23: Update type and client info if available from disk
                    if (diskProject.projectType) existingProject.type = diskProject.projectType;
                    if (diskProject.clientName) existingProject.clientName = diskProject.clientName;
                }
            }
            continue; // Skip import for duplicates
        }

        // Import new project - use disk type if available, otherwise detect from name
        const detected = diskProject.projectType ? null : detectProjectType(diskProject.name);
        const project: Project = {
            id: diskProject.id,
            name: diskProject.name,
            createdAt: diskProject.createdAt ? new Date(diskProject.createdAt).getTime() : Date.now(),
            updatedAt: diskProject.updatedAt ? new Date(diskProject.updatedAt).getTime() : Date.now(),
            type: diskProject.projectType || detected?.type || 'other',
            clientName: diskProject.clientName || detected?.clientName,
            projectTitle: detected?.projectTitle,
            projectPath: diskProject.projectPath,
            categoryId: diskProject.categoryId,
            blueprintId: diskProject.blueprintId,
            blueprintVersion: diskProject.blueprintVersion,
        };

        state.projects.push(project);
        importCount++;
    }

    if (importCount > 0 || diskProjects.length > 0) {
        saveState(state); // Always save to update existing projects
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

        // Cleanup: Remove projects from state that have a projectPath but are not in diskProjects
        // This handles deleted folders ("zombies")
        const state = loadState();
        const initialCount = state.projects.length;

        state.projects = state.projects.filter(p => {
            // Keep if no path (might be cloud/memory only? though we don't have those yet)
            if (!p.projectPath) return true;

            // Check if this project path exists in the scan results
            // We normalize matches by checking if any disk project has this path
            // Note: diskProject.projectPath comes from the bridge
            return diskProjects.some((dp: any) => dp.projectPath === p.projectPath);
        });

        if (state.projects.length !== initialCount) {
            console.log(`[projectStore] Pruned ${initialCount - state.projects.length} missing projects`);

            // If active project was removed, clear it
            if (state.activeProjectId && !state.projects.find(p => p.id === state.activeProjectId)) {
                state.activeProjectId = null;
            }
            saveState(state);
        }

        console.log(`[projectStore] Refreshed from disk: ${importCount} new projects imported`);

        return importCount;
    } catch (err) {
        console.error('[projectStore] Failed to refresh from disk:', err);
        return 0;
    }
}

/**
 * Check if a project's folder exists on disk
 * Returns true if valid, false if missing
 * TODO: Implement actual disk check when fs API is available
 */
export function validateProjectExists(project: Project): boolean {
    // Note: Currently no fs.exists API is available in window.gesu
    // For now, assume all projects with a path are valid
    // Future: Add window.gesu.fs?.exists when implemented in Electron bridge
    if (!project.projectPath) {
        // No path means it's a local-only project, assume valid
        return true;
    }

    // For now, return true - validation will be added when fs API is available
    return true;
}

/**
 * Remove projects whose folders no longer exist on disk
 * @returns Number of projects removed
 */
export function removeInvalidProjects(): number {
    const state = loadState();
    const before = state.projects.length;

    state.projects = state.projects.filter(project => {
        return validateProjectExists(project);
    });

    const removed = before - state.projects.length;

    if (removed > 0) {
        // Clear active project if it was removed
        if (state.activeProjectId) {
            const activeStillExists = state.projects.some(p => p.id === state.activeProjectId);
            if (!activeStillExists) {
                state.activeProjectId = state.projects.length > 0 ? state.projects[0].id : null;
            }
        }

        saveState(state);
        console.log(`[projectStore] Removed ${removed} invalid projects`);
    }

    return removed;
}
