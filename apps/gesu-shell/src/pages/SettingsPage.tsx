import { useState, useEffect, useRef } from 'react';
import { GesuSettings } from '../types/settings';
import { Link } from 'react-router-dom';


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
type EngineStatus = 'unknown' | 'ok' | 'fallback' | 'missing' | 'error';
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
        workflowRoot: String.raw`D:\03. Resources\_Gesu's\WorkFlowDatabase`,
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
    const styles = {
        unknown: 'bg-gray-700 text-gray-300 border-gray-600',
        ok: 'bg-emerald-900/50 text-emerald-300 border-emerald-500/30',
        fallback: 'bg-yellow-900/50 text-yellow-300 border-yellow-500/30',
        missing: 'bg-red-900/50 text-red-300 border-red-500/30',
        error: 'bg-amber-900/50 text-amber-300 border-amber-500/30'
    };

    const labels = {
        unknown: 'Unknown',
        ok: 'Ready (Configured)',
        fallback: 'Ready (PATH)',
        missing: 'Missing',
        error: 'Error'
    };

    return (
        <div className={`px-2 py-0.5 rounded text-xs font-medium border flex items-center gap-2 w-fit ${styles[status]}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status === 'ok' ? 'bg-emerald-400' : status === 'fallback' ? 'bg-yellow-400' : status === 'missing' ? 'bg-red-400' : 'bg-gray-400'}`}></span>
            <span>{labels[status]}</span>
            {version && (status === 'ok' || status === 'fallback') && <span className="opacity-75 border-l pl-2 ml-1 border-white/20">{version}</span>}
        </div>
    );
};

export function SettingsPage() {
    const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
    const [engines, setEngines] = useState<EngineConfig[]>(DEFAULT_ENGINES);
    const [installPreference, setInstallPreference] = useState<InstallMethod>('manual');
    const [showInstallHints, setShowInstallHints] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [desktopPingResult, setDesktopPingResult] = useState<string | null>(null);
    const [isCheckingTools, setIsCheckingTools] = useState(false);

    // StrictMode guard
    const didLoadRef = useRef(false);

    // Load settings on mount
    useEffect(() => {
        if (didLoadRef.current) return;
        didLoadRef.current = true;

        if (window.gesu?.settings) {
            window.gesu.settings.read().then(loaded => {
                if (loaded) {
                    console.log('Loaded settings from bridge:', loaded);

                    // Merge with defaults to be safe on frontend side too
                    const mergedPaths = { ...DEFAULT_SETTINGS.paths, ...(loaded.paths || {}) };
                    const mergedAppearance = { ...DEFAULT_SETTINGS.appearance, ...(loaded.appearance || {}) };

                    // Hydrate state
                    setSettings({
                        paths: mergedPaths,
                        appearance: mergedAppearance
                    });

                    if (loaded.installPreference) {
                        setInstallPreference(loaded.installPreference);
                    }

                    // Hydrate engines
                    // Note: 'engines' allows for missing keys provided we check them safely
                    if (loaded.engines) {
                        setEngines(prev => prev.map(e => {
                            let newPath = e.path;
                            // Safe access with optional chaining or default fallback
                            if (e.id === 'ytDlp') newPath = loaded.engines?.ytDlpPath ?? '';
                            if (e.id === 'ffmpeg') newPath = loaded.engines?.ffmpegPath ?? '';
                            if (e.id === 'imageMagick') newPath = loaded.engines?.imageMagickPath ?? '';
                            if (e.id === 'libreOffice') newPath = loaded.engines?.libreOfficePath ?? '';

                            return { ...e, path: newPath };
                        }));
                    }
                }
            }).catch(err => console.error('Failed to load settings:', err));
        }
    }, []);

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

    const detectEngine = async (id: EngineId) => {
        // Just run a global check, it's fast enough and updates everything
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
            // Map engine array to payload
            const payload = {
                ytDlpPath: engines.find(e => e.id === 'ytDlp')?.path,
                ffmpegPath: engines.find(e => e.id === 'ffmpeg')?.path,
                imageMagickPath: engines.find(e => e.id === 'imageMagick')?.path,
                libreOfficePath: engines.find(e => e.id === 'libreOffice')?.path
            };

            const result = await window.gesu.checkTools(payload);
            console.log('[GlobalToolsCheck]', result);

            // Map result back to engines state
            setEngines(prev => prev.map(e => {
                let res = null;
                if (e.id === 'ytDlp') res = result.ytDlp;
                if (e.id === 'ffmpeg') res = result.ffmpeg;
                if (e.id === 'imageMagick') res = result.imageMagick;
                if (e.id === 'libreOffice') res = result.libreOffice;

                if (!res) return e;

                let status: EngineStatus = 'unknown';

                // Use resolution source to determine status
                if (res.resolution === 'configured') status = 'ok';
                else if (res.resolution === 'path') status = 'fallback';
                else if (res.resolution === 'missing') status = 'missing';

                // Fallback for logic safety
                if (res.status === 'not_found') status = 'missing';
                if (res.status === 'error') status = 'error';

                return {
                    ...e,
                    status,
                    // If we found it in PATH (fallback), we might want to suggest that path in UI or just keep user input?
                    // User requirement: "show actual resolved/used tool".
                    // If fallback, resolvedPath is the system path. We shouldn't overwrite the user's input field (e.path) 
                    // unless they explicitly asked to "Detect" or "Set".
                    // Keeping e.path as user input. We can show resolved path in tooltip or separate label if needed.
                    version: res.version || undefined,
                    lastCheckedAt: res.lastCheckedAt
                };
            }));

            // Note: Removed alert to valid annoyance
        } catch (err) {
            console.error(err);
            alert("Error running tools check.");
        } finally {
            setIsCheckingTools(false);
        }
    };

    // Global Actions
    const handleSave = async () => {
        // Construct GesuSettings object
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

        if (window.gesu?.settings) {
            try {
                await window.gesu.settings.write(payload);
                console.log("Settings Saved to Disk:", payload);
                alert("Settings saved successfully to disk!");
                setIsDirty(false);
                // Auto-refresh tools
                checkAllTools();
            } catch (err) {
                console.error(err);
                alert("Failed to save settings to key file.");
                // Fallback mock alert if save failed or logic is weird
            }
        } else {
            console.log("Settings Saved (Mock - No Bridge):", payload);
            alert("Settings saved successfully (Mock - No Bridge).");
            setIsDirty(false);
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
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">

            {/* Header */}
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Gesu Settings</h1>
                    <p className="text-gray-400 text-sm mt-1">Global configuration for paths, appearance, and tools.</p>
                </div>
                <Link to="/" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm border border-gray-700 transition-colors">
                    ← Back
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Workspace Paths */}
                <div className="lg:col-span-2 bg-gray-900/50 backdrop-blur-sm border border-gray-800 p-6 rounded-xl shadow-lg">
                    <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-cyan-500 rounded-full"></span>
                        Workspace Paths
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-gray-300">Workflow Root</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={settings.paths.workflowRoot}
                                    onChange={(e) => updateSettings('paths', 'workflowRoot', e.target.value)}
                                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 font-mono text-sm"
                                />
                                <button
                                    onClick={() => handleBrowseFolder('paths', 'workflowRoot')}
                                    className="px-3 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg text-xs font-medium border border-gray-600 transition-colors"
                                >
                                    Browse
                                </button>
                            </div>
                            <p className="text-xs text-gray-500">Root folder for the entire Gesu ecosystem database.</p>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-gray-300">Projects Root</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={settings.paths.projectsRoot}
                                    onChange={(e) => updateSettings('paths', 'projectsRoot', e.target.value)}
                                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 font-mono text-sm"
                                />
                                <button
                                    onClick={() => handleBrowseFolder('paths', 'projectsRoot')}
                                    className="px-3 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg text-xs font-medium border border-gray-600 transition-colors"
                                >
                                    Browse
                                </button>
                            </div>
                            <p className="text-xs text-gray-500">Directory where new projects will be initialized.</p>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-gray-300">Backup Location</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={settings.paths.backupRoot}
                                    onChange={(e) => updateSettings('paths', 'backupRoot', e.target.value)}
                                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 font-mono text-sm"
                                />
                                <button
                                    onClick={() => handleBrowseFolder('paths', 'backupRoot')}
                                    className="px-3 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg text-xs font-medium border border-gray-600 transition-colors"
                                >
                                    Browse
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Engine Manager */}
                <div className="lg:col-span-2 bg-gray-900/50 backdrop-blur-sm border border-gray-800 p-6 rounded-xl shadow-lg">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-orange-500 rounded-full"></span>
                                Engine Manager
                            </h2>
                            <p className="text-sm text-gray-400 mt-1">Configure paths and check the status of external tools used by Gesu.</p>
                        </div>

                        {/* Preference Selector */}
                        <div className="text-right">
                            <div className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Preferred Installer</div>
                            <div className="flex bg-gray-800 p-1 rounded-lg border border-gray-700">
                                {['Manual', 'Winget', 'Choco', 'Scoop'].map((method) => (
                                    <button
                                        key={method}
                                        onClick={() => setInstallPreference(method.toLowerCase() as InstallMethod)}
                                        className={`px-3 py-1 rounded text-xs font-medium transition-all ${installPreference === method.toLowerCase()
                                            ? 'bg-orange-600 text-white shadow-sm'
                                            : 'text-gray-400 hover:text-gray-200'
                                            }`}
                                    >
                                        {method}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {engines.map((engine) => (
                            <div key={engine.id} className="bg-gray-800/40 border border-gray-700 rounded-xl p-4 flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-semibold text-gray-200">{engine.label}</div>
                                        <div className="text-xs text-gray-500">{engine.description}</div>
                                    </div>
                                    <StatusBadge status={engine.status} version={engine.version} />
                                </div>

                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={engine.path}
                                        onChange={(e) => updateEnginePath(engine.id, e.target.value)}
                                        placeholder="Enter absolute path..."
                                        className="flex-1 bg-gray-900/50 border border-gray-600 rounded-lg px-3 py-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500/30 font-mono text-xs"
                                    />
                                    <button
                                        onClick={() => handleBrowseTool(engine.id)}
                                        className="px-3 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg text-xs font-medium border border-gray-600 transition-colors"
                                    >
                                        Browse
                                    </button>
                                    <button
                                        onClick={() => detectEngine(engine.id)}
                                        className="px-3 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg text-xs font-medium border border-gray-600 transition-colors"
                                        title="Check this tool (runs global check)"
                                    >
                                        Check
                                    </button>
                                </div>

                                <div className="flex justify-between items-center mt-1">
                                    <div className="text-xs text-gray-500">
                                        Last check: {engine.lastCheckedAt ? new Date(engine.lastCheckedAt).toLocaleTimeString() : 'Never'}
                                    </div>
                                    {installPreference !== 'manual' && engine.installHint[installPreference] && (
                                        <button
                                            onClick={() => setShowInstallHints(!showInstallHints)}
                                            className="text-xs text-orange-400 hover:text-orange-300 underline decoration-dotted"
                                        >
                                            {showInstallHints ? 'Hide command' : 'Install command'}
                                        </button>
                                    )}
                                </div>

                                {showInstallHints && installPreference !== 'manual' && engine.installHint[installPreference] && (
                                    <div className="mt-1 bg-black/40 p-2 rounded border border-gray-700/50 font-mono text-xs text-gray-400 select-all">
                                        &gt; {engine.installHint[installPreference]}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={checkAllTools}
                        disabled={isCheckingTools}
                        className="mt-6 w-full py-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-700 text-gray-300 rounded-lg text-sm font-medium transition-colors"
                    >
                        {isCheckingTools ? 'Checking System...' : 'Run Global Tools Check'}
                    </button>
                </div>

                {/* Desktop Bridge Test (Dev) */}
                <div className="lg:col-span-2 bg-gray-900/50 backdrop-blur-sm border border-gray-800 p-6 rounded-xl shadow-lg flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-green-500 rounded-full"></span>
                            Desktop Bridge Test
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">Verify IPC communication between React and Electron.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="font-mono text-xs text-gray-400 bg-black/30 px-3 py-1.5 rounded border border-gray-700/50">
                            {desktopPingResult || 'No ping yet'}
                        </span>
                        <button
                            onClick={handleTestDesktopBridge}
                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-200 rounded-lg text-sm transition-colors"
                        >
                            Test Bridge
                        </button>
                    </div>
                </div>

                {/* Appearance (Moved to bottom or kept side-by-side if space allows, usually bottom in single col or side in grid. Here sticking to grid flow) */}
                <div className="lg:col-span-2 bg-gray-900/50 backdrop-blur-sm border border-gray-800 p-6 rounded-xl shadow-lg h-fit">
                    <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-purple-500 rounded-full"></span>
                        Appearance
                    </h2>

                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="flex flex-col gap-3">
                            <label className="text-sm font-medium text-gray-300">Color Theme</label>
                            <div className="flex bg-gray-800 p-1 rounded-lg border border-gray-700 w-fit">
                                {['System', 'Dark', 'Light'].map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={() => updateSettings('appearance', 'theme', mode.toLowerCase())}
                                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${settings.appearance.theme === mode.toLowerCase()
                                            ? 'bg-gray-600 text-white shadow-sm'
                                            : 'text-gray-400 hover:text-gray-200'
                                            }`}
                                    >
                                        {mode}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <label className="text-sm font-medium text-gray-300">Accent Color</label>
                            <div className="flex gap-3">
                                {ACCENT_COLORS.map(color => (
                                    <button
                                        key={color.id}
                                        onClick={() => updateSettings('appearance', 'accentColor', color.id)}
                                        className={`w-8 h-8 rounded-full ${color.class} transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-gray-400 ${settings.appearance.accentColor === color.id ? 'ring-2 ring-white scale-110' : ''
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
                                className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500/40"
                            />
                            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Enable glassmorphism effects</span>
                        </label>
                    </div>
                </div>

            </div>

            {/* Sticky Action Footer */}
            <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900/90 backdrop-blur-md border border-gray-700 rounded-full px-6 py-3 flex gap-4 items-center shadow-2xl transition-all duration-300 ${isDirty ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
                <span className="text-sm text-gray-400 font-medium">Unsaved changes</span>
                <div className="h-4 w-px bg-gray-700"></div>
                <button
                    onClick={handleReset}
                    className="text-sm text-gray-300 hover:text-white transition-colors"
                >
                    Reset
                </button>
                <button
                    onClick={handleSave}
                    className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full font-semibold shadow-lg shadow-cyan-900/40 transition-all active:scale-[0.98]"
                >
                    Save Settings
                </button>
            </div>

        </div>
    );
}
