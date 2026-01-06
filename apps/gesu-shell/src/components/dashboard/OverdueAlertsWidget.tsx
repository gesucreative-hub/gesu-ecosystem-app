// Overdue Alerts Widget - Highlights overdue invoices requiring attention
// Business persona dashboard widget

import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { AlertTriangle, ChevronRight, Clock, CheckCircle } from 'lucide-react';
import { Card } from '../Card';
import { type Invoice } from '../../stores/invoiceStore';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface OverdueAlertsWidgetProps {
    overdueInvoices: Invoice[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────────────────────

function getDaysOverdue(invoice: Invoice): number {
    if (!invoice.dueDate) return 0;
    const diff = new Date().getTime() - new Date(invoice.dueDate).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getUrgencyColor(daysOverdue: number): string {
    if (daysOverdue >= 14) return 'text-tokens-error'; // Critical
    if (daysOverdue >= 7) return 'text-orange-500'; // Warning
    return 'text-amber-500'; // Attention
}

function getUrgencyBg(daysOverdue: number): string {
    if (daysOverdue >= 14) return 'bg-tokens-error/10';
    if (daysOverdue >= 7) return 'bg-orange-500/10';
    return 'bg-amber-500/10';
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function OverdueAlertsWidget({ overdueInvoices }: OverdueAlertsWidgetProps) {
    const { t } = useTranslation(['dashboard', 'invoices']);
    
    // Sort by most overdue first
    const sortedOverdue = [...overdueInvoices].sort((a, b) => {
        const daysA = getDaysOverdue(a);
        const daysB = getDaysOverdue(b);
        return daysB - daysA;
    }).slice(0, 5);

    return (
        <Card className="h-full [&>div]:h-full" noPadding>
            <div className="p-5 flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <AlertTriangle size={18} className="text-tokens-error" />
                        <h3 className="text-sm font-semibold text-tokens-fg">
                            {t('business.overdueAlerts', 'Overdue Alerts')}
                        </h3>
                        {overdueInvoices.length > 0 && (
                            <span className="bg-tokens-error/20 text-tokens-error text-xs font-bold px-2 py-0.5 rounded-full">
                                {overdueInvoices.length}
                            </span>
                        )}
                    </div>
                </div>

                {/* Content */}
                {sortedOverdue.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-8 text-center h-full">
                        <CheckCircle size={32} className="text-emerald-500 mb-2" />
                        <div className="text-sm text-tokens-muted">
                            {t('business.noOverdueItems', 'No overdue items')}
                        </div>
                        <div className="text-xs text-tokens-muted mt-1">
                            {t('business.allCaughtUp', 'All caught up!')}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {sortedOverdue.map(invoice => {
                            const daysOver = getDaysOverdue(invoice);
                            const color = getUrgencyColor(daysOver);
                            const bg = getUrgencyBg(daysOver);
                            
                            return (
                                <Link 
                                    key={invoice.id}
                                    to={`/invoices/${invoice.id}`}
                                    className={`flex items-center gap-3 p-3 rounded-lg ${bg} hover:opacity-80 transition-opacity`}
                                >
                                    <Clock size={16} className={color} />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm text-tokens-fg truncate">
                                            {invoice.snapshot.clientName}
                                        </div>
                                        <div className="text-xs text-tokens-muted">
                                            {invoice.number}
                                        </div>
                                    </div>
                                    <div className={`text-sm font-semibold ${color}`}>
                                        {daysOver} {t('dashboard:business.days', 'days')}
                                    </div>
                                    <ChevronRight size={14} className="text-tokens-muted" />
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </Card>
    );
}

export default OverdueAlertsWidget;
