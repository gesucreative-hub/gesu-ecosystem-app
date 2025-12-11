import { useState } from 'react';
import { Link } from 'react-router-dom';

// --- Types & Interfaces ---

type Tab = 'downloader' | 'converter';

type JobType = 'download' | 'convert';
type JobStatus = 'queued' | 'running' | 'success' | 'error' | 'canceled';
type JobEngine = 'yt-dlp' | 'ffmpeg' | 'image-magick' | 'libreoffice' | 'combo';

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

const DOWNLOAD_PRESETS = [
    'Music MP3', 'Best Audio', 'Video 720p', 'Video 1080p', 'Best Video'
];

const NETWORK_PROFILES = [
    'Hemat (Low Bandwidth)', 'Normal', 'Gaspol (Max Speed)'
];

const CONVERT_CATEGORIES = ['Audio', 'Video', 'Image', 'Document'];

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

export function MediaSuitePage() {
    // State
    const [activeTab, setActiveTab] = useState<Tab>('downloader');
    const [jobs, setJobs] = useState<Job[]>([]);

    // Downloader Form State
    const [url, setUrl] = useState('');
    const [dlPreset, setDlPreset] = useState(DOWNLOAD_PRESETS[0]);
    const [netProfile, setNetProfile] = useState(NETWORK_PROFILES[1]);

    // Converter Form State
    const [filePath, setFilePath] = useState('');
    const [category, setCategory] = useState(CONVERT_CATEGORIES[1]);
    const [convPreset, setConvPreset] = useState('Proxy 720p');

    // Job Helpers
    const createJob = (type: JobType, label: string, engine: JobEngine, payload: Record<string, unknown>): Job => ({
        id: crypto.randomUUID().slice(0, 8),
        type,
        label,
        engine,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'queued',
        payload
    });

    const updateJobStatus = (id: string, status: JobStatus, updates: Partial<Job> = {}) => {
        setJobs(prev => prev.map(job => {
            if (job.id === id) {
                const updatedJob = { ...job, status, ...updates, updatedAt: new Date().toISOString() };
                console.log('[MediaSuiteJobUpdate]', updatedJob);
                return updatedJob;
            }
            return job;
        }));
    };

    const removeJob = (id: string) => {
        setJobs(prev => prev.filter(j => j.id !== id));
    };

    // User Actions
    const handleQueueDownload = () => {
        if (!url) return;

        const payload = { url, preset: dlPreset, networkProfile: netProfile };
        const newJob = createJob('download', `DL: ${url.slice(0, 30)}...`, 'yt-dlp', payload);

        setJobs(prev => [newJob, ...prev]);
        console.log('[MediaSuiteJobQueued]', newJob);

        setUrl(''); // Reset input
        alert(`Download queued: ${newJob.id}`);
    };

    const handleConvert = () => {
        if (!filePath) return;

        let engine: JobEngine = 'ffmpeg';
        if (category === 'Image') engine = 'image-magick';
        if (category === 'Document') engine = 'libreoffice';

        const payload = { filePath, category, preset: convPreset };
        const newJob = createJob('convert', `Conv: ${filePath.split('\\').pop()}`, engine, payload);

        setJobs(prev => [newJob, ...prev]);
        console.log('[MediaSuiteJobQueued]', newJob);

        alert(`Conversion queued: ${newJob.id}`);
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">

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
                                            onChange={(e) => setDlPreset(e.target.value)}
                                            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 appearance-none"
                                        >
                                            {DOWNLOAD_PRESETS.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium text-gray-300">Network</label>
                                        <select
                                            value={netProfile}
                                            onChange={(e) => setNetProfile(e.target.value)}
                                            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 appearance-none"
                                        >
                                            {NETWORK_PROFILES.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
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
                                    <label className="text-sm font-medium text-gray-300">File Path</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={filePath}
                                            onChange={(e) => setFilePath(e.target.value)}
                                            placeholder="D:\Media\file.mkv"
                                            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 font-mono text-sm"
                                        />
                                        <button className="px-4 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg text-sm border border-gray-600">Browse...</button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium text-gray-300">Category</label>
                                        <select
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none"
                                        >
                                            {CONVERT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium text-gray-300">Preset</label>
                                        <select
                                            value={convPreset}
                                            onChange={(e) => setConvPreset(e.target.value)}
                                            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none"
                                        >
                                            <option>Proxy 720p</option>
                                            <option>Distribution 1080p</option>
                                            <option>Audio Only (MP3)</option>
                                        </select>
                                    </div>
                                </div>
                                <button
                                    onClick={handleConvert}
                                    disabled={!filePath}
                                    className="mt-2 w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold shadow-lg shadow-purple-900/40 transition-all active:scale-[0.98]"
                                >
                                    Convert (Mock)
                                </button>
                            </div>
                        </div>
                    )}

                </div>

                {/* --- RIGHT COLUMN: JOB QUEUE --- */}
                <div className="lg:w-[28rem] xl:w-[32rem] bg-gray-900/50 backdrop-blur-sm border border-gray-800 p-6 rounded-xl shadow-lg h-fit min-h-[500px] flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-orange-500 rounded-full"></span>
                            Job Queue
                        </h2>
                        <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-400 border border-gray-700">
                            {jobs.length} jobs
                        </span>
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
                                        <span className="flex items-center gap-1">
                                            ⚙️ {job.engine}
                                        </span>
                                        <span>
                                            {new Date(job.createdAt).toLocaleTimeString()}
                                        </span>
                                    </div>

                                    {/* Actions Row */}
                                    <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-700/50">
                                        <button onClick={() => updateJobStatus(job.id, 'running', { progress: 0 })} className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 px-2 py-1 rounded transition-colors">Run</button>
                                        {(job.status === 'running') && (
                                            <button onClick={() => updateJobStatus(job.id, 'running', { progress: (job.progress || 0) + 25 })} className="text-xs bg-blue-900/50 hover:bg-blue-800/50 text-blue-300 border border-blue-800 px-2 py-1 rounded transition-colors">+25%</button>
                                        )}
                                        <button onClick={() => updateJobStatus(job.id, 'success', { progress: 100 })} className="text-xs bg-emerald-900/30 hover:bg-emerald-800/30 text-emerald-400 border border-emerald-800/50 px-2 py-1 rounded transition-colors">Success</button>
                                        <button onClick={() => updateJobStatus(job.id, 'error', { errorMessage: 'Mock Error' })} className="text-xs bg-red-900/30 hover:bg-red-800/30 text-red-400 border border-red-800/50 px-2 py-1 rounded transition-colors">Fail</button>
                                        <div className="ml-auto">
                                            <button onClick={() => removeJob(job.id)} className="text-xs text-gray-500 hover:text-red-400 px-1 py-1 transition-colors">Remove</button>
                                        </div>
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
