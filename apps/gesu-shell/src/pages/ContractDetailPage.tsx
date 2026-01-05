// Contract Detail Page - S6-C: Full editor for BUSINESS workspace
// Draft: editable scope list + terms; Non-draft: read-only view (freeze)
// Supports: add/remove/reorder scope items, terms editor, status transitions

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '../components/PageContainer';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Badge } from '../components/Badge';
import { Combobox } from '../components/Combobox';
import { 
    ArrowLeft, Save, Send, CheckCircle, Plus, 
    Trash2, FileText, Building2, User, List, ChevronUp, ChevronDown, Download 
} from 'lucide-react';
import { exportContractPDF } from '../utils/pdfExport';
import { usePersona } from '../hooks/usePersona';
import { 
    getContractById, 
    updateContract,
    markContractSent,
    markContractSigned,
    revertToDraft,
    deleteContract,
    subscribe,
    type Contract, 
    type ContractStatus
} from '../stores/contractStore';
import { listClients, type Client } from '../stores/clientStore';
import { listProjects, getProjectsByClientId, type Project } from '../stores/projectStore';

const STATUS_COLORS: Record<ContractStatus, 'neutral' | 'brand' | 'success' | 'warning'> = {
    draft: 'neutral',
    sent: 'brand',
    signed: 'success',
    cancelled: 'warning'
};

// Local scope item for editing
interface EditableScopeItem {
    id: string;
    description: string;
}

export function ContractDetailPage() {
    const { t } = useTranslation(['invoices', 'common']);
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { activePersona } = usePersona();

    const [contract, setContract] = useState<Contract | null>(null);
    const [scopeItems, setScopeItems] = useState<EditableScopeItem[]>([]);
    const [terms, setTerms] = useState<string>('');
    const [notes, setNotes] = useState<string>('');
    const [hasChanges, setHasChanges] = useState(false);
    const [clients, setClients] = useState<Client[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);

    // Redirect if not business persona
    useEffect(() => {
        if (activePersona !== 'business') {
            navigate('/compass', { replace: true });
        }
    }, [activePersona, navigate]);

    // Load contract
    const loadData = useCallback(() => {
        if (id) {
            const ctr = getContractById(id);
            setContract(ctr);
            if (ctr) {
                setScopeItems(ctr.scope.map(s => ({
                    id: s.id,
                    description: s.description
                })));
                setTerms(ctr.terms);
                setNotes(ctr.notes);
            }
        }
        setClients(listClients());
    }, [id]);

    useEffect(() => {
        loadData();
        const unsub = subscribe(loadData);
        return unsub;
    }, [loadData]);

    const isDraft = contract?.status === 'draft';

    // --- Scope Item Handlers ---

    const addScopeItem = () => {
        const newItem: EditableScopeItem = {
            id: `new-${Date.now()}`,
            description: ''
        };
        setScopeItems([...scopeItems, newItem]);
        setHasChanges(true);
    };

    const removeScopeItem = (itemId: string) => {
        setScopeItems(scopeItems.filter(s => s.id !== itemId));
        setHasChanges(true);
    };

    const updateScopeItem = (itemId: string, description: string) => {
        setScopeItems(scopeItems.map(s => 
            s.id === itemId ? { ...s, description } : s
        ));
        setHasChanges(true);
    };

    const moveScopeItem = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === scopeItems.length - 1) return;
        
        const newItems = [...scopeItems];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
        setScopeItems(newItems);
        setHasChanges(true);
    };

    // --- Save & Status ---

    const handleSave = () => {
        if (!contract || !isDraft) return;
        
        const result = updateContract(contract.id, {
            scope: scopeItems.map(s => s.description).filter(d => d.trim()),
            terms,
            notes
        });
        
        if (result) {
            setHasChanges(false);
            loadData();
        }
    };

    const handleSend = () => {
        if (!contract) return;
        
        // Validate: at least 1 scope item
        const validScope = scopeItems.filter(s => s.description.trim());
        if (validScope.length === 0) {
            alert(t('invoices:contractEditor.errorNoScope', 'Add at least one scope item'));
            return;
        }
        
        // Save first if changes exist
        if (hasChanges) {
            handleSave();
        }
        
        if (markContractSent(contract.id)) {
            loadData();
        }
    };

    const handleMarkSigned = () => {
        if (!contract || contract.status !== 'sent') return;
        if (markContractSigned(contract.id)) {
            loadData();
        }
    };

    // --- Formatting ---

    const formatDate = (iso: string) => {
        return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    if (!contract) {
        return (
            <PageContainer>
                <Card className="p-8 text-center">
                    <p className="text-tokens-muted">{t('invoices:contractDetail.notFound', 'Contract not found')}</p>
                    <Button variant="ghost" onClick={() => navigate('/contracts')} className="mt-4">
                        {t('common:buttons.back', 'Back')}
                    </Button>
                </Card>
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            {/* Page Header */}
            <div className="mb-2">
                <h1 className="text-2xl font-bold text-tokens-fg">{contract.number}</h1>
                <p className="text-tokens-muted mt-1">{t('invoices:contractDetail.subtitle', 'Contract details')}</p>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" onClick={() => navigate('/contracts')} icon={<ArrowLeft size={16} />}>
                    {t('common:buttons.back', 'Back')}
                </Button>
                <div className="flex-1" />
                <Badge variant={STATUS_COLORS[contract.status]} className="text-sm px-3 py-1">
                    {t(`invoices:status.${contract.status}`, contract.status)}
                </Badge>
                
                {isDraft && (
                    <>
                        <Button 
                            variant="outline" 
                            icon={<Trash2 size={16} />}
                            className="text-tokens-error hover:text-tokens-error hover:bg-tokens-error/10"
                            onClick={() => {
                                if (window.confirm(t('common:confirmDelete', 'Are you sure you want to delete this contract?'))) {
                                    if (id && deleteContract(id)) {
                                        navigate('/contracts');
                                    }
                                }
                            }}
                        >
                            {t('common:buttons.delete', 'Delete')}
                        </Button>
                        <Button 
                            variant="outline" 
                            icon={<Save size={16} />}
                            onClick={handleSave}
                            disabled={!hasChanges}
                        >
                            {t('common:buttons.save', 'Save')}
                        </Button>
                        <Button 
                            icon={<Send size={16} />}
                            onClick={handleSend}
                        >
                            {t('invoices:contractEditor.send', 'Mark as Sent')}
                        </Button>
                    </>
                )}
                
                {contract.status === 'sent' && (
                    <>
                        <Button 
                            variant="outline"
                            icon={<ArrowLeft size={16} />}
                            onClick={() => {
                                const result = revertToDraft(contract.id);
                                if (result) {
                                    setContract(result);
                                }
                            }}
                        >
                            {t('invoices:contractEditor.revertToDraft', 'Revert to Draft')}
                        </Button>
                        <Button 
                            icon={<CheckCircle size={16} />}
                            onClick={handleMarkSigned}
                        >
                            {t('invoices:contractEditor.markSigned', 'Mark as Signed')}
                        </Button>
                    </>
                )}
                
                {/* Export PDF - available for all statuses */}
                <Button 
                    variant="outline"
                    icon={<Download size={16} />}
                    onClick={() => exportContractPDF(contract)}
                >
                    {t('common:buttons.exportPdf', 'Export PDF')}
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Client Info */}
                <Card>
                    <div className="p-4">
                        <div className="flex items-center gap-2 mb-3 text-tokens-muted">
                            <User size={16} />
                            <span className="text-sm font-medium">{t('invoices:contractDetail.client', 'Client')}</span>
                        </div>
                        {isDraft && clients.length > 0 ? (
                            <Combobox
                                value={contract.clientId}
                                onChange={(value) => {
                                    updateContract(contract.id, { clientId: value });
                                    // Update available projects based on client
                                    if (value) {
                                        setProjects(getProjectsByClientId(value));
                                    } else {
                                        setProjects(listProjects());
                                    }
                                    loadData();
                                }}
                                options={[
                                    { value: '', label: t('invoices:detail.selectClient', '-- Select Client --') },
                                    ...clients.map(c => ({ value: c.id, label: c.company ? `${c.name} (${c.company})` : c.name }))
                                ]}
                                placeholder={t('invoices:detail.searchClient', 'Search clients...')}
                                onCreateNew={() => navigate('/clients?create=true')}
                                createNewLabel={t('common:createNewClient', 'Create New Client')}
                            />
                        ) : (
                            <>
                                <div className="font-semibold">{contract.snapshot.clientName || '-'}</div>
                                {contract.snapshot.clientCompany && (
                                    <div className="text-sm text-tokens-muted">{contract.snapshot.clientCompany}</div>
                                )}
                                {contract.snapshot.clientAddress && (
                                    <div className="text-sm text-tokens-muted mt-1">{contract.snapshot.clientAddress}</div>
                                )}
                            </>
                        )}
                    </div>
                </Card>

                {/* Business Info */}
                <Card>
                    <div className="p-4">
                        <div className="flex items-center gap-2 mb-3 text-tokens-muted">
                            <Building2 size={16} />
                            <span className="text-sm font-medium">{t('invoices:contractDetail.business', 'From')}</span>
                        </div>
                        <div className="font-semibold">{contract.snapshot.businessName || '-'}</div>
                        {contract.snapshot.businessAddress && (
                            <div className="text-sm text-tokens-muted">{contract.snapshot.businessAddress}</div>
                        )}
                    </div>
                </Card>

                {/* Project Selector (Draft only) */}
                {isDraft && (
                    <Card>
                        <div className="p-4">
                            <div className="flex items-center gap-2 mb-3 text-tokens-muted">
                                <FileText size={16} />
                                <span className="text-sm font-medium">{t('invoices:contractDetail.project', 'Project')}</span>
                            </div>
                            <Combobox
                                value={contract.projectId || ''}
                                onChange={(value) => {
                                    updateContract(contract.id, { projectId: value || undefined });
                                    loadData();
                                }}
                                options={[
                                    { value: '', label: t('invoices:detail.selectProject', '-- No Project --') },
                                    ...(contract.clientId ? getProjectsByClientId(contract.clientId) : projects).map(p => ({ 
                                        value: p.id, 
                                        label: p.name 
                                    }))
                                ]}
                                placeholder={t('invoices:detail.searchProject', 'Search projects...')}
                            />
                            {!contract.clientId && (
                                <div className="text-xs text-tokens-muted mt-2">
                                    {t('invoices:contractDetail.selectClientFirst', 'Select a client to filter projects')}
                                </div>
                            )}
                        </div>
                    </Card>
                )}
            </div>

            {/* Scope Editor / Viewer */}
            <Card className="mb-6">
                <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-tokens-muted">
                            <List size={16} />
                            <span className="text-sm font-medium">{t('invoices:contractDetail.scope', 'Project Scope')}</span>
                            <Badge variant="neutral">{scopeItems.length}</Badge>
                        </div>
                        {isDraft && (
                            <Button variant="outline" size="sm" icon={<Plus size={14} />} onClick={addScopeItem}>
                                {t('invoices:contractEditor.addScope', 'Add Scope Item')}
                            </Button>
                        )}
                    </div>

                    {scopeItems.length === 0 ? (
                        <p className="text-tokens-muted text-sm text-center py-8">
                            {t('invoices:contractEditor.noScope', 'No scope items. Click "Add Scope Item" to start.')}
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {scopeItems.map((item, index) => (
                                <div key={item.id} className="flex items-center gap-2">
                                    {isDraft && (
                                        <div className="flex flex-col gap-0.5">
                                            <button 
                                                onClick={() => moveScopeItem(index, 'up')}
                                                disabled={index === 0}
                                                className="p-1 text-tokens-muted hover:text-tokens-fg disabled:opacity-30"
                                            >
                                                <ChevronUp size={12} />
                                            </button>
                                            <button 
                                                onClick={() => moveScopeItem(index, 'down')}
                                                disabled={index === scopeItems.length - 1}
                                                className="p-1 text-tokens-muted hover:text-tokens-fg disabled:opacity-30"
                                            >
                                                <ChevronDown size={12} />
                                            </button>
                                        </div>
                                    )}
                                    <span className="text-tokens-muted text-sm w-6">{index + 1}.</span>
                                    {isDraft ? (
                                        <Input
                                            value={item.description}
                                            onChange={(e) => updateScopeItem(item.id, e.target.value)}
                                            placeholder={t('invoices:contractEditor.scopePlaceholder', 'Enter scope item...')}
                                            className="flex-1"
                                        />
                                    ) : (
                                        <span className="flex-1 text-sm">{item.description}</span>
                                    )}
                                    {isDraft && (
                                        <button 
                                            onClick={() => removeScopeItem(item.id)}
                                            className="p-1.5 text-tokens-muted hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Card>

            {/* Terms Editor / Viewer */}
            <Card className="mb-6">
                <div className="p-4">
                    <div className="flex items-center gap-2 mb-3 text-tokens-muted">
                        <FileText size={16} />
                        <span className="text-sm font-medium">{t('invoices:contractDetail.terms', 'Terms & Conditions')}</span>
                    </div>
                    {isDraft ? (
                        <textarea
                            value={terms}
                            onChange={(e) => { setTerms(e.target.value); setHasChanges(true); }}
                            placeholder={t('invoices:contractEditor.termsPlaceholder', 'Enter terms and conditions...')}
                            className="w-full p-3 rounded-lg border border-tokens-border bg-tokens-bg text-tokens-fg text-sm resize-y min-h-[150px] font-mono"
                        />
                    ) : (
                        <pre className="text-sm whitespace-pre-wrap font-sans">
                            {terms || t('invoices:contractDetail.noTerms', 'No terms defined')}
                        </pre>
                    )}
                </div>
            </Card>

            {/* Notes */}
            <Card className="mb-6">
                <div className="p-4">
                    <div className="flex items-center gap-2 mb-3 text-tokens-muted">
                        <FileText size={16} />
                        <span className="text-sm font-medium">{t('invoices:contractEditor.notes', 'Internal Notes')}</span>
                    </div>
                    {isDraft ? (
                        <textarea
                            value={notes}
                            onChange={(e) => { setNotes(e.target.value); setHasChanges(true); }}
                            placeholder={t('invoices:contractEditor.notesPlaceholder', 'Internal notes (not shown to client)...')}
                            className="w-full p-3 rounded-lg border border-tokens-border bg-tokens-bg text-tokens-fg text-sm resize-y min-h-[80px]"
                        />
                    ) : (
                        <pre className="text-sm whitespace-pre-wrap font-sans">{notes || '-'}</pre>
                    )}
                </div>
            </Card>

            {/* Metadata */}
            <Card>
                <div className="p-4 text-sm text-tokens-muted">
                    <div className="flex justify-between mb-1">
                        <span>{t('invoices:contractDetail.created', 'Created')}</span>
                        <span>{formatDate(contract.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>{t('invoices:contractDetail.updated', 'Updated')}</span>
                        <span>{formatDate(contract.updatedAt)}</span>
                    </div>
                </div>
            </Card>

            {/* Freeze Notice */}
            {!isDraft && (
                <div className="mt-6 p-4 bg-tokens-panel2 rounded-lg text-center text-tokens-muted text-sm">
                    {t('invoices:contractEditor.frozenNotice', 'This contract is locked and cannot be edited.')}
                </div>
            )}
        </PageContainer>
    );
}
