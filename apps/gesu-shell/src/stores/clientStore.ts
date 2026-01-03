// Client Store - Manages client records for BUSINESS workspace
// S5-2: CRUD clients, scoped to BUSINESS workspace only

import { getProjectsByClientId } from './projectStore';
import { getInvoicesByClientId } from './invoiceStore';
import { getContractsByClientId } from './contractStore';
import { getUserStorageKey } from '../utils/getUserStorageKey';

export interface Client {
    id: string;
    name: string;               // Contact person name
    company: string;            // Company/organization name
    email: string;
    phone: string;
    address: string;
    notes: string;
    createdAt: string;          // ISO timestamp
    updatedAt: string;
}

interface ClientStoreState {
    schemaVersion: number;
    clients: Client[];
}

const BASE_STORAGE_KEY = 'gesu-clients';
const CURRENT_SCHEMA_VERSION = 1;

// Get user-scoped storage key
const getStorageKey = () => getUserStorageKey(BASE_STORAGE_KEY);

// --- Utility ---

function generateId(): string {
    return crypto.randomUUID?.() || `client-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// --- State ---

let state: ClientStoreState | null = null;
const subscribers = new Set<() => void>();

// --- Persistence ---

function isLocalStorageAvailable(): boolean {
    try {
        return typeof window !== 'undefined' && !!window.localStorage;
    } catch {
        return false;
    }
}

function loadState(): ClientStoreState {
    if (!isLocalStorageAvailable()) {
        return { schemaVersion: CURRENT_SCHEMA_VERSION, clients: [] };
    }

    try {
        const raw = localStorage.getItem(getStorageKey());
        if (!raw) {
            console.log('[clientStore] No stored clients, starting empty');
            return { schemaVersion: CURRENT_SCHEMA_VERSION, clients: [] };
        }

        const parsed = JSON.parse(raw) as ClientStoreState;

        // Version check
        if (typeof parsed.schemaVersion !== 'number') {
            console.log('[clientStore] Invalid schema, starting empty');
            return { schemaVersion: CURRENT_SCHEMA_VERSION, clients: [] };
        }

        if (parsed.schemaVersion > CURRENT_SCHEMA_VERSION) {
            console.warn('[clientStore] Future schema version detected, loading as-is');
            return parsed;
        }

        // Migration placeholder for future versions
        // if (parsed.schemaVersion < 2) { migrateV1ToV2(parsed); }

        return { schemaVersion: CURRENT_SCHEMA_VERSION, clients: parsed.clients || [] };
    } catch (err) {
        console.error('[clientStore] Failed to load:', err);
        return { schemaVersion: CURRENT_SCHEMA_VERSION, clients: [] };
    }
}

function saveState(): void {
    if (!state || !isLocalStorageAvailable()) return;

    try {
        localStorage.setItem(getStorageKey(), JSON.stringify(state));
        notifySubscribers();
    } catch (err) {
        console.error('[clientStore] Failed to save:', err);
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
            console.error('[clientStore] Subscriber callback error:', err);
        }
    });
}

// --- Initialization ---

function ensureLoaded(): ClientStoreState {
    if (!state) {
        state = loadState();
    }
    return state;
}

// --- Public API ---

export function listClients(): Client[] {
    return [...ensureLoaded().clients].sort((a, b) => 
        a.name.localeCompare(b.name)
    );
}

export function getClientById(id: string): Client | null {
    return ensureLoaded().clients.find(c => c.id === id) || null;
}

export function searchClients(query: string): Client[] {
    const q = query.toLowerCase().trim();
    if (!q) return listClients();
    
    return ensureLoaded().clients.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
    );
}

export function createClient(data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Client {
    const current = ensureLoaded();
    const now = new Date().toISOString();
    
    const newClient: Client = {
        ...data,
        id: generateId(),
        createdAt: now,
        updatedAt: now
    };
    
    current.clients.push(newClient);
    saveState();
    console.log('[clientStore] Created client:', newClient.id, newClient.name);
    return newClient;
}

export function updateClient(id: string, updates: Partial<Omit<Client, 'id' | 'createdAt'>>): Client | null {
    const current = ensureLoaded();
    const client = current.clients.find(c => c.id === id);
    if (!client) return null;
    
    Object.assign(client, updates, { updatedAt: new Date().toISOString() });
    saveState();
    console.log('[clientStore] Updated client:', id);
    return { ...client };
}

export function deleteClient(id: string): boolean {
    const current = ensureLoaded();
    const index = current.clients.findIndex(c => c.id === id);
    if (index === -1) return false;
    
    const deleted = current.clients.splice(index, 1)[0];
    saveState();
    console.log('[clientStore] Deleted client:', id, deleted.name);
    
    // S5-3: Unlink from any projects (handled by caller in projectStore)
    return true;
}

export function getClientCount(): number {
    return ensureLoaded().clients.length;
}

/**
 * Get count of entities linked to a client (projects, invoices, contracts)
 * Used for cascade deletion warning
 */
export function getLinkedEntityCount(clientId: string): { projects: number; invoices: number; contracts: number; total: number } {
    const projects = getProjectsByClientId(clientId).length;
    const invoices = getInvoicesByClientId(clientId).length;
    const contracts = getContractsByClientId(clientId).length;
    
    return {
        projects,
        invoices,
        contracts,
        total: projects + invoices + contracts
    };
}

// --- Dev Helper ---

if (import.meta.env?.DEV && typeof window !== 'undefined') {
    (window as any).__gesuClients = {
        listClients,
        getClientById,
        searchClients,
        createClient,
        updateClient,
        deleteClient
    };
}
