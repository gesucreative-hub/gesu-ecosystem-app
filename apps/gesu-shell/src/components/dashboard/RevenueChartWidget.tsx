// Revenue Chart Widget - Monthly revenue bar chart using ECharts
// Business persona dashboard widget

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import ReactECharts from 'echarts-for-react';
import { TrendingUp } from 'lucide-react';
import { Card } from '../Card';
import { type MonthlyRevenue } from '../../hooks/useBusinessDashboardData';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface RevenueChartWidgetProps {
    monthlyRevenue: MonthlyRevenue[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────────────────────

function formatCompactCurrency(amount: number): string {
    if (amount >= 1000000) {
        return `${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
        return `${(amount / 1000).toFixed(0)}K`;
    }
    return amount.toString();
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function RevenueChartWidget({ monthlyRevenue }: RevenueChartWidgetProps) {
    const { t } = useTranslation(['dashboard']);
    
    // Calculate total revenue for the year
    const totalRevenue = useMemo(() => {
        return monthlyRevenue.reduce((sum, m) => sum + m.amount, 0);
    }, [monthlyRevenue]);
    
    // ECharts configuration
    const chartOptions = useMemo(() => {
        const months = monthlyRevenue.map(m => m.month);
        const values = monthlyRevenue.map(m => m.amount);
        
        return {
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                formatter: (params: { name: string; value: number }[]) => {
                    const { name, value } = params[0];
                    return `${name}<br/>Rp${value.toLocaleString('id-ID')}`;
                }
            },
            grid: {
                top: 20,
                right: 20,
                bottom: 30,
                left: 60
            },
            xAxis: {
                type: 'category',
                data: months,
                axisLine: { lineStyle: { color: '#666' } },
                axisLabel: { color: '#888', fontSize: 11 }
            },
            yAxis: {
                type: 'value',
                axisLine: { show: false },
                splitLine: { lineStyle: { color: '#333', type: 'dashed' } },
                axisLabel: { 
                    color: '#888', 
                    fontSize: 11,
                    formatter: (val: number) => formatCompactCurrency(val)
                }
            },
            series: [{
                type: 'bar',
                data: values,
                itemStyle: {
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: '#3B3F8C' },
                            { offset: 1, color: '#5B5FC4' }
                        ]
                    },
                    borderRadius: [4, 4, 0, 0]
                },
                emphasis: {
                    itemStyle: {
                        color: '#7BB662'
                    }
                },
                barWidth: '60%'
            }]
        };
    }, [monthlyRevenue]);

    return (
        <Card className="p-5 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <TrendingUp size={18} className="text-emerald-500" />
                    <h3 className="text-sm font-semibold text-tokens-fg">
                        {t('business.revenueThisYear', 'Revenue This Year')}
                    </h3>
                </div>
                <div className="text-right">
                    <div className="text-lg font-bold text-tokens-fg">
                        Rp{totalRevenue.toLocaleString('id-ID')}
                    </div>
                    <div className="text-xs text-tokens-muted">
                        {t('business.totalRevenue', 'Total Revenue')}
                    </div>
                </div>
            </div>

            {/* Chart */}
            {totalRevenue === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-tokens-muted text-sm min-h-[200px] text-center">
                    <p>{t('business.noRevenueData', 'No revenue data yet')}</p>
                </div>
            ) : (
                <ReactECharts 
                    option={chartOptions} 
                    style={{ height: 200 }}
                    opts={{ renderer: 'svg' }}
                />
            )}
        </Card>
    );
}

export default RevenueChartWidget;
