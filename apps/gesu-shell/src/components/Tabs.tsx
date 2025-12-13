import React from 'react';
import { Button } from './Button';

interface TabItem {
    id: string;
    label: string;
    icon?: React.ReactNode;
}

interface TabsProps {
    tabs: TabItem[];
    activeTab: string;
    onChange: (id: string) => void;
    className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className = '' }: TabsProps) {
    return (
        <div className={`flex items-center gap-2 border-b border-tokens-border mb-6 ${className}`}>
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => onChange(tab.id)}
                        className={`
                            relative px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2
                            ${isActive ? 'text-tokens-brand-DEFAULT' : 'text-tokens-muted hover:text-tokens-fg hover:bg-tokens-panel2'}
                        `}
                    >
                        {tab.icon && <span>{tab.icon}</span>}
                        {tab.label}

                        {/* Active Indicator Line */}
                        {isActive && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-tokens-brand-DEFAULT rounded-t-full"></div>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
