/**
 * CustomProtocolCreator - Create and manage personal recovery protocols
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from './Card';
import { Button } from './Button';
import {
    Plus, X, Save, Trash2, Edit3,
    Sparkles, Clock, Wand2
} from 'lucide-react';
import type { RefocusState } from '../services/refocusService';

// --- Types ---

export interface CustomProtocol {
    id: string;
    name: string;
    action: string;
    duration: string;
    forState: RefocusState;
    createdAt: string;
    usedCount: number;
}

// --- Storage ---

const CUSTOM_PROTOCOLS_KEY = 'gesu_custom_protocols';

export function getCustomProtocols(): CustomProtocol[] {
    try {
        const stored = localStorage.getItem(CUSTOM_PROTOCOLS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

export function saveCustomProtocol(protocol: Omit<CustomProtocol, 'id' | 'createdAt' | 'usedCount'>): CustomProtocol {
    const protocols = getCustomProtocols();
    const newProtocol: CustomProtocol = {
        ...protocol,
        id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        usedCount: 0
    };
    protocols.push(newProtocol);
    localStorage.setItem(CUSTOM_PROTOCOLS_KEY, JSON.stringify(protocols));
    return newProtocol;
}

export function deleteCustomProtocol(id: string): void {
    const protocols = getCustomProtocols().filter(p => p.id !== id);
    localStorage.setItem(CUSTOM_PROTOCOLS_KEY, JSON.stringify(protocols));
}

export function incrementProtocolUsage(id: string): void {
    const protocols = getCustomProtocols();
    const protocol = protocols.find(p => p.id === id);
    if (protocol) {
        protocol.usedCount++;
        localStorage.setItem(CUSTOM_PROTOCOLS_KEY, JSON.stringify(protocols));
    }
}

// --- Component ---

const STATE_OPTIONS: { id: RefocusState; label: string; color: string }[] = [
    { id: 'overwhelm', label: 'Overwhelmed', color: 'text-rose-400 bg-rose-500/20' },
    { id: 'restless', label: 'Restless', color: 'text-amber-400 bg-amber-500/20' },
    { id: 'avoiding', label: 'Avoiding', color: 'text-violet-400 bg-violet-500/20' },
    { id: 'foggy', label: 'Foggy', color: 'text-sky-400 bg-sky-500/20' }
];

// Map state IDs to locale key names  
const STATE_KEY_MAP: Record<RefocusState, string> = {
    overwhelm: 'overwhelmed',
    restless: 'restless',
    avoiding: 'avoiding',
    foggy: 'foggy'
};

const DURATION_OPTIONS = ['20s', '30s', '1m', '2m', '5m'];

interface CustomProtocolCreatorProps {
    className?: string;
    onProtocolCreated?: (protocol: CustomProtocol) => void;
}

export function CustomProtocolCreator({ className = '', onProtocolCreated }: CustomProtocolCreatorProps) {
    const { t } = useTranslation(['refocus', 'common']);
    const [isCreating, setIsCreating] = useState(false);
    const [protocols, setProtocols] = useState<CustomProtocol[]>(() => getCustomProtocols());

    // Form state
    const [name, setName] = useState('');
    const [action, setAction] = useState('');
    const [duration, setDuration] = useState('1m');
    const [forState, setForState] = useState<RefocusState>('overwhelm');

    const handleCreate = useCallback(() => {
        if (!name.trim() || !action.trim()) return;

        const newProtocol = saveCustomProtocol({
            name: name.trim(),
            action: action.trim(),
            duration,
            forState
        });

        setProtocols(prev => [...prev, newProtocol]);
        setIsCreating(false);
        setName('');
        setAction('');
        setDuration('1m');

        onProtocolCreated?.(newProtocol);
    }, [name, action, duration, forState, onProtocolCreated]);

    const handleDelete = useCallback((id: string) => {
        deleteCustomProtocol(id);
        setProtocols(prev => prev.filter(p => p.id !== id));
    }, []);

    const hasProtocols = protocols.length > 0;

    return (
        <Card className={`p-6 ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Wand2 size={18} className="text-tokens-brand-DEFAULT" />
                    <h3 className="font-semibold text-tokens-fg">{t('refocus:customProtocols.title', 'Custom Protocols')}</h3>
                </div>

                {!isCreating && (
                    <Button
                        variant="secondary"
                        onClick={() => setIsCreating(true)}
                        icon={<Plus size={16} />}
                        className="text-sm"
                    >
                        {t('common:buttons.create', 'Create')}
                    </Button>
                )}
            </div>

            {/* Creation Form */}
            {isCreating && (
                <div className="mb-6 p-4 rounded-xl bg-tokens-bg-secondary border border-tokens-border animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles size={14} className="text-tokens-brand-DEFAULT" />
                        <span className="text-sm font-medium text-tokens-fg">{t('refocus:customProtocols.newProtocol', 'New Protocol')}</span>
                    </div>

                    <div className="space-y-4">
                        {/* Name */}
                        <div>
                            <label className="text-xs text-tokens-muted block mb-1">{t('refocus:customProtocols.protocolName', 'Protocol Name')}</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={t('refocus:customProtocols.namePlaceholder', 'e.g., The Stretch')}
                                className="w-full px-3 py-2 rounded-lg bg-tokens-panel border border-tokens-border text-tokens-fg text-sm focus:outline-none focus:ring-2 focus:ring-tokens-brand-DEFAULT/50"
                            />
                        </div>

                        {/* Action */}
                        <div>
                            <label className="text-xs text-tokens-muted block mb-1">{t('refocus:customProtocols.whatToDo', 'What to do')}</label>
                            <textarea
                                value={action}
                                onChange={(e) => setAction(e.target.value)}
                                placeholder={t('refocus:customProtocols.actionPlaceholder', 'e.g., Stand up and stretch for 30 seconds')}
                                rows={2}
                                className="w-full px-3 py-2 rounded-lg bg-tokens-panel border border-tokens-border text-tokens-fg text-sm focus:outline-none focus:ring-2 focus:ring-tokens-brand-DEFAULT/50 resize-none"
                            />
                        </div>

                        {/* Duration & State Row */}
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="text-xs text-tokens-muted block mb-1">{t('refocus:customProtocols.duration', 'Duration')}</label>
                                <div className="flex gap-1">
                                    {DURATION_OPTIONS.map(d => (
                                        <button
                                            key={d}
                                            onClick={() => setDuration(d)}
                                            className={`
                                                px-3 py-1.5 rounded text-xs transition-colors
                                                ${duration === d
                                                    ? 'bg-tokens-brand-DEFAULT text-tokens-brand-contrast'
                                                    : 'bg-tokens-panel text-tokens-muted hover:bg-tokens-bg-tertiary'
                                                }
                                            `}
                                        >
                                            {d}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* For State */}
                        <div>
                            <label className="text-xs text-tokens-muted block mb-1">{t('refocus:customProtocols.forWhichState', 'For which state?')}</label>
                            <div className="flex flex-wrap gap-2">
                                {STATE_OPTIONS.map(state => (
                                    <button
                                        key={state.id}
                                        onClick={() => setForState(state.id)}
                                        className={`
                                            px-3 py-1.5 rounded-full text-xs transition-all
                                            ${forState === state.id
                                                ? `${state.color} ring-2 ring-current ring-opacity-50`
                                                : 'bg-tokens-panel text-tokens-muted hover:bg-tokens-bg-tertiary'
                                            }
                                        `}
                                    >
                                        {t(`refocus:mentalStates.${STATE_KEY_MAP[state.id]}`, state.label)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                            <Button
                                variant="primary"
                                onClick={handleCreate}
                                icon={<Save size={14} />}
                                disabled={!name.trim() || !action.trim()}
                            >
                                {t('refocus:customProtocols.saveProtocol', 'Save Protocol')}
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setIsCreating(false);
                                    setName('');
                                    setAction('');
                                }}
                                icon={<X size={14} />}
                            >
                                {t('common:buttons.cancel', 'Cancel')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Protocol List */}
            {hasProtocols ? (
                <div className="space-y-2">
                    {protocols.map(protocol => {
                        const stateConfig = STATE_OPTIONS.find(s => s.id === protocol.forState);
                        return (
                            <div
                                key={protocol.id}
                                className="flex items-start gap-3 p-3 rounded-lg bg-tokens-bg-secondary hover:bg-tokens-bg-tertiary transition-colors group"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-sm text-tokens-fg truncate">
                                            {protocol.name}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${stateConfig?.color}`}>
                                            {stateConfig?.label}
                                        </span>
                                    </div>
                                    <p className="text-xs text-tokens-muted line-clamp-1">
                                        {protocol.action}
                                    </p>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-[10px] text-tokens-muted flex items-center gap-1">
                                            <Clock size={10} />
                                            {protocol.duration}
                                        </span>
                                        {protocol.usedCount > 0 && (
                                            <span className="text-[10px] text-tokens-muted">
                                                {t('refocus:customProtocols.used', 'Used')} {protocol.usedCount}x
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(protocol.id)}
                                    className="p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-rose-500/20 text-tokens-muted hover:text-rose-400 transition-all"
                                    title={t('refocus:customProtocols.deleteProtocol', 'Delete protocol')}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            ) : (
                !isCreating && (
                    <div className="text-center py-8 text-tokens-muted">
                        <Edit3 size={24} className="mx-auto mb-2 opacity-40" />
                        <p className="text-sm">{t('refocus:customProtocols.noProtocolsYet', 'No custom protocols yet')}</p>
                        <p className="text-xs mt-1">{t('refocus:customProtocols.createYourOwn', 'Create your own recovery actions')}</p>
                    </div>
                )
            )}
        </Card>
    );
}
