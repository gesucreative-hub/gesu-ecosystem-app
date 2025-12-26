/**
 * GameRulesModal - Shows gamification system rules
 * Explains XP, levels, streaks, combos, and pet evolution
 */

import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Flame, Zap, Trophy, Sparkles, Target } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface GameRulesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function GameRulesModal({ isOpen, onClose }: GameRulesModalProps) {
    const { t } = useTranslation('modals');
    
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-modal flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="bg-tokens-panel border border-tokens-border rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-tokens-border">
                            <div className="flex items-center gap-2">
                                <Sparkles size={18} className="text-tokens-brand-DEFAULT" />
                                <h2 className="text-base font-bold text-tokens-fg">{t('gameRules.title')}</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-lg hover:bg-tokens-panel2 text-tokens-muted hover:text-tokens-fg transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-4">
                            {/* XP Section */}
                            <div className="p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <Star size={16} className="text-yellow-500" />
                                    <h3 className="text-sm font-bold text-tokens-fg">{t('gameRules.xp.title', 'Experience Points (XP)')}</h3>
                                </div>
                                <ul className="text-xs text-tokens-muted space-y-1.5">
                                    <li>• {t('gameRules.xp.workflowSteps', 'Complete workflow steps')}: <span className="text-tokens-fg font-medium">+50-100 XP</span></li>
                                    <li>• {t('gameRules.xp.compassSnapshots', 'Log Compass snapshots')}: <span className="text-tokens-fg font-medium">+25 XP</span></li>
                                    <li>• {t('gameRules.xp.finishMode', 'Finish mode completion')}: <span className="text-tokens-fg font-medium">+150 XP</span></li>
                                    <li>• {t('gameRules.xp.dailyBonus', 'Daily activity bonus')}: <span className="text-tokens-fg font-medium">+10 XP</span></li>
                                </ul>
                            </div>

                            {/* Streak Section */}
                            <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <Flame size={16} className="text-orange-500" />
                                    <h3 className="text-sm font-bold text-tokens-fg">{t('gameRules.streak.title', 'Daily Streak')}</h3>
                                </div>
                                <p className="text-xs text-tokens-muted">
                                    {t('gameRules.streak.description', 'Log at least one activity per day to maintain your streak. Missing a day resets your streak to zero!')}
                                </p>
                            </div>

                            {/* Combo Section */}
                            <div className="p-3 rounded-xl bg-tokens-brand-DEFAULT/5 border border-tokens-brand-DEFAULT/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <Zap size={16} className="text-tokens-brand-DEFAULT" />
                                    <h3 className="text-sm font-bold text-tokens-fg">{t('gameRules.combo.title', 'Combo Multiplier')}</h3>
                                </div>
                                <p className="text-xs text-tokens-muted mb-2">
                                    {t('gameRules.combo.description', 'Complete tasks quickly to build a combo')}:
                                </p>
                                <ul className="text-xs text-tokens-muted space-y-1">
                                    <li>• {t('gameRules.combo.tier1', '2-4 tasks in a row')}: <span className="text-tokens-fg font-medium">1.5x XP</span></li>
                                    <li>• {t('gameRules.combo.tier2', '5-9 tasks in a row')}: <span className="text-tokens-fg font-medium">2x XP</span></li>
                                    <li>• {t('gameRules.combo.tier3', '10+ tasks in a row')}: <span className="text-tokens-fg font-medium">3x XP</span></li>
                                </ul>
                            </div>

                            {/* Pet Evolution Section */}
                            <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <Target size={16} className="text-purple-500" />
                                    <h3 className="text-sm font-bold text-tokens-fg">{t('gameRules.pet.title', 'Pet Evolution')}</h3>
                                </div>
                                <p className="text-xs text-tokens-muted mb-2">
                                    {t('gameRules.pet.description', 'Your pet evolves as you level up')}:
                                </p>
                                <div className="grid grid-cols-5 gap-1 text-center">
                                    <div className="text-lg">🥚</div>
                                    <div className="text-lg">🐣</div>
                                    <div className="text-lg">🐥</div>
                                    <div className="text-lg">🐦</div>
                                    <div className="text-lg">🦅</div>
                                    <div className="text-[9px] text-tokens-muted">Lv.1</div>
                                    <div className="text-[9px] text-tokens-muted">Lv.5</div>
                                    <div className="text-[9px] text-tokens-muted">Lv.10</div>
                                    <div className="text-[9px] text-tokens-muted">Lv.15</div>
                                    <div className="text-[9px] text-tokens-muted">Lv.20</div>
                                </div>
                            </div>

                            {/* Leaderboard Section */}
                            <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <Trophy size={16} className="text-emerald-500" />
                                    <h3 className="text-sm font-bold text-tokens-fg">{t('gameRules.leaderboard.title', 'Leaderboard')}</h3>
                                </div>
                                <p className="text-xs text-tokens-muted">
                                    {t('gameRules.leaderboard.description', 'Compete with other users! Weekly rankings reset every Monday. Earn more XP to climb the ranks.')}
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-tokens-border">
                            <button
                                onClick={onClose}
                                className="w-full py-2 text-sm font-medium text-white bg-tokens-brand-DEFAULT rounded-lg hover:bg-tokens-brand-hover transition-colors"
                            >
                                {t('alert.gotIt')}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
