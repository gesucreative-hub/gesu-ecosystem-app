import { LauncherCard } from './components/LauncherCard';

function App() {
    return (
        <div className="min-h-screen bg-[#0f0f11] text-gray-100 flex flex-col font-sans selection:bg-cyan-900 selection:text-white">
            {/* Header */}
            <header className="border-b border-gray-800 bg-gray-900/60 backdrop-blur-md sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                            <span className="font-bold text-white">G</span>
                        </div>
                        <span className="font-semibold text-lg tracking-tight">Gesu Shell</span>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-gray-800 border border-gray-700 text-xs font-medium text-gray-400 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Workspace: Local
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center justify-center w-full">

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
                    />

                    <LauncherCard
                        title="Gesu Refocus"
                        description="Emergency support system. Quick check-ins when you feel overwhelmed or lost."
                        buttonText="Get Support"
                    />

                    <LauncherCard
                        title="Media Suite"
                        description="Advanced media downloader and processor. Convert content and manage assets."
                        buttonText="Manage Media"
                    />

                    <LauncherCard
                        title="Initiator"
                        description="Project scaffolding tool. Create new projects with consistent templates and logs."
                        buttonText="New Project"
                    />

                    <LauncherCard
                        title="Settings"
                        description="Global configuration manager. Customize paths, themes, and integrations."
                        buttonText="Configure"
                    />

                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-gray-800 py-8 mt-12 bg-gray-900/30">
                <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-600">
                    <p>© 2025 Gesu Creative Hub. All systems nominal.</p>
                </div>
            </footer>
        </div>
    )
}

export default App
