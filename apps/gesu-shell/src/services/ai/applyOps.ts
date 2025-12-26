// Apply AI Suggestions to Blueprint Draft
// Sprint 24: Safe, non-destructive apply logic

import { SuggestionOp, BlueprintSuggestion } from './AIProvider';

interface BlueprintDraft {
    id: string;
    name: string;
    phases?: Array<{ id: string; label: string; [key: string]: unknown }>;
    nodes: Array<{
        id: string;
        phaseId: string;
        title: string;
        description?: string;
        dod: string[];
        [key: string]: unknown;
    }>;
    [key: string]: unknown;
}

/**
 * Apply selected AI suggestions to a blueprint draft.
 * 
 * Safety guarantees:
 * - Never changes blueprint/phase/node IDs
 * - Preserves existing nameKey/titleKey fields
 * - Dedupes DoD items (case-insensitive)
 * - Ignores unknown IDs safely
 * 
 * @returns A new draft object with changes applied (immutable)
 */
export function applyOpsToBlueprintDraft(
    draft: BlueprintDraft,
    suggestions: BlueprintSuggestion[],
    selectedIds: Set<string>
): BlueprintDraft {
    // Collect all ops from selected suggestions
    const ops: SuggestionOp[] = [];
    for (const suggestion of suggestions) {
        if (selectedIds.has(suggestion.id)) {
            ops.push(...suggestion.ops);
        }
    }

    if (ops.length === 0) {
        return draft;
    }

    // Apply ops immutably
    let newDraft = { ...draft };
    let newPhases = draft.phases ? [...draft.phases] : undefined;
    let newNodes = [...draft.nodes];

    for (const op of ops) {
        switch (op.op) {
            case 'renamePhase': {
                if (!newPhases) break;
                const phaseIndex = newPhases.findIndex(p => p.id === op.phaseId);
                if (phaseIndex === -1) {
                    console.warn(`[applyOps] Phase not found: ${op.phaseId}`);
                    break;
                }
                // Preserve existing keys, only update label
                newPhases = newPhases.map((p, i) =>
                    i === phaseIndex ? { ...p, label: op.title } : p
                );
                break;
            }

            case 'renameNode': {
                const nodeIndex = newNodes.findIndex(n => n.id === op.nodeId);
                if (nodeIndex === -1) {
                    console.warn(`[applyOps] Node not found: ${op.nodeId}`);
                    break;
                }
                // Preserve existing keys (nameKey, titleKey, etc.), only update title/description
                newNodes = newNodes.map((n, i) =>
                    i === nodeIndex
                        ? {
                            ...n,
                            title: op.title,
                            ...(op.description !== undefined ? { description: op.description } : {})
                        }
                        : n
                );
                break;
            }

            case 'addDoD': {
                const nodeIndex = newNodes.findIndex(n => n.id === op.nodeId);
                if (nodeIndex === -1) {
                    console.warn(`[applyOps] Node not found for DoD: ${op.nodeId}`);
                    break;
                }
                const existingNode = newNodes[nodeIndex];
                const existingDod = existingNode.dod || [];
                
                // Dedupe: case-insensitive, trim
                const existingLower = new Set(existingDod.map(d => d.trim().toLowerCase()));
                const newItems = op.items.filter(item => 
                    !existingLower.has(item.trim().toLowerCase())
                );

                if (newItems.length > 0) {
                    newNodes = newNodes.map((n, i) =>
                        i === nodeIndex
                            ? { ...n, dod: [...existingDod, ...newItems] }
                            : n
                    );
                }
                break;
            }

            default:
                console.warn(`[applyOps] Unknown op type:`, (op as any).op);
        }
    }

    return {
        ...newDraft,
        ...(newPhases ? { phases: newPhases } : {}),
        nodes: newNodes
    };
}

/**
 * Sanitize folder/file names for safety
 */
export function sanitizeName(name: string): string {
    return name
        .replace(/[<>:"/\\|?*]/g, '') // Remove forbidden chars
        .replace(/\.\./g, '')          // Remove path traversal
        .trim()
        .slice(0, 100);                 // Max length
}
