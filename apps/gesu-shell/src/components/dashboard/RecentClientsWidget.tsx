// Recent Clients Widget - Shows recently active clients
// Business persona dashboard widget

import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Users, ChevronRight, User } from 'lucide-react';
import { Card } from '../Card';
import { type Client } from '../../stores/clientStore';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface RecentClientsWidgetProps {
    clients: Client[];
    maxItems?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function RecentClientsWidget({ 
    clients, 
    maxItems = 5 
}: RecentClientsWidgetProps) {
    const { t } = useTranslation(['dashboard', 'business']);
    const displayClients = clients.slice(0, maxItems);

    return (
        <Card className="h-full [&>div]:h-full" noPadding>
            <div className="p-5 flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 gap-4">
                    <div className="flex items-center gap-2 min-w-0">
                        <Users size={18} className="text-tokens-muted flex-shrink-0" />
                        <h3 className="text-sm font-semibold text-tokens-fg truncate">
                            {t('business.recentClients', 'Recent Clients')}
                        </h3>
                    </div>
                    <Link 
                        to="/clients" 
                        className="text-xs text-tokens-brand-DEFAULT hover:underline flex items-center gap-1 whitespace-nowrap"
                    >
                        {t('business.viewAll', 'See All')}
                        <ChevronRight size={12} />
                    </Link>
                </div>

                {/* Client List */}
                {displayClients.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center text-tokens-muted text-sm min-h-[100px]">
                        <p>{t('business.noClients', 'No clients yet')}</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {displayClients.map(client => (
                            <Link 
                                key={client.id}
                                to={`/clients/${client.id}`}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-tokens-panel2 transition-colors"
                            >
                                <div className="w-8 h-8 rounded-full bg-tokens-brand-DEFAULT/10 flex items-center justify-center">
                                    <User size={16} className="text-tokens-brand-DEFAULT" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm text-tokens-fg truncate">
                                        {client.name}
                                    </div>
                                    {client.company && (
                                        <div className="text-xs text-tokens-muted truncate">
                                            {client.company}
                                        </div>
                                    )}
                                </div>
                                <ChevronRight size={14} className="text-tokens-muted" />
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </Card>
    );
}

export default RecentClientsWidget;
