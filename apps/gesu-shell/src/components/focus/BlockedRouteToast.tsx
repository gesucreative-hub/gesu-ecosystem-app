/**
 * BlockedRouteToast - Visual feedback when navigation is blocked during focus
 * Shows a non-intrusive toast when user tries to access a blocked screen
 */

import { ShieldOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface BlockedRouteToastProps {
    path: string;
}

// Map routes to readable screen names
const SCREEN_NAMES: Record<string, string> = {
    '/': 'Dashboard',
    '/dashboard': 'Dashboard',
    '/launcher': 'Launcher',
    '/activity': 'Activity',
    '/media-suite': 'Media Suite',
    '/initiator': 'Project Hub',
};

export function BlockedRouteToast({ path }: BlockedRouteToastProps) {
    const { t } = useTranslation('focus');
    
    // Get readable name from path
    const screenName = SCREEN_NAMES[path] || path.replace('/', '').replace(/-/g, ' ');
    
    return (
        <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center gap-3 px-4 py-3 bg-tokens-bg border border-amber-500/30 rounded-lg shadow-lg max-w-sm">
                <div className="p-2 bg-amber-500/10 rounded-lg shrink-0">
                    <ShieldOff className="w-5 h-5 text-amber-500" />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-medium text-tokens-fg truncate">
                        {t('distractionShield.blocked', 'Screen blocked during focus')}
                    </p>
                    <p className="text-xs text-tokens-muted">
                        {t('distractionShield.finishFirst', 'Finish your session to access {{screen}}', { screen: screenName })}
                    </p>
                </div>
            </div>
        </div>
    );
}
