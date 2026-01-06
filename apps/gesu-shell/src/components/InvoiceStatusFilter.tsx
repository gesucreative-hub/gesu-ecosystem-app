import { Filter } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { InvoiceStatus } from '../stores/invoiceStore';

interface InvoiceStatusFilterProps {
    selectedStatuses: InvoiceStatus[];
    onChange: (statuses: InvoiceStatus[]) => void;
    showUnlinkedOnly: boolean;
    onShowUnlinkedChange: (show: boolean) => void;
}

export function InvoiceStatusFilter({ selectedStatuses, onChange, showUnlinkedOnly, onShowUnlinkedChange }: InvoiceStatusFilterProps) {
    const { t } = useTranslation(['invoices', 'common']);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const allStatuses: InvoiceStatus[] = ['draft', 'sent', 'paid', 'cancelled'];

    const getStatusLabel = (status: InvoiceStatus) => t(`invoices:status.${status}`, status);

    const activeCount = selectedStatuses.length + (showUnlinkedOnly ? 1 : 0);

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all
                    ${activeCount > 0
                        ? 'bg-tokens-brand-DEFAULT/10 border-tokens-brand-DEFAULT/50 text-tokens-brand-DEFAULT'
                        : 'bg-tokens-panel border-tokens-border text-tokens-muted hover:text-tokens-fg hover:border-tokens-fg/20'
                    }
                `}
            >
                <Filter size={16} />
                <span>
                    {activeCount > 0
                        ? t('invoices:list.filterCount', '{{count}} Selected', { count: activeCount })
                        : t('invoices:list.filter', 'Filter Status')
                    }
                </span>
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-tokens-panel border border-tokens-border rounded-lg shadow-xl z-50 p-1 animate-in fade-in zoom-in-95 duration-200">
                    <div className="text-xs font-semibold text-tokens-muted px-2 py-1.5 uppercase tracking-wider">
                        {t('invoices:list.filterByStatus', 'Filter by Status')}
                    </div>
                    <div className="px-2 pb-2 mb-1 space-y-1">
                        {allStatuses.map(status => (
                            <label key={status} className="flex items-center gap-2 cursor-pointer py-1.5 hover:bg-tokens-panel2 rounded px-2 -mx-2 transition-colors">
                                <input
                                    type="checkbox"
                                    className="rounded border-tokens-border bg-tokens-panel2 text-tokens-brand-DEFAULT focus:ring-1 focus:ring-tokens-brand-DEFAULT"
                                    checked={selectedStatuses.includes(status)}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            onChange([...selectedStatuses, status]);
                                        } else {
                                            onChange(selectedStatuses.filter(s => s !== status));
                                        }
                                    }}
                                />
                                <span className="text-sm text-tokens-fg capitalize">{getStatusLabel(status)}</span>
                            </label>
                        ))}
                    </div>

                    <div className="border-t border-tokens-border my-1"></div>

                    <div className="px-2 py-1">
                        <label className="flex items-center gap-2 cursor-pointer py-1.5 hover:bg-tokens-panel2 rounded px-2 -mx-2 transition-colors">
                            <input
                                type="checkbox"
                                className="rounded border-tokens-border bg-tokens-panel2 text-tokens-brand-DEFAULT focus:ring-1 focus:ring-tokens-brand-DEFAULT"
                                checked={showUnlinkedOnly}
                                onChange={(e) => onShowUnlinkedChange(e.target.checked)}
                            />
                            <div className="flex flex-col">
                                <span className="text-sm text-tokens-fg">{t('invoices:list.showUnlinked', 'Show unlinked only')}</span>
                                <span className="text-[10px] text-tokens-muted">{t('invoices:list.noClientLinked', 'No client linked')}</span>
                            </div>
                        </label>
                    </div>
                    
                    {/* Clear Filters Option */}
                    {activeCount > 0 && (
                        <div className="border-t border-tokens-border mt-1 pt-1">
                            <button
                                onClick={() => {
                                    onChange([]);
                                    onShowUnlinkedChange(false);
                                    setIsOpen(false);
                                }}
                                className="w-full text-xs text-center py-1.5 text-tokens-muted hover:text-tokens-fg transition-colors"
                            >
                                {t('common:clearFilters', 'Clear Filters')}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
