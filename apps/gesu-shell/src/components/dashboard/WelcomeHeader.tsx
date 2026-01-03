/**
 * WelcomeHeader Component
 * 
 * Personalized greeting with date/time, search bar trigger, and profile badge
 * Search bar opens the global CommandPaletteModal (same as Ctrl+K)
 */

import { useState, useRef, useEffect } from 'react';
import { useFocusTimer } from '../../hooks/useFocusTimer';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Timer, Search, X } from 'lucide-react';
import { GamificationBadge } from '../GamificationBadge';
import { GamificationCard } from '../GamificationCard';
import { AnimatePresence, motion } from 'framer-motion';

export function WelcomeHeader() {
    const { state } = useFocusTimer();
    const { user } = useAuth();
    const { t, i18n } = useTranslation('dashboard');
    const [showGamificationPopover, setShowGamificationPopover] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);

    // Get greeting based on time of day
    const hour = new Date().getHours();
    const greetingKey = hour < 12 ? 'greeting.morning' : hour < 18 ? 'greeting.afternoon' : 'greeting.evening';
    const greeting = t(greetingKey);

    // Format date based on language
    const today = new Date();
    const locale = i18n.language.startsWith('id') ? 'id-ID' : 'en-US';
    const dateStr = today.toLocaleDateString(locale, {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    });

    // Get user display name
    const displayName = user?.displayName?.split(' ')[0] || 'Surya';

    // Open command palette (triggers the same modal as Ctrl+K in Layout.tsx)
    const openCommandPalette = () => {
        // Dispatch synthetic Ctrl+K event to trigger the global handler in Layout.tsx
        window.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'k',
            ctrlKey: true,
            bubbles: true
        }));
    };

    // Close popover on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                setShowGamificationPopover(false);
            }
        };
        if (showGamificationPopover) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showGamificationPopover]);

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-tokens-border/50">
            {/* Left: Greeting */}
            <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-extrabold text-tokens-fg tracking-tight mb-1">
                    {greeting}, {displayName} 👋
                </h1>
                <p className="text-sm text-tokens-muted">
                    {dateStr}
                </p>
            </div>

            {/* Center: Search Bar Trigger - Opens CommandPaletteModal */}
            <button
                onClick={openCommandPalette}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-tokens-panel2 border border-tokens-border rounded-xl text-tokens-muted hover:border-tokens-brand-DEFAULT/30 transition-colors cursor-pointer"
            >
                <Search size={16} />
                <span className="text-sm">{t('common:nav.search', 'Search...')}</span>
                <span className="text-[10px] font-mono opacity-50 ml-4 border border-tokens-border rounded px-1">Ctrl+K</span>
            </button>

            {/* Right: Gamification Badge + Focus Status + Profile */}
            <div className="flex items-center gap-3">
                {/* Gamification Badge with Popover */}
                <div className="relative" ref={popoverRef}>
                    <GamificationBadge onClick={() => setShowGamificationPopover(!showGamificationPopover)} />
                    
                    {/* Popover with GamificationCard */}
                    <AnimatePresence>
                        {showGamificationPopover && (
                            <motion.div
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                className="absolute right-0 top-full mt-2 z-50 w-72"
                            >
                                {/* Close button */}
                                <button
                                    onClick={() => setShowGamificationPopover(false)}
                                    className="absolute top-2 right-2 z-10 p-1 rounded-lg hover:bg-tokens-panel2 text-tokens-muted hover:text-tokens-fg transition-colors"
                                >
                                    <X size={14} />
                                </button>
                                {/* Full GamificationCard */}
                                <GamificationCard isCollapsed={false} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Focus Session Status */}
                {state.sessionActive && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-tokens-success/10 border border-tokens-success/20 rounded-lg">
                        <Timer size={14} className="text-tokens-success animate-pulse" />
                        <span className="text-xs font-medium text-tokens-success">{t('focusActive', 'Focus Active')}</span>
                    </div>
                )}

                {/* Profile Avatar Badge */}
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-tokens-brand-DEFAULT to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-lg cursor-pointer hover:scale-105 transition-transform">
                    {user?.photoURL ? (
                        <img src={user.photoURL} alt="Profile" className="w-full h-full rounded-xl object-cover" />
                    ) : (
                        <span>{displayName.charAt(0).toUpperCase()}</span>
                    )}
                </div>
            </div>
        </div>
    );
}

