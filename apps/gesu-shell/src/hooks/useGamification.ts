/**
 * useGamification Hook
 * React hook for accessing gamification state
 */

import { useState, useEffect, useCallback } from 'react';
import {
    subscribe,
    getState,
    getLevelInfo,
    getCombo,
    getPetInfo,
    getAchievements,
    isSoundEnabled,
    setSoundEnabled,
    GamificationState,
    PetMood,
    PetEvolution,
    Achievement,
} from '../stores/gamificationStore';

interface UseGamificationReturn {
    // XP & Level
    xp: number;
    level: number;
    levelTitle: string;
    nextLevelXp: number;
    levelProgress: number;

    // Combo
    combo: number;
    comboMultiplier: number;
    comboExpiresIn: number;

    // Streak
    streak: number;

    // Pet
    petMood: PetMood;
    petEvolution: PetEvolution;

    // Achievements
    achievements: Achievement[];
    totalTasks: number;
    totalProjects: number;

    // Settings
    soundEnabled: boolean;
    toggleSound: () => void;
}

export function useGamification(): UseGamificationReturn {
    const [state, setState] = useState<GamificationState>(getState());

    // Subscribe to store changes
    useEffect(() => {
        const unsubscribe = subscribe(() => {
            setState(getState());
        });
        return unsubscribe;
    }, []);

    // Derived values
    const levelInfo = getLevelInfo();
    const comboInfo = getCombo();
    const petInfo = getPetInfo();
    const achievements = getAchievements();

    const toggleSound = useCallback(() => {
        setSoundEnabled(!isSoundEnabled());
    }, []);

    return {
        // XP & Level
        xp: state.xp,
        level: levelInfo.level,
        levelTitle: levelInfo.title,
        nextLevelXp: levelInfo.nextLevelXp,
        levelProgress: levelInfo.progress,

        // Combo
        combo: comboInfo.count,
        comboMultiplier: comboInfo.multiplier,
        comboExpiresIn: comboInfo.expiresIn,

        // Streak
        streak: state.streak,

        // Pet
        petMood: petInfo.mood,
        petEvolution: petInfo.evolution,

        // Achievements
        achievements,
        totalTasks: state.totalTasksCompleted,
        totalProjects: state.totalProjectsCompleted,

        // Settings
        soundEnabled: state.soundEnabled,
        toggleSound,
    };
}
