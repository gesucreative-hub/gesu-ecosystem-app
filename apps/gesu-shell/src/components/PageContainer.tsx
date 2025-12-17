import { ReactNode } from 'react';

interface PageContainerProps {
    children: ReactNode;
    className?: string;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
    density?: 'compact' | 'normal' | 'spacious';
}

export function PageContainer({ children, className = '', maxWidth = '2xl', density = 'normal' }: PageContainerProps) {
    const maxWidthClasses = {
        sm: 'max-w-3xl',
        md: 'max-w-4xl',
        lg: 'max-w-5xl',
        xl: 'max-w-6xl',
        '2xl': 'max-w-7xl',
        full: 'max-w-full'
    };

    const densityClasses = {
        compact: 'pt-6 pb-4 px-4 sm:px-6',
        normal: 'pt-8 pb-6 px-6 sm:px-8',
        spacious: 'pt-16 pb-8 px-8 sm:px-10'
    };

    return (
        <div className={`w-full mx-auto animate-in fade-in duration-300 ${maxWidthClasses[maxWidth]} ${densityClasses[density]} ${className}`}>
            {children}
        </div>
    );
}
