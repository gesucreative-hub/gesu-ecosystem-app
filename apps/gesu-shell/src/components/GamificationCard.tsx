/**
 * GamificationCard - XP/Level/Pet display in sidebar
 * Collapsible design with expand/collapse toggle
 * Theme-aware brand gradient
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Flame, Volume2, VolumeX, Sparkles, Palette, Trophy, Star, ChevronDown, ChevronUp, Loader2, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGamification } from '../hooks/useGamification';
import { FocusPet } from './FocusPet';
import { CosmeticsModal } from './CosmeticsModal';
import { SyncStatusIndicator } from './SyncStatusIndicator';
import { LeaderboardModal } from './LeaderboardModal';
import { GameRulesModal } from './GameRulesModal';
import { getEquippedCosmetics, ALL_COSMETICS } from '../stores/gamificationStore';
import { getSyncStatus, subscribeSyncStatus } from '../services/gamificationSyncService';

interface GamificationCardProps {
    isCollapsed: boolean;
}

export function GamificationCard({ isCollapsed }: GamificationCardProps) {
    const { t } = useTranslation('common');
    const [showCosmetics, setShowCosmetics] = useState(false);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [showGameRules, setShowGameRules] = useState(false);
    const [isExpanded, setIsExpanded] = useState(() => {
        // Load from localStorage
        const saved = localStorage.getItem('gesu.petCardExpanded');
        return saved ? JSON.parse(saved) : false;
    });
    
    // Track sync status to show loading during initial sync
    const [syncStatus, setSyncStatus] = useState(getSyncStatus());
    const isInitialSyncing = syncStatus.isSyncing && !syncStatus.lastSyncAt;
    
    // Persist expand state
    useEffect(() => {
        localStorage.setItem('gesu.petCardExpanded', JSON.stringify(isExpanded));
    }, [isExpanded]);
    
    // Subscribe to sync status changes
    useEffect(() => {
        return subscribeSyncStatus(setSyncStatus);
    }, []);
    
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
        levelTitle,
        nextLevelXp,
        levelProgress,
        combo,
        comboMultiplier,
        streak,
        petMood,
        petEvolution,
        soundEnabled,
        toggleSound,
    } = useGamification();

    // Collapsed sidebar view
    if (isCollapsed) {
        return (
            <div className="flex flex-col items-center gap-2 mb-2">
                <FocusPet mood={petMood} evolution={petEvolution} size="sm" cosmetics={equippedEmojis} />
                <div
                    className="w-10 h-10 rounded-xl bg-tokens-panel2 border border-tokens-border flex items-center justify-center cursor-pointer hover:bg-tokens-panel hover:scale-105 transition-all relative"
                    title={`${t('gamification.level', 'Level')} ${level} • ${xp.toLocaleString()} XP`}
                >
                    <span className="text-xs font-bold text-tokens-fg">{level}</span>
                    {combo > 1 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-tokens-brand-DEFAULT rounded-full text-[8px] font-bold text-white flex items-center justify-center">
                            {combo}x
                        </span>
                    )}
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Redesigned pet card - centered layout with bottom gradient glow */}
            <div className="mx-2 mb-1 rounded-xl border border-tokens-border/50 overflow-hidden relative bg-tokens-panel">
                {/* Bottom gradient glow - brand color at bottom */}
                <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-tokens-brand-DEFAULT/30 via-tokens-brand-DEFAULT/10 to-transparent pointer-events-none" />
                
                {/* Main Content */}
                <div 
                    className="relative z-10 p-2 cursor-pointer"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    {/* Centered Pet */}
                    <div className="flex justify-center mb-1.5">
                        <FocusPet mood={petMood} evolution={petEvolution} size="lg" cosmetics={equippedEmojis} />
                    </div>
                    
                    {/* Evolution Title */}
                    <div className="text-center mb-1.5">
                        <div className="flex items-center justify-center gap-1">
                            <Sparkles size={12} className="text-tokens-brand-DEFAULT" />
                            <span className="text-sm font-bold text-tokens-fg">{t(`gamification.petEvolution.${petEvolution}`, petEvolution)}</span>
                        </div>
                        <span className="text-[10px] text-tokens-muted">{t('gamification.level')} {level} • {t(`gamification.levelTitles.${levelTitle.toLowerCase().replace(/\s+/g, '')}`, levelTitle)}</span>
                    </div>
                    
                    {/* Stats Row - Simple inline text with better contrast */}
                    <div className="flex justify-center items-center gap-3 mb-2 text-[11px]">
                        <span className="flex items-center gap-1">
                            <Star size={12} className="text-yellow-600 dark:text-yellow-500" />
                            {isInitialSyncing ? (
                                <Loader2 size={12} className="animate-spin text-tokens-muted" />
                            ) : (
                                <span className="text-tokens-fg font-semibold">{xp.toLocaleString()}</span>
                            )}
                        </span>
                        <span className="flex items-center gap-1">
                            <Flame size={12} className={streak > 0 ? 'text-orange-600 dark:text-orange-500' : 'text-tokens-muted'} />
                            <span className="text-tokens-fg font-semibold">{streak}d</span>
                        </span>
                        {combo > 1 && (
                            <span className="text-tokens-brand-DEFAULT font-bold">
                                {comboMultiplier}x {t('gamification.combo').toLowerCase()}
                            </span>
                        )}
                    </div>
                    
                    {/* Progress Bar with shimmer animation */}
                    <div className="h-2 bg-tokens-panel2 rounded-full overflow-hidden mb-1 relative">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-600 via-purple-600 to-green-600 rounded-full transition-all duration-500 relative overflow-hidden"
                            style={{ width: `${levelProgress}%` }}
                        >
                            {/* Shimmer overlay */}
                            <div 
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                style={{
                                    animation: 'shimmer 2s infinite',
                                    transform: 'skewX(-20deg)',
                                }}
                            />
                        </div>
                    </div>
                    <div className="text-center text-[9px] text-tokens-muted mb-1">
                        {nextLevelXp - (xp % nextLevelXp)} {t('gamification.xp')} {t('gamification.toNextLevel', 'to next level')}
                    </div>
                    
                    {/* Expand toggle indicator */}
                    <div className="flex justify-center">
                        <button className="p-0.5 rounded text-tokens-muted hover:text-tokens-fg transition-colors">
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                    </div>
                </div>
                
                {/* Expanded Content */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <div className="relative z-10 px-2 pb-2 border-t border-tokens-border/50">
                                {/* Controls Row */}
                                <div className="flex justify-center gap-2 pt-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowLeaderboard(true); }}
                                        className="p-2 rounded-lg bg-tokens-panel2/50 hover:bg-tokens-panel2 text-tokens-muted hover:text-yellow-500 transition-colors"
                                        title={t('gamification.leaderboard')}
                                    >
                                        <Trophy size={16} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowCosmetics(true); }}
                                        className="p-2 rounded-lg bg-tokens-panel2/50 hover:bg-tokens-panel2 text-tokens-muted hover:text-tokens-brand-DEFAULT transition-colors"
                                        title={t('gamification.customize', 'Customize')}
                                    >
                                        <Palette size={16} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); toggleSound(); }}
                                        className="p-2 rounded-lg bg-tokens-panel2/50 hover:bg-tokens-panel2 text-tokens-muted hover:text-tokens-fg transition-colors"
                                        title={soundEnabled ? t('gamification.mute', 'Mute') : t('gamification.unmute', 'Unmute')}
                                    >
                                        {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowGameRules(true); }}
                                        className="p-2 rounded-lg bg-tokens-panel2/50 hover:bg-tokens-panel2 text-tokens-muted hover:text-accent-purple transition-colors"
                                        title={t('gamification.gameRules', 'Game Rules')}
                                    >
                                        <HelpCircle size={16} />
                                    </button>
                                    <SyncStatusIndicator />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
            {/* Cosmetics Modal */}
            <CosmeticsModal isOpen={showCosmetics} onClose={() => setShowCosmetics(false)} />
            
            {/* Leaderboard Modal */}
            <LeaderboardModal isOpen={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
            
            {/* Game Rules Modal */}
            <GameRulesModal isOpen={showGameRules} onClose={() => setShowGameRules(false)} />
        </>
    );
}
