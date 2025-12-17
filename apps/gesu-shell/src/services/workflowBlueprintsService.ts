// Workflow Blueprints Service
// Sprint 15 - Bridge to Electron or localStorage fallback

import { BlueprintFileShape, WorkflowBlueprint, BlueprintNode, DEFAULT_CATEGORY_ID, DEFAULT_BLUEPRINT_ID } from '../types/workflowBlueprints';
import { WORKFLOW_NODES } from '../pages/workflowData';

const STORAGE_KEY = 'workflowBlueprints';

/**
 * Create seeded default blueprints from existing WORKFLOW_NODES
 */
export function createDefaultBlueprintData(): BlueprintFileShape {
    // Map existing WORKFLOW_NODES to BlueprintNode format
    const nodes: BlueprintNode[] = WORKFLOW_NODES.map(node => ({
        id: node.id,
        phaseId: node.phase,
        title: node.title,
        description: node.description,
        dod: node.dodChecklist.map(item => item.label),
        tools: node.tools || []
    }));

    return {
        schemaVersion: 1,
        categories: [
            {
                id: DEFAULT_CATEGORY_ID,
                name: 'General Creative',
                defaultBlueprintId: DEFAULT_BLUEPRINT_ID
            }
        ],
        blueprints: [
            {
                id: DEFAULT_BLUEPRINT_ID,
                name: 'Default Workflow',
                categoryId: DEFAULT_CATEGORY_ID,
                version: 1,
                nodes
            }
        ],
        updatedAt: new Date().toISOString()
    };
}

/**
 * Check if Electron bridge is available and workflowRoot is configured
 */
function isDesktopMode(): boolean {
    return typeof window !== 'undefined' &&
        window.gesu?.workflowBlueprints?.get !== undefined;
}

/**
 * Load blueprints from Electron (file) or localStorage
 * Includes retry mechanism for race condition handling
 */
export async function loadBlueprints(): Promise<BlueprintFileShape> {
    if (isDesktopMode()) {
        // Retry up to 3 times with 200ms delay to handle IPC race condition
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                const data = await window.gesu!.workflowBlueprints!.get();
                if (data) {
                    console.log('[workflowBlueprintsService] Loaded from file');
                    return data as BlueprintFileShape;
                }
                break; // No data but no error - use defaults
            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : String(err);
                if (errorMsg.includes('No handler registered') && attempt < 2) {
                    console.log(`[workflowBlueprintsService] IPC not ready, retry ${attempt + 1}/3...`);
                    await new Promise(resolve => setTimeout(resolve, 200));
                    continue;
                }
                console.error('[workflowBlueprintsService] Failed to load from Electron:', err);
                break;
            }
        }
    }

    // Fallback to localStorage
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const data = JSON.parse(stored);
            console.log('[workflowBlueprintsService] Loaded from localStorage');
            return data as BlueprintFileShape;
        }
    } catch (err) {
        console.error('[workflowBlueprintsService] Failed to load from localStorage:', err);
    }

    // Return seeded defaults if nothing found
    console.log('[workflowBlueprintsService] Using seeded defaults');
    return createDefaultBlueprintData();
}

/**
 * Save blueprints to Electron (file) or localStorage
 */
export async function saveBlueprints(data: BlueprintFileShape): Promise<{ ok: boolean; error?: string }> {
    const dataToSave = {
        ...data,
        updatedAt: new Date().toISOString()
    };

    if (isDesktopMode()) {
        try {
            const result = await window.gesu!.workflowBlueprints!.save(dataToSave);
            if (result.ok) {
                console.log('[workflowBlueprintsService] Saved to file');
                // Also save to localStorage as backup
                localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
                return { ok: true };
            }
            return result;
        } catch (err) {
            console.error('[workflowBlueprintsService] Failed to save to Electron:', err);
            return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' };
        }
    }

    // Fallback to localStorage
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
        console.log('[workflowBlueprintsService] Saved to localStorage');
        return { ok: true };
    } catch (err) {
        console.error('[workflowBlueprintsService] Failed to save to localStorage:', err);
        return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
}

/**
 * Get a specific blueprint by ID
 */
export function getBlueprintById(data: BlueprintFileShape, blueprintId: string): WorkflowBlueprint | undefined {
    return data.blueprints.find(b => b.id === blueprintId);
}

/**
 * Get the default blueprint for a category
 */
export function getDefaultBlueprintForCategory(data: BlueprintFileShape, categoryId: string): WorkflowBlueprint | undefined {
    const category = data.categories.find(c => c.id === categoryId);
    if (!category) return undefined;
    return data.blueprints.find(b => b.id === category.defaultBlueprintId);
}
