// Contracts Page - S6-B: Contract list for BUSINESS workspace
// List with search + status filter, create new contract, navigate to detail

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '../components/PageContainer';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { SearchInput } from '../components/SearchInput';
import { Badge } from '../components/Badge';
import { Plus, FileSignature, ChevronRight, Trash2 } from 'lucide-react';
import { usePersona } from '../hooks/usePersona';
import { 
    listContracts, 
    getContractsByStatus,
    createContract,
    deleteContract,
    subscribe,
    type Contract,
    type ContractStatus
} from '../stores/contractStore';

const STATUS_COLORS: Record<ContractStatus, 'neutral' | 'brand' | 'success' | 'warning'> = {
    draft: 'neutral',
    sent: 'brand',
    signed: 'success',
    cancelled: 'warning'
};

export function ContractsPage() {
    const { t } = useTranslation(['invoices', 'common']);
    const navigate = useNavigate();
    const { activePersona } = usePersona();

    // Redirect if not business persona
    useEffect(() => {
        if (activePersona !== 'business') {
            navigate('/compass', { replace: true });
        }
    }, [activePersona, navigate]);

    // State
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<ContractStatus | '' | 'archived'>('');
    const [showUnlinkedOnly, setShowUnlinkedOnly] = useState<boolean>(false); // Phase 3: Unlinked filter

    // Load data
    const loadData = () => {
        let result: Contract[];
        
        if (statusFilter === 'archived') {
            result = listContracts().filter(c => c.archived);
        } else if (statusFilter) {
            result = getContractsByStatus(statusFilter as ContractStatus).filter(c => !c.archived);
        } else {
            result = listContracts().filter(c => !c.archived);
        }
        
        // Apply search filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(c => 
                c.number.toLowerCase().includes(q) ||
                c.snapshot.clientName.toLowerCase().includes(q) ||
                c.snapshot.clientCompany.toLowerCase().includes(q)
            );
        }
        
        // Phase 3: Apply unlinked filter
        if (showUnlinkedOnly) {
            result = result.filter(c => !c.clientId);
        }
        
        setContracts(result);
    };

    useEffect(() => {
        loadData();
        const unsub = subscribe(loadData);
        return unsub;
    }, [searchQuery, statusFilter, showUnlinkedOnly]);

    // Create new contract
    const handleNewContract = () => {
        // Create a draft contract
        const contract = createContract({
            clientId: '',
            projectId: '',
            scope: []
        });
        navigate(`/contracts/${contract.id}`);
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm(t('common:confirmDelete', 'Are you sure you want to delete this contract?'))) {
            deleteContract(id);
        }
    };

    const formatDate = (iso: string) => {
        return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const statusTabs: { value: ContractStatus | '' | 'archived', label: string }[] = [
        { value: '', label: t('invoices:contracts.all', 'All') },
        { value: 'draft', label: t('invoices:contracts.draft', 'Draft') },
        { value: 'sent', label: t('invoices:contracts.sent', 'Sent') },
        { value: 'signed', label: t('invoices:contracts.signed', 'Signed') },
        { value: 'cancelled', label: t('invoices:contracts.cancelled', 'Cancelled') },
        // { value: 'archived', label: t('invoices:contracts.archived', 'Archived') } // Hidden until phase 2 UI polish
    ];

    return (
        <PageContainer>
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-tokens-fg">{t('invoices:contracts.title', 'Contracts')}</h1>
                <p className="text-tokens-muted mt-1">{t('invoices:contracts.subtitle', 'Manage your project contracts')}</p>
            </div>
            {/* Search + Add */}
            <div className="flex flex-wrap gap-3 mb-4">
                <div className="flex-1 min-w-[200px]">
                    <SearchInput
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('invoices:contracts.searchPlaceholder', 'Search by number or client...')}
                        fullWidth
                    />
                </div>
                <Button onClick={handleNewContract} icon={<Plus size={16} />}>
                    {t('invoices:contracts.create', 'New Contract')}
                </Button>
            </div>

            {/* Status Tabs */}
            <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
                {statusTabs.map(tab => (
                    <button
                        key={tab.value}
                        onClick={() => setStatusFilter(tab.value)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                            statusFilter === tab.value
                                ? 'bg-tokens-brand-DEFAULT text-white'
                                : 'bg-tokens-panel2 text-tokens-muted hover:text-tokens-fg'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Unlinked Filter Checkbox */}
            <label className="flex items-center gap-2 mb-4 cursor-pointer">
                <input
                    type="checkbox"
                    checked={showUnlinkedOnly}
                    onChange={(e) => setShowUnlinkedOnly(e.target.checked)}
                    className="w-4 h-4 rounded border-tokens-border text-tokens-brand-DEFAULT focus:ring-tokens-brand-DEFAULT/50"
                />
                <span className="text-sm text-tokens-muted">{t('invoices:contracts.showUnlinked', 'Show unlinked only')}</span>
            </label>

            {/* Contracts List */}
            {contracts.length === 0 ? (
                <Card className="p-8 text-center">
                    <FileSignature size={40} className="mx-auto text-tokens-muted mb-3 opacity-50" />
                    <p className="text-tokens-muted">
                        {searchQuery || statusFilter
                            ? t('invoices:contracts.noResults', 'No contracts found')
                            : t('invoices:contracts.noContracts', 'No contracts yet. Create your first contract!')}
                    </p>
                </Card>
            ) : (
                <div className="space-y-2">
                    {contracts.map(contract => (
                        <div 
                            key={contract.id}
                            onClick={() => navigate(`/contracts/${contract.id}`)}
                            className="cursor-pointer group"
                        >
                            <Card className="p-4 hover:bg-tokens-panel2 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-mono font-semibold text-tokens-brand-DEFAULT">{contract.number}</span>
                                            <Badge variant={STATUS_COLORS[contract.status]}>
                                                {t(`invoices:status.${contract.status}`, contract.status)}
                                            </Badge>
                                        </div>
                                        <div className="text-sm text-tokens-muted truncate">
                                            {contract.snapshot.clientName || contract.snapshot.clientCompany || t('invoices:contracts.noClient', 'No client')}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-tokens-muted">{contract.scope.length} {t('invoices:contracts.scopeItems', 'scope items')}</div>
                                        <div className="text-xs text-tokens-muted">{formatDate(contract.updatedAt)}</div>
                                    </div>
                                    
                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2">
                                        {contract.status === 'draft' && (
                                            <button 
                                                onClick={(e) => handleDelete(e, contract.id)}
                                                className="p-2 text-tokens-muted hover:text-tokens-error hover:bg-tokens-error/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                                title={t('common:delete', 'Delete')}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                        <ChevronRight size={16} className="text-tokens-muted" />
                                    </div>
                                </div>
                            </Card>
                        </div>
                    ))}
                </div>
            )}
        </PageContainer>
    );
}
