/**
 * Gamification Service
 * Handles XP events, celebrations, and sound effects
 */

import confetti from 'canvas-confetti';
import {
    addXP,
    XP_REWARDS,
    isSoundEnabled,
    Achievement,
} from '../stores/gamificationStore';

// ─────────────────────────────────────────────────────────────────────────────
// Sound Effects - Native HTML5 Audio (Electron-safe)
// Pre-cached for better performance and reliability
// ─────────────────────────────────────────────────────────────────────────────

type SoundType = 'taskComplete' | 'combo' | 'levelUp' | 'achievement';

const SOUND_CONFIG: Record<SoundType, { path: string; volume: number }> = {
    taskComplete: { path: '/sounds/task-complete.mp3', volume: 0.3 },
    combo: { path: '/sounds/combo.mp3', volume: 0.4 },
    levelUp: { path: '/sounds/level-up.mp3', volume: 0.5 },
    achievement: { path: '/sounds/achievement.mp3', volume: 0.5 },
};

// Pre-cached audio elements (created on first use)
let audioCache: Record<SoundType, HTMLAudioElement | null> = {
    taskComplete: null,
    combo: null,
    levelUp: null,
    achievement: null,
};

function getOrCreateAudio(type: SoundType): HTMLAudioElement {
    if (!audioCache[type]) {
        audioCache[type] = new Audio(SOUND_CONFIG[type].path);
        audioCache[type]!.volume = SOUND_CONFIG[type].volume;
    }
    return audioCache[type]!;
}

function playSound(type: SoundType) {
    if (!isSoundEnabled()) return;

    try {
        const audio = getOrCreateAudio(type);
        
        // Reset to beginning if already playing
        audio.currentTime = 0;
        
        // Play and ignore any errors
        audio.play().catch(() => {
            // Silently ignore - audio may be blocked until user interaction
        });
    } catch (err) {
        console.warn('[Gamification] Sound failed:', err);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Confetti Effects (Brand Colors: Purple #4141b9, Green #a4db74, Cyan #06b6d4)
// ─────────────────────────────────────────────────────────────────────────────

function fireConfetti(type: 'levelUp' | 'achievement' | 'combo' | 'project') {
    const defaults = {
        origin: { y: 0.7 },
        zIndex: 9999,
    };

    // Brand palette
    const brandPurple = '#4141b9';
    const brandGreen = '#a4db74';
    const brandCyan = '#06b6d4';
    const brandPink = '#a855f7';
    const brandEmerald = '#10b981';

    switch (type) {
        case 'levelUp':
            // Big celebration with brand colors
            confetti({
                ...defaults,
                particleCount: 150,
                spread: 100,
                colors: [brandPurple, brandGreen, brandCyan, '#ffffff'],
            });
            setTimeout(() => {
                confetti({
                    ...defaults,
                    particleCount: 100,
                    spread: 120,
                    origin: { x: 0.2, y: 0.6 },
                    colors: [brandPurple, brandPink, brandGreen],
                });
                confetti({
                    ...defaults,
                    particleCount: 100,
                    spread: 120,
                    origin: { x: 0.8, y: 0.6 },
                    colors: [brandCyan, brandEmerald, brandGreen],
                });
            }, 200);
            break;

        case 'project':
            // Victory celebration - brand gradient feel
            const duration = 2000;
            const end = Date.now() + duration;
            const frame = () => {
                confetti({
                    particleCount: 5,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: [brandGreen, brandCyan, brandEmerald],
                });
                confetti({
                    particleCount: 5,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: [brandPurple, brandPink, brandCyan],
                });
                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            };
            frame();
            break;

        case 'achievement':
            // Starburst with brand accent
            confetti({
                ...defaults,
                particleCount: 80,
                spread: 70,
                startVelocity: 30,
                colors: [brandPurple, brandGreen, brandCyan, '#ffffff'],
            });
            break;

        case 'combo':
            // Mini burst with energetic brand colors
            confetti({
                ...defaults,
                particleCount: 30,
                spread: 50,
                colors: [brandCyan, brandEmerald, brandGreen],
            });
            break;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Event Handlers (called from other stores/services)
// ─────────────────────────────────────────────────────────────────────────────

// Track achievements to show
// Achievement callback for toast notifications
let achievementCallback: ((achievement: Achievement) => void) | null = null;

export function onAchievementUnlock(callback: (achievement: Achievement) => void) {
    achievementCallback = callback;
}

function showAchievements(achievements: Achievement[]) {
    achievements.forEach((achievement, index) => {
        setTimeout(() => {
            if (achievementCallback) {
                achievementCallback(achievement);
            }
            playSound('achievement');
            fireConfetti('achievement');
        }, index * 1500);
    });
}

/**
 * Called when a DoD item is completed
 */
export function onDoDItemComplete(_itemId: string): void {
    try {
        const result = addXP(XP_REWARDS.DOD_ITEM, 'dod_item');

        playSound('taskComplete');

        // Combo celebration at milestones
        if (result.xpGained > XP_REWARDS.DOD_ITEM * 1.5) {
            playSound('combo');
            if ([5, 10].includes(Math.floor(result.xpGained / XP_REWARDS.DOD_ITEM))) {
                fireConfetti('combo');
            }
        }

        // Level up celebration
        if (result.leveledUp) {
            playSound('levelUp');
            fireConfetti('levelUp');
        }

        // Show achievements
        if (result.newAchievements.length > 0) {
            showAchievements(result.newAchievements);
        }
    } catch (err) {
        console.error('[Gamification] onDoDItemComplete failed:', err);
    }
}

/**
 * Called when a workflow step is completed
 */
export function onWorkflowStepComplete(_nodeId: string): void {
    try {
        const result = addXP(XP_REWARDS.WORKFLOW_STEP, 'workflow_step');

        playSound('taskComplete');

        if (result.leveledUp) {
            playSound('levelUp');
            fireConfetti('levelUp');
        }

        if (result.newAchievements.length > 0) {
            showAchievements(result.newAchievements);
        }
    } catch (err) {
        console.error('[Gamification] onWorkflowStepComplete failed:', err);
    }
}

/**
 * Called when a project is 100% complete
 */
export function onProjectComplete(_projectId: string): void {
    try {
        const result = addXP(XP_REWARDS.PROJECT_COMPLETE, 'project_complete');

        playSound('levelUp');
        fireConfetti('project');

        if (result.newAchievements.length > 0) {
            showAchievements(result.newAchievements);
        }
    } catch (err) {
        console.error('[Gamification] onProjectComplete failed:', err);
    }
}

/**
 * Called when a compass snapshot is saved
 */
export function onCompassSnapshot(): void {
    try {
        const result = addXP(XP_REWARDS.COMPASS_SNAPSHOT, 'compass_snapshot');

        // No sound for snapshots (too frequent)

        if (result.leveledUp) {
            playSound('levelUp');
            fireConfetti('levelUp');
        }

        if (result.newAchievements.length > 0) {
            showAchievements(result.newAchievements);
        }
    } catch (err) {
        console.error('[Gamification] onCompassSnapshot failed:', err);
    }
}

/**
 * Manual trigger for testing
 */
export function testCelebration(type: 'levelUp' | 'achievement' | 'combo' | 'project') {
    try {
        fireConfetti(type);
        playSound(type === 'levelUp' ? 'levelUp' : type === 'combo' ? 'combo' : 'achievement');
    } catch (err) {
        console.error('[Gamification] testCelebration failed:', err);
    }
}

