/**
 * Safe Migration Service (S0-1)
 * 
 * Provides backup-before-migration for all versioned persisted stores.
 * NEVER resets/wipes data on unknown or newer schemaVersion.
 * 
 * Storage strategy:
 * - PRIMARY: Filesystem under Electron userData (via window.gesu.schemaBackups)
 * - FALLBACK: localStorage backup key when FS API not available
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type LoadStatus = 'OK' | 'EMPTY' | 'MIGRATION_NEEDED' | 'FUTURE_VERSION' | 'CORRUPT';

export interface LoadResult<T> {
    status: LoadStatus;
    raw: string | null;
    parsed: T | null;
    version: number | null;
    backupFilename?: string;
    error?: string;
}

export interface SchemaWarning {
    storeKey: string;
    status: 'FUTURE_VERSION' | 'CORRUPT';
    backupFilename?: string;
    timestamp: number;
    message: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Warning Registry (in-memory for current session)
// ─────────────────────────────────────────────────────────────────────────────

const warnings: SchemaWarning[] = [];
const warningSubscribers = new Set<() => void>();

export function getSchemaWarnings(): SchemaWarning[] {
    return [...warnings];
}

export function registerSchemaWarning(
    storeKey: string,
    status: 'FUTURE_VERSION' | 'CORRUPT',
    backupFilename?: string
): void {
    const message = status === 'FUTURE_VERSION'
        ? `Data for "${storeKey}" has a newer schema version. Original preserved in backup.`
        : `Data for "${storeKey}" appears corrupted. Original preserved in backup.`;
    
    warnings.push({
        storeKey,
        status,
        backupFilename,
        timestamp: Date.now(),
        message
    });
    
    console.warn(`[safeMigration] ${message}`);
    notifyWarningSubscribers();
}

export function clearSchemaWarning(storeKey: string): void {
    const index = warnings.findIndex(w => w.storeKey === storeKey);
    if (index >= 0) {
        warnings.splice(index, 1);
        notifyWarningSubscribers();
    }
}

export function subscribeToWarnings(callback: () => void): () => void {
    warningSubscribers.add(callback);
    return () => warningSubscribers.delete(callback);
}

function notifyWarningSubscribers(): void {
    warningSubscribers.forEach(cb => cb());
}

// ─────────────────────────────────────────────────────────────────────────────
// Backup Functions
// ─────────────────────────────────────────────────────────────────────────────

const LOCALSTORAGE_BACKUP_PREFIX = 'gesu-backup-';
const MAX_LOCALSTORAGE_BACKUPS_PER_STORE = 10;

/**
 * Create a backup of raw store data.
 * Uses FS-primary storage (Electron userData) with localStorage fallback.
 * 
 * @returns backup filename if successful
 */
export async function createBackupSnapshot(
    storeKey: string,
    rawData: string,
    meta?: { reason?: string; fromVersion?: number; toVersion?: number }
): Promise<string | null> {
    // Try FS-primary first (Electron)
    if (window.gesu?.schemaBackups?.create) {
        try {
            const result = await window.gesu.schemaBackups.create({
                storeKey,
                rawData,
                meta: meta || {}
            });
            
            if (result.ok && result.filename) {
                console.log(`[safeMigration] FS backup created: ${result.filename}`);
                return result.filename;
            } else {
                console.warn('[safeMigration] FS backup failed, falling back to localStorage', result.error);
            }
        } catch (err) {
            console.warn('[safeMigration] FS backup error, falling back to localStorage', err);
        }
    }
    
    // Fallback: localStorage backup
    return createLocalStorageBackup(storeKey, rawData, meta);
}

/**
 * Create localStorage backup (fallback when FS not available)
 */
function createLocalStorageBackup(
    storeKey: string,
    rawData: string,
    meta?: object
): string {
    const timestamp = Date.now();
    const backupKey = `${LOCALSTORAGE_BACKUP_PREFIX}${storeKey}-${timestamp}`;
    
    const backupPayload = {
        storeKey,
        timestamp,
        meta: meta || {},
        rawData
    };
    
    try {
        localStorage.setItem(backupKey, JSON.stringify(backupPayload));
        console.log(`[safeMigration] localStorage backup created: ${backupKey}`);
        
        // Enforce retention
        enforceLocalStorageRetention(storeKey);
        
        return backupKey;
    } catch (err) {
        console.error('[safeMigration] localStorage backup failed:', err);
        return backupKey; // Return key anyway for reference
    }
}

/**
 * Enforce localStorage backup retention (keep last 10 per store)
 */
function enforceLocalStorageRetention(storeKey: string): void {
    const prefix = `${LOCALSTORAGE_BACKUP_PREFIX}${storeKey}-`;
    const backupKeys: { key: string; timestamp: number }[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
            const match = key.match(/-(\d+)$/);
            if (match) {
                backupKeys.push({ key, timestamp: parseInt(match[1], 10) });
            }
        }
    }
    
    // Sort newest first
    backupKeys.sort((a, b) => b.timestamp - a.timestamp);
    
    // Delete oldest beyond limit
    if (backupKeys.length > MAX_LOCALSTORAGE_BACKUPS_PER_STORE) {
        const toDelete = backupKeys.slice(MAX_LOCALSTORAGE_BACKUPS_PER_STORE);
        for (const backup of toDelete) {
            localStorage.removeItem(backup.key);
            console.log(`[safeMigration] Deleted old localStorage backup: ${backup.key}`);
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Core Safe Load Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Read raw string from localStorage
 */
export function readRaw(storeKey: string): string | null {
    try {
        return localStorage.getItem(storeKey);
    } catch (err) {
        console.error('[safeMigration] readRaw failed:', err);
        return null;
    }
}

/**
 * Parse raw JSON string safely
 */
export function parse<T>(raw: string): { success: boolean; data: T | null; error?: string } {
    try {
        const data = JSON.parse(raw) as T;
        return { success: true, data };
    } catch (err) {
        return { success: false, data: null, error: (err as Error).message };
    }
}

/**
 * Detect schemaVersion from parsed data
 */
export function detectVersion(data: unknown): number | null {
    if (data && typeof data === 'object' && 'schemaVersion' in data) {
        const version = (data as { schemaVersion: unknown }).schemaVersion;
        if (typeof version === 'number') {
            return version;
        }
    }
    return null;
}

/**
 * Classify load result status based on version comparison
 */
export function classify(
    version: number | null,
    supportedVersions: number[]
): LoadStatus {
    if (version === null) {
        // No version detected - could be legacy or corrupt
        return 'CORRUPT';
    }
    
    const maxSupported = Math.max(...supportedVersions);
    
    if (version > maxSupported) {
        return 'FUTURE_VERSION';
    }
    
    if (version < maxSupported && supportedVersions.includes(version)) {
        return 'MIGRATION_NEEDED';
    }
    
    if (version === maxSupported) {
        return 'OK';
    }
    
    // Version is below all supported versions or not in list
    return 'CORRUPT';
}

/**
 * Safe load function - the main entry point for stores.
 * 
 * @param storeKey - localStorage key
 * @param currentVersion - the current/latest supported schema version
 * @param supportedVersions - array of all versions that can be migrated (default: [currentVersion])
 * @returns LoadResult with status, parsed data, and backup info
 */
export async function safeLoad<T extends { schemaVersion: number }>(
    storeKey: string,
    currentVersion: number,
    supportedVersions?: number[]
): Promise<LoadResult<T>> {
    const versions = supportedVersions || [currentVersion];
    
    // 1. Read raw
    const raw = readRaw(storeKey);
    
    if (!raw) {
        return { status: 'EMPTY', raw: null, parsed: null, version: null };
    }
    
    // 2. Parse
    const parseResult = parse<T>(raw);
    
    if (!parseResult.success) {
        // CORRUPT: Create backup, register warning, DO NOT write back
        const backupFilename = await createBackupSnapshot(storeKey, raw, { reason: 'corrupt' });
        registerSchemaWarning(storeKey, 'CORRUPT', backupFilename || undefined);
        
        return {
            status: 'CORRUPT',
            raw,
            parsed: null,
            version: null,
            backupFilename: backupFilename || undefined,
            error: parseResult.error
        };
    }
    
    // 3. Detect version
    const version = detectVersion(parseResult.data);
    
    // 4. Classify
    const status = classify(version, versions);
    
    // 5. Handle based on status
    if (status === 'FUTURE_VERSION') {
        // FUTURE_VERSION: Create backup, register warning, DO NOT write back
        const backupFilename = await createBackupSnapshot(storeKey, raw, {
            reason: 'future-version',
            fromVersion: version || undefined
        });
        registerSchemaWarning(storeKey, 'FUTURE_VERSION', backupFilename || undefined);
        
        return {
            status: 'FUTURE_VERSION',
            raw,
            parsed: parseResult.data,
            version,
            backupFilename: backupFilename || undefined
        };
    }
    
    if (status === 'CORRUPT') {
        // Version detected but not in supported list
        const backupFilename = await createBackupSnapshot(storeKey, raw, {
            reason: 'unsupported-version',
            fromVersion: version || undefined
        });
        registerSchemaWarning(storeKey, 'CORRUPT', backupFilename || undefined);
        
        return {
            status: 'CORRUPT',
            raw,
            parsed: parseResult.data,
            version,
            backupFilename: backupFilename || undefined
        };
    }
    
    // OK or MIGRATION_NEEDED - return with data
    return {
        status,
        raw,
        parsed: parseResult.data,
        version
    };
}

/**
 * Write to localStorage only after creating backup.
 * Use this for migration writes.
 */
export async function writeAfterBackup(
    storeKey: string,
    newValue: string,
    oldRaw: string,
    backupMeta?: object
): Promise<{ ok: boolean; backupFilename?: string }> {
    // Create backup first
    const backupFilename = await createBackupSnapshot(storeKey, oldRaw, backupMeta);
    
    // Now write new value
    try {
        localStorage.setItem(storeKey, newValue);
        return { ok: true, backupFilename: backupFilename || undefined };
    } catch (err) {
        console.error('[safeMigration] writeAfterBackup failed:', err);
        return { ok: false, backupFilename: backupFilename || undefined };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility: Check if running in Electron with FS backup support
// ─────────────────────────────────────────────────────────────────────────────

export function hasElectronBackupSupport(): boolean {
    return Boolean(window.gesu?.schemaBackups?.create);
}

export async function getBackupsPath(): Promise<string | null> {
    if (window.gesu?.schemaBackups?.getPath) {
        try {
            return await window.gesu.schemaBackups.getPath();
        } catch {
            return null;
        }
    }
    return null;
}
