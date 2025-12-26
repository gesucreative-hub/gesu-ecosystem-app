/**
 * LeaderboardModal
 * Shows leaderboard rankings with weekly/all-time tabs and opt-in controls
 * Optimized to reduce redundant fetches
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Crown, Medal, User, Shield, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SegmentedControl } from './SegmentedControl';
import { 
    getTopAllTime, 
    getTopWeekly, 
    LeaderboardEntry
} from '../services/leaderboardService';
import { useAuth } from '../contexts/AuthContext';

type TabType = 'weekly' | 'allTime';

interface LeaderboardModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function LeaderboardModal({ isOpen, onClose }: LeaderboardModalProps) {
    const { t } = useTranslation('modals');
    const { user } = useAuth();
    const [tab, setTab] = useState<TabType>('weekly');
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Cache to prevent redundant fetches
    const entriesCache = useRef<{ weekly: LeaderboardEntry[] | null; allTime: LeaderboardEntry[] | null }>({
        weekly: null,
        allTime: null
    });
    const lastFetch = useRef<number>(0);

    // Load entries when tab changes (with caching)
    useEffect(() => {
        if (!isOpen) return;
        
        const loadEntries = async () => {
            // Check cache first
            const cached = entriesCache.current[tab];
            const now = Date.now();
            
            // Use cache if less than 30 seconds old
            if (cached && (now - lastFetch.current) < 30000) {
                setEntries(cached);
                setLoading(false);
                return;
            }
            
            setLoading(true);
            
            try {
                const data = tab === 'weekly' 
                    ? await getTopWeekly(15)
                    : await getTopAllTime(15);
                
                entriesCache.current[tab] = data;
                lastFetch.current = now;
                setEntries(data);
            } catch (err) {
                console.error('[Leaderboard] Failed to load entries:', err);
            }
            
            setLoading(false);
        };
        
        loadEntries();
    }, [isOpen, tab]);

    // Clear cache when modal closes
    useEffect(() => {
        if (!isOpen) {
            entriesCache.current = { weekly: null, allTime: null };
        }
    }, [isOpen]);

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1: return <Crown size={16} className="text-yellow-500" />;
            case 2: return <Medal size={16} className="text-gray-400" />;
            case 3: return <Medal size={16} className="text-amber-600" />;
            default: return <span className="text-xs text-tokens-muted">{rank}</span>;
        }
    };

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
                        className="bg-tokens-panel border border-tokens-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-tokens-border">
                            <div className="flex items-center gap-2">
                                <Trophy size={20} className="text-yellow-500" />
                                <h2 className="text-lg font-bold text-tokens-fg">{t('leaderboard.title')}</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-tokens-muted/20 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="p-3 border-b border-tokens-border">
                            <SegmentedControl
                                fullWidth
                                size="sm"
                                options={[
                                    { value: 'weekly', label: t('leaderboard.weekly') },
                                    { value: 'allTime', label: t('leaderboard.allTime') },
                                ]}
                                value={tab}
                                onChange={(value) => setTab(value as 'weekly' | 'allTime')}
                            />
                        </div>

                        {/* Leaderboard Entries - fixed height to show 6+ entries */}
                        <div className="h-[400px] overflow-y-auto">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 size={24} className="animate-spin text-tokens-muted" />
                                </div>
                            ) : entries.length === 0 ? (
                                <div className="text-center py-12 text-tokens-muted">
                                    <Trophy size={32} className="mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">{t('leaderboard.noData')}</p>
                                </div>
                            ) : (
                                <div className="p-2 space-y-1">
                                    {entries.map((entry) => (
                                        <motion.div
                                            key={entry.userId}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className={`flex items-center gap-3 p-2 rounded-lg ${
                                                entry.isCurrentUser 
                                                    ? 'bg-tokens-brand-DEFAULT/10 border border-tokens-brand-DEFAULT/30' 
                                                    : 'hover:bg-tokens-panel2'
                                            }`}
                                        >
                                            {/* Rank */}
                                            <div className="w-6 flex justify-center">
                                                {getRankIcon(entry.rank)}
                                            </div>

                                            {/* Avatar */}
                                            {entry.avatarUrl ? (
                                                <img 
                                                    src={entry.avatarUrl} 
                                                    alt="" 
                                                    className="w-8 h-8 rounded-full"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-tokens-panel2 flex items-center justify-center">
                                                    {entry.isAnonymous ? (
                                                        <Shield size={14} className="text-tokens-muted" />
                                                    ) : (
                                                        <User size={14} className="text-tokens-muted" />
                                                    )}
                                                </div>
                                            )}

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-tokens-fg truncate">
                                                    {entry.displayName}
                                                    {entry.isCurrentUser && (
                                                        <span className="text-tokens-brand-DEFAULT ml-1">{t('leaderboard.youSuffix', '(you)')}</span>
                                                    )}
                                                </p>
                                                <p className="text-xs text-tokens-muted">
                                                    {t('leaderboard.levelStreak', { level: entry.level, streak: entry.streak, defaultValue: `Level ${entry.level} • ${entry.streak}d streak` })}
                                                </p>
                                            </div>

                                            {/* XP */}
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-tokens-fg">
                                                    {(tab === 'weekly' ? entry.weeklyXp : entry.xp).toLocaleString()}
                                                </p>
                                                <p className="text-[10px] text-tokens-muted">XP</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer - Status only (auto-joined on login) */}
                        <div className="p-3 border-t border-tokens-border">
                            {!user ? (
                                <p className="text-xs text-tokens-muted text-center">
                                    {t('leaderboard.signInToJoin', 'Sign in to join the leaderboard')}
                                </p>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-emerald-500">
                                        {t('leaderboard.youreCompeting', '⭐ You\'re competing!')}
                                    </span>
                                    <span className="text-[10px] text-tokens-muted">
                                        {t('leaderboard.autoJoined', 'Auto-joined on login')}
                                    </span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
