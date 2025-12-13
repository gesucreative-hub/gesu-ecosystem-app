import React from 'react';
import { Button } from './Button';

interface LauncherCardProps {
    title: string;
    description: string;
    buttonText?: string;
    onClick?: () => void;
    primary?: boolean;
}

export const LauncherCard: React.FC<LauncherCardProps> = ({
    title,
    description,
    buttonText = "Open",
    onClick,
    primary = false
}) => {
    return (
        <div
            onClick={onClick}
            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-tokens-border bg-tokens-panel p-6 hover:shadow-xl hover:shadow-tokens-brand-DEFAULT/5 hover:border-tokens-border/80 transition-all duration-300 flex flex-col h-full"
        >
            <div className="flex flex-col h-full z-10 relative">
                <div className="mb-4">
                    <h3 className="text-xl font-bold text-tokens-fg mb-2 group-hover:text-tokens-brand-DEFAULT transition-colors">{title}</h3>
                    <p className="text-tokens-muted text-sm leading-relaxed">{description}</p>
                </div>

                <div className="mt-auto pt-4">
                    <Button
                        onClick={(e) => { e.stopPropagation(); onClick?.(); }}
                        variant={primary ? 'primary' : 'outline'}
                        fullWidth
                        icon={<span>→</span>}
                        iconPosition="circle"
                    >
                        {buttonText}
                    </Button>
                </div>
            </div>

            {/* Hover Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-tokens-brand-DEFAULT/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        </div>
    );
};
