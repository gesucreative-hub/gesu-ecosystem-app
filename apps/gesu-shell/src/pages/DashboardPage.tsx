import { Link } from 'react-router-dom';
import { useGesuSettings } from '../lib/gesuSettings';
import { useEngineStatus } from '../lib/useEngineStatus';
import { PageContainer } from '../components/PageContainer';
import { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { RefreshCw } from 'lucide-react';

// --- Sub-components ---

const QuickAction = ({ icon, label, onClick }: { icon: string, label: string, onClick: () => void }) => (
    <button
        onClick={onClick}
        className="flex flex-col items-center justify-center p-4 bg-tokens-panel border border-tokens-border rounded-xl hover:bg-tokens-panel/80 hover:border-tokens-brand-DEFAULT/30 transition-all group shadow-sm active:scale-[0.98]"
    >
        <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">{icon}</span>
        <span className="text-xs font-medium text-tokens-muted group-hover:text-tokens-fg">{label}</span>
    </button>
);

const ModuleCard = ({ title, description, to, icon }: { title: string, description: string, to: string, icon: string }) => (
    <Link to={to} className="group relative overflow-hidden bg-tokens-panel border border-tokens-border rounded-xl p-5 hover:border-tokens-brand-DEFAULT/40 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
        <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-tokens-panel2 group-hover:bg-tokens-brand-DEFAULT/10 group-hover:text-tokens-brand-DEFAULT transition-colors">
                {icon}
            </div>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-tokens-brand-DEFAULT text-xs font-bold">OPEN</span>
        </div>
        <h3 className="text-lg font-bold text-tokens-fg mb-1 group-hover:text-tokens-brand-DEFAULT transition-colors">{title}</h3>
        <p className="text-xs text-tokens-muted leading-relaxed">{description}</p>
    </Link>
);

const EngineStatusPill = ({ status, label }: { status: string, label: string }) => {
    let variant: 'success' | 'warning' | 'error' | 'neutral' = 'neutral';
    let icon = '⚫';

    if (status === 'ready_configured' || status === 'ready_path') {
        variant = 'success';
        icon = '🟢';
    } else if (status === 'fallback_path') {
        variant = 'warning';
        icon = '🟠';
    } else if (status === 'missing' || status === 'error') {
        variant = 'error';
        icon = '🔴';
    } else if (status === 'checking') {
        variant = 'neutral';
        icon = '⏳';
    }

    return (
        <Badge variant={variant} className="pl-1.5 pr-2.5 py-1">
            <span className="text-[10px] opacity-70">{icon}</span>
            <span>{label}</span>
        </Badge>
    );
};

export function DashboardPage() {
    const { settings } = useGesuSettings();
    const { engines, isRefreshing, lastCheckedLabel, refresh } = useEngineStatus();
    const [recentJobs, setRecentJobs] = useState<any[]>([]);

    useEffect(() => {
        // Load recent jobs (if available)
        if (window.gesu?.mediaSuite?.getRecentJobs) {
            window.gesu.mediaSuite.getRecentJobs().then(jobs => {
                setRecentJobs(jobs.slice(0, 5));
            }).catch(console.error);
        }
    }, []);

    const openFolder = async (target: 'workflow' | 'projects') => {
        if (window.gesu?.mediaSuite?.openFolder) {
            // Mapping target for demo; 'workflow' maps to configured workflow root
            await window.gesu.mediaSuite.openFolder(target as any);
        }
    };

    return (
        <PageContainer className="flex flex-col h-full gap-8 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-tokens-border pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-tokens-fg tracking-tight mb-2">
                        Dashboard
                    </h1>
                    <p className="text-tokens-muted text-sm">
                        System Overview & Quick Access
                    </p>
                </div>
                {/* System Status Row */}
                <div className="flex flex-wrap items-center gap-2">
                    {engines.map(engine => (
                        <EngineStatusPill
                            key={engine.id}
                            label={engine.name}
                            status={engine.status}
                        />
                    ))}
                    <button
                        onClick={refresh}
                        disabled={isRefreshing}
                        className="ml-2 p-1.5 rounded-lg bg-tokens-panel2 border border-tokens-border hover:bg-tokens-panel hover:border-tokens-brand-DEFAULT/30 transition-all disabled:opacity-50"
                        title="Refresh engine status"
                    >
                        <RefreshCw size={14} className={`text-tokens-muted ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                    <span className="text-[10px] text-tokens-muted">{lastCheckedLabel}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Modules Grid (2/3 width) */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div>
                        <h2 className="text-sm font-semibold text-tokens-muted uppercase tracking-wider mb-4">Modules</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <ModuleCard
                                title="Media Suite"
                                description="Downloader & Converter factory."
                                to="/media-suite"
                                icon="🎬"
                            />
                            <ModuleCard
                                title="Focus Compass"
                                description="Energy & Task management."
                                to="/compass"
                                icon="🧭"
                            />
                            <ModuleCard
                                title="Refocus"
                                description="Deep work session & overrides."
                                to="/refocus"
                                icon="🎯"
                            />
                            <ModuleCard
                                title="Settings"
                                description="System configuration."
                                to="/settings"
                                icon="⚙️"
                            />
                        </div>
                    </div>

                    <div>
                        <h2 className="text-sm font-semibold text-tokens-muted uppercase tracking-wider mb-4">Quick Actions</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <QuickAction icon="📂" label="Open Workflow DB" onClick={() => openFolder('workflow')} />
                            <QuickAction icon="📁" label="Open Projects" onClick={() => openFolder('projects')} />
                            {/* <QuickAction icon="🔄" label="Check Updates" onClick={() => alert('Checking...')} /> */}
                        </div>
                    </div>
                </div>

                {/* Sidebar / Right Col (1/3 width) */}
                <div className="flex flex-col gap-6">
                    {/* Recent Activity Panel */}
                    <Card
                        title="Recent Activity"
                        headerAction={<Link to="/media-suite" className="text-[10px] text-tokens-brand-DEFAULT hover:underline">VIEW ALL</Link>}
                        className="h-full min-h-[300px] flex flex-col"
                    >
                        <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                            {recentJobs.length === 0 ? (
                                <div className="text-center text-xs text-tokens-muted py-10 italic">No recent jobs</div>
                            ) : (
                                recentJobs.map((job, i) => (
                                    <div key={i} className="bg-tokens-panel2/50 p-3 rounded-lg border border-tokens-border flex flex-col gap-1.5 hover:border-tokens-brand-DEFAULT/20 transition-colors">
                                        <div className="flex justify-between items-start">
                                            <span className="text-sm font-medium text-tokens-fg truncate max-w-[140px]" title={job.label || job.url}>{job.label || 'Job'}</span>
                                            <Badge variant={job.status === 'success' ? 'success' : 'neutral'} className="text-[10px] px-1.5 py-0 uppercase">
                                                {job.status}
                                            </Badge>
                                        </div>
                                        <span className="text-[10px] text-tokens-muted">{new Date(job.timestamp).toLocaleString()}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            <div className="mt-auto pt-6 border-t border-tokens-border text-[10px] text-tokens-muted flex justify-between">
                <span>Gesu Shell v2.0.0-alpha</span>
                <span>WorkFlow Root: <span className="font-mono text-tokens-fg">{settings?.paths?.workflowRoot || 'Not Set'}</span></span>
            </div>
        </PageContainer>
    );
}
