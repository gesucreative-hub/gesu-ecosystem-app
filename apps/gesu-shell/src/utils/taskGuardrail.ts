// Universal Task Guardrail - Enforce max 3 active tasks across all sources

import { countActiveProjectHubTasksToday } from '../stores/projectHubTasksStore';
import { getFinishSession } from '../stores/finishModeStore';

export const MAX_ACTIVE_TASKS = 3;

/**
 * Count total active tasks across all sources:
 * - Project Hub tasks (sent to Compass)
 * - Finish Mode active session
 * - Future: Compass direct tasks (if added)
 */
export function getActiveTaskCount(): number {
    let count = 0;

    // Project Hub tasks
    count += countActiveProjectHubTasksToday();

    // Finish Mode session (counts as 1 if active today and not ended)
    const finishSession = getFinishSession();
    if (finishSession && finishSession.dateKey === getTodayKey() && !finishSession.endedAt) {
        count += 1;
    }

    return count;
}

/**
 * Check if user can add another task
 */
export function canAddTask(): boolean {
    return getActiveTaskCount() < MAX_ACTIVE_TASKS;
}

/**
 * Get remaining task slots
 */
export function getRemainingSlots(): number {
    return Math.max(0, MAX_ACTIVE_TASKS - getActiveTaskCount());
}

/**
 * Get user-facing message when at limit
 */
export function getBlockedMessage(): string {
    return `Max ${MAX_ACTIVE_TASKS} active tasks. Complete one first to add more.`;
}

// Helper to get today's date key
function getTodayKey(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
