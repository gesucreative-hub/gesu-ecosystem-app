// Workflow Blueprints Type Definitions
// Sprint 15 - Standards Tab v1
// Sprint 21.3 - Added Folder Templates support

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

// Sprint 21.3 Phase 6: Per-blueprint phase definitions
export interface WorkflowPhaseDefinition {
    id: string;                    // e.g. 'concept', 'production', 'delivery'
    label: string;                 // e.g. 'Concept', 'Production', 'Delivery'
    color: string;                 // Hex color, e.g. '#6366f1'
}

// Sprint 21.3 Phase 7: Template categories for picker modal
export type TemplateCategory = 'creative' | 'development' | 'general';

export interface WorkflowBlueprint {
    id: string;
    name: string;
    nameKey?: string;              // Sprint 23: i18n key for localized name (e.g., 'initiator:templates.archvizStandard')
    categoryId: string;
    version: number;
    nodes: BlueprintNode[];
    folderTemplateId?: string;     // Sprint 21.3: Optional reference to folder template
    phases?: WorkflowPhaseDefinition[];  // Sprint 21.3 Phase 6: Optional custom phases (falls back to global default)
    isTemplate?: boolean;          // Sprint 21.3 Phase 7: If true, this is a read-only template
    templateCategory?: TemplateCategory;  // Sprint 21.3 Phase 7: Category for template picker grouping
}

export interface BlueprintFileShape {
    schemaVersion: 1;
    categories: WorkflowCategory[];
    blueprints: WorkflowBlueprint[];
    updatedAt: string;
}

// --- Folder Templates (Sprint 21.3) ---

// Hierarchical folder node (for editor)
export interface FolderNode {
    id: string;                    // Unique ID for this node
    name: string;                  // Folder name (e.g. '01. Brief')
    children?: FolderNode[];       // Nested folders
}

// Original flat template format (backward compatibility)
export interface FolderTemplate {
    id: string;                    // e.g. 'brand-design-standard', 'archviz-sketchup-d5'
    name: string;                  // e.g. 'Brand Design Standard'
    nameKey?: string;              // Sprint 23: i18n key for localized name
    folders: string[];             // Flat path strings, e.g. ['01. Assets', '_Output/Renders']
}

// Extended template format with metadata (for editor)
export interface FolderTemplateExtended extends FolderTemplate {
    hierarchicalFolders?: FolderNode[];  // Optional hierarchical structure
    createdAt?: string;
    updatedAt?: string;
    isUserCreated?: boolean;       // true for user templates, false for defaults
}

export interface FolderTemplatesFileShape {
    schemaVersion: 1;
    templates: FolderTemplate[];
    updatedAt: string;
}

// Default category ID for v1
export const DEFAULT_CATEGORY_ID = 'general';
export const DEFAULT_BLUEPRINT_ID = 'general-default';

