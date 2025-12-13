import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
// LauncherPage might still be useful as a specific tool or redundant?
// Keeping it accessible via /launcher just in case, but Dashboard is home.
import { LauncherPage } from './pages/LauncherPage';
import { CompassPage } from './pages/CompassPage';
import { RefocusPage } from './pages/RefocusPage';
import { MediaSuitePage } from './pages/MediaSuitePage';
import { InitiatorPage } from './pages/InitiatorPage';
import { SettingsPage } from './pages/SettingsPage';

function App() {
    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route index element={<DashboardPage />} />
                <Route path="launcher" element={<LauncherPage />} />
                <Route path="compass" element={<CompassPage />} />
                <Route path="refocus" element={<RefocusPage />} />
                <Route path="media-suite" element={<MediaSuitePage />} />
                <Route path="initiator" element={<InitiatorPage />} />
                <Route path="settings" element={<SettingsPage />} />
            </Route>
        </Routes>
    );
}

export default App;
