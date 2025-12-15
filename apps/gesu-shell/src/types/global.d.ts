import { GesuSettings } from './settings';

export { };

declare global {
    interface GesuToolsCheckPayload {
        ffmpegPath?: string | null;
        ytDlpPath?: string | null;
        imageMagickPath?: string | null;
        libreOfficePath?: string | null;
    }

    interface GesuJobEnqueuePayload {
        type: string;
        label: string;
        payload: any;
    }

    interface GesuJob {
        id: string;
        type: string;
        label: string;
        status: string;
        createdAt: string;
        updatedAt: string;
        payload: any;
        errorMessage?: string;
    }

    type MediaOutputTarget = 'shell' | 'workflow';

    type MediaConvertPresetId =
        | 'audio-mp3-320'
        | 'audio-mp3-192'
        | 'audio-wav-48k'
        | 'audio-aac-256'
        | 'video-mp4-1080p'
        | 'video-mp4-720p'
        | 'video-mp4-540p-lite'
        | 'video-advanced';

    type AdvancedVideoResolution = 'source' | '1080p' | '720p' | '540p';
    type AdvancedVideoQuality = 'high' | 'medium' | 'lite';
    type AdvancedAudioProfile = 'copy' | 'aac-128' | 'aac-192';

    interface MediaAdvancedVideoOptions {
        resolution: AdvancedVideoResolution;
        quality: AdvancedVideoQuality;
        audio: AdvancedAudioProfile;
    }

    interface MediaSuiteJob {
        id: string;
        type: 'download' | 'convert';
        url?: string;
        inputPath?: string;
        preset: string;
        network?: string;
        target?: MediaOutputTarget;
        status: 'queued' | 'spawned' | 'success' | 'failed';
        timestamp: string;
        args?: string[];
        errorMessage?: string;
        details?: string;
    }

    interface GesuJobsAPI {
        enqueue: (payload: GesuJobEnqueuePayload) => Promise<GesuJob>;
        list: () => Promise<GesuJob[]>;
    }

    interface GesuSettings {
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
            [key: string]: unknown;
        };
        appearance: {
            theme: 'dark' | 'light' | 'system';
            accentColor: string;
            glassmorphism: boolean;
        };
        installPreference?: 'manual' | 'winget' | 'choco' | 'scoop';
        [key: string]: unknown; // Allow legacy keys
    }

    interface Window {
        gesu?: {
            ping: (payload: unknown) => Promise<any>;
            checkTools?: (payload: GesuToolsCheckPayload) => Promise<any>;
            jobs?: GesuJobsAPI;
            settings?: {
                read: () => Promise<GesuSettings>;
                write: (settings: Partial<GesuSettings>) => Promise<GesuSettings>;
                onSettingsChanged: (callback: (settings: GesuSettings) => void) => () => void;
            };
            dialog?: {
                pickFolder: (defaultPath?: string) => Promise<string | null>;
                pickFile: (opts: { defaultPath?: string; filters?: Electron.FileFilter[] }) => Promise<string | null>;
            };
            scaffold?: {
                preview: (input: { projectName: string; templateId: string }) => Promise<{
                    ok: boolean;
                    projectPath?: string;
                    plan?: Array<{ kind: 'dir' | 'file'; relativePath: string; content?: string }>;
                    error?: string;
                }>;
                create: (input: { projectName: string; templateId: string }) => Promise<{
                    ok: boolean;
                    projectPath?: string;
                    projectId?: string;
                    projectName?: string;
                    warnings?: string[];
                    error?: string;
                }>;
            };
            projects?: {
                list: () => Promise<Array<{
                    id: string;
                    name: string;
                    projectPath: string;
                    createdAt?: string;
                    updatedAt?: string;
                    templateId?: string;
                }>>;
            };
            mediaSuite?: {
                getRecentJobs: () => Promise<MediaSuiteJob[]>;
                openFolder: (target: MediaOutputTarget) => Promise<{ success: boolean; error?: string }>;
                pickSourceFile: () => Promise<string | null>;
            };
        };
    }
}
