/**
 * AchievementToast Component
 * Shows a celebratory popup when an achievement is unlocked
 * Centered on screen with brand-aligned styling
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Achievement } from '../stores/gamificationStore';
import { onAchievementUnlock } from '../services/gamificationService';

export function AchievementToast() {
    const { t } = useTranslation('modals');
    const [achievements, setAchievements] = useState<Achievement[]>([]);

    useEffect(() => {
        // Subscribe to achievement unlocks
        onAchievementUnlock((achievement) => {
            setAchievements(prev => [...prev, achievement]);
        });
    }, []);

    const dismiss = useCallback((id: string) => {
        setAchievements(prev => prev.filter(a => a.id !== id));
    }, []);

    // Auto-dismiss after 6 seconds
    useEffect(() => {
        if (achievements.length > 0) {
            const timer = setTimeout(() => {
                setAchievements(prev => prev.slice(1));
            }, 6000);
            return () => clearTimeout(timer);
        }
    }, [achievements]);

    if (achievements.length === 0) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
            {/* Backdrop overlay */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/30 backdrop-blur-sm pointer-events-auto"
                onClick={() => achievements[0] && dismiss(achievements[0].id)}
            />
            
            <AnimatePresence mode="wait">
                {achievements.slice(0, 1).map((achievement) => (
                    <motion.div
                        key={achievement.id}
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: -20 }}
                        className="bg-gradient-to-br from-primary-700 via-accent-purple to-secondary-300 text-white rounded-2xl shadow-2xl shadow-primary-700/50 p-[3px] w-[400px] max-w-[90vw] relative overflow-hidden pointer-events-auto"
                    >
                        {/* Inner container */}
                        <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-sm rounded-[13px] p-5 relative overflow-hidden">
                            {/* Sparkle background */}
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-primary-700/20 via-transparent to-secondary-300/10 pointer-events-none" />
                            
                            {/* Shimmer effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_3s_infinite] pointer-events-none" />

                            {/* Header */}
                            <div className="flex items-center justify-between mb-4 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-gradient-to-br from-primary-700/40 to-secondary-300/40">
                                        <Trophy size={18} className="text-secondary-300" />
                                    </div>
                                    <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                                        <Sparkles size={14} className="text-secondary-300 animate-pulse" />
                                        <span className="bg-gradient-to-r from-secondary-300 to-accent-cyan bg-clip-text text-transparent">
                                            {t('achievements.title')}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => dismiss(achievement.id)}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <X size={16} className="text-white/60 hover:text-white" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex items-center gap-5 relative z-10">
                                <motion.div
                                    className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-700/40 via-accent-purple/30 to-secondary-300/40 border border-white/10 flex items-center justify-center text-4xl"
                                    animate={{ 
                                        scale: [1, 1.15, 1],
                                        rotate: [0, 5, -5, 0],
                                    }}
                                    transition={{ 
                                        duration: 0.8,
                                        repeat: 2,
                                    }}
                                >
                                    {achievement.icon}
                                </motion.div>
                                <div className="flex-1">
                                    <div className="font-bold text-xl text-white mb-1">{achievement.name}</div>
                                    <div className="text-sm text-white/70">{achievement.description}</div>
                                </div>
                            </div>

                            {/* Progress bar for auto-dismiss */}
                            <motion.div
                                className="mt-5 h-1.5 bg-white/10 rounded-full overflow-hidden relative z-10"
                            >
                                <motion.div
                                    className="h-full bg-gradient-to-r from-secondary-300 via-accent-cyan to-primary-700"
                                    initial={{ width: '100%' }}
                                    animate={{ width: '0%' }}
                                    transition={{ duration: 6, ease: 'linear' }}
                                />
                            </motion.div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
