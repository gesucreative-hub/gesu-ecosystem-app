import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Projects Registry Module
 * Scans disk for existing projects by detecting project.meta.json files
 */

const BACKUP_ROOT = String.raw`D:\03. Resources\_Gesu's\Backup\WorkFlowDatabase-ps-stack-v1`;

/**
 * Lists all projects found under projectsRoot by scanning for project.meta.json
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

            // Skip hidden directories and _Index
            if (entry.name.startsWith('.') || entry.name === '_Index') continue;

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
                    templateId: metadata.templateId
                };

                projects.push(project);
            } catch (err) {
                // Skip invalid projects (missing or corrupt meta file)
                console.log(`[projects-registry] Skipping ${entry.name}: ${err.message}`);
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
