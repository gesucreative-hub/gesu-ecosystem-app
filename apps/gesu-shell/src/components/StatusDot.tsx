

export type StatusDotStatus = 'done' | 'in-progress' | 'pending' | 'todo';

interface StatusDotProps {
    status: StatusDotStatus;
    size?: 'sm' | 'md';
    className?: string;
}

/**
 * StatusDot Component
 * 
 * Displays a colored status indicator dot with optional animation.
 * Uses semantic tokens for theme-aware colors.
 * 
 * @param status - The status to display (done/in-progress/pending/todo)
 * @param size - Size variant (sm: 2.5, md: 2)
 * @param className - Additional CSS classes
 */
export function StatusDot({ status, size = 'sm', className = '' }: StatusDotProps) {
    const sizeClasses = {
        sm: 'w-2.5 h-2.5',
        md: 'w-2 h-2'
    };

    const statusColors: Record<StatusDotStatus, string> = {
        'done': 'bg-tokens-success',
        'in-progress': 'bg-tokens-warning animate-pulse',
        'pending': 'bg-tokens-muted',
        'todo': 'bg-tokens-muted'
    };

    return (
        <div 
            className={`rounded-full flex-shrink-0 ${sizeClasses[size]} ${statusColors[status]} ${className}`}
        />
    );
}
