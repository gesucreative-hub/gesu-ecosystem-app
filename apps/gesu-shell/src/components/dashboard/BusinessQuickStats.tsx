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

    // Color definitions (matching QuickAccessCard styles)
    const colorClasses = {
        emerald: 'from-emerald-500/20 to-emerald-500/5 hover:from-emerald-500/30',
        purple: 'from-purple-500/20 to-purple-500/5 hover:from-purple-500/30',
        amber: 'from-amber-500/20 to-amber-500/5 hover:from-amber-500/30',
    };

    const iconColorClasses = {
        emerald: 'text-emerald-500',
        purple: 'text-purple-500',
        amber: 'text-amber-500',
    };

    const stats = [
        {
            icon: <FileText size={20} />,
            title: t('business.unpaidInvoices', 'Unpaid Invoices'),
            stat: unpaidCount.toString(),
            subStat: formatCurrency(totalUnpaid),
            to: '/invoices?status=sent',
            color: 'amber' as const
        },
        {
            icon: <DollarSign size={20} />,
            title: t('business.thisMonth', 'This Month'),
            stat: formatCurrency(revenueThisMonth), // Revenue is the main stat
            subStat: t('business.totalRevenue', 'Revenue'),
            to: '/invoices?status=paid',
            color: 'emerald' as const
        },
        {
            icon: <Users size={20} />,
            title: t('business.activeClients', 'Active Clients'),
            stat: activeClients.toString(),
            subStat: t('business.clients', 'Clients'),
            to: '/clients',
            color: 'purple' as const
        }
    ];

    return (
        <div className="grid grid-cols-3 gap-4 h-full">
            {stats.map((item, index) => (
                <Link 
                    key={index} 
                    to={item.to}
                    className={`group w-full h-full flex flex-col items-center justify-center p-6 rounded-xl bg-gradient-to-br ${colorClasses[item.color]} border border-tokens-border/30 hover:border-tokens-brand-DEFAULT/40 transition-all hover:shadow-md text-center gap-2`}
                >
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-lg bg-tokens-panel/50 flex items-center justify-center ${iconColorClasses[item.color]}`}>
                        {item.icon}
                    </div>

                    {/* Content */}
                    <div className="flex flex-col items-center">
                        <h3 className="text-sm font-semibold text-tokens-fg group-hover:text-tokens-brand-DEFAULT transition-colors mb-0.5">
                            {item.title}
                        </h3>
                        <div className="flex flex-col items-center">
                            <span className="text-lg font-bold text-tokens-fg leading-tight">{item.stat}</span>
                            {item.subStat && (
                                <span className="text-[10px] text-tokens-muted leading-tight">{item.subStat}</span>
                            )}
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}

export default BusinessQuickStats;
