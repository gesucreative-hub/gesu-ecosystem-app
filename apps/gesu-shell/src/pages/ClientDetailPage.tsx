// Client Detail Page - S5-2: View client info and linked projects
// BUSINESS workspace only

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '../components/PageContainer';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { ArrowLeft, Building2, Mail, Phone, MapPin, FileText, FolderOpen, Unlink, Edit } from 'lucide-react';
import { usePersona } from '../hooks/usePersona';
import { getClientById, type Client } from '../stores/clientStore';
import { getProjectsByClientId, unlinkProjectFromClient, type Project } from '../stores/projectStore';

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

    useEffect(() => {
        if (id) {
            const c = getClientById(id);
            setClient(c);
            if (c) {
                setLinkedProjects(getProjectsByClientId(c.id));
            }
        }
    }, [id]);

    const handleUnlinkProject = (projectId: string) => {
        if (confirm('Unlink this project from the client?')) {
            unlinkProjectFromClient(projectId);
            if (client) {
                setLinkedProjects(getProjectsByClientId(client.id));
            }
        }
    };

    if (activePersona !== 'business') {
        return null;
    }

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
                        onClick={() => navigate(`/clients?edit=${client.id}`)}
                        icon={<Edit size={16} />}
                    >
                        Edit
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
                                    <div className="text-xs text-tokens-muted">Email</div>
                                    <a href={`mailto:${client.email}`} className="text-tokens-fg hover:text-tokens-brand-DEFAULT">
                                        {client.email}
                                    </a>
                                </div>
                            </div>
                        )}
                        {client.phone && (
                            <div className="flex items-center gap-3">
                                <Phone size={18} className="text-tokens-muted" />
                                <div>
                                    <div className="text-xs text-tokens-muted">Phone</div>
                                    <a href={`tel:${client.phone}`} className="text-tokens-fg hover:text-tokens-brand-DEFAULT">
                                        {client.phone}
                                    </a>
                                </div>
                            </div>
                        )}
                        {client.address && (
                            <div className="flex items-start gap-3">
                                <MapPin size={18} className="text-tokens-muted mt-0.5" />
                                <div>
                                    <div className="text-xs text-tokens-muted">Address</div>
                                    <div className="text-tokens-fg">{client.address}</div>
                                </div>
                            </div>
                        )}
                        {!client.email && !client.phone && !client.address && (
                            <p className="text-tokens-muted text-sm italic">No contact information</p>
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
                        <p className="text-tokens-muted text-sm italic">No notes</p>
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
                            <span className="text-tokens-muted">Created</span>
                            <span className="text-tokens-fg">{new Date(client.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-tokens-muted">Updated</span>
                            <span className="text-tokens-fg">{new Date(client.updatedAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-tokens-muted">Projects</span>
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
            >
                {linkedProjects.length === 0 ? (
                    <div className="text-center py-8">
                        <FolderOpen size={40} className="mx-auto text-tokens-muted mb-3 opacity-50" />
                        <p className="text-tokens-muted text-sm">
                            {t('business:clientDetail.noProjects', 'No projects linked to this client yet')}
                        </p>
                        <p className="text-tokens-muted text-xs mt-1">
                            Link projects from the Projects page
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
        </PageContainer>
    );
}
