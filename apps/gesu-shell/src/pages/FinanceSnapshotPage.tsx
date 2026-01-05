// Finance Snapshot Page - S7-C: Monthly finance dashboard for BUSINESS persona
// Shows totals (invoiced, paid, outstanding, overdue) + overdue invoice list

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '../components/PageContainer';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { SelectDropdown } from '../components/Dropdown';
import { DollarSign, TrendingUp, AlertTriangle, Clock, Receipt, ChevronRight } from 'lucide-react';
import { usePersona } from '../hooks/usePersona';
import { subscribe as subscribeInvoices } from '../stores/invoiceStore';
import { subscribe as subscribePayments } from '../stores/paymentStore';
import {
    buildMonthlySnapshot,
    getLast12Months,
    getCurrentMonthKey,
    type MonthlySnapshot
} from '../services/financeSnapshotService';

export function FinanceSnapshotPage() {
    const { t } = useTranslation(['finance', 'common']);
    const navigate = useNavigate();
    const { activePersona } = usePersona();

    const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey());
    const [snapshot, setSnapshot] = useState<MonthlySnapshot | null>(null);
    const months = getLast12Months();

    // Redirect if not business persona
    useEffect(() => {
        if (activePersona !== 'business') {
            navigate('/compass', { replace: true });
        }
    }, [activePersona, navigate]);

    // Load snapshot data
    const loadData = useCallback(() => {
        setSnapshot(buildMonthlySnapshot(selectedMonth));
    }, [selectedMonth]);

    useEffect(() => {
        loadData();
        const unsub1 = subscribeInvoices(loadData);
        const unsub2 = subscribePayments(loadData);
        return () => { unsub1(); unsub2(); };
    }, [loadData]);

    // Currency formatting (same as invoices)
    const formatPrice = (amount: number) => {
        return new Intl.NumberFormat('id-ID', { 
            style: 'currency', 
            currency: 'IDR', 
            minimumFractionDigits: 0 
        }).format(amount);
    };

    const formatDate = (iso: string) => {
        return new Date(iso).toLocaleDateString('id-ID', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
        });
    };

    // Summary card component
    const SummaryCard = ({ 
        icon, 
        label, 
        value, 
        variant = 'default' 
    }: { 
        icon: React.ReactNode; 
        label: string; 
        value: number; 
        variant?: 'default' | 'success' | 'warning' | 'error';
    }) => {
        const colorMap = {
            default: 'text-tokens-fg',
            success: 'text-green-500',
            warning: 'text-orange-500',
            error: 'text-red-500'
        };
        
        return (
            <Card className="p-4">
                <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg bg-tokens-panel2 ${colorMap[variant]}`}>
                        {icon}
                    </div>
                    <span className="text-sm text-tokens-muted">{label}</span>
                </div>
                <div className={`text-2xl font-bold font-mono ${colorMap[variant]}`}>
                    {formatPrice(value)}
                </div>
            </Card>
        );
    };

    return (
        <PageContainer>
            {/* Header */}
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                     <h1 className="text-3xl font-bold text-tokens-fg tracking-tight flex items-center gap-3">
                        <TrendingUp size={32} className="text-tokens-brand-DEFAULT" />
                        {t('finance:title', 'Finance Snapshot')}
                    </h1>
                    <p className="text-tokens-muted text-sm mt-1">
                        {t('finance:subtitle', 'Monthly billing overview')}
                    </p>
                </div>
                <SelectDropdown
                    value={selectedMonth}
                    onChange={(value) => setSelectedMonth(value)}
                    options={months.map(m => ({ value: m.key, label: m.label }))}
                />
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <SummaryCard
                    icon={<Receipt size={20} />}
                    label={t('finance:invoiced', 'Invoiced')}
                    value={snapshot?.totalInvoiced || 0}
                />
                <SummaryCard
                    icon={<DollarSign size={20} />}
                    label={t('finance:paid', 'Paid')}
                    value={snapshot?.totalPaid || 0}
                    variant="success"
                />
                <SummaryCard
                    icon={<Clock size={20} />}
                    label={t('finance:outstanding', 'Outstanding')}
                    value={snapshot?.totalOutstanding || 0}
                    variant="warning"
                />
                <SummaryCard
                    icon={<AlertTriangle size={20} />}
                    label={t('finance:overdue', 'Overdue')}
                    value={snapshot?.totalOverdue || 0}
                    variant="error"
                />
            </div>

            {/* Invoice count */}
            <div className="text-sm text-tokens-muted mb-4">
                {t('finance:invoiceCount', '{{count}} invoices in selected month', { 
                    count: snapshot?.invoiceCount || 0 
                })}
            </div>

            {/* Overdue Invoices */}
            <Card>
                <div className="p-4 border-b border-tokens-border">
                    <div className="flex items-center gap-2">
                        <AlertTriangle size={18} className="text-red-500" />
                        <h2 className="font-semibold">{t('finance:overdueInvoices', 'Overdue Invoices')}</h2>
                        {snapshot && snapshot.overdueInvoices.length > 0 && (
                            <Badge variant="error">{snapshot.overdueInvoices.length}</Badge>
                        )}
                    </div>
                </div>
                
                {!snapshot || snapshot.overdueInvoices.length === 0 ? (
                    <div className="p-8 text-center text-tokens-muted">
                        <AlertTriangle size={32} className="mx-auto mb-3 opacity-30" />
                        <p>{t('finance:noOverdue', 'No overdue invoices — great job!')}</p>
                    </div>
                ) : (
                    <div className="divide-y divide-tokens-border">
                        {snapshot.overdueInvoices.slice(0, 10).map((invoice) => (
                            <Link
                                key={invoice.id}
                                to={`/invoices/${invoice.id}`}
                                className="flex items-center justify-between p-4 hover:bg-tokens-panel/50 transition-colors"
                            >
                                <div>
                                    <div className="font-medium">{invoice.number}</div>
                                    <div className="text-sm text-tokens-muted">{invoice.clientName}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-mono text-red-500 font-medium">
                                        {formatPrice(invoice.outstanding)}
                                    </div>
                                    <div className="text-xs text-tokens-muted">
                                        {t('finance:dueOn', 'Due')} {formatDate(invoice.dueDate)}
                                    </div>
                                </div>
                                <ChevronRight size={16} className="text-tokens-muted ml-2" />
                            </Link>
                        ))}
                    </div>
                )}
            </Card>

            {/* Empty state for no invoices in month */}
            {snapshot && snapshot.invoiceCount === 0 && (
                <Card className="mt-6 p-8 text-center">
                    <Receipt size={40} className="mx-auto mb-3 text-tokens-muted opacity-50" />
                    <p className="text-tokens-muted">{t('finance:noInvoices', 'No invoices in this month')}</p>
                </Card>
            )}
        </PageContainer>
    );
}
