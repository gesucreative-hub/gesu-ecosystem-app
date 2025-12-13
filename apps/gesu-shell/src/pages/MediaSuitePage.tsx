import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGesuSettings } from '../lib/gesuSettings';
import { PageContainer } from '../components/PageContainer';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Tabs } from '../components/Tabs';


// --- Types & Interfaces ---

type Tab = 'downloader' | 'converter' | 'history';

type JobType = 'download' | 'convert';
type JobStatus = 'queued' | 'running' | 'success' | 'error' | 'canceled';
type JobEngine = 'yt-dlp' | 'ffmpeg' | 'image-magick' | 'libreoffice' | 'combo';

type DownloadPreset = 'music-mp3' | 'video-1080p' | 'video-best';
type ConvertPreset = 'audio-mp3-320' | 'audio-mp3-192' | 'audio-wav-48k' | 'audio-aac-256' | 'video-mp4-1080p' | 'video-mp4-720p' | 'video-mp4-540p-lite';
type NetworkProfile = 'hemat' | 'normal' | 'gaspol';
type MediaOutputTarget = 'shell' | 'workflow';

interface Job {
    id: string;
    type: JobType;
    label: string;
    engine: JobEngine;
    createdAt: string;
    updatedAt: string;
    status: JobStatus;
    payload: Record<string, unknown>;
    errorMessage?: string;
    progress?: number;
}

// --- Constants ---

const DOWNLOAD_PRESETS: { value: DownloadPreset; label: string }[] = [
    { value: 'music-mp3', label: 'Music MP3' },
    { value: 'video-1080p', label: 'Video 1080p' },
    { value: 'video-best', label: 'Best Video' }
];

const NETWORK_PROFILES: { value: NetworkProfile; label: string }[] = [
    { value: 'hemat', label: 'Hemat (Low Bandwidth)' },
    { value: 'normal', label: 'Normal' },
    { value: 'gaspol', label: 'Gaspol (Max Speed)' }
];



const CONVERT_PRESETS: { value: ConvertPreset; label: string; category: 'Audio' | 'Video' }[] = [
    { value: 'audio-mp3-320', label: 'Audio MP3 – 320 kbps', category: 'Audio' },
    { value: 'audio-mp3-192', label: 'Audio MP3 – 192 kbps', category: 'Audio' },
    { value: 'audio-aac-256', label: 'Audio AAC – 256 kbps', category: 'Audio' },
    { value: 'audio-wav-48k', label: 'Audio WAV – 48 kHz', category: 'Audio' },
    { value: 'video-mp4-1080p', label: 'Video MP4 – 1080p (HQ)', category: 'Video' },
    { value: 'video-mp4-720p', label: 'Video MP4 – 720p', category: 'Video' },
    { value: 'video-mp4-540p-lite', label: 'Video MP4 – 540p (Lite)', category: 'Video' }
];

// --- Helper Components ---

const StatusBadge = ({ status, progress }: { status: JobStatus, progress?: number }) => {
    const variants: Record<JobStatus, 'neutral' | 'brand' | 'success' | 'warning' | 'error'> = {
        queued: 'neutral',
        running: 'brand',
        success: 'success',
        error: 'error',
        canceled: 'neutral'
    };

    const labels = {
        queued: 'Queued',
        running: `Running ${progress ? `(${progress}%)` : ''}`,
        success: 'Done',
        error: 'Failed',
        canceled: 'Canceled'
    };

    return (
        <Badge variant={variants[status]} className={status === 'running' ? 'animate-pulse' : ''}>
            {labels[status]}
        </Badge>
    );
};

const PRESET_DISPLAY_NAMES: Record<string, string> = {
    "audio-mp3-320": "Audio MP3 · 320 kbps",
    "audio-mp3-192": "Audio MP3 · 192 kbps",
    "audio-wav-48k": "Audio WAV · 48 kHz",
    "audio-aac-256": "Audio AAC · 256 kbps",
    "video-mp4-1080p": "Video MP4 · 1080p (HQ)",
    "video-mp4-720p": "Video MP4 · 720p",
    "video-mp4-540p-lite": "Video MP4 · 540p (Lite)",
    "video-advanced": "Video (Advanced)",
};

function getPresetDisplayName(presetId?: string | null): string {
    if (!presetId) return "";
    return PRESET_DISPLAY_NAMES[presetId] ?? presetId;
}

// Ringkasan advanced options dari payload (untuk kartu Job Queue)
function formatAdvancedOptionsSummaryFromPayload(payload: any): string {
    const opts = payload?.advancedOptions || {};
    const resMap: Record<string, string> = {
        source: 'Source',
        '1080p': '1080p',
        '720p': '720p',
        '540p': '540p',
    };
    const qualityMap: Record<string, string> = {
        high: 'High',
        medium: 'Medium',
        lite: 'Lite',
    };
    const audioMap: Record<string, string> = {
        'copy': 'Copy',
        'aac-192': 'AAC 192k',
        'aac-128': 'AAC 128k',
    };

    const r = resMap[(opts as any).resolution] || (opts as any).resolution || 'Source';
    const q = qualityMap[(opts as any).quality] || (opts as any).quality || 'Medium';
    const a = audioMap[(opts as any).audio] || (opts as any).audio || 'Audio';

    return `${r} · ${q} · ${a}`;
}

// --- Status Widget ---
// Status can be: 'configured' (Green), 'path' (Yellow), 'missing' (Red)
// Mapped from backend resolution: 'configured' | 'path' | 'missing'

const ToolStatusDot = ({ name, data }: { name: string, data?: any }) => {
    const status = data?.status || 'unknown'; // 'ready_configured' | 'ready_path' | 'fallback_path' | 'missing' | ...

    // Strict Option 1 mapping
    const colors: Record<string, string> = {
        ready_configured: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]',
        ready_path: 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]',
        fallback_path: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]',
        missing: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]',
        unknown: 'bg-tokens-muted',
        error: 'bg-red-500'
    };

    const displayText: Record<string, string> = {
        ready_configured: 'Ready (Config)',
        ready_path: 'Ready (System)',
        fallback_path: 'WARNING (Fallback)',
        missing: 'MISSING',
        error: 'ERROR',
        unknown: 'Unknown'
    };

    const displayColor = colors[status] || colors.unknown;

    return (
        <div className="flex items-center gap-1.5 cursor-help group relative">
            <div className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${displayColor}`}></div>
            <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">{name}</span>
            {/* Detailed Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-tokens-popover border border-tokens-border shadow-xl rounded min-w-[200px] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 text-[10px] text-tokens-muted">
                <div className="font-semibold text-tokens-fg mb-1 border-b border-tokens-border pb-1">{name}: <span className="text-xs font-mono ml-1">{displayText[status] || status}</span></div>
                <div className="grid grid-cols-[max-content_1fr] gap-x-2 gap-y-1">
                    <span className="text-tokens-muted">Config:</span>
                    <span className={`font-mono break-all ${status === 'fallback_path' ? 'text-amber-500 decoration-wavy underline' : 'text-tokens-fg'}`}>
                        {data?.configuredPath || '(none)'}
                        {status === 'fallback_path' && ' (Invalid)'}
                    </span>

                    <span className="text-tokens-muted">Using:</span>
                    <span className="font-mono text-emerald-500 break-all">{data?.resolvedPath || '(none)'}</span>

                    <span className="text-tokens-muted">Source:</span>
                    <span className="text-tokens-fg">{data?.resolution}</span>
                </div>
            </div>
        </div>
    );
};

export function MediaSuitePage() {
    // State
    const [activeTab, setActiveTab] = useState<Tab>('downloader');
    const [jobs, setJobs] = useState<Job[]>([]);
    const [historyJobs, setHistoryJobs] = useState<MediaSuiteJob[]>([]);
    const [queueFilter, setQueueFilter] = useState<'all' | 'download' | 'convert' | 'advanced'>('all');
    const [historyFilter, setHistoryFilter] = useState<'all' | 'download' | 'convert' | 'advanced'>('all');

    const [toolsStatus, setToolsStatus] = useState<any>(null);

    const checkTools = () => {
        if (window.gesu?.checkTools) {
            window.gesu.checkTools({}).then(res => {
                setToolsStatus({
                    ytDlp: res.ytDlp,
                    ffmpeg: res.ffmpeg,
                    magick: res.imageMagick,
                    office: res.libreOffice
                });
            }).catch(console.error);
        }
    };

    // Use Shared Settings Hook to detect changes
    const { settings: globalSettings } = useGesuSettings();

    // Initial Load & Focus Refetch
    useEffect(() => {
        refreshJobs();
        refreshHistory();
        checkTools();

        const onFocus = () => checkTools();
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, []);

    // Re-check tools when global settings change (e.g. edited in another window or saved)
    useEffect(() => {
        if (globalSettings) {
            console.log('[MediaSuite] Settings changed, refreshing tools...');
            checkTools();
        }
    }, [globalSettings]);

    // Downloader Form State
    const [url, setUrl] = useState('');
    const [dlPreset, setDlPreset] = useState<DownloadPreset>('music-mp3');
    const [netProfile, setNetProfile] = useState<NetworkProfile>('normal');
    const [outputTarget, setOutputTarget] = useState<MediaOutputTarget>('shell');

    // Notification State
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Converter Form State
    const [convertFilePath, setConvertFilePath] = useState('');
    const [convertPreset, setConvertPreset] = useState<ConvertPreset>('video-mp4-1080p');
    const [convertMode, setConvertMode] = useState<'simple' | 'advanced'>('simple');

    // Advanced Options State
    const [advRes, setAdvRes] = useState<AdvancedVideoResolution>('1080p');
    const [advQuality, setAdvQuality] = useState<AdvancedVideoQuality>('medium');
    const [advAudio, setAdvAudio] = useState<AdvancedAudioProfile>('aac-192');

    // Job Actions via IPC
    const refreshJobs = async () => {
        if (!window.gesu?.jobs) return;
        try {
            const remoteJobs = await window.gesu.jobs.list();
            // Map GesuJob (global) to Job (local)
            const mappedJobs: Job[] = remoteJobs.map((j: any) => ({
                id: j.id,
                type: j.type as JobType,
                label: j.label,
                engine: (j.payload?.engine || 'combo') as JobEngine,
                createdAt: j.createdAt,
                updatedAt: j.updatedAt,
                status: j.status as JobStatus,
                payload: j.payload || {},
                errorMessage: j.errorMessage,
                progress: j.payload?.progress
            }));
            setJobs(mappedJobs);
        } catch (err) {
            console.error('Failed to fetch jobs:', err);
        }
    };

    const refreshHistory = async () => {
        if (!window.gesu?.mediaSuite) return;
        try {
            const history = await window.gesu.mediaSuite.getRecentJobs();
            setHistoryJobs(history);
        } catch (err) {
            console.error('Failed to fetch history:', err);
        }
    };

    const enqueueJob = async (type: JobType, label: string, engine: JobEngine, payload: Record<string, unknown>) => {
        if (!window.gesu?.jobs) {
            // Fallback for browser-only dev (mock)
            const mockJob: Job = {
                id: crypto.randomUUID().slice(0, 8),
                type, label, engine, payload,
                status: 'queued',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            setJobs(prev => [mockJob, ...prev]);
            showToast('Job queued (Mock - No Electron)', 'success');
            return;
        }

        try {
            // We pass 'engine' inside payload for now, as main process skeleton only expects generic payload
            await window.gesu.jobs.enqueue({
                type,
                label,
                payload: { ...payload, engine }
            });

            refreshJobs(); // Refresh list immediately
            refreshHistory(); // Refresh history too
            showToast('Download job queued', 'success');
        } catch (err) {
            console.error(err);
            showToast('Failed to enqueue job', 'error');
        }
    };

    // User Actions
    const handleQueueDownload = () => {
        if (!url.trim()) {
            showToast("Please enter a valid URL", 'error');
            return;
        }
        const payload = { url, preset: dlPreset, network: netProfile, target: outputTarget };
        enqueueJob('download', `DL: ${url.slice(0, 30)}...`, 'yt-dlp', payload);
        setUrl('');
    };

    const handleBrowseFile = async () => {
        if (!window.gesu?.mediaSuite?.pickSourceFile) {
            showToast("File picker not supported in browser mode", 'error');
            return;
        }
        try {
            const path = await window.gesu.mediaSuite.pickSourceFile();
            if (path) setConvertFilePath(path);
        } catch (e) {
            console.error(e);
            showToast("Failed to pick file", 'error');
        }
    };

    const handleQueueConvert = () => {
        if (!convertFilePath) {
            showToast("Please select a source file", 'error');
            return;
        }

        // Simplify ID for UI
        const simpleName = convertFilePath.split(/[/\\]/).pop();

        let payload: any = {
            kind: 'convert',
            inputPath: convertFilePath,
            target: outputTarget
        };

        if (convertMode === 'simple') {
            payload.preset = convertPreset;
            enqueueJob('convert', `Conv: ${simpleName}`, 'ffmpeg', payload);
        } else {
            payload.preset = 'video-advanced';
            payload.advancedOptions = {
                resolution: advRes,
                quality: advQuality,
                audio: advAudio
            };
            const desc = `Adv: ${advRes} · ${advQuality} · ${advAudio}`;
            enqueueJob('convert', `${simpleName} (${desc})`, 'ffmpeg', payload);
        }

        setConvertFilePath('');
        showToast('Convert job queued', 'success');
    };

    const handleOpenFolder = async (target: MediaOutputTarget) => {
        if (!window.gesu?.mediaSuite?.openFolder) {
            showToast("Folder open not supported in browser mode", 'error');
            return;
        }
        try {
            const result = await window.gesu.mediaSuite.openFolder(target);
            if (result.success) {
                // showToast(`Opened ${target === 'shell' ? 'Shell' : 'WF DB'} folder`, 'success');
            } else {
                showToast(`Failed to open folder: ${result.error}`, 'error');
            }
        } catch (e) {
            console.error(e);
            showToast("Failed to open folder", 'error');
        }
    };

    return (
        <PageContainer maxWidth="full" className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-2 relative overflow-hidden">
            <style>{`
                .scroll-on-hover::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                .scroll-on-hover::-webkit-scrollbar-track {
                    background: transparent;
                }
                .scroll-on-hover::-webkit-scrollbar-thumb {
                    background: rgba(107, 114, 128, 0.3);
                    border-radius: 3px;
                }
                .scroll-on-hover:hover::-webkit-scrollbar-thumb {
                    background: rgba(107, 114, 128, 0.6);
                }
            `}</style>

            {/* Toast Notification */}
            {toast && (
                <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-xl z-50 flex items-center gap-3 animate-in slide-in-from-right-10 duration-300 ${toast.type === 'success' ? 'bg-emerald-900 border border-emerald-700 text-emerald-100' : 'bg-red-900 border border-red-700 text-red-100'
                    }`}>
                    <span className="text-xl">{toast.type === 'success' ? '✅' : '⚠️'}</span>
                    <span className="font-medium text-sm">{toast.message}</span>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-tokens-fg tracking-tight">Gesu Media Suite</h1>
                    <p className="text-tokens-muted text-sm mt-1">Universal media downloader & format converter.</p>
                </div>

                <div className="flex items-center gap-4">
                    <Link to="/" className="px-3 py-2 bg-tokens-panel2 hover:bg-tokens-panel2/80 text-tokens-muted hover:text-tokens-fg rounded-lg text-sm border border-tokens-border transition-colors shrink-0">
                        ← Back
                    </Link>
                </div>
            </div>

            {/* Sub-header / Tools Status Bar */}
            <div className="flex justify-end px-6 -mt-4 mb-2">
                <div className="flex bg-tokens-panel2/40 border border-tokens-border rounded-full pl-4 pr-2 py-1 gap-4 items-center backdrop-blur-sm">
                    <span className="text-[10px] text-tokens-muted font-medium uppercase tracking-widest mr-1">Engine Status</span>

                    <ToolStatusDot name="yt-dlp" data={toolsStatus?.ytDlp} />
                    <ToolStatusDot name="ffmpeg" data={toolsStatus?.ffmpeg} />
                    <ToolStatusDot name="Magick" data={toolsStatus?.magick} />

                    <div className="h-3 w-px bg-tokens-border mx-1"></div>

                    <button
                        onClick={checkTools}
                        className="text-[10px] text-tokens-muted hover:text-tokens-fg transition-colors"
                        title="Refresh Status"
                    >
                        🔄
                    </button>

                    <Link to="/settings" className="px-2 py-0.5 rounded-full bg-tokens-panel2 text-[10px] text-tokens-brand-DEFAULT hover:text-tokens-brand-hover hover:bg-tokens-border transition-colors">
                        Configure
                    </Link>
                </div>
            </div>

            {/* Tabs */}
            <Tabs
                tabs={[
                    { id: 'downloader', label: 'Downloader', icon: '⬇️' },
                    { id: 'converter', label: 'Converter', icon: '⚡' },
                    { id: 'history', label: 'Job History', icon: '📜' }
                ]}
                activeTab={activeTab}
                onChange={(id) => { setActiveTab(id as Tab); if (id === 'history') refreshHistory(); }}
                className="px-6"
            />

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2.2fr)_minmax(320px,1fr)] gap-6 max-w-7xl w-full mx-auto flex-1 min-h-0 px-6">

                {/* --- LEFT COLUMN: INPUT FORMS --- */}
                <div className="flex flex-col gap-6 w-full min-w-0">

                    {/* Downloader Form */}
                    {activeTab === 'downloader' && (
                        <Card title="Quick Download" className="bg-tokens-panel backdrop-blur-sm shadow-lg">
                            <div className="flex flex-col gap-5">
                                <Input
                                    label="Source URL"
                                    placeholder="https://..."
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    icon={<span className="text-base">🔗</span>}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <Select
                                        label="Preset"
                                        value={dlPreset}
                                        onChange={(e) => setDlPreset(e.target.value as DownloadPreset)}
                                        options={DOWNLOAD_PRESETS}
                                    />
                                    <Select
                                        label="Network Profile"
                                        value={netProfile}
                                        onChange={(e) => setNetProfile(e.target.value as NetworkProfile)}
                                        options={NETWORK_PROFILES}
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium text-tokens-muted">Save to</label>
                                    <div className="flex bg-tokens-panel2 p-1 rounded-lg border border-tokens-border">
                                        <button
                                            onClick={() => setOutputTarget('shell')}
                                            className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${outputTarget === 'shell' ? 'bg-tokens-brand-DEFAULT text-tokens-brand-contrast shadow' : 'text-tokens-muted hover:text-tokens-fg'}`}
                                        >
                                            Gesu Shell
                                        </button>
                                        <button
                                            onClick={() => setOutputTarget('workflow')}
                                            className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${outputTarget === 'workflow' ? 'bg-pink-600/90 text-white shadow' : 'text-tokens-muted hover:text-tokens-fg'}`}
                                        >
                                            WorkFlow DB
                                        </button>
                                    </div>
                                    <div className="flex justify-end gap-2 mt-1">
                                        <button onClick={() => handleOpenFolder('shell')} className="text-[10px] text-tokens-brand-DEFAULT hover:underline">Open Shell Folder</button>
                                        <span className="text-tokens-border">|</span>
                                        <button onClick={() => handleOpenFolder('workflow')} className="text-[10px] text-pink-500 hover:underline">Open WF DB Folder</button>
                                    </div>
                                </div>
                                <Button
                                    variant="primary"
                                    size="lg"
                                    fullWidth
                                    onClick={handleQueueDownload}
                                    disabled={!url}
                                    icon="⬇️"
                                    iconPosition="circle"
                                >
                                    Queue Download (Mock)
                                </Button>
                            </div>
                        </Card>
                    )}

                    {/* Converter Form */}
                    {activeTab === 'converter' && (
                        <Card title="Local Converter" className="bg-tokens-panel backdrop-blur-sm shadow-lg">
                            <div className="flex flex-col gap-5">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium text-tokens-muted">Source File</label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={convertFilePath}
                                            readOnly
                                            placeholder="No file selected..."
                                            className="flex-1 font-mono opacity-70 cursor-not-allowed"
                                        />
                                        <Button
                                            variant="secondary"
                                            onClick={handleBrowseFile}
                                        >
                                            Browse...
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Mode Toggle */}
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium text-tokens-muted">Mode</label>
                                        <div className="flex bg-tokens-panel2 p-1 rounded-lg border border-tokens-border w-fit">
                                            <button
                                                onClick={() => setConvertMode('simple')}
                                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${convertMode === 'simple' ? 'bg-tokens-panel border border-tokens-border text-tokens-fg shadow-sm' : 'text-tokens-muted hover:text-tokens-fg'}`}
                                            >
                                                Simple
                                            </button>
                                            <button
                                                onClick={() => setConvertMode('advanced')}
                                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${convertMode === 'advanced' ? 'bg-tokens-panel border border-tokens-border text-tokens-fg shadow-sm' : 'text-tokens-muted hover:text-tokens-fg'}`}
                                            >
                                                Advanced
                                            </button>
                                        </div>
                                    </div>

                                    {convertMode === 'simple' ? (
                                        <Select
                                            label="Preset"
                                            value={convertPreset}
                                            onChange={(e) => setConvertPreset(e.target.value as ConvertPreset)}
                                            options={[]} // Using children for optgroups
                                        >
                                            <optgroup label="Audio">
                                                {CONVERT_PRESETS.filter(p => p.category === 'Audio').map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                            </optgroup>
                                            <optgroup label="Video">
                                                {CONVERT_PRESETS.filter(p => p.category === 'Video').map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                            </optgroup>
                                        </Select>
                                    ) : null}
                                </div>

                                {convertMode === 'advanced' && (
                                    <div className="flex flex-wrap gap-4 p-4 bg-tokens-panel2/50 rounded-xl border border-tokens-border">
                                        <div className="flex flex-col gap-2 flex-1 min-w-[140px]">
                                            <Select
                                                label="Resolution"
                                                value={advRes}
                                                onChange={(e) => setAdvRes(e.target.value as AdvancedVideoResolution)}
                                                options={[
                                                    { value: "source", label: "Source (No Resize)" },
                                                    { value: "1080p", label: "1080p" },
                                                    { value: "720p", label: "720p" },
                                                    { value: "540p", label: "540p" }
                                                ]}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2 flex-1 min-w-[140px]">
                                            <Select
                                                label="Quality"
                                                value={advQuality}
                                                onChange={(e) => setAdvQuality(e.target.value as AdvancedVideoQuality)}
                                                options={[
                                                    { value: "high", label: "High (CRF 18)" },
                                                    { value: "medium", label: "Medium (CRF 20)" },
                                                    { value: "lite", label: "Lite (CRF 23)" }
                                                ]}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2 flex-1 min-w-[140px]">
                                            <Select
                                                label="Audio"
                                                value={advAudio}
                                                onChange={(e) => setAdvAudio(e.target.value as AdvancedAudioProfile)}
                                                options={[
                                                    { value: "copy", label: "Copy (Passthrough)" },
                                                    { value: "aac-192", label: "AAC 192k" },
                                                    { value: "aac-128", label: "AAC 128k" }
                                                ]}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium text-tokens-muted">Save to</label>
                                    <div className="flex bg-tokens-panel2 p-1 rounded-lg border border-tokens-border">
                                        <button
                                            onClick={() => setOutputTarget('shell')}
                                            className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${outputTarget === 'shell' ? 'bg-tokens-brand-DEFAULT text-tokens-brand-contrast shadow' : 'text-tokens-muted hover:text-tokens-fg'}`}
                                        >
                                            Gesu Shell
                                        </button>
                                        <button
                                            onClick={() => setOutputTarget('workflow')}
                                            className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${outputTarget === 'workflow' ? 'bg-pink-600/90 text-white shadow' : 'text-tokens-muted hover:text-tokens-fg'}`}
                                        >
                                            WorkFlow DB
                                        </button>
                                    </div>
                                </div>

                                <Button
                                    variant="primary"
                                    size="lg"
                                    fullWidth
                                    onClick={handleQueueConvert}
                                    disabled={!convertFilePath}
                                    icon="⚡"
                                    iconPosition="circle"
                                >
                                    Queue Convert Job
                                </Button>
                            </div>
                        </Card>
                    )}

                    {/* History View */}
                    {activeTab === 'history' && (
                        <Card title="Recent Jobs" className="h-full min-h-[500px] flex flex-col" headerAction={
                            <div className="flex gap-2 items-center">
                                <Select
                                    value={historyFilter}
                                    onChange={(e) => setHistoryFilter(e.target.value as any)}
                                    options={[
                                        { value: 'all', label: 'All Types' },
                                        { value: 'download', label: 'Downloads' },
                                        { value: 'convert', label: 'Converts' },
                                        { value: 'advanced', label: 'Advanced' }
                                    ]}
                                    className="!w-32 !py-1 !text-xs"
                                />
                                <button onClick={refreshHistory} className="text-xs text-tokens-brand-DEFAULT hover:text-tokens-brand-hover ml-2">Refresh</button>
                            </div>
                        }>
                            <div className="flex-1 overflow-y-auto scroll-on-hover pr-1 min-h-0">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-tokens-border text-tokens-muted text-xs uppercase tracking-wider">
                                            <th className="p-3">Time</th>
                                            <th className="p-3">Type</th>
                                            <th className="p-3">Status</th>
                                            <th className="p-3">Preset</th>
                                            {!(historyFilter === 'convert' || historyFilter === 'advanced') && <th className="p-3">Network</th>}
                                            <th className="p-3">Target</th>
                                            {!(historyFilter === 'convert' || historyFilter === 'advanced') && <th className="p-3">Details</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-tokens-border">
                                        {historyJobs.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="p-8 text-center text-tokens-muted">
                                                    No history log found.
                                                </td>
                                            </tr>
                                        ) : (
                                            historyJobs
                                                .filter(job => {
                                                    if (historyFilter === 'all') return true;
                                                    const preset = job.preset || '';
                                                    if (historyFilter === 'advanced') {
                                                        return preset === 'video-advanced';
                                                    }
                                                    if (historyFilter === 'convert') {
                                                        return preset.startsWith('audio-') || (preset.startsWith('video-') && preset !== 'video-advanced');
                                                    }
                                                    if (historyFilter === 'download') {
                                                        if (!preset) return true;
                                                        return !(preset.startsWith('audio-') || preset.startsWith('video-'));
                                                    }
                                                    return true;
                                                })
                                                .map((job, idx) => (
                                                    <tr key={`${job.id}-${job.status}-${idx}`} className="hover:bg-tokens-panel2/50 transition-colors">
                                                        <td className="p-3 text-sm text-tokens-muted whitespace-nowrap">
                                                            {new Date(job.timestamp).toLocaleString()}
                                                        </td>
                                                        <td className="p-3">
                                                            {(() => {
                                                                const preset = job.preset || '';
                                                                if (preset === 'video-advanced') {
                                                                    return <Badge variant="brand">ADV</Badge>;
                                                                } else if (preset.startsWith('audio-') || preset.startsWith('video-')) {
                                                                    return <Badge variant="neutral">CV</Badge>;
                                                                } else {
                                                                    return <Badge variant="brand">DL</Badge>;
                                                                }
                                                            })()}
                                                        </td>
                                                        <td className="p-3">
                                                            <Badge variant={job.status === 'success' ? 'success' : job.status === 'failed' ? 'error' : 'neutral'}>
                                                                {job.status}
                                                            </Badge>
                                                        </td>
                                                        <td className="p-3 text-xs text-tokens-fg">{getPresetDisplayName(job.preset)}</td>
                                                        {!(historyFilter === 'convert' || historyFilter === 'advanced') && <td className="p-3 text-xs text-tokens-muted">{job.network}</td>}
                                                        <td className="p-3 text-xs text-tokens-muted">{job.target}</td>
                                                        {!(historyFilter === 'convert' || historyFilter === 'advanced') && (
                                                            <td className="p-3 text-xs font-mono text-tokens-muted truncate max-w-[150px]" title={job.url}>
                                                                {job.url}
                                                            </td>
                                                        )}
                                                    </tr>
                                                ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}
                </div>

                {/* --- RIGHT COLUMN: QUEUE & INFO --- */}
                <div className="flex flex-col gap-6 w-full min-w-0">
                    <Card title="Job Queue" className="flex-1 min-h-[400px] flex flex-col">
                        <div className="flex gap-2 items-center mb-4">
                            <Select
                                value={queueFilter}
                                onChange={(e) => setQueueFilter(e.target.value as any)}
                                options={[
                                    { value: 'all', label: 'All Jobs' },
                                    { value: 'download', label: 'Downloads' },
                                    { value: 'convert', label: 'Converts' }
                                ]}
                                className="!w-32 !py-1 !text-xs"
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto scroll-on-hover pr-2 space-y-3">
                            {jobs.length === 0 ? (
                                <div className="text-center text-tokens-muted py-10 italic border-2 border-dashed border-tokens-border/50 rounded-xl">
                                    Queue is empty.
                                </div>
                            ) : (
                                jobs
                                    .filter(j => queueFilter === 'all' || j.type === queueFilter)
                                    .map(job => (
                                        <div key={job.id} className="bg-tokens-panel2/50 border border-tokens-border rounded-lg p-3 hover:border-tokens-brand-DEFAULT/30 transition-all group">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex flex-col gap-0.5 max-w-[70%]">
                                                    <span className="font-medium text-sm text-tokens-fg truncate" title={job.label}>{job.label}</span>
                                                    <span className="text-[10px] text-tokens-muted font-mono">{job.id} · {job.engine}</span>
                                                </div>
                                                <StatusBadge status={job.status} progress={job.progress} />
                                            </div>

                                            {/* Progress Bar */}
                                            {job.status === 'running' && (
                                                <div className="w-full bg-tokens-border h-1.5 rounded-full overflow-hidden mb-2">
                                                    <div
                                                        className="bg-tokens-brand-DEFAULT h-full transition-all duration-500 ease-out relative overflow-hidden"
                                                        style={{ width: `${job.progress || 0}%` }}
                                                    >
                                                        <div className="absolute inset-0 bg-white/20 animate-[shimmer_1s_infinite] skew-x-12"></div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Details */}
                                            {job.payload && (
                                                <div className="text-[10px] text-tokens-muted grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-tokens-border/50">
                                                    {job.type === 'download' && (
                                                        <>
                                                            <span>Preset: <span className="text-tokens-fg">{job.payload.preset}</span></span>
                                                            <span>Network: <span className="text-tokens-fg">{job.payload.network}</span></span>
                                                        </>
                                                    )}
                                                    {job.type === 'convert' && (
                                                        <>
                                                            <span className="col-span-2">
                                                                {job.payload.preset === 'video-advanced'
                                                                    ? formatAdvancedOptionsSummaryFromPayload(job.payload)
                                                                    : `Preset: ${job.payload.preset}`
                                                                }
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))
                            )}
                        </div>
                    </Card>

                    {/* Info Panel / Tips */}
                    <Card title="Quick Tips" className="bg-tokens-panel/50 border-dashed">
                        <ul className="text-xs text-tokens-muted space-y-2 list-disc pl-4">
                            <li>Use <strong>WorkFlow DB</strong> target to auto-imports into the Gesu Asset Database.</li>
                            <li><strong>Gaspol</strong> network profile uses aria2c for maximum bandwidth (up to 16 connections).</li>
                            <li><strong>Advanced Converter</strong> allows manual control over FFmpeg CRF and Audio Bitrate.</li>
                        </ul>
                    </Card>
                </div>
            </div>
        </PageContainer>
    );
}
