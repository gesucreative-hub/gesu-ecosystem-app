// AlertDialog - Simple notification alert using design tokens
// Replaces native browser alert() with styled modal
import { Button } from './Button';
import { CheckCircle, AlertCircle, XCircle, Info } from 'lucide-react';
import { useEffect, useCallback } from 'react';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    type?: AlertType;
    onClose: () => void;
}

export function AlertDialog({
    isOpen,
    title,
    message,
    type = 'info',
    onClose,
}: AlertDialogProps) {
    // Handle ESC key
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, handleKeyDown]);

    if (!isOpen) return null;

    // Icon and color based on type
    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle size={24} className="text-tokens-success" />;
            case 'error':
                return <XCircle size={24} className="text-tokens-error" />;
            case 'warning':
                return <AlertCircle size={24} className="text-tokens-warning" />;
            default:
                return <Info size={24} className="text-tokens-brand-DEFAULT" />;
        }
    };

    const getIconBg = () => {
        switch (type) {
            case 'success':
                return 'bg-tokens-success/10';
            case 'error':
                return 'bg-tokens-error/10';
            case 'warning':
                return 'bg-tokens-warning/10';
            default:
                return 'bg-tokens-brand-DEFAULT/10';
        }
    };

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/50 backdrop-blur-sm">
            <div
                className="flex min-h-full items-center justify-center p-4"
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <div className="bg-tokens-bg border border-tokens-border rounded-xl shadow-2xl p-6 w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-200">

                    {/* Header */}
                    <div className="flex items-start gap-3 mb-4">
                        <div className={`p-2 rounded-lg shrink-0 ${getIconBg()}`}>
                            {getIcon()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-lg font-semibold text-tokens-fg">{title}</h2>
                            <p className="text-sm text-tokens-muted mt-1 whitespace-pre-wrap">{message}</p>
                        </div>
                    </div>

                    {/* Action */}
                    <div className="flex justify-end mt-6">
                        <Button
                            variant="primary"
                            onClick={onClose}
                            size="sm"
                            autoFocus
                        >
                            OK
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Hook for easier usage with state management
import { useState } from 'react';
import { createPortal } from 'react-dom';

interface UseAlertDialogReturn {
    isOpen: boolean;
    dialogProps: Omit<AlertDialogProps, 'isOpen' | 'onClose'>;
    alert: (options: {
        title: string;
        message: string;
        type?: AlertType;
    }) => Promise<void>;
    AlertDialogComponent: React.FC;
}

export function useAlertDialog(): UseAlertDialogReturn {
    const [isOpen, setIsOpen] = useState(false);
    const [dialogProps, setDialogProps] = useState<Omit<AlertDialogProps, 'isOpen' | 'onClose'>>({
        title: '',
        message: '',
        type: 'info',
    });
    const [resolveRef, setResolveRef] = useState<(() => void) | null>(null);

    const alert = (options: {
        title: string;
        message: string;
        type?: AlertType;
    }): Promise<void> => {
        return new Promise((resolve) => {
            setDialogProps(options);
            setResolveRef(() => resolve);
            setIsOpen(true);
        });
    };

    const handleClose = () => {
        setIsOpen(false);
        resolveRef?.();
    };

    const AlertDialogComponent: React.FC = () => (
        isOpen ? createPortal(
            <AlertDialog
                isOpen={isOpen}
                {...dialogProps}
                onClose={handleClose}
            />,
            document.body
        ) : null
    );

    return {
        isOpen,
        dialogProps,
        alert,
        AlertDialogComponent,
    };
}
