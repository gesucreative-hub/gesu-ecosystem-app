// Contracts Pipeline Widget - Shows contract status distribution
// Business persona dashboard widget

import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FileText, ChevronRight } from 'lucide-react';
import { Card } from '../Card';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ContractsPipelineWidgetProps {
    contractsByStatus: {
        draft: number;
        sent: number;
        signed: number;
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function ContractsPipelineWidget({ contractsByStatus }: ContractsPipelineWidgetProps) {
    const { t } = useTranslation(['dashboard', 'invoices']);
    
    const total = contractsByStatus.draft + contractsByStatus.sent + contractsByStatus.signed;
    
    const stages = [
        {
            label: t('invoices:status.draft', 'Draft'),
            count: contractsByStatus.draft,
            color: 'bg-gray-400',
            percent: total > 0 ? (contractsByStatus.draft / total) * 100 : 0
        },
        {
            label: t('invoices:status.sent', 'Sent'),
            count: contractsByStatus.sent,
            color: 'bg-amber-500',
            percent: total > 0 ? (contractsByStatus.sent / total) * 100 : 0
        },
        {
            label: t('invoices:status.signed', 'Signed'),
            count: contractsByStatus.signed,
            color: 'bg-emerald-500',
            percent: total > 0 ? (contractsByStatus.signed / total) * 100 : 0
        }
    ];

    return (
        <Card className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <FileText size={18} className="text-tokens-muted" />
                    <h3 className="font-semibold text-tokens-fg">
                        {t('business.contractsPipeline', 'Contracts Pipeline')}
                    </h3>
                </div>
                <Link 
                    to="/contracts" 
                    className="text-sm text-tokens-brand-DEFAULT hover:underline flex items-center gap-1"
                >
                    {t('activeProjects.viewAll', 'View All')}
                    <ChevronRight size={14} />
                </Link>
            </div>

            {/* Pipeline Stages */}
            {total === 0 ? (
                <div className="text-center py-8 text-tokens-muted text-sm">
                    {t('business.noContracts', 'No contracts yet')}
                </div>
            ) : (
                <div className="space-y-3">
                    {stages.map((stage, index) => (
                        <div key={index} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-tokens-muted">{stage.label}</span>
                                <span className="font-semibold text-tokens-fg">{stage.count}</span>
                            </div>
                            <div className="h-2 bg-tokens-panel2 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full ${stage.color} transition-all duration-500`}
                                    style={{ width: `${Math.max(stage.percent, stage.count > 0 ? 5 : 0)}%` }}
                                />
                            </div>
                        </div>
                    ))}
                    
                    {/* Total */}
                    <div className="pt-2 border-t border-tokens-border">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-tokens-muted">{t('common:total', 'Total')}</span>
                            <span className="font-bold text-tokens-fg">{total}</span>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
}

export default ContractsPipelineWidget;
