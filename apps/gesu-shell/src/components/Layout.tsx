import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Home, Rocket, Film, Compass, Target, Zap, Settings, Moon, Sun, ChevronRight, ChevronLeft } from 'lucide-react';
import gesuLogo from '../assets/icons/gcl-logo.ico';
import { FocusTimerPill } from './focus/FocusTimerPill';
import { DistractionGuard } from './focus/DistractionGuard';

// NavItem Component matching Reference (Pill shape, Left indicator/Rail)
const NavItem = ({ to, icon, label, isActive, isCollapsed }: { to: string, icon: React.ReactNode, label: string, isActive: boolean, isCollapsed: boolean }) => (
    <Link
        to={to}
        title={isCollapsed ? label : undefined}
        className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2.5 mx-2 rounded-lg transition-all duration-200 group relative 
        ${isActive
                ? 'bg-tokens-sidebar-active text-tokens-brand-DEFAULT font-medium shadow-sm ring-1 ring-tokens-border/50'
                : 'text-tokens-sidebar-muted hover:bg-tokens-sidebar-hover hover:text-tokens-brand-DEFAULT'}`}
    >
        <span className={`text-lg transition-transform duration-200 ${isActive ? 'scale-105' : 'opacity-70 group-hover:opacity-100 group-hover:scale-110'}`}>
            {icon}
        </span>

        {!isCollapsed && (
            <span className="text-sm truncate animate-in fade-in duration-200">{label}</span>
        )}

        {/* Active Rail Indicator (Left side) */}
        {isActive && !isCollapsed && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-tokens-brand-DEFAULT rounded-r-full shadow-[0_0_8px_var(--ring)]"></div>
        )}
    </Link>
);

// Theme Toggle Component
const ThemeToggle = ({ isCollapsed }: { isCollapsed: boolean }) => {
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');

    useEffect(() => {
        // Initialize theme from localStorage or default
        const saved = localStorage.getItem('gesu.theme') as 'light' | 'dark' | null;
        if (saved) {
            setTheme(saved);
            document.documentElement.setAttribute('data-theme', saved);
        } else {
            // Default to Light for Theme 1 reference? Or Dark for Theme 2?
            // User said: "Light mode MUST use Theme 1... Dark mode MUST use Theme 2".
            // Let's default to dark as per typical dev preference, or respecting system if needed.
            // Using Dark as default base.
            setTheme('dark');
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }, []);

    const toggle = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('gesu.theme', next);
    };

    return (
        <button
            onClick={toggle}
            className={`flex items-center ${isCollapsed
                ? 'justify-center w-8 h-8 mx-auto'
                : 'justify-between px-3 py-2 mx-2 border border-tokens-sidebar-border'
                } mt-auto mb-2 rounded-lg bg-tokens-panel/10 hover:bg-tokens-sidebar-hover transition-all group`}
            title="Toggle Theme"
        >
            <div className="flex items-center gap-2">
                <span className={isCollapsed ? '' : 'text-lg'}>{theme === 'dark' ? <Moon strokeWidth={1.5} size={isCollapsed ? 16 : 18} /> : <Sun strokeWidth={1.5} size={isCollapsed ? 16 : 18} />}</span>
                {!isCollapsed && <span className="text-xs font-medium text-tokens-sidebar-fg">Mode</span>}
            </div>
            {!isCollapsed && (
                <div className={`w-8 h-4 rounded-full p-0.5 flex ${theme === 'dark' ? 'bg-tokens-brand-DEFAULT justify-end' : 'bg-tokens-muted justify-start'}`}>
                    <div className="w-3 h-3 rounded-full bg-white shadow-sm"></div>
                </div>
            )}
        </button>
    );
}


export function Layout() {
    const location = useLocation();
    const p = location.pathname;

    // Persisted Sidebar State
    const [isCollapsed, setIsCollapsed] = useState(() => {
        try {
            const saved = localStorage.getItem('gesu.sidebarCollapsed');
            return saved ? JSON.parse(saved) : false;
        } catch {
            return false;
        }
    });

    const toggleSidebar = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem('gesu.sidebarCollapsed', JSON.stringify(newState));
    };

    return (
        <DistractionGuard>
            <div className="flex h-screen bg-tokens-bg text-tokens-fg font-sans overflow-hidden transition-colors duration-300">

                {/* Sidebar */}
                <aside
                    className={`${isCollapsed ? 'w-20' : 'w-64'} flex-shrink-0 bg-tokens-sidebar-bg border-r border-tokens-sidebar-border flex flex-col z-20 transition-[width] duration-300 ease-in-out`}
                >
                    {/* Logo Area */}
                    <div className={`h-16 flex items-center ${isCollapsed ? 'justify-center' : 'px-6'} border-b border-tokens-sidebar-border relative`}>
                        <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                            <img src={gesuLogo} alt="Gesu" className="w-full h-full object-contain" />
                        </div>
                        {!isCollapsed && (
                            <div className="ml-3 animate-in fade-in duration-300">
                                <h1 className="font-bold text-tokens-fg tracking-tight leading-none text-lg">Gesu</h1>
                                <span className="text-[10px] uppercase tracking-widest text-tokens-muted font-bold">Ecosystem</span>
                            </div>
                        )}

                        {/* Collapse Toggle */}
                        <button
                            onClick={toggleSidebar}
                            className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-tokens-panel border border-tokens-border rounded-full flex items-center justify-center text-xs text-tokens-sidebar-muted hover:text-tokens-fg hover:bg-tokens-panel2 transition-colors z-30 shadow-sm"
                            title={isCollapsed ? "Expand" : "Collapse"}
                        >
                            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 py-6 flex flex-col gap-1 overflow-y-auto scrollbar-hide">

                        {/* CORE Group */}
                        {!isCollapsed && <div className="text-[10px] font-bold text-tokens-sidebar-muted uppercase tracking-wider px-6 mb-2 mt-1 animate-in fade-in">Core</div>}
                        <NavItem to="/" icon={<Home strokeWidth={1.5} size={20} />} label="Dashboard" isActive={p === '/'} isCollapsed={isCollapsed} />
                        <NavItem to="/launcher" icon={<Rocket strokeWidth={1.5} size={20} />} label="Launcher" isActive={p === '/launcher'} isCollapsed={isCollapsed} />

                        {/* MODULES Group */}
                        {!isCollapsed && <div className="text-[10px] font-bold text-tokens-sidebar-muted uppercase tracking-wider px-6 mb-2 mt-6 animate-in fade-in">Modules</div>}
                        {isCollapsed && <div className="h-4"></div>}

                        <NavItem to="/media-suite" icon={<Film strokeWidth={1.5} size={20} />} label="Media Suite" isActive={p.startsWith('/media-suite')} isCollapsed={isCollapsed} />
                        <NavItem to="/compass" icon={<Compass strokeWidth={1.5} size={20} />} label="Compass" isActive={p.startsWith('/compass')} isCollapsed={isCollapsed} />
                        <NavItem to="/refocus" icon={<Target strokeWidth={1.5} size={20} />} label="Refocus" isActive={p.startsWith('/refocus')} isCollapsed={isCollapsed} />
                        <NavItem to="/initiator" icon={<Zap strokeWidth={1.5} size={20} />} label="Project Hub" isActive={p.startsWith('/initiator')} isCollapsed={isCollapsed} />
                    </nav>

                    {/* Bottom Controls */}
                    <div className={`p-4 border-t border-tokens-sidebar-border flex flex-col gap-2 ${isCollapsed ? 'items-center' : ''}`}>

                        <ThemeToggle isCollapsed={isCollapsed} />

                        <Link to="/settings" className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-3'} py-2 rounded-lg text-tokens-muted hover:text-tokens-fg hover:bg-tokens-sidebar-hover transition-colors`}>
                            <span className="text-lg"><Settings strokeWidth={1.5} size={20} /></span>
                            {!isCollapsed && <span className="text-sm font-medium">Settings</span>}
                        </Link>

                        {/* User Profile */}
                        <div className={`mt-2 flex items-center gap-3 ${isCollapsed ? 'justify-center' : 'px-2 py-2 rounded-lg bg-tokens-panel/50 border border-tokens-border'}`}>
                            <div className="w-8 h-8 rounded-full bg-tokens-brand-DEFAULT flex items-center justify-center text-tokens-brand-foreground text-xs font-bold shrink-0">
                                SU
                            </div>
                            {!isCollapsed && (
                                <div className="flex-1 min-w-0 animate-in fade-in">
                                    <div className="text-xs font-medium text-tokens-fg truncate">Surya</div>
                                    <div className="text-[10px] text-tokens-muted truncate">Workspace</div>
                                </div>
                            )}
                            {!isCollapsed && <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.4)]"></div>}
                        </div>
                    </div>

                </aside>

                {/* Main Content */}
                <main className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden relative bg-tokens-bg">
                    {/* Global Timer Header */}
                    <div className="sticky top-0 z-10 flex items-center justify-end gap-2 px-6 py-3 bg-tokens-panel/80 backdrop-blur-sm border-b border-tokens-border">
                        <FocusTimerPill />
                    </div>
                    <Outlet />
                </main>
            </div>
        </DistractionGuard>
    );
}
