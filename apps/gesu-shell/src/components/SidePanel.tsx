import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from './Button';

interface SidePanelProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    width?: string;
}

export function SidePanel({ 
    isOpen, 
    onClose, 
    title, 
    children, 
    width = '500px' // Default to ~1/3 width on large screens or 500px
}: SidePanelProps) {
    const contentRef = useRef<HTMLDivElement>(null);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            window.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        }

        return () => {
            window.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const panelContent = (
        <>
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[50] animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Panel */}
            <div 
                className="fixed top-0 right-0 h-full bg-tokens-panel border-l border-tokens-border shadow-2xl z-[51] animate-in slide-in-from-right duration-300 flex flex-col"
                style={{ width, maxWidth: '90vw' }}
                ref={contentRef}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-tokens-border shrink-0">
                    <h2 className="text-xl font-bold text-tokens-fg tracking-tight">{title}</h2>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={onClose}
                        icon={<X size={20} />}
                    />
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6">
                    {children}
                </div>
            </div>
        </>
    );

    return createPortal(panelContent, document.body);
}
