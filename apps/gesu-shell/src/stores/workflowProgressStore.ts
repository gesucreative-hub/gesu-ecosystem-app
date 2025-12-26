// Workflow Progress Store - Persists workflow progress per project
// Overlays status/DoD completion on static WORKFLOW_NODES

import { WorkflowNode, DoDItem, NodeStatus } from '../pages/workflowData';
import { getActiveProjectId } from './projectStore';
import { recordTaskCompletion } from '../services/activityTrackingService';

export interface NodeProgress {
    status: NodeStatus;
    dodChecklist: { [dodItemId: string]: boolean }; // id -> done
}

export interface WorkflowProgress {
    nodeProgress: { [nodeId: string]: NodeProgress };
    lastUpdatedAt: number;
}

interface WorkflowProgressState {
    schemaVersion: number;
    progressByProject: { [projectId: string]: WorkflowProgress };
}

const STORAGE_KEY = 'gesu-workflow-progress';
const CURRENT_SCHEMA_VERSION = 1;

// --- Storage ---

import {
    readRaw,
    parse,
    detectVersion,
    createBackupSnapshot,
    registerSchemaWarning
} from '../services/persistence/safeMigration';

function loadState(): WorkflowProgressState {
    const defaultState = { schemaVersion: CURRENT_SCHEMA_VERSION, progressByProject: {} };
    
    try {
        const raw = readRaw(STORAGE_KEY);
        if (!raw) {
            return defaultState;
        }

        const parseResult = parse<WorkflowProgressState>(raw);
        
        if (!parseResult.success) {
            // CORRUPT: backup + warning, DO NOT reset localStorage
            void createBackupSnapshot(STORAGE_KEY, raw, { reason: 'corrupt' })
                .then(filename => registerSchemaWarning(STORAGE_KEY, 'CORRUPT', filename || undefined))
                .catch(err => console.error('[workflowProgressStore] Backup failed:', err));
            console.warn('[workflowProgressStore] Parse failed, data preserved. NOT resetting.');
            return defaultState;
        }

        const parsed = parseResult.data!;
        const version = detectVersion(parsed);

        // FUTURE_VERSION or unknown: DO NOT reset, preserve data
        if (version !== CURRENT_SCHEMA_VERSION) {
            void createBackupSnapshot(STORAGE_KEY, raw, { 
                reason: version && version > CURRENT_SCHEMA_VERSION ? 'future-version' : 'unknown-version',
                fromVersion: version || undefined 
            })
                .then(filename => {
                    registerSchemaWarning(
                        STORAGE_KEY, 
                        version && version > CURRENT_SCHEMA_VERSION ? 'FUTURE_VERSION' : 'CORRUPT',
                        filename || undefined
                    );
                })
                .catch(err => console.error('[workflowProgressStore] Backup failed:', err));
            console.warn(`[workflowProgressStore] Schema v${version} not current. Data preserved, NOT resetting.`);
            return defaultState;
        }

        return parsed;
    } catch (err) {
        console.error('[workflowProgressStore] Unexpected error:', err);
        return defaultState;
    }
}

function saveState(state: WorkflowProgressState): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// --- Public API ---

export function getProgressForProject(projectId: string): WorkflowProgress | null {
    const state = loadState();
    return state.progressByProject[projectId] || null;
}

export function getActiveProgress(): WorkflowProgress | null {
    const projectId = getActiveProjectId();
    if (!projectId) return null;
    return getProgressForProject(projectId);
}

export function setNodeStatus(nodeId: string, status: NodeStatus): void {
    const projectId = getActiveProjectId();
    if (!projectId) return;

    const state = loadState();
    if (!state.progressByProject[projectId]) {
        state.progressByProject[projectId] = { nodeProgress: {}, lastUpdatedAt: Date.now() };
    }

    const progress = state.progressByProject[projectId];
    if (!progress.nodeProgress[nodeId]) {
        progress.nodeProgress[nodeId] = { status, dodChecklist: {} };
    } else {
        progress.nodeProgress[nodeId].status = status;
    }
    progress.lastUpdatedAt = Date.now();

    saveState(state);
}

export function toggleDoDItem(nodeId: string, dodItemId: string, totalDoDItems?: number): boolean {
    const projectId = getActiveProjectId();
    if (!projectId) return false;

    const state = loadState();
    if (!state.progressByProject[projectId]) {
        state.progressByProject[projectId] = { nodeProgress: {}, lastUpdatedAt: Date.now() };
    }

    const progress = state.progressByProject[projectId];
    if (!progress.nodeProgress[nodeId]) {
        progress.nodeProgress[nodeId] = { status: 'todo', dodChecklist: {} };
    }

    const node = progress.nodeProgress[nodeId];
    const currentValue = node.dodChecklist[dodItemId] || false;
    const newValue = !currentValue;
    node.dodChecklist[dodItemId] = newValue;
    progress.lastUpdatedAt = Date.now();

    // Auto-update node status based on DoD completion
    const checkedItems = Object.values(node.dodChecklist).filter(Boolean).length;
    const wasComplete = node.status === 'done';
    
    if (totalDoDItems && checkedItems === totalDoDItems) {
        node.status = 'done';
    } else if (checkedItems > 0) {
        node.status = 'in-progress';
    } else {
        node.status = 'todo';
    }

    const isNowComplete = node.status === 'done';

    saveState(state);

    // Create unique IDs for gamification tracking
    const taskId = `${projectId}:${nodeId}:${dodItemId}`;
    const stepId = `${projectId}:${nodeId}:step-complete`;

    // Track completion if marked done - XP only awarded ONCE per task ever
    if (newValue) {
        recordTaskCompletion(dodItemId).catch(err => console.error('[Workflow] Failed to record completion:', err));

        // Award XP for completing DoD item - only if not already rewarded (one-time)
        import('../stores/gamificationStore').then(({ hasTaskBeenRewarded, markTaskRewarded }) => {
            if (!hasTaskBeenRewarded(taskId)) {
                import('../services/gamificationService').then(({ onDoDItemComplete, onWorkflowStepComplete }) => {
                    onDoDItemComplete(dodItemId);
                    markTaskRewarded(taskId);

                    // Check if this completion finished the entire step
                    if (!wasComplete && isNowComplete && !hasTaskBeenRewarded(stepId)) {
                        onWorkflowStepComplete(nodeId);
                        markTaskRewarded(stepId);
                        console.log('[Workflow] Step complete bonus!', nodeId);
                    }
                }).catch(err => console.error('[Workflow] Gamification failed:', err));
            } else {
                console.log('[Workflow] Task already rewarded, skipping XP:', taskId);
            }
        }).catch(err => console.error('[Workflow] Gamification check failed:', err));
    }
    // Note: We do NOT unmark tasks when unchecked - XP is a one-time reward

    return node.dodChecklist[dodItemId];
}

export function isDoDItemDone(nodeId: string, dodItemId: string): boolean {
    const progress = getActiveProgress();
    if (!progress) return false;
    return progress.nodeProgress[nodeId]?.dodChecklist[dodItemId] || false;
}

export function getNodeStatus(nodeId: string, defaultStatus: NodeStatus): NodeStatus {
    const progress = getActiveProgress();
    if (!progress) return defaultStatus;
    return progress.nodeProgress[nodeId]?.status || defaultStatus;
}

export function markNodeDone(nodeId: string): void {
    setNodeStatus(nodeId, 'done');
}

export function markNodeInProgress(nodeId: string): void {
    setNodeStatus(nodeId, 'in-progress');
}

// Set all DoD items as done for a node
export function setAllDoDItemsDone(nodeId: string, dodItemIds: string[]): void {
    const projectId = getActiveProjectId();
    if (!projectId) return;

    const state = loadState();
    if (!state.progressByProject[projectId]) {
        state.progressByProject[projectId] = { nodeProgress: {}, lastUpdatedAt: Date.now() };
    }

    const progress = state.progressByProject[projectId];
    if (!progress.nodeProgress[nodeId]) {
        progress.nodeProgress[nodeId] = { status: 'done', dodChecklist: {} };
    }

    // Mark all DoD items as done
    dodItemIds.forEach(id => {
        // Only record if not already done
        if (!progress.nodeProgress[nodeId].dodChecklist[id]) {
            recordTaskCompletion(id).catch(err => console.error('[Workflow] Failed to record completion:', err));
        }
        progress.nodeProgress[nodeId].dodChecklist[id] = true;
    });
    progress.nodeProgress[nodeId].status = 'done';
    progress.lastUpdatedAt = Date.now();

    saveState(state);
}

// Clear all DoD items (mark as undone) for a node
export function clearAllDoDItems(nodeId: string, dodItemIds: string[]): void {
    const projectId = getActiveProjectId();
    if (!projectId) return;

    const state = loadState();
    if (!state.progressByProject[projectId]) {
        state.progressByProject[projectId] = { nodeProgress: {}, lastUpdatedAt: Date.now() };
    }

    const progress = state.progressByProject[projectId];
    if (!progress.nodeProgress[nodeId]) {
        progress.nodeProgress[nodeId] = { status: 'in-progress', dodChecklist: {} };
    }

    // Mark all DoD items as undone
    dodItemIds.forEach(id => {
        progress.nodeProgress[nodeId].dodChecklist[id] = false;
    });
    progress.nodeProgress[nodeId].status = 'in-progress';
    progress.lastUpdatedAt = Date.now();

    saveState(state);
}

// --- Merge with Static Data ---

export function mergeNodesWithProgress(staticNodes: WorkflowNode[], progressOverride?: WorkflowProgress | null): WorkflowNode[] {
    const progress = progressOverride !== undefined ? progressOverride : getActiveProgress();
    if (!progress) return staticNodes;

    return staticNodes.map(node => {
        const nodeProgress = progress.nodeProgress[node.id];
        if (!nodeProgress) return node;

        // Overlay DoD done states
        const mergedDoD: DoDItem[] = node.dodChecklist.map(item => ({
            ...item,
            done: nodeProgress.dodChecklist[item.id] ?? item.done,
        }));

        // Compute status based on DoD completion
        const checkedCount = mergedDoD.filter(item => item.done).length;
        const totalCount = mergedDoD.length;
        
        let computedStatus: NodeStatus;
        if (totalCount > 0) {
            if (checkedCount === totalCount) {
                computedStatus = 'done';
            } else if (checkedCount > 0) {
                computedStatus = 'in-progress';
            } else {
                computedStatus = 'todo';
            }
        } else {
            // No DoD items, use stored status
            computedStatus = nodeProgress.status || node.status;
        }

        return {
            ...node,
            status: computedStatus,
            dodChecklist: mergedDoD,
        };
    });
}

export function clearProgressForProject(projectId: string): void {
    const state = loadState();
    delete state.progressByProject[projectId];
    saveState(state);
}
