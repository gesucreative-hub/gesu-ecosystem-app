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

    interface MediaSuiteJob {
        id: string;
        url: string;
        preset: string;
        network: string;
        target?: MediaOutputTarget;
        status: 'queued' | 'spawned' | 'success' | 'failed';
        timestamp: string;
        args?: string[];
        errorMessage?: string;
    }

    interface GesuJobsAPI {
        enqueue: (payload: GesuJobEnqueuePayload) => Promise<GesuJob>;
        list: () => Promise<GesuJob[]>;
    }

    interface Window {
        gesu?: {
            ping: (payload: unknown) => Promise<any>;
            checkTools?: (payload: GesuToolsCheckPayload) => Promise<any>;
            jobs?: GesuJobsAPI;
            settings?: {
                load: () => Promise<GesuSettings | null>;
                save: (settings: GesuSettings) => Promise<void>;
            };
            mediaSuite?: {
                getRecentJobs: () => Promise<MediaSuiteJob[]>;
            };
        };
    }
}
