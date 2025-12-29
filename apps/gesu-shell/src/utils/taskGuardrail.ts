// Universal Task Guardrail - Enforce max active tasks across all sources
// S3-0b: Includes Daily Plan tasks in WIP count

import { MAX_ACTIVE_ITEMS } from '../config/guardrails';
import { countActiveProjectHubTasksToday } from '../stores/projectHubTasksStore';
import { getFinishSession } from '../stores/finishModeStore';
import { getTodayPlanTaskCount } from '../stores/dailyCheckInStore';

// Helper to get today's date key
function getTodayKey(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Count total WIP across all sources:
 * - Project Hub tasks (sent to Compass)
 * - Finish Mode active session (counts as 1)
 * - Daily Plan tasks (S3-0b)
 */
export function getTotalWipCount(): number {
    let count = 0;

    // Project Hub tasks
    count += countActiveProjectHubTasksToday();

    // Finish Mode session (counts as 1 if active today and not ended)
    const finishSession = getFinishSession();
    if (finishSession && finishSession.dateKey === getTodayKey() && !finishSession.endedAt) {
        count += 1;
    }

    // Daily Plan tasks (S3-0b)
    count += getTodayPlanTaskCount();

    return count;
}

/**
 * Check if user can add another task (any type)
 */
export function canAddAnyTask(): boolean {
    return getTotalWipCount() < MAX_ACTIVE_ITEMS;
}

/**
 * Get remaining WIP slots
 */
export function getRemainingWipSlots(): number {
    return Math.max(0, MAX_ACTIVE_ITEMS - getTotalWipCount());
}

/**
 * @deprecated Use getTotalWipCount() instead
 */
export function getActiveTaskCount(): number {
    return getTotalWipCount();
}

/**
 * @deprecated Use canAddAnyTask() instead
 * Kept for backward compatibility with existing code
 */
export function canAddTask(): boolean {
    return canAddAnyTask();
}

/**
 * @deprecated Use getRemainingWipSlots() instead
 */
export function getRemainingSlots(): number {
    return getRemainingWipSlots();
}

/**
 * Get user-facing message when at limit
 */
export function getBlockedMessage(): string {
    return `Max ${MAX_ACTIVE_ITEMS} active tasks. Complete one first to add more.`;
}
