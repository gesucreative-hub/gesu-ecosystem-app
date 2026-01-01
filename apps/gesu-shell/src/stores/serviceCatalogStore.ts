// Service Catalog Store - Pricelist items for BUSINESS workspace
// S6-A: CRUD + search + category filter (snapshot values, not references)

export interface ServiceCatalogItem {
    id: string;
    name: string;               // e.g., "Desain Merek"
    description: string;        // e.g., "Logo design and brand guidelines"
    unit: 'item' | 'jam' | 'hari' | 'paket';  // unit type
    unitPrice: number;          // price per unit in IDR
    category: string;           // e.g., "Desain", "Media", "Konsultasi"
    createdAt: string;          // ISO timestamp
    updatedAt: string;
}

interface ServiceCatalogStoreState {
    schemaVersion: number;
    items: ServiceCatalogItem[];
}

const STORAGE_KEY = 'gesu-service-catalog';
const CURRENT_SCHEMA_VERSION = 1;

// --- Utility ---

function generateId(): string {
    return crypto.randomUUID?.() || `svc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// --- State ---

let state: ServiceCatalogStoreState | null = null;
const subscribers = new Set<() => void>();

// --- Persistence ---

function isLocalStorageAvailable(): boolean {
    try {
        return typeof window !== 'undefined' && !!window.localStorage;
    } catch {
        return false;
    }
}

function loadState(): ServiceCatalogStoreState {
    if (!isLocalStorageAvailable()) {
        return { schemaVersion: CURRENT_SCHEMA_VERSION, items: [] };
    }

    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            console.log('[serviceCatalogStore] No stored items, starting empty');
            return { schemaVersion: CURRENT_SCHEMA_VERSION, items: [] };
        }

        const parsed = JSON.parse(raw) as ServiceCatalogStoreState;

        // Version check
        if (typeof parsed.schemaVersion !== 'number') {
            console.log('[serviceCatalogStore] Invalid schema, starting empty');
            return { schemaVersion: CURRENT_SCHEMA_VERSION, items: [] };
        }

        if (parsed.schemaVersion > CURRENT_SCHEMA_VERSION) {
            console.warn('[serviceCatalogStore] Future schema version detected, loading as-is');
            return parsed;
        }

        // Migration placeholder for future versions
        // if (parsed.schemaVersion < 2) { migrateV1ToV2(parsed); }

        return { schemaVersion: CURRENT_SCHEMA_VERSION, items: parsed.items || [] };
    } catch (err) {
        console.error('[serviceCatalogStore] Failed to load:', err);
        return { schemaVersion: CURRENT_SCHEMA_VERSION, items: [] };
    }
}

function saveState(): void {
    if (!state || !isLocalStorageAvailable()) return;

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        notifySubscribers();
    } catch (err) {
        console.error('[serviceCatalogStore] Failed to save:', err);
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
            console.error('[serviceCatalogStore] Subscriber callback error:', err);
        }
    });
}

// --- Initialization ---

function ensureLoaded(): ServiceCatalogStoreState {
    if (!state) {
        state = loadState();
    }
    return state;
}

// --- Public API ---

export function listItems(): ServiceCatalogItem[] {
    return [...ensureLoaded().items].sort((a, b) => 
        a.name.localeCompare(b.name)
    );
}

export function getItemById(id: string): ServiceCatalogItem | null {
    return ensureLoaded().items.find(i => i.id === id) || null;
}

export function searchItems(query: string): ServiceCatalogItem[] {
    const q = query.toLowerCase().trim();
    if (!q) return listItems();
    
    return ensureLoaded().items.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q)
    );
}

export function getItemsByCategory(category: string): ServiceCatalogItem[] {
    const cat = category.toLowerCase().trim();
    return ensureLoaded().items.filter(i => 
        i.category.toLowerCase() === cat
    );
}

export function getCategories(): string[] {
    const cats = new Set<string>();
    ensureLoaded().items.forEach(i => {
        if (i.category) cats.add(i.category);
    });
    return [...cats].sort();
}

export function createItem(data: Omit<ServiceCatalogItem, 'id' | 'createdAt' | 'updatedAt'>): ServiceCatalogItem {
    const current = ensureLoaded();
    const now = new Date().toISOString();
    
    const newItem: ServiceCatalogItem = {
        ...data,
        id: generateId(),
        createdAt: now,
        updatedAt: now
    };
    
    current.items.push(newItem);
    saveState();
    console.log('[serviceCatalogStore] Created item:', newItem.id, newItem.name);
    return newItem;
}

export function updateItem(id: string, updates: Partial<Omit<ServiceCatalogItem, 'id' | 'createdAt'>>): ServiceCatalogItem | null {
    const current = ensureLoaded();
    const item = current.items.find(i => i.id === id);
    if (!item) return null;
    
    Object.assign(item, updates, { updatedAt: new Date().toISOString() });
    saveState();
    console.log('[serviceCatalogStore] Updated item:', id);
    return { ...item };
}

export function deleteItem(id: string): boolean {
    const current = ensureLoaded();
    const index = current.items.findIndex(i => i.id === id);
    if (index === -1) return false;
    
    const deleted = current.items.splice(index, 1)[0];
    saveState();
    console.log('[serviceCatalogStore] Deleted item:', id, deleted.name);
    return true;
}

export function getItemCount(): number {
    return ensureLoaded().items.length;
}

// --- Dev Helper ---

if (import.meta.env?.DEV && typeof window !== 'undefined') {
    (window as any).__gesuServiceCatalog = {
        listItems,
        getItemById,
        searchItems,
        getItemsByCategory,
        getCategories,
        createItem,
        updateItem,
        deleteItem
    };
}
