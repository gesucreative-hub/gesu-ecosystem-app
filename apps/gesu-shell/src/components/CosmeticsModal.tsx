/**
 * CosmeticsModal - Pet customization interface
 * Uses SegmentedControl for tab navigation
 */
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Check, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SegmentedControl } from './SegmentedControl';
import {
    ALL_COSMETICS,
    Cosmetic,
    CosmeticType,
    getEquippedCosmetics,
    isCosmeticUnlocked,
    canUnlockCosmetic,
    equipCosmetic,
    unequipCosmetic,
    unlockCosmetic,
    getLevel,
    getStreak,
    subscribe,
} from '../stores/gamificationStore';

interface CosmeticsModalProps {
    isOpen: boolean;
    onClose: () => void;
}


export function CosmeticsModal({ isOpen, onClose }: CosmeticsModalProps) {
    const { t, i18n } = useTranslation('modals');
    const [equipped, setEquipped] = useState(getEquippedCosmetics());
    const [selectedType, setSelectedType] = useState<CosmeticType>('hat');
    const [, forceUpdate] = useState(0);

    // Memoized type options - only recreated when language changes
    const COSMETIC_TYPE_OPTIONS = useMemo(() => [
        { value: 'hat', label: t('cosmetics.types.hat', '🎩 Hats') },
        { value: 'cape', label: t('cosmetics.types.cape', '🔥 Capes') },
        { value: 'accessory', label: t('cosmetics.types.accessory', '✨ Acc') },
        { value: 'aura', label: t('cosmetics.types.aura', '💫 Auras') },
        { value: 'background', label: t('cosmetics.types.background', '🌌 BG') },
    ], [t, i18n.language]);


    useEffect(() => {
        const unsubscribe = subscribe(() => {
            setEquipped(getEquippedCosmetics());
            forceUpdate(x => x + 1);
        });
        return unsubscribe;
    }, []);

    const handleEquip = (cosmetic: Cosmetic) => {
        if (!isCosmeticUnlocked(cosmetic.id)) {
            if (canUnlockCosmetic(cosmetic)) {
                unlockCosmetic(cosmetic.id);
            } else {
                return;
            }
        }
        
        if (equipped[cosmetic.type] === cosmetic.id) {
            unequipCosmetic(cosmetic.type);
        } else {
            equipCosmetic(cosmetic.id);
        }
    };

    const getUnlockRequirement = (cosmetic: Cosmetic): string => {
        const { type, value } = cosmetic.unlockCondition;
        switch (type) {
            case 'level': return t('cosmetics.unlockLevel', 'Level {{value}}', { value });
            case 'streak': return t('cosmetics.unlockStreak', '{{value}}-day streak', { value });
            case 'achievement': return t('cosmetics.unlockAchievement', 'Achievement');
            default: return t('common:status.unknown', 'Unknown');
        }
    };

    const cosmetics = ALL_COSMETICS.filter(c => c.type === selectedType);
    const level = getLevel();
    const streak = getStreak();

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        onClick={e => e.stopPropagation()}
                        className="bg-tokens-panel border border-tokens-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-tokens-border">
                            <div className="flex items-center gap-2">
                                <Sparkles size={20} className="text-tokens-brand-DEFAULT" />
                                <h2 className="text-lg font-bold text-tokens-fg">{t('cosmetics.title')}</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-tokens-muted/20 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Stats */}
                        <div className="px-4 py-2 bg-tokens-bg/50 flex items-center gap-4 text-xs text-tokens-muted border-b border-tokens-border">
                            <span>{t('cosmetics.level', 'Level')}: <strong className="text-tokens-fg">{level}</strong></span>
                            <span>{t('cosmetics.streak', 'Streak')}: <strong className="text-tokens-fg">{streak} {t('common:units.days', 'days')}</strong></span>
                        </div>

                        {/* Segmented Control Tabs */}
                        <div className="p-3 border-b border-tokens-border bg-tokens-bg/30">
                            <SegmentedControl
                                options={COSMETIC_TYPE_OPTIONS}
                                value={selectedType}
                                onChange={(value) => setSelectedType(value as CosmeticType)}
                                size="sm"
                                fullWidth
                            />
                        </div>

                        {/* Cosmetics Grid - Fixed height for consistency */}
                        <div className="p-4 grid grid-cols-4 gap-3 h-64 overflow-y-auto">
                            {cosmetics.map(cosmetic => {
                                const isUnlocked = isCosmeticUnlocked(cosmetic.id);
                                const canUnlock = canUnlockCosmetic(cosmetic);
                                const isEquipped = equipped[cosmetic.type] === cosmetic.id;

                                return (
                                    <motion.button
                                        key={cosmetic.id}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleEquip(cosmetic)}
                                        disabled={!isUnlocked && !canUnlock}
                                        className={`relative aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-all border-2 ${
                                            isEquipped
                                                ? 'border-tokens-brand-DEFAULT bg-tokens-brand-DEFAULT/10 shadow-lg shadow-tokens-brand-DEFAULT/20'
                                                : isUnlocked || canUnlock
                                                    ? 'border-tokens-border hover:border-tokens-brand-DEFAULT/50 bg-tokens-bg'
                                                    : 'border-tokens-border/50 bg-tokens-muted/10 opacity-50 cursor-not-allowed'
                                        }`}
                                        title={isUnlocked ? cosmetic.name : t('cosmetics.requires', { requirement: getUnlockRequirement(cosmetic), defaultValue: `Requires: ${getUnlockRequirement(cosmetic)}` })}
                                    >
                                        <span className={`text-2xl ${!isUnlocked && !canUnlock ? 'grayscale' : ''}`}>
                                            {cosmetic.emoji}
                                        </span>
                                        <span className="text-[10px] text-tokens-muted truncate max-w-full px-1">
                                            {cosmetic.name}
                                        </span>

                                        {isEquipped ? (
                                            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-tokens-brand-DEFAULT flex items-center justify-center">
                                                <Check size={12} className="text-white" />
                                            </div>
                                        ) : !isUnlocked && !canUnlock ? (
                                            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-tokens-muted flex items-center justify-center">
                                                <Lock size={10} className="text-tokens-bg" />
                                            </div>
                                        ) : canUnlock && !isUnlocked ? (
                                            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center animate-pulse">
                                                <span className="text-[8px]">{t('cosmetics.new', 'NEW')}</span>
                                            </div>
                                        ) : null}
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className="p-3 border-t border-tokens-border bg-tokens-bg/50">
                            <p className="text-xs text-tokens-muted text-center">
                                {t('cosmetics.unlockHint', 'Unlock cosmetics by leveling up, completing achievements, or building streaks!')}
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
