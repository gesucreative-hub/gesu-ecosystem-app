import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

// --- Types & Interfaces ---

interface ProjectOptions {
    includeMedia: boolean;
    includeNotion: boolean;
    includeLog: boolean;
    gitInit: boolean;
}

// --- Constants ---

const PROJECT_TYPES = [
    'Client Project',
    'Personal Exploration',
    'Content Series',
    'Internal Tool',
    'Asset Library'
];

const CATEGORIES = [
    '3D / ArchViz',
    'Event / Wedding',
    'Motion / VJ',
    'Dev / Code',
    'Admin / Ops',
    'Audio / Sound'
];

const TEMPLATES = [
    { id: 'archviz', name: 'Event ArchViz (Standard)', desc: 'Structure for venue modeling and rendering.' },
    { id: 'wedding', name: 'Wedding Visual', desc: 'Optimized for high-volume video processing.' },
    { id: 'general', name: 'General Creative', desc: 'Blank slate for mixed media.' },
    { id: 'admin', name: 'Admin / Ops', desc: 'Documentation and spreadsheet focus.' },
    { id: 'empty', name: 'Empty / Custom', desc: 'Minimal structure.' }
];

// --- Mock Project Code Generator ---
const generateProjectCode = (type: string, name: string) => {
    const prefix = type === 'Client Project' ? 'CLT'
        : type === 'Personal Exploration' ? 'EXP'
            : type === 'Internal Tool' ? 'INT'
                : 'GEN';

    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    // Simple slug for name
    const slug = name.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');

    return `${prefix}-${year}${month}-${slug || '001'}`;
};

export function InitiatorPage() {
    // State
    const [name, setName] = useState('');
    const [type, setType] = useState(PROJECT_TYPES[0]);
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [description, setDescription] = useState('');
    const [templateId, setTemplateId] = useState(TEMPLATES[0].id);

    const [options, setOptions] = useState<ProjectOptions>({
        includeMedia: true,
        includeNotion: true,
        includeLog: true,
        gitInit: false
    });

    // Derived State
    const projectCode = useMemo(() => generateProjectCode(type, name), [type, name]);
    const selectedTemplate = TEMPLATES.find(t => t.id === templateId) || TEMPLATES[0];
    const projectRoot = `D:\\01. Projects\\${projectCode}_${name.trim().replace(/[\s\W]+/g, '-') || 'Untitled'}`;

    // Handlers
    const handleOptionToggle = (key: keyof ProjectOptions) => {
        setOptions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleGenerate = () => {
        if (!name.trim()) {
            alert("Please enter a project name.");
            return;
        }

        const payload = {
            timestamp: new Date().toISOString(),
            project: {
                name,
                code: projectCode,
                type,
                category,
                description,
                rootPath: projectRoot
            },
            template: selectedTemplate,
            options
        };

        console.log("Generate Project (Mock):", payload);
        alert(`Mock Project Generated:\n${projectCode}\n\nCheck console for payload.`);
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">

            {/* Header */}
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Gesu Initiator</h1>
                    <p className="text-gray-400 text-sm mt-1">Create new projects with consistent structure.</p>
                </div>
                <Link to="/" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm border border-gray-700 transition-colors">
                    ← Back
                </Link>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">

                {/* LEFT COLUMN (2/3 width) - Form */}
                <div className="flex-1 bg-gray-900/50 backdrop-blur-sm border border-gray-800 p-6 rounded-xl shadow-lg h-fit">
                    <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-rose-500 rounded-full"></span>
                        Project Setup
                    </h2>

                    <div className="flex flex-col gap-6">

                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-300">Project Name <span className="text-rose-400">*</span></label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Neo Tokyo Tower"
                                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                                    autoFocus
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-300">Project Type</label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-rose-500/50 appearance-none"
                                >
                                    {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-300">Category / Discipline</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-rose-500/50 appearance-none"
                                >
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-gray-300">Description / Brief</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={2}
                                placeholder="Optional project summary..."
                                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-rose-500/50 resize-y"
                            />
                        </div>

                        <div className="h-px bg-gray-800 my-2"></div>

                        {/* Templates & Options */}
                        <h3 className="text-md font-medium text-gray-200">Template & Options</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-300">Directory Template</label>
                                <div className="flex flex-col gap-2">
                                    {TEMPLATES.map(t => (
                                        <label key={t.id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${templateId === t.id ? 'bg-rose-900/20 border-rose-500/50' : 'bg-gray-800/40 border-gray-700 hover:bg-gray-800'}`}>
                                            <input
                                                type="radio"
                                                name="template"
                                                checked={templateId === t.id}
                                                onChange={() => setTemplateId(t.id)}
                                                className="mt-1 text-rose-500 focus:ring-rose-500 bg-gray-700 border-gray-600"
                                            />
                                            <div>
                                                <div className="text-sm font-medium text-gray-200">{t.name}</div>
                                                <div className="text-xs text-gray-400">{t.desc}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <label className="text-sm font-medium text-gray-300">Features</label>

                                <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer group">
                                    <input type="checkbox" checked={options.includeMedia} onChange={() => handleOptionToggle('includeMedia')} className="rounded border-gray-600 bg-gray-700 text-rose-500 focus:ring-rose-500/40" />
                                    <span className="group-hover:text-gray-200">Include Media Folders</span>
                                </label>

                                <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer group">
                                    <input type="checkbox" checked={options.includeNotion} onChange={() => handleOptionToggle('includeNotion')} className="rounded border-gray-600 bg-gray-700 text-rose-500 focus:ring-rose-500/40" />
                                    <span className="group-hover:text-gray-200">Include Docs / Notion</span>
                                </label>

                                <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer group">
                                    <input type="checkbox" checked={options.includeLog} onChange={() => handleOptionToggle('includeLog')} className="rounded border-gray-600 bg-gray-700 text-rose-500 focus:ring-rose-500/40" />
                                    <span className="group-hover:text-gray-200">Create Project Log Entry</span>
                                </label>

                                <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer group">
                                    <input type="checkbox" checked={options.gitInit} onChange={() => handleOptionToggle('gitInit')} className="rounded border-gray-600 bg-gray-700 text-rose-500 focus:ring-rose-500/40" />
                                    <span className="group-hover:text-gray-200">Initialize Git Repository</span>
                                </label>
                            </div>
                        </div>

                        <button
                            onClick={handleGenerate}
                            className="mt-4 w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-semibold shadow-lg shadow-rose-900/40 transition-all active:scale-[0.98]"
                        >
                            Generate Project (Mock)
                        </button>
                    </div>
                </div>

                {/* RIGHT COLUMN (1/3 width) - Preview */}
                <div className="lg:w-80 xl:w-96 bg-gray-900/50 backdrop-blur-sm border border-gray-800 p-6 rounded-xl shadow-lg h-fit">
                    <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-rose-400 rounded-full"></span>
                        Preview
                    </h2>

                    <div className="flex flex-col gap-6">
                        <div>
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Project Code</div>
                            <div className="font-mono text-xl text-rose-300">{projectCode}</div>
                        </div>

                        <div>
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Target Path</div>
                            <div className="font-mono text-xs text-gray-400 break-all bg-gray-950/50 p-2 rounded border border-gray-800">
                                {projectRoot}
                            </div>
                        </div>

                        <div>
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Structure Preview</div>
                            <div className="text-sm text-gray-300 bg-gray-800/20 rounded p-3 border border-gray-700/50 flex flex-col gap-1 font-mono">
                                <div>📁 00_Admin</div>
                                {options.includeNotion && <div>&nbsp;&nbsp;📄 Brief.md</div>}
                                <div>📁 01_Work</div>
                                {options.includeMedia && <div>📁 02_Assets</div>}
                                {options.includeMedia && <div>📁 03_Render</div>}
                                <div>📁 99_Delivery</div>
                                <div>📄 project.meta.json</div>
                            </div>
                        </div>

                        <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-3 text-xs text-yellow-500/80 leading-relaxed">
                            <strong>Note:</strong> Actual folder creation will be handled by the Electron backend in a future update. This is currently a UI mockup.
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}
