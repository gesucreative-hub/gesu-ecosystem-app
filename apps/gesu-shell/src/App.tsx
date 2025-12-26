import './config/i18n'; // Initialize i18n
import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
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

function App() {
    const { settings } = useGesuSettings();

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
                    <Route index element={<DashboardPage />} />
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="launcher" element={<LauncherPage />} />
                    <Route path="compass" element={<CompassPage />} />
                    <Route path="activity" element={<ActivityPage />} />
                    <Route path="refocus" element={<RefocusPage />} />
                    <Route path="refocus/lost" element={<LostModePage />} />
                    <Route path="media-suite" element={<MediaSuitePage />} />
                    <Route path="initiator" element={<ProjectHubPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                </Route>
            </Routes>
        </AuthProvider>
    );
}

export default App;

