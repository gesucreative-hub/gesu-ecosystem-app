// Project Counter Service
// Tracks project counts per blueprint for folder naming convention
// Storage: localStorage now, migrateable to database later

export interface ProjectCounterData {
    countsByBlueprint: Record<string, number>;  // blueprintId -> count
    lastUpdated: string;
}

const STORAGE_KEY = 'gesu_project_counters';

// Load counter data from storage
export function loadProjectCounters(): ProjectCounterData {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error('[ProjectCounter] Failed to load counters:', e);
    }
    return { countsByBlueprint: {}, lastUpdated: new Date().toISOString() };
}

// Save counter data to storage
export function saveProjectCounters(data: ProjectCounterData): void {
    try {
        data.lastUpdated = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.error('[ProjectCounter] Failed to save counters:', e);
    }
}

// Get current count for a blueprint (without incrementing)
export function getBlueprintCount(blueprintId: string): number {
    const data = loadProjectCounters();
    return data.countsByBlueprint[blueprintId] || 0;
}

// Increment and return new count for a blueprint
export function incrementBlueprintCount(blueprintId: string): number {
    const data = loadProjectCounters();
    const currentCount = data.countsByBlueprint[blueprintId] || 0;
    const newCount = currentCount + 1;
    data.countsByBlueprint[blueprintId] = newCount;
    saveProjectCounters(data);
    return newCount;
}

// Get next count (what will be used) without incrementing
export function getNextBlueprintCount(blueprintId: string): number {
    return getBlueprintCount(blueprintId) + 1;
}

// Generate folder name according to convention:
// (YYYYMMDD)_(Blueprint000)_(Client if exist)_(Project Name)
export function generateFolderName(
    projectName: string,
    blueprintName: string,
    blueprintCount: number,
    clientName?: string
): string {
    // YYYYMMDD
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;

    // Blueprint slug (letters only) + 000 counter
    const blueprintSlug = blueprintName.replace(/[^a-zA-Z]/g, '');
    const counterStr = blueprintCount.toString().padStart(3, '0');
    const blueprintPart = `${blueprintSlug}${counterStr}`;

    // Build parts array
    const parts = [dateStr, blueprintPart];

    // Add client if exists and not empty
    if (clientName && clientName.trim()) {
        parts.push(clientName.trim());
    }

    // Add project name
    parts.push(projectName.trim());

    return parts.join('_');
}

// Check if a similar folder might already exist (warning only)
export function checkFolderConflict(
    blueprintId: string
): { hasConflict: boolean; existingCount: number } {
    const data = loadProjectCounters();
    const count = data.countsByBlueprint[blueprintId] || 0;

    // We can't truly check filesystem from browser, but we can warn if 
    // creating multiple projects with same blueprint on same day
    return {
        hasConflict: count > 0,
        existingCount: count
    };
}
