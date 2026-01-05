/**
 * Dashboard Page - Persona-Aware Layout
 * Personal: Productivity widgets (activity, tasks, schedule)
 * Business: Financial widgets (invoices, revenue, clients)
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Compass, BarChart2, Folder } from 'lucide-react';
import { useDashboardData } from '../hooks/useDashboardData';
import { useBusinessDashboardData } from '../hooks/useBusinessDashboardData';
import { usePersona } from '../hooks/usePersona';
import { PageContainer } from '../components/PageContainer';
import { WelcomeHeader } from '../components/dashboard/WelcomeHeader';
// Personal widgets
import { WeeklyActivityChart } from '../components/dashboard/WeeklyActivityChart';
import { DailyScheduleWidget } from '../components/dashboard/DailyScheduleWidget';
import { CalendarWidget } from '../components/dashboard/CalendarWidget';
import { ActiveProjectCard } from '../components/dashboard/ActiveProjectCard';
import { ActiveProjectsWidget } from '../components/dashboard/ActiveProjectsWidget';
import { TasksDueWidget } from '../components/dashboard/TasksDueWidget';
import { QuickAccessCard } from '../components/dashboard/QuickAccessCard';
// Business widgets
import { BusinessQuickStats } from '../components/dashboard/BusinessQuickStats';
import { ActiveInvoicesWidget } from '../components/dashboard/ActiveInvoicesWidget';
import { OverdueAlertsWidget } from '../components/dashboard/OverdueAlertsWidget';
import { ContractsPipelineWidget } from '../components/dashboard/ContractsPipelineWidget';
import { RecentClientsWidget } from '../components/dashboard/RecentClientsWidget';
import { RevenueChartWidget } from '../components/dashboard/RevenueChartWidget';
import { getTodayTasks } from '../stores/projectHubTasksStore';

// ─────────────────────────────────────────────────────────────────────────────
// Personal Dashboard Layout
// ─────────────────────────────────────────────────────────────────────────────

function PersonalDashboard() {
    const { t } = useTranslation(['dashboard', 'common']);
    const { data: dashboardData } = useDashboardData();
    const [projectCount, setProjectCount] = useState(0);
    const [tasksDoneToday, setTasksDoneToday] = useState(0);

    // Load real project count
    useEffect(() => {
        const loadProjectCount = async () => {
            if (window.gesu?.projects?.list) {
                try {
                    const projects = await window.gesu.projects.list();
                    setProjectCount(projects.length);
                } catch (err) {
                    console.error('Failed to load project count:', err);
                }
            }
        };
        loadProjectCount();
    }, []);

    // Get tasks done today
    useEffect(() => {
        const tasks = getTodayTasks();
        const done = tasks.filter(t => t.done).length;
        setTasksDoneToday(done);
    }, []);

    return (
        <>
            {/* Row 2: Quick Access + Active Project (50/50 Split) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left: 3 Quick Access Cards */}
                <div className="grid grid-cols-3 gap-4">
                    <QuickAccessCard
                        icon={<Compass size={20} />}
                        title={t('common:nav.compass')}
                        stat={dashboardData?.weeklyStats.totalSessions.toString() || '0'}
                        statLabel={t('quickStats.snapshots')}
                        to="/compass"
                        color="brand"
                    />
                    <QuickAccessCard
                        icon={<BarChart2 size={20} />}
                        title={t('common:nav.activity')}
                        stat={tasksDoneToday.toString()}
                        statLabel={t('quickStats.doneToday')}
                        to="/activity"
                        color="emerald"
                    />
                    <QuickAccessCard
                        icon={<Folder size={20} />}
                        title={t('common:nav.projectHub')}
                        stat={projectCount.toString()}
                        statLabel={t('quickStats.projects')}
                        to="/initiator"
                        color="purple"
                    />
                </div>

                {/* Right: Active Project Card */}
                <ActiveProjectCard />
            </div>

            {/* Row 3: Weekly Activity + Daily Schedule + Calendar */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <WeeklyActivityChart />
                <DailyScheduleWidget />
                <CalendarWidget />
            </div>

            {/* Row 4: Active Projects + Tasks Due */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ActiveProjectsWidget />
                <TasksDueWidget />
            </div>
        </>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Business Dashboard Layout
// ─────────────────────────────────────────────────────────────────────────────

function BusinessDashboard() {
    const { data, loading } = useBusinessDashboardData();

    if (loading || !data) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-pulse text-tokens-muted">Loading...</div>
            </div>
        );
    }

    return (
        <>
            {/* Row 2: Quick Stats + Active Invoices */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <BusinessQuickStats
                    totalUnpaid={data.stats.totalUnpaid}
                    unpaidCount={data.stats.unpaidCount}
                    revenueThisMonth={data.stats.revenueThisMonth}
                    activeClients={data.stats.activeClients}
                />
                <ActiveInvoicesWidget invoices={data.unpaidInvoices} />
            </div>

            {/* Row 3: Overdue + Pipeline + Recent Clients */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <OverdueAlertsWidget overdueInvoices={data.overdueInvoices} />
                <ContractsPipelineWidget contractsByStatus={data.contractsByStatus} />
                <RecentClientsWidget clients={data.recentClients} />
            </div>

            {/* Row 4: Revenue Chart */}
            <RevenueChartWidget monthlyRevenue={data.monthlyRevenue} />
        </>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component - Persona-Aware
// ─────────────────────────────────────────────────────────────────────────────

export function DashboardPage() {
    const { activePersona } = usePersona();
    const isBusinessPersona = activePersona === 'business';

    return (
        <PageContainer className="flex flex-col gap-6 pb-12">
            {/* Row 1: Welcome Header (shared) */}
            <WelcomeHeader />

            {/* Persona-specific content */}
            {isBusinessPersona ? <BusinessDashboard /> : <PersonalDashboard />}
        </PageContainer>
    );
}
