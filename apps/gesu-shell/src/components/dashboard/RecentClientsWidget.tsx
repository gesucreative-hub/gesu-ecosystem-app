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
        <Card className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Users size={18} className="text-tokens-muted" />
                    <h3 className="font-semibold text-tokens-fg">
                        {t('business.recentClients', 'Recent Clients')}
                    </h3>
                </div>
                <Link 
                    to="/clients" 
                    className="text-sm text-tokens-brand-DEFAULT hover:underline flex items-center gap-1"
                >
                    {t('activeProjects.viewAll', 'View All')}
                    <ChevronRight size={14} />
                </Link>
            </div>

            {/* Client List */}
            {displayClients.length === 0 ? (
                <div className="text-center py-8 text-tokens-muted text-sm">
                    {t('business.noClients', 'No clients yet')}
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
        </Card>
    );
}

export default RecentClientsWidget;
