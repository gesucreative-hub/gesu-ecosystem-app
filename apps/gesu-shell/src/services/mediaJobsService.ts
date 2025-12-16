// Media Jobs Service - Bridge to Electron media jobs API
// Handles detection and fallback for non-Electron environments

export interface MediaJob {
    id: string;
    kind: 'download' | 'convert';
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

    const jobId = await window.gesu.mediaJobs!.enqueue(payload);
    return jobId;
}

/**
 * Get queue and history
 */
export async function getJobQueue(): Promise<QueueData> {
    if (!isMediaJobsAvailable()) {
        return { queue: [], history: [] };
    }

    const data = await window.gesu.mediaJobs!.list();
    return data;
}

/**
 * Cancel a job
 */
export async function cancelJob(jobId: string): Promise<boolean> {
    if (!isMediaJobsAvailable()) {
        return false;
    }

    return await window.gesu.mediaJobs!.cancel(jobId);
}

/**
 * Cancel all jobs
 */
export async function cancelAllJobs(): Promise<number> {
    if (!isMediaJobsAvailable()) {
        return 0;
    }

    return await window.gesu.mediaJobs!.cancelAll();
}

/**
 * Subscribe to job progress events
 */
export function onJobProgress(callback: (data: { jobId: string; progress: number | null; logLine: string }) => void): () => void {
    if (!isMediaJobsAvailable()) {
        return () => { }; // No-op unsubscribe
    }

    return window.gesu.mediaJobs!.onProgress(callback);
}

/**
 * Subscribe to job complete events
 */
export function onJobComplete(callback: (data: { jobId: string; status: string; errorMessage?: string }) => void): () => void {
    if (!isMediaJobsAvailable()) {
        return () => { }; // No-op unsubscribe
    }

    return window.gesu.mediaJobs!.onComplete(callback);
}

/**
 * Subscribe to job update events
 */
export function onJobUpdate(callback: (job: MediaJob) => void): () => void {
    if (!isMediaJobsAvailable()) {
        return () => { }; // No-op unsubscribe
    }

    return window.gesu.mediaJobs!.onUpdate(callback);
}
