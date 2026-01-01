// Business Profile Store - Manages business identity for BUSINESS workspace
// S5-1: Profile, payment methods, numbering rules, default terms
// Scoped to BUSINESS workspace only

export interface PaymentMethod {
    id: string;
    label: string;              // e.g., "BCA - Main Business"
    bankName: string;           // e.g., "Bank Central Asia"
    accountNumber: string;      // e.g., "1234567890"
    accountHolder: string;      // e.g., "PT Gesu Creative"
    isDefault: boolean;
}

export interface BusinessProfile {
    // Identity (for invoice/contract headers)
    businessName: string;
    businessAddress: string;
    businessEmail: string;
    businessPhone: string;
    taxId: string;              // NPWP, VAT ID, etc.

    // Payment Methods (for invoice footers)
    paymentMethods: PaymentMethod[];

    // Numbering Rules (config, NOT generator - S6 will use these)
    invoiceNumberFormat: string;    // e.g., "GC-INV-{YY}{MM}{DD}-{####}"
    contractNumberFormat: string;   // e.g., "GCL/BRD/{MM}/{###}/{YYYY}"
    nextInvoiceSeq: number;         // current sequence counter
    nextContractSeq: number;

    // Default Terms (snapshot at invoice/contract creation)
    invoiceTerms: string;           // long text, e.g., NET 14, late fees
    contractTerms: string;          // long text, e.g., cancellation policy
}

interface BusinessProfileStoreState {
    schemaVersion: number;
    profile: BusinessProfile;
}

const STORAGE_KEY = 'gesu-business-profile';
const CURRENT_SCHEMA_VERSION = 1;

// --- Utility ---

function generateId(): string {
    return crypto.randomUUID?.() || `pm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// --- Default Values ---

const DEFAULT_INVOICE_TERMS = `PAYMENT TERMS:
- Payment due within 14 days from invoice date
- Bank transfer to the account listed above
- Please include invoice number in transfer description
- Late payments may incur 2% monthly interest

NOTES:
- All prices include applicable taxes unless stated otherwise
- This invoice is valid without signature`;

const DEFAULT_CONTRACT_TERMS = `GENERAL TERMS:
1. SCOPE: Services as described in the project description above
2. PAYMENT: As per agreed schedule; 50% upfront, 50% upon completion
3. REVISIONS: Includes up to 2 rounds of revisions; additional revisions billed separately
4. TIMELINE: Estimated completion dates subject to timely client feedback
5. CANCELLATION: 50% cancellation fee if cancelled after project start
6. INTELLECTUAL PROPERTY: Full rights transfer upon final payment
7. CONFIDENTIALITY: Both parties agree to keep project details confidential

This agreement is binding upon signature by both parties.`;

function getDefaultProfile(): BusinessProfile {
    return {
        businessName: '',
        businessAddress: '',
        businessEmail: '',
        businessPhone: '',
        taxId: '',
        paymentMethods: [],
        // Prefilled numbering formats (from user's existing invoice/contract PDFs)
        invoiceNumberFormat: 'GC-INV-{YY}{MM}{DD}-{####}',
        contractNumberFormat: 'GCL/BRD/{MM}/{###}/{YYYY}',
        nextInvoiceSeq: 1,
        nextContractSeq: 1,
        invoiceTerms: DEFAULT_INVOICE_TERMS,
        contractTerms: DEFAULT_CONTRACT_TERMS
    };
}

// --- State ---

let state: BusinessProfileStoreState | null = null;

// --- Persistence ---

function isLocalStorageAvailable(): boolean {
    try {
        return typeof window !== 'undefined' && !!window.localStorage;
    } catch {
        return false;
    }
}

function loadState(): BusinessProfileStoreState {
    if (!isLocalStorageAvailable()) {
        return { schemaVersion: CURRENT_SCHEMA_VERSION, profile: getDefaultProfile() };
    }

    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            console.log('[businessProfileStore] No stored profile, using defaults');
            return { schemaVersion: CURRENT_SCHEMA_VERSION, profile: getDefaultProfile() };
        }

        const parsed = JSON.parse(raw) as BusinessProfileStoreState;

        // Version check
        if (typeof parsed.schemaVersion !== 'number') {
            console.log('[businessProfileStore] Invalid schema, using defaults');
            return { schemaVersion: CURRENT_SCHEMA_VERSION, profile: getDefaultProfile() };
        }

        if (parsed.schemaVersion > CURRENT_SCHEMA_VERSION) {
            console.warn('[businessProfileStore] Future schema version detected, loading as-is');
            return parsed;
        }

        // Migration placeholder for future versions
        // if (parsed.schemaVersion < 2) { migrateV1ToV2(parsed); }

        return { 
            schemaVersion: CURRENT_SCHEMA_VERSION, 
            profile: { ...getDefaultProfile(), ...parsed.profile }
        };
    } catch (err) {
        console.error('[businessProfileStore] Failed to load:', err);
        return { schemaVersion: CURRENT_SCHEMA_VERSION, profile: getDefaultProfile() };
    }
}

function saveState(): void {
    if (!state || !isLocalStorageAvailable()) return;

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
        console.error('[businessProfileStore] Failed to save:', err);
    }
}

// --- Initialization ---

function ensureLoaded(): BusinessProfileStoreState {
    if (!state) {
        state = loadState();
    }
    return state;
}

// --- Public API ---

export function getBusinessProfile(): BusinessProfile {
    return { ...ensureLoaded().profile };
}

export function updateBusinessProfile(updates: Partial<BusinessProfile>): BusinessProfile {
    const current = ensureLoaded();
    current.profile = { ...current.profile, ...updates };
    saveState();
    return { ...current.profile };
}

// --- Payment Methods ---

export function addPaymentMethod(method: Omit<PaymentMethod, 'id'>): PaymentMethod {
    const current = ensureLoaded();
    const newMethod: PaymentMethod = {
        ...method,
        id: generateId()
    };
    
    // If first or marked as default, clear others' default flag
    if (newMethod.isDefault || current.profile.paymentMethods.length === 0) {
        current.profile.paymentMethods.forEach(pm => pm.isDefault = false);
        newMethod.isDefault = true;
    }
    
    current.profile.paymentMethods.push(newMethod);
    saveState();
    return newMethod;
}

export function updatePaymentMethod(id: string, updates: Partial<Omit<PaymentMethod, 'id'>>): PaymentMethod | null {
    const current = ensureLoaded();
    const method = current.profile.paymentMethods.find(pm => pm.id === id);
    if (!method) return null;
    
    // If setting as default, clear others
    if (updates.isDefault) {
        current.profile.paymentMethods.forEach(pm => pm.isDefault = false);
    }
    
    Object.assign(method, updates);
    saveState();
    return { ...method };
}

export function removePaymentMethod(id: string): boolean {
    const current = ensureLoaded();
    const index = current.profile.paymentMethods.findIndex(pm => pm.id === id);
    if (index === -1) return false;
    
    const wasDefault = current.profile.paymentMethods[index].isDefault;
    current.profile.paymentMethods.splice(index, 1);
    
    // If removed was default and others exist, make first one default
    if (wasDefault && current.profile.paymentMethods.length > 0) {
        current.profile.paymentMethods[0].isDefault = true;
    }
    
    saveState();
    return true;
}

export function getPaymentMethods(): PaymentMethod[] {
    return [...ensureLoaded().profile.paymentMethods];
}

export function getDefaultPaymentMethod(): PaymentMethod | null {
    return ensureLoaded().profile.paymentMethods.find(pm => pm.isDefault) || null;
}

// --- Numbering (config only, generator is S6) ---

export function incrementInvoiceSeq(): number {
    const current = ensureLoaded();
    const seq = current.profile.nextInvoiceSeq;
    current.profile.nextInvoiceSeq = seq + 1;
    saveState();
    return seq;
}

export function incrementContractSeq(): number {
    const current = ensureLoaded();
    const seq = current.profile.nextContractSeq;
    current.profile.nextContractSeq = seq + 1;
    saveState();
    return seq;
}

// --- Dev Helper ---

if (import.meta.env?.DEV && typeof window !== 'undefined') {
    (window as any).__gesuBusinessProfile = {
        getBusinessProfile,
        updateBusinessProfile,
        addPaymentMethod,
        removePaymentMethod,
        getPaymentMethods
    };
}
