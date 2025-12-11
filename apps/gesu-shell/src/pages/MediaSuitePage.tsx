import { useState } from 'react';
import { Link } from 'react-router-dom';

// --- Types & Interfaces ---

type Tab = 'downloader' | 'converter';

interface DownloadQueueItem {
    id: string;
    title: string;
    preset: string;
    status: 'queued' | 'downloading' | 'done';
    progress: number;
}

interface ToolStatus {
    name: string;
    version: string;
    status: 'ok' | 'missing' | 'unknown';
}

// --- Constants ---

const MOCK_QUEUE: DownloadQueueItem[] = [
    { id: '1', title: 'Lofi Hip Hop Radio - Beats to Relax/Study to', preset: 'Music MP3', status: 'downloading', progress: 45 },
    { id: '2', title: 'React 19 Configuration Tutorial', preset: 'Video 1080p', status: 'queued', progress: 0 },
    { id: '3', title: 'Project Assets Archive', preset: 'Best Video', status: 'done', progress: 100 },
];

const DOWNLOAD_PRESETS = [
    'Music MP3', 'Best Audio', 'Video 720p', 'Video 1080p', 'Best Video'
];

const NETWORK_PROFILES = [
    'Hemat (Low Bandwidth)', 'Normal', 'Gaspol (Max Speed)'
];

const CONVERT_CATEGORIES = ['Audio', 'Video', 'Image', 'Document'];

// --- Helper Components ---

const StatusBadge = ({ status }: { status: DownloadQueueItem['status'] }) => {
    const styles = {
        queued: 'bg-gray-700 text-gray-300',
        downloading: 'bg-blue-900/50 text-blue-300 animate-pulse',
        done: 'bg-emerald-900/50 text-emerald-300'
    };

    const labels = {
        queued: 'Queued',
        downloading: 'Downloading...',
        done: 'Done'
    };

    return (
        <span className={`px-2 py-0.5 rounded text-xs font-medium border border-white/5 ${styles[status]}`}>
            {labels[status]}
        </span>
    );
};

export function MediaSuitePage() {
    // State
    const [activeTab, setActiveTab] = useState<Tab>('downloader');

    // Downloader Form State
    const [url, setUrl] = useState('');
    const [dlPreset, setDlPreset] = useState(DOWNLOAD_PRESETS[0]);
    const [netProfile, setNetProfile] = useState(NETWORK_PROFILES[1]);

    // Converter Form State
    const [filePath, setFilePath] = useState('');
    const [category, setCategory] = useState(CONVERT_CATEGORIES[1]);
    const [convPreset, setConvPreset] = useState('Proxy 720p');

    // Actions
    const handleQueueDownload = () => {
        const snapshot = {
            mode: 'downloader',
            timestamp: new Date().toISOString(),
            url,
            preset: dlPreset,
            networkProfile: netProfile
        };
        console.log("Download Queued (Mock):", snapshot);
        alert(`Download queued for: ${url || 'Unknown URL'}`);
        setUrl(''); // Reset input
    };

    const handleConvert = () => {
        const snapshot = {
            mode: 'converter',
            timestamp: new Date().toISOString(),
            filePath,
            category,
            preset: convPreset
        };
        console.log("Conversion Started (Mock):", snapshot);
        alert(`Conversion started for: ${filePath || 'Unknown File'}`);
    };

    const handleToolsCheck = () => {
        console.log("Tools Check (Mock):", { action: 'tools_check' });
        alert("Running external tools check... (Check console)");
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-2">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Gesu Media Suite</h1>
                    <p className="text-gray-400 text-sm mt-1">Universal media downloader & format converter.</p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Tab Switcher */}
                    <div className="bg-gray-800 p-1 rounded-lg flex gap-1 border border-gray-700">
                        <button
                            onClick={() => setActiveTab('downloader')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'downloader'
                                    ? 'bg-cyan-600 text-white shadow-lg'
                                    : 'text-gray-400 hover:text-gray-200'
                                }`}
                        >
                            Downloader
                        </button>
                        <button
                            onClick={() => setActiveTab('converter')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'converter'
                                    ? 'bg-purple-600 text-white shadow-lg'
                                    : 'text-gray-400 hover:text-gray-200'
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

            {/* DOWNLOADER TAB CONTENT */}
            {activeTab === 'downloader' && (
                <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in slide-in-from-right-4 duration-300">

                    {/* Left: Quick Download Form */}
                    <div className="flex-1 bg-gray-900/50 backdrop-blur-sm border border-gray-800 p-6 rounded-xl shadow-lg h-fit">
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
                                    placeholder="https://youtube.com/watch?v=..."
                                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                                    autoFocus
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
                                    <label className="text-sm font-medium text-gray-300">Network Profile</label>
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
                                className="mt-4 w-full py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold shadow-lg shadow-cyan-900/40 transition-all active:scale-[0.98]"
                            >
                                Queue Download (Mock)
                            </button>
                        </div>
                    </div>

                    {/* Right: Queue Preview */}
                    <div className="lg:w-96 bg-gray-900/50 backdrop-blur-sm border border-gray-800 p-6 rounded-xl shadow-lg h-fit">
                        <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
                            Queue Preview
                        </h2>

                        <div className="flex flex-col gap-3">
                            {MOCK_QUEUE.map(item => (
                                <div key={item.id} className="bg-gray-800/40 border border-gray-700/50 rounded-lg p-3 hover:bg-gray-800/60 transition-colors">
                                    <div className="flex justify-between items-start mb-1 gap-2">
                                        <div className="font-medium text-sm text-gray-200 line-clamp-2 leading-relaxed">{item.title}</div>
                                        <StatusBadge status={item.status} />
                                    </div>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-xs text-gray-500 font-mono">{item.preset}</span>
                                        {item.status === 'downloading' && (
                                            <span className="text-xs text-blue-400">{item.progress}%</span>
                                        )}
                                    </div>
                                    {item.status === 'downloading' && (
                                        <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500" style={{ width: `${item.progress}%` }}></div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            <div className="text-center mt-2">
                                <button className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                                    View Full Queue →
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CONVERTER TAB CONTENT */}
            {activeTab === 'converter' && (
                <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in slide-in-from-right-4 duration-300">

                    {/* Left: Local Converter Form */}
                    <div className="flex-1 bg-gray-900/50 backdrop-blur-sm border border-gray-800 p-6 rounded-xl shadow-lg h-fit">
                        <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-purple-500 rounded-full"></span>
                            Local Converter
                        </h2>

                        <div className="flex flex-col gap-5">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-300">Source File Path</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={filePath}
                                        onChange={(e) => setFilePath(e.target.value)}
                                        placeholder="D:\Downloads\video.mkv"
                                        className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 font-mono text-sm"
                                    />
                                    <button className="px-4 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg text-sm transition-colors border border-gray-600">
                                        Browse...
                                    </button>
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
                                    <label className="text-sm font-medium text-gray-300">Target Preset</label>
                                    <select
                                        value={convPreset}
                                        onChange={(e) => setConvPreset(e.target.value)}
                                        className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none"
                                    >
                                        <option>Proxy 720p</option>
                                        <option>Distribution 1080p</option>
                                        <option>Audio Only (MP3)</option>
                                        <option>GIF</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                onClick={handleConvert}
                                disabled={!filePath}
                                className="mt-4 w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold shadow-lg shadow-purple-900/40 transition-all active:scale-[0.98]"
                            >
                                Start Conversion (Mock)
                            </button>
                        </div>
                    </div>

                    {/* Right: Tools Status */}
                    <div className="lg:w-80 bg-gray-900/50 backdrop-blur-sm border border-gray-800 p-6 rounded-xl shadow-lg h-fit">
                        <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-orange-500 rounded-full"></span>
                            Tools Status (Mock)
                        </h2>

                        <div className="flex flex-col gap-4">
                            {[
                                { name: 'yt-dlp', ver: '2023.11.16', status: 'ok' },
                                { name: 'ffmpeg', ver: '6.0-essentials', status: 'ok' },
                                { name: 'soffice', ver: 'Unknown', status: 'unknown' },
                            ].map((tool) => (
                                <div key={tool.name} className="flex justify-between items-center py-2 border-b border-gray-800 last:border-0">
                                    <div>
                                        <div className="font-mono text-sm text-gray-200">{tool.name}</div>
                                        <div className="text-xs text-gray-500">{tool.ver}</div>
                                    </div>
                                    <span className={`w-2 h-2 rounded-full ${tool.status === 'ok' ? 'bg-emerald-500' : 'bg-yellow-500'}`}></span>
                                </div>
                            ))}

                            <button
                                onClick={handleToolsCheck}
                                className="mt-4 w-full py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
                            >
                                Run Tools Check
                            </button>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}
