// Template Preferences Service
// Manages user preferences for hiding unwanted templates

const STORAGE_KEY = 'hiddenTemplates';

/**
 * Get list of hidden template IDs
 */
export function getHiddenTemplates(): string[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (err) {
        console.error('[templatePreferencesService] Failed to load hidden templates:', err);
        return [];
    }
}

/**
 * Hide a template from the picker
 */
export function hideTemplate(templateId: string): void {
    try {
        const hidden = getHiddenTemplates();
        if (!hidden.includes(templateId)) {
            hidden.push(templateId);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(hidden));
        }
    } catch (err) {
        console.error('[templatePreferencesService] Failed to hide template:', err);
    }
}

/**
 * Restore a hidden template
 */
export function unhideTemplate(templateId: string): void {
    try {
        const hidden = getHiddenTemplates();
        const filtered = hidden.filter(id => id !== templateId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (err) {
        console.error('[templatePreferencesService] Failed to unhide template:', err);
    }
}

/**
 * Clear all hidden templates
 */
export function clearHiddenTemplates(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
        console.error('[templatePreferencesService] Failed to clear hidden templates:', err);
    }
}
