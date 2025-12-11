import { useState } from 'react';
import { Link } from 'react-router-dom';

// --- Types & Interfaces ---

interface ToolConfig {
    path: string;
    status: 'valid' | 'invalid' | 'unknown';
}

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
    tools: {
        ytDlp: string;
        ffmpeg: string;
        soffice: string;
        integrationEnabled: boolean;
    };
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
    },
    tools: {
        ytDlp: String.raw`C:\Tools\yt-dlp\yt-dlp.exe`,
        ffmpeg: String.raw`C:\Tools\ffmpeg\bin\ffmpeg.exe`,
        soffice: String.raw`C:\Program Files\LibreOffice\program\soffice.exe`,
        integrationEnabled: true
    }
};

const ACCENT_COLORS = [
    { id: 'cyan', label: 'Cyan', class: 'bg-cyan-500' },
    { id: 'purple', label: 'Purple', class: 'bg-purple-500' },
    { id: 'emerald', label: 'Emerald', class: 'bg-emerald-500' },
    { id: 'rose', label: 'Rose', class: 'bg-rose-500' },
    { id: 'orange', label: 'Orange', class: 'bg-orange-500' }
];

export function SettingsPage() {
    const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
    const [isDirty, setIsDirty] = useState(false);

    // Handlers
    const updatedNestedState = (section: keyof SettingsState, key: string, value: any) => {
        setSettings(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: value
            }
        }));
        setIsDirty(true);
    };

    const handleSave = () => {
        const payload = {
            timestamp: new Date().toISOString(),
            config: settings
        };
        console.log("Settings Saved (Mock):", payload);
        alert("Settings saved successfully (Mock). Check console for payload.");
        setIsDirty(false);
    };

    const handleReset = () => {
        if (confirm("Reset all settings to defaults?")) {
            setSettings(DEFAULT_SETTINGS);
            setIsDirty(true);
        }
    };

    const handleToolsCheck = () => {
        console.log("Running Tools Check (Mock):", {
            tools: settings.tools,
            checkTime: new Date().toISOString()
        });
        alert("Tools check initiated (Mock).");
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
                            <input
                                type="text"
                                value={settings.paths.workflowRoot}
                                onChange={(e) => updatedNestedState('paths', 'workflowRoot', e.target.value)}
                                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 font-mono text-sm"
                            />
                            <p className="text-xs text-gray-500">Root folder for the entire Gesu ecosystem database.</p>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-gray-300">Projects Root</label>
                            <input
                                type="text"
                                value={settings.paths.projectsRoot}
                                onChange={(e) => updatedNestedState('paths', 'projectsRoot', e.target.value)}
                                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 font-mono text-sm"
                            />
                            <p className="text-xs text-gray-500">Directory where new projects will be initialized.</p>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-gray-300">Backup Location</label>
                            <input
                                type="text"
                                value={settings.paths.backupRoot}
                                onChange={(e) => updatedNestedState('paths', 'backupRoot', e.target.value)}
                                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 font-mono text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Appearance */}
                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 p-6 rounded-xl shadow-lg h-fit">
                    <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-purple-500 rounded-full"></span>
                        Appearance
                    </h2>

                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-3">
                            <label className="text-sm font-medium text-gray-300">Color Theme</label>
                            <div className="flex bg-gray-800 p-1 rounded-lg border border-gray-700 w-fit">
                                {['System', 'Dark', 'Light'].map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={() => updatedNestedState('appearance', 'theme', mode.toLowerCase())}
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
                                        onClick={() => updatedNestedState('appearance', 'accentColor', color.id)}
                                        className={`w-8 h-8 rounded-full ${color.class} transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-gray-400 ${settings.appearance.accentColor === color.id ? 'ring-2 ring-white scale-110' : ''
                                            }`}
                                        title={color.label}
                                    />
                                ))}
                            </div>
                        </div>

                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={settings.appearance.glassmorphism}
                                onChange={(e) => updatedNestedState('appearance', 'glassmorphism', e.target.checked)}
                                className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500/40"
                            />
                            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Enable glassmorphism effects</span>
                        </label>
                    </div>
                </div>

                {/* Tools & Integrations */}
                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 p-6 rounded-xl shadow-lg h-fit">
                    <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-orange-500 rounded-full"></span>
                        Tools & Integrations
                    </h2>

                    <div className="flex flex-col gap-5">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-gray-300">yt-dlp Path</label>
                            <input
                                type="text"
                                value={settings.tools.ytDlp}
                                onChange={(e) => updatedNestedState('tools', 'ytDlp', e.target.value)}
                                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500/50 font-mono text-xs"
                            />
                            <span className="text-xs text-orange-400/80">⚠️ Not validated (Mock)</span>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-gray-300">ffmpeg Path</label>
                            <input
                                type="text"
                                value={settings.tools.ffmpeg}
                                onChange={(e) => updatedNestedState('tools', 'ffmpeg', e.target.value)}
                                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500/50 font-mono text-xs"
                            />
                        </div>

                        <label className="flex items-center gap-3 cursor-pointer group mt-2">
                            <input
                                type="checkbox"
                                checked={settings.tools.integrationEnabled}
                                onChange={(e) => updatedNestedState('tools', 'integrationEnabled', e.target.checked)}
                                className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-orange-500 focus:ring-orange-500/40"
                            />
                            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Enable Antigravity integration</span>
                        </label>

                        <button
                            onClick={handleToolsCheck}
                            className="mt-2 w-full py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
                        >
                            Run Tools Check (Mock)
                        </button>
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
