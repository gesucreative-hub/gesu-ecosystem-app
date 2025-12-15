/**
 * Compass Snapshots Service
 * 
 * Provides a unified interface for compass snapshot persistence with automatic
 * fallback from file-backed (Electron) to localStorage (web/simulation).
 * 
 * Bridge Mode (Desktop): Uses window.gesu.compassSnapshots -> saves to workflowRoot/_Index/CompassSnapshots.jsonl
 * Fallback Mode (Web/Simulation): Uses compassSnapshotStore -> saves to localStorage
 */

import {
    saveSnapshot as saveToLocalStorage,
    getAllSnapshots as getFromLocalStorage,
} from '../stores/compassSnapshotStore';

export interface CompassSnapshotData {
    energy: number;
    focus: number; // Derived from focusAreas average
    sessions: string[]; // Session labels only
    timestamp?: string;
    id?: string;
}

export interface CompassSnapshotListItem {
    id: string;
    timestamp: string;
    energy: number;
    focus: number;
    sessions: string[];
}

export interface AppendResult {
    ok: boolean;
    snapshot?: CompassSnapshotListItem;
    error?: string;
}

/**
 * Check if Electron bridge is available and configured
 */
export function hasBridge(workflowRoot: string | undefined): boolean {
    return !!(window.gesu?.compassSnapshots && workflowRoot && workflowRoot.trim() !== '');
}

/**
 * List recent snapshots (newest first)
 * 
 * @param workflowRoot - Workflow root from settings (required for bridge mode)
 * @param limit - Maximum number of snapshots to return (default: 10)
 */
export async function listSnapshots(
    workflowRoot: string | undefined,
    limit: number = 10
): Promise<CompassSnapshotListItem[]> {
    try {
        if (hasBridge(workflowRoot)) {
            // Bridge mode: Use file-backed storage
            const snapshots = await window.gesu!.compassSnapshots!.list({ limit });
            return snapshots; // Already sorted newest-first by backend
        } else {
            // Fallback mode: Use localStorage
            const snapshots = getFromLocalStorage().slice(0, limit);

            // Transform to match bridge format
            return snapshots.map(snap => ({
                id: snap.id,
                timestamp: new Date(snap.createdAt).toISOString(),
                energy: snap.energy,
                // Focus: Derive from focusAreas average (meaningful representation)
                focus: Math.round(
                    Object.values(snap.focusAreas).reduce((sum, val) => sum + val, 0) /
                    Object.values(snap.focusAreas).length
                ),
                sessions: snap.sessions.map(s => s.label),
            }));
        }
    } catch (err) {
        console.error('[compassSnapshotsService] Failed to list snapshots:', err);
        return []; // Never crash UI
    }
}

/**
 * Append a new snapshot
 * 
 * @param workflowRoot - Workflow root from settings (required for bridge mode)
 * @param snapshot - Snapshot data to save
 */
export async function appendSnapshot(
    workflowRoot: string | undefined,
    snapshot: CompassSnapshotData
): Promise<AppendResult> {
    try {
        if (hasBridge(workflowRoot)) {
            // Bridge mode: Use file-backed storage
            const result = await window.gesu!.compassSnapshots!.append({
                energy: snapshot.energy,
                focus: snapshot.focus,
                sessions: snapshot.sessions,
                timestamp: snapshot.timestamp,
                id: snapshot.id,
            });

            if (result.ok && result.snapshot) {
                return {
                    ok: true,
                    snapshot: result.snapshot,
                };
            } else {
                return {
                    ok: false,
                    error: result.error || 'Unknown error during append',
                };
            }
        } else {
            // Fallback mode: Use localStorage
            // Transform back to localStorage format
            const saved = saveToLocalStorage({
                energy: snapshot.energy,
                focusAreas: {
                    // Reconstruct focusAreas with uniform values (focus derived earlier)
                    // Note: This is a limitation of fallback mode - we don't preserve individual focus areas
                    'Money': snapshot.focus,
                    'Creative': snapshot.focus,
                    'Relations': snapshot.focus,
                    'Learning': snapshot.focus,
                    'Content': snapshot.focus,
                    'Self Care': snapshot.focus,
                },
                sessions: snapshot.sessions.map((label, idx) => ({
                    id: `session-${idx}`,
                    label,
                    completed: true, // Assume saved sessions are completed
                })),
            });

            return {
                ok: true,
                snapshot: {
                    id: saved.id,
                    timestamp: new Date(saved.createdAt).toISOString(),
                    energy: saved.energy,
                    focus: snapshot.focus,
                    sessions: snapshot.sessions,
                },
            };
        }
    } catch (err) {
        console.error('[compassSnapshotsService] Failed to append snapshot:', err);
        return {
            ok: false,
            error: err instanceof Error ? err.message : 'Unknown error',
        };
    }
}

/**
 * Get storage mode label for UI display
 */
export function getStorageMode(workflowRoot: string | undefined): 'file-backed' | 'simulation' {
    return hasBridge(workflowRoot) ? 'file-backed' : 'simulation';
}
