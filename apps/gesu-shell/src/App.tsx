import './config/i18n'; // Initialize i18n
import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { usePersona } from './hooks/usePersona';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
// LauncherPage might still be useful as a specific tool or redundant?
// Keeping it accessible via /launcher just in case, but Dashboard is home.
import { LauncherPage } from './pages/LauncherPage';
import { CompassPage } from './pages/CompassPage';
import { RefocusPage } from './pages/RefocusPage';
import { MediaSuitePage } from './pages/MediaSuitePage';
import { ProjectHubPage } from './pages/InitiatorPage';
import { SettingsPage } from './pages/SettingsPage';
import { LostModePage } from './pages/LostModePage';
import { ActivityPage } from './pages/ActivityPage';
import { LoginPage } from './pages/LoginPage';
import { useGesuSettings } from './lib/gesuSettings';
// S5: Business pages
import { BusinessSettingsPage } from './pages/BusinessSettingsPage';
import { ClientsPage } from './pages/ClientsPage';
import { ClientDetailPage } from './pages/ClientDetailPage';
// S6-B: Invoice & Contract pages
import { PricelistPage } from './pages/PricelistPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { InvoiceDetailPage } from './pages/InvoiceDetailPage';
import { ContractsPage } from './pages/ContractsPage';
import { ContractDetailPage } from './pages/ContractDetailPage';
// S7-B: Deliverables pages
import { DeliverableTemplatesPage } from './pages/DeliverableTemplatesPage';
import { ProjectDeliverablesPage } from './pages/ProjectDeliverablesPage';
// S7-C: Finance page
import { FinanceSnapshotPage } from './pages/FinanceSnapshotPage';
// S8: Second Brain page
import { SecondBrainPage } from './pages/SecondBrainPage';

function App() {
    const { settings } = useGesuSettings();
    const { activePersona } = usePersona();

    // Apply theme to document root
    useEffect(() => {
        const root = document.documentElement;
        const theme = settings?.appearance?.theme || 'system';

        if (theme === 'dark') {
            root.classList.add('dark');
        } else if (theme === 'light') {
            root.classList.remove('dark');
        } else if (theme === 'system') {
            // Use system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }

            // Listen for system theme changes
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = (e: MediaQueryListEvent) => {
                if (e.matches) {
                    root.classList.add('dark');
                } else {
                    root.classList.remove('dark');
                }
            };

            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, [settings?.appearance?.theme]);
    return (
        <AuthProvider>
            <Routes>
                {/* Login Page - Outside Layout for full-page experience */}
                <Route path="/login" element={<LoginPage />} />

                {/* Main App with Layout */}
                <Route path="/" element={<Layout />}>
                    {/* S2-3: Persona-aware landing redirect */}
                    <Route index element={
                        <Navigate 
                            to={activePersona === 'personal' ? '/compass' : '/initiator'} 
                            replace 
                        />
                    } />
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="launcher" element={<LauncherPage />} />
                    <Route path="compass" element={<CompassPage />} />
                    <Route path="activity" element={<ActivityPage />} />
                    <Route path="refocus" element={<RefocusPage />} />
                    <Route path="refocus/lost" element={<LostModePage />} />
                    <Route path="media-suite" element={<MediaSuitePage />} />
                    <Route path="initiator" element={<ProjectHubPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    {/* S5: Business workspace routes */}
                    <Route path="business-settings" element={<BusinessSettingsPage />} />
                    <Route path="clients" element={<ClientsPage />} />
                    <Route path="clients/:id" element={<ClientDetailPage />} />
                    {/* S6-B: Invoice & Contract routes */}
                    <Route path="pricelist" element={<PricelistPage />} />
                    <Route path="invoices" element={<InvoicesPage />} />
                    <Route path="invoices/:id" element={<InvoiceDetailPage />} />
                    <Route path="contracts" element={<ContractsPage />} />
                    <Route path="contracts/:id" element={<ContractDetailPage />} />
                    {/* S7-B: Deliverables routes */}
                    <Route path="deliverable-templates" element={<DeliverableTemplatesPage />} />
                    <Route path="deliverables" element={<ProjectDeliverablesPage />} />
                    {/* S7-C: Finance route */}
                    <Route path="finance" element={<FinanceSnapshotPage />} />
                    {/* S8: Second Brain route (PERSONAL) */}
                    <Route path="second-brain" element={<SecondBrainPage />} />
                </Route>
            </Routes>
        </AuthProvider>
    );
}

export default App;

