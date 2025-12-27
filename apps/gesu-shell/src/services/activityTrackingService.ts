/**
 * Activity Tracking Service
 * Client-side service for tracking user activity
 */

export interface ActivitySession {
    id: string;
    user_id: string;
    start_time: string;
    end_time?: string;
    type: 'focus' | 'break' | 'idle';
    task_id?: string;
    project_id?: string;
}

/**
 * Start an activity tracking session
 */
export async function startActivitySession(
    type: 'focus' | 'break' | 'idle',
    taskId?: string,
    projectId?: string
): Promise<{ ok: boolean; sessionId?: string; error?: string }> {
    if (!window.gesu?.activityTracking) {
        return { ok: false, error: 'Activity tracking not available' };
    }

    return await window.gesu.activityTracking.startSession({ type, taskId, projectId });
}

/**
 * End an activity tracking session
 */
export async function endActivitySession(sessionId: string): Promise<{ ok: boolean; error?: string }> {
    if (!window.gesu?.activityTracking) {
        return { ok: false, error: 'Activity tracking not available' };
    }

    return await window.gesu.activityTracking.endSession({ sessionId });
}

/**
 * Get activity summary for a date range
 */
export async function getActivitySummary(
    startDate: string,
    endDate: string
): Promise<{ ok: boolean; sessions?: ActivitySession[]; error?: string }> {
    if (!window.gesu?.activityTracking) {
        return { ok: false, error: 'Activity tracking not available' };
    }

    return await window.gesu.activityTracking.getSummary({ startDate, endDate });
}

/**
 * Record a task completion
 */
export async function recordTaskCompletion(
    taskId: string,
    duration?: number
): Promise<{ ok: boolean; completionId?: string; error?: string }> {
    if (!window.gesu?.activityTracking) {
        return { ok: false, error: 'Activity tracking not available' };
    }

    return await window.gesu.activityTracking.recordTaskCompletion({ taskId, duration });
}

/**
 * Clear activity sessions (for data cleanup)
 * @param afterDate - Optional ISO date string. If provided, only deletes sessions after this date.
 */
export async function clearAllActivitySessions(afterDate?: string): Promise<{ ok: boolean; error?: string }> {
    const tracking = (window as any).gesu?.activityTracking;
    if (!tracking?.clearAllSessions) {
        return { ok: false, error: 'Clear sessions not available' };
    }

    return await tracking.clearAllSessions(
        afterDate ? { afterDate } : {}
    );
}

