// Client Detail Page - S5-2: View client info and linked projects
// BUSINESS workspace only

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '../components/PageContainer';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { ArrowLeft, Building2, Mail, Phone, MapPin, FileText, FolderOpen, Unlink, Edit, Link as LinkIcon, Plus, ChevronDown } from 'lucide-react';
import { usePersona } from '../hooks/usePersona';
import { Input } from '../components/Input';
import { SidePanel } from '../components/SidePanel';
import { getClientById, updateClient, type Client } from '../stores/clientStore';
import { getProjectsByClientId, unlinkProjectFromClient, linkProjectToClient, listProjectsByPersona, type Project } from '../stores/projectStore';

export function ClientDetailPage() {
    const { t } = useTranslation(['business', 'common']);
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { activePersona } = usePersona();

    // Redirect if not BUSINESS persona
    useEffect(() => {
        if (activePersona !== 'business') {
            navigate('/compass');
        }
    }, [activePersona, navigate]);

    const [client, setClient] = useState<Client | null>(null);
    const [linkedProjects, setLinkedProjects] = useState<Project[]>([]);
    const [showLinkDropdown, setShowLinkDropdown] = useState(false);
    const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
    const [showEditPanel, setShowEditPanel] = useState(false);
    const [formData, setFormData] = useState({ firstName: '', lastName: '', company: '', email: '', phone: '', address: '', notes: '' });
    const dropdownRef = useRef<HTMLDivElement>(null);  // S5: For click-outside-to-close

    // Load client and projects
    useEffect(() => {
        if (id) {
            const c = getClientById(id);
            setClient(c);
            if (c) {
                refreshProjects(c.id);
            }
        }
    }, [id]);

    const refreshProjects = (clientId: string) => {
        setLinkedProjects(getProjectsByClientId(clientId));
        // Get all BUSINESS projects that aren't linked to any client
        const allBusiness = listProjectsByPersona('business');
        const unlinked = allBusiness.filter(p => !p.clientId);
        setAvailableProjects(unlinked);
    };

    // S5: Click-outside-to-close for dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowLinkDropdown(false);
            }
        };
        if (showLinkDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showLinkDropdown]);

    const handleUnlinkProject = (projectId: string) => {
        if (confirm(t('business:clientDetail.unlinkConfirm', 'Unlink this project from the client?'))) {
            unlinkProjectFromClient(projectId);
            if (client) {
                refreshProjects(client.id);
            }
        }
    };

    const handleLinkProject = (projectId: string) => {
        if (client) {
            linkProjectToClient(projectId, client.id);
            refreshProjects(client.id);
            setShowLinkDropdown(false);
        }
    };

    if (activePersona !== 'business') {
        return null;
    }

    // Contact link handlers
    const handleEmailClick = (e: React.MouseEvent, email: string) => {
        e.preventDefault();
        // Open Gmail with prefilled "To" field
        window.open(`https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(email)}`, '_blank');
    };

    const handlePhoneClick = (e: React.MouseEvent, phone: string) => {
        e.preventDefault();
        // Clean phone number (remove non-digits) and open WhatsApp
        const cleanPhone = phone.replace(/\D/g, '');
        window.open(`https://wa.me/${cleanPhone}`, '_blank');
    };

    if (!client) {
        return (
            <PageContainer className="flex flex-col items-center justify-center">
                <p className="text-tokens-muted">Client not found</p>
                <Button variant="secondary" onClick={() => navigate('/clients')} className="mt-4">
                    Back to Clients
                </Button>
            </PageContainer>
        );
    }

    return (
        <PageContainer className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-tokens-brand-DEFAULT/10 flex items-center justify-center">
                        <Building2 size={32} className="text-tokens-brand-DEFAULT" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-tokens-fg tracking-tight">
                            {client.name}
                        </h1>
                        {client.company && (
                            <Badge variant="neutral" className="mt-1">{client.company}</Badge>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="secondary"
                        onClick={() => navigate('/clients')}
                        icon={<ArrowLeft size={16} />}
                    >
                        {t('common:buttons.back', 'Back')}
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => {
                            if (client) {
                                setFormData({
                                    firstName: client.firstName || client.name.split(' ')[0] || '',
                                    lastName: client.lastName || client.name.split(' ').slice(1).join(' ') || '',
                                    company: client.company,
                                    email: client.email,
                                    phone: client.phone,
                                    address: client.address,
                                    notes: client.notes
                                });
                                setShowEditPanel(true);
                            }
                        }}
                        icon={<Edit size={16} />}
                    >
                        {t('common:buttons.edit', 'Edit')}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Contact Information */}
                <Card
                    title={
                        <div className="flex items-center gap-2">
                            <Building2 size={18} className="text-tokens-brand-DEFAULT" />
                            <span>{t('business:clientDetail.contactInfo', 'Contact Information')}</span>
                        </div>
                    }
                >
                    <div className="space-y-4">
                        {client.email && (
                            <div className="flex items-center gap-3">
                                <Mail size={18} className="text-tokens-muted" />
                                <div>
                                    <div className="text-xs text-tokens-muted">{t('business:clientDetail.email', 'Email')}</div>
                                    <a 
                                        href={`mailto:${client.email}`} 
                                        onClick={(e) => handleEmailClick(e, client.email)}
                                        className="text-tokens-fg hover:text-tokens-brand-DEFAULT cursor-pointer"
                                    >
                                        {client.email}
                                    </a>
                                </div>
                            </div>
                        )}
                        {client.phone && (
                            <div className="flex items-center gap-3">
                                <Phone size={18} className="text-tokens-muted" />
                                <div>
                                    <div className="text-xs text-tokens-muted">{t('business:clientDetail.phone', 'Phone')}</div>
                                    <a 
                                        href={`tel:${client.phone}`}
                                        onClick={(e) => handlePhoneClick(e, client.phone)}
                                        className="text-tokens-fg hover:text-tokens-brand-DEFAULT cursor-pointer"
                                    >
                                        {client.phone}
                                    </a>
                                </div>
                            </div>
                        )}
                        {client.address && (
                            <div className="flex items-start gap-3">
                                <MapPin size={18} className="text-tokens-muted mt-0.5" />
                                <div>
                                    <div className="text-xs text-tokens-muted">{t('business:clientDetail.address', 'Address')}</div>
                                    <div className="text-tokens-fg">{client.address}</div>
                                </div>
                            </div>
                        )}
                        {!client.email && !client.phone && !client.address && (
                            <p className="text-tokens-muted text-sm italic">{t('business:clientDetail.noContact', 'No contact information')}</p>
                        )}
                    </div>
                </Card>

                {/* Notes */}
                <Card
                    title={
                        <div className="flex items-center gap-2">
                            <FileText size={18} className="text-tokens-brand-DEFAULT" />
                            <span>{t('business:clientDetail.notes', 'Notes')}</span>
                        </div>
                    }
                >
                    {client.notes ? (
                        <p className="text-tokens-fg text-sm whitespace-pre-line">{client.notes}</p>
                    ) : (
                        <p className="text-tokens-muted text-sm italic">{t('business:clientDetail.noNotes', 'No notes')}</p>
                    )}
                </Card>

                {/* Metadata */}
                <Card
                    title={
                        <div className="flex items-center gap-2">
                            <span>{t('business:clientDetail.details', 'Details')}</span>
                        </div>
                    }
                >
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-tokens-muted">{t('business:clientDetail.created', 'Created')}</span>
                            <span className="text-tokens-fg">{new Date(client.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-tokens-muted">{t('business:clientDetail.updated', 'Updated')}</span>
                            <span className="text-tokens-fg">{new Date(client.updatedAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-tokens-muted">{t('business:clientDetail.projects', 'Projects')}</span>
                            <Badge variant="brand">{linkedProjects.length}</Badge>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Linked Projects */}
            <Card
                title={
                    <div className="flex items-center gap-2">
                        <FolderOpen size={18} className="text-tokens-brand-DEFAULT" />
                        <span>{t('business:clientDetail.linkedProjects', 'Linked Projects')}</span>
                        <Badge variant="neutral">{linkedProjects.length}</Badge>
                    </div>
                }
                headerAction={
                    <div className="relative" ref={dropdownRef}>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowLinkDropdown(!showLinkDropdown)}
                            icon={<Plus size={14} />}
                            disabled={availableProjects.length === 0}
                        >
                            {t('business:clientDetail.linkProject', 'Link Project')}
                            <ChevronDown size={14} className="ml-1" />
                        </Button>
                        {showLinkDropdown && (
                            <div className="absolute right-0 top-full mt-1 w-64 bg-tokens-panel border border-tokens-border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                                {availableProjects.length === 0 ? (
                                    <p className="p-3 text-tokens-muted text-sm text-center">
                                        {t('business:clientDetail.noAvailableProjects', 'No available projects')}
                                    </p>
                                ) : (
                                    availableProjects.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => handleLinkProject(p.id)}
                                            className="w-full text-left px-3 py-2 hover:bg-tokens-panel2 text-tokens-fg text-sm flex items-center gap-2"
                                        >
                                            <LinkIcon size={14} className="text-tokens-brand-DEFAULT" />
                                            <div>
                                                <div className="font-medium">{p.name}</div>
                                                <div className="text-xs text-tokens-muted">{p.type}</div>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                }
            >
                {linkedProjects.length === 0 ? (
                    <div className="text-center py-8">
                        <FolderOpen size={40} className="mx-auto text-tokens-muted mb-3 opacity-50" />
                        <p className="text-tokens-muted text-sm">
                            {t('business:clientDetail.noProjects', 'No projects linked to this client yet')}
                        </p>
                        <p className="text-tokens-muted text-xs mt-1">
                            {t('business:clientDetail.clickLinkProject', 'Click "Link Project" above to connect projects')}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {linkedProjects.map((project) => (
                            <div
                                key={project.id}
                                className="flex items-center justify-between p-3 bg-tokens-bg rounded-lg border border-tokens-border"
                            >
                                <div>
                                    <div className="font-medium text-tokens-fg">{project.name}</div>
                                    <div className="text-xs text-tokens-muted flex items-center gap-2 mt-1">
                                        <Badge variant="neutral">{project.type}</Badge>
                                        <span>Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleUnlinkProject(project.id)}
                                    icon={<Unlink size={14} className="text-amber-500" />}
                                    title="Unlink project"
                                />
                            </div>
                        ))}
                    </div>
                )}
            </Card>
            {/* Edit Panel */}
            <SidePanel
                isOpen={showEditPanel}
                onClose={() => setShowEditPanel(false)}
                title={t('business:clients.form.editTitle', 'Edit Client')}
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
                        <Button variant="secondary" onClick={() => setShowEditPanel(false)}>
                            {t('common:buttons.cancel', 'Cancel')}
                        </Button>
                        <Button variant="primary" onClick={() => {
                            if (!formData.firstName.trim()) {
                                alert(t('business:clients.form.nameRequired', 'Front name is required'));
                                return;
                            }
                            if (client) {
                                updateClient(client.id, {
                                    ...formData,
                                    name: `${formData.firstName} ${formData.lastName}`.trim()
                                });
                                // Refresh client data
                                const updated = getClientById(client.id);
                                if (updated) setClient(updated);
                                setShowEditPanel(false);
                            }
                        }}>
                            {t('common:buttons.update', 'Update')}
                        </Button>
                    </div>
                </div>
            </SidePanel>
        </PageContainer>
    );
}
