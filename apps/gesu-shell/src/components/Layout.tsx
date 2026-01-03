import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Film, Compass, Target, Zap, Moon, Sun, ChevronRight, ChevronLeft, Search, BarChart2, User, Briefcase, ShieldAlert, Users, Building2, Receipt, FileSignature, Tag, Package, FileStack, TrendingUp, Brain } from 'lucide-react';
import { usePersona } from '../hooks/usePersona';
import { isSessionActive } from '../stores/focusTimerStore';
import gesuLogo from '../assets/icons/gcl-logo.ico';
import { FocusTimerPill } from './focus/FocusTimerPill';
import { DistractionGuard } from './focus/DistractionGuard';
import { CommandPaletteModal } from './CommandPaletteModal';
import { AchievementToast } from './AchievementToast';
import { useAuth } from '../contexts/AuthContext';
import { LoginButton } from './auth/LoginButton';
import { UserMenu } from './auth/UserMenu';
import { SchemaWarningBanner } from './SchemaWarningBanner';
import { DailyCheckInBanner } from './DailyCheckInBanner';

// NavItem Component matching Reference (Pill shape, Left indicator/Rail)
import { Tabs } from './Tabs';
interface NavItemProps {
    to: string;
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    isCollapsed: boolean;
    badgeCount?: number;
}

const NavItem = ({ to, icon, label, isActive, isCollapsed, badgeCount }: NavItemProps) => (
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
            <span className="text-sm truncate animate-in fade-in duration-200 flex-1">{label}</span>
        )}

        {/* Badge */}
        {badgeCount !== undefined && badgeCount > 0 && (
            <span className={`flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-tokens-error text-[10px] font-bold text-white shadow-sm ${isCollapsed ? 'absolute -top-1 -right-1' : ''}`}>
                {badgeCount}
            </span>
        )}

        {/* Active Rail Indicator (Left side) with Glow */}
        {isActive && !isCollapsed && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-tokens-brand-DEFAULT rounded-r-full shadow-[0_0_15px_var(--tokens-brand)]"></div>
        )}
    </Link>
);

// Theme Toggle Component
const ThemeToggle = ({ isCollapsed }: { isCollapsed: boolean }) => {
    const { t } = useTranslation('common');
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');

    useEffect(() => {
        // Initialize theme from localStorage or default
        const saved = localStorage.getItem('gesu.theme') as 'light' | 'dark' | null;
        if (saved) {
            setTheme(saved);
            document.documentElement.setAttribute('data-theme', saved);
        } else {
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
            title={t('tooltips.toggleTheme', 'Toggle Theme')}
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

// Persona Toggle Component - S2-3/S2-4
const PersonaToggle = ({ isCollapsed }: { isCollapsed: boolean }) => {
    const { t } = useTranslation('common');
    const { t: tFocus } = useTranslation('focus');
    const { activePersona, setActivePersona } = usePersona();
    const [showBlockedToast, setShowBlockedToast] = useState(false);

    const handleSwitch = (newPersona: 'personal' | 'business') => {
        // S2-3/S2-4: Block persona switch during focus
        if (isSessionActive()) {
            setShowBlockedToast(true);
            // Auto-dismiss after 3 seconds
            setTimeout(() => setShowBlockedToast(false), 3000);
            return;
        }
        setActivePersona(newPersona);
    };

    // S2-4: Blocked toast component (inline for persona context)
    const PersonaBlockedToast = () => (
        <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center gap-3 px-4 py-3 bg-tokens-bg border border-amber-500/30 rounded-lg shadow-lg max-w-sm">
                <div className="p-2 bg-amber-500/10 rounded-lg shrink-0">
                    <ShieldAlert className="w-5 h-5 text-amber-500" />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-medium text-tokens-fg truncate">
                        {tFocus('distractionShield.blocked', 'Focus session active')}
                    </p>
                    <p className="text-xs text-tokens-muted">
                        {tFocus('distractionShield.finishFirst', 'Finish your session to switch persona', { screen: 'persona' })}
                    </p>
                </div>
            </div>
        </div>
    );

    if (isCollapsed) {
        // Collapsed: Show only active persona icon
        const Icon = activePersona === 'personal' ? User : Briefcase;
        return (
            <>
                <button
                    onClick={() => handleSwitch(activePersona === 'personal' ? 'business' : 'personal')}
                    className="w-10 h-10 rounded-lg bg-tokens-brand-DEFAULT/10 hover:bg-tokens-brand-DEFAULT/20 flex items-center justify-center transition-colors"
                    title={t(`persona.${activePersona}`)}
                >
                    <Icon size={18} className="text-tokens-brand-DEFAULT" />
                </button>
                {showBlockedToast && <PersonaBlockedToast />}
            </>
        );
    }

    // Full: Segmented control
    return (
        <div className="relative">
            <Tabs
                tabs={[
                    { id: 'personal', label: t('persona.personal'), icon: <User size={14} /> },
                    { id: 'business', label: t('persona.business'), icon: <Briefcase size={14} /> }
                ]}
                activeTab={activePersona}
                onChange={(id) => handleSwitch(id as 'personal' | 'business')}
                size="sm"
                className="w-full justify-center"
            />
            {showBlockedToast && <PersonaBlockedToast />}
        </div>
    );
};

// Auth User Section - Shows login button or user menu based on auth state
const UserAuthSection = ({ isCollapsed }: { isCollapsed: boolean }) => {
    const { t } = useTranslation('common');
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center p-4">
                <div className="w-5 h-5 border-2 border-tokens-muted border-t-tokens-brand-DEFAULT rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) {
        return isCollapsed ? (
            <button
                onClick={() => window.location.href = '#login'}
                className="w-10 h-10 rounded-lg bg-tokens-brand-DEFAULT/10 hover:bg-tokens-brand-DEFAULT/20 flex items-center justify-center transition-colors"
                title={t('tooltips.signIn', 'Sign In')}
            >
                <User size={18} className="text-tokens-brand-DEFAULT" />
            </button>
        ) : (
            <LoginButton />
        );
    }

    return <UserMenu isCollapsed={isCollapsed} />;
};

export function Layout() {
    const location = useLocation();
    const navigate = useNavigate();
    const p = location.pathname;
    const { t } = useTranslation('common');
    const { activePersona } = usePersona();

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

    // Command Palette State
    const [isCommandOpen, setIsCommandOpen] = useState(false);

    // Global Key Listener for Cmd+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsCommandOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // S2-3: Persona-aware redirect for incompatible routes
    useEffect(() => {
        const path = location.pathname;
        
        // Personal routes (S8: added second-brain)
        const personalRoutes = ['/compass', '/activity', '/refocus', '/second-brain'];
        // Business routes (S5 + S6 + S7: clients, settings, pricelist, invoices, contracts, deliverables, finance)
        const businessRoutes = ['/initiator', '/clients', '/business-settings', '/pricelist', '/invoices', '/contracts', '/deliverable-templates', '/deliverables', '/finance'];
        
        if (activePersona === 'business' && personalRoutes.some(r => path.startsWith(r))) {
            navigate('/initiator', { replace: true });
        } else if (activePersona === 'personal' && businessRoutes.some(r => path.startsWith(r))) {
            navigate('/compass', { replace: true });
        }
    }, [activePersona, location.pathname, navigate]);

    return (
        <DistractionGuard>
            <div className="flex h-screen bg-tokens-bg text-tokens-fg font-sans overflow-hidden transition-colors duration-300 p-3">

                <CommandPaletteModal isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
                <AchievementToast />

                {/* Sidebar - Floating Squircle Style */}
                <aside
                    className={`${isCollapsed ? 'w-20' : 'w-64'} flex-shrink-0 bg-tokens-sidebar-bg rounded-2xl shadow-lg flex flex-col z-20 transition-[width] duration-300 ease-in-out`}
                >
                    {/* Logo Area */}
                    <div className={`h-16 flex items-center ${isCollapsed ? 'justify-center' : 'px-6 justify-between'} border-b border-tokens-sidebar-border/50`}>
                        <div className="flex items-center">
                            <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                                <img src={gesuLogo} alt="Gesu" className="w-full h-full object-contain" />
                            </div>
                            {!isCollapsed && (
                                <div className="ml-3 animate-in fade-in duration-300">
                                    <h1 className="font-bold text-tokens-fg tracking-tight leading-none text-lg">Gesu</h1>
                                    <span className="text-[10px] uppercase tracking-widest text-tokens-muted font-bold">Ecosystem</span>
                                </div>
                            )}
                        </div>
                        {/* Collapse Toggle - Inside Sidebar */}
                        {!isCollapsed && (
                            <button
                                onClick={toggleSidebar}
                                className="w-7 h-7 rounded-lg bg-tokens-panel/50 hover:bg-tokens-sidebar-hover flex items-center justify-center text-tokens-sidebar-muted hover:text-tokens-fg transition-colors"
                                title={t('tooltips.collapseSidebar', 'Collapse sidebar')}
                            >
                                <ChevronLeft size={16} />
                            </button>
                        )}
                    </div>

                    {/* Expand button when collapsed */}
                    {isCollapsed && (
                        <div className="px-3 pt-4 pb-2 flex justify-center">
                            <button
                                onClick={toggleSidebar}
                                className="w-10 h-10 rounded-lg bg-tokens-panel/50 hover:bg-tokens-sidebar-hover flex items-center justify-center text-tokens-sidebar-muted hover:text-tokens-fg transition-colors"
                                title={t('tooltips.expandSidebar', 'Expand sidebar')}
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    )}

                    {/* Global Command Button (Ctrl+K) */}
                    <div className="px-3 pt-4 pb-2">
                        <button
                            onClick={() => setIsCommandOpen(true)}
                            className={`w-full flex items-center ${isCollapsed ? 'justify-center h-10' : 'justify-between px-3 py-2'} rounded-lg border border-tokens-border bg-tokens-panel/30 hover:bg-tokens-sidebar-hover text-tokens-muted hover:text-tokens-fg transition-all shadow-sm`}
                            title={t('tooltips.quickCommand', 'Quick Command (Ctrl+K)')}
                        >
                            <div className="flex items-center gap-2">
                                <Search size={16} />
                                {!isCollapsed && <span className="text-sm">{t('nav.search', 'Search...')}</span>}
                            </div>
                            {!isCollapsed && (
                                <span className="text-[10px] font-mono opacity-50 border border-tokens-border rounded px-1.5 py-0.5">
                                    Ctrl+K
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 py-2 flex flex-col gap-1 overflow-y-auto scrollbar-hide">

                        {/* CORE Group - Dashboard > Compass > Activity > Project Hub */}
                        {!isCollapsed && <div className="text-[10px] font-bold text-tokens-sidebar-muted uppercase tracking-wider px-6 mb-2 mt-2 animate-in fade-in">{t('nav.coreGroup', 'Core')}</div>}

                        <NavItem to="/dashboard" icon={<Home strokeWidth={1.5} size={20} />} label={t('nav.dashboard')} isActive={p === '/' || p === '/dashboard'} isCollapsed={isCollapsed} />
                        {activePersona === "personal" && <NavItem to="/compass" icon={<Compass strokeWidth={1.5} size={20} />} label={t("nav.compass")} isActive={p.startsWith("/compass")} isCollapsed={isCollapsed} />}
                        {activePersona === 'personal' && <NavItem to="/activity" icon={<BarChart2 strokeWidth={1.5} size={20} />} label={t('nav.activity')} isActive={p.startsWith('/activity')} isCollapsed={isCollapsed} />}
                        {activePersona === 'personal' && <NavItem to="/second-brain" icon={<Brain strokeWidth={1.5} size={20} />} label={t('nav.secondBrain', 'Second Brain')} isActive={p.startsWith('/second-brain')} isCollapsed={isCollapsed} />}
                        {activePersona === 'business' && <NavItem to="/initiator" icon={<Zap strokeWidth={1.5} size={20} />} label={t('nav.projectHub')} isActive={p.startsWith('/initiator')} isCollapsed={isCollapsed} />}
                        {activePersona === 'business' && <NavItem to="/clients" icon={<Users strokeWidth={1.5} size={20} />} label={t('nav.clients', 'Clients')} isActive={p.startsWith('/clients')} isCollapsed={isCollapsed} />}
                        {activePersona === 'business' && <NavItem to="/invoices" icon={<Receipt strokeWidth={1.5} size={20} />} label={t('nav.invoices', 'Invoices')} isActive={p.startsWith('/invoices')} isCollapsed={isCollapsed} />}
                        {activePersona === 'business' && <NavItem to="/contracts" icon={<FileSignature strokeWidth={1.5} size={20} />} label={t('nav.contracts', 'Contracts')} isActive={p.startsWith('/contracts')} isCollapsed={isCollapsed} />}
                        {activePersona === 'business' && <NavItem to="/pricelist" icon={<Tag strokeWidth={1.5} size={20} />} label={t('nav.pricelist', 'Pricelist')} isActive={p.startsWith('/pricelist')} isCollapsed={isCollapsed} />}
                        {activePersona === 'business' && <NavItem to="/deliverables" icon={<Package strokeWidth={1.5} size={20} />} label={t('nav.deliverables', 'Deliverables')} isActive={p.startsWith('/deliverables')} isCollapsed={isCollapsed} />}
                        {activePersona === 'business' && <NavItem to="/deliverable-templates" icon={<FileStack strokeWidth={1.5} size={20} />} label={t('nav.deliverableTemplates', 'Templates')} isActive={p.startsWith('/deliverable-templates')} isCollapsed={isCollapsed} />}
                        {activePersona === 'business' && <NavItem to="/finance" icon={<TrendingUp strokeWidth={1.5} size={20} />} label={t('nav.finance', 'Finance')} isActive={p.startsWith('/finance')} isCollapsed={isCollapsed} />}
                        {activePersona === 'business' && <NavItem to="/business-settings" icon={<Building2 strokeWidth={1.5} size={20} />} label={t('nav.businessSettings', 'Business')} isActive={p.startsWith('/business-settings')} isCollapsed={isCollapsed} />}


                        {/* TOOLS Group - Only show when there are tools to display (personal persona) */}
                        {activePersona === 'personal' && !isCollapsed && <div className="text-[10px] font-bold text-tokens-sidebar-muted uppercase tracking-wider px-6 mb-2 mt-6 animate-in fade-in">{t('nav.toolsGroup', 'Tools')}</div>}
                        {activePersona === 'personal' && isCollapsed && <div className="h-4"></div>}

                        {activePersona === 'personal' && <NavItem to="/refocus" icon={<Target strokeWidth={1.5} size={20} />} label={t('nav.refocus', 'Refocus')} isActive={p.startsWith('/refocus')} isCollapsed={isCollapsed} />}

                        {/* EXTRAS Group - Media Suite */}
                        {!isCollapsed && <div className="text-[10px] font-bold text-tokens-sidebar-muted uppercase tracking-wider px-6 mb-2 mt-6 animate-in fade-in">{t('nav.extrasGroup', 'Extras')}</div>}
                        {isCollapsed && <div className="h-4"></div>}

                        <NavItem to="/media-suite" icon={<Film strokeWidth={1.5} size={20} />} label={t('nav.mediaSuite')} isActive={p.startsWith('/media-suite')} isCollapsed={isCollapsed} />
                    </nav>

                    {/* Bottom Controls */}
                    <div className={`p-4 border-t border-tokens-sidebar-border flex flex-col gap-2 ${isCollapsed ? 'items-center' : ''}`}>

                    {/* S2-3: Persona Toggle */}
                    <PersonaToggle isCollapsed={isCollapsed} />

                        <ThemeToggle isCollapsed={isCollapsed} />

                        {/* User Authentication - Dynamic based on auth state */}
                        <UserAuthSection isCollapsed={isCollapsed} />
                    </div>

                </aside>

                {/* Main Content - Floating Style */}
                <main className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden relative bg-tokens-panel ml-3 rounded-2xl scrollbar-hide">
                    {/* Global Timer Header */}
                    <div className="sticky top-0 z-10 flex items-center justify-end gap-2 px-6 py-3 rounded-t-2xl">
                        <FocusTimerPill />
                    </div>
                    {/* Daily Check-in Banner - Non-blocking prompt if no check-in today */}
                    <DailyCheckInBanner />
                    {/* Schema Warning Banner - Shows non-blocking warnings for version mismatches */}
                    <SchemaWarningBanner />
                    {/* Page Transition Wrapper */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className="flex-1"
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </DistractionGuard>
    );
}
