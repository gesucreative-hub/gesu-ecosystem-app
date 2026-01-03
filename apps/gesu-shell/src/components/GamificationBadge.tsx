/**
 * GamificationBadge - Compact horizontal XP/Level badge for header area
 * Shows level, XP, and streak in a horizontal layout
 */

import { useTranslation } from 'react-i18next';
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
        petMood,
        petEvolution,
    } = useGamification();

    return (
        <button
            onClick={onClick}
            className="flex items-center justify-center p-1 rounded-xl hover:bg-tokens-panel2 transition-all cursor-pointer"
            title={t('gamification.viewDetails', 'View gamification details')}
        >
            {/* Mini Pet */}
            <div className="w-8 h-8 flex items-center justify-center">
                <FocusPet mood={petMood} evolution={petEvolution} size="sm" cosmetics={equippedEmojis} />
            </div>
            
        </button>
    );
}
