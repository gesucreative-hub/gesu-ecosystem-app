import React, { ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right' | 'circle'; // 'circle' = the pill + icon circle style
    fullWidth?: boolean;
}

/**
 * Button Component - Gesu Ecosystem Design System
 * 
 * Variants:
 * - primary: Main action button with circle icon support
 * - secondary: Lighter background for secondary actions  
 * - outline: Border-only style
 * - ghost: Minimal, text-only style
 * 
 * States (for primary with icon):
 * - Default: Brand circle + white bg + border
 * - Hover: Dark circle + light brand bg
 * - Active: Dark circle + brand bg + white text
 * 
 * Theme-aware: Uses brand colors from tokens (indigo light, brand dark)
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
    className = '',
    variant = 'primary',
    size = 'md',
    icon,
    iconPosition = 'left',
    fullWidth = false,
    children,
    ...props
}, ref) => {

    // Base styles - applicable to all variants
    const baseStyles = `
        group/btn inline-flex items-center justify-center font-medium 
        transition-all duration-200 ease-out
        focus:outline-none focus:ring-2 focus:ring-tokens-ring focus:ring-offset-1 
        disabled:opacity-50 disabled:pointer-events-none 
        rounded-full select-none
    `;

    // Size configurations
    const sizes = {
        sm: "text-xs py-1.5 gap-2",
        md: "text-sm py-2 gap-2.5",
        lg: "text-base py-2.5 gap-3"
    };

    // Padding varies based on whether icon is in circle position
    const getPadding = () => {
        if (icon && iconPosition === 'circle') {
            // Circle icon button: less left padding since circle provides visual weight
            return size === 'sm' ? 'pl-1.5 pr-4' : size === 'md' ? 'pl-2 pr-5' : 'pl-2 pr-6';
        }
        // Standard buttons
        return size === 'sm' ? 'px-4' : size === 'md' ? 'px-5' : 'px-6';
    };

    /**
     * PRIMARY VARIANT - The main CTA button
     * 
     * WITH ICON (circle mode):
     * Light Mode:
     *   - Default: White bg, gray border, indigo circle, dark text
     *   - Hover: Light indigo bg, dark circle
     *   - Active: Indigo bg, dark circle, white text
     * 
     * Dark Mode:
     *   - Default: Panel bg, border, brand circle, light text  
     *   - Hover: Panel2 bg, dark circle
     *   - Active: Brand bg, contrast text
     * 
     * WITHOUT ICON:
     * Light Mode:
     *   - Default: White bg, indigo border, indigo text
     *   - Hover: Light indigo bg, indigo text
     *   - Active: Indigo bg, white text
     * 
     * Dark Mode:
     *   - Default: Transparent, brand border, brand text
     *   - Hover: Light brand bg, brand text
     *   - Active: Brand bg, contrast text
     */
    const getVariantStyles = () => {
        if (variant === 'primary') {
            if (icon && iconPosition === 'circle') {
                // Primary WITH circle icon - theme-aware brand colors
                return `
                    bg-white dark:bg-tokens-panel
                    border-2 border-gray-200 dark:border-tokens-border
                    text-gray-700 dark:text-tokens-fg
                    
                    hover:bg-tokens-brand-DEFAULT/10 dark:hover:bg-tokens-brand-DEFAULT/10
                    hover:border-tokens-brand-DEFAULT/20 dark:hover:border-tokens-brand-DEFAULT/40
                    
                    active:bg-tokens-brand-DEFAULT dark:active:bg-tokens-brand-DEFAULT
                    active:border-tokens-brand-DEFAULT dark:active:border-tokens-brand-DEFAULT
                    active:text-white dark:active:text-tokens-brand-foreground
                `;
            } else {
                // Primary WITHOUT icon (or icon in left/right position)
                return `
                    bg-white dark:bg-transparent
                    border-2 border-tokens-brand-DEFAULT dark:border-tokens-brand-DEFAULT
                    text-tokens-brand-DEFAULT dark:text-tokens-brand-DEFAULT
                    
                    hover:bg-tokens-brand-DEFAULT/10 dark:hover:bg-tokens-brand-DEFAULT/20
                    
                    active:bg-tokens-brand-DEFAULT dark:active:bg-tokens-brand-DEFAULT
                    active:text-white dark:active:text-tokens-brand-foreground
                `;
            }
        }

        if (variant === 'secondary') {
            return `
                bg-tokens-panel2 dark:bg-tokens-panel2
                border-2 border-tokens-border
                text-tokens-fg
                
                hover:bg-tokens-panel hover:border-tokens-brand-DEFAULT/30 dark:hover:border-tokens-brand-DEFAULT/30
                active:bg-tokens-brand-DEFAULT/20 dark:active:bg-tokens-brand-DEFAULT/20
            `;
        }

        if (variant === 'outline') {
            return `
                bg-transparent
                border-2 border-tokens-border
                text-tokens-fg
                
                hover:bg-tokens-panel2 hover:border-tokens-brand-DEFAULT/50 dark:hover:border-tokens-brand-DEFAULT/50
                active:bg-tokens-brand-DEFAULT/10 dark:active:bg-tokens-brand-DEFAULT/10
            `;
        }

        if (variant === 'ghost') {
            return `
                bg-transparent border-2 border-transparent
                text-tokens-muted
                
                hover:text-tokens-fg hover:bg-tokens-panel2
                active:bg-tokens-brand-DEFAULT/10 dark:active:bg-tokens-brand-DEFAULT/10
            `;
        }

        return '';
    };

    // Circle icon sizes
    const getCircleSize = () => {
        if (size === 'sm') return 'w-6 h-6';
        if (size === 'md') return 'w-7 h-7';
        return 'w-8 h-8';
    };

    // Circle icon styles (the colored circle on the left)
    const getCircleStyles = () => {
        return `
            flex items-center justify-center rounded-full shrink-0 
            transition-all duration-200
            ${getCircleSize()}
            
            bg-tokens-brand-DEFAULT dark:bg-tokens-brand-DEFAULT
            text-white dark:text-tokens-brand-foreground
            
            group-hover/btn:bg-gray-700 dark:group-hover/btn:bg-gray-700
            group-hover/btn:text-white dark:group-hover/btn:text-white
            
            group-active/btn:bg-gray-700 dark:group-active/btn:bg-tokens-brand-DEFAULT
            group-active/btn:text-white dark:group-active/btn:text-tokens-brand-foreground
        `;
    };

    const widthClass = fullWidth ? 'w-full' : '';

    return (
        <button
            ref={ref}
            className={`${baseStyles} ${getVariantStyles()} ${sizes[size]} ${getPadding()} ${widthClass} ${className}`}
            {...props}
        >
            {/* Circle Icon (Special Pill Style - LEFT) */}
            {icon && iconPosition === 'circle' && (
                <div className={getCircleStyles()}>
                    {icon}
                </div>
            )}

            {/* Left Icon (standard) */}
            {icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}

            <span className={`truncate ${fullWidth ? 'flex-1 text-center' : ''}`}>{children}</span>

            {/* Right Icon (standard) */}
            {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
        </button>
    );
});

Button.displayName = "Button";
