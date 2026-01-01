// Payment Store - Manages payments against invoices for BUSINESS workspace
// S7-A: Payment recording with invoice linking
// Persistence pattern matches other stores (localStorage + schemaVersion)

// --- Types ---

export type PaymentMethod = 'transfer' | 'cash' | 'other';

export interface Payment {
    id: string;
    invoiceId: string;
    amount: number;           // IDR
    paidAt: string;           // ISO date string
    method: PaymentMethod;
    notes: string;
    createdAt: string;        // ISO timestamp
    updatedAt: string;
}

interface PaymentStoreState {
    schemaVersion: number;
    payments: Payment[];
}

const STORAGE_KEY = 'gesu-payments';
const CURRENT_SCHEMA_VERSION = 1;

// --- Utility ---

function generateId(): string {
    return crypto.randomUUID?.() || `pay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// --- State ---

let state: PaymentStoreState | null = null;
const subscribers = new Set<() => void>();

// --- Persistence ---

function isLocalStorageAvailable(): boolean {
    try {
        return typeof window !== 'undefined' && !!window.localStorage;
    } catch {
        return false;
    }
}

function loadState(): PaymentStoreState {
    if (!isLocalStorageAvailable()) {
        return { schemaVersion: CURRENT_SCHEMA_VERSION, payments: [] };
    }

    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            console.log('[paymentStore] No stored payments, starting empty');
            return { schemaVersion: CURRENT_SCHEMA_VERSION, payments: [] };
        }

        const parsed = JSON.parse(raw) as PaymentStoreState;

        // Version check
        if (typeof parsed.schemaVersion !== 'number') {
            console.log('[paymentStore] Invalid schema, starting empty');
            return { schemaVersion: CURRENT_SCHEMA_VERSION, payments: [] };
        }

        if (parsed.schemaVersion > CURRENT_SCHEMA_VERSION) {
            console.warn('[paymentStore] Future schema version detected, loading as-is');
            return parsed;
        }

        // Migration placeholder for future versions
        // if (parsed.schemaVersion < 2) { migrateV1ToV2(parsed); }

        return { schemaVersion: CURRENT_SCHEMA_VERSION, payments: parsed.payments || [] };
    } catch (err) {
        console.error('[paymentStore] Failed to load:', err);
        return { schemaVersion: CURRENT_SCHEMA_VERSION, payments: [] };
    }
}

function saveState(): void {
    if (!state || !isLocalStorageAvailable()) return;

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        notifySubscribers();
    } catch (err) {
        console.error('[paymentStore] Failed to save:', err);
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
            console.error('[paymentStore] Subscriber callback error:', err);
        }
    });
}

// --- Initialization ---

function ensureLoaded(): PaymentStoreState {
    if (!state) {
        state = loadState();
    }
    return state;
}

// --- Public API ---

export function listAll(): Payment[] {
    return [...ensureLoaded().payments].sort((a, b) => 
        new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime()
    );
}

export function listByInvoiceId(invoiceId: string): Payment[] {
    return ensureLoaded().payments
        .filter(p => p.invoiceId === invoiceId)
        .sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());
}

export function getPaymentById(id: string): Payment | null {
    return ensureLoaded().payments.find(p => p.id === id) || null;
}

export function createPayment(data: {
    invoiceId: string;
    amount: number;
    paidAt: string;
    method?: PaymentMethod;
    notes?: string;
}): Payment {
    const current = ensureLoaded();
    const now = new Date().toISOString();
    
    const newPayment: Payment = {
        id: generateId(),
        invoiceId: data.invoiceId,
        amount: data.amount,
        paidAt: data.paidAt,
        method: data.method || 'transfer',
        notes: data.notes || '',
        createdAt: now,
        updatedAt: now
    };
    
    current.payments.push(newPayment);
    saveState();
    console.log('[paymentStore] Created payment:', newPayment.id, 'for invoice:', data.invoiceId);
    return { ...newPayment };
}

export function updatePayment(id: string, updates: {
    amount?: number;
    paidAt?: string;
    method?: PaymentMethod;
    notes?: string;
}): Payment | null {
    const current = ensureLoaded();
    const payment = current.payments.find(p => p.id === id);
    if (!payment) {
        console.warn('[paymentStore] Payment not found:', id);
        return null;
    }
    
    if (updates.amount !== undefined) payment.amount = updates.amount;
    if (updates.paidAt !== undefined) payment.paidAt = updates.paidAt;
    if (updates.method !== undefined) payment.method = updates.method;
    if (updates.notes !== undefined) payment.notes = updates.notes;
    
    payment.updatedAt = new Date().toISOString();
    
    saveState();
    console.log('[paymentStore] Updated payment:', id);
    return { ...payment };
}

export function deletePayment(id: string): boolean {
    const current = ensureLoaded();
    const index = current.payments.findIndex(p => p.id === id);
    if (index === -1) return false;
    
    const deleted = current.payments.splice(index, 1)[0];
    saveState();
    console.log('[paymentStore] Deleted payment:', id, 'from invoice:', deleted.invoiceId);
    return true;
}

// --- Computed Helpers ---

export function getTotalPaid(invoiceId: string): number {
    return ensureLoaded().payments
        .filter(p => p.invoiceId === invoiceId)
        .reduce((sum, p) => sum + p.amount, 0);
}

export function getRemaining(invoiceTotal: number, invoiceId: string): number {
    return invoiceTotal - getTotalPaid(invoiceId);
}

export function isFullyPaid(invoiceTotal: number, invoiceId: string): boolean {
    return getRemaining(invoiceTotal, invoiceId) <= 0;
}

export function getPaymentCount(invoiceId: string): number {
    return ensureLoaded().payments.filter(p => p.invoiceId === invoiceId).length;
}

// --- Dev Helper ---

if (import.meta.env?.DEV && typeof window !== 'undefined') {
    (window as any).__gesuPayments = {
        listAll,
        listByInvoiceId,
        getPaymentById,
        createPayment,
        updatePayment,
        deletePayment,
        getTotalPaid,
        getRemaining,
        isFullyPaid
    };
}
