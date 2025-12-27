// Persona Store - Manages active persona context (personal vs business)
// S2-2: Persist to localStorage, no UI changes yet

export type Persona = 'personal' | 'business';

const STORAGE_KEY = 'gesu-active-persona';

// --- State ---

let activePersona: Persona = 'business';
const subscribers = new Set<() => void>();

// --- Persistence ---

function isLocalStorageAvailable(): boolean {
    try {
        return typeof window !== 'undefined' && !!window.localStorage;
    } catch {
        return false;
    }
}

function loadPersona(): Persona {
    if (!isLocalStorageAvailable()) {
        return 'business';
    }

    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw === 'personal' || raw === 'business') {
            return raw;
        }
        // Invalid or missing → fallback + correct storage
        console.warn('[personaStore] Invalid or missing persona, defaulting to business');
        savePersona('business');
        return 'business';
    } catch (err) {
        console.error('[personaStore] Failed to load persona:', err);
        return 'business';
    }
}

function savePersona(persona: Persona): void {
    if (!isLocalStorageAvailable()) {
        return;
    }

    try {
        localStorage.setItem(STORAGE_KEY, persona);
    } catch (err) {
        console.error('[personaStore] Failed to save persona:', err);
    }
}

// --- Actions ---

export function setActivePersona(persona: Persona): void {
    activePersona = persona;
    savePersona(persona);
    notifySubscribers();
}

// --- Getters ---

export function getActivePersona(): Persona {
    return activePersona;
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
            console.error('[personaStore] Subscriber callback error:', err);
        }
    });
}

// --- Initialization ---

// Load from localStorage on module load
activePersona = loadPersona();

// --- DEV-only QA helper ---

if (import.meta.env?.DEV && typeof window !== 'undefined') {
    (window as any).__gesuPersona = {
        getActivePersona,
        setActivePersona,
        subscribe
    };
}
