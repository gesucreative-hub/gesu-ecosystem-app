// AI Prompt Templates
// Sprint 24: Local-first AI suggestion layer

import { BlueprintInput } from './AIProvider';

/**
 * System prompt that enforces strict JSON-only output
 */
export function getSystemPrompt(): string {
    return `You are a project workflow optimization assistant.

CRITICAL RULES:
1. Return ONLY valid JSON matching the exact schema below. No markdown, no code blocks, no commentary.
2. Never change any IDs (phaseId, nodeId, blueprintId).
3. Return plain text strings in the requested language. Do NOT output translation keys.
4. Keep suggestions actionable and specific to the project type.
5. Maximum suggestions as specified in the request.

RESPONSE SCHEMA:
{
  "schemaVersion": 1,
  "suggestions": [
    {
      "id": "sugg_<unique>",
      "type": "phase" | "node" | "dod",
      "title": "Short title for this suggestion",
      "description": "Why this improvement helps",
      "ops": [
        { "op": "renamePhase", "phaseId": "<existing>", "title": "New Title" },
        { "op": "renameNode", "nodeId": "<existing>", "title": "New Title", "description": "Optional desc" },
        { "op": "addDoD", "nodeId": "<existing>", "items": ["Checklist item 1", "Checklist item 2"] }
      ]
    }
  ]
}

If you cannot generate valid suggestions, return: {"schemaVersion": 1, "suggestions": []}`;
}

/**
 * User prompt with blueprint context
 */
export function getBlueprintEnhancementPrompt(input: BlueprintInput): string {
    const maxSuggestions = input.maxSuggestions ?? 3;
    const langName = input.language === 'id' ? 'Indonesian (Bahasa Indonesia)' : 'English';
    
    // Build compact blueprint representation
    const phaseSummary = input.blueprint.phases
        .map(p => `- ${p.id}: "${p.label}"`)
        .join('\n');
    
    const nodeSummary = input.blueprint.nodes.slice(0, 15) // Limit to avoid token explosion
        .map(n => {
            const dodCount = n.dod?.length ?? 0;
            return `- ${n.id} (phase: ${n.phaseId}): "${n.title}" [${dodCount} DoD items]`;
        })
        .join('\n');
    
    return `Analyze this workflow blueprint and suggest ${maxSuggestions} improvements.

BLUEPRINT: "${input.blueprint.name}" (ID: ${input.blueprint.id})

PHASES:
${phaseSummary}

NODES (workflow steps):
${nodeSummary}

REQUIREMENTS:
- Respond in ${langName}
- Maximum ${maxSuggestions} suggestions
- Focus on: clearer step titles, missing DoD items, better phase organization
- Do NOT change any IDs
- Return ONLY the JSON object, no other text`;
}

/**
 * Build full prompt for Ollama API
 */
export function buildOllamaPrompt(input: BlueprintInput): string {
    return `${getSystemPrompt()}\n\n${getBlueprintEnhancementPrompt(input)}`;
}
