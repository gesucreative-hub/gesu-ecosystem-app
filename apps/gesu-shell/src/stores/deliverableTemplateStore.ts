// Deliverable Template Store - Manages reusable deliverable templates for BUSINESS workspace
// S7-B: Template CRUD with persistence
// Templates contain items that can be instantiated as deliverable packs per project

import { getUserStorageKey } from '../utils/getUserStorageKey';

// --- Types ---

export interface DeliverableTemplateItem {
    id: string;
    title: string;
    description: string;
}

export interface DeliverableTemplate {
    id: string;
    name: string;
    description: string;
    items: DeliverableTemplateItem[];
    createdAt: string;
    updatedAt: string;
}

interface DeliverableTemplateStoreState {
    schemaVersion: number;
    templates: DeliverableTemplate[];
}

const BASE_STORAGE_KEY = 'gesu-deliverable-templates';
const CURRENT_SCHEMA_VERSION = 1;

// Get user-scoped storage key
const getStorageKey = () => getUserStorageKey(BASE_STORAGE_KEY);

// --- Utility ---

function generateId(): string {
    return crypto.randomUUID?.() || `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function generateItemId(): string {
    return `tpli-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

// --- State ---

let state: DeliverableTemplateStoreState | null = null;
const subscribers = new Set<() => void>();

// --- Persistence ---

function isLocalStorageAvailable(): boolean {
    try {
        return typeof window !== 'undefined' && !!window.localStorage;
    } catch {
        return false;
    }
}

function loadState(): DeliverableTemplateStoreState {
    if (!isLocalStorageAvailable()) {
        return { schemaVersion: CURRENT_SCHEMA_VERSION, templates: [] };
    }

    try {
        const raw = localStorage.getItem(getStorageKey());
        if (!raw) {
            console.log('[deliverableTemplateStore] No stored templates, starting empty');
            return { schemaVersion: CURRENT_SCHEMA_VERSION, templates: [] };
        }

        const parsed = JSON.parse(raw) as DeliverableTemplateStoreState;

        if (typeof parsed.schemaVersion !== 'number') {
            console.log('[deliverableTemplateStore] Invalid schema, starting empty');
            return { schemaVersion: CURRENT_SCHEMA_VERSION, templates: [] };
        }

        if (parsed.schemaVersion > CURRENT_SCHEMA_VERSION) {
            console.warn('[deliverableTemplateStore] Future schema version detected');
            return parsed;
        }

        // Migration placeholder for future versions
        // if (parsed.schemaVersion < 2) { migrateV1ToV2(parsed); }

        return { schemaVersion: CURRENT_SCHEMA_VERSION, templates: parsed.templates || [] };
    } catch (err) {
        console.error('[deliverableTemplateStore] Failed to load:', err);
        return { schemaVersion: CURRENT_SCHEMA_VERSION, templates: [] };
    }
}

function saveState(): void {
    if (!state || !isLocalStorageAvailable()) return;

    try {
        localStorage.setItem(getStorageKey(), JSON.stringify(state));
        notifySubscribers();
    } catch (err) {
        console.error('[deliverableTemplateStore] Failed to save:', err);
    }
}

// --- Subscription ---

export function subscribe(callback: () => void): () => void {
    subscribers.add(callback);
    return () => subscribers.delete(callback);
}

function notifySubscribers(): void {
    subscribers.forEach(cb => {
        try {
            cb();
        } catch (err) {
            console.error('[deliverableTemplateStore] Subscriber callback error:', err);
        }
    });
}

// --- Initialization ---

function ensureLoaded(): DeliverableTemplateStoreState {
    if (!state) {
        state = loadState();
    }
    return state;
}

// --- Public API ---

export function listTemplates(): DeliverableTemplate[] {
    return [...ensureLoaded().templates].sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
}

export function getTemplateById(id: string): DeliverableTemplate | null {
    return ensureLoaded().templates.find(t => t.id === id) || null;
}

export function searchTemplates(query: string): DeliverableTemplate[] {
    const q = query.toLowerCase().trim();
    if (!q) return listTemplates();
    return ensureLoaded().templates.filter(t =>
        t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
    );
}

export function createTemplate(data: {
    name: string;
    description?: string;
    items?: { title: string; description?: string }[];
}): DeliverableTemplate {
    const current = ensureLoaded();
    const now = new Date().toISOString();
    
    const newTemplate: DeliverableTemplate = {
        id: generateId(),
        name: data.name,
        description: data.description || '',
        items: (data.items || []).map(item => ({
            id: generateItemId(),
            title: item.title,
            description: item.description || ''
        })),
        createdAt: now,
        updatedAt: now
    };
    
    current.templates.push(newTemplate);
    saveState();
    console.log('[deliverableTemplateStore] Created template:', newTemplate.id, newTemplate.name);
    return { ...newTemplate };
}

export function updateTemplate(id: string, updates: {
    name?: string;
    description?: string;
    items?: { id?: string; title: string; description?: string }[];
}): DeliverableTemplate | null {
    const current = ensureLoaded();
    const template = current.templates.find(t => t.id === id);
    if (!template) {
        console.warn('[deliverableTemplateStore] Template not found:', id);
        return null;
    }
    
    if (updates.name !== undefined) template.name = updates.name;
    if (updates.description !== undefined) template.description = updates.description;
    if (updates.items !== undefined) {
        template.items = updates.items.map(item => ({
            id: item.id || generateItemId(),
            title: item.title,
            description: item.description || ''
        }));
    }
    
    template.updatedAt = new Date().toISOString();
    
    saveState();
    console.log('[deliverableTemplateStore] Updated template:', id);
    return { ...template };
}

export function deleteTemplate(id: string): boolean {
    const current = ensureLoaded();
    const index = current.templates.findIndex(t => t.id === id);
    if (index === -1) return false;
    
    current.templates.splice(index, 1);
    saveState();
    console.log('[deliverableTemplateStore] Deleted template:', id);
    return true;
}

export function getTemplateCount(): number {
    return ensureLoaded().templates.length;
}

// --- Dev Helper ---

if (import.meta.env?.DEV && typeof window !== 'undefined') {
    (window as any).__gesuDeliverableTemplates = {
        listTemplates,
        getTemplateById,
        searchTemplates,
        createTemplate,
        updateTemplate,
        deleteTemplate,
        getTemplateCount
    };
}
