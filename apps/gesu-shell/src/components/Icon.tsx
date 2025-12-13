import { LucideIcon } from 'lucide-react';

// Centralized Icon wrapper for consistent sizing and styling across the app
// All icons should use this wrapper for uniformity

export interface IconProps {
    icon: LucideIcon;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    className?: string;
}

const sizeMap = {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
};

export function Icon({ icon: LucideComponent, size = 'md', className = '' }: IconProps) {
    return (
        <LucideComponent
            size={sizeMap[size]}
            strokeWidth={1.5}
            className={className}
        />
    );
}
