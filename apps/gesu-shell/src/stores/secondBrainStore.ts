// Second Brain Store - S8: Inbox + PARA assignment for PERSONAL persona
// Thin slice: quick capture, PARA buckets, export support

// --- Types ---

export type SecondBrainStage = 'inbox' | 'processed' | 'archived';
export type ParaBucket = 'projects' | 'areas' | 'resources' | 'archives' | null;

export interface SecondBrainItem {
    id: string;
    title: string;           // Optional but always present (empty string if none)
    content: string;         // Required
    stage: SecondBrainStage;
    paraBucket: ParaBucket;
    createdAt: string;       // ISO timestamp
    updatedAt: string;
}

interface SecondBrainStoreState {
    schemaVersion: number;
    items: SecondBrainItem[];
}

const STORAGE_KEY = 'gesu-second-brain';
const CURRENT_SCHEMA_VERSION = 1;

// --- Utility ---

function generateId(): string {
    return crypto.randomUUID?.() || `sb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// --- State ---

let state: SecondBrainStoreState | null = null;
const subscribers = new Set<() => void>();

// --- Persistence ---

function isLocalStorageAvailable(): boolean {
    try {
        return typeof window !== 'undefined' && !!window.localStorage;
    } catch {
        return false;
    }
}

function loadState(): SecondBrainStoreState {
    if (!isLocalStorageAvailable()) {
        return { schemaVersion: CURRENT_SCHEMA_VERSION, items: [] };
    }

    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            console.log('[secondBrainStore] No stored items, starting empty');
            return { schemaVersion: CURRENT_SCHEMA_VERSION, items: [] };
        }

        const parsed = JSON.parse(raw) as SecondBrainStoreState;

        if (typeof parsed.schemaVersion !== 'number') {
            console.log('[secondBrainStore] Invalid schema, starting empty');
            return { schemaVersion: CURRENT_SCHEMA_VERSION, items: [] };
        }

        if (parsed.schemaVersion > CURRENT_SCHEMA_VERSION) {
            console.warn('[secondBrainStore] Future schema version detected');
            return parsed;
        }

        // Migration placeholder
        // if (parsed.schemaVersion < 2) { migrateV1ToV2(parsed); }

        return { schemaVersion: CURRENT_SCHEMA_VERSION, items: parsed.items || [] };
    } catch (err) {
        console.error('[secondBrainStore] Failed to load:', err);
        return { schemaVersion: CURRENT_SCHEMA_VERSION, items: [] };
    }
}

function saveState(): void {
    if (!state || !isLocalStorageAvailable()) return;

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        notifySubscribers();
    } catch (err) {
        console.error('[secondBrainStore] Failed to save:', err);
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
            console.error('[secondBrainStore] Subscriber callback error:', err);
        }
    });
}

// --- Initialization ---

function ensureLoaded(): SecondBrainStoreState {
    if (!state) {
        state = loadState();
    }
    return state;
}

// --- Public API ---

export function listItems(filters?: { stage?: SecondBrainStage; paraBucket?: ParaBucket }): SecondBrainItem[] {
    let items = [...ensureLoaded().items];
    
    if (filters?.stage) {
        items = items.filter(i => i.stage === filters.stage);
    }
    if (filters?.paraBucket !== undefined) {
        items = items.filter(i => i.paraBucket === filters.paraBucket);
    }
    
    return items.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export function getItemById(id: string): SecondBrainItem | null {
    return ensureLoaded().items.find(i => i.id === id) || null;
}

export function addItem(data: {
    content: string;
    title?: string;
}): SecondBrainItem {
    if (!data.content.trim()) {
        throw new Error('Content is required');
    }
    
    const current = ensureLoaded();
    const now = new Date().toISOString();
    
    const newItem: SecondBrainItem = {
        id: generateId(),
        title: data.title?.trim() || '',
        content: data.content.trim(),
        stage: 'inbox',
        paraBucket: null,
        createdAt: now,
        updatedAt: now
    };
    
    current.items.unshift(newItem);
    saveState();
    console.log('[secondBrainStore] Added item:', newItem.id);
    return { ...newItem };
}

export function updateItem(id: string, updates: {
    title?: string;
    content?: string;
    stage?: SecondBrainStage;
    paraBucket?: ParaBucket;
}): SecondBrainItem | null {
    const current = ensureLoaded();
    const item = current.items.find(i => i.id === id);
    if (!item) return null;
    
    if (updates.title !== undefined) item.title = updates.title.trim();
    if (updates.content !== undefined) item.content = updates.content.trim();
    if (updates.stage !== undefined) item.stage = updates.stage;
    if (updates.paraBucket !== undefined) item.paraBucket = updates.paraBucket;
    
    item.updatedAt = new Date().toISOString();
    
    saveState();
    console.log('[secondBrainStore] Updated item:', id);
    return { ...item };
}

export function deleteItem(id: string): boolean {
    const current = ensureLoaded();
    const index = current.items.findIndex(i => i.id === id);
    if (index === -1) return false;
    
    current.items.splice(index, 1);
    saveState();
    console.log('[secondBrainStore] Deleted item:', id);
    return true;
}

export function assignParaBucket(id: string, bucket: ParaBucket): SecondBrainItem | null {
    return updateItem(id, { paraBucket: bucket, stage: bucket ? 'processed' : 'inbox' });
}

export function getItemCount(): number {
    return ensureLoaded().items.length;
}

export function getInboxCount(): number {
    return ensureLoaded().items.filter(i => i.stage === 'inbox').length;
}

// --- Export ---

export function exportToMarkdown(): string {
    const items = ensureLoaded().items;
    const buckets: Record<string, SecondBrainItem[]> = {
        projects: [],
        areas: [],
        resources: [],
        archives: [],
        inbox: []
    };
    
    items.forEach(item => {
        if (item.paraBucket) {
            buckets[item.paraBucket].push(item);
        } else {
            buckets.inbox.push(item);
        }
    });
    
    let md = '# Second Brain Export\n\n';
    md += `_Exported: ${new Date().toLocaleString()}_\n\n`;
    
    const sections = [
        { key: 'projects', label: '## Projects' },
        { key: 'areas', label: '## Areas' },
        { key: 'resources', label: '## Resources' },
        { key: 'archives', label: '## Archives' },
        { key: 'inbox', label: '## Inbox (Unprocessed)' }
    ];
    
    sections.forEach(({ key, label }) => {
        const sectionItems = buckets[key];
        if (sectionItems.length > 0) {
            md += `${label}\n\n`;
            sectionItems.forEach(item => {
                if (item.title) {
                    md += `### ${item.title}\n\n`;
                }
                md += `${item.content}\n\n`;
                md += `_Created: ${new Date(item.createdAt).toLocaleDateString()}_\n\n---\n\n`;
            });
        }
    });
    
    return md;
}

export function exportToJson(): string {
    const items = ensureLoaded().items;
    return JSON.stringify({ exportedAt: new Date().toISOString(), items }, null, 2);
}

// --- Dev Helper ---

if (import.meta.env?.DEV && typeof window !== 'undefined') {
    (window as any).__gesuSecondBrain = {
        listItems,
        getItemById,
        addItem,
        updateItem,
        deleteItem,
        assignParaBucket,
        getItemCount,
        getInboxCount,
        exportToMarkdown,
        exportToJson
    };
}
