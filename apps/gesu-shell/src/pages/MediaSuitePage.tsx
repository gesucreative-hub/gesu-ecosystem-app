import { useState } from 'react';
import { Link } from 'react-router-dom';


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

const NETWORK_LABELS: Record<NetworkProfile, string> = {
    'hemat': 'hemat · ~1 MB/s',
    'normal': 'normal · ~3 MB/s',
    'gaspol': 'gaspol · ~5 MB/s'
};

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
    const styles = {
        queued: 'bg-gray-700 text-gray-300 border-gray-600',
        running: 'bg-blue-900/50 text-blue-300 border-blue-500/30 animate-pulse',
        success: 'bg-emerald-900/50 text-emerald-300 border-emerald-500/30',
        error: 'bg-red-900/50 text-red-300 border-red-500/30',
        canceled: 'bg-gray-800 text-gray-500 border-gray-700 dashed border'
    };

    const labels = {
        queued: 'Queued',
        running: `Running ${progress ? `(${progress}%)` : ''}`,
        success: 'Done',
        error: 'Failed',
        canceled: 'Canceled'
    };

    return (
        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${styles[status]} whitespace-nowrap`}>
            {labels[status]}
        </span>
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

export function MediaSuitePage() {
    // State
    const [activeTab, setActiveTab] = useState<Tab>('downloader');
    const [jobs, setJobs] = useState<Job[]>([]);
    const [historyJobs, setHistoryJobs] = useState<MediaSuiteJob[]>([]);

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
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20 relative">

            {/* Toast Notification */}
            {toast && (
                <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-xl z-50 flex items-center gap-3 animate-in slide-in-from-right-10 duration-300 ${toast.type === 'success' ? 'bg-emerald-900 border border-emerald-700 text-emerald-100' : 'bg-red-900 border border-red-700 text-red-100'
                    }`}>
                    <span className="text-xl">{toast.type === 'success' ? '✅' : '⚠️'}</span>
                    <span className="font-medium text-sm">{toast.message}</span>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-2">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Gesu Media Suite</h1>
                    <p className="text-gray-400 text-sm mt-1">Universal media downloader & format converter.</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="bg-gray-800 p-1 rounded-lg flex gap-1 border border-gray-700">
                        <button
                            onClick={() => setActiveTab('downloader')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'downloader' ? 'bg-cyan-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'
                                }`}
                        >
                            Downloader
                        </button>
                        <button
                            onClick={() => setActiveTab('converter')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'converter' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'
                                }`}
                        >
                            Converter
                        </button>
                        <button
                            onClick={() => { setActiveTab('history'); refreshHistory(); }}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'
                                }`}
                        >
                            History
                        </button>
                    </div>

                    <Link to="/" className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm border border-gray-700 transition-colors">
                        ← Back
                    </Link>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">

                {/* --- LEFT COLUMN: INPUT FORMS --- */}
                <div className="flex-1 flex flex-col gap-6">

                    {/* Downloader Form */}
                    {activeTab === 'downloader' && (
                        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 p-6 rounded-xl shadow-lg">
                            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-cyan-500 rounded-full"></span>
                                Quick Download
                            </h2>
                            <div className="flex flex-col gap-5">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium text-gray-300">Source URL</label>
                                    <input
                                        type="text"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        placeholder="https://..."
                                        className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium text-gray-300">Preset</label>
                                        <select
                                            value={dlPreset}
                                            onChange={(e) => setDlPreset(e.target.value as DownloadPreset)}
                                            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 appearance-none"
                                        >
                                            {DOWNLOAD_PRESETS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium text-gray-300">Network</label>
                                        <select
                                            value={netProfile}
                                            onChange={(e) => setNetProfile(e.target.value as NetworkProfile)}
                                            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 appearance-none"
                                        >
                                            {NETWORK_PROFILES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium text-gray-300">Save to</label>
                                    <div className="flex bg-gray-800 p-1 rounded-lg border border-gray-700">
                                        <button
                                            onClick={() => setOutputTarget('shell')}
                                            className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${outputTarget === 'shell' ? 'bg-cyan-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
                                        >
                                            Gesu Shell
                                        </button>
                                        <button
                                            onClick={() => setOutputTarget('workflow')}
                                            className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${outputTarget === 'workflow' ? 'bg-pink-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
                                        >
                                            WorkFlow DB
                                        </button>
                                    </div>
                                    <div className="flex justify-end gap-2 mt-1">
                                        <button onClick={() => handleOpenFolder('shell')} className="text-[10px] text-cyan-500 hover:text-cyan-400 hover:underline">Open Shell Folder</button>
                                        <span className="text-gray-700">|</span>
                                        <button onClick={() => handleOpenFolder('workflow')} className="text-[10px] text-pink-500 hover:text-pink-400 hover:underline">Open WF DB Folder</button>
                                    </div>
                                </div>
                                <button
                                    onClick={handleQueueDownload}
                                    disabled={!url}
                                    className="mt-2 w-full py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold shadow-lg shadow-cyan-900/40 transition-all active:scale-[0.98]"
                                >
                                    Queue Download (Mock)
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Converter Form */}
                    {activeTab === 'converter' && (
                        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 p-6 rounded-xl shadow-lg">
                            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-purple-500 rounded-full"></span>
                                Local Converter
                            </h2>
                            <div className="flex flex-col gap-5">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium text-gray-300">Source File</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={convertFilePath}
                                            readOnly
                                            placeholder="No file selected..."
                                            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none font-mono text-sm opacity-70 cursor-not-allowed"
                                        />
                                        <button
                                            onClick={handleBrowseFile}
                                            className="px-4 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg text-sm border border-gray-600 transition-colors"
                                        >
                                            Browse...
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Mode Toggle */}
                                    <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700 w-fit mb-4 h-11 items-center">
                                        <button
                                            onClick={() => setConvertMode('simple')}
                                            className={`h-9 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center ${convertMode === 'simple' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                                        >
                                            Simple
                                        </button>
                                        <button
                                            onClick={() => setConvertMode('advanced')}
                                            className={`h-9 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center ${convertMode === 'advanced' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                                        >
                                            Advanced
                                        </button>
                                    </div>

                                    {convertMode === 'simple' ? (
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-medium text-gray-400">Preset</label>
                                            <select
                                                value={convertPreset}
                                                onChange={(e) => setConvertPreset(e.target.value as ConvertPreset)}
                                                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none"
                                            >
                                                <optgroup label="Audio">
                                                    {CONVERT_PRESETS.filter(p => p.category === 'Audio').map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                                </optgroup>
                                                <optgroup label="Video">
                                                    {CONVERT_PRESETS.filter(p => p.category === 'Video').map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                                </optgroup>
                                            </select>
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap gap-4 p-4 bg-gray-800/30 rounded-xl border border-gray-700/50">
                                            <div className="flex flex-col gap-2 flex-1 min-w-[140px]">
                                                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Resolution</label>
                                                <select
                                                    value={advRes}
                                                    onChange={(e) => setAdvRes(e.target.value as AdvancedVideoResolution)}
                                                    className="bg-gray-800 border border-gray-700 rounded p-2 text-sm text-gray-100"
                                                >
                                                    <option value="source">Source (No Resize)</option>
                                                    <option value="1080p">1080p</option>
                                                    <option value="720p">720p</option>
                                                    <option value="540p">540p</option>
                                                </select>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Quality</label>
                                                <select
                                                    value={advQuality}
                                                    onChange={(e) => setAdvQuality(e.target.value as AdvancedVideoQuality)}
                                                    className="bg-gray-800 border border-gray-700 rounded p-2 text-sm text-gray-100"
                                                >
                                                    <option value="high">High (CRF 18)</option>
                                                    <option value="medium">Medium (CRF 20)</option>
                                                    <option value="lite">Lite (CRF 23)</option>
                                                </select>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Audio</label>
                                                <select
                                                    value={advAudio}
                                                    onChange={(e) => setAdvAudio(e.target.value as AdvancedAudioProfile)}
                                                    className="bg-gray-800 border border-gray-700 rounded p-2 text-sm text-gray-100"
                                                >
                                                    <option value="copy">Copy (Passthrough)</option>
                                                    <option value="aac-192">AAC 192k</option>
                                                    <option value="aac-128">AAC 128k</option>
                                                </select>
                                            </div>
                                            {/* Summary line */}
                                            <div className="w-full mt-2 text-xs text-gray-400">
                                                Summary: <span className="text-gray-300">{advRes} · {advQuality === 'high' ? 'High' : advQuality === 'medium' ? 'Medium' : 'Lite'} · {advAudio === 'copy' ? 'Copy' : advAudio === 'aac-192' ? 'AAC 192k' : 'AAC 128k'}</span>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium text-gray-300">Save to</label>
                                        <div className="flex bg-gray-800 p-1 rounded-lg border border-gray-700">
                                            <button
                                                onClick={() => setOutputTarget('shell')}
                                                className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${outputTarget === 'shell' ? 'bg-cyan-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
                                            >
                                                Gesu Shell
                                            </button>
                                            <button
                                                onClick={() => setOutputTarget('workflow')}
                                                className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${outputTarget === 'workflow' ? 'bg-pink-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
                                            >
                                                WorkFlow DB
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={handleQueueConvert}
                                    disabled={!convertFilePath}
                                    className="mt-2 w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold shadow-lg shadow-purple-900/40 transition-all active:scale-[0.98]"
                                >
                                    Queue Convert Job
                                </button>
                            </div>
                        </div>
                    )}

                    {/* History View */}
                    {activeTab === 'history' && (
                        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 p-6 rounded-xl shadow-lg">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <span className="w-1.5 h-6 bg-orange-500 rounded-full"></span>
                                    Recent Jobs
                                </h2>
                                <button onClick={refreshHistory} className="text-xs text-cyan-400 hover:text-cyan-300">Refresh</button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-700 text-gray-400 text-xs uppercase tracking-wider">
                                            <th className="p-3">Time</th>
                                            <th className="p-3">Type</th>
                                            <th className="p-3">Status</th>
                                            <th className="p-3">Preset</th>
                                            <th className="p-3">Network</th>
                                            <th className="p-3">Target</th>
                                            <th className="p-3">Details</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {historyJobs.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="p-8 text-center text-gray-500">
                                                    No history log found.
                                                </td>
                                            </tr>
                                        ) : (
                                            historyJobs.map((job, idx) => (
                                                <tr key={`${job.id}-${job.status}-${idx}`} className="hover:bg-gray-800/30 transition-colors">
                                                    <td className="p-3 text-sm text-gray-300 whitespace-nowrap">
                                                        {new Date(job.timestamp).toLocaleString()}
                                                    </td>
                                                    <td className="p-3">
                                                        {/* TYPE badge: DL / CV / ADV */}
                                                        {(() => {
                                                            const preset = job.preset || '';
                                                            if (preset === 'video-advanced') {
                                                                return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border bg-fuchsia-900/30 text-fuchsia-400 border-fuchsia-800">ADV</span>;
                                                            } else if (preset.startsWith('audio-') || preset.startsWith('video-')) {
                                                                return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border bg-purple-900/30 text-purple-400 border-purple-800">CV</span>;
                                                            } else {
                                                                return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border bg-cyan-900/30 text-cyan-400 border-cyan-800">DL</span>;
                                                            }
                                                        })()}
                                                    </td>
                                                    <td className="p-3">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${job.status === 'success' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' :
                                                            job.status === 'failed' ? 'bg-red-900/30 text-red-400 border-red-800' :
                                                                'bg-blue-900/30 text-blue-400 border-blue-800'
                                                            }`}>
                                                            {job.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-sm text-gray-300">
                                                        {PRESET_DISPLAY_NAMES[job.preset] || job.preset}
                                                    </td>
                                                    <td className="p-3 text-sm text-gray-300">
                                                        {job.network ? (
                                                            NETWORK_LABELS[job.network as NetworkProfile] || job.network
                                                        ) : (
                                                            <span className="text-gray-600">-</span>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-sm text-gray-300">
                                                        <span className={`px-1.5 py-0.5 rounded text-[10px] border ${job.target === 'workflow' ? 'bg-pink-900/30 text-pink-300 border-pink-800' : 'bg-gray-700 text-gray-400 border-gray-600'}`}>
                                                            {job.target === 'workflow' ? 'WF DB' : 'Shell'}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-xs text-gray-500 max-w-[200px] truncate" title={job.errorMessage || job.url || job.details}>
                                                        {/* Untuk advanced, backend sudah mengisi job.details.
                                                           Untuk job lain, pakai errorMessage atau url. */}
                                                        {job.details || job.errorMessage || job.url}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                </div>

                {/* --- RIGHT COLUMN: JOB QUEUE --- */}
                <div className="lg:w-[28rem] xl:w-[32rem] bg-gray-900/50 backdrop-blur-sm border border-gray-800 p-6 rounded-xl shadow-lg h-fit min-h-[500px] flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-orange-500 rounded-full"></span>
                            Job Queue · <span className="text-gray-400 font-normal">All Jobs</span>
                        </h2>
                        <div className="flex items-center gap-3">
                            {/* Future filter chips can go here */}
                            <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-400 border border-gray-700">
                                {jobs.length} jobs
                            </span>
                            <button onClick={refreshJobs} className="text-xs text-cyan-400 hover:text-cyan-300">Refresh</button>
                        </div>
                    </div>

                    {jobs.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500 border-2 border-dashed border-gray-800 rounded-xl p-8">
                            <div className="w-12 h-12 bg-gray-800 rounded-full mb-3 flex items-center justify-center text-xl">💤</div>
                            <p className="font-medium text-gray-400">No jobs queued</p>
                            <p className="text-sm mt-1">Start a download or conversion to see it here.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                            {jobs.map(job => (
                                <div key={job.id} className="bg-gray-800/40 border border-gray-700/50 rounded-lg p-4 hover:border-gray-600 transition-colors group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${job.type === 'download' ? 'bg-cyan-900/30 text-cyan-400 border-cyan-800' : 'bg-purple-900/30 text-purple-400 border-purple-800'
                                                }`}>
                                                {job.type.slice(0, 4)}
                                            </span>
                                            <span className="text-xs text-gray-500 font-mono">#{job.id}</span>
                                        </div>
                                        <StatusBadge status={job.status} progress={job.progress} />
                                    </div>

                                    <div className="font-medium text-sm text-gray-200 mb-1 line-clamp-1" title={job.label}>
                                        {job.label}
                                    </div>

                                    <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
                                        <div className="flex flex-col gap-1">
                                            <span className="flex items-center gap-1">
                                                ⚙️ {job.engine}
                                            </span>
                                            {job.type === 'download' && (
                                                <div className="flex flex-col">
                                                    <span className="text-gray-400 font-semibold mb-0.5">
                                                        Download · {(job.payload as any).preset}
                                                    </span>
                                                    <span className="text-gray-600 text-[10px]">
                                                        {NETWORK_LABELS[(job.payload as any).network as NetworkProfile] || (job.payload as any).network}
                                                    </span>
                                                </div>
                                            )}
                                            {job.type === 'convert' && (
                                                <div className="flex flex-col">
                                                    {(job.payload as any).preset === 'video-advanced' ? (
                                                        <span className="text-gray-400 font-semibold mb-0.5">
                                                            Advanced · {formatAdvancedOptionsSummaryFromPayload(job.payload)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 font-semibold mb-0.5">
                                                            Preset · {getPresetDisplayName((job.payload as any).preset as string)}
                                                        </span>
                                                    )}
                                                    <span className="text-gray-600 text-[10px] break-all">
                                                        {(job.payload as any).outputPath
                                                            ? `Done: ${(job.payload as any).outputPath.split(/[/\\]/).pop()}`
                                                            : `${(job.payload as any).inputPath?.split(/[/\\]/).pop()} ➔ .${(job.payload as any).target || 'mp4'}`
                                                        }
                                                    </span>
                                                </div>
                                            )}
                                            {job.errorMessage && (
                                                <span className="text-red-400 font-mono text-[10px]">
                                                    Error: {job.errorMessage}
                                                </span>
                                            )}
                                        </div>
                                        <span>
                                            {new Date(job.createdAt).toLocaleTimeString()}
                                        </span>
                                    </div>

                                    {/* Actions Row (Read Only for now) */}
                                    <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-700/50">
                                        <div className="text-xs text-gray-500 italic">Processing managed by backend...</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}