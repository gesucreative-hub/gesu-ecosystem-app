import { Outlet } from 'react-router-dom';

export function Layout() {
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
            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col w-full">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="border-t border-gray-800 py-8 mt-12 bg-gray-900/30">
                <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-600">
                    <p>© 2025 Gesu Creative Hub. All systems nominal.</p>
                </div>
            </footer>
        </div>
    );
}
