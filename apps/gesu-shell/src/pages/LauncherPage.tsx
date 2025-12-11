import { useNavigate } from 'react-router-dom';
import { LauncherCard } from '../components/LauncherCard';

export function LauncherPage() {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center w-full">
            {/* Hero Section */}
            <div className="text-center mb-16 max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 tracking-tight mb-6 p-1">
                    Gesu Ecosystem v2
                </h1>
                <p className="text-lg text-gray-400 mb-8 leading-relaxed max-w-2xl mx-auto">
                    Your personal productivity operating system. Manage projects, track focus, and maintain balance from a single unified interface.
                </p>
            </div>

            {/* Apps Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">

                <LauncherCard
                    title="Gesu Compass"
                    description="Daily coach and focus session manager. Track your energy, accuracy, and flow states."
                    buttonText="Open Compass"
                    primary={true}
                    onClick={() => navigate('/compass')}
                />

                <LauncherCard
                    title="Gesu Refocus"
                    description="Emergency support system. Quick check-ins when you feel overwhelmed or lost."
                    buttonText="Get Support"
                    onClick={() => navigate('/refocus')}
                />

                <LauncherCard
                    title="Media Suite"
                    description="Advanced media downloader and processor. Convert content and manage assets."
                    buttonText="Manage Media"
                    onClick={() => navigate('/media-suite')}
                />

                <LauncherCard
                    title="Initiator"
                    description="Project scaffolding tool. Create new projects with consistent templates and logs."
                    buttonText="New Project"
                    onClick={() => navigate('/initiator')}
                />

                <LauncherCard
                    title="Settings"
                    description="Global configuration manager. Customize paths, themes, and integrations."
                    buttonText="Configure"
                    onClick={() => navigate('/settings')}
                />

            </div>
        </div>
    );
}
