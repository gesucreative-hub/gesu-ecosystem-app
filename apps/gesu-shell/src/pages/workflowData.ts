// Workflow Data Model - Static MVP Data for Project Hub
// This file contains the swimlane phases, workflow nodes, and their connections.

export type WorkflowPhase = 'planning' | 'design' | 'frontend' | 'backend' | 'ops';

export type NodeStatus = 'todo' | 'in-progress' | 'done';

export interface WorkflowNode {
    id: string;
    phase: WorkflowPhase;
    title: string;
    description: string;
    status: NodeStatus;
    /** Grid position within the phase swimlane (row index) */
    row: number;
}

export interface WorkflowEdge {
    id: string;
    from: string; // node id
    to: string;   // node id
}

// --- Phase Configuration ---
export const WORKFLOW_PHASES: { id: WorkflowPhase; label: string; color: string }[] = [
    { id: 'planning', label: 'Planning', color: '#6366f1' },      // Indigo
    { id: 'design', label: 'Design', color: '#8b5cf6' },          // Purple
    { id: 'frontend', label: 'Frontend', color: '#06b6d4' },      // Cyan
    { id: 'backend', label: 'Backend', color: '#10b981' },        // Emerald
    { id: 'ops', label: 'Ops & Quality', color: '#f59e0b' },      // Amber
];

// --- Static Workflow Nodes (MVP) ---
export const WORKFLOW_NODES: WorkflowNode[] = [
    // Planning Phase
    { id: 'p1', phase: 'planning', title: 'Define Requirements', description: 'Gather and document project requirements', status: 'done', row: 0 },
    { id: 'p2', phase: 'planning', title: 'Create Wireframes', description: 'Sketch initial UI concepts', status: 'done', row: 1 },
    { id: 'p3', phase: 'planning', title: 'Technical Spec', description: 'Write architecture document', status: 'in-progress', row: 2 },

    // Design Phase
    { id: 'd1', phase: 'design', title: 'Design System', description: 'Establish tokens and components', status: 'done', row: 0 },
    { id: 'd2', phase: 'design', title: 'UI Mockups', description: 'Create high-fidelity designs', status: 'in-progress', row: 1 },
    { id: 'd3', phase: 'design', title: 'Prototype', description: 'Build interactive prototype', status: 'todo', row: 2 },

    // Frontend Phase
    { id: 'f1', phase: 'frontend', title: 'Setup Project', description: 'Initialize React + TypeScript', status: 'done', row: 0 },
    { id: 'f2', phase: 'frontend', title: 'Core Components', description: 'Build reusable UI components', status: 'done', row: 1 },
    { id: 'f3', phase: 'frontend', title: 'Page Implementation', description: 'Implement all page views', status: 'in-progress', row: 2 },
    { id: 'f4', phase: 'frontend', title: 'State Management', description: 'Setup global state/context', status: 'todo', row: 3 },

    // Backend Phase
    { id: 'b1', phase: 'backend', title: 'API Design', description: 'Define API contracts', status: 'done', row: 0 },
    { id: 'b2', phase: 'backend', title: 'Database Schema', description: 'Design data models', status: 'in-progress', row: 1 },
    { id: 'b3', phase: 'backend', title: 'Endpoints', description: 'Implement API endpoints', status: 'todo', row: 2 },

    // Ops & Quality Phase
    { id: 'o1', phase: 'ops', title: 'CI/CD Setup', description: 'Configure build pipeline', status: 'todo', row: 0 },
    { id: 'o2', phase: 'ops', title: 'Testing', description: 'Write unit and integration tests', status: 'todo', row: 1 },
    { id: 'o3', phase: 'ops', title: 'Documentation', description: 'Create user and dev docs', status: 'todo', row: 2 },
];

// --- Edges (Connections) ---
export const WORKFLOW_EDGES: WorkflowEdge[] = [
    // Planning flow
    { id: 'e1', from: 'p1', to: 'p2' },
    { id: 'e2', from: 'p2', to: 'p3' },

    // Planning to Design
    { id: 'e3', from: 'p2', to: 'd1' },
    { id: 'e4', from: 'p3', to: 'd2' },

    // Design flow
    { id: 'e5', from: 'd1', to: 'd2' },
    { id: 'e6', from: 'd2', to: 'd3' },

    // Design to Frontend
    { id: 'e7', from: 'd1', to: 'f1' },
    { id: 'e8', from: 'd2', to: 'f2' },
    { id: 'e9', from: 'd3', to: 'f3' },

    // Frontend flow
    { id: 'e10', from: 'f1', to: 'f2' },
    { id: 'e11', from: 'f2', to: 'f3' },
    { id: 'e12', from: 'f3', to: 'f4' },

    // Backend flow
    { id: 'e13', from: 'b1', to: 'b2' },
    { id: 'e14', from: 'b2', to: 'b3' },

    // Cross-phase dependencies
    { id: 'e15', from: 'p3', to: 'b1' },
    { id: 'e16', from: 'f4', to: 'b3' },

    // To Ops
    { id: 'e17', from: 'f1', to: 'o1' },
    { id: 'e18', from: 'f3', to: 'o2' },
    { id: 'e19', from: 'b3', to: 'o2' },
    { id: 'e20', from: 'o2', to: 'o3' },
];

// --- Layout Constants ---
export const CANVAS_CONFIG = {
    nodeWidth: 200,
    nodeHeight: 80,
    nodeGapX: 40,
    nodeGapY: 20,
    swimlaneHeaderHeight: 48,
    swimlanePadding: 16,
};
