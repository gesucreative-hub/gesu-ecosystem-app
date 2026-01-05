import React, { InputHTMLAttributes } from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
    fullWidth?: boolean;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(({ 
    fullWidth = false,
    className = '',
    ...props 
}, ref) => {
    return (
        <div className={`relative ${fullWidth ? 'w-full' : ''}`}>
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-tokens-muted" />
            <input
                ref={ref}
                type="text"
                className={`
                    w-full pl-10 pr-4 h-10 bg-tokens-panel border border-tokens-border rounded-xl 
                    text-tokens-fg placeholder:text-tokens-muted/50 
                    focus:outline-none focus:ring-2 focus:ring-tokens-brand-DEFAULT/30
                    ${className}
                `}
                {...props}
            />
        </div>
    );
});

SearchInput.displayName = 'SearchInput';
