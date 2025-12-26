// AI Suggestion Modal - Diff preview and apply flow
// Sprint 24: Local-first AI suggestion layer

import { useState } from 'react';
import { X, Sparkles, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../Button';
import { BlueprintSuggestion, SuggestionOp } from '../../services/ai/AIProvider';

interface AISuggestionModalProps {
    isOpen: boolean;
    onClose: () => void;
    suggestions: BlueprintSuggestion[];
    onApply: (selectedOps: SuggestionOp[]) => void;
    isLoading?: boolean;
    error?: string | null;
}

export function AISuggestionModal({
    isOpen,
    onClose,
    suggestions,
    onApply,
    isLoading = false,
    error = null,
}: AISuggestionModalProps) {
    const { t } = useTranslation(['initiator', 'common']);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    if (!isOpen) return null;

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const selectAll = () => {
        setSelectedIds(new Set(suggestions.map(s => s.id)));
    };

    const selectNone = () => {
        setSelectedIds(new Set());
    };

    const handleApply = () => {
        const selectedOps: SuggestionOp[] = [];
        suggestions.forEach(s => {
            if (selectedIds.has(s.id)) {
                selectedOps.push(...s.ops);
            }
        });
        onApply(selectedOps);
        onClose();
    };

    const getOpDescription = (op: SuggestionOp): string => {
        switch (op.op) {
            case 'renamePhase':
                return `${t('initiator:ai.opRenamePhase', 'Rename phase')}: "${op.title}"`;
            case 'renameNode':
                return `${t('initiator:ai.opRenameNode', 'Rename step')}: "${op.title}"`;
            case 'addDoD':
                return `${t('initiator:ai.opAddDoD', 'Add checklist items')}: ${op.items.length} ${t('common:labels.items', 'items')}`;
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'phase':
                return '📁';
            case 'node':
                return '📝';
            case 'dod':
                return '✅';
            default:
                return '💡';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-tokens-bg rounded-xl border border-tokens-border shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-tokens-border">
                    <div className="flex items-center gap-3">
                        <Sparkles size={20} className="text-tokens-brand-DEFAULT" />
                        <h2 className="text-lg font-semibold text-tokens-fg">
                            {t('initiator:ai.suggestionsTitle', 'AI Suggestions')}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-tokens-panel2 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-tokens-muted" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                            <Loader2 size={32} className="text-tokens-brand-DEFAULT animate-spin" />
                            <p className="text-tokens-muted">
                                {t('initiator:ai.generating', 'Generating suggestions...')}
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-red-500 font-medium">
                                    {t('initiator:ai.errorTitle', 'Failed to get suggestions')}
                                </p>
                                <p className="text-red-400 text-sm mt-1">{error}</p>
                            </div>
                        </div>
                    )}

                    {!isLoading && !error && suggestions.length === 0 && (
                        <div className="text-center py-12 text-tokens-muted">
                            <p>{t('initiator:ai.noSuggestions', 'No suggestions available')}</p>
                        </div>
                    )}

                    {!isLoading && !error && suggestions.length > 0 && (
                        <div className="space-y-4">
                            {/* Selection controls */}
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-tokens-muted">
                                    {t('initiator:ai.selectedCount', '{{count}} selected', {
                                        count: selectedIds.size,
                                    })}
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={selectAll}
                                        className="text-tokens-brand-DEFAULT hover:underline"
                                    >
                                        {t('common:buttons.selectAll', 'Select all')}
                                    </button>
                                    <span className="text-tokens-muted">|</span>
                                    <button
                                        onClick={selectNone}
                                        className="text-tokens-brand-DEFAULT hover:underline"
                                    >
                                        {t('common:buttons.selectNone', 'Select none')}
                                    </button>
                                </div>
                            </div>

                            {/* Suggestion list */}
                            <div className="space-y-3">
                                {suggestions.map(suggestion => (
                                    <div
                                        key={suggestion.id}
                                        onClick={() => toggleSelection(suggestion.id)}
                                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                                            selectedIds.has(suggestion.id)
                                                ? 'bg-tokens-brand-DEFAULT/10 border-tokens-brand-DEFAULT'
                                                : 'bg-tokens-panel border-tokens-border hover:border-tokens-brand-DEFAULT/50'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Checkbox */}
                                            <div
                                                className={`w-5 h-5 rounded border flex items-center justify-center mt-0.5 ${
                                                    selectedIds.has(suggestion.id)
                                                        ? 'bg-tokens-brand-DEFAULT border-tokens-brand-DEFAULT'
                                                        : 'border-tokens-border'
                                                }`}
                                            >
                                                {selectedIds.has(suggestion.id) && (
                                                    <Check size={14} className="text-white" />
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span>{getTypeIcon(suggestion.type)}</span>
                                                    <span className="font-medium text-tokens-fg">
                                                        {suggestion.title}
                                                    </span>
                                                </div>
                                                {suggestion.description && (
                                                    <p className="text-sm text-tokens-muted mt-1">
                                                        {suggestion.description}
                                                    </p>
                                                )}
                                                {/* Operations preview */}
                                                <div className="mt-2 space-y-1">
                                                    {suggestion.ops.map((op, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="text-xs text-tokens-muted bg-tokens-panel2 rounded px-2 py-1 inline-block mr-2"
                                                        >
                                                            {getOpDescription(op)}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-tokens-border">
                    <Button onClick={onClose} variant="secondary">
                        {t('common:buttons.cancel', 'Cancel')}
                    </Button>
                    <Button
                        onClick={handleApply}
                        variant="primary"
                        disabled={selectedIds.size === 0 || isLoading}
                        icon={<Sparkles size={16} />}
                        iconPosition="left"
                    >
                        {t('initiator:ai.applySelected', 'Apply Selected')}
                    </Button>
                </div>
            </div>
        </div>
    );
}
