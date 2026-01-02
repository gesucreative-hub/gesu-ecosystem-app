/**
 * GamificationBadge - Compact horizontal XP/Level badge for header area
 * Shows level, XP, and streak in a horizontal layout
 */

import { useTranslation } from 'react-i18next';
import { Flame, Star, Sparkles } from 'lucide-react';
import { useGamification } from '../hooks/useGamification';
import { FocusPet } from './FocusPet';
import { getEquippedCosmetics, ALL_COSMETICS } from '../stores/gamificationStore';

interface GamificationBadgeProps {
    onClick?: () => void;
}

export function GamificationBadge({ onClick }: GamificationBadgeProps) {
    const { t } = useTranslation('common');
    const equipped = getEquippedCosmetics();
    
    // Get equipped cosmetic emojis
    const equippedEmojis = {
        hat: ALL_COSMETICS.find(c => c.id === equipped.hat)?.emoji,
        cape: ALL_COSMETICS.find(c => c.id === equipped.cape)?.emoji,
        accessory: ALL_COSMETICS.find(c => c.id === equipped.accessory)?.emoji,
        background: ALL_COSMETICS.find(c => c.id === equipped.background)?.emoji,
        aura: ALL_COSMETICS.find(c => c.id === equipped.aura)?.emoji,
    };
    
    const {
        xp,
        level,
        levelProgress,
        combo,
        comboMultiplier,
        streak,
        petMood,
        petEvolution,
    } = useGamification();

    return (
        <button
            onClick={onClick}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-tokens-border/50 bg-tokens-panel hover:bg-tokens-panel2 transition-all group cursor-pointer"
            title={t('gamification.viewDetails', 'View gamification details')}
        >
            {/* Mini Pet */}
            <div className="w-8 h-8 flex items-center justify-center">
                <FocusPet mood={petMood} evolution={petEvolution} size="sm" cosmetics={equippedEmojis} />
            </div>
            
            {/* Level Badge */}
            <div className="flex items-center gap-1 text-xs">
                <Sparkles size={12} className="text-tokens-brand-DEFAULT" />
                <span className="font-bold text-tokens-fg">Lv.{level}</span>
            </div>
            
            {/* XP with mini progress */}
            <div className="flex flex-col items-start">
                <div className="flex items-center gap-1 text-[10px]">
                    <Star size={10} className="text-yellow-600 dark:text-yellow-500" />
                    <span className="text-tokens-fg font-medium">{xp.toLocaleString()}</span>
                </div>
                {/* Progress bar */}
                <div className="w-12 h-1 bg-tokens-panel2 rounded-full overflow-hidden mt-0.5">
                    <div
                        className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full"
                        style={{ width: `${levelProgress}%` }}
                    />
                </div>
            </div>
            
            {/* Streak */}
            {streak > 0 && (
                <div className="flex items-center gap-0.5 text-[10px]">
                    <Flame size={10} className="text-orange-600 dark:text-orange-500" />
                    <span className="text-tokens-fg font-medium">{streak}d</span>
                </div>
            )}
            
            {/* Combo Multiplier */}
            {combo > 1 && (
                <span className="text-[10px] font-bold text-tokens-brand-DEFAULT bg-tokens-brand-DEFAULT/10 px-1.5 py-0.5 rounded">
                    {comboMultiplier}x
                </span>
            )}
        </button>
    );
}
