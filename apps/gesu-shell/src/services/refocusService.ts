/**
 * Refocus Service - Intelligence Layer
 * Tracks reset history, learns patterns, and provides personalized insights
 */

// --- Types ---

export type RefocusState = 'overwhelm' | 'restless' | 'avoiding' | 'foggy';

export interface ResetSession {
    id: string;
    state: RefocusState;
    protocolsCompleted: string[];
    startedAt: string;
    completedAt: string | null;
    helpfulRating: 'yes' | 'no' | 'somewhat' | null;
    startedFocusAfter: boolean;
}

export interface RefocusStats {
    totalResets: number;
    completedResets: number;
    mostCommonState: RefocusState | null;
    mostEffectiveProtocols: { name: string; helpfulCount: number }[];
    stateFrequency: Record<RefocusState, number>;
    averageCompletionTime: number; // in seconds
    weeklyTrend: { date: string; count: number }[];
}

const STORAGE_KEY = 'gesu_refocus_history';
const MAX_HISTORY = 100; // Keep last 100 sessions

// --- Storage Helpers ---

function getStoredSessions(): ResetSession[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

function saveSessions(sessions: ResetSession[]): void {
    try {
        // Keep only the last MAX_HISTORY sessions
        const trimmed = sessions.slice(-MAX_HISTORY);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch (error) {
        console.error('Failed to save refocus history:', error);
    }
}

// --- Session Management ---

export function startResetSession(state: RefocusState): ResetSession {
    const session: ResetSession = {
        id: `reset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        state,
        protocolsCompleted: [],
        startedAt: new Date().toISOString(),
        completedAt: null,
        helpfulRating: null,
        startedFocusAfter: false
    };

    const sessions = getStoredSessions();
    sessions.push(session);
    saveSessions(sessions);

    return session;
}

export function updateSession(sessionId: string, updates: Partial<ResetSession>): void {
    const sessions = getStoredSessions();
    const index = sessions.findIndex(s => s.id === sessionId);

    if (index !== -1) {
        sessions[index] = { ...sessions[index], ...updates };
        saveSessions(sessions);
    }
}

export function completeSession(sessionId: string, startedFocus: boolean): void {
    updateSession(sessionId, {
        completedAt: new Date().toISOString(),
        startedFocusAfter: startedFocus
    });
}

export function rateSession(sessionId: string, rating: 'yes' | 'no' | 'somewhat'): void {
    updateSession(sessionId, { helpfulRating: rating });
}

export function addProtocolToSession(sessionId: string, protocolName: string): void {
    const sessions = getStoredSessions();
    const session = sessions.find(s => s.id === sessionId);

    if (session) {
        session.protocolsCompleted.push(protocolName);
        saveSessions(sessions);
    }
}

// --- Analytics ---

export function getRefocusStats(): RefocusStats {
    const sessions = getStoredSessions();
    const completedSessions = sessions.filter(s => s.completedAt);

    // State frequency
    const stateFrequency: Record<RefocusState, number> = {
        overwhelm: 0,
        restless: 0,
        avoiding: 0,
        foggy: 0
    };

    sessions.forEach(s => {
        stateFrequency[s.state]++;
    });

    // Most common state
    const mostCommonState = Object.entries(stateFrequency)
        .sort((a, b) => b[1] - a[1])[0];

    // Protocol effectiveness
    const protocolRatings: Record<string, { helpful: number; total: number }> = {};

    sessions.forEach(session => {
        if (session.helpfulRating === 'yes' || session.helpfulRating === 'somewhat') {
            session.protocolsCompleted.forEach(protocol => {
                if (!protocolRatings[protocol]) {
                    protocolRatings[protocol] = { helpful: 0, total: 0 };
                }
                protocolRatings[protocol].helpful++;
                protocolRatings[protocol].total++;
            });
        } else if (session.helpfulRating === 'no') {
            session.protocolsCompleted.forEach(protocol => {
                if (!protocolRatings[protocol]) {
                    protocolRatings[protocol] = { helpful: 0, total: 0 };
                }
                protocolRatings[protocol].total++;
            });
        }
    });

    const mostEffectiveProtocols = Object.entries(protocolRatings)
        .map(([name, { helpful }]) => ({ name, helpfulCount: helpful }))
        .sort((a, b) => b.helpfulCount - a.helpfulCount)
        .slice(0, 5);

    // Average completion time
    let totalTime = 0;
    completedSessions.forEach(s => {
        const start = new Date(s.startedAt).getTime();
        const end = new Date(s.completedAt!).getTime();
        totalTime += (end - start) / 1000;
    });
    const averageCompletionTime = completedSessions.length > 0
        ? Math.round(totalTime / completedSessions.length)
        : 0;

    // Weekly trend (last 7 days)
    const weeklyTrend: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const count = sessions.filter(s =>
            s.startedAt.split('T')[0] === dateStr
        ).length;

        weeklyTrend.push({ date: dateStr, count });
    }

    return {
        totalResets: sessions.length,
        completedResets: completedSessions.length,
        mostCommonState: mostCommonState && mostCommonState[1] > 0
            ? mostCommonState[0] as RefocusState
            : null,
        mostEffectiveProtocols,
        stateFrequency,
        averageCompletionTime,
        weeklyTrend
    };
}

export function getRecommendedProtocols(state: RefocusState): string[] {
    const sessions = getStoredSessions();

    // Find sessions with the same state that were rated helpful
    const helpfulSessions = sessions.filter(
        s => s.state === state && (s.helpfulRating === 'yes' || s.helpfulRating === 'somewhat')
    );

    // Count protocol occurrences in helpful sessions
    const protocolCounts: Record<string, number> = {};
    helpfulSessions.forEach(session => {
        session.protocolsCompleted.forEach(protocol => {
            protocolCounts[protocol] = (protocolCounts[protocol] || 0) + 1;
        });
    });

    // Return protocols sorted by helpfulness
    return Object.entries(protocolCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([name]) => name);
}

export function getTodayResetCount(): number {
    const sessions = getStoredSessions();
    const today = new Date().toISOString().split('T')[0];

    return sessions.filter(s => s.startedAt.split('T')[0] === today).length;
}

export function getLastSession(): ResetSession | null {
    const sessions = getStoredSessions();
    return sessions.length > 0 ? sessions[sessions.length - 1] : null;
}
