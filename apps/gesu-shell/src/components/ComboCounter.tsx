/**
 * ComboCounter Component
 * Displays combo count and multiplier - clean, minimal design
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';

interface ComboCounterProps {
    combo: number;
    multiplier: number;
}

export function ComboCounter({ combo, multiplier }: ComboCounterProps) {
    if (combo < 2) {
        return (
            <div className="flex items-center gap-1 text-[10px] text-tokens-muted px-2 py-1 rounded-full bg-tokens-panel2">
                <Zap size={10} />
                <span>No combo</span>
            </div>
        );
    }

    // Simple color based on combo level
    const getColor = () => {
        if (combo >= 10) return 'text-tokens-brand-DEFAULT';
        if (combo >= 5) return 'text-tokens-success';
        return 'text-tokens-fg';
    };

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={combo}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-tokens-panel2 border border-tokens-border"
            >
                <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.3 }}
                >
                    <Zap size={12} className={getColor()} fill="currentColor" />
                </motion.div>
                
                <span className={`text-[11px] font-bold ${getColor()}`}>
                    {combo}x
                </span>
                
                {multiplier > 1 && (
                    <span className="text-[9px] text-tokens-muted">
                        ({multiplier}x XP)
                    </span>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
