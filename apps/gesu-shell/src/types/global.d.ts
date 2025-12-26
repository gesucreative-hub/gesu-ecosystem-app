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
        outputPath?: string; // Full output folder path
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
                preview: (input: { projectName: string; templateId: string; folderTemplateFolders?: string[] }) => Promise<{
                    ok: boolean;
                    projectPath?: string;
                    plan?: Array<{ kind: 'dir' | 'file'; relativePath: string; content?: string }>;
                    error?: string;
                }>;
                create: (input: { projectName: string; templateId: string; categoryId?: string; blueprintId?: string; blueprintVersion?: number; folderTemplateFolders?: string[]; options?: { gitInit?: boolean; includeMedia?: boolean; includeNotion?: boolean; includeLog?: boolean; } }) => Promise<{
                    ok: boolean;
                    projectPath?: string;
                    projectId?: string;
                    projectName?: string;
                    warnings?: string[];
                    error?: string;
                }>;
                initializeGit: (path: string) => Promise<{ success: boolean; message?: string; error?: string; }>;
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
                onChange: (callback: () => void) => () => void;
            };
            fs?: {
                ensureDir: (path: string) => Promise<void>;
                pathExists: (path: string) => Promise<boolean>;
                readDir: (path: string) => Promise<Array<{ name: string; isDirectory: boolean }>>;
                readFile: (path: string) => Promise<string>;
                writeFile: (path: string, data: string) => Promise<void>;
            };
            compassSnapshots?: {
                append: (snapshot: {
                    energy: number;
                    focus: number;
                    sessions: string[];
                    timestamp?: string;
                    id?: string;
                }) => Promise<{ ok: boolean; snapshot?: any; error?: string }>;
                list: (options?: { limit?: number }) => Promise<Array<{
                    id: string;
                    timestamp: string;
                    energy: number;
                    focus: number;
                    sessions: string[];
                }>>;
            };
            mediaJobs?: {
                enqueue: (payload: any) => Promise<string>;
                list: () => Promise<{ queue: any[]; history: any[] }>;
                cancel: (jobId: string) => Promise<boolean>;
                cancelAll: () => Promise<number>;
                getHistory: (limit: number, offset: number) => Promise<{ entries: any[]; total: number | null; hasMore: boolean }>;
                onProgress: (callback: (data: { jobId: string; progress: number | null; logLine: string }) => void) => () => void;
                onComplete: (callback: (data: { jobId: string; status: string; errorMessage?: string }) => void) => () => void;
                onUpdate: (callback: (job: any) => void) => () => void;
            };
            workflowBlueprints?: {
                get: () => Promise<any>;
                save: (data: any) => Promise<{ ok: boolean; error?: string }>;
            };
            folderTemplates?: {
                get: () => Promise<any>;
                save: (data: any) => Promise<{ ok: boolean; error?: string }>;
            };
            mediaSuite?: {
                getRecentJobs: () => Promise<MediaSuiteJob[]>;
                openFolder: (target: MediaOutputTarget) => Promise<void>;
                pickSourceFile: () => Promise<string | null>;
                pickOutputFolder: (defaultPath?: string) => Promise<string | null>;
                updateYtDlp: () => Promise<{ success: boolean; message?: string; error?: string }>;
            };
            shell?: {
                openPath: (path: string) => Promise<{ success: boolean; error?: string }>;
            };
            activityTracking?: {
                startSession: (payload: { type: 'focus' | 'break' | 'idle'; taskId?: string; projectId?: string }) => Promise<{ ok: boolean; sessionId?: string; error?: string }>;
                endSession: (payload: { sessionId: string }) => Promise<{ ok: boolean; error?: string }>;
                getSummary: (payload: { startDate: string; endDate: string }) => Promise<{ ok: boolean; sessions?: any[]; error?: string }>;
                recordTaskCompletion: (payload: { taskId: string; duration?: number }) => Promise<{ ok: boolean; completionId?: string; error?: string }>;
            };
            database?: {
                switchUser: (userId: string | null) => Promise<{ ok: boolean; error?: string }>;
                getCurrentUser: () => Promise<string | null>;
            };
            userSettings?: {
                read: () => Promise<any>;
                write: (settings: any) => Promise<void>;
            };
            schemaBackups?: {
                getPath: () => Promise<string>;
                create: (payload: { storeKey: string; rawData: string; meta?: object }) => Promise<{ ok: boolean; backupPath?: string; filename?: string; error?: string }>;
                list: (payload: { storeKey: string }) => Promise<Array<{ filename: string; timestamp: number; path: string }>>;
                read: (payload: { filename: string }) => Promise<{ ok: boolean; backup?: { storeKey: string; timestamp: number; meta: object; rawData: string }; error?: string }>;
            };
        };
    }
}

