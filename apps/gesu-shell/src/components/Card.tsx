/**
 * Card Component
 * Enhanced with framer-motion hover effects
 */
import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CardProps {
    children: ReactNode;
    title?: ReactNode;
    description?: string;
    className?: string;
    noPadding?: boolean;
    headerAction?: ReactNode;
    interactive?: boolean; // Enable hover effects
}

export function Card({ 
    children, 
    title, 
    description, 
    className = '', 
    noPadding = false, 
    headerAction,
    interactive = false 
}: CardProps) {
    const baseClassName = `bg-tokens-panel border border-tokens-border rounded-xl shadow-sm overflow-visible ${interactive ? 'cursor-pointer hover:shadow-lg hover:border-tokens-brand-DEFAULT/30 transition-shadow' : ''} ${className}`;

    // Use conditional rendering instead of dynamic component to fix TypeScript
    if (interactive) {
        return (
            <motion.div 
                whileHover={{ scale: 1.01, y: -2 }}
                whileTap={{ scale: 0.99 }}
                transition={{ type: 'spring' as const, stiffness: 400, damping: 25 }}
                className={baseClassName}
            >
                {(title || headerAction) && (
                    <div className="px-6 py-4 border-b border-tokens-border flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            {title && <h3 className="text-lg font-semibold text-tokens-fg tracking-tight">{title}</h3>}
                            {description && <p className="text-sm text-tokens-muted mt-1">{description}</p>}
                        </div>
                        {headerAction && <div>{headerAction}</div>}
                    </div>
                )}
                <div className={noPadding ? '' : 'p-6'}>
                    {children}
                </div>
            </motion.div>
        );
    }

    return (
        <div className={baseClassName}>
            {(title || headerAction) && (
                <div className="px-6 py-4 border-b border-tokens-border flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        {title && <h3 className="text-lg font-semibold text-tokens-fg tracking-tight">{title}</h3>}
                        {description && <p className="text-sm text-tokens-muted mt-1">{description}</p>}
                    </div>
                    {headerAction && <div>{headerAction}</div>}
                </div>
            )}
            <div className={noPadding ? '' : 'p-6'}>
                {children}
            </div>
        </div>
    );
}
