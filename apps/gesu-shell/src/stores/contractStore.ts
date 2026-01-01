// Contract Store - Manages contracts for BUSINESS workspace
// S6-A: Contract with scope[], terms, and snapshot values
// Freeze rule: if status !== 'draft', block content edits

import { 
    getBusinessProfile, 
    incrementContractSeq
} from './businessProfileStore';
import { getClientById } from './clientStore';
import { formatDocumentNumber } from './invoiceStore';

// --- Types ---

export type ContractStatus = 'draft' | 'sent' | 'signed' | 'cancelled';

export interface ScopeItem {
    id: string;
    description: string;
}

export interface ContractSnapshot {
    // Business profile at creation time
    businessName: string;
    businessAddress: string;
    businessPhone: string;
    businessEmail: string;
    // Client at creation time
    clientName: string;
    clientCompany: string;
    clientAddress: string;
    clientPhone: string;
    clientEmail: string;
}

export interface Contract {
    id: string;
    number: string;             // Generated from format, e.g., "GCL/BRD/01/001/2026"
    clientId: string;
    projectId: string;
    status: ContractStatus;
    scope: ScopeItem[];         // List of project scope items
    terms: string;              // Terms & conditions (snapshot from profile, editable in draft)
    notes: string;
    snapshot: ContractSnapshot;
    createdAt: string;          // ISO timestamp
    updatedAt: string;
}

interface ContractStoreState {
    schemaVersion: number;
    contracts: Contract[];
}

const STORAGE_KEY = 'gesu-contracts';
const CURRENT_SCHEMA_VERSION = 1;

// --- Utility ---

function generateId(): string {
    return crypto.randomUUID?.() || `ctr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function generateScopeItemId(): string {
    return `sc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

// --- State ---

let state: ContractStoreState | null = null;
const subscribers = new Set<() => void>();

// --- Persistence ---

function isLocalStorageAvailable(): boolean {
    try {
        return typeof window !== 'undefined' && !!window.localStorage;
    } catch {
        return false;
    }
}

function loadState(): ContractStoreState {
    if (!isLocalStorageAvailable()) {
        return { schemaVersion: CURRENT_SCHEMA_VERSION, contracts: [] };
    }

    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            console.log('[contractStore] No stored contracts, starting empty');
            return { schemaVersion: CURRENT_SCHEMA_VERSION, contracts: [] };
        }

        const parsed = JSON.parse(raw) as ContractStoreState;

        // Version check
        if (typeof parsed.schemaVersion !== 'number') {
            console.log('[contractStore] Invalid schema, starting empty');
            return { schemaVersion: CURRENT_SCHEMA_VERSION, contracts: [] };
        }

        if (parsed.schemaVersion > CURRENT_SCHEMA_VERSION) {
            console.warn('[contractStore] Future schema version detected, loading as-is');
            return parsed;
        }

        // Migration placeholder for future versions
        // if (parsed.schemaVersion < 2) { migrateV1ToV2(parsed); }

        return { schemaVersion: CURRENT_SCHEMA_VERSION, contracts: parsed.contracts || [] };
    } catch (err) {
        console.error('[contractStore] Failed to load:', err);
        return { schemaVersion: CURRENT_SCHEMA_VERSION, contracts: [] };
    }
}

function saveState(): void {
    if (!state || !isLocalStorageAvailable()) return;

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        notifySubscribers();
    } catch (err) {
        console.error('[contractStore] Failed to save:', err);
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
            console.error('[contractStore] Subscriber callback error:', err);
        }
    });
}

// --- Initialization ---

function ensureLoaded(): ContractStoreState {
    if (!state) {
        state = loadState();
    }
    return state;
}

// --- Snapshot Creator ---

function createSnapshot(clientId: string): ContractSnapshot {
    const profile = getBusinessProfile();
    const client = getClientById(clientId);
    
    return {
        businessName: profile.businessName,
        businessAddress: profile.businessAddress,
        businessPhone: profile.businessPhone,
        businessEmail: profile.businessEmail,
        clientName: client?.name || '',
        clientCompany: client?.company || '',
        clientAddress: client?.address || '',
        clientPhone: client?.phone || '',
        clientEmail: client?.email || ''
    };
}

// --- Public API ---

export function listContracts(): Contract[] {
    return [...ensureLoaded().contracts].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export function getContractById(id: string): Contract | null {
    return ensureLoaded().contracts.find(c => c.id === id) || null;
}

export function getContractsByClientId(clientId: string): Contract[] {
    return ensureLoaded().contracts.filter(c => c.clientId === clientId);
}

export function getContractsByProjectId(projectId: string): Contract[] {
    return ensureLoaded().contracts.filter(c => c.projectId === projectId);
}

export function getContractsByStatus(status: ContractStatus): Contract[] {
    return ensureLoaded().contracts.filter(c => c.status === status);
}

/**
 * Create a new contract. Generates number and increments sequence.
 * Call this only when SAVING a new contract (not for preview).
 */
export function createContract(data: {
    clientId: string;
    projectId: string;
    scope: string[];        // Array of scope descriptions (IDs will be generated)
    terms?: string;         // If not provided, uses profile default
    notes?: string;
}): Contract {
    const current = ensureLoaded();
    const now = new Date().toISOString();
    const profile = getBusinessProfile();
    
    // Generate number using BusinessProfile format + increment sequence
    const number = generateContractNumber();
    
    // Process scope items with IDs
    const scope: ScopeItem[] = data.scope.map(desc => ({
        id: generateScopeItemId(),
        description: desc
    }));
    
    const newContract: Contract = {
        id: generateId(),
        number,
        clientId: data.clientId,
        projectId: data.projectId,
        status: 'draft',
        scope,
        terms: data.terms ?? profile.contractTerms,  // Snapshot from profile if not provided
        notes: data.notes || '',
        snapshot: createSnapshot(data.clientId),
        createdAt: now,
        updatedAt: now
    };
    
    current.contracts.push(newContract);
    saveState();
    console.log('[contractStore] Created contract:', newContract.id, newContract.number);
    return { ...newContract };
}

/**
 * Update contract content. BLOCKED if status !== 'draft'.
 */
export function updateContract(id: string, updates: {
    scope?: string[];       // Replace all scope items
    terms?: string;
    notes?: string;
}): Contract | null {
    const current = ensureLoaded();
    const contract = current.contracts.find(c => c.id === id);
    if (!contract) {
        console.warn('[contractStore] Contract not found:', id);
        return null;
    }
    
    // FREEZE RULE: Block content edits after draft
    if (contract.status !== 'draft') {
        console.warn('[contractStore] Cannot modify non-draft contract:', id, contract.status);
        return null;
    }
    
    // Update scope if provided
    if (updates.scope) {
        contract.scope = updates.scope.map(desc => ({
            id: generateScopeItemId(),
            description: desc
        }));
    }
    
    if (updates.terms !== undefined) {
        contract.terms = updates.terms;
    }
    
    if (updates.notes !== undefined) {
        contract.notes = updates.notes;
    }
    
    contract.updatedAt = new Date().toISOString();
    
    saveState();
    console.log('[contractStore] Updated contract:', id);
    return { ...contract };
}

// --- Status Transitions ---

export function markContractSent(id: string): Contract | null {
    const current = ensureLoaded();
    const contract = current.contracts.find(c => c.id === id);
    if (!contract) return null;
    
    if (contract.status !== 'draft') {
        console.warn('[contractStore] Can only send draft contracts');
        return null;
    }
    
    contract.status = 'sent';
    contract.updatedAt = new Date().toISOString();
    saveState();
    console.log('[contractStore] Contract marked as sent:', id);
    return { ...contract };
}

export function markContractSigned(id: string): Contract | null {
    const current = ensureLoaded();
    const contract = current.contracts.find(c => c.id === id);
    if (!contract) return null;
    
    if (contract.status !== 'sent') {
        console.warn('[contractStore] Can only sign sent contracts');
        return null;
    }
    
    contract.status = 'signed';
    contract.updatedAt = new Date().toISOString();
    saveState();
    console.log('[contractStore] Contract marked as signed:', id);
    return { ...contract };
}

export function cancelContract(id: string): Contract | null {
    const current = ensureLoaded();
    const contract = current.contracts.find(c => c.id === id);
    if (!contract) return null;
    
    if (contract.status === 'cancelled') {
        console.warn('[contractStore] Contract already cancelled');
        return null;
    }
    
    contract.status = 'cancelled';
    contract.updatedAt = new Date().toISOString();
    saveState();
    console.log('[contractStore] Contract cancelled:', id);
    return { ...contract };
}

/**
 * Delete contract. Only allowed for drafts.
 */
export function deleteContract(id: string): boolean {
    const current = ensureLoaded();
    const index = current.contracts.findIndex(c => c.id === id);
    if (index === -1) return false;
    
    const contract = current.contracts[index];
    if (contract.status !== 'draft') {
        console.warn('[contractStore] Can only delete draft contracts');
        return false;
    }
    
    current.contracts.splice(index, 1);
    saveState();
    console.log('[contractStore] Deleted contract:', id);
    return true;
}

export function getContractCount(): number {
    return ensureLoaded().contracts.length;
}

// --- Numbering ---

/**
 * Generate contract number using BusinessProfile format.
 * Increments the sequence automatically.
 */
function generateContractNumber(): string {
    const profile = getBusinessProfile();
    const seq = incrementContractSeq();
    return formatDocumentNumber(profile.contractNumberFormat, seq);
}

// --- Dev Helper ---

if (import.meta.env?.DEV && typeof window !== 'undefined') {
    (window as any).__gesuContracts = {
        listContracts,
        getContractById,
        getContractsByClientId,
        getContractsByProjectId,
        getContractsByStatus,
        createContract,
        updateContract,
        markContractSent,
        markContractSigned,
        cancelContract,
        deleteContract
    };
}
