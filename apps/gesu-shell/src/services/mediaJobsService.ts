// Media Jobs Service - Bridge to Electron media jobs API
// Handles detection and fallback for non-Electron environments

export interface MediaJob {
    id: string;
    kind: 'download' | 'convert';
    // Note: 'soffice' kept in type for data compatibility but document conversion is deferred
    engine: 'yt-dlp' | 'ffmpeg' | 'imagemagick' | 'soffice';
    input: string;
    output: string;
    status: 'queued' | 'running' | 'success' | 'error' | 'canceled';
    progress: number | null;
    createdAt: string;
    startedAt: string | null;
    completedAt: string | null;
    logsTail: string[];
    errorMessage: string | null;
    options?: Record<string, any>;
}

export interface MediaJobPayload {
    kind: 'download' | 'convert';
    // Note: 'soffice' kept in type for data compatibility but document conversion is deferred
    engine: 'yt-dlp' | 'ffmpeg' | 'imagemagick' | 'soffice';
    input: string;
    output: string;
    options?: Record<string, any>;
}

export interface QueueData {
    queue: MediaJob[];
    history: MediaJob[];
}

/**
 * Check if Electron media jobs API is available
 */
export function isMediaJobsAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.gesu?.mediaJobs;
}

/**
 * Enqueue a job
 */
export async function enqueueJob(payload: MediaJobPayload): Promise<string> {
    if (!isMediaJobsAvailable()) {
        throw new Error('Media jobs not available - requires Electron desktop mode');
    }

    if (!window.gesu) {
        throw new Error('Gesu API not available');
    }

    const api = window.gesu.mediaJobs;
    if (!api) {
        throw new Error('Media jobs API not available');
    }

    const jobId = await api.enqueue(payload);
    return jobId;
}

/**
 * Get queue and history
 */
export async function getJobQueue(): Promise<QueueData> {
    if (!isMediaJobsAvailable()) {
        return { queue: [], history: [] };
    }

    if (!window.gesu) {
        return { queue: [], history: [] };
    }

    const api = window.gesu.mediaJobs;
    if (!api) {
        return { queue: [], history: [] };
    }

    const data = await api.list();
    return data;
}

/**
 * Cancel a job
 */
export async function cancelJob(jobId: string): Promise<boolean> {
    if (!isMediaJobsAvailable()) {
        return false;
    }

    if (!window.gesu) {
        return false;
    }

    const api = window.gesu.mediaJobs;
    if (!api) {
        return false;
    }

    return await api.cancel(jobId);
}

/**
 * Cancel all jobs
 */
export async function cancelAllJobs(): Promise<number> {
    if (!isMediaJobsAvailable()) {
        return 0;
    }

    if (!window.gesu) {
        return 0;
    }

    const api = window.gesu.mediaJobs;
    if (!api) {
        return 0;
    }

    return await api.cancelAll();
}

/**
 * Subscribe to job progress events
 */
export function onJobProgress(callback: (data: { jobId: string; progress: number | null; logLine: string }) => void): () => void {
    if (!isMediaJobsAvailable()) {
        return () => { }; // No-op unsubscribe
    }

    if (!window.gesu) {
        return () => { };
    }

    const api = window.gesu.mediaJobs;
    if (!api) {
        return () => { };
    }

    return api.onProgress(callback);
}

/**
 * Subscribe to job complete events
 */
export function onJobComplete(callback: (data: { jobId: string; status: string; errorMessage?: string }) => void): () => void {
    if (!isMediaJobsAvailable()) {
        return () => { }; // No-op unsubscribe
    }

    if (!window.gesu) {
        return () => { };
    }

    const api = window.gesu.mediaJobs;
    if (!api) {
        return () => { };
    }

    return api.onComplete(callback);
}

/**
 * Subscribe to job update events
 */
export function onJobUpdate(callback: (job: MediaJob) => void): () => void {
    if (!isMediaJobsAvailable()) {
        return () => { }; // No-op unsubscribe
    }

    if (!window.gesu) {
        return () => { };
    }

    const api = window.gesu.mediaJobs;
    if (!api) {
        return () => { };
    }

    return api.onUpdate(callback);
}
