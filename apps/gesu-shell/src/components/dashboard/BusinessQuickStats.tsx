// Business Quick Stats - Quick access cards for business persona dashboard
// Shows unpaid invoices, revenue this month, active clients

import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FileText, DollarSign, Users } from 'lucide-react';
import { Card } from '../Card';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface BusinessQuickStatsProps {
    totalUnpaid: number;
    unpaidCount: number;
    revenueThisMonth: number;
    activeClients: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
    if (amount >= 1000000) {
        return `Rp${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
        return `Rp${(amount / 1000).toFixed(0)}K`;
    }
    return `Rp${amount.toLocaleString('id-ID')}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function BusinessQuickStats({
    totalUnpaid,
    unpaidCount,
    revenueThisMonth,
    activeClients
}: BusinessQuickStatsProps) {
    const { t } = useTranslation(['dashboard', 'common']);

    const stats = [
        {
            icon: <FileText size={20} />,
            title: t('dashboard:business.unpaidInvoices', 'Unpaid Invoices'),
            stat: unpaidCount.toString(),
            subStat: formatCurrency(totalUnpaid),
            to: '/invoices?status=sent',
            color: 'text-amber-500',
            bgColor: 'bg-amber-500/10'
        },
        {
            icon: <DollarSign size={20} />,
            title: t('dashboard:business.revenueThisMonth', 'This Month'),
            stat: formatCurrency(revenueThisMonth),
            subStat: t('dashboard:business.revenue', 'Revenue'),
            to: '/invoices?status=paid',
            color: 'text-emerald-500',
            bgColor: 'bg-emerald-500/10'
        },
        {
            icon: <Users size={20} />,
            title: t('dashboard:business.activeClients', 'Active Clients'),
            stat: activeClients.toString(),
            subStat: t('dashboard:business.clients', 'Clients'),
            to: '/clients',
            color: 'text-purple-500',
            bgColor: 'bg-purple-500/10'
        }
    ];

    return (
        <div className="grid grid-cols-3 gap-4">
            {stats.map((item, index) => (
                <Link key={index} to={item.to}>
                    <Card className="p-4 hover:bg-tokens-panel2 transition-colors cursor-pointer h-full">
                        <div className="flex items-start justify-between mb-3">
                            <div className={`p-2 rounded-lg ${item.bgColor}`}>
                                <span className={item.color}>{item.icon}</span>
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-tokens-fg mb-1">
                            {item.stat}
                        </div>
                        <div className="text-sm text-tokens-muted">
                            {item.title}
                        </div>
                        {item.subStat && (
                            <div className="text-xs text-tokens-muted mt-1">
                                {item.subStat}
                            </div>
                        )}
                    </Card>
                </Link>
            ))}
        </div>
    );
}

export default BusinessQuickStats;
