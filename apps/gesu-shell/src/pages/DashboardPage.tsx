import { Link } from 'react-router-dom';
import { useGesuSettings } from '../lib/gesuSettings';
import { PageContainer } from '../components/PageContainer';
import { useEffect, useState } from 'react';

// --- Sub-components ---

const QuickAction = ({ icon, label, onClick }: { icon: string, label: string, onClick: () => void }) => (
    <button
        onClick={onClick}
        className="flex flex-col items-center justify-center p-4 bg-gesu-card border border-gesu-border rounded-xl hover:bg-gesu-card-hover hover:border-gesu-primary/30 transition-all group"
    >
        <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">{icon}</span>
        <span className="text-xs font-medium text-gesu-text-muted group-hover:text-gesu-text-main">{label}</span>
    </button>
);

const ModuleCard = ({ title, description, to, icon }: { title: string, description: string, to: string, icon: string }) => (
    <Link to={to} className="group relative overflow-hidden bg-gesu-card border border-gesu-border rounded-xl p-5 hover:border-gesu-primary/40 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
        <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-gesu-card-hover group-hover:bg-gesu-primary-bg group-hover:text-gesu-primary-light transition-colors">
                {icon}
            </div>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-gesu-primary text-xs font-bold">OPEN</span>
        </div>
        <h3 className="text-lg font-bold text-gesu-text-main mb-1 group-hover:text-gesu-primary-light transition-colors">{title}</h3>
        <p className="text-xs text-gesu-text-dim leading-relaxed">{description}</p>
    </Link>
);

const EngineStatusPill = ({ id, status, label }: { id: string, status: string, label: string }) => {
    let colorClass = 'bg-gray-800 text-gray-500 border-gray-700'; // unknown
    let icon = '⚫';

    if (status === 'ready_configured' || status === 'ready_path') {
        colorClass = 'bg-emerald-900/30 text-emerald-400 border-emerald-800/50';
        icon = '🟢';
    } else if (status === 'fallback_path') {
        colorClass = 'bg-amber-900/30 text-amber-400 border-amber-800/50';
        icon = '🟠';
    } else if (status === 'missing' || status === 'error') {
        colorClass = 'bg-red-900/30 text-red-400 border-red-800/50';
        icon = '🔴';
    }

    return (
        <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 text-xs font-medium ${colorClass}`}>
            <span className="text-[10px]">{icon}</span>
            <span>{label}</span>
        </div>
    );
};

export function DashboardPage() {
    const { settings } = useGesuSettings();
    const [engineStatus, setEngineStatus] = useState<any>({});
    const [recentJobs, setRecentJobs] = useState<any[]>([]);

    useEffect(() => {
        // Load engine status
        if (window.gesu?.checkTools) {
            window.gesu.checkTools({}).then(res => {
                setEngineStatus({
                    ytDlp: res.ytDlp?.status,
                    ffmpeg: res.ffmpeg?.status,
                    magick: res.imageMagick?.status,
                    office: res.libreOffice?.status
                });
            }).catch(console.error);
        }

        // Load recent jobs
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
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gesu-border pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
                        Dashboard
                    </h1>
                    <p className="text-gesu-text-muted text-sm">
                        System Overview & Quick Access
                    </p>
                </div>
                {/* System Status Row */}
                <div className="flex flex-wrap gap-2">
                    <EngineStatusPill id="yt-dlp" label="yt-dlp" status={engineStatus.ytDlp} />
                    <EngineStatusPill id="ffmpeg" label="ffmpeg" status={engineStatus.ffmpeg} />
                    <EngineStatusPill id="magick" label="magick" status={engineStatus.magick} />
                    <EngineStatusPill id="office" label="office" status={engineStatus.office} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Modules Grid (2/3 width) */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div>
                        <h2 className="text-sm font-semibold text-gesu-text-dim uppercase tracking-wider mb-4">Modules</h2>
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
                        <h2 className="text-sm font-semibold text-gesu-text-dim uppercase tracking-wider mb-4">Quick Actions</h2>
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
                    <div className="bg-gesu-card/50 border border-gesu-border rounded-xl p-5 flex flex-col h-full min-h-[300px]">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-sm font-bold text-gesu-text-main">Recent Activity</h2>
                            <Link to="/media-suite" className="text-[10px] text-gesu-primary hover:underline">VIEW ALL</Link>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                            {recentJobs.length === 0 ? (
                                <div className="text-center text-xs text-gesu-text-dim py-10 italic">No recent jobs</div>
                            ) : (
                                recentJobs.map((job, i) => (
                                    <div key={i} className="bg-gesu-bg/50 p-2 rounded border border-gesu-border flex flex-col gap-1 hover:border-gesu-border-light transition-colors">
                                        <div className="flex justify-between items-start">
                                            <span className="text-xs font-medium text-gesu-text-main truncate max-w-[140px]" title={job.label || job.url}>{job.label || 'Job'}</span>
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${job.status === 'success' ? 'bg-emerald-900/40 text-emerald-400' : 'bg-gray-800 text-gray-400'}`}>{job.status}</span>
                                        </div>
                                        <span className="text-[10px] text-gesu-text-dim">{new Date(job.timestamp).toLocaleString()}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-auto pt-6 border-t border-gesu-border text-[10px] text-gesu-text-dim flex justify-between">
                <span>Gesu Shell v2.0.0-alpha</span>
                <span>WorkFlow Root: <span className="font-mono text-gesu-text-muted">{settings?.paths?.workflowRoot || 'Nt Set'}</span></span>
            </div>
        </PageContainer>
    );
}
