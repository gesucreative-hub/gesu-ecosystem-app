import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGesuSettings } from '../lib/gesuSettings';
import { PageContainer } from '../components/PageContainer';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { SelectDropdown } from '../components/Dropdown';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Tabs } from '../components/Tabs';
import { ToggleSwitch } from '../components/ToggleSwitch';
import { Download, Zap, History as HistoryIcon, Link as LinkIcon, RefreshCcw, X, FolderOpen } from 'lucide-react';


// --- Types & Interfaces ---

type Tab = 'downloader' | 'converter' | 'history';

type JobType = 'download' | 'convert';
type JobStatus = 'queued' | 'running' | 'success' | 'error' | 'canceled';
type JobEngine = 'yt-dlp' | 'ffmpeg' | 'image-magick' | 'libreoffice' | 'combo';

type DownloadPreset = 'music-mp3' | 'video-1080p' | 'video-best';
type ConvertPreset = 'audio-mp3-320' | 'audio-mp3-192' | 'audio-wav-48k' | 'audio-aac-256' | 'video-mp4-1080p' | 'video-mp4-720p' | 'video-mp4-540p-lite' | 'image-png' | 'image-jpg-90' | 'image-webp' | 'image-ico-256';
type ConvertCategory = 'Video' | 'Audio' | 'Image';
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



const CONVERT_PRESETS: { value: ConvertPreset; label: string; category: ConvertCategory }[] = [
    { value: 'audio-mp3-320', label: 'Audio MP3 – 320 kbps', category: 'Audio' },
    { value: 'audio-mp3-192', label: 'Audio MP3 – 192 kbps', category: 'Audio' },
    { value: 'audio-aac-256', label: 'Audio AAC – 256 kbps', category: 'Audio' },
    { value: 'audio-wav-48k', label: 'Audio WAV – 48 kHz', category: 'Audio' },
    { value: 'video-mp4-1080p', label: 'Video MP4 – 1080p (HQ)', category: 'Video' },
    { value: 'video-mp4-720p', label: 'Video MP4 – 720p', category: 'Video' },
    { value: 'video-mp4-540p-lite', label: 'Video MP4 – 540p (Lite)', category: 'Video' },
    { value: 'image-png', label: 'Image PNG', category: 'Image' },
    { value: 'image-jpg-90', label: 'Image JPG (90%)', category: 'Image' },
    { value: 'image-webp', label: 'Image WebP', category: 'Image' },
    { value: 'image-ico-256', label: 'Icon ICO (256px)', category: 'Image' }
];

// Extension arrays for category detection (from PowerShell reference)
const EXT_VIDEO = ['.mp4', '.mov', '.mkv', '.avi', '.webm', '.m4v', '.wmv', '.flv'];
const EXT_AUDIO = ['.mp3', '.m4a', '.aac', '.wav', '.flac', '.ogg', '.oga', '.wma'];
const EXT_IMAGE = ['.png', '.jpg', '.jpeg', '.bmp', '.tif', '.tiff', '.gif', '.webp', '.heic', '.ico'];

// Detect category from file path
function detectCategoryFromPath(filePath: string): ConvertCategory {
    const ext = filePath.toLowerCase().split('.').pop();
    if (!ext) return 'Video';
    const dotExt = `.${ext}`;
    if (EXT_AUDIO.includes(dotExt)) return 'Audio';
    if (EXT_IMAGE.includes(dotExt)) return 'Image';
    return 'Video';
}

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
    "image-png": "Image PNG",
    "image-jpg-90": "Image JPG (90%)",
    "image-webp": "Image WebP",
    "image-ico-256": "Icon ICO (256px)",
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

    // Subscribe to real-time IPC events for live progress updates
    useEffect(() => {
        if (!window.gesu?.mediaJobs) return;

        // Progress updates - update job progress in real-time
        const unsubProgress = window.gesu.mediaJobs.onProgress?.((data: { jobId: string; progress: number | null }) => {
            setJobs(prev => prev.map(job =>
                job.id === data.jobId ? { ...job, progress: data.progress ?? job.progress } : job
            ));
        });

        // Complete events - refresh the full job list
        const unsubComplete = window.gesu.mediaJobs.onComplete?.(() => {
            refreshJobs();
            refreshHistory();
        });

        // Update events - update specific job
        const unsubUpdate = window.gesu.mediaJobs.onUpdate?.((updatedJob: any) => {
            setJobs(prev => prev.map(job =>
                job.id === updatedJob.id ? {
                    ...job,
                    status: updatedJob.status,
                    progress: updatedJob.progress,
                    errorMessage: updatedJob.errorMessage,
                } : job
            ));
        });

        return () => {
            unsubProgress?.();
            unsubComplete?.();
            unsubUpdate?.();
        };
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
    const [outputTarget] = useState<MediaOutputTarget>('shell');
    const [outputFolder, setOutputFolder] = useState<string>(() => {
        // Load from localStorage on mount
        return localStorage.getItem('mediaSuite.outputFolder') || './downloads';
    });

    // Persist output folder to localStorage
    useEffect(() => {
        if (outputFolder) {
            localStorage.setItem('mediaSuite.outputFolder', outputFolder);
        }
    }, [outputFolder]);

    // YouTube yt-dlp Settings State
    const [ytDlpSettings, setYtDlpSettings] = useState(() => {
        const stored = localStorage.getItem('mediaSuite.ytDlpSettings');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch {
                // Fallback to defaults if parse error
            }
        }
        return {
            cookiesMode: 'none',
            cookiesBrowser: 'chrome',
            cookiesFilePath: '',
            throttling: {
                enabled: false,
                sleepInterval: 0,
                maxSleepInterval: 5,
                limitRate: ''
            }
        };
    });

    // Persist ytDlpSettings to localStorage
    useEffect(() => {
        localStorage.setItem('mediaSuite.ytDlpSettings', JSON.stringify(ytDlpSettings));
    }, [ytDlpSettings]);

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
    const [convertCategory, setConvertCategory] = useState<ConvertCategory>('Video');

    // Advanced Options State
    const [advRes, setAdvRes] = useState<AdvancedVideoResolution>('1080p');
    const [advQuality, setAdvQuality] = useState<AdvancedVideoQuality>('medium');
    const [advAudio, setAdvAudio] = useState<AdvancedAudioProfile>('aac-192');

    // Job Actions via IPC - Use NEW mediaJobs API for real execution
    const refreshJobs = async () => {
        if (!window.gesu?.mediaJobs) {
            // Fall back to legacy mock if new API not available
            return;
        }
        try {
            const data = await window.gesu.mediaJobs.list();
            // Map to local Job format
            const mappedJobs: Job[] = data.queue.map((j: any) => ({
                id: j.id,
                type: j.kind as JobType,
                label: `${j.engine}: ${j.input.substring(0, 30)}...`,
                engine: j.engine as JobEngine,
                createdAt: j.createdAt,
                updatedAt: j.completedAt || j.startedAt || j.createdAt,
                status: j.status as JobStatus,
                payload: j.options || {},
                errorMessage: j.errorMessage,
                progress: j.progress
            }));
            setJobs(mappedJobs);
        } catch (err) {
            console.error('Failed to fetch jobs:', err);
        }
    };

    const refreshHistory = async () => {
        // Use NEW mediaJobs API which includes history from JSONL
        if (window.gesu?.mediaJobs) {
            try {
                const data = await window.gesu.mediaJobs.list();
                // Map history to MediaSuiteJob format
                const mappedHistory: MediaSuiteJob[] = data.history.map((j: any) => ({
                    id: j.id,
                    type: j.kind as 'download' | 'convert',
                    url: j.kind === 'download' ? j.input : undefined,
                    inputPath: j.kind === 'convert' ? j.input : undefined,
                    preset: j.options?.preset || 'unknown',
                    network: j.options?.network || 'normal',
                    target: j.options?.target || 'shell',
                    outputPath: j.output, // Full output folder path
                    status: j.status === 'error' ? 'failed' : j.status as any,
                    timestamp: j.completedAt || j.createdAt,
                    errorMessage: j.errorMessage,
                }));
                setHistoryJobs(mappedHistory);
            } catch (err) {
                console.error('Failed to fetch history from mediaJobs:', err);
            }
            return;
        }

        // Fallback to legacy API
        if (!window.gesu?.mediaSuite) return;
        try {
            const history = await window.gesu.mediaSuite.getRecentJobs();
            setHistoryJobs(history);
        } catch (err) {
            console.error('Failed to fetch history:', err);
        }
    };

    const enqueueJob = async (type: JobType, label: string, engine: JobEngine, payload: Record<string, unknown>) => {
        // Use NEW mediaJobs API for real execution
        if (window.gesu?.mediaJobs) {
            try {
                // Map to new job format - use the outputFolder from payload
                const jobPayload = {
                    kind: type as 'download' | 'convert',
                    engine: engine === 'image-magick' ? 'imagemagick' : engine,  // Note: libreoffice/soffice de-scoped
                    input: type === 'download' ? String(payload.url) : String(payload.inputPath),
                    output: String(payload.outputFolder || './downloads'),
                    options: {
                        ...payload,
                        toolPath: undefined, // Will use settings
                    },
                };

                await window.gesu.mediaJobs.enqueue(jobPayload);
                refreshJobs();
                refreshHistory();
                showToast(`${type === 'download' ? 'Download' : 'Convert'} job queued`, 'success');
            } catch (err) {
                console.error(err);
                showToast('Failed to enqueue job', 'error');
            }
            return;
        }

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
    };

    // User Actions
    const handleQueueDownload = () => {
        if (!url.trim()) {
            showToast("Please enter a valid URL", 'error');
            return;
        }
        const payload = { url, preset: dlPreset, network: netProfile, target: outputTarget, outputFolder, ytDlpSettings };
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
            if (path) {
                setConvertFilePath(path);
                // Auto-detect category from file extension
                const category = detectCategoryFromPath(path);
                setConvertCategory(category);
                // Set first preset of detected category
                const firstPreset = CONVERT_PRESETS.find(p => p.category === category);
                if (firstPreset) setConvertPreset(firstPreset.value);
            }
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
            target: outputTarget,
            outputFolder
        };

        if (convertMode === 'simple') {
            payload.preset = convertPreset;
            // Use imagemagick for image presets, ffmpeg for audio/video
            const engine = convertPreset.startsWith('image-') ? 'image-magick' : 'ffmpeg';
            enqueueJob('convert', `Conv: ${simpleName}`, engine, payload);
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

    // Cancel a running or queued job
    const handleCancelJob = async (jobId: string) => {
        if (!window.gesu?.mediaJobs?.cancel) {
            showToast("Cancel not available in browser mode", 'error');
            return;
        }
        try {
            await window.gesu.mediaJobs.cancel(jobId);
            refreshJobs();
            showToast("Job canceled", 'success');
        } catch (e) {
            console.error(e);
            showToast("Failed to cancel job", 'error');
        }
    };

    // Cancel all running and queued jobs
    const handleCancelAllJobs = async () => {
        if (!window.gesu?.mediaJobs?.cancelAll) {
            showToast("Cancel All not available in browser mode", 'error');
            return;
        }
        try {
            const count = await window.gesu.mediaJobs.cancelAll();
            refreshJobs();
            refreshHistory();
            showToast(`Canceled ${count} job(s)`, 'success');
        } catch (e) {
            console.error(e);
            showToast("Failed to cancel all jobs", 'error');
        }
    };

    // Browse for output folder
    const handleBrowseOutputFolder = async () => {
        if (!window.gesu?.mediaSuite?.pickOutputFolder) {
            showToast("Folder picker not available in browser mode", 'error');
            return;
        }
        try {
            const folder = await window.gesu.mediaSuite.pickOutputFolder(outputFolder);
            if (folder) {
                setOutputFolder(folder);
            }
        } catch (e) {
            console.error(e);
            showToast("Failed to pick folder", 'error');
        }
    };

    // Open the output folder in file explorer
    const handleOpenOutputFolder = async () => {
        if (!outputFolder) {
            showToast("No output folder set", 'error');
            return;
        }
        if (!window.gesu?.shell?.openPath) {
            showToast("Open folder not available in browser mode", 'error');
            return;
        }
        try {
            await window.gesu.shell.openPath(outputFolder);
        } catch (e) {
            console.error(e);
            showToast("Failed to open folder", 'error');
        }
    };

    // Update yt-dlp
    const [isUpdatingYtDlp, setIsUpdatingYtDlp] = useState(false);
    const handleUpdateYtDlp = async () => {
        if (!window.gesu?.mediaSuite?.updateYtDlp) {
            showToast("Update not available in browser mode", 'error');
            return;
        }
        setIsUpdatingYtDlp(true);
        try {
            const result = await window.gesu.mediaSuite.updateYtDlp();
            if (result.success) {
                showToast(result.message || "yt-dlp updated!", 'success');
                checkTools(); // Refresh version display
            } else {
                showToast(result.error || "Update failed", 'error');
            }
        } catch (e) {
            console.error(e);
            showToast("Failed to update yt-dlp", 'error');
        } finally {
            setIsUpdatingYtDlp(false);
        }
    };

    return (
        <PageContainer density="compact">


            {/* Toast Notification */}
            {toast && (
                <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-xl z-50 flex items-center gap-3 animate-in slide-in-from-right-10 duration-300 ${toast.type === 'success' ? 'bg-emerald-900 border border-emerald-700 text-emerald-100' : 'bg-red-900 border border-red-700 text-red-100'
                    }`}>
                    <span className="text-xl">{toast.type === 'success' ? '✅' : '⚠️'}</span>
                    <span className="font-medium text-sm">{toast.message}</span>
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-tokens-fg tracking-tight">Gesu Media Suite</h1>
                    <p className="text-tokens-muted text-sm mt-1">Universal media downloader & format converter.</p>
                </div>
                <Link to="/" className="px-4 py-2 bg-tokens-panel border border-tokens-border hover:bg-tokens-panel2 text-tokens-fg rounded-lg text-sm transition-colors">
                    ← Back
                </Link>
            </div>

            {/* Tabs + Engine Status Row */}
            <div className="flex justify-between items-center mb-6">
                <Tabs
                    tabs={[
                        { id: 'downloader', label: 'Downloader', icon: <Download size={16} /> },
                        { id: 'converter', label: 'Converter', icon: <Zap size={16} /> },
                        { id: 'history', label: 'Job History', icon: <HistoryIcon size={16} /> }
                    ]}
                    activeTab={activeTab}
                    onChange={(id) => { setActiveTab(id as Tab); if (id === 'history') refreshHistory(); }}
                />

                {/* Engine Status Bar */}
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
                        <RefreshCcw size={12} />
                    </button>
                    <button
                        onClick={handleUpdateYtDlp}
                        disabled={isUpdatingYtDlp}
                        className="px-2 py-0.5 rounded-full bg-tokens-panel2 text-[10px] text-tokens-muted hover:text-emerald-400 hover:bg-tokens-border transition-colors disabled:opacity-50"
                        title="Update yt-dlp to latest version"
                    >
                        {isUpdatingYtDlp ? 'Updating...' : 'Update'}
                    </button>
                    <Link to="/settings" className="px-2 py-0.5 rounded-full bg-tokens-panel2 text-[10px] text-tokens-brand-DEFAULT hover:text-tokens-brand-hover hover:bg-tokens-border transition-colors">
                        Configure
                    </Link>
                </div>
            </div>

            {/* Main Grid: 2/3 Left + 1/3 Right */}
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">

                {/* --- LEFT COLUMN: INPUT FORMS (2/3) --- */}
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
                                    icon={<LinkIcon size={16} />}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <SelectDropdown
                                        label="Preset"
                                        value={dlPreset}
                                        onChange={(value) => setDlPreset(value as DownloadPreset)}
                                        options={DOWNLOAD_PRESETS}
                                    />
                                    <SelectDropdown
                                        label="Network Profile"
                                        value={netProfile}
                                        onChange={(value) => setNetProfile(value as NetworkProfile)}
                                        options={NETWORK_PROFILES}
                                    />
                                </div>

                                {/* Output Folder */}
                                <div className="space-y-2">
                                    <label className="text-sm text-tokens-fg font-medium">Output Folder</label>
                                    <div className="flex gap-2">
                                        <div className="flex-1 min-w-0">
                                            <Input
                                                value={outputFolder}
                                                onChange={(e) => setOutputFolder(e.target.value)}
                                                placeholder="./downloads"
                                                fullWidth
                                                className="font-mono text-sm"
                                            />
                                        </div>
                                        <Button
                                            variant="outline"
                                            onClick={handleBrowseOutputFolder}
                                            title="Browse for folder"
                                        >
                                            <FolderOpen size={16} />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="text-tokens-brand-DEFAULT border-tokens-brand-DEFAULT/30 hover:bg-tokens-brand-DEFAULT/10"
                                            onClick={handleOpenOutputFolder}
                                            title="Open folder in Explorer"
                                        >
                                            Open
                                        </Button>
                                    </div>
                                </div>

                                {/*Authentication */}
                                <div className="space-y-3 pt-4 border-t border-tokens-border">
                                    <label className="text-sm text-tokens-fg font-medium">Authentication</label>
                                    <SelectDropdown
                                        label="Cookies Mode"
                                        value={ytDlpSettings.cookiesMode}
                                        onChange={(value) => setYtDlpSettings((prev: any) => ({ ...prev, cookiesMode: value as any }))}
                                        options={[
                                            { value: 'none', label: 'None' },
                                            { value: 'browser', label: 'Cookies from Browser' },
                                            { value: 'file', label: 'Cookies File' }
                                        ]}
                                    />
                                    {ytDlpSettings.cookiesMode === 'browser' && (
                                        <SelectDropdown
                                            label="Browser"
                                            value={ytDlpSettings.cookiesBrowser}
                                            onChange={(value) => setYtDlpSettings((prev: any) => ({ ...prev, cookiesBrowser: value as any }))}
                                            options={[
                                                { value: 'chrome', label: 'Chrome' },
                                                { value: 'edge', label: 'Edge' }
                                            ]}
                                        />
                                    )}
                                    {ytDlpSettings.cookiesMode === 'file' && (
                                        <div className="space-y-2">
                                            <label className="text-sm text-tokens-muted">Cookies File</label>
                                            <div className="flex gap-2">
                                                <Input
                                                    value={ytDlpSettings.cookiesFilePath}
                                                    readOnly
                                                    placeholder="Select cookies.txt file"
                                                    className="flex-1 font-mono text-xs"
                                                />
                                                <Button
                                                    variant="outline"
                                                    onClick={async () => {
                                                        if (!window.gesu?.dialog?.pickFile) {
                                                            showToast('File picker not supported in browser mode', 'error');
                                                            return;
                                                        }
                                                        try {
                                                            const file = await window.gesu.dialog.pickFile({
                                                                filters: [{ name: 'Text Files', extensions: ['txt'] }]
                                                            });
                                                            if (file) {
                                                                setYtDlpSettings((prev: any) => ({ ...prev, cookiesFilePath: file }));
                                                            }
                                                        } catch (e) {
                                                            console.error(e);
                                                            showToast('Failed to pick file', 'error');
                                                        }
                                                    }}
                                                >
                                                    Browse
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Throttling Toggle */}
                                    <div className="flex items-center gap-2 pt-2">
                                        <input
                                            type="checkbox"
                                            id="throttling-toggle"
                                            checked={ytDlpSettings.throttling.enabled}
                                            onChange={(e) => setYtDlpSettings((prev: any) => ({
                                                ...prev,
                                                throttling: { ...prev.throttling, enabled: e.target.checked }
                                            }))}
                                            className="w-4 h-4 rounded border-tokens-border text-tokens-brand-DEFAULT focus:ring-2 focus:ring-tokens-brand-DEFAULT"
                                        />
                                        <label htmlFor="throttling-toggle" className="text-sm text-tokens-fg cursor-pointer">Enable Safe Throttling</label>
                                    </div>

                                    {/* Throttling Fields */}
                                    {ytDlpSettings.throttling.enabled && (
                                        <div className="grid grid-cols-3 gap-3">
                                            <Input
                                                label="Sleep Min (s)"
                                                type="number"
                                                min="0"
                                                value={ytDlpSettings.throttling.sleepInterval.toString()}
                                                onChange={(e) => setYtDlpSettings((prev: any) => ({
                                                    ...prev,
                                                    throttling: {
                                                        ...prev.throttling,
                                                        sleepInterval: parseInt(e.target.value) || 0
                                                    }
                                                }))}
                                            />
                                            <Input
                                                label="Sleep Max (s)"
                                                type="number"
                                                min="0"
                                                value={ytDlpSettings.throttling.maxSleepInterval.toString()}
                                                onChange={(e) => setYtDlpSettings((prev: any) => ({
                                                    ...prev,
                                                    throttling: {
                                                        ...prev.throttling,
                                                        maxSleepInterval: parseInt(e.target.value) || 0
                                                    }
                                                }))}
                                            />
                                            <Input
                                                label="Limit Rate"
                                                placeholder="e.g. 2M"
                                                value={ytDlpSettings.throttling.limitRate}
                                                onChange={(e) => setYtDlpSettings((prev: any) => ({
                                                    ...prev,
                                                    throttling: {
                                                        ...prev.throttling,
                                                        limitRate: e.target.value
                                                    }
                                                }))}
                                            />
                                        </div>
                                    )}
                                </div>

                                <Button
                                    variant="primary"
                                    size="lg"
                                    fullWidth
                                    onClick={handleQueueDownload}
                                    disabled={!url}
                                    icon={<Download size={16} />}
                                    iconPosition="circle"
                                >
                                    {window.gesu?.mediaJobs ? 'Queue Download' : 'Queue Download (Mock)'}
                                </Button>
                            </div>
                        </Card>
                    )}

                    {/* Converter Form */}
                    {activeTab === 'converter' && (
                        <Card title="Local Converter" className="bg-tokens-panel backdrop-blur-sm shadow-lg overflow-visible min-h-[420px]">
                            <div className="flex flex-col gap-5">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium text-tokens-muted">Source File</label>
                                    <div className="flex gap-2">
                                        <div className="flex-1 min-w-0">
                                            <Input
                                                value={convertFilePath ? convertFilePath.split(/[/\\]/).pop() || '' : ''}
                                                readOnly
                                                fullWidth
                                                placeholder="No file selected..."
                                                className="font-mono opacity-70 cursor-not-allowed"
                                                title={convertFilePath || 'No file selected'}
                                            />
                                        </div>
                                        <Button
                                            variant="outline"
                                            onClick={handleBrowseFile}
                                        >
                                            Browse...
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Mode Toggle - Sliding squircle */}
                                    <ToggleSwitch
                                        label="Mode"
                                        value={convertMode}
                                        onChange={(value) => setConvertMode(value as 'simple' | 'advanced')}
                                        options={[
                                            { id: 'simple', label: 'Simple' },
                                            { id: 'advanced', label: 'Advanced' }
                                        ]}
                                    />

                                    {convertMode === 'simple' ? (
                                        <div className="flex gap-3">
                                            <div className="w-auto">
                                                <SelectDropdown
                                                    label="Category"
                                                    value={convertCategory}
                                                    onChange={(value) => {
                                                        setConvertCategory(value as ConvertCategory);
                                                        // Set first preset of new category
                                                        const firstPreset = CONVERT_PRESETS.find(p => p.category === value);
                                                        if (firstPreset) setConvertPreset(firstPreset.value);
                                                    }}
                                                    options={[
                                                        { value: 'Video', label: 'Video' },
                                                        { value: 'Audio', label: 'Audio' },
                                                        { value: 'Image', label: 'Image' }
                                                    ]}
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <SelectDropdown
                                                    label="Preset"
                                                    value={convertPreset}
                                                    onChange={(value) => setConvertPreset(value as ConvertPreset)}
                                                    options={CONVERT_PRESETS
                                                        .filter(p => p.category === convertCategory)
                                                        .map(p => ({ value: p.value, label: p.label }))}
                                                />
                                            </div>
                                        </div>
                                    ) : null}
                                </div>

                                {convertMode === 'advanced' && (
                                    <div className="flex flex-wrap gap-4 p-4 bg-tokens-panel2/50 rounded-xl border border-tokens-border">
                                        <div className="flex flex-col gap-2 flex-1 min-w-[140px]">
                                            <SelectDropdown
                                                label="Resolution"
                                                value={advRes}
                                                onChange={(value) => setAdvRes(value as AdvancedVideoResolution)}
                                                options={[
                                                    { value: "source", label: "Source (No Resize)" },
                                                    { value: "1080p", label: "1080p" },
                                                    { value: "720p", label: "720p" },
                                                    { value: "540p", label: "540p" }
                                                ]}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2 flex-1 min-w-[140px]">
                                            <SelectDropdown
                                                label="Quality"
                                                value={advQuality}
                                                onChange={(value) => setAdvQuality(value as AdvancedVideoQuality)}
                                                options={[
                                                    { value: "high", label: "High (CRF 18)" },
                                                    { value: "medium", label: "Medium (CRF 20)" },
                                                    { value: "lite", label: "Lite (CRF 23)" }
                                                ]}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2 flex-1 min-w-[140px]">
                                            <SelectDropdown
                                                label="Audio"
                                                value={advAudio}
                                                onChange={(value) => setAdvAudio(value as AdvancedAudioProfile)}
                                                options={[
                                                    { value: "copy", label: "Copy (Passthrough)" },
                                                    { value: "aac-192", label: "AAC 192k" },
                                                    { value: "aac-128", label: "AAC 128k" }
                                                ]}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Output Folder */}
                                <div className="space-y-2">
                                    <label className="text-sm text-tokens-fg font-medium">Output Folder</label>
                                    <div className="flex gap-2">
                                        <div className="flex-1 min-w-0">
                                            <Input
                                                value={outputFolder}
                                                onChange={(e) => setOutputFolder(e.target.value)}
                                                placeholder="./downloads"
                                                fullWidth
                                                className="font-mono text-sm"
                                            />
                                        </div>
                                        <Button
                                            variant="outline"
                                            onClick={handleBrowseOutputFolder}
                                            title="Browse for folder"
                                        >
                                            <FolderOpen size={16} />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="text-tokens-brand-DEFAULT border-tokens-brand-DEFAULT/30 hover:bg-tokens-brand-DEFAULT/10"
                                            onClick={handleOpenOutputFolder}
                                            title="Open folder in Explorer"
                                        >
                                            Open
                                        </Button>
                                    </div>
                                </div>

                                <Button
                                    variant="primary"
                                    size="lg"
                                    fullWidth
                                    onClick={handleQueueConvert}
                                    disabled={!convertFilePath}
                                    icon={<Zap size={16} />}
                                    iconPosition="circle"
                                >
                                    Queue Convert Job
                                </Button>
                            </div>
                        </Card>
                    )}

                    {/* History View */}
                    {activeTab === 'history' && (
                        <Card title="Recent Jobs" className="flex flex-col min-h-[420px]" headerAction={
                            <div className="flex gap-2 items-center">
                                <SelectDropdown
                                    value={historyFilter}
                                    onChange={(value) => setHistoryFilter(value as any)}
                                    options={[
                                        { value: 'all', label: 'All Types' },
                                        { value: 'download', label: 'Downloads' },
                                        { value: 'convert', label: 'Converts' },
                                        { value: 'advanced', label: 'Advanced' }
                                    ]}
                                />
                                <button onClick={refreshHistory} className="text-xs text-tokens-brand-DEFAULT hover:text-tokens-brand-hover ml-2">Refresh</button>
                            </div>
                        }>
                            {/* Scrollable table container with max height */}
                            <div className="max-h-[400px] overflow-y-auto scroll-on-hover">
                                <table className="w-full text-left border-collapse">
                                    {/* Sticky header */}
                                    <thead className="sticky top-0 bg-tokens-panel z-10">
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
                                                <td colSpan={7} className="p-2">
                                                    <div className="flex flex-col items-center justify-center min-h-[280px] border-2 border-dashed border-tokens-border/50 rounded-xl bg-tokens-panel2/10">
                                                        <HistoryIcon size={32} className="text-tokens-muted/30 mb-2" />
                                                        <span className="text-tokens-muted italic text-sm">No entry yet</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            historyJobs
                                                .filter(job => {
                                                    if (historyFilter === 'all') return true;
                                                    // Use job.type for proper filtering
                                                    if (historyFilter === 'advanced') {
                                                        return job.preset === 'video-advanced';
                                                    }
                                                    if (historyFilter === 'convert') {
                                                        // Show convert jobs (excludes advanced)
                                                        return job.type === 'convert' && job.preset !== 'video-advanced';
                                                    }
                                                    if (historyFilter === 'download') {
                                                        return job.type === 'download';
                                                    }
                                                    return true;
                                                })
                                                .map((job, idx) => (
                                                    <tr key={`${job.id}-${job.status}-${idx}`} className="hover:bg-tokens-panel2/50 transition-colors">
                                                        <td className="p-3 text-sm text-tokens-muted whitespace-nowrap">
                                                            {new Date(job.timestamp).toLocaleDateString()}
                                                        </td>
                                                        <td className="p-3">
                                                            {(() => {
                                                                // Use actual job type, not preset prefix
                                                                if (job.type === 'convert') {
                                                                    const preset = job.preset || '';
                                                                    if (preset === 'video-advanced') {
                                                                        return <Badge variant="brand">ADV</Badge>;
                                                                    }
                                                                    return <Badge variant="neutral">CV</Badge>;
                                                                }
                                                                return <Badge variant="brand">DL</Badge>;
                                                            })()}
                                                        </td>
                                                        <td className="p-3">
                                                            <Badge variant={job.status === 'success' ? 'success' : job.status === 'failed' ? 'error' : 'neutral'}>
                                                                {job.status}
                                                            </Badge>
                                                        </td>
                                                        <td className="p-3 text-xs text-tokens-fg">{getPresetDisplayName(job.preset)}</td>
                                                        {!(historyFilter === 'convert' || historyFilter === 'advanced') && <td className="p-3 text-xs text-tokens-muted">{job.network}</td>}
                                                        <td className="p-3">
                                                            {job.outputPath ? (
                                                                <button
                                                                    onClick={() => window.gesu?.shell?.openPath?.(job.outputPath!)}
                                                                    className="text-xs text-tokens-brand-DEFAULT hover:text-tokens-brand-hover hover:underline cursor-pointer"
                                                                    title={`Open: ${job.outputPath}`}
                                                                >
                                                                    📂 {job.outputPath.split(/[/\\]/).slice(-1)[0]}
                                                                </button>
                                                            ) : (
                                                                <span className="text-xs text-tokens-muted">{job.target}</span>
                                                            )}
                                                        </td>
                                                        {!(historyFilter === 'convert' || historyFilter === 'advanced') && (
                                                            <td className={`p-3 text-xs font-mono truncate max-w-[200px] ${job.status === 'failed' ? 'text-red-400' : 'text-tokens-muted'}`}>
                                                                {job.status === 'failed' && job.errorMessage
                                                                    ? <span title={job.errorMessage}>⚠ {job.errorMessage.slice(0, 40)}...</span>
                                                                    : job.url ? (
                                                                        <a
                                                                            href={job.url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="text-tokens-brand-DEFAULT hover:text-tokens-brand-hover hover:underline"
                                                                            title={job.url}
                                                                        >
                                                                            🔗 {new URL(job.url).hostname}
                                                                        </a>
                                                                    ) : job.inputPath ? (
                                                                        <span title={job.inputPath}>{job.inputPath.split(/[/\\]/).pop()}</span>
                                                                    ) : ''}
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
                    <Card title="Job Queue" className="flex flex-col min-h-[420px]">
                        <div className="flex gap-2 items-center mb-4">
                            <SelectDropdown
                                value={queueFilter}
                                onChange={(value) => setQueueFilter(value as any)}
                                options={[
                                    { value: 'all', label: 'All Jobs' },
                                    { value: 'download', label: 'Downloads' },
                                    { value: 'convert', label: 'Converts' }
                                ]}
                            />
                            {jobs.some(j => j.status === 'running' || j.status === 'queued') && (
                                <button
                                    onClick={handleCancelAllJobs}
                                    className="ml-auto px-2 py-1 rounded text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
                                    title="Cancel all running and queued jobs"
                                >
                                    <X size={12} />
                                    Cancel All
                                </button>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto scroll-on-hover pr-2 space-y-3">
                            {jobs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full py-8 px-4 border-2 border-dashed border-tokens-border/50 rounded-xl bg-tokens-panel2/20">
                                    <Zap size={28} className="text-tokens-muted/30 mb-2" />
                                    <span className="text-tokens-muted italic text-sm">Queue is empty</span>
                                </div>
                            ) : (
                                jobs
                                    .filter(j => queueFilter === 'all' || j.type === queueFilter)
                                    .map(job => (
                                        <div key={job.id} className="bg-tokens-panel2/50 border border-tokens-border rounded-lg p-3 hover:border-tokens-brand-DEFAULT/30 transition-all group">
                                            {/* Title Row */}
                                            <div className="flex flex-col gap-0.5 mb-2">
                                                <span className="font-medium text-sm text-tokens-fg truncate" title={job.label}>{job.label}</span>
                                                <span className="text-[10px] text-tokens-muted font-mono">{job.id} · {job.engine}</span>
                                            </div>

                                            {/* Status + Cancel Row (above progress bar) */}
                                            <div className="flex items-center justify-between mb-2">
                                                <StatusBadge status={job.status} progress={job.progress} />
                                                {(job.status === 'running' || job.status === 'queued') && (
                                                    <button
                                                        onClick={() => handleCancelJob(job.id)}
                                                        className="px-2 py-1 rounded text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
                                                        title="Cancel job"
                                                    >
                                                        <X size={12} />
                                                        Cancel
                                                    </button>
                                                )}
                                            </div>

                                            {/* Progress Bar */}
                                            {job.status === 'running' && (
                                                <div className="w-full bg-tokens-border h-2 rounded-full overflow-hidden mb-2">
                                                    <div
                                                        className="bg-tokens-brand-DEFAULT h-full transition-all duration-500 ease-out relative overflow-hidden"
                                                        style={{ width: `${job.progress || 0}%` }}
                                                    >
                                                        <div className="absolute inset-0 bg-white/20 animate-[shimmer_1s_infinite] skew-x-12"></div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Details */}
                                            <div className="text-[10px] text-tokens-muted grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-tokens-border/50 min-h-[24px]">
                                                {job.type === 'download' && job.payload && (
                                                    <>
                                                        <span>Preset: <span className="text-tokens-fg">{String(job.payload.preset)}</span></span>
                                                        <span>Network: <span className="text-tokens-fg">{String(job.payload.network)}</span></span>
                                                    </>
                                                )}
                                                {job.type === 'convert' && job.payload && (
                                                    <>
                                                        <span className="col-span-2">
                                                            {job.payload.preset === 'video-advanced'
                                                                ? formatAdvancedOptionsSummaryFromPayload(job.payload)
                                                                : `Preset: ${job.payload.preset}`
                                                            }
                                                        </span>
                                                    </>
                                                )}
                                                {!job.payload && (
                                                    <span className="col-span-2 text-tokens-muted/60">No details</span>
                                                )}
                                            </div>
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
