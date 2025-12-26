/**
 * SchemaWarningBanner
 * 
 * Non-blocking amber banner that shows when any store has schema warnings
 * (FUTURE_VERSION or CORRUPT). Displays a clickable warning with backup info.
 */

import { useEffect, useState } from 'react';
import { 
    getSchemaWarnings, 
    subscribeToWarnings, 
    SchemaWarning,
    getBackupsPath 
} from '../services/persistence/safeMigration';

export function SchemaWarningBanner() {
    const [warnings, setWarnings] = useState<SchemaWarning[]>([]);
    const [backupsPath, setBackupsPath] = useState<string | null>(null);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        // Initial load
        setWarnings(getSchemaWarnings());
        
        // Subscribe to changes
        const unsubscribe = subscribeToWarnings(() => {
            setWarnings(getSchemaWarnings());
        });

        // Get backups path
        getBackupsPath().then(setBackupsPath);

        return unsubscribe;
    }, []);

    if (warnings.length === 0) {
        return null;
    }

    return (
        <div className="schema-warning-banner">
            <div className="schema-warning-header" onClick={() => setExpanded(!expanded)}>
                <span className="schema-warning-icon">⚠️</span>
                <span className="schema-warning-text">
                    {warnings.length === 1 
                        ? 'Data issue detected - your data has been preserved'
                        : `${warnings.length} data issues detected - your data has been preserved`
                    }
                </span>
                <span className="schema-warning-toggle">
                    {expanded ? '▼' : '▶'}
                </span>
            </div>

            {expanded && (
                <div className="schema-warning-details">
                    <ul className="schema-warning-list">
                        {warnings.map((warning, index) => (
                            <li key={`${warning.storeKey}-${index}`} className="schema-warning-item">
                                <span className="schema-warning-store">{warning.storeKey}</span>
                                <span className={`schema-warning-status schema-warning-status--${warning.status.toLowerCase()}`}>
                                    {warning.status === 'FUTURE_VERSION' ? 'Newer Version' : 'Corrupted'}
                                </span>
                                {warning.backupFilename && (
                                    <span className="schema-warning-backup">
                                        Backup: {warning.backupFilename}
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                    
                    {backupsPath && (
                        <div className="schema-warning-path">
                            <span className="schema-warning-path-label">Backups saved to:</span>
                            <code className="schema-warning-path-value">{backupsPath}</code>
                        </div>
                    )}
                    
                    <p className="schema-warning-help">
                        Your original data is safe. This can happen if you're using an older app version
                        or if there was a storage issue. Contact support if this persists.
                    </p>
                </div>
            )}

            <style>{`
                .schema-warning-banner {
                    background: linear-gradient(135deg, #f59e0b20 0%, #d9770620 100%);
                    border: 1px solid #f59e0b40;
                    border-radius: 8px;
                    margin: 8px;
                    overflow: hidden;
                }

                .schema-warning-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 16px;
                    cursor: pointer;
                    transition: background 0.2s;
                }

                .schema-warning-header:hover {
                    background: #f59e0b10;
                }

                .schema-warning-icon {
                    font-size: 16px;
                }

                .schema-warning-text {
                    flex: 1;
                    font-size: 14px;
                    color: #f59e0b;
                    font-weight: 500;
                }

                .schema-warning-toggle {
                    font-size: 10px;
                    color: #f59e0b80;
                }

                .schema-warning-details {
                    padding: 0 16px 16px;
                    border-top: 1px solid #f59e0b20;
                }

                .schema-warning-list {
                    list-style: none;
                    padding: 0;
                    margin: 12px 0;
                }

                .schema-warning-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 8px 12px;
                    background: #00000020;
                    border-radius: 6px;
                    margin-bottom: 4px;
                    font-size: 13px;
                }

                .schema-warning-store {
                    font-family: monospace;
                    color: #e2e8f0;
                }

                .schema-warning-status {
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-size: 11px;
                    font-weight: 500;
                }

                .schema-warning-status--future_version {
                    background: #3b82f620;
                    color: #60a5fa;
                }

                .schema-warning-status--corrupt {
                    background: #ef444420;
                    color: #f87171;
                }

                .schema-warning-backup {
                    font-size: 11px;
                    color: #94a3b8;
                    font-family: monospace;
                }

                .schema-warning-path {
                    margin-top: 12px;
                    padding: 8px 12px;
                    background: #00000020;
                    border-radius: 6px;
                }

                .schema-warning-path-label {
                    font-size: 12px;
                    color: #94a3b8;
                    display: block;
                    margin-bottom: 4px;
                }

                .schema-warning-path-value {
                    font-size: 11px;
                    color: #e2e8f0;
                    word-break: break-all;
                }

                .schema-warning-help {
                    margin-top: 12px;
                    font-size: 12px;
                    color: #94a3b8;
                    line-height: 1.5;
                }
            `}</style>
        </div>
    );
}

export default SchemaWarningBanner;
