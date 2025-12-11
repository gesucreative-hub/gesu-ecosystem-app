import { Link } from 'react-router-dom';

export function CompassPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <h1 className="text-3xl font-bold text-white mb-4">Gesu Compass</h1>
            <p className="text-gray-400 max-w-md mb-8">
                Daily coaching, energy tracking, and focus sessions.
                (UI Implementation Coming Soon)
            </p>
            <Link to="/" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg transition-colors">
                ← Back to Launcher
            </Link>
        </div>
    );
}
