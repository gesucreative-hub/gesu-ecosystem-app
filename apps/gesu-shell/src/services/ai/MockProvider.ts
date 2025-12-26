// Mock Provider - Deterministic test provider for QA
// Sprint 24: Local-first AI suggestion layer

import {
    AIProvider,
    AvailabilityResult,
    BlueprintInput,
    SuggestBlueprintResult,
} from './AIProvider';

/**
 * MockProvider returns hardcoded valid suggestions for testing.
 * Enabled when settings.ai.provider === 'mock'
 */
export class MockProvider implements AIProvider {
    async isAvailable(): Promise<AvailabilityResult> {
        return {
            ok: true,
            reason: 'Mock provider always available',
            models: ['mock-model-v1'],
        };
    }

    async suggestBlueprintEnhancements(input: BlueprintInput): Promise<SuggestBlueprintResult> {
        // Simulate network delay for realistic UX
        await new Promise(resolve => setTimeout(resolve, 800));

        const isIndonesian = input.language === 'id';
        const firstNode = input.blueprint.nodes[0];
        const firstPhase = input.blueprint.phases[0];

        const suggestions: SuggestBlueprintResult['suggestions'] = [];

        if (firstNode) {
            suggestions.push({
                id: 'sugg_mock_1',
                type: 'node' as const,
                title: isIndonesian ? 'Perjelas judul langkah' : 'Clarify step title',
                description: isIndonesian
                    ? 'Judul lebih deskriptif membantu melacak progres'
                    : 'More descriptive titles help track progress',
                ops: [
                    {
                        op: 'renameNode' as const,
                        nodeId: firstNode.id,
                        title: isIndonesian
                            ? `${firstNode.title} (Diperjelas)`
                            : `${firstNode.title} (Clarified)`,
                        description: isIndonesian
                            ? 'Langkah yang diperjelas dengan konteks tambahan'
                            : 'Clarified step with additional context',
                    },
                ],
            });

            suggestions.push({
                id: 'sugg_mock_2',
                type: 'dod' as const,
                title: isIndonesian ? 'Tambah item checklist' : 'Add checklist items',
                description: isIndonesian
                    ? 'Checklist memastikan kualitas sebelum lanjut'
                    : 'Checklists ensure quality before moving forward',
                ops: [
                    {
                        op: 'addDoD' as const,
                        nodeId: firstNode.id,
                        items: isIndonesian
                            ? ['Hasil direview', 'File diorganisir']
                            : ['Output reviewed', 'Files organized'],
                    },
                ],
            });
        }

        if (firstPhase) {
            suggestions.push({
                id: 'sugg_mock_3',
                type: 'phase' as const,
                title: isIndonesian ? 'Perjelas nama fase' : 'Clarify phase name',
                description: isIndonesian
                    ? 'Nama fase yang jelas mempermudah navigasi'
                    : 'Clear phase names ease navigation',
                ops: [
                    {
                        op: 'renamePhase' as const,
                        phaseId: firstPhase.id,
                        title: isIndonesian
                            ? `${firstPhase.label} (Revisi)`
                            : `${firstPhase.label} (Revised)`,
                    },
                ],
            });
        }

        return {
            schemaVersion: 1,
            suggestions,
            meta: {
                model: 'mock-model-v1',
                durationMs: 800,
            },
        };
    }
}

/**
 * Create a mock provider instance
 */
export function createMockProvider(): MockProvider {
    return new MockProvider();
}
