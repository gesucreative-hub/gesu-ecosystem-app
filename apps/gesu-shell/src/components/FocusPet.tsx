/**
 * FocusPet Component
 * Animated pet that evolves with level and shows mood
 * Displays equipped cosmetics
 */

import { motion } from 'framer-motion';
import { PetMood, PetEvolution } from '../stores/gamificationStore';

interface CosmeticsDisplay {
    hat?: string;
    cape?: string;
    accessory?: string;
    aura?: string;
    background?: string;
}

interface FocusPetProps {
    mood: PetMood;
    evolution: PetEvolution;
    size?: 'sm' | 'md' | 'lg';
    cosmetics?: CosmeticsDisplay;
}

// Pet emoji based on evolution
const PET_ICONS: Record<PetEvolution, string> = {
    egg: '🥚',
    hatchling: '🐣',
    baby: '🐥',
    teen: '🐦',
    adult: '🦅',
};

// Mood emojis
const MOOD_EMOJIS: Record<PetMood, string | null> = {
    happy: null,
    sleepy: '💤',
    sad: '💧',
    fired_up: '🔥',
    evolved: '✨',
};

// Glow effects for special moods
const MOOD_GLOWS: Record<PetMood, string> = {
    happy: '',
    sleepy: '',
    sad: '',
    fired_up: 'shadow-[0_0_12px_rgba(249,115,22,0.4)]',
    evolved: 'shadow-[0_0_15px_rgba(168,85,247,0.5)]',
};

const SIZES = {
    sm: { container: 'w-10 h-10', emoji: 'text-xl', overlay: 'text-[8px]', cosmetic: 'text-[8px]' },
    md: { container: 'w-12 h-12', emoji: 'text-2xl', overlay: 'text-xs', cosmetic: 'text-[10px]' },
    lg: { container: 'w-16 h-16', emoji: 'text-3xl', overlay: 'text-sm', cosmetic: 'text-sm' },
};

export function FocusPet({ mood, evolution, size = 'md', cosmetics }: FocusPetProps) {
    const petIcon = PET_ICONS[evolution];
    const moodEmoji = MOOD_EMOJIS[mood];
    const glow = MOOD_GLOWS[mood];
    const sizeClass = SIZES[size];

    // Animation based on mood
    const getAnimation = () => {
        switch (mood) {
            case 'happy': return { y: [0, -3, 0] };
            case 'sleepy': return { rotate: [-3, 3, -3] };
            case 'sad': return { y: [0, 1, 0] };
            case 'fired_up': return { scale: [1, 1.1, 1] };
            case 'evolved': return { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] };
            default: return { y: [0, -3, 0] };
        }
    };

    return (
        <motion.div
            className={`${sizeClass.container} rounded-xl bg-tokens-panel2 border border-tokens-border flex items-center justify-center relative transition-shadow ${glow}`}
            animate={getAnimation()}
            transition={{ 
                repeat: Infinity, 
                duration: mood === 'fired_up' ? 0.5 : 2, 
                ease: 'easeInOut' 
            }}
        >
            {/* Background cosmetic - fills entire container */}
            {cosmetics?.background && (
                <span 
                    className="absolute inset-0 flex items-center justify-center opacity-25 pointer-events-none overflow-hidden rounded-xl"
                    style={{ fontSize: size === 'lg' ? '3rem' : size === 'md' ? '2rem' : '1.5rem' }}
                >
                    {cosmetics.background}
                </span>
            )}
            
            {/* Aura cosmetic (behind pet) */}
            {cosmetics?.aura && (
                <motion.span 
                    className={`absolute ${sizeClass.overlay}`}
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                >
                    {cosmetics.aura}
                </motion.span>
            )}
            
            {/* Main Pet */}
            <span className={`${sizeClass.emoji} relative z-10`}>{petIcon}</span>
            
            {/* Hat cosmetic (positioned ON the pet's head) */}
            {cosmetics?.hat && (
                <span className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 ${sizeClass.cosmetic} z-20`}>
                    {cosmetics.hat}
                </span>
            )}
            
            {/* Cape cosmetic (left) */}
            {cosmetics?.cape && (
                <span className={`absolute -left-1 top-1/2 -translate-y-1/2 ${sizeClass.cosmetic}`}>
                    {cosmetics.cape}
                </span>
            )}
            
            {/* Accessory cosmetic (right) */}
            {cosmetics?.accessory && (
                <span className={`absolute -right-1 top-1/2 -translate-y-1/2 ${sizeClass.cosmetic}`}>
                    {cosmetics.accessory}
                </span>
            )}
            
            {/* Mood Overlay */}
            {moodEmoji && (
                <motion.span
                    className={`absolute -top-1 -right-1 ${sizeClass.overlay} z-20`}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 500 }}
                >
                    {moodEmoji}
                </motion.span>
            )}
        </motion.div>
    );
}

