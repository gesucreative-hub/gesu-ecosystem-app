import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useGesuSettings } from '../lib/gesuSettings';
import { PageContainer } from '../components/PageContainer';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Save, Search, Loader2 } from 'lucide-react';


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
    },
    {
        id: 'libreOffice',
        label: 'LibreOffice',
        description: 'For document conversion (headless mode).',
        path: String.raw`C:\Program Files\LibreOffice\program\soffice.exe`,
        status: 'unknown',
        defaultPath: String.raw`C:\Program Files\LibreOffice\program\soffice.exe`,
        installHint: {
            winget: 'winget install -e --id TheDocumentFoundation.LibreOffice',
            choco: 'choco install libreoffice',
            scoop: 'scoop install libreoffice'
        }
    }
];

const ACCENT_COLORS = [
    { id: 'cyan', label: 'Cyan', class: 'bg-cyan-500' },
    { id: 'purple', label: 'Purple', class: 'bg-purple-500' },
    { id: 'emerald', label: 'Emerald', class: 'bg-emerald-500' },
    { id: 'rose', label: 'Rose', class: 'bg-rose-500' },
    { id: 'orange', label: 'Orange', class: 'bg-orange-500' }
];

// --- Helper Components ---

const StatusBadge = ({ status, version }: { status: EngineStatus; version?: string }) => {
    const variants: Record<EngineStatus, 'neutral' | 'success' | 'brand' | 'warning' | 'error'> = {
        unknown: 'neutral',
        ok: 'success',
        system: 'brand',
        fallback: 'warning',
        missing: 'error',
        error: 'error'
    };

    const labels = {
        unknown: 'Unknown',
        ok: 'Ready (Configured)',
        system: 'Ready (System PATH)',
        fallback: 'Warning (Fallback)',
        missing: 'Missing',
        error: 'Error'
    };

    return (
        <div className="flex items-center gap-2">
            <Badge variant={variants[status]}>
                {labels[status]}
            </Badge>
            {version && (status === 'ok' || status === 'system' || status === 'fallback') && (
                <span className="text-[10px] text-tokens-muted font-mono">{version}</span>
            )}
        </div>
    );
};

export function SettingsPage() {
    // Shared Settings Hook
    const { settings: loadedSettings, saveSettings } = useGesuSettings();

    // Local State (for optimistic UI / editing before save)
    const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
    const [engines, setEngines] = useState<EngineConfig[]>(DEFAULT_ENGINES);

    const [installPreference, setInstallPreference] = useState<InstallMethod>('manual');
    const [showInstallHints, setShowInstallHints] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [desktopPingResult, setDesktopPingResult] = useState<string | null>(null);
    const [isCheckingTools, setIsCheckingTools] = useState(false);

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

    // Handlers
    const handleTestDesktopBridge = async () => {
        if (!window.gesu?.ping) {
            setDesktopPingResult('Desktop bridge is not available. (Are you in Electron?)');
            return;
        }

        try {
            setDesktopPingResult('Pinging...');
            const result = await window.gesu.ping({ source: 'SettingsPage' });
            setDesktopPingResult(`Recv: "${result.message}" @ ${result.receivedAt}`);
            console.log('[SettingsPingResult]', result);
        } catch (error) {
            console.error('[SettingsPingError]', error);
            setDesktopPingResult('Ping failed. See console.');
        }
    };

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
            alert("Dialog API not available.");
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
            alert("Dialog API not available.");
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
            alert("Desktop bridge not available. Run inside Electron to perform real checks.");
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
            alert("Error running tools check.");
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
            alert("Settings saved successfully to disk!");
            setIsDirty(false);
            checkAllTools();
        } catch (err) {
            console.error(err);
            alert("Failed to save settings.");
        }
    };

    const handleReset = () => {
        if (confirm("Reset all settings to defaults?")) {
            setSettings(DEFAULT_SETTINGS);
            setEngines(DEFAULT_ENGINES);
            setInstallPreference('manual');
            setIsDirty(true);
        }
    };

    return (
        <PageContainer className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">

            {/* Header */}
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h1 className="text-3xl font-bold text-tokens-fg tracking-tight">Gesu Settings</h1>
                    <p className="text-tokens-muted text-sm mt-1">Global configuration for paths, appearance, and tools.</p>
                </div>
                <Link to="/" className="px-4 py-2 bg-tokens-panel hover:bg-tokens-panel2 text-tokens-muted hover:text-tokens-fg rounded-lg text-sm border border-tokens-border transition-colors">
                    ← Back
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Workspace Paths */}
                <Card title={
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-cyan-500 rounded-full"></span>
                        Workspace Paths
                    </div>
                } className="lg:col-span-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                            <Input
                                label="Workflow Root"
                                value={settings.paths.workflowRoot}
                                onChange={(e) => updateSettings('paths', 'workflowRoot', e.target.value)}
                            />
                            <div className="flex justify-between items-center">
                                <p className="text-xs text-tokens-muted">Root folder for the entire Gesu ecosystem database.</p>
                                <Button size="sm" variant="secondary" onClick={() => handleBrowseFolder('paths', 'workflowRoot')}>Browse</Button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Input
                                label="Projects Root"
                                value={settings.paths.projectsRoot}
                                onChange={(e) => updateSettings('paths', 'projectsRoot', e.target.value)}
                            />
                            <div className="flex justify-between items-center">
                                <p className="text-xs text-tokens-muted">Directory where new projects will be initialized.</p>
                                <Button size="sm" variant="secondary" onClick={() => handleBrowseFolder('paths', 'projectsRoot')}>Browse</Button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Input
                                label="Backup Location"
                                value={settings.paths.backupRoot}
                                onChange={(e) => updateSettings('paths', 'backupRoot', e.target.value)}
                            />
                            <div className="flex justify-end items-center">
                                <Button size="sm" variant="secondary" onClick={() => handleBrowseFolder('paths', 'backupRoot')}>Browse</Button>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Engine Manager */}
                <Card title={
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-orange-500 rounded-full"></span>
                        Engine Manager
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
                    <p className="text-sm text-tokens-muted -mt-4 mb-6">Configure paths and check the status of external tools used by Gesu.</p>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {engines.map((engine) => (
                            <div key={engine.id} className="bg-tokens-panel2/30 border border-tokens-border rounded-xl p-4 flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-semibold text-tokens-fg text-sm">{engine.label}</div>
                                        <div className="text-[10px] text-tokens-muted">{engine.description}</div>
                                    </div>
                                    <StatusBadge status={engine.status} version={engine.version} />
                                </div>

                                <div className="flex gap-2 items-center">
                                    <input
                                        type="text"
                                        value={engine.path}
                                        onChange={(e) => updateEnginePath(engine.id, e.target.value)}
                                        placeholder="Enter absolute path..."
                                        className="flex-1 bg-tokens-panel border border-tokens-border rounded-lg px-3 py-1.5 text-tokens-fg focus:outline-none focus:ring-1 focus:ring-tokens-brand-DEFAULT/30 font-mono text-[10px]"
                                    />
                                    <Button size="sm" variant="ghost" onClick={() => handleBrowseTool(engine.id)} className="h-7 px-2 text-xs">Browse</Button>
                                    <Button size="sm" variant="ghost" onClick={() => detectEngine(engine.id)} title="Check this tool" className="h-7 px-2 text-xs">Check</Button>
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
                        {isCheckingTools ? 'Checking System...' : 'Run Global Tools Check'}
                    </Button>
                </Card>

                {/* Desktop Bridge Test (Dev) */}
                <Card title={
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-green-500 rounded-full"></span>
                        Desktop Bridge Test
                    </div>
                } className="lg:col-span-2">
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-tokens-muted">Verify IPC communication between React and Electron.</p>
                        <div className="flex items-center gap-4">
                            <span className="font-mono text-xs text-tokens-muted bg-tokens-panel2/50 px-3 py-1.5 rounded border border-tokens-border">
                                {desktopPingResult || 'No ping yet'}
                            </span>
                            <Button onClick={handleTestDesktopBridge}>Test Bridge</Button>
                        </div>
                    </div>
                </Card>

                {/* Appearance */}
                <Card title={
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-purple-500 rounded-full"></span>
                        Appearance
                    </div>
                } className="lg:col-span-2">

                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="flex flex-col gap-3">
                            <label className="text-sm font-medium text-tokens-muted">Color Theme</label>
                            <div className="flex bg-tokens-panel2 p-1 rounded-lg border border-tokens-border w-fit">
                                {['System', 'Dark', 'Light'].map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={() => updateSettings('appearance', 'theme', mode.toLowerCase())}
                                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${settings.appearance.theme === mode.toLowerCase()
                                            ? 'bg-tokens-brand-DEFAULT text-tokens-brand-contrast shadow-sm'
                                            : 'text-tokens-muted hover:text-tokens-fg'
                                            }`}
                                    >
                                        {mode}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <label className="text-sm font-medium text-tokens-muted">Accent Color</label>
                            <div className="flex gap-3">
                                {ACCENT_COLORS.map(color => (
                                    <button
                                        key={color.id}
                                        onClick={() => updateSettings('appearance', 'accentColor', color.id)}
                                        className={`w-8 h-8 rounded-full ${color.class} transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-tokens-bg focus:ring-tokens-border ${settings.appearance.accentColor === color.id ? 'ring-2 ring-tokens-fg scale-110' : ''
                                            }`}
                                        title={color.label}
                                    />
                                ))}
                            </div>
                        </div>

                        <label className="flex items-center gap-3 cursor-pointer group mt-auto mb-2">
                            <input
                                type="checkbox"
                                checked={settings.appearance.glassmorphism}
                                onChange={(e) => updateSettings('appearance', 'glassmorphism', e.target.checked)}
                                className="w-5 h-5 rounded border-tokens-border bg-tokens-panel2 text-purple-500 focus:ring-purple-500/40"
                            />
                            <span className="text-sm text-tokens-muted group-hover:text-tokens-fg transition-colors">Enable glassmorphism effects</span>
                        </label>
                    </div>
                </Card>

            </div>

            {/* Sticky Action Footer */}
            <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 bg-tokens-panel/90 backdrop-blur-md border border-tokens-border rounded-full px-6 py-3 flex gap-4 items-center shadow-2xl transition-all duration-300 ${isDirty ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
                <span className="text-sm text-tokens-muted font-medium">Unsaved changes</span>
                <div className="h-4 w-px bg-tokens-border"></div>
                <button
                    onClick={handleReset}
                    className="text-sm text-tokens-muted hover:text-tokens-fg transition-colors"
                >
                    Reset
                </button>
                <Button
                    variant="primary"
                    onClick={handleSave}
                    icon={<Save size={16} />}
                    iconPosition="circle"
                >
                    Save Settings
                </Button>
            </div>

        </PageContainer>
    );
}
