/**
 * Inferred Energy System
 * 
 * Calculates an energy score from activity signals without requiring manual input.
 * This is a COMPLEMENTARY metric - displayed alongside manual energy input.
 */

import { getState as getFocusTimerState } from '../stores/focusTimerStore';
import { getTodayTasks } from '../stores/projectHubTasksStore';

export interface EnergyFactor {
    id: string;
    label: string;
    value: number;      // 0-10 contribution
    weight: number;     // Weighting factor (0-1)
    description: string;
}

export interface InferredEnergyResult {
    score: number;              // 1-10 overall score
    factors: EnergyFactor[];    // Breakdown of contributing factors
    confidence: 'low' | 'medium' | 'high';  // Based on data availability
}

/**
 * Calculate inferred energy from today's activity data.
 * 
 * Factors:
 * 1. Focus Sessions Completed (cycleCount from focusTimerStore)
 * 2. Tasks Completed (done tasks from projectHubTasksStore)
 * 3. Time of Day (morning = higher baseline, afternoon = lower)
 */
export function calculateInferredEnergy(): InferredEnergyResult {
    const factors: EnergyFactor[] = [];
    let dataPoints = 0;

    // --- Factor 1: Focus Sessions ---
    const focusState = getFocusTimerState();
    const focusCycles = focusState.cycleCount;

    // 0 cycles = 3/10, 1 cycle = 5/10, 2+ cycles = 7-10/10
    let focusScore = 3;
    if (focusCycles >= 4) focusScore = 10;
    else if (focusCycles >= 3) focusScore = 8;
    else if (focusCycles >= 2) focusScore = 7;
    else if (focusCycles >= 1) focusScore = 5;

    if (focusState.sessionActive) {
        // Bonus for being in an active session
        focusScore = Math.min(10, focusScore + 1);
        dataPoints++;
    }

    factors.push({
        id: 'focus',
        label: 'Focus Sessions',
        value: focusScore,
        weight: 0.35,
        description: `${focusCycles} focus session${focusCycles !== 1 ? 's' : ''} completed${focusState.sessionActive ? ' (active)' : ''}`,
    });

    // --- Factor 2: Tasks Completed ---
    const todayTasks = getTodayTasks();
    const doneTasks = todayTasks.filter(t => t.done).length;
    const totalTasks = todayTasks.length;

    // Scoring: 0 tasks = 4/10 (neutral), 1 = 6, 2 = 7, 3+ = 8-10
    let taskScore = 4;
    if (doneTasks >= 3) taskScore = 10;
    else if (doneTasks >= 2) taskScore = 8;
    else if (doneTasks >= 1) taskScore = 6;

    if (totalTasks > 0) {
        dataPoints++;
    }

    factors.push({
        id: 'tasks',
        label: 'Tasks Done',
        value: taskScore,
        weight: 0.35,
        description: `${doneTasks}/${totalTasks} task${totalTasks !== 1 ? 's' : ''} completed today`,
    });

    // --- Factor 3: Time of Day ---
    const now = new Date();
    const hour = now.getHours();

    // Energy curve: Morning (6-11) = higher, Early Afternoon (12-14) = dip, Late Afternoon (15-18) = recovery, Evening (19+) = low
    let timeScore = 5;
    if (hour >= 6 && hour < 11) timeScore = 8;        // Morning peak
    else if (hour >= 11 && hour < 14) timeScore = 6;  // Midday plateau
    else if (hour >= 14 && hour < 16) timeScore = 4;  // Afternoon dip
    else if (hour >= 16 && hour < 19) timeScore = 6;  // Evening recovery
    else if (hour >= 19 || hour < 6) timeScore = 3;   // Night/late = low

    factors.push({
        id: 'time',
        label: 'Time of Day',
        value: timeScore,
        weight: 0.3,
        description: hour < 12 ? 'Morning energy boost' : hour < 17 ? 'Afternoon' : 'Evening wind-down',
    });

    // --- Calculate Weighted Average ---
    let totalWeight = 0;
    let weightedSum = 0;

    factors.forEach(factor => {
        weightedSum += factor.value * factor.weight;
        totalWeight += factor.weight;
    });

    const rawScore = totalWeight > 0 ? weightedSum / totalWeight : 5;
    const score = Math.round(Math.max(1, Math.min(10, rawScore)));

    // --- Determine Confidence ---
    let confidence: 'low' | 'medium' | 'high' = 'low';
    if (dataPoints >= 2) confidence = 'high';
    else if (dataPoints >= 1) confidence = 'medium';

    return {
        score,
        factors,
        confidence,
    };
}

/**
 * Get a human-readable label for an energy score
 */
export function getEnergyLabel(score: number): string {
    if (score >= 8) return 'High';
    if (score >= 5) return 'Medium';
    return 'Low';
}

/**
 * Get a color class for an energy score (Tailwind)
 */
export function getEnergyColorClass(score: number): string {
    if (score >= 8) return 'text-emerald-500';
    if (score >= 5) return 'text-amber-500';
    return 'text-red-500';
}
