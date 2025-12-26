/**
 * Dashboard Home Button
 * Subtle button to return to dashboard from other pages
 */

import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export function DashboardHomeButton() {
    return (
        <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-tokens-muted hover:text-tokens-fg hover:bg-tokens-panel2 transition-colors border border-transparent hover:border-tokens-border"
            title="Return to Dashboard"
        >
            <Home size={14} />
            <span>Dashboard</span>
        </Link>
    );
}
