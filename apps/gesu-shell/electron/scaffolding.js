import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

// --- Safety Constants ---

const BACKUP_ROOT = String.raw`D:\03. Resources\_Gesu's\Backup\WorkFlowDatabase-ps-stack-v1`;

// --- Helper Functions ---

/**
 * Sanitizes a project name for use as a folder name.
 * Removes invalid characters, trims, collapses spaces.
 */
export function sanitizeProjectName(name) {
    return name
        .replace(/[<>:"|?*\/\\]/g, '') // Remove invalid Windows path chars
        .replace(/\s+/g, '-') // Collapse spaces to hyphens
        .trim()
        .slice(0, 100); // Limit length
}

/**
 * Validates that a target path is within the allowed base directory.
 * Rejects path traversal attempts and paths outside baseDir.
 */
export async function assertPathWithin(baseDir, targetPath) {
    const resolvedBase = path.resolve(baseDir);
    const resolvedTarget = path.resolve(targetPath);

    // Check if target is within base
    if (!resolvedTarget.startsWith(resolvedBase + path.sep) && resolvedTarget !== resolvedBase) {
        throw new Error('Path traversal detected: target is outside allowed directory');
    }

    // Defense-in-depth: explicitly reject BACKUP_ROOT
    const resolvedBackup = path.resolve(BACKUP_ROOT);
    if (resolvedTarget.startsWith(resolvedBackup + path.sep) || resolvedTarget === resolvedBackup) {
        throw new Error('Safety violation: cannot write to BACKUP_ROOT');
    }

    return resolvedTarget;
}

/**
 * Builds a scaffolding plan for a new project.
 * Returns an array of operations to execute.
 * Sprint 21.3: Added folderTemplateFolders param for blueprint-driven folder generation
 * Sprint 23: Added projectType, clientName, briefContent, displayName for proper naming
 */
export function buildPlan({ projectsRoot, projectName, templateId, categoryId, blueprintId, blueprintVersion, folderTemplateFolders, projectType, clientName, briefContent, displayName }) {
    // projectName is now the full folder name (with date prefix etc) from the frontend
    const sanitizedName = sanitizeProjectName(projectName);
    if (!sanitizedName) {
        throw new Error('Invalid project name');
    }

    const projectPath = path.join(projectsRoot, sanitizedName);
    const projectId = `proj-${Date.now()}-${randomUUID().slice(0, 8)}`;

    const plan = [];

    // 1. Project root directory
    plan.push({ kind: 'dir', relativePath: '.' });

    // 2. Project metadata file (including Sprint 20 blueprint fields)
    // Sprint 23: Use displayName for the project name field
    const metaData = {
        id: projectId,
        name: displayName || projectName,
        createdAt: new Date().toISOString(),
        templateId,
        projectPath,
        persona: 'business'  // S2-1: Always business for new projects
    };

    // Sprint 20: Add blueprint fields if provided
    if (categoryId) metaData.categoryId = categoryId;
    if (blueprintId) metaData.blueprintId = blueprintId;
    if (blueprintVersion) metaData.blueprintVersion = blueprintVersion;
    
    // Sprint 23: Add project type
    if (projectType) metaData.projectType = projectType;
    if (clientName) metaData.clientName = clientName;

    plan.push({
        kind: 'file',
        relativePath: 'project.meta.json',
        content: JSON.stringify(metaData, null, 2)
    });

    // 3. Brief.md - Sprint 23: Use briefContent if provided
    const projectDisplayName = displayName || projectName;
    const briefMdContent = briefContent 
        ? `# ${projectDisplayName}\n\n## Brief\n${briefContent}\n\n## Notes\nAdd your notes here.\n`
        : `# ${projectDisplayName}\n\n## Overview\nBrief description of the project.\n\n## Goals\n- Goal 1\n- Goal 2\n\n## Notes\nAdd your notes here.\n`;
    
    plan.push({
        kind: 'file',
        relativePath: 'Brief.md',
        content: briefMdContent
    });

    // 4. Folder structure - Sprint 21.3: Use folderTemplateFolders if provided
    if (folderTemplateFolders && folderTemplateFolders.length > 0) {
        // Use blueprint-driven folder template
        folderTemplateFolders.forEach(folderPath => {
            plan.push({ kind: 'dir', relativePath: folderPath });
        });
    } else {
        // Fallback to legacy hardcoded folders based on templateId
        const commonDirs = ['Media', 'Assets', 'Notes', 'Output', 'Archive'];

        if (templateId === 'video-production') {
            plan.push({ kind: 'dir', relativePath: 'Footage' });
            plan.push({ kind: 'dir', relativePath: 'Exports' });
        } else if (templateId === 'design') {
            plan.push({ kind: 'dir', relativePath: 'Designs' });
            plan.push({ kind: 'dir', relativePath: 'Assets' });
        } else if (templateId === 'writing') {
            plan.push({ kind: 'dir', relativePath: 'Drafts' });
            plan.push({ kind: 'dir', relativePath: 'Research' });
        }

        // Add common dirs
        commonDirs.forEach(dir => {
            plan.push({ kind: 'dir', relativePath: dir });
        });
    }

    return { projectPath, plan };
}

/**
 * Applies a scaffolding plan to the filesystem.
 * Creates directories and files with safety checks.
 */
export async function applyPlan({ projectsRoot, plan, projectPath }) {
    // Validate project path
    await assertPathWithin(projectsRoot, projectPath);

    // Check if project already exists
    try {
        await fs.access(projectPath);
        throw new Error('Project folder already exists');
    } catch (err) {
        if (err.code !== 'ENOENT') {
            throw err; // Already exists or other error
        }
        // ENOENT is expected (folder doesn't exist yet)
    }

    const warnings = [];

    // Execute plan
    for (const item of plan) {
        const fullPath = path.join(projectPath, item.relativePath);

        // Safety check for each operation
        await assertPathWithin(projectsRoot, fullPath);

        if (item.kind === 'dir') {
            try {
                await fs.mkdir(fullPath, { recursive: true });
            } catch (err) {
                warnings.push(`Failed to create directory ${item.relativePath}: ${err.message}`);
            }
        } else if (item.kind === 'file') {
            try {
                // Ensure parent directory exists
                await fs.mkdir(path.dirname(fullPath), { recursive: true });

                // Write file with 'wx' flag to prevent overwrite
                await fs.writeFile(fullPath, item.content || '', { flag: 'wx' });
            } catch (err) {
                warnings.push(`Failed to create file ${item.relativePath}: ${err.message}`);
            }
        }
    }

    return { ok: true, projectPath, warnings: warnings.length > 0 ? warnings : undefined };
}

/**
 * Appends a project creation entry to the centralized ProjectLog
 * @param {Object} params - Log entry parameters
 * @param {string} params.projectsRoot - Projects root directory
 * @param {string} params.projectId - Project ID
 * @param {string} params.projectName - Project name
 * @param {string} params.projectPath - Full path to project
 * @param {string} params.templateId - Template ID used
 */
export async function appendProjectLog({ projectsRoot, projectId, projectName, projectPath, templateId }) {
    try {
        // Validate projectsRoot
        await assertPathWithin(projectsRoot, projectsRoot);

        // _Index directory path
        const indexDir = path.join(projectsRoot, '_Index');
        const logPath = path.join(indexDir, 'ProjectLog.jsonl');

        // Validate log path within projectsRoot
        await assertPathWithin(projectsRoot, logPath);

        // Create _Index directory if missing
        try {
            await fs.mkdir(indexDir, { recursive: true });
        } catch (err) {
            console.error('[scaffolding] Failed to create _Index:', err);
        }

        // Create log entry (JSONL format - one JSON object per line)
        const logEntry = {
            timestamp: new Date().toISOString(),
            projectId,
            projectName,
            projectPath,
            templateId
        };


        const logLine = JSON.stringify(logEntry) + '\n';

        // Append to log file (create if doesn't exist)
        await fs.appendFile(logPath, logLine, 'utf-8');

        console.log('[scaffolding] Appended to ProjectLog:', projectId);
    } catch (err) {
        // Log error but don't fail the scaffolding operation
        console.error('[scaffolding] Failed to append ProjectLog:', err);
    }
}

/**
 * Initializes a git repository in the target path.
 * @param {string} projectPath 
 */
export async function initializeGitRepo(projectPath) {
    const { spawn } = await import('node:child_process');
    console.log('[scaffolding] Initializing git repo in:', projectPath);

    return new Promise((resolve) => {
        const child = spawn('git', ['init'], {
            cwd: projectPath,
            shell: process.platform === 'win32' // Required for some windows environments, but spawn is safer than exec
        });

        let output = '';
        let error = '';

        child.stdout.on('data', (d) => {
            output += d.toString();
        });

        child.stderr.on('data', (d) => {
            error += d.toString();
        });

        child.on('close', (code) => {
            if (code === 0) {
                console.log('[scaffolding] Git init success:', output.trim());
                resolve({ success: true, message: output.trim() });
            } else {
                console.error('[scaffolding] Git init failed:', error.trim());
                resolve({ success: false, error: error.trim() });
            }
        });

        child.on('error', (err) => {
            console.error('[scaffolding] Git init spawn error:', err);
            resolve({ success: false, error: err.message });
        });
    });
}

