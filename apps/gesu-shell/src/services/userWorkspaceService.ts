/**
 * User Workspace Service
 * Manages user-specific workspace directories for multi-user support
 */

export interface UserWorkspace {
    userId: string | null;
    workspacePath: string;
    projectsPath: string;
    workflowsPath: string;
    compassSnapshotsPath: string;
    databasePath: string;
    settingsPath: string;
}

/**
 * Get the workspace path for a given user
 * @param workflowRoot - Base workflow root from settings
 * @param userId - Firebase user ID or null for default
 */
export function getUserWorkspacePath(workflowRoot: string, userId: string | null): string {
    const userDir = userId || 'default';
    return `${workflowRoot}\\users\\${userDir}`;
}

/**
 * Get all workspace paths for a user
 */
export function getUserWorkspace(workflowRoot: string, userId: string | null): UserWorkspace {
    const workspacePath = getUserWorkspacePath(workflowRoot, userId);

    return {
        userId,
        workspacePath,
        projectsPath: `${workspacePath}\\projects`,
        workflowsPath: `${workspacePath}\\workflows`,
        compassSnapshotsPath: `${workspacePath}\\compass-snapshots`,
        databasePath: `${workspacePath}\\gesu-database.db`,
        settingsPath: `${workspacePath}\\settings.json`,
    };
}

/**
 * Ensure workspace directories exist for a user
 * Creates all necessary subdirectories if they don't exist
 */
export async function ensureUserWorkspace(workflowRoot: string, userId: string | null): Promise<UserWorkspace> {
    const workspace = getUserWorkspace(workflowRoot, userId);

    // For renderer process, we need to use IPC to create directories
    if (window.gesu?.fs?.ensureDir) {
        await window.gesu.fs.ensureDir(workspace.workspacePath);
        await window.gesu.fs.ensureDir(workspace.projectsPath);
        await window.gesu.fs.ensureDir(workspace.workflowsPath);
        await window.gesu.fs.ensureDir(workspace.compassSnapshotsPath);

        console.log('[UserWorkspace] Created workspace for user:', userId || 'default');
    } else {
        console.warn('[UserWorkspace] fs.ensureDir not available, workspace may not exist');
    }

    return workspace;
}

/**
 * Check if a user workspace exists
 */
export async function workspaceExists(workflowRoot: string, userId: string | null): Promise<boolean> {
    const workspace = getUserWorkspace(workflowRoot, userId);

    if (window.gesu?.fs?.pathExists) {
        return await window.gesu.fs.pathExists(workspace.workspacePath);
    }

    return false;
}

/**
 * List all user workspaces (admin function)
 */
export async function listUserWorkspaces(workflowRoot: string): Promise<string[]> {
    const usersDir = `${workflowRoot}\\users`;

    if (window.gesu?.fs?.readDir) {
        try {
            const entries = await window.gesu.fs.readDir(usersDir);
            return entries.filter(entry => entry.isDirectory).map(entry => entry.name);
        } catch (err) {
            console.error('[UserWorkspace] Failed to list workspaces:', err);
            return [];
        }
    }

    return [];
}
