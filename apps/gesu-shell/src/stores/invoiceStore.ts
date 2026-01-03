// Invoice Store - Manages invoices for BUSINESS workspace
// S6-A: Invoice + line items with snapshot values (not references)
// Freeze rule: if status !== 'draft', block content edits

import { 
    getBusinessProfile, 
    incrementInvoiceSeq,
    getDefaultPaymentMethod,
    type PaymentMethod
} from './businessProfileStore';
import { getClientById } from './clientStore';
import { getUserStorageKey } from '../utils/getUserStorageKey';

// --- Types ---

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'cancelled';

export interface InvoiceLineItem {
    id: string;
    itemName: string;       // Snapshot from catalog (NOT a reference)
    description: string;
    quantity: number;
    unitPrice: number;      // Snapshot from catalog
    total: number;          // Computed: qty * unitPrice
}

export interface InvoiceSnapshot {
    // Business profile at creation time
    businessName: string;
    businessAddress: string;
    businessPhone: string;
    businessEmail: string;
    bankInfo: PaymentMethod | null;
    terms: string;
    // Client at creation time
    clientName: string;
    clientCompany: string;
    clientAddress: string;
    clientPhone: string;
    clientEmail: string;
}

export interface Invoice {
    id: string;
    number: string;             // Generated from format, e.g., "GC-INV-260102-0001"
    clientId: string;
    projectId: string;
    status: InvoiceStatus;
    lineItems: InvoiceLineItem[];
    subtotal: number;           // Sum of all line item totals
    adjustments: number;        // Discount or additions (can be negative)
    total: number;              // subtotal + adjustments
    dueDate?: string;           // S7-A: ISO date string, optional (default: createdAt + 30 days)
    notes: string;
    snapshot: InvoiceSnapshot;
    createdAt: string;          // ISO timestamp
    updatedAt: string;
}

interface InvoiceStoreState {
    schemaVersion: number;
    invoices: Invoice[];
}

const BASE_STORAGE_KEY = 'gesu-invoices';

// Get user-scoped storage key
const getStorageKey = () => getUserStorageKey(BASE_STORAGE_KEY);
const CURRENT_SCHEMA_VERSION = 1;

// --- Utility ---

function generateId(): string {
    return crypto.randomUUID?.() || `inv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function generateLineItemId(): string {
    return `li-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

// --- State ---

let state: InvoiceStoreState | null = null;
const subscribers = new Set<() => void>();

// --- Persistence ---

function isLocalStorageAvailable(): boolean {
    try {
        return typeof window !== 'undefined' && !!window.localStorage;
    } catch {
        return false;
    }
}

function loadState(): InvoiceStoreState {
    if (!isLocalStorageAvailable()) {
        return { schemaVersion: CURRENT_SCHEMA_VERSION, invoices: [] };
    }

    try {
        const raw = localStorage.getItem(getStorageKey());
        if (!raw) {
            console.log('[invoiceStore] No stored invoices, starting empty');
            return { schemaVersion: CURRENT_SCHEMA_VERSION, invoices: [] };
        }

        const parsed = JSON.parse(raw) as InvoiceStoreState;

        // Version check
        if (typeof parsed.schemaVersion !== 'number') {
            console.log('[invoiceStore] Invalid schema, starting empty');
            return { schemaVersion: CURRENT_SCHEMA_VERSION, invoices: [] };
        }

        if (parsed.schemaVersion > CURRENT_SCHEMA_VERSION) {
            console.warn('[invoiceStore] Future schema version detected, loading as-is');
            return parsed;
        }

        // Migration placeholder for future versions
        // if (parsed.schemaVersion < 2) { migrateV1ToV2(parsed); }

        return { schemaVersion: CURRENT_SCHEMA_VERSION, invoices: parsed.invoices || [] };
    } catch (err) {
        console.error('[invoiceStore] Failed to load:', err);
        return { schemaVersion: CURRENT_SCHEMA_VERSION, invoices: [] };
    }
}

function saveState(): void {
    if (!state || !isLocalStorageAvailable()) return;

    try {
        localStorage.setItem(getStorageKey(), JSON.stringify(state));
        notifySubscribers();
    } catch (err) {
        console.error('[invoiceStore] Failed to save:', err);
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
            console.error('[invoiceStore] Subscriber callback error:', err);
        }
    });
}

// --- Initialization ---

function ensureLoaded(): InvoiceStoreState {
    if (!state) {
        state = loadState();
    }
    return state;
}

// --- Snapshot Creator ---

function createSnapshot(clientId: string): InvoiceSnapshot {
    const profile = getBusinessProfile();
    const client = getClientById(clientId);
    const bankInfo = getDefaultPaymentMethod();
    
    return {
        businessName: profile.businessName,
        businessAddress: profile.businessAddress,
        businessPhone: profile.businessPhone,
        businessEmail: profile.businessEmail,
        bankInfo: bankInfo ? { ...bankInfo } : null,
        terms: profile.invoiceTerms,
        clientName: client?.name || '',
        clientCompany: client?.company || '',
        clientAddress: client?.address || '',
        clientPhone: client?.phone || '',
        clientEmail: client?.email || ''
    };
}

// --- Public API ---

export function listInvoices(): Invoice[] {
    return [...ensureLoaded().invoices].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export function getInvoiceById(id: string): Invoice | null {
    return ensureLoaded().invoices.find(i => i.id === id) || null;
}

export function getInvoicesByClientId(clientId: string): Invoice[] {
    return ensureLoaded().invoices.filter(i => i.clientId === clientId);
}

export function getInvoicesByProjectId(projectId: string): Invoice[] {
    return ensureLoaded().invoices.filter(i => i.projectId === projectId);
}

export function getInvoicesByStatus(status: InvoiceStatus): Invoice[] {
    return ensureLoaded().invoices.filter(i => i.status === status);
}

/**
 * Create a new invoice. Generates number and increments sequence.
 * Call this only when SAVING a new invoice (not for preview).
 */
export function createInvoice(data: {
    clientId: string;
    projectId: string;
    lineItems: Omit<InvoiceLineItem, 'id' | 'total'>[];
    adjustments?: number;
    notes?: string;
}): Invoice {
    const current = ensureLoaded();
    const now = new Date().toISOString();
    
    // Generate number using BusinessProfile format + increment sequence
    const number = generateInvoiceNumber();
    
    // Process line items with IDs and totals
    const lineItems: InvoiceLineItem[] = data.lineItems.map(li => ({
        ...li,
        id: generateLineItemId(),
        total: li.quantity * li.unitPrice
    }));
    
    // Calculate totals
    const subtotal = lineItems.reduce((sum, li) => sum + li.total, 0);
    const adjustments = data.adjustments || 0;
    const total = subtotal + adjustments;
    
    const newInvoice: Invoice = {
        id: generateId(),
        number,
        clientId: data.clientId,
        projectId: data.projectId,
        status: 'draft',
        lineItems,
        subtotal,
        adjustments,
        total,
        notes: data.notes || '',
        snapshot: createSnapshot(data.clientId),
        createdAt: now,
        updatedAt: now
    };
    
    current.invoices.push(newInvoice);
    saveState();
    console.log('[invoiceStore] Created invoice:', newInvoice.id, newInvoice.number);
    return { ...newInvoice };
}

/**
 * Update invoice content. BLOCKED if status !== 'draft'.
 */
export function updateInvoice(id: string, updates: {
    lineItems?: Omit<InvoiceLineItem, 'id' | 'total'>[];
    adjustments?: number;
    notes?: string;
    clientId?: string; // Allow client update on draft invoices
    projectId?: string; // Allow project update on draft invoices
}): Invoice | null {
    const current = ensureLoaded();
    const invoice = current.invoices.find(i => i.id === id);
    if (!invoice) {
        console.warn('[invoiceStore] Invoice not found:', id);
        return null;
    }
    
    // FREEZE RULE: Block content edits after draft
    if (invoice.status !== 'draft') {
        console.warn('[invoiceStore] Cannot modify non-draft invoice:', id, invoice.status);
        return null;
    }
    
    // Update line items if provided
    if (updates.lineItems) {
        invoice.lineItems = updates.lineItems.map(li => ({
            ...li,
            id: generateLineItemId(),
            total: li.quantity * li.unitPrice
        }));
        invoice.subtotal = invoice.lineItems.reduce((sum, li) => sum + li.total, 0);
    }
    
    if (updates.adjustments !== undefined) {
        invoice.adjustments = updates.adjustments;
    }
    
    if (updates.notes !== undefined) {
        invoice.notes = updates.notes;
    }
    
    // Update client if provided
    if (updates.clientId !== undefined) {
        invoice.clientId = updates.clientId;
        // Re-snapshot client data
        invoice.snapshot = createSnapshot(updates.clientId);
    }
    
    // Update project if provided
    if (updates.projectId !== undefined) {
        invoice.projectId = updates.projectId;
    }
    
    // Recalculate total
    invoice.total = invoice.subtotal + invoice.adjustments;
    invoice.updatedAt = new Date().toISOString();
    
    saveState();
    console.log('[invoiceStore] Updated invoice:', id);
    return { ...invoice };
}

// --- Status Transitions ---

export function markInvoiceSent(id: string): Invoice | null {
    const current = ensureLoaded();
    const invoice = current.invoices.find(i => i.id === id);
    if (!invoice) return null;
    
    if (invoice.status !== 'draft') {
        console.warn('[invoiceStore] Can only send draft invoices');
        return null;
    }
    
    invoice.status = 'sent';
    invoice.updatedAt = new Date().toISOString();
    saveState();
    console.log('[invoiceStore] Invoice marked as sent:', id);
    return { ...invoice };
}

export function markInvoicePaid(id: string): Invoice | null {
    const current = ensureLoaded();
    const invoice = current.invoices.find(i => i.id === id);
    if (!invoice) return null;
    
    if (invoice.status !== 'sent') {
        console.warn('[invoiceStore] Can only pay sent invoices');
        return null;
    }
    
    invoice.status = 'paid';
    invoice.updatedAt = new Date().toISOString();
    saveState();
    console.log('[invoiceStore] Invoice marked as paid:', id);
    return { ...invoice };
}

/**
 * Revert paid invoice back to sent status.
 * Used for accidentally marked as paid invoices.
 */
export function revertToSent(id: string): Invoice | null {
    const current = ensureLoaded();
    const invoice = current.invoices.find(i => i.id === id);
    if (!invoice) return null;
    
    if (invoice.status !== 'paid') {
        console.warn('[invoiceStore] Can only revert paid invoices');
        return null;
    }
    
    invoice.status = 'sent';
    invoice.updatedAt = new Date().toISOString();
    saveState();
    console.log('[invoiceStore] Invoice reverted to sent:', id);
    return { ...invoice };
}

export function cancelInvoice(id: string): Invoice | null {
    const current = ensureLoaded();
    const invoice = current.invoices.find(i => i.id === id);
    if (!invoice) return null;
    
    if (invoice.status === 'cancelled') {
        console.warn('[invoiceStore] Invoice already cancelled');
        return null;
    }
    
    invoice.status = 'cancelled';
    invoice.updatedAt = new Date().toISOString();
    saveState();
    console.log('[invoiceStore] Invoice cancelled:', id);
    return { ...invoice };
}

/**
 * Delete invoice. Only allowed for drafts.
 */
export function deleteInvoice(id: string): boolean {
    const current = ensureLoaded();
    const index = current.invoices.findIndex(i => i.id === id);
    if (index === -1) return false;
    
    const invoice = current.invoices[index];
    if (invoice.status !== 'draft') {
        console.warn('[invoiceStore] Can only delete draft invoices');
        return false;
    }
    
    current.invoices.splice(index, 1);
    saveState();
    console.log('[invoiceStore] Deleted invoice:', id);
    return true;
}

export function getInvoiceCount(): number {
    return ensureLoaded().invoices.length;
}

// --- Overdue Detection (S7-A) ---

/**
 * Get effective due date. If not set, defaults to createdAt + 30 days.
 */
export function getEffectiveDueDate(invoice: Invoice): string {
    if (invoice.dueDate) return invoice.dueDate;
    const created = new Date(invoice.createdAt);
    created.setDate(created.getDate() + 30);
    return created.toISOString().split('T')[0];
}

/**
 * Check if invoice is overdue: status=sent AND today > dueDate
 */
export function isOverdue(invoice: Invoice): boolean {
    if (invoice.status !== 'sent') return false;
    const dueDate = getEffectiveDueDate(invoice);
    const today = new Date().toISOString().split('T')[0];
    return today > dueDate;
}

/**
 * Update invoice due date. Allowed on any status (due date is informational).
 */
export function setDueDate(id: string, dueDate: string): Invoice | null {
    const current = ensureLoaded();
    const invoice = current.invoices.find(i => i.id === id);
    if (!invoice) return null;
    
    invoice.dueDate = dueDate;
    invoice.updatedAt = new Date().toISOString();
    saveState();
    console.log('[invoiceStore] Set due date:', id, dueDate);
    return { ...invoice };
}

/**
 * Get all overdue invoices (status=sent, past due date).
 */
export function getOverdueInvoices(): Invoice[] {
    return ensureLoaded().invoices.filter(isOverdue);
}

// --- Numbering ---

/**
 * Generate invoice number using BusinessProfile format.
 * Increments the sequence automatically.
 */
function generateInvoiceNumber(): string {
    const profile = getBusinessProfile();
    const seq = incrementInvoiceSeq();
    return formatDocumentNumber(profile.invoiceNumberFormat, seq);
}

/**
 * Format a document number by replacing tokens.
 * Supports: {YYYY}, {YY}, {MM}, {DD}, {####}, {###}
 */
export function formatDocumentNumber(format: string, seq: number): string {
    const now = new Date();
    return format
        .replace(/{YYYY}/g, String(now.getFullYear()))
        .replace(/{YY}/g, String(now.getFullYear()).slice(-2))
        .replace(/{MM}/g, String(now.getMonth() + 1).padStart(2, '0'))
        .replace(/{DD}/g, String(now.getDate()).padStart(2, '0'))
        .replace(/{####}/g, String(seq).padStart(4, '0'))
        .replace(/{###}/g, String(seq).padStart(3, '0'));
}

// --- Dev Helper ---

if (import.meta.env?.DEV && typeof window !== 'undefined') {
    (window as any).__gesuInvoices = {
        listInvoices,
        getInvoiceById,
        getInvoicesByClientId,
        getInvoicesByProjectId,
        getInvoicesByStatus,
        createInvoice,
        updateInvoice,
        markInvoiceSent,
        markInvoicePaid,
        cancelInvoice,
        deleteInvoice,
        formatDocumentNumber,
        isOverdue,
        getEffectiveDueDate,
        setDueDate,
        getOverdueInvoices
    };
}

