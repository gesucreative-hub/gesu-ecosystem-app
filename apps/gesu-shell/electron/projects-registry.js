import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Projects Registry Module
 * Scans disk for existing projects by detecting project.meta.json files
 * Sprint 20.1: Also supports folder-based detection for legacy projects
 */

const BACKUP_ROOT = String.raw`D:\03. Resources\_Gesu's\Backup\WorkFlowDatabase-ps-stack-v1`;

/**
 * Parse project info from folder name
 * Expected format: YYMMDD_CategoryXXX_ProjectName-Description
 * Example: 251119_ArchViz001_Visualisasi-3D-Natura
 * @param {string} folderName - The folder name to parse
 * @returns {{ name: string, categoryPrefix: string | null }}
 */
function parseProjectFolderName(folderName) {
    const parts = folderName.split('_');

    if (parts.length >= 3) {
        // Format: YYMMDD_CategoryXXX_Name-Name
        // Take everything after second underscore as project name
        const projectName = parts.slice(2).join(' ').replace(/-/g, ' ');
        const categoryPrefix = parts[1] || null;
        return { name: projectName, categoryPrefix };
    } else if (parts.length === 2) {
        // Format: Something_Name
        return { name: parts[1].replace(/-/g, ' '), categoryPrefix: null };
    }

    // Fallback: use folder name as-is
    return { name: folderName.replace(/-/g, ' '), categoryPrefix: null };
}

/**
 * Lists all projects found under projectsRoot by scanning for project.meta.json
 * Falls back to folder-based detection for legacy projects
 * @param {string} projectsRoot - Root directory to scan
 * @returns {Promise<Array>} Array of project metadata objects
 */
export async function listProjects(projectsRoot) {
    const projects = [];

    if (!projectsRoot || projectsRoot.trim() === '') {
        console.warn('[projects-registry] No projectsRoot provided');
        return projects;
    }

    // Validate projectsRoot exists and is not BACKUP_ROOT
    const resolvedRoot = path.resolve(projectsRoot);
    const resolvedBackup = path.resolve(BACKUP_ROOT);

    if (resolvedRoot === resolvedBackup || resolvedRoot.startsWith(resolvedBackup + path.sep)) {
        console.error('[projects-registry] Cannot scan BACKUP_ROOT');
        return projects;
    }

    try {
        // Check if projectsRoot exists
        await fs.access(resolvedRoot);

        // Read directory entries
        const entries = await fs.readdir(resolvedRoot, { withFileTypes: true });

        // Scan each directory for project.meta.json
        for (const entry of entries) {
            if (!entry.isDirectory()) continue;

            // Skip hidden directories, _Index, _Archive, _Templates
            if (entry.name.startsWith('.') ||
                entry.name.startsWith('_') ||
                entry.name === 'Archive' ||
                entry.name === 'Templates') {
                continue;
            }

            const projectDir = path.join(resolvedRoot, entry.name);
            const metaPath = path.join(projectDir, 'project.meta.json');

            try {
                // Check if project.meta.json exists
                await fs.access(metaPath);

                // Read and parse metadata
                const metaContent = await fs.readFile(metaPath, 'utf-8');
                const metadata = JSON.parse(metaContent);

                // Extract minimal safe data
                const project = {
                    id: metadata.id || `disk-${Date.now()}-${entry.name}`,
                    name: metadata.name || entry.name,
                    projectPath: projectDir,
                    createdAt: metadata.createdAt || new Date().toISOString(),
                    updatedAt: metadata.updatedAt || metadata.createdAt || new Date().toISOString(),
                    templateId: metadata.templateId,
                    // Sprint 20: Blueprint fields
                    categoryId: metadata.categoryId,
                    blueprintId: metadata.blueprintId,
                    blueprintVersion: metadata.blueprintVersion
                };

                projects.push(project);
            } catch (err) {
                // Sprint 20.1: Fallback to folder-based detection for legacy projects
                if (err.code === 'ENOENT') {
                    const { name: parsedName, categoryPrefix } = parseProjectFolderName(entry.name);

                    const project = {
                        id: `legacy-${entry.name}`,
                        name: parsedName,
                        projectPath: projectDir,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        templateId: null,
                        categoryId: categoryPrefix ? categoryPrefix.replace(/\d+$/, '').toLowerCase() : null,
                        blueprintId: null, // Legacy projects have no blueprint
                        blueprintVersion: null
                    };

                    console.log(`[projects-registry] Legacy project detected: ${entry.name} -> "${parsedName}"`);
                    projects.push(project);
                } else {
                    // Other error (corrupt JSON, etc)
                    console.log(`[projects-registry] Skipping ${entry.name}: ${err.message}`);
                }
                continue;
            }
        }

        console.log(`[projects-registry] Found ${projects.length} projects in ${resolvedRoot}`);
        return projects;

    } catch (err) {
        console.error('[projects-registry] Error scanning projects:', err);
        return projects;
    }
}
