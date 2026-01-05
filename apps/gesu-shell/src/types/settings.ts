export type AIProviderType = 'none' | 'ollama' | 'mock';

export interface AISettings {
    enabled: boolean;
    provider: AIProviderType;
    endpoint: string;
    model: string;
}

export interface GesuSettings {
    paths: {
        workflowRoot: string;
        projectsRoot: string;
        backupRoot: string;
    };
    engines: {
        ytDlpPath: string | null;
        ffmpegPath: string | null;
        imageMagickPath: string | null;
        libreOfficePath: string | null;
    };
    appearance: {
        theme: 'dark' | 'light' | 'system';
        accentColor: string;
        glassmorphism: boolean;
    };
    preferences?: {
        currency: string;
    };
    ai?: AISettings;
    installPreference?: 'manual' | 'winget' | 'choco' | 'scoop';
    [key: string]: unknown;
}

export const DEFAULT_AI_SETTINGS: AISettings = {
    enabled: false,
    provider: 'none',
    endpoint: 'http://localhost:11434',
    model: 'llama3.2',
};
