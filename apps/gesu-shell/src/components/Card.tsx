import { ReactNode } from 'react';

interface CardProps {
    children: ReactNode;
    title?: ReactNode;
    description?: string;
    className?: string;
    noPadding?: boolean;
    headerAction?: ReactNode;
}

export function Card({ children, title, description, className = '', noPadding = false, headerAction }: CardProps) {
    return (
        <div className={`bg-tokens-panel border border-tokens-border rounded-xl shadow-sm overflow-hidden ${className}`}>
            {(title || headerAction) && (
                <div className="px-6 py-4 border-b border-tokens-border flex items-start justify-between gap-4">
                    <div>
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
