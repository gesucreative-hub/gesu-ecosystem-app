// Workflow Blueprints Type Definitions
// Sprint 15 - Standards Tab v1

export interface WorkflowCategory {
    id: string;                    // e.g. 'general', 'archviz'
    name: string;                  // e.g. 'General Creative'
    defaultBlueprintId: string;    // Reference to default blueprint
}

export interface BlueprintNode {
    id: string;                    // MUST match existing node IDs (p1, d1, f1, etc.)
    phaseId: string;               // planning, design, frontend, backend, ops
    title: string;
    description: string;
    dod: string[];                 // DoD item labels (max 7)
    tools: string[];               // Tool names
}

export interface WorkflowBlueprint {
    id: string;
    name: string;
    categoryId: string;
    version: number;
    nodes: BlueprintNode[];
}

export interface BlueprintFileShape {
    schemaVersion: 1;
    categories: WorkflowCategory[];
    blueprints: WorkflowBlueprint[];
    updatedAt: string;
}

// Default category ID for v1
export const DEFAULT_CATEGORY_ID = 'general';
export const DEFAULT_BLUEPRINT_ID = 'general-default';
