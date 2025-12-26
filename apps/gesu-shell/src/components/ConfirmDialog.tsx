// ConfirmDialog - Reusable confirmation dialog using design tokens
// Replaces native browser confirm() with styled modal
import { Button } from './Button';
import { AlertCircle, HelpCircle, AlertTriangle } from 'lucide-react';
import { useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';

type DialogType = 'confirm' | 'warning' | 'danger';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    type?: DialogType;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmLabel,
    cancelLabel,
    type = 'confirm',
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    const { t } = useTranslation('modals');
    // Handle ESC key
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            onCancel();
        }
    }, [onCancel]);

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
            case 'danger':
                return <AlertTriangle size={24} className="text-tokens-error" />;
            case 'warning':
                return <AlertCircle size={24} className="text-tokens-warning" />;
            default:
                return <HelpCircle size={24} className="text-tokens-brand-DEFAULT" />;
        }
    };

    const getIconBg = () => {
        switch (type) {
            case 'danger':
                return 'bg-tokens-error/10';
            case 'warning':
                return 'bg-tokens-warning/10';
            default:
                return 'bg-tokens-brand-DEFAULT/10';
        }
    };

    const getConfirmButtonClass = () => {
        switch (type) {
            case 'danger':
                return 'bg-tokens-error hover:bg-tokens-error/90 text-white border-tokens-error';
            default:
                return '';
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[200] overflow-y-auto bg-black/50 backdrop-blur-sm">
            <div
                className="flex min-h-full items-center justify-center p-4"
                onClick={(e) => e.target === e.currentTarget && onCancel()}
            >
                <div className="bg-tokens-bg border border-tokens-border rounded-xl shadow-2xl p-6 w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-200">

                    {/* Header */}
                    <div className="flex items-start gap-3 mb-4">
                        <div className={`p-2 rounded-lg shrink-0 ${getIconBg()}`}>
                            {getIcon()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-lg font-semibold text-tokens-fg">{title}</h2>
                            <p className="text-sm text-tokens-muted mt-1">{message}</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 justify-end mt-6">
                        <Button
                            variant="ghost"
                            onClick={onCancel}
                            size="sm"
                        >
                            {cancelLabel || t('confirm.cancel')}
                        </Button>
                        <Button
                            variant="primary"
                            onClick={onConfirm}
                            size="sm"
                            className={getConfirmButtonClass()}
                            autoFocus
                        >
                            {confirmLabel || t('alert.ok')}
                        </Button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

// Hook for easier usage with state management
import { useState } from 'react';

interface UseConfirmDialogReturn {
    isOpen: boolean;
    dialogProps: Omit<ConfirmDialogProps, 'isOpen' | 'onConfirm' | 'onCancel'>;
    confirm: (options: {
        title: string;
        message: string;
        confirmLabel?: string;
        cancelLabel?: string;
        type?: DialogType;
    }) => Promise<boolean>;
    ConfirmDialogComponent: React.FC;
}

export function useConfirmDialog(): UseConfirmDialogReturn {
    const [isOpen, setIsOpen] = useState(false);
    const [dialogProps, setDialogProps] = useState<Omit<ConfirmDialogProps, 'isOpen' | 'onConfirm' | 'onCancel'>>({
        title: '',
        message: '',
    });
    const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null);

    const confirm = (options: {
        title: string;
        message: string;
        confirmLabel?: string;
        cancelLabel?: string;
        type?: DialogType;
    }): Promise<boolean> => {
        return new Promise((resolve) => {
            setDialogProps(options);
            setResolveRef(() => resolve);
            setIsOpen(true);
        });
    };

    const handleConfirm = () => {
        setIsOpen(false);
        resolveRef?.(true);
    };

    const handleCancel = () => {
        setIsOpen(false);
        resolveRef?.(false);
    };

    const ConfirmDialogComponent: React.FC = () => (
        <ConfirmDialog
            isOpen={isOpen}
            {...dialogProps}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
        />
    );

    return {
        isOpen,
        dialogProps,
        confirm,
        ConfirmDialogComponent,
    };
}
