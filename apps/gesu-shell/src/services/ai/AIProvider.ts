// AI Provider Types and Interface
// Sprint 24: Local-first AI suggestion layer for Project Hub

import { z } from 'zod';

// --- Operation Types for Blueprint Changes ---

export const RenamePhaseOpSchema = z.object({
    op: z.literal('renamePhase'),
    phaseId: z.string(),
    title: z.string().max(100),
});

export const RenameNodeOpSchema = z.object({
    op: z.literal('renameNode'),
    nodeId: z.string(),
    title: z.string().max(100),
    description: z.string().max(500).optional(),
});

export const AddDoDOpSchema = z.object({
    op: z.literal('addDoD'),
    nodeId: z.string(),
    items: z.array(z.string().max(200)).max(5),
});

export const SuggestionOpSchema = z.discriminatedUnion('op', [
    RenamePhaseOpSchema,
    RenameNodeOpSchema,
    AddDoDOpSchema,
]);

// --- Suggestion Object ---

export const BlueprintSuggestionSchema = z.object({
    id: z.string(),
    type: z.enum(['phase', 'node', 'dod']),
    title: z.string().max(100),
    description: z.string().max(300).optional(),
    ops: z.array(SuggestionOpSchema).min(1).max(5),
});

// --- Result Schema with versioning ---

export const SuggestBlueprintResultSchema = z.object({
    schemaVersion: z.literal(1),
    suggestions: z.array(BlueprintSuggestionSchema).max(10),
    meta: z.object({
        model: z.string().optional(),
        durationMs: z.number().optional(),
    }).optional(),
});

// --- TypeScript Types derived from schemas ---

export type RenamePhaseOp = z.infer<typeof RenamePhaseOpSchema>;
export type RenameNodeOp = z.infer<typeof RenameNodeOpSchema>;
export type AddDoDOp = z.infer<typeof AddDoDOpSchema>;
export type SuggestionOp = z.infer<typeof SuggestionOpSchema>;
export type BlueprintSuggestion = z.infer<typeof BlueprintSuggestionSchema>;
export type SuggestBlueprintResult = z.infer<typeof SuggestBlueprintResultSchema>;

// --- Input Types ---

export interface BlueprintInput {
    blueprint: {
        id: string;
        name: string;
        phases: Array<{ id: string; label: string }>;
        nodes: Array<{
            id: string;
            phaseId: string;
            title: string;
            description?: string;
            dod?: string[];
        }>;
    };
    language: 'en' | 'id';
    maxSuggestions?: number;
}

// --- Availability Result ---

export interface AvailabilityResult {
    ok: boolean;
    reason?: string;
    models?: string[];
}

// --- AI Provider Interface ---

export interface AIProvider {
    /**
     * Check if the AI provider is available and can accept requests
     */
    isAvailable(): Promise<AvailabilityResult>;

    /**
     * Generate blueprint enhancement suggestions
     * Returns validated result or throws on validation failure
     */
    suggestBlueprintEnhancements(input: BlueprintInput): Promise<SuggestBlueprintResult>;
}

// --- Validation Helper ---

export function validateBlueprintResult(data: unknown): SuggestBlueprintResult {
    return SuggestBlueprintResultSchema.parse(data);
}
