import fs from 'node:fs/promises';
import path from 'node:path';
import { assertPathWithin } from './scaffolding.js';

/**
 * Workflow Blueprints Module
 * Sprint 15 - Manages workflow blueprint persistence
 */

const BLUEPRINTS_FILENAME = 'WorkflowBlueprints.json';

/**
 * Get workflow blueprints from file
 * @param {string} workflowRoot - Workflow root directory
 * @returns {Promise<Object|null>} Blueprint data or null if not found
 */
export async function getBlueprints(workflowRoot) {
    try {
        if (!workflowRoot || workflowRoot.trim() === '') {
            console.log('[workflow-blueprints] No workflowRoot configured');
            return null;
        }

        await assertPathWithin(workflowRoot, workflowRoot);

        const blueprintsPath = path.join(workflowRoot, '_Index', BLUEPRINTS_FILENAME);

        await assertPathWithin(workflowRoot, blueprintsPath);

        // Check if file exists
        try {
            await fs.access(blueprintsPath);
        } catch (err) {
            // File doesn't exist yet
            console.log('[workflow-blueprints] No blueprints file found, will use defaults');
            return null;
        }

        const content = await fs.readFile(blueprintsPath, 'utf-8');
        const data = JSON.parse(content);

        console.log('[workflow-blueprints] Loaded blueprints:', {
            categories: data.categories?.length || 0,
            blueprints: data.blueprints?.length || 0
        });

        return data;
    } catch (err) {
        console.error('[workflow-blueprints] Failed to load blueprints:', err);
        return null;
    }
}

/**
 * Save workflow blueprints to file (atomic write)
 * @param {string} workflowRoot - Workflow root directory
 * @param {Object} data - Blueprint data to save
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function saveBlueprints(workflowRoot, data) {
    try {
        if (!workflowRoot || workflowRoot.trim() === '') {
            throw new Error('Workflow root not configured');
        }

        await assertPathWithin(workflowRoot, workflowRoot);

        const indexDir = path.join(workflowRoot, '_Index');
        const blueprintsPath = path.join(indexDir, BLUEPRINTS_FILENAME);
        const tempPath = path.join(indexDir, `${BLUEPRINTS_FILENAME}.tmp`);

        await assertPathWithin(workflowRoot, blueprintsPath);
        await assertPathWithin(workflowRoot, tempPath);

        // Create _Index directory if missing
        try {
            await fs.mkdir(indexDir, { recursive: true });
        } catch (err) {
            // Ignore if already exists
        }

        // Update timestamp
        const dataToSave = {
            ...data,
            updatedAt: new Date().toISOString()
        };

        // Atomic write: write to temp file first, then rename
        const content = JSON.stringify(dataToSave, null, 2);
        await fs.writeFile(tempPath, content, 'utf-8');
        await fs.rename(tempPath, blueprintsPath);

        console.log('[workflow-blueprints] Saved blueprints to:', blueprintsPath);
        return { ok: true };
    } catch (err) {
        console.error('[workflow-blueprints] Failed to save blueprints:', err);
        return { ok: false, error: err.message };
    }
}
