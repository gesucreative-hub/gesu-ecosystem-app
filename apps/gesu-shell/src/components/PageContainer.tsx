import { ReactNode } from 'react';

interface PageContainerProps {
    children: ReactNode;
    className?: string;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export function PageContainer({ children, className = '', maxWidth = '2xl' }: PageContainerProps) {
    const maxWidthClasses = {
        sm: 'max-w-3xl',
        md: 'max-w-4xl',
        lg: 'max-w-5xl',
        xl: 'max-w-6xl',
        '2xl': 'max-w-7xl',
        full: 'max-w-full'
    };

    return (
        <div className={`pt-16 pb-6 px-6 sm:px-8 w-full mx-auto animate-in fade-in duration-300 ${maxWidthClasses[maxWidth]} ${className}`}>
            {children}
        </div>
    );
}
