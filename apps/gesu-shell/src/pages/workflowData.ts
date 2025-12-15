// Workflow Data Model - Static MVP Data for Project Hub
// This file contains the swimlane phases, workflow nodes, and their connections.

export type WorkflowPhase = 'planning' | 'design' | 'frontend' | 'backend' | 'ops';

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
    {
        id: 'p1', phase: 'planning', title: 'Define Requirements',
        description: 'Gather stakeholder input and document all project requirements',
        status: 'done', row: 0,
        dodChecklist: [
            { id: 'p1-1', label: 'Stakeholder interviews completed', done: true },
            { id: 'p1-2', label: 'Requirements document drafted', done: true },
            { id: 'p1-3', label: 'Requirements reviewed by team', done: true },
        ],
        tools: ['Notion', 'Google Docs']
    },
    {
        id: 'p2', phase: 'planning', title: 'Create Wireframes',
        description: 'Sketch low-fidelity UI mockups to visualize layout',
        status: 'done', row: 1,
        dodChecklist: [
            { id: 'p2-1', label: 'Key screens wireframed', done: true },
            { id: 'p2-2', label: 'User flow mapped out', done: true },
            { id: 'p2-3', label: 'Wireframes reviewed with stakeholders', done: true },
        ],
        tools: ['Figma', 'Excalidraw']
    },
    {
        id: 'p3', phase: 'planning', title: 'Technical Spec',
        description: 'Write architecture document with tech stack and data models',
        status: 'in-progress', row: 2,
        dodChecklist: [
            { id: 'p3-1', label: 'System architecture diagram created', done: true },
            { id: 'p3-2', label: 'Tech stack decided', done: true },
            { id: 'p3-3', label: 'Database schema designed', done: false },
            { id: 'p3-4', label: 'API endpoints defined', done: false },
        ],
        tools: ['Notion', 'draw.io']
    },

    // Design Phase
    {
        id: 'd1', phase: 'design', title: 'Design System',
        description: 'Create reusable design tokens, colors, typography, and component library',
        status: 'done', row: 0,
        dodChecklist: [
            { id: 'd1-1', label: 'Color palette defined', done: true },
            { id: 'd1-2', label: 'Typography scale established', done: true },
            { id: 'd1-3', label: 'Component variants documented', done: true },
        ],
        tools: ['Figma', 'Tailwind CSS']
    },
    {
        id: 'd2', phase: 'design', title: 'UI Mockups',
        description: 'Design high-fidelity mockups for all main screens',
        status: 'in-progress', row: 1,
        dodChecklist: [
            { id: 'd2-1', label: 'Dashboard mockup completed', done: true },
            { id: 'd2-2', label: 'Form pages designed', done: true },
            { id: 'd2-3', label: 'Settings page designed', done: false },
            { id: 'd2-4', label: 'Design reviewed by stakeholders', done: false },
        ],
        tools: ['Figma']
    },
    {
        id: 'd3', phase: 'design', title: 'Prototype',
        description: 'Build interactive click-through prototype for user testing',
        status: 'todo', row: 2,
        dodChecklist: [
            { id: 'd3-1', label: 'Primary user flow prototyped', done: false },
            { id: 'd3-2', label: 'Interactions and transitions added', done: false },
            { id: 'd3-3', label: 'User testing session conducted', done: false },
        ],
        tools: ['Figma', 'Maze']
    },

    // Frontend Phase
    {
        id: 'f1', phase: 'frontend', title: 'Setup Project',
        description: 'Initialize React app with TypeScript, Tailwind, and dev tools',
        status: 'done', row: 0,
        dodChecklist: [
            { id: 'f1-1', label: 'React + TypeScript initialized', done: true },
            { id: 'f1-2', label: 'Tailwind CSS configured', done: true },
            { id: 'f1-3', label: 'Routing setup (react-router)', done: true },
            { id: 'f1-4', label: 'ESLint and Prettier configured', done: true },
        ],
        tools: ['Vite', 'pnpm']
    },
    {
        id: 'f2', phase: 'frontend', title: 'Core Components',
        description: 'Build reusable UI primitives matching the design system',
        status: 'done', row: 1,
        dodChecklist: [
            { id: 'f2-1', label: 'Button component with variants', done: true },
            { id: 'f2-2', label: 'Input and form components', done: true },
            { id: 'f2-3', label: 'Card and layout components', done: true },
        ],
        tools: ['React', 'Tailwind CSS']
    },
    {
        id: 'f3', phase: 'frontend', title: 'Page Implementation',
        description: 'Implement all page views and connect components',
        status: 'in-progress', row: 2,
        dodChecklist: [
            { id: 'f3-1', label: 'Dashboard page implemented', done: true },
            { id: 'f3-2', label: 'Form pages implemented', done: true },
            { id: 'f3-3', label: 'Settings page implemented', done: false },
            { id: 'f3-4', label: 'Navigation working correctly', done: true },
        ],
        tools: ['React', 'TypeScript']
    },
    {
        id: 'f4', phase: 'frontend', title: 'State Management',
        description: 'Setup global state with Context API or state library',
        status: 'todo', row: 3,
        dodChecklist: [
            { id: 'f4-1', label: 'State architecture decided', done: false },
            { id: 'f4-2', label: 'Global context providers created', done: false },
            { id: 'f4-3', label: 'State hooks implemented', done: false },
        ],
        tools: ['React Context', 'Zustand']
    },

    // Backend Phase
    {
        id: 'b1', phase: 'backend', title: 'API Design',
        description: 'Define RESTful API contracts and data transfer objects',
        status: 'done', row: 0,
        dodChecklist: [
            { id: 'b1-1', label: 'API endpoints documented', done: true },
            { id: 'b1-2', label: 'Request/response schemas defined', done: true },
            { id: 'b1-3', label: 'Authentication flow designed', done: true },
        ],
        tools: ['Swagger', 'Postman']
    },
    {
        id: 'b2', phase: 'backend', title: 'Database Schema',
        description: 'Design normalized database schema with relationships',
        status: 'in-progress', row: 1,
        dodChecklist: [
            { id: 'b2-1', label: 'Entity-relationship diagram created', done: true },
            { id: 'b2-2', label: 'Tables and columns defined', done: true },
            { id: 'b2-3', label: 'Indexes and constraints added', done: false },
            { id: 'b2-4', label: 'Migration scripts written', done: false },
        ],
        tools: ['PostgreSQL', 'Prisma']
    },
    {
        id: 'b3', phase: 'backend', title: 'Endpoints',
        description: 'Implement API routes with validation and error handling',
        status: 'todo', row: 2,
        dodChecklist: [
            { id: 'b3-1', label: 'CRUD endpoints implemented', done: false },
            { id: 'b3-2', label: 'Input validation added', done: false },
            { id: 'b3-3', label: 'Error handling middleware', done: false },
            { id: 'b3-4', label: 'API tests written', done: false },
        ],
        tools: ['Express', 'Joi']
    },

    // Ops & Quality Phase
    {
        id: 'o1', phase: 'ops', title: 'CI/CD Setup',
        description: 'Configure automated build and deployment pipeline',
        status: 'todo', row: 0,
        dodChecklist: [
            { id: 'o1-1', label: 'GitHub Actions workflow created', done: false },
            { id: 'o1-2', label: 'Build and test pipeline working', done: false },
            { id: 'o1-3', label: 'Automated deployment to staging', done: false },
        ],
        tools: ['GitHub Actions', 'Docker']
    },
    {
        id: 'o2', phase: 'ops', title: 'Testing',
        description: 'Write comprehensive unit and integration tests',
        status: 'todo', row: 1,
        dodChecklist: [
            { id: 'o2-1', label: 'Unit tests for core logic', done: false },
            { id: 'o2-2', label: 'Integration tests for API', done: false },
            { id: 'o2-3', label: 'E2E tests for critical flows', done: false },
            { id: 'o2-4', label: 'Test coverage > 80%', done: false },
        ],
        tools: ['Vitest', 'Playwright']
    },
    {
        id: 'o3', phase: 'ops', title: 'Documentation',
        description: 'Create user guides and developer documentation',
        status: 'todo', row: 2,
        dodChecklist: [
            { id: 'o3-1', label: 'README with setup instructions', done: false },
            { id: 'o3-2', label: 'API documentation published', done: false },
            { id: 'o3-3', label: 'User guide written', done: false },
        ],
        tools: ['Markdown', 'Docusaurus']
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
