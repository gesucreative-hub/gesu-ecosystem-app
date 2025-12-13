import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

const NavItem = ({ to, icon, label, isActive, isCollapsed }: { to: string, icon: string, label: string, isActive: boolean, isCollapsed: boolean }) => (
    <Link
        to={to}
        title={isCollapsed ? label : undefined}
        className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 rounded-xl transition-all duration-200 group relative ${isActive ? 'bg-gesu-primary-bg text-gesu-primary-light' : 'text-gesu-text-muted hover:bg-gesu-card-hover hover:text-gesu-text-main'}`}
    >
        <span className={`text-xl transition-all duration-300 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]' : 'opacity-70 group-hover:opacity-100 group-hover:scale-110'}`}>{icon}</span>

        {!isCollapsed && (
            <span className="font-medium text-sm animate-in fade-in duration-200">{label}</span>
        )}

        {isActive && !isCollapsed && (
            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gesu-primary shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>
        )}
    </Link>
);

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
        <div className="flex h-screen bg-gesu-bg text-gesu-text-main font-sans selection:bg-gesu-primary selection:text-white overflow-hidden">

            {/* Sidebar */}
            <aside
                className={`${isCollapsed ? 'w-20' : 'w-64'} flex-shrink-0 bg-gesu-card/90 border-r border-gesu-border flex flex-col backdrop-blur-md z-20 transition-[width] duration-300 ease-in-out`}
            >
                {/* Logo Area */}
                <div className={`h-16 flex items-center ${isCollapsed ? 'justify-center' : 'px-6'} border-b border-gesu-border relative`}>
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gesu-primary-hover to-gesu-primary-700 flex items-center justify-center shadow-lg shadow-gesu-primary/20 shrink-0">
                        <span className="font-bold text-white font-mono">G</span>
                    </div>
                    {!isCollapsed && (
                        <div className="ml-3 animate-in fade-in duration-300">
                            <h1 className="font-bold text-gray-100 tracking-tight leading-none">Gesu</h1>
                            <span className="text-[10px] uppercase tracking-widest text-gesu-text-dim font-semibold">Ecosystem</span>
                        </div>
                    )}

                    {/* Toggle Button */}
                    <button
                        onClick={toggleSidebar}
                        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gesu-card border border-gesu-border rounded-full flex items-center justify-center text-xs text-gesu-text-muted hover:text-white hover:bg-gesu-border transition-colors z-30 shadow-sm"
                        title={isCollapsed ? "Expand" : "Collapse"}
                    >
                        {isCollapsed ? '→' : '←'}
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-6 flex flex-col gap-1 overflow-y-auto scrollbar-hide">
                    {!isCollapsed && <div className="text-xs font-semibold text-gesu-text-dim uppercase tracking-wider px-4 mb-2 animate-in fade-in">Core</div>}
                    <NavItem to="/" icon="🏠" label="Dashboard" isActive={p === '/'} isCollapsed={isCollapsed} />
                    <NavItem to="/launcher" icon="🚀" label="Launcher" isActive={p === '/launcher'} isCollapsed={isCollapsed} />

                    {!isCollapsed && <div className="text-xs font-semibold text-gesu-text-dim uppercase tracking-wider px-4 mb-2 mt-6 animate-in fade-in">Modules</div>}
                    {isCollapsed && <div className="h-4"></div>} {/* Spacer for collapsed mode */}

                    <NavItem to="/media-suite" icon="🎬" label="Media Suite" isActive={p.startsWith('/media-suite')} isCollapsed={isCollapsed} />
                    <NavItem to="/compass" icon="🧭" label="Compass" isActive={p.startsWith('/compass')} isCollapsed={isCollapsed} />
                    <NavItem to="/refocus" icon="🎯" label="Refocus" isActive={p.startsWith('/refocus')} isCollapsed={isCollapsed} />
                    <NavItem to="/initiator" icon="⚡" label="Initiator" isActive={p.startsWith('/initiator')} isCollapsed={isCollapsed} />

                    <div className="mt-auto pt-6 border-t border-gesu-border/50">
                        <NavItem to="/settings" icon="⚙️" label="Settings" isActive={p.startsWith('/settings')} isCollapsed={isCollapsed} />
                    </div>
                </nav>

                {/* User / Footer */}
                <div className={`p-4 border-t border-gesu-border ${isCollapsed ? 'flex justify-center' : ''}`}>
                    <div className={`flex items-center gap-3 px-2 py-2 rounded-lg bg-gesu-card-hover/50 border border-gesu-border ${isCollapsed ? 'justify-center p-0 border-none bg-transparent' : ''}`}>
                        <div className="w-8 h-8 rounded-full bg-gesu-primary-bg flex items-center justify-center text-gesu-primary-light text-xs font-bold border border-gesu-primary/20 shrink-0">
                            SU
                        </div>
                        {!isCollapsed && (
                            <div className="flex-1 min-w-0 animate-in fade-in">
                                <div className="text-xs font-medium text-gesu-text-main truncate">Surya</div>
                                <div className="text-[10px] text-gesu-text-dim truncate">Local Workspace</div>
                            </div>
                        )}
                        {!isCollapsed && (
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="System Online"></div>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col overflow-hidden relative bg-gesu-bg">
                {/* Background Decor */}
                <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-gesu-primary/5 to-transparent pointer-events-none"></div>

                {/* Content */}
                <div className="flex-1 overflow-auto relative z-10 w-full flex flex-col">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
