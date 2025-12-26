/**
 * AnimatedList - Staggered animation for list items
 * Wraps children with framer-motion stagger animations
 */
import { ReactNode } from 'react';
import { motion, Variants } from 'framer-motion';

interface AnimatedListProps {
    children: ReactNode[];
    className?: string;
    staggerDelay?: number;
    initialDelay?: number;
}

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: (custom: { staggerDelay: number; initialDelay: number }) => ({
        opacity: 1,
        transition: {
            delayChildren: custom.initialDelay,
            staggerChildren: custom.staggerDelay,
        },
    }),
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: 'spring',
            stiffness: 300,
            damping: 24,
        },
    },
};

export function AnimatedList({ 
    children, 
    className = '',
    staggerDelay = 0.05,
    initialDelay = 0 
}: AnimatedListProps) {
    return (
        <motion.div
            className={className}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            custom={{ staggerDelay, initialDelay }}
        >
            {children.map((child, index) => (
                <motion.div key={index} variants={itemVariants}>
                    {child}
                </motion.div>
            ))}
        </motion.div>
    );
}

/**
 * AnimatedListItem - Individual animated list item
 * Use within regular containers for manual control
 */
interface AnimatedListItemProps {
    children: ReactNode;
    delay?: number;
    className?: string;
}

export function AnimatedListItem({ children, delay = 0, className = '' }: AnimatedListItemProps) {
    return (
        <motion.div
            className={className}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
                delay,
                type: 'spring',
                stiffness: 300,
                damping: 24,
            }}
        >
            {children}
        </motion.div>
    );
}
