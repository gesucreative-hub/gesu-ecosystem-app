// AI Service Index - Factory and exports
// Sprint 24: Local-first AI suggestion layer

export * from './AIProvider';
export { OllamaProvider, createOllamaProvider } from './OllamaProvider';
export { MockProvider, createMockProvider } from './MockProvider';

import { AIProvider } from './AIProvider';
import { createOllamaProvider } from './OllamaProvider';
import { createMockProvider } from './MockProvider';

export type AIProviderType = 'none' | 'ollama' | 'mock';

export interface AISettings {
    enabled: boolean;
    provider: AIProviderType;
    endpoint: string;
    model: string;
}

export const DEFAULT_AI_SETTINGS: AISettings = {
    enabled: false,
    provider: 'none',
    endpoint: 'http://localhost:11434',
    model: 'llama3.2',
};

/**
 * Factory function to create AI provider based on settings
 * Returns null if AI is disabled or provider is 'none'
 */
export function getAIProvider(settings: AISettings): AIProvider | null {
    if (!settings.enabled || settings.provider === 'none') {
        return null;
    }

    switch (settings.provider) {
        case 'ollama':
            return createOllamaProvider(settings.endpoint, settings.model);
        case 'mock':
            return createMockProvider();
        default:
            return null;
    }
}

/**
 * Check if AI is potentially available based on settings
 */
export function isAIConfigured(settings: AISettings): boolean {
    return settings.enabled && settings.provider !== 'none';
}
