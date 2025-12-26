// Workflow Blueprints Service
// Sprint 15 - Bridge to Electron or localStorage fallback

import { BlueprintFileShape, WorkflowBlueprint, BlueprintNode, DEFAULT_CATEGORY_ID, DEFAULT_BLUEPRINT_ID } from '../types/workflowBlueprints';
import { WORKFLOW_NODES } from '../pages/workflowData';

// In-memory cache to prevent race conditions between tabs
let memoryCache: BlueprintFileShape | null = null;

/**
 * Prune orphaned blueprints (those with invalid categoryId)
 * and remove duplicates by name (keep first occurrence)
 */
function cleanBlueprintData(data: any): BlueprintFileShape {
    if (!data || !data.categories || !data.blueprints) return data;

    const validCategoryIds = new Set(data.categories.map((c: any) => c.id));

    // Filter orphans AND remove duplicates by name (keep first occurrence)
    const seenNames = new Set<string>();
    const cleanBlueprints = data.blueprints.filter((b: any) => {
        // Skip orphaned blueprints
        if (!validCategoryIds.has(b.categoryId)) return false;

        // Skip duplicates by name (case-insensitive)
        const lowerName = b.name.toLowerCase();
        if (seenNames.has(lowerName)) {
            console.log(`[workflowBlueprintsService] Removing duplicate blueprint: ${b.name} (id: ${b.id})`);
            return false;
        }
        seenNames.add(lowerName);
        return true;
    });

    if (cleanBlueprints.length < data.blueprints.length) {
        console.log(`[workflowBlueprintsService] Pruned ${data.blueprints.length - cleanBlueprints.length} orphaned/duplicate blueprints`);
        return { ...data, blueprints: cleanBlueprints };
    }
    return data;
}

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
                name: 'Default',
                defaultBlueprintId: DEFAULT_BLUEPRINT_ID
            }
        ],
        blueprints: [
            {
                id: DEFAULT_BLUEPRINT_ID,
                name: 'Default',
                categoryId: DEFAULT_CATEGORY_ID,
                version: 1,
                nodes,
                phases: [
                    { id: 'planning', label: 'Planning', color: '#6366f1' },
                    { id: 'execution', label: 'Execution', color: '#06b6d4' },
                    { id: 'finalize', label: 'Finalize', color: '#10b981' },
                ]
            }
        ],
        updatedAt: new Date().toISOString()
    };
}

/**
 * Migrate old default blueprint to new simplified structure
 */
function migrateDefaultBlueprint(data: BlueprintFileShape): BlueprintFileShape {
    // Find default blueprint
    const defaultBlueprint = data.blueprints.find(b => b.id === DEFAULT_BLUEPRINT_ID);
    if (!defaultBlueprint) return data;

    // Check if already updated (has new phases)
    if (defaultBlueprint.phases?.length === 3 &&
        defaultBlueprint.phases.some(p => p.id === 'execution')) {
        return data; // Already migrated
    }

    console.log('[workflowBlueprintsService] Migrating default blueprint to new structure');

    // Get fresh nodes from WORKFLOW_NODES
    const newNodes: BlueprintNode[] = WORKFLOW_NODES.map(node => ({
        id: node.id,
        phaseId: node.phase,
        title: node.title,
        description: node.description,
        dod: node.dodChecklist.map(item => item.label),
        tools: node.tools || []
    }));

    // Update category name if still old
    const updatedCategories = data.categories.map(c =>
        c.id === DEFAULT_CATEGORY_ID && c.name === 'General Creative'
            ? { ...c, name: 'Default' }
            : c
    );

    // Update default blueprint with new structure
    const updatedBlueprints = data.blueprints.map(b =>
        b.id === DEFAULT_BLUEPRINT_ID
            ? {
                ...b,
                name: 'Default',
                nodes: newNodes,
                version: b.version + 1,
                phases: [
                    { id: 'planning', label: 'Planning', color: '#6366f1' },
                    { id: 'execution', label: 'Execution', color: '#06b6d4' },
                    { id: 'finalize', label: 'Finalize', color: '#10b981' },
                ]
            }
            : b
    );

    return {
        ...data,
        categories: updatedCategories,
        blueprints: updatedBlueprints
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
    // Return cache if available (ensures immediate consistency across tabs)
    if (memoryCache) return memoryCache;

    if (isDesktopMode()) {
        // Retry up to 3 times with 200ms delay to handle IPC race condition
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                const data = await window.gesu!.workflowBlueprints!.get();
                if (data) {
                    console.log('[workflowBlueprintsService] Loaded from file');
                    const cleanedData = cleanBlueprintData(data as BlueprintFileShape);
                    memoryCache = migrateDefaultBlueprint(cleanedData);
                    // Save migrated data back
                    if (memoryCache !== cleanedData) {
                        await saveBlueprints(memoryCache);
                    }
                    return memoryCache;
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
            const cleanedData = cleanBlueprintData(data as BlueprintFileShape);
            memoryCache = migrateDefaultBlueprint(cleanedData);
            // Save migrated data back
            if (memoryCache !== cleanedData) {
                await saveBlueprints(memoryCache);
            }
            return memoryCache;
        }
    } catch (err) {
        console.error('[workflowBlueprintsService] Failed to load from localStorage:', err);
    }

    // Return seeded defaults if nothing found
    console.log('[workflowBlueprintsService] Using seeded defaults');
    memoryCache = createDefaultBlueprintData();
    return memoryCache;
}

/**
 * Save blueprints to Electron (file) or localStorage
 */
export async function saveBlueprints(data: BlueprintFileShape): Promise<{ ok: boolean; error?: string }> {
    // Update cache immediately
    memoryCache = data;

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
