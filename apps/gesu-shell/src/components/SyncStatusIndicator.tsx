/**
 * SyncStatusIndicator
 * Shows cloud sync status in the UI (syncing, synced, offline)
 */

import { useState, useEffect } from 'react';
import { Cloud, CloudOff, RefreshCw, Check } from 'lucide-react';
import { getSyncStatus, subscribeSyncStatus, SyncStatus } from '../services/gamificationSyncService';

interface SyncStatusIndicatorProps {
    className?: string;
    showLabel?: boolean;
}

export function SyncStatusIndicator({ className = '', showLabel = false }: SyncStatusIndicatorProps) {
    const [status, setStatus] = useState<SyncStatus>(getSyncStatus());

    useEffect(() => {
        return subscribeSyncStatus(setStatus);
    }, []);

    // Don't show if never synced (no cloud data yet)
    if (!status.lastSyncAt && !status.isSyncing && !status.error) {
        return null;
    }

    const getIcon = () => {
        if (!status.isOnline) {
            return <CloudOff size={14} className="text-amber-500" />;
        }
        if (status.isSyncing) {
            return <RefreshCw size={14} className="text-tokens-brand-DEFAULT animate-spin" />;
        }
        if (status.error) {
            return <Cloud size={14} className="text-red-500" />;
        }
        return <Check size={14} className="text-green-500" />;
    };

    const getLabel = () => {
        if (!status.isOnline) return 'Offline';
        if (status.isSyncing) return 'Syncing...';
        if (status.error) return 'Sync error';
        if (status.lastSyncAt) {
            const ago = Math.round((Date.now() - status.lastSyncAt) / 1000);
            if (ago < 60) return 'Synced';
            if (ago < 3600) return `${Math.round(ago / 60)}m ago`;
            return `${Math.round(ago / 3600)}h ago`;
        }
        return '';
    };

    const getTitle = () => {
        if (!status.isOnline) return 'Working offline - changes will sync when online';
        if (status.isSyncing) return 'Syncing with cloud...';
        if (status.error) return `Sync error: ${status.error}`;
        if (status.lastSyncAt) {
            return `Last synced: ${new Date(status.lastSyncAt).toLocaleTimeString()}`;
        }
        return 'Cloud sync';
    };

    return (
        <div 
            className={`flex items-center gap-1.5 ${className}`}
            title={getTitle()}
        >
            {getIcon()}
            {showLabel && (
                <span className="text-[10px] text-tokens-muted">
                    {getLabel()}
                </span>
            )}
        </div>
    );
}
