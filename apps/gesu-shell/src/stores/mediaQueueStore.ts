// Media Queue Store - Global state for job queue and history
// Uses Zustand for clean state management with React hooks

import { create } from 'zustand';
import type { MediaJob, MediaJobPayload } from '../services/mediaJobsService';
import * as mediaJobsService from '../services/mediaJobsService';

interface MediaQueueState {
    queue: MediaJob[];
    history: MediaJob[];
    loading: boolean;
    error: string | null;

    // Actions
    refresh: () => Promise<void>;
    enqueue: (payload: MediaJobPayload) => Promise<string>;
    cancel: (jobId: string) => Promise<void>;
    cancelAll: () => Promise<void>;

    // Internal handlers
    handleProgress: (data: { jobId: string; progress: number | null; logLine: string }) => void;
    handleComplete: () => void;
    handleUpdate: (job: MediaJob) => void;
}

export const useMediaQueueStore = create<MediaQueueState>((set, get) => ({
    queue: [],
    history: [],
    loading: false,
    error: null,

    refresh: async () => {
        set({ loading: true, error: null });
        try {
            const data = await mediaJobsService.getJobQueue();
            set({
                queue: data.queue,
                history: data.history,
                loading: false,
            });
        } catch (error) {
            console.error('[mediaQueueStore] Failed to refresh:', error);
            set({
                error: error instanceof Error ? error.message : 'Unknown error',
                loading: false,
            });
        }
    },

    enqueue: async (payload: MediaJobPayload) => {
        try {
            const jobId = await mediaJobsService.enqueueJob(payload);
            await get().refresh();
            return jobId;
        } catch (error) {
            console.error('[mediaQueueStore] Failed to enqueue:', error);
            set({ error: error instanceof Error ? error.message : 'Unknown error' });
            throw error;
        }
    },

    cancel: async (jobId: string) => {
        try {
            await mediaJobsService.cancelJob(jobId);
            await get().refresh();
        } catch (error) {
            console.error('[mediaQueueStore] Failed to cancel:', error);
            set({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
    },

    cancelAll: async () => {
        try {
            await mediaJobsService.cancelAllJobs();
            await get().refresh();
        } catch (error) {
            console.error('[mediaQueueStore] Failed to cancel all:', error);
            set({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
    },

    handleProgress: (data: { jobId: string; progress: number | null }) => {
        const { jobId, progress } = data;
        set((state) => ({
            queue: state.queue.map(job =>
                job.id === jobId ? { ...job, progress } : job
            ),
        }));
    },

    handleComplete: () => {
        get().refresh();
    },

    handleUpdate: (updatedJob: MediaJob) => {
        set((state) => {
            const queueIndex = state.queue.findIndex(j => j.id === updatedJob.id);
            if (queueIndex >= 0) {
                const newQueue = [...state.queue];
                newQueue[queueIndex] = updatedJob;
                return { queue: newQueue };
            }

            const historyIndex = state.history.findIndex(j => j.id === updatedJob.id);
            if (historyIndex >= 0) {
                const newHistory = [...state.history];
                newHistory[historyIndex] = updatedJob;
                return { history: newHistory };
            }

            return state;
        });
    },
}));

// Selectors (for convenience)
export const useRunningJobs = () => useMediaQueueStore((s) => s.queue.filter(j => j.status === 'running'));
export const useQueuedJobs = () => useMediaQueueStore((s) => s.queue.filter(j => j.status === 'queued'));

// Subscribe to IPC events on module load
if (typeof window !== 'undefined') {
    mediaJobsService.onJobProgress((data) => {
        useMediaQueueStore.getState().handleProgress(data);
    });

    mediaJobsService.onJobComplete(() => {
        useMediaQueueStore.getState().handleComplete();
    });

    mediaJobsService.onJobUpdate((job) => {
        useMediaQueueStore.getState().handleUpdate(job);
    });
}
