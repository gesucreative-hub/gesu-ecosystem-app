/**
 * ConfirmModal - Reusable confirmation dialog
 * Centered, animated with framer-motion
 */

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'default' | 'danger';
    loading?: boolean;
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'default',
    loading = false,
}: ConfirmModalProps) {
    const { t } = useTranslation(['common']);
    const isDanger = variant === 'danger';

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        onClick={e => e.stopPropagation()}
                        className="bg-tokens-panel border border-tokens-border rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-tokens-border">
                            <div className="flex items-center gap-2">
                                {isDanger && (
                                    <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                                        <AlertTriangle size={16} className="text-red-500" />
                                    </div>
                                )}
                                <h2 className="text-base font-semibold text-tokens-fg">{title}</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-tokens-muted/20 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-4">
                            <p className="text-sm text-tokens-muted leading-relaxed">{message}</p>
                        </div>

                        {/* Footer */}
                        <div className="flex gap-3 p-4 border-t border-tokens-border bg-tokens-bg/50">
                            <button
                                onClick={onClose}
                                disabled={loading}
                                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-tokens-muted/10 text-tokens-fg hover:bg-tokens-muted/20 transition-colors disabled:opacity-50"
                            >
                                {cancelLabel}
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={loading}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${
                                    isDanger
                                        ? 'bg-red-500 text-white hover:bg-red-600'
                                        : 'bg-tokens-brand-DEFAULT text-white hover:bg-tokens-brand-DEFAULT/90'
                                }`}
                            >
                                {loading ? t('common:status.loading', 'Loading...') : confirmLabel}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
