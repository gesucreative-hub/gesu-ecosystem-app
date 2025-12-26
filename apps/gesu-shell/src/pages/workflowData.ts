// Workflow Data Model - Static MVP Data for Project Hub
// This file contains the swimlane phases, workflow nodes, and their connections.

export type WorkflowPhase = 'planning' | 'execution' | 'finalize' | 'design' | 'frontend' | 'backend' | 'ops';

export type NodeStatus = 'todo' | 'in-progress' | 'done';

export interface DoDItem {
    id: string;
    label: string;
    done: boolean;
}

export interface WorkflowNode {
    id: string;
    phase: WorkflowPhase;
    title: string;
    description: string;
    /** i18n key for title (optional, falls back to title) */
    titleKey?: string;
    /** i18n key for description (optional, falls back to description) */
    descKey?: string;
    status: NodeStatus;
    /** Grid position within the phase swimlane (row index) */
    row: number;
    /** Definition of Done checklist items */
    dodChecklist: DoDItem[];
    /** Recommended tools (optional) */
    tools?: string[];
}

export interface WorkflowEdge {
    id: string;
    from: string; // node id
    to: string;   // node id
}

// --- Phase Configuration ---
export const WORKFLOW_PHASES: { id: WorkflowPhase; label: string; labelKey?: string; color: string }[] = [
    { id: 'planning', label: 'Planning', labelKey: 'initiator:workflow.phases.planning', color: '#6366f1' },
    { id: 'design', label: 'Design', labelKey: 'initiator:workflow.phases.design', color: '#8b5cf6' },
    { id: 'frontend', label: 'Frontend', labelKey: 'initiator:workflow.phases.frontend', color: '#06b6d4' },
    { id: 'backend', label: 'Backend', labelKey: 'initiator:workflow.phases.backend', color: '#10b981' },
    { id: 'ops', label: 'Ops & Quality', labelKey: 'initiator:workflow.phases.ops', color: '#f59e0b' },
];

// --- Sprint 21.3 Phase 6: Default Phase Sets for Different Project Types ---
export interface PhaseSet {
    id: string;
    name: string;
    phases: { id: string; label: string; color: string }[];
}

export const DEFAULT_PHASE_SETS: PhaseSet[] = [
    {
        id: 'default',
        name: 'Default',
        phases: [
            { id: 'planning', label: 'Planning', color: '#6366f1' },       // Indigo
            { id: 'execution', label: 'Execution', color: '#06b6d4' },     // Cyan
            { id: 'finalize', label: 'Finalize', color: '#10b981' },       // Emerald
        ]
    },
    {
        id: 'development',
        name: 'Development',
        phases: [
            { id: 'requirements', label: 'Requirements', color: '#6366f1' },
            { id: 'design', label: 'Design', color: '#8b5cf6' },
            { id: 'development', label: 'Development', color: '#06b6d4' },
            { id: 'testing', label: 'Testing', color: '#10b981' },
            { id: 'deployment', label: 'Deployment', color: '#f59e0b' },
        ]
    },
    {
        id: 'content',
        name: 'Content Creator',
        phases: [
            { id: 'idea', label: 'Idea', color: '#6366f1' },
            { id: 'script', label: 'Script', color: '#8b5cf6' },
            { id: 'production', label: 'Production', color: '#06b6d4' },
            { id: 'edit', label: 'Edit', color: '#10b981' },
            { id: 'publish', label: 'Publish', color: '#f59e0b' },
        ]
    },
    {
        id: 'admin',
        name: 'Admin/Ops',
        phases: [
            { id: 'initiation', label: 'Initiation', color: '#6366f1' },
            { id: 'planning', label: 'Planning', color: '#8b5cf6' },
            { id: 'execution', label: 'Execution', color: '#06b6d4' },
            { id: 'review', label: 'Review', color: '#10b981' },
            { id: 'closure', label: 'Closure', color: '#f59e0b' },
        ]
    },
];

export function getPhaseSetById(id: string): PhaseSet {
    return DEFAULT_PHASE_SETS.find(ps => ps.id === id) || DEFAULT_PHASE_SETS[0];
}

// --- Static Workflow Nodes (Simplified Default Blueprint) ---
export const WORKFLOW_NODES: WorkflowNode[] = [
    // Planning Phase
    {
        id: 'p1', phase: 'planning', title: 'Requirements & Goals',
        titleKey: 'initiator:workflow.steps.p1.title',
        description: 'Define project scope, objectives, and success criteria',
        descKey: 'initiator:workflow.steps.p1.desc',
        status: 'todo', row: 0,
        dodChecklist: [
            { id: 'p1-1', label: 'Project goals documented', done: false },
            { id: 'p1-2', label: 'Stakeholder needs identified', done: false },
            { id: 'p1-3', label: 'Success metrics defined', done: false },
        ],
        tools: ['Notion', 'Google Docs']
    },
    {
        id: 'p2', phase: 'planning', title: 'Research & Brief',
        titleKey: 'initiator:workflow.steps.p2.title',
        description: 'Gather references, research, and create project brief',
        descKey: 'initiator:workflow.steps.p2.desc',
        status: 'todo', row: 1,
        dodChecklist: [
            { id: 'p2-1', label: 'References collected', done: false },
            { id: 'p2-2', label: 'Competitive analysis done', done: false },
            { id: 'p2-3', label: 'Creative brief written', done: false },
        ],
        tools: ['Pinterest', 'Notion']
    },
    {
        id: 'p3', phase: 'planning', title: 'Blueprint & Roadmap',
        titleKey: 'initiator:workflow.steps.p3.title',
        description: 'Create execution plan and timeline',
        descKey: 'initiator:workflow.steps.p3.desc',
        status: 'todo', row: 2,
        dodChecklist: [
            { id: 'p3-1', label: 'Milestones defined', done: false },
            { id: 'p3-2', label: 'Timeline created', done: false },
            { id: 'p3-3', label: 'Resources allocated', done: false },
        ],
        tools: ['Trello', 'Notion']
    },

    // Execution Phase
    {
        id: 'e1', phase: 'execution', title: 'Core Work',
        titleKey: 'initiator:workflow.steps.e1.title',
        description: 'Execute main deliverables and primary tasks',
        descKey: 'initiator:workflow.steps.e1.desc',
        status: 'todo', row: 0,
        dodChecklist: [
            { id: 'e1-1', label: 'Main assets created', done: false },
            { id: 'e1-2', label: 'Primary features implemented', done: false },
            { id: 'e1-3', label: 'Core functionality working', done: false },
        ],
        tools: ['Figma', 'VSCode', 'Premiere Pro']
    },
    {
        id: 'e2', phase: 'execution', title: 'Quality Check',
        titleKey: 'initiator:workflow.steps.e2.title',
        description: 'Test, debug, and ensure quality standards',
        descKey: 'initiator:workflow.steps.e2.desc',
        status: 'todo', row: 1,
        dodChecklist: [
            { id: 'e2-1', label: 'Testing completed', done: false },
            { id: 'e2-2', label: 'Bugs fixed', done: false },
            { id: 'e2-3', label: 'Quality standards met', done: false },
        ],
        tools: ['Browser DevTools', 'Testing Tools']
    },
    {
        id: 'e3', phase: 'execution', title: 'Polish & Refinement',
        titleKey: 'initiator:workflow.steps.e3.title',
        description: 'Fine-tune details and optimize',
        descKey: 'initiator:workflow.steps.e3.desc',
        status: 'todo', row: 2,
        dodChecklist: [
            { id: 'e3-1', label: 'Visual polish applied', done: false },
            { id: 'e3-2', label: 'Performance optimized', done: false },
            { id: 'e3-3', label: 'User experience refined', done: false },
        ],
        tools: ['Design Tools', 'Performance Tools']
    },

    // Finalize Phase
    {
        id: 'f1', phase: 'finalize', title: 'Review & Feedback',
        titleKey: 'initiator:workflow.steps.f1.title',
        description: 'Gather feedback and make final adjustments',
        descKey: 'initiator:workflow.steps.f1.desc',
        status: 'todo', row: 0,
        dodChecklist: [
            { id: 'f1-1', label: 'Stakeholder review completed', done: false },
            { id: 'f1-2', label: 'Feedback incorporated', done: false },
            { id: 'f1-3', label: 'Final approval received', done: false },
        ],
        tools: ['Email', 'Meetings']
    },
    {
        id: 'f2', phase: 'finalize', title: 'Delivery & Handoff',
        titleKey: 'initiator:workflow.steps.f2.title',
        description: 'Package and deliver final assets',
        descKey: 'initiator:workflow.steps.f2.desc',
        status: 'todo', row: 1,
        dodChecklist: [
            { id: 'f2-1', label: 'Files organized and exported', done: false },
            { id: 'f2-2', label: 'Documentation completed', done: false },
            { id: 'f2-3', label: 'Project delivered to client', done: false },
        ],
        tools: ['Drive', 'Dropbox', 'Email']
    },
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
