/**
 * Gamification Store
 * Manages XP, levels, combos, streaks, pet mood, achievements, and cosmetics
 * User-specific persistence via localStorage
 */



// ─────────────────────────────────────────────────────────────────────────────
// Types & Constants
// ─────────────────────────────────────────────────────────────────────────────

export type PetMood = 'happy' | 'sleepy' | 'sad' | 'fired_up' | 'evolved';
export type PetEvolution = 'egg' | 'hatchling' | 'baby' | 'teen' | 'adult';
export type CosmeticType = 'hat' | 'cape' | 'accessory' | 'background' | 'aura';

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    unlockedAt?: number;
}

export interface Cosmetic {
    id: string;
    name: string;
    type: CosmeticType;
    emoji: string;
    unlockCondition: {
        type: 'level' | 'achievement' | 'streak';
        value: number | string;
    };
}

export interface EquippedCosmetics {
    hat?: string;
    cape?: string;
    accessory?: string;
    background?: string;
    aura?: string;
}

export interface GamificationState {
    xp: number;
    level: number;
    combo: number;
    comboExpiry: number; // timestamp when combo resets
    streak: number;
    lastActiveDate: string; // YYYY-MM-DD
    petMood: PetMood;
    achievements: string[]; // unlocked achievement IDs
    totalTasksCompleted: number;
    totalProjectsCompleted: number;
    soundEnabled: boolean;
    completedTaskIds: string[]; // Track which tasks have been awarded XP
    unlockedCosmetics: string[]; // IDs of unlocked cosmetics
    equippedCosmetics: EquippedCosmetics;
}

// Level thresholds and titles (50 levels)
// XP curve: 100/lvl (1-10), 200/lvl (11-20), 350/lvl (21-30), 500/lvl (31-40), 750/lvl (41-50)
export const LEVELS = generateLevels();

function generateLevels() {
    const levels = [];
    let cumulativeXP = 0;
    
    const titles: Record<number, string> = {
        1: 'Beginner', 5: 'Novice', 10: 'Apprentice',
        15: 'Explorer', 20: 'Focused Mind', 25: 'Craftsman',
        30: 'Producer', 35: 'Expert', 40: 'Master',
        45: 'Virtuoso', 50: 'Productivity Legend',
    };
    
    for (let level = 1; level <= 50; level++) {
        // Find appropriate title
        let title = 'Dedicated';
        for (const [lvl, t] of Object.entries(titles)) {
            if (level >= parseInt(lvl)) title = t;
        }
        
        levels.push({ level, xpRequired: cumulativeXP, title });
        
        // Add XP for next level based on tier
        if (level <= 10) cumulativeXP += 100;
        else if (level <= 20) cumulativeXP += 200;
        else if (level <= 30) cumulativeXP += 350;
        else if (level <= 40) cumulativeXP += 500;
        else cumulativeXP += 750;
    }
    
    return levels;
}

// Pet evolution spread across 50 levels
export function getPetEvolution(level: number): PetEvolution {
    if (level <= 5) return 'egg';
    if (level <= 12) return 'hatchling';
    if (level <= 22) return 'baby';
    if (level <= 35) return 'teen';
    return 'adult';
}

// For backwards compatibility
export const PET_EVOLUTIONS: Record<number, PetEvolution> = Object.fromEntries(
    Array.from({ length: 50 }, (_, i) => [i + 1, getPetEvolution(i + 1)])
);

// XP rewards
export const XP_REWARDS = {
    DOD_ITEM: 10,
    WORKFLOW_STEP: 50,
    PROJECT_COMPLETE: 200,
    COMPASS_SNAPSHOT: 5,
    DAILY_STREAK_BONUS: 5, // multiplied by streak days
};

// Combo multipliers with cap at 3x
export const COMBO_MULTIPLIERS: Record<number, number> = {
    3: 1.25,   // 3-4 combo
    5: 1.5,    // 5-7 combo
    8: 2.0,    // 8-14 combo
    15: 3.0,   // 15+ combo (MAX)
};

// Combo timeout (30 minutes)
const COMBO_TIMEOUT_MS = 30 * 60 * 1000;

// All available achievements
export const ALL_ACHIEVEMENTS: Achievement[] = [
    { id: 'first_blood', name: 'First Blood', description: 'Complete your first task', icon: '🎯' },
    { id: 'on_fire', name: 'On Fire', description: '7-day compass streak', icon: '🔥' },
    { id: 'speed_demon', name: 'Speed Demon', description: '5 tasks in 1 hour', icon: '⚡' },
    { id: 'centurion', name: 'Centurion', description: 'Complete 100 tasks', icon: '🏆' },
    { id: 'perfectionist', name: 'Perfectionist', description: 'Complete a project 100%', icon: '💯' },
    { id: 'combo_master', name: 'Combo Master', description: 'Reach 10x combo', icon: '🎮' },
    { id: 'early_bird', name: 'Early Bird', description: 'Complete task before 9 AM', icon: '🌅' },
    { id: 'night_owl', name: 'Night Owl', description: 'Complete task after 10 PM', icon: '🦉' },
];

// All available cosmetics (emoji-based, zero asset cost)
export const ALL_COSMETICS: Cosmetic[] = [
    // Hats
    { id: 'cap', name: 'Cap', type: 'hat', emoji: '🧢', unlockCondition: { type: 'level', value: 3 } },
    { id: 'crown', name: 'Crown', type: 'hat', emoji: '👑', unlockCondition: { type: 'level', value: 10 } },
    { id: 'top_hat', name: 'Top Hat', type: 'hat', emoji: '🎩', unlockCondition: { type: 'level', value: 20 } },
    { id: 'graduate', name: 'Graduate Cap', type: 'hat', emoji: '🎓', unlockCondition: { type: 'level', value: 30 } },
    { id: 'wizard', name: 'Wizard Hat', type: 'hat', emoji: '🔮', unlockCondition: { type: 'level', value: 40 } },
    
    // Capes
    { id: 'cape_fire', name: 'Fire Cape', type: 'cape', emoji: '🔥', unlockCondition: { type: 'level', value: 5 } },
    { id: 'cape_ice', name: 'Ice Cape', type: 'cape', emoji: '❄️', unlockCondition: { type: 'streak', value: 7 } },
    { id: 'cape_lightning', name: 'Lightning Cape', type: 'cape', emoji: '⚡', unlockCondition: { type: 'level', value: 15 } },
    { id: 'cape_wave', name: 'Wave Cape', type: 'cape', emoji: '🌊', unlockCondition: { type: 'level', value: 25 } },
    { id: 'cape_sakura', name: 'Sakura Cape', type: 'cape', emoji: '🌸', unlockCondition: { type: 'level', value: 35 } },
    
    // Accessories
    { id: 'star', name: 'Star', type: 'accessory', emoji: '⭐', unlockCondition: { type: 'achievement', value: 'first_blood' } },
    { id: 'sparkle', name: 'Sparkle', type: 'accessory', emoji: '✨', unlockCondition: { type: 'level', value: 8 } },
    { id: 'diamond', name: 'Diamond', type: 'accessory', emoji: '💎', unlockCondition: { type: 'level', value: 25 } },
    { id: 'trophy', name: 'Trophy', type: 'accessory', emoji: '🏆', unlockCondition: { type: 'achievement', value: 'centurion' } },
    { id: 'medal', name: 'Medal', type: 'accessory', emoji: '🎖️', unlockCondition: { type: 'level', value: 40 } },
    
    // Backgrounds
    { id: 'bg_bloom', name: 'Bloom', type: 'background', emoji: '🌸', unlockCondition: { type: 'level', value: 12 } },
    { id: 'bg_frost', name: 'Frost', type: 'background', emoji: '❄️', unlockCondition: { type: 'streak', value: 14 } },
    { id: 'bg_sunset', name: 'Sunset', type: 'background', emoji: '🌅', unlockCondition: { type: 'achievement', value: 'early_bird' } },
    { id: 'bg_galaxy', name: 'Galaxy', type: 'background', emoji: '🌌', unlockCondition: { type: 'level', value: 50 } },
    
    // Auras
    { id: 'aura_sparkle', name: 'Sparkle Aura', type: 'aura', emoji: '💫', unlockCondition: { type: 'level', value: 18 } },
    { id: 'aura_glow', name: 'Glow Aura', type: 'aura', emoji: '🔆', unlockCondition: { type: 'level', value: 35 } },
    { id: 'aura_rainbow', name: 'Rainbow Aura', type: 'aura', emoji: '🌈', unlockCondition: { type: 'level', value: 45 } },
];

// ─────────────────────────────────────────────────────────────────────────────
// Storage
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'gesu-gamification';

function getStorageKey(): string {
    // User-specific key based on active project or default
    const userId = localStorage.getItem('gesu.userId') || 'default';
    return `${STORAGE_KEY}-${userId}`;
}

function createDefaultState(): GamificationState {
    return {
        xp: 0,
        level: 1,
        combo: 0,
        comboExpiry: 0,
        streak: 0,
        lastActiveDate: '',
        petMood: 'happy',
        achievements: [],
        totalTasksCompleted: 0,
        totalProjectsCompleted: 0,
        soundEnabled: true,
        completedTaskIds: [],
        unlockedCosmetics: [],
        equippedCosmetics: {},
    };
}

function loadState(): GamificationState {
    try {
        const raw = localStorage.getItem(getStorageKey());
        if (!raw) return createDefaultState();
        return { ...createDefaultState(), ...JSON.parse(raw) };
    } catch {
        return createDefaultState();
    }
}

function saveState(state: GamificationState): void {
    localStorage.setItem(getStorageKey(), JSON.stringify(state));
}

/**
 * Direct state save - used by sync service to set merged cloud state
 * Notifies subscribers after saving
 */
export function saveStateDirect(state: GamificationState): void {
    saveState(state);
    notifySubscribers();
}

// ─────────────────────────────────────────────────────────────────────────────
// State Subscribers (for React)
// ─────────────────────────────────────────────────────────────────────────────

type Subscriber = () => void;
const subscribers: Set<Subscriber> = new Set();

export function subscribe(callback: Subscriber): () => void {
    subscribers.add(callback);
    return () => subscribers.delete(callback);
}

function notifySubscribers(): void {
    subscribers.forEach(cb => cb());
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

function calculateLevel(xp: number): number {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (xp >= LEVELS[i].xpRequired) {
            return LEVELS[i].level;
        }
    }
    return 1;
}

function getComboMultiplier(combo: number): number {
    // Find highest applicable multiplier
    const thresholds = Object.keys(COMBO_MULTIPLIERS)
        .map(Number)
        .sort((a, b) => b - a);

    for (const threshold of thresholds) {
        if (combo >= threshold) {
            return COMBO_MULTIPLIERS[threshold];
        }
    }
    return 1;
}

function getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
}

function updatePetMood(state: GamificationState): PetMood {
    const now = Date.now();

    // Fired up if combo active
    if (state.combo >= 3 && state.comboExpiry > now) {
        return 'fired_up';
    }

    // Sad if streak broken
    const today = getTodayDate();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (state.lastActiveDate && state.lastActiveDate !== today && state.lastActiveDate !== yesterdayStr) {
        return 'sad';
    }

    // Sleepy if no activity for 2+ hours (check combo expiry as proxy)
    if (state.comboExpiry < now - 2 * 60 * 60 * 1000 && state.lastActiveDate === today) {
        return 'sleepy';
    }

    return 'happy';
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export function getState(): GamificationState {
    return loadState();
}

export function getXP(): number {
    return loadState().xp;
}

export function getLevel(): number {
    return loadState().level;
}

export function getLevelInfo(): { level: number; title: string; xp: number; nextLevelXp: number; progress: number } {
    const state = loadState();
    const currentLevelInfo = LEVELS.find(l => l.level === state.level) || LEVELS[0];
    const nextLevelInfo = LEVELS.find(l => l.level === state.level + 1);

    const xpForCurrentLevel = currentLevelInfo.xpRequired;
    const xpForNextLevel = nextLevelInfo?.xpRequired || currentLevelInfo.xpRequired + 1000;
    const xpInLevel = state.xp - xpForCurrentLevel;
    const xpNeeded = xpForNextLevel - xpForCurrentLevel;

    return {
        level: state.level,
        title: currentLevelInfo.title,
        xp: state.xp,
        nextLevelXp: xpForNextLevel,
        progress: Math.min((xpInLevel / xpNeeded) * 100, 100),
    };
}

export function getCombo(): { count: number; multiplier: number; expiresIn: number } {
    const state = loadState();
    const now = Date.now();

    if (state.comboExpiry < now) {
        return { count: 0, multiplier: 1, expiresIn: 0 };
    }

    return {
        count: state.combo,
        multiplier: getComboMultiplier(state.combo),
        expiresIn: state.comboExpiry - now,
    };
}

export function getStreak(): number {
    return loadState().streak;
}

export function getPetInfo(): { mood: PetMood; evolution: PetEvolution } {
    const state = loadState();
    return {
        mood: updatePetMood(state),
        evolution: PET_EVOLUTIONS[state.level] || 'egg',
    };
}

export function getAchievements(): Achievement[] {
    const state = loadState();
    return ALL_ACHIEVEMENTS.filter(a => state.achievements.includes(a.id));
}

export function isSoundEnabled(): boolean {
    return loadState().soundEnabled;
}

export function setSoundEnabled(enabled: boolean): void {
    const state = loadState();
    state.soundEnabled = enabled;
    saveState(state);
    notifySubscribers();
}

/**
 * Add XP with combo multiplier
 * Returns: { xpGained, newLevel, leveledUp, newAchievements }
 */
export function addXP(baseAmount: number, reason: string): {
    xpGained: number;
    newLevel: number;
    leveledUp: boolean;
    newAchievements: Achievement[];
} {
    const state = loadState();
    const now = Date.now();
    const today = getTodayDate();

    // Check if combo is still valid
    if (state.comboExpiry < now) {
        state.combo = 0;
    }

    // Increment combo
    state.combo += 1;
    state.comboExpiry = now + COMBO_TIMEOUT_MS;

    // Calculate XP with multiplier
    const multiplier = getComboMultiplier(state.combo);
    const xpGained = Math.floor(baseAmount * multiplier);

    // Update XP and level
    const oldLevel = state.level;
    const maxLevel = LEVELS[LEVELS.length - 1].level;
    
    // Cap XP at max level
    if (state.level >= maxLevel) {
        // Already at max level - no more XP gains
        console.log(`[Gamification] Max level ${maxLevel} reached - XP capped`);
        return { xpGained: 0, newLevel: maxLevel, leveledUp: false, newAchievements: [] };
    }
    
    state.xp += xpGained;
    state.level = calculateLevel(state.xp);
    
    // Ensure level doesn't exceed max
    if (state.level > maxLevel) {
        state.level = maxLevel;
    }
    
    const leveledUp = state.level > oldLevel;

    // Update streak
    if (state.lastActiveDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (state.lastActiveDate === yesterdayStr) {
            state.streak += 1;
        } else if (state.lastActiveDate !== today) {
            state.streak = 1; // Reset streak
        }
        state.lastActiveDate = today;
    }

    // Update task count
    if (reason === 'dod_item') {
        state.totalTasksCompleted += 1;
    } else if (reason === 'project_complete') {
        state.totalProjectsCompleted += 1;
    }

    // Update pet mood
    state.petMood = updatePetMood(state);

    // Check achievements
    const newAchievements = checkAndUnlockAchievements(state);

    // Save
    saveState(state);
    notifySubscribers();

    console.log(`[Gamification] +${xpGained} XP (${baseAmount} × ${multiplier}x) for ${reason}. Total: ${state.xp} XP, Level ${state.level}`);

    return { xpGained, newLevel: state.level, leveledUp, newAchievements };
}

function checkAndUnlockAchievements(state: GamificationState): Achievement[] {
    const newlyUnlocked: Achievement[] = [];

    const unlock = (id: string) => {
        if (!state.achievements.includes(id)) {
            state.achievements.push(id);
            const achievement = ALL_ACHIEVEMENTS.find(a => a.id === id);
            if (achievement) newlyUnlocked.push(achievement);
        }
    };

    // First Blood - first task
    if (state.totalTasksCompleted >= 1) unlock('first_blood');

    // Centurion - 100 tasks
    if (state.totalTasksCompleted >= 100) unlock('centurion');

    // On Fire - 7-day streak
    if (state.streak >= 7) unlock('on_fire');

    // Combo Master - 10x combo
    if (state.combo >= 10) unlock('combo_master');

    // Perfectionist - completed a project
    if (state.totalProjectsCompleted >= 1) unlock('perfectionist');

    // Time-based achievements
    const hour = new Date().getHours();
    if (hour < 9 && state.totalTasksCompleted >= 1) unlock('early_bird');
    if (hour >= 22) unlock('night_owl');

    return newlyUnlocked;
}

/**
 * Reset combo (called when idle too long)
 */
export function resetCombo(): void {
    const state = loadState();
    state.combo = 0;
    state.comboExpiry = 0;
    saveState(state);
    notifySubscribers();
}

/**
 * Full reset (for testing/debug)
 */
export function resetAll(): void {
    saveState(createDefaultState());
    notifySubscribers();
}

/**
 * Check if a task has already been rewarded with XP
 */
export function hasTaskBeenRewarded(taskId: string): boolean {
    const state = loadState();
    return state.completedTaskIds.includes(taskId);
}

/**
 * Mark a task as rewarded (called after awarding XP)
 */
export function markTaskRewarded(taskId: string): void {
    const state = loadState();
    if (!state.completedTaskIds.includes(taskId)) {
        state.completedTaskIds.push(taskId);
        saveState(state);
    }
}

/**
 * Unmark a task as rewarded (called when task is unchecked)
 * This allows the task to be rewarded again if re-checked
 */
export function unmarkTaskRewarded(taskId: string): void {
    const state = loadState();
    state.completedTaskIds = state.completedTaskIds.filter(id => id !== taskId);
    saveState(state);
}

// ─────────────────────────────────────────────────────────────────────────────
// Cosmetics API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get all unlocked cosmetics for the current user
 */
export function getUnlockedCosmetics(): Cosmetic[] {
    const state = loadState();
    return ALL_COSMETICS.filter(c => state.unlockedCosmetics.includes(c.id));
}

/**
 * Get currently equipped cosmetics
 */
export function getEquippedCosmetics(): EquippedCosmetics {
    return loadState().equippedCosmetics;
}

/**
 * Check if a cosmetic is unlocked
 */
export function isCosmeticUnlocked(cosmeticId: string): boolean {
    const state = loadState();
    return state.unlockedCosmetics.includes(cosmeticId);
}

/**
 * Check if a cosmetic can be unlocked based on conditions
 */
export function canUnlockCosmetic(cosmetic: Cosmetic): boolean {
    const state = loadState();
    
    switch (cosmetic.unlockCondition.type) {
        case 'level':
            return state.level >= (cosmetic.unlockCondition.value as number);
        case 'streak':
            return state.streak >= (cosmetic.unlockCondition.value as number);
        case 'achievement':
            return state.achievements.includes(cosmetic.unlockCondition.value as string);
        default:
            return false;
    }
}

/**
 * Unlock a cosmetic if conditions are met
 */
export function unlockCosmetic(cosmeticId: string): boolean {
    const state = loadState();
    const cosmetic = ALL_COSMETICS.find(c => c.id === cosmeticId);
    
    if (!cosmetic || state.unlockedCosmetics.includes(cosmeticId)) {
        return false;
    }
    
    if (canUnlockCosmetic(cosmetic)) {
        state.unlockedCosmetics.push(cosmeticId);
        saveState(state);
        notifySubscribers();
        console.log(`[Gamification] Cosmetic unlocked: ${cosmetic.name}`);
        return true;
    }
    
    return false;
}

/**
 * Equip a cosmetic (must be unlocked)
 */
export function equipCosmetic(cosmeticId: string): boolean {
    const state = loadState();
    const cosmetic = ALL_COSMETICS.find(c => c.id === cosmeticId);
    
    if (!cosmetic || !state.unlockedCosmetics.includes(cosmeticId)) {
        return false;
    }
    
    state.equippedCosmetics[cosmetic.type] = cosmeticId;
    saveState(state);
    notifySubscribers();
    console.log(`[Gamification] Cosmetic equipped: ${cosmetic.name}`);
    return true;
}

/**
 * Unequip a cosmetic by type
 */
export function unequipCosmetic(type: CosmeticType): void {
    const state = loadState();
    delete state.equippedCosmetics[type];
    saveState(state);
    notifySubscribers();
}

/**
 * Check and unlock all eligible cosmetics based on current state
 * Should be called after level up, achievement unlock, or streak update
 */
export function unlockEligibleCosmetics(): Cosmetic[] {
    const state = loadState();
    const newlyUnlocked: Cosmetic[] = [];
    
    for (const cosmetic of ALL_COSMETICS) {
        if (!state.unlockedCosmetics.includes(cosmetic.id) && canUnlockCosmetic(cosmetic)) {
            state.unlockedCosmetics.push(cosmetic.id);
            newlyUnlocked.push(cosmetic);
        }
    }
    
    if (newlyUnlocked.length > 0) {
        saveState(state);
        notifySubscribers();
        console.log(`[Gamification] Unlocked ${newlyUnlocked.length} new cosmetics!`);
    }
    
    return newlyUnlocked;
}
