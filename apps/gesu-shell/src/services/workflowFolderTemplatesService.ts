// Workflow Folder Templates Service
// Sprint 21.3 - Blueprint-driven folder generation
// Bridge to Electron or localStorage fallback (same pattern as workflowBlueprintsService)

import { FolderTemplate, FolderTemplatesFileShape } from '../types/workflowBlueprints';

const STORAGE_KEY = 'workflowFolderTemplates';

/**
 * Create seeded default folder templates for common project types
 */
export function createDefaultFolderTemplatesData(): FolderTemplatesFileShape {
    return {
        schemaVersion: 1,
        templates: [
            // Creative templates
            {
                id: 'archviz-standard',
                name: 'ArchViz Standard',
                nameKey: 'initiator:folderTemplates.archvizStandard',
                folders: [
                    '01. References',
                    '02. Working Files',
                    '03. Renders/Preview',
                    '03. Renders/Final',
                    '04. Delivery',
                    '05. Project Docs'
                ]
            },
            {
                id: 'brand-design-standard',
                name: 'Brand Design Standard',
                nameKey: 'initiator:folderTemplates.brandDesignStandard',
                folders: [
                    '01. Brief',
                    '02. Research',
                    '03. Concepts',
                    '04. Final Assets',
                    '05. Delivery'
                ]
            },
            {
                id: 'motion-graphics',
                name: 'Motion Graphics',
                nameKey: 'initiator:folderTemplates.motionGraphics',
                folders: [
                    '01. Assets/Audio',
                    '01. Assets/Video',
                    '01. Assets/Graphics',
                    '02. Project Files',
                    '03. Renders',
                    '04. Export'
                ]
            },
            {
                id: 'uiux-project',
                name: 'UI/UX Project',
                nameKey: 'initiator:folderTemplates.uiuxProject',
                folders: [
                    '01. Research',
                    '02. Wireframes',
                    '03. Hi-Fi Designs',
                    '04. Exports',
                    '05. Dev Handoff'
                ]
            },
            // Development templates
            {
                id: 'web-development',
                name: 'Web Development',
                nameKey: 'initiator:folderTemplates.webDevelopment',
                folders: [
                    'docs',
                    'src',
                    'public',
                    'tests',
                    'dist'
                ]
            },
            {
                id: 'app-development',
                name: 'App Development',
                nameKey: 'initiator:folderTemplates.appDevelopment',
                folders: [
                    'docs',
                    'app',
                    'assets',
                    'tests',
                    'builds'
                ]
            },
            // General templates
            {
                id: 'content-creator',
                name: 'Content Creator',
                nameKey: 'initiator:folderTemplates.contentCreator',
                folders: [
                    '01. Raw Footage',
                    '02. Audio',
                    '03. Graphics',
                    '04. Edits',
                    '05. Thumbnails'
                ]
            },
            {
                id: 'client-project',
                name: 'Client Project',
                nameKey: 'initiator:folderTemplates.clientProject',
                folders: [
                    '00. Admin',
                    '01. Brief',
                    '02. Working',
                    '03. Deliverables',
                    '04. Archive'
                ]
            },
            // Legacy templates (backward compatibility)
            {
                id: 'general-creative',
                name: 'General Creative',
                nameKey: 'initiator:folderTemplates.generalCreative',
                folders: [
                    '01. Brief',
                    '02. Research',
                    '03. Working Files',
                    '04. Deliverables',
                    '05. Project Docs'
                ]
            }
        ],
        updatedAt: new Date().toISOString()
    };
}

/**
 * Check if Electron bridge is available for folder templates
 */
function isDesktopMode(): boolean {
    return typeof window !== 'undefined' &&
        window.gesu?.folderTemplates?.get !== undefined;
}

/**
 * Load folder templates from Electron (file) or localStorage
 */
export async function loadFolderTemplates(): Promise<FolderTemplatesFileShape> {
    if (isDesktopMode()) {
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                const data = await window.gesu!.folderTemplates!.get();
                if (data) {
                    console.log('[folderTemplatesService] Loaded from file');
                    return data as FolderTemplatesFileShape;
                }
                break;
            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : String(err);
                if (errorMsg.includes('No handler registered') && attempt < 2) {
                    console.log(`[folderTemplatesService] IPC not ready, retry ${attempt + 1}/3...`);
                    await new Promise(resolve => setTimeout(resolve, 200));
                    continue;
                }
                console.error('[folderTemplatesService] Failed to load from Electron:', err);
                break;
            }
        }
    }

    // Fallback to localStorage
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const data = JSON.parse(stored);
            console.log('[folderTemplatesService] Loaded from localStorage');
            return data as FolderTemplatesFileShape;
        }
    } catch (err) {
        console.error('[folderTemplatesService] Failed to load from localStorage:', err);
    }

    // Return seeded defaults if nothing found
    console.log('[folderTemplatesService] Using seeded defaults');
    const defaults = createDefaultFolderTemplatesData();
    // Save defaults to localStorage for persistence
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    return defaults;
}

/**
 * Save folder templates to Electron (file) or localStorage
 */
export async function saveFolderTemplates(data: FolderTemplatesFileShape): Promise<{ ok: boolean; error?: string }> {
    const dataToSave = {
        ...data,
        updatedAt: new Date().toISOString()
    };

    if (isDesktopMode()) {
        try {
            const result = await window.gesu!.folderTemplates!.save(dataToSave);
            if (result.ok) {
                console.log('[folderTemplatesService] Saved to file');
                localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
                return { ok: true };
            }
            return result;
        } catch (err) {
            console.error('[folderTemplatesService] Failed to save to Electron:', err);
            return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' };
        }
    }

    // Fallback to localStorage
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
        console.log('[folderTemplatesService] Saved to localStorage');
        return { ok: true };
    } catch (err) {
        console.error('[folderTemplatesService] Failed to save to localStorage:', err);
        return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
}

/**
 * Get a specific folder template by ID
 */
export function getFolderTemplateById(data: FolderTemplatesFileShape, templateId: string): FolderTemplate | undefined {
    return data.templates.find(t => t.id === templateId);
}

/**
 * Create a new folder template
 */
export function createFolderTemplate(data: FolderTemplatesFileShape, template: FolderTemplate): FolderTemplatesFileShape {
    return {
        ...data,
        templates: [...data.templates, template],
        updatedAt: new Date().toISOString()
    };
}

/**
 * Update an existing folder template
 */
export function updateFolderTemplate(data: FolderTemplatesFileShape, templateId: string, updates: Partial<FolderTemplate>): FolderTemplatesFileShape {
    return {
        ...data,
        templates: data.templates.map(t =>
            t.id === templateId ? { ...t, ...updates } : t
        ),
        updatedAt: new Date().toISOString()
    };
}

/**
 * Delete a folder template
 */
export function deleteFolderTemplate(data: FolderTemplatesFileShape, templateId: string): FolderTemplatesFileShape {
    return {
        ...data,
        templates: data.templates.filter(t => t.id !== templateId),
        updatedAt: new Date().toISOString()
    };
}
