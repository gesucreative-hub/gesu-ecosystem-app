import React, { useRef, useEffect, useState } from 'react';

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
    const containerRef = useRef<HTMLDivElement>(null);
    const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

    // Update indicator position when active tab changes
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const activeButton = container.querySelector(`[data-tab-id="${activeTab}"]`) as HTMLButtonElement;
        if (activeButton) {
            setIndicatorStyle({
                left: activeButton.offsetLeft,
                width: activeButton.offsetWidth,
            });
        }
    }, [activeTab, tabs]);

    return (
        <div className={`inline-flex items-center ${className}`}>
            {/* Container - white (light) / gesu-black (dark) */}
            <div
                ref={containerRef}
                className="relative flex items-center gap-1 p-1 rounded-full 
                           bg-tokens-panel2
                           border border-tokens-border/50
                           shadow-sm"
            >
                {/* Sliding Active Indicator Capsule - uses var(--brand) for consistency */}
                <div
                    className="absolute top-1 bottom-1 rounded-full transition-all duration-300 ease-out shadow-md"
                    style={{
                        left: `${indicatorStyle.left}px`,
                        width: `${indicatorStyle.width}px`,
                        backgroundColor: 'var(--brand)'
                    }}
                />

                {/* Tab Buttons */}
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            data-tab-id={tab.id}
                            onClick={() => onChange(tab.id)}
                            className={`
                                relative z-10 px-4 py-2 text-sm font-medium rounded-full
                                transition-colors duration-300 flex items-center gap-2
                                ${isActive
                                    ? 'text-white'
                                    : 'text-tokens-fg/60 hover:text-tokens-fg'
                                }
                            `}
                        >
                            {tab.icon && <span className={isActive ? 'opacity-100' : 'opacity-70'}>{tab.icon}</span>}
                            {tab.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
