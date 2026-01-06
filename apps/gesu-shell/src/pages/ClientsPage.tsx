
// Clients Page - S5-2: Client list with CRUD operations
// BUSINESS workspace only

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '../components/PageContainer';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { SearchInput } from '../components/SearchInput';
import { Badge } from '../components/Badge';
import { SidePanel } from '../components/SidePanel';
import { Users, Plus, Trash2, ChevronRight, Building2, Mail, Phone, ArrowLeft } from 'lucide-react';
import { usePersona } from '../hooks/usePersona';
import {
    listClients,
    createClient,
    updateClient,
    deleteClient,
    searchClients,
    subscribe,
    getLinkedEntityCount,
    type Client
} from '../stores/clientStore';
import { unlinkAllProjectsFromClient, getProjectsByClientId } from '../stores/projectStore';

export function ClientsPage() {
    const { t } = useTranslation(['business', 'common']);
    const navigate = useNavigate();
    const { activePersona } = usePersona();

    // Redirect if not BUSINESS persona
    useEffect(() => {
        if (activePersona !== 'business') {
            navigate('/compass');
        }
    }, [activePersona, navigate]);

    // State
    const [clients, setClients] = useState<Client[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        company: '',
        email: '',
        phone: '',
        address: '',
        notes: ''
    });

    // Subscribe to client changes
    useEffect(() => {
        const loadClients = () => {
            const filtered = searchQuery ? searchClients(searchQuery) : listClients();
            setClients(filtered);
        };
        loadClients();
        return subscribe(loadClients);
    }, [searchQuery]);

    const resetForm = () => {
        setFormData({ firstName: '', lastName: '', company: '', email: '', phone: '', address: '', notes: '' });
        setShowAddForm(false);
        setEditingClient(null);
    };

    const handleSubmit = () => {
        if (!formData.firstName.trim()) {
            alert(t('business:clients.form.nameRequired', 'Front name is required'));
            return;
        }

        if (editingClient) {
            updateClient(editingClient.id, formData);
        } else {

            // Create full name for display compatibility
            createClient({
                ...formData,
                name: `${formData.firstName} ${formData.lastName}`.trim()
            });
        }
        resetForm();
    };


    const handleDelete = (client: Client) => {
        // Check for linked entities
        const linkedCounts = getLinkedEntityCount(client.id);
        
        // Build warning message
        let message = `Delete "${client.name}"?`;
        
        if (linkedCounts.total > 0) {
            const parts: string[] = [];
            if (linkedCounts.projects > 0) parts.push(`${linkedCounts.projects} project(s)`);
            if (linkedCounts.invoices > 0) parts.push(`${linkedCounts.invoices} invoice(s)`);
            if (linkedCounts.contracts > 0) parts.push(`${linkedCounts.contracts} contract(s)`);
            
            message += `\n\nThis client has ${parts.join(', ')} linked. These will be unlinked but NOT deleted.`;
        }
        
        if (confirm(message)) {
            // Unlink all entities
            unlinkAllProjectsFromClient(client.id);
            deleteClient(client.id);
        }
    };

    const handleViewDetail = (clientId: string) => {
        navigate(`/clients/${clientId}`);
    };

    if (activePersona !== 'business') {
        return null;
    }

    return (
        <PageContainer className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-tokens-fg tracking-tight flex items-center gap-3">
                        <Users size={32} className="text-tokens-brand-DEFAULT" />
                        {t('business:clients.title', 'Clients')}
                    </h1>
                    <p className="text-tokens-muted text-sm mt-1">
                        {t('business:clients.subtitle', 'Manage your business clients and contacts')}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="secondary"
                        onClick={() => navigate(-1)}
                        icon={<ArrowLeft size={16} />}
                    >
                        {t('common:buttons.back', 'Back')}
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => setShowAddForm(true)}
                        icon={<Plus size={16} />}
                    >
                        {t('business:clients.addClient', 'Add Client')}
                    </Button>
                </div>
            </div>

            {/* Search */}
            <SearchInput
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('business:clients.searchPlaceholder', 'Search clients...')}
            />

            {/* Add/Edit Panel */}
            <SidePanel
                isOpen={showAddForm}
                onClose={resetForm}
                title={editingClient ? t('business:clients.form.editTitle', 'Edit Client') : t('business:clients.form.addTitle', 'Add New Client')}
                width="600px"
            >
                <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label={t('business:clients.form.firstName', 'Front Name') + ' *'}
                                value={formData.firstName}
                                onChange={(e) => setFormData(f => ({ ...f, firstName: e.target.value }))}
                                placeholder={t('business:clients.form.firstNamePlaceholder', 'Front Name')}
                                autoFocus
                            />
                            <Input
                                label={t('business:clients.form.lastName', 'Back Name')}
                                value={formData.lastName}
                                onChange={(e) => setFormData(f => ({ ...f, lastName: e.target.value }))}
                                placeholder={t('business:clients.form.lastNamePlaceholder', 'Back Name')}
                            />
                        </div>
                        <Input
                            label={t('business:clients.form.company', 'Company')}
                            value={formData.company}
                            onChange={(e) => setFormData(f => ({ ...f, company: e.target.value }))}
                            placeholder={t('business:clients.form.companyPlaceholder', 'Company or organization')}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label={t('business:clients.form.email', 'Email')}
                                value={formData.email}
                                onChange={(e) => setFormData(f => ({ ...f, email: e.target.value }))}
                                placeholder={t('business:clients.form.emailPlaceholder', 'email@example.com')}
                            />
                            <Input
                                label={t('business:clients.form.phone', 'Phone')}
                                value={formData.phone}
                                onChange={(e) => setFormData(f => ({ ...f, phone: e.target.value }))}
                                placeholder={t('business:clients.form.phonePlaceholder', '+62 812 3456 789')}
                            />
                        </div>
                        <Input
                            label={t('business:clients.form.address', 'Address')}
                            value={formData.address}
                            onChange={(e) => setFormData(f => ({ ...f, address: e.target.value }))}
                            placeholder={t('business:clients.form.addressPlaceholder', 'Full address')}
                        />
                        <div>
                            <label className="block text-sm font-medium text-tokens-fg mb-2">{t('business:clients.form.notes', 'Notes')}</label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData(f => ({ ...f, notes: e.target.value }))}
                                className="w-full h-32 px-4 py-2 bg-tokens-bg border border-tokens-border rounded-lg text-tokens-fg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-tokens-brand-DEFAULT/30"
                                placeholder={t('business:clients.form.notesPlaceholder', 'Additional notes...')}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end pt-4 border-t border-tokens-border">
                        <Button variant="secondary" onClick={resetForm}>
                            {t('common:buttons.cancel', 'Cancel')}
                        </Button>
                        <Button variant="primary" onClick={handleSubmit}>
                            {editingClient ? t('common:buttons.update', 'Update') : t('common:buttons.create', 'Create')}
                        </Button>
                    </div>
                </div>
            </SidePanel>

            {/* Client List */}
            <div className="space-y-3">
                {clients.length === 0 ? (
                    <Card className="py-12 text-center">
                        <Users size={48} className="mx-auto text-tokens-muted mb-4 opacity-50" />
                        <p className="text-tokens-muted">
                            {searchQuery ? t('business:clients.noResults', 'No clients found matching your search') : t('business:clients.noClients', 'No clients yet. Add your first client!')}
                        </p>
                    </Card>
                ) : (
                    clients.map((client) => {
                        const projectCount = getProjectsByClientId(client.id).length;
                        return (
                            <div
                                key={client.id}
                                className="group flex items-center justify-between p-4 bg-tokens-panel border border-tokens-border rounded-xl hover:border-tokens-brand-DEFAULT/30 transition-colors cursor-pointer"
                                onClick={() => handleViewDetail(client.id)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-tokens-brand-DEFAULT/10 flex items-center justify-center">
                                        <Building2 size={24} className="text-tokens-brand-DEFAULT" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-tokens-fg">{client.name}</span>
                                            {client.company && (
                                                <Badge variant="neutral">{client.company}</Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-tokens-muted mt-1">
                                            {client.email && (
                                                <span className="flex items-center gap-1">
                                                    <Mail size={12} />
                                                    {client.email}
                                                </span>
                                            )}
                                            {client.phone && (
                                                <span className="flex items-center gap-1">
                                                    <Phone size={12} />
                                                    {client.phone}
                                                </span>
                                            )}
                                            {projectCount > 0 && (
                                                <Badge variant="brand">{t('business:clients.projectCount', '{{count}} project(s)', { count: projectCount })}</Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={(e) => { e.stopPropagation(); handleDelete(client); }}
                                        icon={<Trash2 size={14} className="text-red-500" />}
                                    />
                                    <ChevronRight size={18} className="text-tokens-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </PageContainer>
    );
}
