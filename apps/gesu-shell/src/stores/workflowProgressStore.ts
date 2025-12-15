// Workflow Progress Store - Persists workflow progress per project
// Overlays status/DoD completion on static WORKFLOW_NODES

import { WorkflowNode, DoDItem, NodeStatus } from '../pages/workflowData';
import { getActiveProjectId } from './projectStore';

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

function loadState(): WorkflowProgressState {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return { schemaVersion: CURRENT_SCHEMA_VERSION, progressByProject: {} };
        }

        const parsed: WorkflowProgressState = JSON.parse(raw);

        if (parsed.schemaVersion !== CURRENT_SCHEMA_VERSION) {
            console.warn('Workflow progress schema mismatch. Resetting.');
            return { schemaVersion: CURRENT_SCHEMA_VERSION, progressByProject: {} };
        }

        return parsed;
    } catch {
        return { schemaVersion: CURRENT_SCHEMA_VERSION, progressByProject: {} };
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

export function toggleDoDItem(nodeId: string, dodItemId: string): boolean {
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
    node.dodChecklist[dodItemId] = !currentValue;
    progress.lastUpdatedAt = Date.now();

    saveState(state);
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

// --- Merge with Static Data ---

export function mergeNodesWithProgress(staticNodes: WorkflowNode[]): WorkflowNode[] {
    const progress = getActiveProgress();
    if (!progress) return staticNodes;

    return staticNodes.map(node => {
        const nodeProgress = progress.nodeProgress[node.id];
        if (!nodeProgress) return node;

        // Overlay status
        const mergedStatus = nodeProgress.status;

        // Overlay DoD done states
        const mergedDoD: DoDItem[] = node.dodChecklist.map(item => ({
            ...item,
            done: nodeProgress.dodChecklist[item.id] ?? item.done,
        }));

        return {
            ...node,
            status: mergedStatus,
            dodChecklist: mergedDoD,
        };
    });
}

export function clearProgressForProject(projectId: string): void {
    const state = loadState();
    delete state.progressByProject[projectId];
    saveState(state);
}
