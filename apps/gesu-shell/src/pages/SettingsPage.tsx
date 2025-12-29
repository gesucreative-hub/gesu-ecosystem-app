import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGesuSettings } from '../lib/gesuSettings';
import { PageContainer } from '../components/PageContainer';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { SegmentedControl } from '../components/SegmentedControl';
import { Save, Search, Loader2, CheckCircle, AlertCircle, Globe, Download, RefreshCw, Info, X } from 'lucide-react';
import { OllamaProvider, PullProgress } from '../services/ai/OllamaProvider';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { AlertDialog } from '../components/AlertDialog';


// --- Types & Interfaces ---

// Workspace & Appearance
interface SettingsState {
    paths: {
        workflowRoot: string;
        projectsRoot: string;
        backupRoot: string;
    };
    appearance: {
        theme: 'dark' | 'light' | 'system';
        accentColor: string;
        glassmorphism: boolean;
    };
}

// Engine Manager
type EngineId = 'ytDlp' | 'ffmpeg' | 'imageMagick' | 'libreOffice';
type EngineStatus = 'unknown' | 'ok' | 'system' | 'fallback' | 'missing' | 'error';
type InstallMethod = 'manual' | 'winget' | 'choco' | 'scoop';

interface EngineConfig {
    id: EngineId;
    label: string;
    description: string;
    path: string;
    status: EngineStatus;
    version?: string;
    lastCheckedAt?: string;
    defaultPath: string; // Used for "Detect" mock
    installHint: Partial<Record<InstallMethod, string>>;
}

// --- Defaults ---

const DEFAULT_SETTINGS: SettingsState = {
    paths: {
        workflowRoot: String.raw`D: \03.Resources\_Gesu's\WorkFlowDatabase`,
        projectsRoot: String.raw`D:\01. Projects`,
        backupRoot: String.raw`D:\03. Resources\_Gesu's\Backup`
    },
    appearance: {
        theme: 'dark',
        accentColor: 'cyan',
        glassmorphism: true
    }
};

const DEFAULT_ENGINES: EngineConfig[] = [
    {
        id: 'ytDlp',
        label: 'yt-dlp',
        description: 'Command-line audio/video downloader.',
        path: String.raw`C:\Tools\yt-dlp\yt-dlp.exe`,
        status: 'unknown',
        defaultPath: String.raw`C:\Tools\yt-dlp\yt-dlp.exe`,
        installHint: {
            winget: 'winget install -e --id yt-dlp.yt-dlp',
            choco: 'choco install yt-dlp',
            scoop: 'scoop install yt-dlp'
        }
    },
    {
        id: 'ffmpeg',
        label: 'FFmpeg',
        description: 'Hyper-fast multimedia processing suite.',
        path: String.raw`C:\Tools\ffmpeg\bin\ffmpeg.exe`,
        status: 'unknown',
        defaultPath: String.raw`C:\Tools\ffmpeg\bin\ffmpeg.exe`,
        installHint: {
            winget: 'winget install -e --id Gyan.FFmpeg',
            choco: 'choco install ffmpeg',
            scoop: 'scoop install ffmpeg'
        }
    },
    {
        id: 'imageMagick',
        label: 'ImageMagick',
        description: 'Image processing and conversion tool.',
        path: '',
        status: 'unknown',
        defaultPath: String.raw`C:\Program Files\ImageMagick-7.1.1-Q16-HDRI\magick.exe`,
        installHint: {
            winget: 'winget install -e --id ImageMagick.ImageMagick',
            choco: 'choco install imagemagick',
            scoop: 'scoop install imagemagick'
        }
    }
    // Note: LibreOffice/soffice de-scoped - document conversion not in current release
];


// --- Helper Components ---

const StatusBadge = ({ status, version, t }: { status: EngineStatus; version?: string; t: (key: string, fallback: string) => string }) => {
    const variants: Record<EngineStatus, 'neutral' | 'success' | 'brand' | 'warning' | 'error'> = {
        unknown: 'neutral',
        ok: 'success',
        system: 'brand',
        fallback: 'warning',
        missing: 'error',
        error: 'error'
    };

    // Status label map - uses locale keys with fallbacks
    const getStatusLabel = (status: EngineStatus): string => {
        switch (status) {
            case 'unknown': return t('settings:engineStatus.unknown', 'Unknown');
            case 'ok': return t('settings:engineStatus.readyConfigured', 'Ready (Configured)');
            case 'system': return t('settings:engineStatus.readySystem', 'Ready (System PATH)');
            case 'fallback': return t('settings:engineStatus.warningFallback', 'Warning (Fallback)');
            case 'missing': return t('settings:engineStatus.missing', 'Missing');
            case 'error': return t('settings:engineStatus.error', 'Error');
            default: return status;
        }
    };

    return (
        <div className="flex items-center gap-2">
            <Badge variant={variants[status]}>
                {getStatusLabel(status)}
            </Badge>
            {version && (status === 'ok' || status === 'system' || status === 'fallback') && (
                <span className="text-[10px] text-tokens-muted font-mono">{version}</span>
            )}
        </div>
    );
};

export function SettingsPage() {
    // i18n
    const { t, i18n } = useTranslation(['settings', 'common']);
    
    // Shared Settings Hook
    const { settings: loadedSettings, saveSettings, refresh } = useGesuSettings();

    // Local State (for optimistic UI / editing before save)
    const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
    const [engines, setEngines] = useState<EngineConfig[]>(DEFAULT_ENGINES);

    const [installPreference, setInstallPreference] = useState<InstallMethod>('manual');
    const [showInstallHints, setShowInstallHints] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    // Confirm dialog state
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        type?: 'confirm' | 'warning' | 'danger';
    }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

    // Alert dialog state
    const [alertDialog, setAlertDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type?: 'success' | 'error' | 'warning' | 'info';
    }>({ isOpen: false, title: '', message: '' });
    const [isCheckingTools, setIsCheckingTools] = useState(false);

    // --- Model Management State ---
    const [installedModels, setInstalledModels] = useState<string[]>([]);
    const [isRefreshingModels, setIsRefreshingModels] = useState(false);
    const [isDownloadingModel, setIsDownloadingModel] = useState(false);
    const [isOllamaReachable, setIsOllamaReachable] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState<{
        status: string;
        percent?: number;
        completed?: number;
        total?: number;
    } | null>(null);
    const downloadAbortRef = useRef<AbortController | null>(null);

    // Helper for formatting bytes
    const formatBytes = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    };

    // Refresh installed models from Ollama
    const refreshInstalledModels = async () => {
        const aiSettings = loadedSettings?.ai;
        if (aiSettings?.provider !== 'ollama') {
            setInstalledModels([]);
            setIsOllamaReachable(false);
            return;
        }
        setIsRefreshingModels(true);
        try {
            const provider = new OllamaProvider({
                endpoint: aiSettings.endpoint || 'http://localhost:11434',
                model: aiSettings.model || 'llama3.2',
            });
            const models = await provider.listModels();
            setInstalledModels(models);
            setIsOllamaReachable(models.length > 0 || true); // If we got here without error, it's reachable
        } catch {
            setInstalledModels([]);
            setIsOllamaReachable(false);
        } finally {
            setIsRefreshingModels(false);
        }
    };

    // Check reachability separately (listModels returns [] if reachable but no models)
    const checkOllamaReachability = async () => {
        const aiSettings = loadedSettings?.ai;
        if (aiSettings?.provider !== 'ollama') {
            setIsOllamaReachable(false);
            return;
        }
        try {
            const resp = await fetch(`${aiSettings.endpoint || 'http://localhost:11434'}/api/tags`, { method: 'GET' });
            setIsOllamaReachable(resp.ok);
            if (resp.ok) {
                const data = await resp.json();
                setInstalledModels(data.models?.map((m: { name: string }) => m.name) || []);
            }
        } catch {
            setIsOllamaReachable(false);
        }
    };

    // Start model download
    const startModelDownload = async () => {
        const aiSettings = loadedSettings?.ai;
        const model = aiSettings?.model;
        if (!model || aiSettings?.provider !== 'ollama') return;

        setIsDownloadingModel(true);
        setDownloadProgress({ status: 'pulling' });
        downloadAbortRef.current = new AbortController();

        try {
            const provider = new OllamaProvider({
                endpoint: aiSettings.endpoint || 'http://localhost:11434',
                model,
            });

            await provider.pullModel(
                model,
                (progress: PullProgress) => {
                    const percent = progress.total
                        ? Math.round(((progress.completed || 0) / progress.total) * 100)
                        : undefined;
                    setDownloadProgress({ ...progress, percent });
                },
                downloadAbortRef.current.signal
            );

            // Success
            setDownloadProgress(null);
            setAlertDialog({ 
                isOpen: true, 
                title: t('settings:ai.modelSetup.downloadSuccess'), 
                message: `${model}`,
                type: 'success' 
            });
            await checkOllamaReachability();
        } catch (e) {
            if (e instanceof Error && (e.message.includes('abort') || e.name === 'AbortError')) {
                // User cancelled - just reset state
            } else {
                setAlertDialog({ 
                    isOpen: true, 
                    title: t('settings:ai.modelSetup.downloadError'), 
                    message: e instanceof Error ? e.message : 'Unknown error',
                    type: 'error' 
                });
            }
            setDownloadProgress(null);
        } finally {
            setIsDownloadingModel(false);
            downloadAbortRef.current = null;
        }
    };

    // Cancel model download
    const cancelModelDownload = () => {
        downloadAbortRef.current?.abort();
    };

    // Open Ollama download page
    const openOllamaDownloadPage = () => {
        const url = 'https://ollama.ai/download';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const electronWindow = window as any;
        if (electronWindow.electron?.shell?.openExternal) {
            electronWindow.electron.shell.openExternal(url);
        } else {
            window.open(url, '_blank');
        }
    };

    // Auto-refresh models when provider/endpoint changes
    useEffect(() => {
        if (loadedSettings?.ai?.provider === 'ollama') {
            checkOllamaReachability();
        } else {
            setInstalledModels([]);
            setIsOllamaReachable(false);
        }
    }, [loadedSettings?.ai?.provider, loadedSettings?.ai?.endpoint]);

    // Apply theme instantly for live preview (before saving)
    useEffect(() => {
        const root = document.documentElement;
        const theme = settings.appearance.theme;

        if (theme === 'dark') {
            root.classList.add('dark');
            root.setAttribute('data-theme', 'dark');
        } else if (theme === 'light') {
            root.classList.remove('dark');
            root.setAttribute('data-theme', 'light');
        } else if (theme === 'system') {
            // Use system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) {
                root.classList.add('dark');
                root.setAttribute('data-theme', 'dark');
            } else {
                root.classList.remove('dark');
                root.setAttribute('data-theme', 'light');
            }
        }
    }, [settings.appearance.theme]);

    // Hydrate state from shared hook
    useEffect(() => {
        if (loadedSettings) {
            console.log('[SettingsPage] Hydrating from shared settings', loadedSettings);

            // Merge with defaults
            const mergedPaths = { ...DEFAULT_SETTINGS.paths, ...(loadedSettings.paths || {}) };
            const mergedAppearance = { ...DEFAULT_SETTINGS.appearance, ...(loadedSettings.appearance || {}) };

            setSettings({
                paths: mergedPaths,
                appearance: mergedAppearance
            });

            if (loadedSettings.installPreference) {
                setInstallPreference(loadedSettings.installPreference);
            }

            if (loadedSettings.engines) {
                setEngines(prev => prev.map(e => {
                    let newPath = e.path;
                    if (e.id === 'ytDlp') newPath = loadedSettings.engines?.ytDlpPath ?? '';
                    if (e.id === 'ffmpeg') newPath = loadedSettings.engines?.ffmpegPath ?? '';
                    if (e.id === 'imageMagick') newPath = loadedSettings.engines?.imageMagickPath ?? '';
                    if (e.id === 'libreOffice') newPath = loadedSettings.engines?.libreOfficePath ?? '';
                    return { ...e, path: newPath };
                }));
            }
        }
    }, [loadedSettings]);

    // Settings Handlers
    const updateSettings = (section: keyof SettingsState, key: string, value: any) => {
        setSettings(prev => ({
            ...prev,
            [section]: { ...prev[section], [key]: value }
        }));
        setIsDirty(true);
    };

    // Engine Handlers
    const updateEnginePath = (id: EngineId, path: string) => {
        setEngines(prev => prev.map(e => e.id === id ? { ...e, path, status: 'unknown' } : e));
        setIsDirty(true);
    };

    const detectEngine = async (_id: EngineId) => {
        await checkAllTools();
    };

    const handleBrowseFolder = async (section: keyof SettingsState, key: string) => {
        if (!window.gesu?.dialog?.pickFolder) {
            setAlertDialog({ isOpen: true, title: 'Error', message: 'Dialog API not available.', type: 'error' });
            return;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const currentPath = (settings[section] as any)[key];
        const result = await window.gesu.dialog.pickFolder(currentPath);
        if (result) {
            updateSettings(section, key, result);
        }
    };

    const handleBrowseTool = async (id: EngineId) => {
        if (!window.gesu?.dialog?.pickFile) {
            setAlertDialog({ isOpen: true, title: 'Error', message: 'Dialog API not available.', type: 'error' });
            return;
        }
        const engine = engines.find(e => e.id === id);
        const result = await window.gesu.dialog.pickFile({
            defaultPath: engine?.path,
            filters: [{ name: 'Executables', extensions: ['exe', 'bat', 'cmd'] }, { name: 'All Files', extensions: ['*'] }]
        });
        if (result) {
            updateEnginePath(id, result);
        }
    };

    const checkAllTools = async () => {
        if (!window.gesu?.checkTools) {
            setAlertDialog({ isOpen: true, title: 'Error', message: 'Desktop bridge not available. Run inside Electron to perform real checks.', type: 'error' });
            return;
        }

        setIsCheckingTools(true);
        try {
            const payload = {
                ytDlpPath: engines.find(e => e.id === 'ytDlp')?.path,
                ffmpegPath: engines.find(e => e.id === 'ffmpeg')?.path,
                imageMagickPath: engines.find(e => e.id === 'imageMagick')?.path,
                libreOfficePath: engines.find(e => e.id === 'libreOffice')?.path
            };

            const result = await window.gesu.checkTools(payload);
            console.log('[GlobalToolsCheck]', result);

            setEngines(prev => prev.map(e => {
                let res = null;
                if (e.id === 'ytDlp') res = result.ytDlp;
                if (e.id === 'ffmpeg') res = result.ffmpeg;
                if (e.id === 'imageMagick') res = result.imageMagick;
                if (e.id === 'libreOffice') res = result.libreOffice;

                if (!res) return e;

                let status: EngineStatus = 'unknown';

                if (res.status === 'ready_configured') status = 'ok';
                else if (res.status === 'ready_path') status = 'system';
                else if (res.status === 'fallback_path') status = 'fallback';
                else if (res.status === 'missing') status = 'missing';
                else if (res.status === 'error') status = 'error';

                if (status === 'unknown') {
                    if (res.resolution === 'configured') status = 'ok';
                    else if (res.resolution === 'path') status = 'system';
                    else if (res.resolution === 'missing') status = 'missing';
                }

                if (res.status === 'not_found') status = 'missing';
                if (res.status === 'error') status = 'error';

                return {
                    ...e,
                    status,
                    version: res.version || undefined,
                    lastCheckedAt: res.lastCheckedAt
                };
            }));
        } catch (err) {
            console.error(err);
            setAlertDialog({ isOpen: true, title: 'Error', message: 'Error running tools check.', type: 'error' });
        } finally {
            setIsCheckingTools(false);
        }
    };

    // Global Actions
    const handleSave = async () => {
        const payload: GesuSettings = {
            paths: settings.paths,
            appearance: settings.appearance,
            engines: {
                ytDlpPath: engines.find(e => e.id === 'ytDlp')?.path || null,
                ffmpegPath: engines.find(e => e.id === 'ffmpeg')?.path || null,
                imageMagickPath: engines.find(e => e.id === 'imageMagick')?.path || null,
                libreOfficePath: engines.find(e => e.id === 'libreOffice')?.path || null
            },
            installPreference
        };

        try {
            await saveSettings(payload);
            console.log("Settings Saved to Disk via Shared Hook:", payload);
            setAlertDialog({ isOpen: true, title: 'Success', message: 'Settings saved successfully to disk!', type: 'success' });
            setIsDirty(false);
            checkAllTools();

            // Force refresh from persistent storage to ensure UI reflects saved values
            await refresh();
        } catch (err) {
            console.error(err);
            setAlertDialog({ isOpen: true, title: 'Error', message: 'Failed to save settings.', type: 'error' });
        }
    };

    const handleReset = () => {
        setConfirmDialog({
            isOpen: true,
            title: 'Reset all settings?',
            message: 'This will restore all settings to their default values.',
            type: 'danger',
            onConfirm: () => {
                setSettings(DEFAULT_SETTINGS);
                setEngines(DEFAULT_ENGINES);
                setInstallPreference('manual');
                setIsDirty(true);
                setConfirmDialog({ ...confirmDialog, isOpen: false });
            },
        });
    };

    return (
        <>
            <PageContainer className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">

                {/* Header */}
                <div className="flex justify-between items-center mb-2">
                    <div>
                        <h1 className="text-3xl font-bold text-tokens-fg tracking-tight">{t('settings:title')}</h1>
                        <p className="text-tokens-muted text-sm mt-1">{t('settings:subtitle')}</p>
                    </div>
                    <Link to="/" className="px-4 py-2 bg-tokens-panel hover:bg-tokens-panel2 text-tokens-muted hover:text-tokens-fg rounded-lg text-sm border border-tokens-border transition-colors">
                        ← {t('common:buttons.back')}
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Workspace Paths */}
                    <Card title={
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-primary-700 dark:bg-secondary-300 rounded-full"></span>
                            {t('settings:paths.title')}
                        </div>
                    } className="lg:col-span-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                                <Input
                                    label={t('settings:paths.workflowRoot')}
                                    value={settings.paths.workflowRoot}
                                    onChange={(e) => updateSettings('paths', 'workflowRoot', e.target.value)}
                                />
                                <div className="flex justify-between items-center">
                                    <p className="text-xs text-tokens-muted">{t('settings:paths.workflowRootDesc')}</p>
                                    <Button size="sm" variant="secondary" onClick={() => handleBrowseFolder('paths', 'workflowRoot')}>{t('common:buttons.browse')}</Button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Input
                                    label={t('settings:paths.projectsFolder')}
                                    value={settings.paths.projectsRoot}
                                    onChange={(e) => updateSettings('paths', 'projectsRoot', e.target.value)}
                                />
                                <div className="flex justify-between items-center">
                                    <p className="text-xs text-tokens-muted">{t('settings:paths.projectsFolderDesc')}</p>
                                    <Button size="sm" variant="secondary" onClick={() => handleBrowseFolder('paths', 'projectsRoot')}>{t('common:buttons.browse')}</Button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Input
                                    label={t('settings:paths.backupFolder')}
                                    value={settings.paths.backupRoot}
                                    onChange={(e) => updateSettings('paths', 'backupRoot', e.target.value)}
                                />
                                <div className="flex justify-end items-center">
                                    <Button size="sm" variant="secondary" onClick={() => handleBrowseFolder('paths', 'backupRoot')}>{t('common:buttons.browse')}</Button>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Engine Manager */}
                    <Card title={
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-primary-700 dark:bg-secondary-300 rounded-full"></span>
                            {t('settings:engines.title')}
                        </div>
                    } headerAction={
                        <div className="flex bg-tokens-panel2 p-0.5 rounded-lg border border-tokens-border">
                            {['Manual', 'Winget', 'Choco', 'Scoop'].map((method) => (
                                <button
                                    key={method}
                                    onClick={() => setInstallPreference(method.toLowerCase() as InstallMethod)}
                                    className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${installPreference === method.toLowerCase()
                                        ? 'bg-tokens-brand-DEFAULT text-tokens-brand-contrast shadow-sm'
                                        : 'text-tokens-muted hover:text-tokens-fg'
                                        }`}
                                >
                                    {method}
                                </button>
                            ))}
                        </div>
                    } className="lg:col-span-2">
                        <p className="text-sm text-tokens-muted -mt-4 mb-6">{t('settings:engines.description')}</p>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Filter out libreOffice - document conversion deferred to future release */}
                            {engines.filter(e => e.id !== 'libreOffice').map((engine) => (
                                <div key={engine.id} className="bg-tokens-panel2/30 border border-tokens-border rounded-xl p-4 flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-semibold text-tokens-fg text-sm">{engine.label}</div>
                                            <div className="text-[10px] text-tokens-muted">{engine.description}</div>
                                        </div>
                                        <StatusBadge status={engine.status} version={engine.version} t={t} />
                                    </div>

                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="text"
                                            value={engine.path}
                                            onChange={(e) => updateEnginePath(engine.id, e.target.value)}
                                            placeholder={t('settings:placeholders.enterPath', 'Enter absolute path...')}
                                            className="flex-1 bg-tokens-panel border border-tokens-border rounded-lg px-3 py-1.5 text-tokens-fg focus:outline-none focus:ring-1 focus:ring-tokens-brand-DEFAULT/30 font-mono text-[10px]"
                                        />
                                        <Button size="sm" variant="ghost" onClick={() => handleBrowseTool(engine.id)} className="h-7 px-2 text-xs">{t('common:buttons.browse', 'Browse')}</Button>
                                        <Button size="sm" variant="ghost" onClick={() => detectEngine(engine.id)} title={t('settings:tooltips.checkTool', 'Check this tool')} className="h-7 px-2 text-xs">{t('settings:buttons.check', 'Check')}</Button>
                                    </div>

                                    <div className="flex justify-between items-center mt-1">
                                        <div className="text-[10px] text-tokens-muted">
                                            Last check: {engine.lastCheckedAt ? new Date(engine.lastCheckedAt).toLocaleTimeString() : 'Never'}
                                        </div>
                                        {installPreference !== 'manual' && engine.installHint[installPreference] && (
                                            <button
                                                onClick={() => setShowInstallHints(!showInstallHints)}
                                                className="text-[10px] text-tokens-brand-DEFAULT hover:underline decoration-dotted"
                                            >
                                                {showInstallHints ? 'Hide command' : 'Install command'}
                                            </button>
                                        )}
                                    </div>

                                    {showInstallHints && installPreference !== 'manual' && engine.installHint[installPreference] && (
                                        <div className="mt-1 bg-black/40 p-2 rounded border border-tokens-border font-mono text-[10px] text-gray-400 select-all break-all">
                                            &gt; {engine.installHint[installPreference]}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <Button
                            variant="secondary"
                            fullWidth
                            onClick={checkAllTools}
                            disabled={isCheckingTools}
                            className="mt-6"
                            icon={isCheckingTools ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                            iconPosition="circle"
                        >
                            {isCheckingTools ? t('settings:configHealth.checkingSystem', 'Checking System...') : t('settings:configHealth.runCheck', 'Run Global Tools Check')}
                        </Button>
                    </Card>

                    {/* Configuration Health Check */}
                    <Card title={
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-primary-700 dark:bg-secondary-300 rounded-full"></span>
                            {t('settings:configHealth.title', 'Configuration Health')}
                        </div>
                    } className="lg:col-span-2">
                        <div className="space-y-4">
                            {/* Overall Status */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {(() => {
                                        const toolsReady = engines.filter(e => e.status === 'ok' || e.status === 'system').length;
                                        const pathsConfigured = [settings.paths.workflowRoot, settings.paths.projectsRoot, settings.paths.backupRoot].filter(p => p && p.trim()).length;
                                        const allGood = toolsReady === engines.length && pathsConfigured === 3;

                                        return (
                                            <>
                                                <div className={`p-2 rounded-lg ${allGood ? 'bg-green-500/10' : 'bg-amber-500/10'}`}>
                                                    {allGood ? (
                                                        <CheckCircle size={24} className="text-green-500" />
                                                    ) : (
                                                        <AlertCircle size={24} className="text-amber-500" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-tokens-fg">
                                                        {allGood ? t('settings:configHealth.allReady', 'All Systems Ready') : t('settings:configHealth.incomplete', 'Configuration Incomplete')}
                                                    </div>
                                                    <div className="text-xs text-tokens-muted">
                                                        {allGood ? t('settings:configHealth.allReady_desc', 'Everything is configured correctly') : t('settings:configHealth.incomplete_desc', 'Some settings need attention')}
                                                    </div>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* Status Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                {/* Tools Status */}
                                <div className="p-3 bg-tokens-panel2/50 rounded-lg border border-tokens-border">
                                    <div className="text-xs text-tokens-muted mb-1">{t('settings:sections.externalTools')}</div>
                                    <div className="text-2xl font-bold text-tokens-fg">
                                        {engines.filter(e => e.status === 'ok' || e.status === 'system').length}/{engines.length}
                                    </div>
                                    <div className="text-xs text-tokens-muted">{t('settings:configHealth.ready', 'Ready')}</div>
                                </div>

                                {/* Paths Status */}
                                <div className="p-3 bg-tokens-panel2/50 rounded-lg border border-tokens-border">
                                    <div className="text-xs text-tokens-muted mb-1">{t('settings:sections.directoryPaths')}</div>
                                    <div className="text-2xl font-bold text-tokens-fg">
                                        {[settings.paths.workflowRoot, settings.paths.projectsRoot, settings.paths.backupRoot].filter(p => p && p.trim()).length}/3
                                    </div>
                                    <div className="text-xs text-tokens-muted">{t('settings:configHealth.configured', 'Configured')}</div>
                                </div>
                            </div>

                            {/* Issues List */}
                            {(() => {
                                const issues = [];
                                const missingTools = engines.filter(e => e.status === 'missing' || e.status === 'error');
                                const missingPaths = [];

                                if (!settings.paths.workflowRoot?.trim()) missingPaths.push('Workflow Root');
                                if (!settings.paths.projectsRoot?.trim()) missingPaths.push('Projects Root');
                                if (!settings.paths.backupRoot?.trim()) missingPaths.push('Backup Root');

                                if (missingTools.length > 0) {
                                    issues.push(`${missingTools.length} tool(s) not found: ${missingTools.map(t => t.id).join(', ')}`);
                                }
                                if (missingPaths.length > 0) {
                                    issues.push(`Missing paths: ${missingPaths.join(', ')}`);
                                }

                                return issues.length > 0 ? (
                                    <div className="p-3 bg-amber-500/5 rounded-lg border border-amber-500/20">
                                        <div className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-2">{t('settings:validation.issuesFound')}</div>
                                        <ul className="space-y-1">
                                            {issues.map((issue, i) => (
                                                <li key={i} className="text-xs text-tokens-muted flex items-start gap-2">
                                                    <span className="text-amber-500 mt-0.5">⚠</span>
                                                    <span>{issue}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : (
                                    <div className="p-3 bg-green-500/5 rounded-lg border border-green-500/20 text-center">
                                        <span className="text-xs text-green-600 dark:text-green-400">✓ {t('settings:configHealth.noIssues', 'No issues found')}</span>
                                    </div>
                                );
                            })()}
                        </div>
                    </Card>

                    {/* Theme Switcher */}
                    <Card title={
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-primary-700 dark:bg-secondary-300 rounded-full"></span>
                            {t('settings:appearance.title', 'Appearance')}
                        </div>
                    } className="lg:col-span-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm font-medium text-tokens-fg mb-1">{t('settings:appearance.colorTheme')}</div>
                                <div className="text-xs text-tokens-muted">
                                    {t('settings:appearance.colorThemeDesc', 'Light mode uses Indigo accent, Dark mode uses Green accent')}
                                </div>
                            </div>
                            <SegmentedControl
                                options={[
                                    { value: 'system', label: t('settings:theme.system', 'System') },
                                    { value: 'dark', label: t('settings:theme.dark', 'Dark') },
                                    { value: 'light', label: t('settings:theme.light', 'Light') }
                                ]}
                                value={settings.appearance.theme}
                                onChange={(val) => updateSettings('appearance', 'theme', val)}
                            />
                        </div>
                    </Card>

                    {/* Language Selector */}
                    <Card title={
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-primary-700 dark:bg-secondary-300 rounded-full"></span>
                            <Globe size={16} className="text-tokens-brand-DEFAULT" />
                            {t('settings:language.title')}
                        </div>
                    } className="lg:col-span-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm font-medium text-tokens-fg mb-1">{t('settings:language.select')}</div>
                                <div className="text-xs text-tokens-muted">
                                    {i18n.language === 'id' ? 'Ubah bahasa tampilan aplikasi' : 'Change the display language of the app'}
                                </div>
                            </div>
                            <SegmentedControl
                                options={[
                                    { value: 'en', label: 'English' },
                                    { value: 'id', label: 'Bahasa' }
                                ]}
                                value={i18n.language.startsWith('id') ? 'id' : 'en'}
                                onChange={(val) => i18n.changeLanguage(val)}
                            />
                        </div>
                    </Card>

                    {/* AI Suggestions */}
                    <Card title={
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-primary-700 dark:bg-secondary-300 rounded-full"></span>
                            {t('settings:ai.title')}
                        </div>
                    } className="lg:col-span-2">
                        <div className="space-y-6">
                            {/* Enable Toggle */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-medium text-tokens-fg mb-1">{t('settings:ai.enabled')}</div>
                                    <div className="text-xs text-tokens-muted">{t('settings:ai.enabledDesc')}</div>
                                </div>
                                <button
                                    onClick={() => {
                                        const currentAi = loadedSettings?.ai || { enabled: false, provider: 'none', endpoint: 'http://localhost:11434', model: 'llama3.2' };
                                        saveSettings({ ...loadedSettings!, ai: { ...currentAi, enabled: !currentAi.enabled } });
                                        setIsDirty(true);
                                    }}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${loadedSettings?.ai?.enabled ? 'bg-tokens-brand-DEFAULT' : 'bg-tokens-panel2 border border-tokens-border'}`}
                                >
                                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${loadedSettings?.ai?.enabled ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>

                            {/* Provider Selection */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-medium text-tokens-fg mb-1">{t('settings:ai.provider')}</div>
                                    <div className="text-xs text-tokens-muted">{t('settings:ai.providerDesc')}</div>
                                </div>
                                <select
                                    value={loadedSettings?.ai?.provider || 'none'}
                                    onChange={(e) => {
                                        const currentAi = loadedSettings?.ai || { enabled: false, provider: 'none', endpoint: 'http://localhost:11434', model: 'llama3.2' };
                                        saveSettings({ ...loadedSettings!, ai: { ...currentAi, provider: e.target.value as 'none' | 'ollama' | 'mock' } });
                                        setIsDirty(true);
                                    }}
                                    className="bg-tokens-panel border border-tokens-border rounded-lg px-3 py-1.5 text-sm text-tokens-fg focus:outline-none focus:ring-1 focus:ring-tokens-brand-DEFAULT/30"
                                >
                                    <option value="none">{t('settings:ai.providerNone')}</option>
                                    <option value="ollama">{t('settings:ai.providerOllama')}</option>
                                    <option value="mock">{t('settings:ai.providerMock')}</option>
                                </select>
                            </div>

                            {/* Endpoint & Model (only for Ollama) */}
                            {loadedSettings?.ai?.provider === 'ollama' && (
                                <div className="space-y-4 p-4 bg-tokens-panel2/30 rounded-lg border border-tokens-border">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium text-tokens-fg">{t('settings:ai.endpoint')}</label>
                                        <input
                                            type="text"
                                            value={loadedSettings?.ai?.endpoint || 'http://localhost:11434'}
                                            onChange={(e) => {
                                                const currentAi = loadedSettings?.ai || { enabled: false, provider: 'ollama', endpoint: 'http://localhost:11434', model: 'llama3.2' };
                                                saveSettings({ ...loadedSettings!, ai: { ...currentAi, endpoint: e.target.value } });
                                                setIsDirty(true);
                                            }}
                                            placeholder={t('settings:ai.endpointPlaceholder')}
                                            className="bg-tokens-panel border border-tokens-border rounded-lg px-3 py-2 text-tokens-fg focus:outline-none focus:ring-1 focus:ring-tokens-brand-DEFAULT/30 font-mono text-sm"
                                        />
                                        <p className="text-xs text-tokens-muted">{t('settings:ai.endpointDesc')}</p>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium text-tokens-fg">{t('settings:ai.model')}</label>
                                        <input
                                            type="text"
                                            value={loadedSettings?.ai?.model || 'llama3.2'}
                                            onChange={(e) => {
                                                const currentAi = loadedSettings?.ai || { enabled: false, provider: 'ollama', endpoint: 'http://localhost:11434', model: 'llama3.2' };
                                                saveSettings({ ...loadedSettings!, ai: { ...currentAi, model: e.target.value } });
                                                setIsDirty(true);
                                            }}
                                            placeholder={t('settings:ai.modelPlaceholder')}
                                            className="bg-tokens-panel border border-tokens-border rounded-lg px-3 py-2 text-tokens-fg focus:outline-none focus:ring-1 focus:ring-tokens-brand-DEFAULT/30 font-mono text-sm"
                                        />
                                        <p className="text-xs text-tokens-muted">{t('settings:ai.modelDesc')}</p>
                                    </div>
                                </div>
                            )}

                            {/* Test Connection */}
                            {loadedSettings?.ai?.provider && loadedSettings?.ai?.provider !== 'none' && (
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={async () => {
                                            const aiSettings = loadedSettings?.ai;
                                            if (!aiSettings) return;
                                            
                                            // Simple test - for mock always success, for ollama try fetch
                                            if (aiSettings.provider === 'mock') {
                                                setAlertDialog({ isOpen: true, title: t('settings:ai.connected'), message: 'Mock provider is always available.', type: 'success' });
                                            } else if (aiSettings.provider === 'ollama') {
                                                try {
                                                    const resp = await fetch(`${aiSettings.endpoint}/api/tags`, { method: 'GET' });
                                                    if (resp.ok) {
                                                        setAlertDialog({ isOpen: true, title: t('settings:ai.connected'), message: 'Connected to Ollama successfully!', type: 'success' });
                                                    } else {
                                                        setAlertDialog({ isOpen: true, title: t('settings:ai.connectionFailed'), message: `HTTP ${resp.status}`, type: 'error' });
                                                    }
                                                } catch (err) {
                                                    setAlertDialog({ isOpen: true, title: t('settings:ai.connectionFailed'), message: err instanceof Error ? err.message : 'Unknown error', type: 'error' });
                                                }
                                            }
                                        }}
                                    >
                                        {t('settings:ai.testConnection')}
                                    </Button>
                                    <span className="text-xs text-tokens-muted">
                                        {loadedSettings?.ai?.provider === 'mock' && '✓ ' + t('settings:ai.connected')}
                                        {loadedSettings?.ai?.provider === 'ollama' && loadedSettings?.ai?.endpoint}
                                    </span>
                                </div>
                            )}

                            {/* Model Setup Section - For Ollama */}
                            {loadedSettings?.ai?.provider === 'ollama' && (
                                <div className="mt-6 pt-6 border-t border-tokens-border space-y-4">
                                    <h4 className="text-sm font-semibold text-tokens-fg">
                                        {t('settings:ai.modelSetup.title')}
                                    </h4>

                                    {/* Beginner Install CTA */}
                                    <div className="flex items-start gap-3 p-3 bg-tokens-panel2/30 rounded-lg border border-tokens-border">
                                        <Info className="w-5 h-5 text-tokens-brand-DEFAULT mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-sm text-tokens-fg mb-2">
                                                {t('settings:ai.modelSetup.needOllama')}
                                            </p>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={openOllamaDownloadPage}
                                            >
                                                <Download className="w-4 h-4 mr-2" />
                                                {t('settings:ai.modelSetup.downloadOllama')}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Ollama Status */}
                                    {!isOllamaReachable && !isRefreshingModels && (
                                        <div className="flex items-center gap-2 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                                            <AlertCircle className="w-4 h-4 text-amber-500" />
                                            <span className="text-sm text-amber-400">
                                                {t('settings:ai.modelSetup.ollamaNotRunning')}
                                            </span>
                                        </div>
                                    )}

                                    {/* Installed Models */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-tokens-fg">
                                                {t('settings:ai.modelSetup.installedModels')}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={refreshInstalledModels}
                                                disabled={isRefreshingModels}
                                            >
                                                <RefreshCw className={`w-4 h-4 ${isRefreshingModels ? 'animate-spin' : ''}`} />
                                            </Button>
                                        </div>
                                        {installedModels.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {installedModels.map(model => (
                                                    <span 
                                                        key={model} 
                                                        className="px-2 py-1 bg-tokens-panel2 border border-tokens-border rounded text-xs text-tokens-fg font-mono"
                                                    >
                                                        {model}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-tokens-muted">
                                                {t('settings:ai.modelSetup.noModels')}
                                            </p>
                                        )}
                                    </div>

                                    {/* Download Model Button */}
                                    <div className="space-y-2">
                                        <Button
                                            variant="primary"
                                            size="md"
                                            onClick={startModelDownload}
                                            disabled={
                                                !isOllamaReachable ||
                                                isDownloadingModel ||
                                                !loadedSettings?.ai?.model
                                            }
                                        >
                                            {isDownloadingModel ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    {downloadProgress?.percent !== undefined
                                                        ? t('settings:ai.modelSetup.downloading', { percent: downloadProgress.percent })
                                                        : t('settings:ai.modelSetup.status.pulling')}
                                                </>
                                            ) : (
                                                <>
                                                    <Download className="w-4 h-4 mr-2" />
                                                    {t('settings:ai.modelSetup.downloadModel', { 
                                                        model: loadedSettings?.ai?.model || 'model' 
                                                    })}
                                                </>
                                            )}
                                        </Button>

                                        {/* Progress Details */}
                                        {isDownloadingModel && downloadProgress && (
                                            <div className="space-y-2 p-3 bg-tokens-panel2/30 rounded-lg border border-tokens-border">
                                                <div className="flex justify-between text-xs text-tokens-muted">
                                                    <span>
                                                        {t(`settings:ai.modelSetup.status.${downloadProgress.status}`, downloadProgress.status)}
                                                    </span>
                                                    {downloadProgress.total && (
                                                        <span>
                                                            {formatBytes(downloadProgress.completed || 0)} / {formatBytes(downloadProgress.total)}
                                                        </span>
                                                    )}
                                                </div>
                                                {downloadProgress.percent !== undefined && (
                                                    <div className="w-full h-2 bg-tokens-panel2 rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full bg-tokens-brand-DEFAULT transition-all duration-300"
                                                            style={{ width: `${downloadProgress.percent}%` }}
                                                        />
                                                    </div>
                                                )}
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    onClick={cancelModelDownload}
                                                >
                                                    <X className="w-4 h-4 mr-1" />
                                                    {t('settings:ai.modelSetup.cancel')}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                </div>

                {/* Sticky Action Footer */}
                <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 bg-tokens-panel/90 backdrop-blur-md border border-tokens-border rounded-full px-6 py-3 flex gap-4 items-center shadow-2xl transition-all duration-300 ${isDirty ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
                    <span className="text-sm text-tokens-muted font-medium">{t('settings:footer.unsavedChanges', 'Unsaved changes')}</span>
                    <div className="h-4 w-px bg-tokens-border"></div>
                    <Button
                        variant="ghost"
                        onClick={handleReset}
                    >
                        {t('settings:danger.reset')}
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        icon={<Save size={16} />}
                        iconPosition="circle"
                    >
                        {t('common:buttons.saveSettings')}
                    </Button>
                </div>

            </PageContainer>

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.title}
                message={confirmDialog.message}
                type={confirmDialog.type}
                onConfirm={confirmDialog.onConfirm}
                onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
            />

            {/* Alert Dialog */}
            <AlertDialog
                isOpen={alertDialog.isOpen}
                title={alertDialog.title}
                message={alertDialog.message}
                type={alertDialog.type}
                onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
            />
        </>
    );
}
