// Deliverable Pack Store - Manages per-project deliverable instances for BUSINESS workspace
// S7-B: Pack instances created from templates with item status tracking
// Each pack contains items with todo/done status and file links

import { getTemplateById } from './deliverableTemplateStore';

// --- Types ---

export type DeliverableItemStatus = 'todo' | 'done';

export interface DeliverablePackItem {
    id: string;
    title: string;
    description: string;
    status: DeliverableItemStatus;
    fileLinks: string[];
    notes: string;
}

export interface DeliverablePack {
    id: string;
    projectId: string;
    templateId: string | null;  // null if created custom
    name: string;
    items: DeliverablePackItem[];
    createdAt: string;
    updatedAt: string;
}

interface DeliverablePackStoreState {
    schemaVersion: number;
    packs: DeliverablePack[];
}

const STORAGE_KEY = 'gesu-deliverable-packs';
const CURRENT_SCHEMA_VERSION = 1;

// --- Utility ---

function generateId(): string {
    return crypto.randomUUID?.() || `pack-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function generateItemId(): string {
    return `pki-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

// --- State ---

let state: DeliverablePackStoreState | null = null;
const subscribers = new Set<() => void>();

// --- Persistence ---

function isLocalStorageAvailable(): boolean {
    try {
        return typeof window !== 'undefined' && !!window.localStorage;
    } catch {
        return false;
    }
}

function loadState(): DeliverablePackStoreState {
    if (!isLocalStorageAvailable()) {
        return { schemaVersion: CURRENT_SCHEMA_VERSION, packs: [] };
    }

    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            console.log('[deliverablePackStore] No stored packs, starting empty');
            return { schemaVersion: CURRENT_SCHEMA_VERSION, packs: [] };
        }

        const parsed = JSON.parse(raw) as DeliverablePackStoreState;

        if (typeof parsed.schemaVersion !== 'number') {
            console.log('[deliverablePackStore] Invalid schema, starting empty');
            return { schemaVersion: CURRENT_SCHEMA_VERSION, packs: [] };
        }

        if (parsed.schemaVersion > CURRENT_SCHEMA_VERSION) {
            console.warn('[deliverablePackStore] Future schema version detected');
            return parsed;
        }

        return { schemaVersion: CURRENT_SCHEMA_VERSION, packs: parsed.packs || [] };
    } catch (err) {
        console.error('[deliverablePackStore] Failed to load:', err);
        return { schemaVersion: CURRENT_SCHEMA_VERSION, packs: [] };
    }
}

function saveState(): void {
    if (!state || !isLocalStorageAvailable()) return;

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        notifySubscribers();
    } catch (err) {
        console.error('[deliverablePackStore] Failed to save:', err);
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
            console.error('[deliverablePackStore] Subscriber callback error:', err);
        }
    });
}

// --- Initialization ---

function ensureLoaded(): DeliverablePackStoreState {
    if (!state) {
        state = loadState();
    }
    return state;
}

// --- Public API ---

export function listAllPacks(): DeliverablePack[] {
    return [...ensureLoaded().packs].sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
}

export function listPacksByProjectId(projectId: string): DeliverablePack[] {
    return ensureLoaded().packs
        .filter(p => p.projectId === projectId)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function getPackById(id: string): DeliverablePack | null {
    return ensureLoaded().packs.find(p => p.id === id) || null;
}

/**
 * Create a pack from a template. Items are copied from the template.
 */
export function createPackFromTemplate(projectId: string, templateId: string, name?: string): DeliverablePack | null {
    const template = getTemplateById(templateId);
    if (!template) {
        console.warn('[deliverablePackStore] Template not found:', templateId);
        return null;
    }

    const current = ensureLoaded();
    const now = new Date().toISOString();
    
    const newPack: DeliverablePack = {
        id: generateId(),
        projectId,
        templateId,
        name: name || template.name,
        items: template.items.map(item => ({
            id: generateItemId(),
            title: item.title,
            description: item.description,
            status: 'todo',
            fileLinks: [],
            notes: ''
        })),
        createdAt: now,
        updatedAt: now
    };
    
    current.packs.push(newPack);
    saveState();
    console.log('[deliverablePackStore] Created pack from template:', newPack.id, templateId);
    return { ...newPack };
}

/**
 * Create a custom pack (no template).
 */
export function createCustomPack(projectId: string, name: string, items?: { title: string; description?: string }[]): DeliverablePack {
    const current = ensureLoaded();
    const now = new Date().toISOString();
    
    const newPack: DeliverablePack = {
        id: generateId(),
        projectId,
        templateId: null,
        name,
        items: (items || []).map(item => ({
            id: generateItemId(),
            title: item.title,
            description: item.description || '',
            status: 'todo',
            fileLinks: [],
            notes: ''
        })),
        createdAt: now,
        updatedAt: now
    };
    
    current.packs.push(newPack);
    saveState();
    console.log('[deliverablePackStore] Created custom pack:', newPack.id);
    return { ...newPack };
}

/**
 * Update pack metadata (name).
 */
export function updatePack(id: string, updates: { name?: string }): DeliverablePack | null {
    const current = ensureLoaded();
    const pack = current.packs.find(p => p.id === id);
    if (!pack) return null;
    
    if (updates.name !== undefined) pack.name = updates.name;
    pack.updatedAt = new Date().toISOString();
    
    saveState();
    return { ...pack };
}

/**
 * Add a new item to a pack.
 */
export function addItemToPack(packId: string, item: { title: string; description?: string }): DeliverablePackItem | null {
    const current = ensureLoaded();
    const pack = current.packs.find(p => p.id === packId);
    if (!pack) return null;
    
    const newItem: DeliverablePackItem = {
        id: generateItemId(),
        title: item.title,
        description: item.description || '',
        status: 'todo',
        fileLinks: [],
        notes: ''
    };
    
    pack.items.push(newItem);
    pack.updatedAt = new Date().toISOString();
    saveState();
    return { ...newItem };
}

/**
 * Update an item in a pack (status, fileLinks, notes).
 */
export function updatePackItem(packId: string, itemId: string, updates: {
    title?: string;
    description?: string;
    status?: DeliverableItemStatus;
    fileLinks?: string[];
    notes?: string;
}): DeliverablePackItem | null {
    const current = ensureLoaded();
    const pack = current.packs.find(p => p.id === packId);
    if (!pack) return null;
    
    const item = pack.items.find(i => i.id === itemId);
    if (!item) return null;
    
    if (updates.title !== undefined) item.title = updates.title;
    if (updates.description !== undefined) item.description = updates.description;
    if (updates.status !== undefined) item.status = updates.status;
    if (updates.fileLinks !== undefined) item.fileLinks = updates.fileLinks;
    if (updates.notes !== undefined) item.notes = updates.notes;
    
    pack.updatedAt = new Date().toISOString();
    saveState();
    return { ...item };
}

/**
 * Remove an item from a pack.
 */
export function removePackItem(packId: string, itemId: string): boolean {
    const current = ensureLoaded();
    const pack = current.packs.find(p => p.id === packId);
    if (!pack) return false;
    
    const index = pack.items.findIndex(i => i.id === itemId);
    if (index === -1) return false;
    
    pack.items.splice(index, 1);
    pack.updatedAt = new Date().toISOString();
    saveState();
    return true;
}

/**
 * Delete an entire pack.
 */
export function deletePack(id: string): boolean {
    const current = ensureLoaded();
    const index = current.packs.findIndex(p => p.id === id);
    if (index === -1) return false;
    
    current.packs.splice(index, 1);
    saveState();
    console.log('[deliverablePackStore] Deleted pack:', id);
    return true;
}

/**
 * Toggle item status between todo and done.
 */
export function toggleItemStatus(packId: string, itemId: string): DeliverablePackItem | null {
    const current = ensureLoaded();
    const pack = current.packs.find(p => p.id === packId);
    if (!pack) return null;
    
    const item = pack.items.find(i => i.id === itemId);
    if (!item) return null;
    
    item.status = item.status === 'todo' ? 'done' : 'todo';
    pack.updatedAt = new Date().toISOString();
    saveState();
    return { ...item };
}

/**
 * Get pack completion stats.
 */
export function getPackStats(packId: string): { total: number; done: number; percent: number } | null {
    const pack = getPackById(packId);
    if (!pack) return null;
    
    const total = pack.items.length;
    const done = pack.items.filter(i => i.status === 'done').length;
    return { total, done, percent: total > 0 ? Math.round((done / total) * 100) : 0 };
}

// --- Dev Helper ---

if (import.meta.env?.DEV && typeof window !== 'undefined') {
    (window as any).__gesuDeliverablePacks = {
        listAllPacks,
        listPacksByProjectId,
        getPackById,
        createPackFromTemplate,
        createCustomPack,
        updatePack,
        addItemToPack,
        updatePackItem,
        removePackItem,
        deletePack,
        toggleItemStatus,
        getPackStats
    };
}
