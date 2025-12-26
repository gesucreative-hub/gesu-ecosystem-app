/**
 * Dashboard Data Utilities
 * 
 * Utilities for loading and transforming Compass snapshot data
 * for display on the Dashboard page.
 */

import { listSnapshots, CompassSnapshotListItem } from './compassSnapshotsService';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface DashboardData {
    energyTrend: EnergyDataPoint[];
    focusScores: FocusDataPoint[];
    currentEnergy: number;
    currentFocus: number;
    weeklyStats: WeeklyStats;
}

export interface EnergyDataPoint {
    date: string; // YYYY-MM-DD
    energy: number; // 1=Low, 2=Medium, 3=High
    label: string; // "Low" | "Medium" | "High"
}

export interface FocusDataPoint {
    date: string; // YYYY-MM-DD
    score: number; // 0-10
}

export interface WeeklyStats {
    avgEnergy: number;
    avgFocus: number;
    totalSessions: number;
    trend: 'up' | 'down' | 'stable';
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get last N days of dates in YYYY-MM-DD format
 */
function getLast7Days(): string[] {
    const dates: string[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
    }

    return dates;
}

/**
 * Convert energy number to label
 */
function getEnergyLabel(energy: number): string {
    if (energy <= 1) return 'Low';
    if (energy === 2) return 'Medium';
    return 'High';
}

/**
 * Calculate weekly average
 */
function calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return Math.round((values.reduce((sum, val) => sum + val, 0) / values.length) * 10) / 10;
}

/**
 * Calculate trend direction
 */
function calculateTrend(values: number[]): 'up' | 'down' | 'stable' {
    if (values.length < 2) return 'stable';

    const firstHalf = values.slice(0, Math.ceil(values.length / 2));
    const secondHalf = values.slice(Math.ceil(values.length / 2));

    const firstAvg = calculateAverage(firstHalf);
    const secondAvg = calculateAverage(secondHalf);

    const diff = secondAvg - firstAvg;

    if (diff > 0.5) return 'up';
    if (diff < -0.5) return 'down';
    return 'stable';
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Function
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Load dashboard data from Compass snapshots
 * 
 * @param workflowRoot - Workflow root path from settings
 * @returns Transformed dashboard data ready for display
 */
export async function loadDashboardData(
    workflowRoot: string | undefined
): Promise<DashboardData> {
    try {
        // Load last 30 snapshots to ensure we have 7 days of data
        const snapshots = await listSnapshots(workflowRoot, 30);

        // Get last 7 days
        const last7Days = getLast7Days();

        // Group snapshots by date (take most recent snapshot per day)
        const snapshotsByDate = new Map<string, CompassSnapshotListItem>();

        for (const snapshot of snapshots) {
            const date = new Date(snapshot.timestamp).toISOString().split('T')[0];
            if (!snapshotsByDate.has(date)) {
                snapshotsByDate.set(date, snapshot);
            }
        }

        // Build energy trend data (fill missing days with null or previous value)
        const energyTrend: EnergyDataPoint[] = [];
        let lastKnownEnergy = 2; // Default to Medium

        for (const date of last7Days) {
            const snapshot = snapshotsByDate.get(date);
            const energy = snapshot ? snapshot.energy : lastKnownEnergy;

            energyTrend.push({
                date,
                energy,
                label: getEnergyLabel(energy),
            });

            if (snapshot) {
                lastKnownEnergy = snapshot.energy;
            }
        }

        // Build focus scores data
        const focusScores: FocusDataPoint[] = [];
        let lastKnownFocus = 5; // Default to middle score

        for (const date of last7Days) {
            const snapshot = snapshotsByDate.get(date);
            const score = snapshot ? snapshot.focus : lastKnownFocus;

            focusScores.push({
                date,
                score,
            });

            if (snapshot) {
                lastKnownFocus = snapshot.focus;
            }
        }

        // Calculate current values (from most recent snapshot or defaults)
        const mostRecent = snapshots[0];
        const currentEnergy = mostRecent ? mostRecent.energy : 2;
        const currentFocus = mostRecent ? mostRecent.focus : 5;

        // Calculate weekly stats
        const energyValues = energyTrend.map(e => e.energy);
        const focusValues = focusScores.map(f => f.score);
        const totalSessions = snapshots
            .slice(0, 7)
            .reduce((sum, snap) => sum + snap.sessions.length, 0);

        const weeklyStats: WeeklyStats = {
            avgEnergy: calculateAverage(energyValues),
            avgFocus: calculateAverage(focusValues),
            totalSessions,
            trend: calculateTrend(focusValues),
        };

        return {
            energyTrend,
            focusScores,
            currentEnergy,
            currentFocus,
            weeklyStats,
        };
    } catch (error) {
        console.error('[dashboardDataUtils] Failed to load dashboard data:', error);

        // Return empty/default data on error
        const last7Days = getLast7Days();
        return {
            energyTrend: last7Days.map(date => ({
                date,
                energy: 2,
                label: 'Medium',
            })),
            focusScores: last7Days.map(date => ({
                date,
                score: 5,
            })),
            currentEnergy: 2,
            currentFocus: 5,
            weeklyStats: {
                avgEnergy: 2,
                avgFocus: 5,
                totalSessions: 0,
                trend: 'stable',
            },
        };
    }
}
