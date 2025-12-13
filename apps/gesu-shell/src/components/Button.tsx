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
 * Theme-aware: Indigo for light mode, Green for dark mode
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
     *   - Default: Light green bg, border, green circle, dark text  
     *   - Hover: Mid green bg, dark circle
     *   - Active: Dark bg, green border, green text
     * 
     * WITHOUT ICON:
     * Light Mode:
     *   - Default: White bg, indigo border, indigo text
     *   - Hover: Light indigo bg, indigo text
     *   - Active: Indigo bg, white text
     * 
     * Dark Mode:
     *   - Default: Transparent, green border, green text
     *   - Hover: Light green bg, green text
     *   - Active: Green bg, dark text
     */
    const getVariantStyles = () => {
        if (variant === 'primary') {
            if (icon && iconPosition === 'circle') {
                // Primary WITH circle icon
                return `
                    bg-white dark:bg-[#c5e1a5]/20
                    border-2 border-gray-200 dark:border-[#7cb342]/30
                    text-gray-700 dark:text-[#7cb342]
                    
                    hover:bg-[#4141b9]/10 dark:hover:bg-[#7cb342]/30
                    hover:border-[#4141b9]/20 dark:hover:border-[#7cb342]/40
                    
                    active:bg-[#4141b9] dark:active:bg-[#1a1a1a]
                    active:border-[#4141b9] dark:active:border-[#7cb342]
                    active:text-white dark:active:text-[#7cb342]
                `;
            } else {
                // Primary WITHOUT icon (or icon in left/right position)
                return `
                    bg-white dark:bg-transparent
                    border-2 border-[#4141b9] dark:border-[#7cb342]
                    text-[#4141b9] dark:text-[#7cb342]
                    
                    hover:bg-[#4141b9]/10 dark:hover:bg-[#7cb342]/20
                    
                    active:bg-[#4141b9] dark:active:bg-[#7cb342]
                    active:text-white dark:active:text-[#1a1a1a]
                `;
            }
        }

        if (variant === 'secondary') {
            return `
                bg-tokens-panel2 dark:bg-tokens-panel2
                border-2 border-tokens-border
                text-tokens-fg
                
                hover:bg-tokens-panel hover:border-tokens-brand-DEFAULT/30
                active:bg-tokens-brand-DEFAULT/20
            `;
        }

        if (variant === 'outline') {
            return `
                bg-transparent
                border-2 border-tokens-border
                text-tokens-fg
                
                hover:bg-tokens-panel2 hover:border-tokens-brand-DEFAULT/50
                active:bg-tokens-brand-DEFAULT/10
            `;
        }

        if (variant === 'ghost') {
            return `
                bg-transparent border-2 border-transparent
                text-tokens-muted
                
                hover:text-tokens-fg hover:bg-tokens-panel2
                active:bg-tokens-panel
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
            
            bg-[#4141b9] dark:bg-[#7cb342]
            text-white dark:text-[#1a1a1a]
            
            group-hover/btn:bg-[#2a2a2a] dark:group-hover/btn:bg-[#2a2a2a]
            group-hover/btn:text-white dark:group-hover/btn:text-white
            
            group-active/btn:bg-[#2a2a2a] dark:group-active/btn:bg-[#7cb342]
            group-active/btn:text-white dark:group-active/btn:text-[#1a1a1a]
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
