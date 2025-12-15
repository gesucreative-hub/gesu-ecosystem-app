import fs from 'node:fs/promises';
import path from 'node:path';
import { assertPathWithin } from './scaffolding.js';

/**
 * Compass Snapshots Module
 * Manages append-only persistence of Compass calibration snapshots
 */

const BACKUP_ROOT = String.raw`D:\03. Resources\_Gesu's\Backup\WorkFlowDatabase-ps-stack-v1`;

/**
 * Appends a snapshot to the centralized CompassSnapshots.jsonl file
 * @param {string} workflowRoot - Workflow root directory
 * @param {Object} snapshot - Snapshot data to append
 */
export async function appendSnapshot(workflowRoot, snapshot) {
    try {
        // Validate workflowRoot
        if (!workflowRoot || workflowRoot.trim() === '') {
            throw new Error('Workflow root not configured');
        }

        await assertPathWithin(workflowRoot, workflowRoot);

        // _Index directory path
        const indexDir = path.join(workflowRoot, '_Index');
        const snapshotsPath = path.join(indexDir, 'CompassSnapshots.jsonl');

        // Validate snapshots path within workflowRoot
        await assertPathWithin(workflowRoot, snapshotsPath);

        // Create _Index directory if missing
        try {
            await fs.mkdir(indexDir, { recursive: true });
        } catch (err) {
            console.error('[compass-snapshots] Failed to create _Index:', err);
        }

        // Create snapshot entry with timestamp
        const snapshotEntry = {
            ...snapshot,
            timestamp: snapshot.timestamp || new Date().toISOString(),
            id: snapshot.id || `snapshot-${Date.now()}`
        };

        const snapshotLine = JSON.stringify(snapshotEntry) + '\n';

        // Append to snapshots file (create if doesn't exist)
        await fs.appendFile(snapshotsPath, snapshotLine, 'utf-8');

        console.log('[compass-snapshots] Appended snapshot:', snapshotEntry.id);
        return { ok: true, snapshot: snapshotEntry };
    } catch (err) {
        console.error('[compass-snapshots] Failed to append snapshot:', err);
        return { ok: false, error: err.message };
    }
}

/**
 * Lists snapshots from the CompassSnapshots.jsonl file
 * @param {string} workflowRoot - Workflow root directory
 * @param {Object} options - Options { limit: number }
 * @returns {Promise<Array>} Array of snapshots, newest first
 */
export async function listSnapshots(workflowRoot, { limit = 10 } = {}) {
    try {
        if (!workflowRoot || workflowRoot.trim() === '') {
            return [];
        }

        await assertPathWithin(workflowRoot, workflowRoot);

        const snapshotsPath = path.join(workflowRoot, '_Index', 'CompassSnapshots.jsonl');

        // Validate path
        await assertPathWithin(workflowRoot, snapshotsPath);

        // Check if file exists
        try {
            await fs.access(snapshotsPath);
        } catch (err) {
            // File doesn't exist yet, return empty array
            return [];
        }

        // Read file content
        const content = await fs.readFile(snapshotsPath, 'utf-8');

        // Parse JSONL (one JSON object per line)
        const lines = content.trim().split('\n').filter(line => line.trim());
        const snapshots = [];

        for (const line of lines) {
            try {
                const snapshot = JSON.parse(line);
                snapshots.push(snapshot);
            } catch (err) {
                console.warn('[compass-snapshots] Failed to parse line:', err);
                // Skip invalid lines
            }
        }

        // Sort by timestamp (newest first) and limit
        snapshots.sort((a, b) => {
            const timeA = new Date(a.timestamp).getTime();
            const timeB = new Date(b.timestamp).getTime();
            return timeB - timeA;
        });

        return snapshots.slice(0, limit);
    } catch (err) {
        console.error('[compass-snapshots] Failed to list snapshots:', err);
        return [];
    }
}
