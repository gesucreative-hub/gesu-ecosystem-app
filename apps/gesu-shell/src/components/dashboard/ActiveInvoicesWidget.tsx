// Active Invoices Widget - Shows unpaid invoices with status
// Business persona dashboard widget

import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FileText, ChevronRight, AlertCircle } from 'lucide-react';
import { Card } from '../Card';
import { Badge } from '../Badge';
import { type Invoice } from '../../stores/invoiceStore';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ActiveInvoicesWidgetProps {
    invoices: Invoice[];
    maxItems?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
    return `Rp${amount.toLocaleString('id-ID')}`;
}

function isOverdue(invoice: Invoice): boolean {
    if (!invoice.dueDate) return false;
    return new Date(invoice.dueDate) < new Date();
}

function getDaysOverdue(invoice: Invoice): number {
    if (!invoice.dueDate) return 0;
    const diff = new Date().getTime() - new Date(invoice.dueDate).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function ActiveInvoicesWidget({ 
    invoices, 
    maxItems = 5 
}: ActiveInvoicesWidgetProps) {
    const { t } = useTranslation(['dashboard', 'invoices', 'common']);
    const displayInvoices = invoices.slice(0, maxItems);

    return (
        <Card className="p-5 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 gap-4">
                <div className="flex items-center gap-2 min-w-0">
                    <FileText size={18} className="text-tokens-muted flex-shrink-0" />
                    <h3 className="text-sm font-semibold text-tokens-fg truncate">
                        {t('business.activeInvoices', 'Active Invoices')}
                    </h3>
                    {invoices.length > 0 && (
                        <span className="text-xs text-tokens-muted flex-shrink-0">({invoices.length})</span>
                    )}
                </div>
                <Link 
                    to="/invoices?status=sent" 
                    className="text-xs text-tokens-brand-DEFAULT hover:underline flex items-center gap-1 whitespace-nowrap"
                >
                    {t('activeProjects.viewAll', 'View All')}
                    <ChevronRight size={12} />
                </Link>
            </div>

            {/* Invoice List */}
            {displayInvoices.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-tokens-muted text-sm text-center">
                    <p>{t('business.noActiveInvoices', 'No active invoices')}</p>
                </div>
            ) : (
                <div className="space-y-2 flex-1 overflow-auto">
                    {displayInvoices.map(invoice => {
                        const overdue = isOverdue(invoice);
                        const daysOver = getDaysOverdue(invoice);
                        
                        return (
                            <Link 
                                key={invoice.id}
                                to={`/invoices/${invoice.id}`}
                                className="flex items-center justify-between p-3 rounded-lg hover:bg-tokens-panel2 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    {overdue && (
                                        <AlertCircle size={16} className="text-tokens-error" />
                                    )}
                                    <div>
                                        <div className="font-medium text-sm text-tokens-fg">
                                            {invoice.number}
                                        </div>
                                        <div className="text-xs text-tokens-muted">
                                            {invoice.snapshot.clientName}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <div className="font-semibold text-sm text-tokens-fg">
                                            {formatCurrency(invoice.total)}
                                        </div>
                                        {overdue && (
                                            <div className="text-xs text-tokens-error">
                                                {daysOver} {t('dashboard:business.daysOverdue', 'days overdue')}
                                            </div>
                                        )}
                                    </div>
                                    <Badge 
                                        variant={overdue ? 'error' : 'warning'}
                                        className="text-xs"
                                    >
                                        {overdue ? t('invoices:status.overdue', 'Overdue') : t('invoices:status.sent', 'Sent')}
                                    </Badge>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </Card>
    );
}

export default ActiveInvoicesWidget;
