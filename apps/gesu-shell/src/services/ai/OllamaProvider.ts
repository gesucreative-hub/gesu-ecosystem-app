// Ollama Provider - HTTP client for local Ollama AI
// Sprint 24: Local-first AI suggestion layer

import {
    AIProvider,
    AvailabilityResult,
    BlueprintInput,
    SuggestBlueprintResult,
    validateBlueprintResult,
} from './AIProvider';
import { buildOllamaPrompt } from './prompts';

const DEFAULT_TIMEOUT_MS = 30000; // 30 seconds

interface OllamaConfig {
    endpoint: string;
    model: string;
    timeoutMs?: number;
}

/** Progress data from Ollama pull stream */
export interface PullProgress {
    status: string;
    digest?: string;
    total?: number;
    completed?: number;
}

export class OllamaProvider implements AIProvider {
    private endpoint: string;
    private model: string;
    private timeoutMs: number;

    constructor(config: OllamaConfig) {
        this.endpoint = config.endpoint.replace(/\/$/, ''); // Remove trailing slash
        this.model = config.model;
        this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    }

    /** List all installed models */
    async listModels(): Promise<string[]> {
        try {
            const response = await fetch(`${this.endpoint}/api/tags`, {
                method: 'GET',
            });
            if (!response.ok) return [];
            const data = await response.json();
            return data.models?.map((m: { name: string }) => m.name) || [];
        } catch {
            return [];
        }
    }

    /** Pull/download a model with streaming progress */
    async pullModel(
        modelName: string,
        onProgress: (data: PullProgress) => void,
        signal?: AbortSignal
    ): Promise<void> {
        const response = await fetch(`${this.endpoint}/api/pull`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: modelName, stream: true }),
            signal,
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            throw new Error(`Pull failed: ${response.status} - ${errorText}`);
        }

        if (!response.body) {
            throw new Error('No response body for streaming');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Keep incomplete line in buffer

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const parsed: PullProgress = JSON.parse(line);
                        onProgress(parsed);
                    } catch {
                        // Ignore malformed JSON lines silently
                    }
                }
            }

            // Process any remaining buffer
            if (buffer.trim()) {
                try {
                    const parsed: PullProgress = JSON.parse(buffer);
                    onProgress(parsed);
                } catch {
                    // Ignore
                }
            }
        } finally {
            reader.releaseLock();
        }
    }

    async isAvailable(): Promise<AvailabilityResult> {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        try {
            const response = await fetch(`${this.endpoint}/api/tags`, {
                method: 'GET',
                signal: controller.signal,
            });

            clearTimeout(timeout);

            if (!response.ok) {
                return { ok: false, reason: `HTTP ${response.status}` };
            }

            const data = await response.json();
            const models = data.models?.map((m: { name: string }) => m.name) || [];

            return {
                ok: true,
                models,
            };
        } catch (error) {
            clearTimeout(timeout);
            const message = error instanceof Error ? error.message : 'Unknown error';
            
            if (message.includes('abort')) {
                return { ok: false, reason: 'Connection timeout' };
            }
            
            return { ok: false, reason: message };
        }
    }

    async suggestBlueprintEnhancements(input: BlueprintInput): Promise<SuggestBlueprintResult> {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

        try {
            const prompt = buildOllamaPrompt(input);
            const startTime = Date.now();

            const response = await fetch(`${this.endpoint}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.model,
                    prompt,
                    stream: false,
                    options: {
                        temperature: 0.7,
                        top_p: 0.9,
                    },
                }),
                signal: controller.signal,
            });

            clearTimeout(timeout);
            const durationMs = Date.now() - startTime;

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            const responseText = data.response || '';

            // Try to parse JSON from response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No valid JSON found in AI response');
            }

            const parsed = JSON.parse(jsonMatch[0]);

            // Validate with Zod schema
            const result = validateBlueprintResult(parsed);

            // Add metadata
            return {
                ...result,
                meta: {
                    ...result.meta,
                    model: this.model,
                    durationMs,
                },
            };
        } catch (error) {
            clearTimeout(timeout);
            
            if (error instanceof Error && error.message.includes('abort')) {
                throw new Error('Request timed out. The AI is taking too long to respond.');
            }
            
            throw error;
        }
    }
}

/**
 * Create an Ollama provider instance
 */
export function createOllamaProvider(
    endpoint = 'http://localhost:11434',
    model = 'llama3.2'
): OllamaProvider {
    return new OllamaProvider({ endpoint, model });
}
