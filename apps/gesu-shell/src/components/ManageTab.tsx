// ManageTab - Project folder management (Edit, Archive, Delete)
// Part of Project Hub

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { Badge } from './Badge';
import { SidePanel } from './SidePanel';
import { SelectDropdown } from './Dropdown';
import { useAlertDialog } from './AlertDialog';
import { FolderOpen, Edit, Archive, Trash2, Calendar, Layers, Search, ArrowUpDown } from 'lucide-react';
import {
    Project,
    renameProject,
    archiveProject,
    deleteProject,
    updateProjectType,
    linkProjectToClient,
    unlinkProjectFromClient,
} from '../stores/projectStore';
import { listClients, type Client } from '../stores/clientStore';

interface ManageTabProps {
    projects: Project[];
    onRefresh: () => Promise<void>;
}

export function ManageTab({ projects, onRefresh }: ManageTabProps) {
    const { t } = useTranslation(['initiator', 'common', 'business']);
    const { alert, AlertDialogComponent } = useAlertDialog();

    // Edit state
    const [showEditPanel, setShowEditPanel] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [editForm, setEditForm] = useState({
        name: '',
        type: 'other' as 'client' | 'gesu-creative' | 'other',
        clientId: ''
    });
    const [clients, setClients] = useState<Client[]>([]);

    // Features state
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState<'date-desc' | 'date-asc' | 'name-asc'>('date-desc');

    // Filter and sort projects locally
    const filteredProjects = projects
        .filter(p => {
            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            return p.name.toLowerCase().includes(q) || 
                   p.clientName?.toLowerCase().includes(q) ||
                   p.blueprintId?.toLowerCase().includes(q);
        })
        .sort((a, b) => {
            if (sortOrder === 'date-desc') return b.updatedAt - a.updatedAt;
            if (sortOrder === 'date-asc') return a.updatedAt - b.updatedAt;
            if (sortOrder === 'name-asc') return a.name.localeCompare(b.name);
            return 0;
        });

    // Helper to format display name (strip client name if present)
    const getDisplayName = (project: Project) => {
        if (project.type === 'client' && project.clientName && project.name.startsWith(project.clientName)) {
            return project.name.substring(project.clientName.length).trim();
        }
        return project.name;
    };

    // Open edit panel
    const handleEdit = (project: Project) => {
        setEditingProject(project);
        setEditForm({
            name: project.name,
            type: project.type,
            clientId: project.clientId || ''
        });
        setClients(listClients());
        setShowEditPanel(true);
    };

    // Save edit
    const handleSaveEdit = async () => {
        if (!editingProject) return;

        if (!editForm.name.trim()) {
            alert({
                title: t('common:alerts.error', 'Error'),
                message: t('initiator:manage.nameRequired', 'Project name is required'),
                type: 'error'
            });
            return;
        }

        // Update name
        renameProject(editingProject.id, editForm.name);

        // Update type
        updateProjectType(editingProject.id, editForm.type);

        // Update client link
        if (editForm.clientId && editForm.clientId !== editingProject.clientId) {
            linkProjectToClient(editingProject.id, editForm.clientId);
        } else if (!editForm.clientId && editingProject.clientId) {
            unlinkProjectFromClient(editingProject.id);
        }

        await onRefresh();
        setShowEditPanel(false);
        setEditingProject(null);

        alert({
            title: t('common:alerts.success', 'Success'),
            message: t('initiator:manage.updated', 'Project updated'),
            type: 'success'
        });
    };

    };

    // Archive project
    const handleArchive = async (project: Project) => {
        const confirmed = window.confirm(
            t('initiator:manage.archiveConfirm', 'Archive "{{name}}"? You can restore it later.', { name: project.name })
        );
        if (!confirmed) return;

        archiveProject(project.id);
        
        // Force immediate UI update by triggering parent refresh
        // Ensure parent actually re-fetches or we need local state update if parent isn't enough
        await onRefresh();

        alert({
            title: t('common:alerts.success', 'Success'),
            message: t('initiator:manage.archived', 'Project archived'),
            type: 'success'
        });
    };

    // Delete project
    const handleDelete = async (project: Project) => {
        const confirmed = window.confirm(
            t('initiator:manage.deleteConfirm', 'Permanently delete "{{name}}"? This cannot be undone.', { name: project.name })
        );
        if (!confirmed) return;

        deleteProject(project.id);
        await onRefresh();

        alert({
            title: t('common:alerts.success', 'Success'),
            message: t('initiator:manage.deleted', 'Project deleted'),
            type: 'success'
        });
    };

    // Project type labels
    const typeLabels: Record<string, string> = {
        'client': t('initiator:projectTypes.client', 'Client'),
        'gesu-creative': t('initiator:projectTypes.gesuCreative', 'Personal'),
        'other': t('initiator:projectTypes.other', 'Other')
    };

    return (
        <div className="space-y-4">
            {AlertDialogComponent}

            {/* Header with Search and Sort */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold text-tokens-fg">
                        {t('initiator:manage.title', 'Project Management')}
                    </h2>
                    <Badge variant="neutral">{filteredProjects.length} {t('initiator:manage.projects', 'projects')}</Badge>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    {/* Search */}
                    <div className="relative flex-1 md:w-64">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-tokens-muted" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t('initiator:projectList.search', 'Search projects...')}
                            className="w-full pl-9 pr-4 py-1.5 bg-tokens-panel border border-tokens-border rounded-lg text-sm text-tokens-fg focus:outline-none focus:ring-2 focus:ring-tokens-brand-DEFAULT/30"
                        />
                    </div>
                    
                    {/* Sort */}
                    <SelectDropdown
                        value={sortOrder}
                        onChange={(val) => setSortOrder(val as any)}
                        options={[
                            { value: 'date-desc', label: t('initiator:projectList.sortNewest', 'Newest') },
                            { value: 'date-asc', label: t('initiator:projectList.sortOldest', 'Oldest') },
                            { value: 'name-asc', label: t('initiator:projectList.sortName', 'Name (A-Z)') }
                        ]}
                        width="140px"
                    />
                </div>
            </div>

            {/* Project List */}
            {filteredProjects.length === 0 ? (
                <Card className="py-12 text-center">
                    <FolderOpen size={48} className="mx-auto text-tokens-muted mb-4 opacity-50" />
                    <p className="text-tokens-muted">
                        {t('initiator:manage.noProjects', 'No projects found')}
                    </p>
                </Card>
            ) : (
                <div className="space-y-2">
                    {filteredProjects.map((project) => (
                        <div
                            key={project.id}
                            className="group flex items-center justify-between p-4 bg-tokens-panel border border-tokens-border rounded-xl hover:border-tokens-brand-DEFAULT/30 transition-colors"
                        >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="w-10 h-10 rounded-lg bg-tokens-brand-DEFAULT/10 flex items-center justify-center flex-shrink-0">
                                    <FolderOpen size={20} className="text-tokens-brand-DEFAULT" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-medium text-tokens-fg truncate">{getDisplayName(project)}</span>
                                        <Badge variant="neutral">{typeLabels[project.type] || project.type}</Badge>
                                        {project.blueprintId && (
                                            <Badge variant="brand" className="flex items-center gap-1">
                                                <Layers size={10} />
                                                {project.blueprintId}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-tokens-muted mt-1">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={12} />
                                            {new Date(project.updatedAt).toLocaleDateString()}
                                        </span>
                                        {project.clientName && (
                                            <span>• {project.clientName}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Actions - Icon Only */}
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleEdit(project)}
                                    className="p-2 text-tokens-muted hover:text-tokens-highlight hover:bg-tokens-surface rounded-lg transition-colors"
                                    title={t('initiator:manage.actions.edit', 'Edit')}
                                >
                                    <Edit size={16} />
                                </button>
                                <button
                                    onClick={() => handleArchive(project)}
                                    className="p-2 text-tokens-muted hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors"
                                    title={t('initiator:manage.actions.archive', 'Archive')}
                                >
                                    <Archive size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(project)}
                                    className="p-2 text-tokens-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                    title={t('initiator:manage.actions.delete', 'Delete')}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Edit SidePanel */}
            <SidePanel
                isOpen={showEditPanel}
                onClose={() => {
                    setShowEditPanel(false);
                    setEditingProject(null);
                }}
                title={t('initiator:manage.editTitle', 'Edit Project')}
                width="500px"
            >
                <div className="space-y-4">
                    <Input
                        label={t('initiator:manage.form.name', 'Project Name') + ' *'}
                        value={editForm.name}
                        onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
                        placeholder={t('initiator:manage.form.namePlaceholder', 'Enter project name')}
                        autoFocus
                    />

                    <SelectDropdown
                        label={t('initiator:manage.form.type', 'Project Type')}
                        value={editForm.type}
                        onChange={(value) => setEditForm(f => ({ ...f, type: value as typeof editForm.type }))}
                        options={[
                            { value: 'client', label: t('initiator:projectTypes.client', 'Client Project') },
                            { value: 'gesu-creative', label: t('initiator:projectTypes.gesuCreative', 'Personal Project') },
                            { value: 'other', label: t('initiator:projectTypes.other', 'Other') }
                        ]}
                    />

                    {editForm.type === 'client' && (
                        <SelectDropdown
                            label={t('initiator:manage.form.client', 'Linked Client')}
                            value={editForm.clientId}
                            onChange={(value) => setEditForm(f => ({ ...f, clientId: value }))}
                            options={[
                                { value: '', label: t('initiator:placeholders.noClient', '-- No Client --') },
                                ...clients.map(c => ({
                                    value: c.id,
                                    label: c.company ? `${c.company} (${c.firstName || c.name})` : (c.firstName || c.name)
                                }))
                            ]}
                        />
                    )}

                    <div className="flex gap-3 justify-end pt-4 border-t border-tokens-border">
                        <Button variant="secondary" onClick={() => setShowEditPanel(false)}>
                            {t('common:buttons.cancel', 'Cancel')}
                        </Button>
                        <Button variant="primary" onClick={handleSaveEdit}>
                            {t('common:buttons.save', 'Save')}
                        </Button>
                    </div>
                </div>
            </SidePanel>
        </div>
    );
}
