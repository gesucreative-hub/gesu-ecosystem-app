
// Invoices Page - S6-B: Invoice list for BUSINESS workspace
// List with search + status filter, create new invoice, navigate to detail

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '../components/PageContainer';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { SearchInput } from '../components/SearchInput';
import { Badge } from '../components/Badge';
import { Plus, ChevronRight, Trash2, Receipt } from 'lucide-react';
import { usePersona } from '../hooks/usePersona';
import { 
    listInvoices, 
    listInvoices,
    createInvoice,
    deleteInvoice,
    subscribe,
    type Invoice,
    type InvoiceStatus
} from '../stores/invoiceStore';
import { InvoiceStatusFilter } from '../components/InvoiceStatusFilter';

const STATUS_COLORS: Record<InvoiceStatus, 'neutral' | 'brand' | 'success' | 'warning'> = {
    draft: 'neutral',
    sent: 'brand',
    paid: 'success',
    cancelled: 'warning'
};

export function InvoicesPage() {
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
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilters, setStatusFilters] = useState<InvoiceStatus[]>([]);
    const [showUnlinkedOnly, setShowUnlinkedOnly] = useState<boolean>(false); // Phase 3: Unlinked filter

    // Load data
    const loadData = () => {
        let result = listInvoices().filter(inv => !inv.archived);
        
        if (statusFilters.length > 0) {
             result = result.filter(inv => statusFilters.includes(inv.status));
        }
        
        // Apply search filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(inv => 
                inv.number.toLowerCase().includes(q) ||
                inv.snapshot.clientName.toLowerCase().includes(q) ||
                inv.snapshot.clientCompany.toLowerCase().includes(q)
            );
        }
        
        // Phase 3: Apply unlinked filter
        if (showUnlinkedOnly) {
            result = result.filter(inv => !inv.clientId);
        }
        
        setInvoices(result);
    };

    useEffect(() => {
        loadData();
        const unsub = subscribe(loadData);
        return unsub;
    }, [searchQuery, statusFilters, showUnlinkedOnly]);

    // Create new invoice
    const handleNewInvoice = () => {
        // Create a draft invoice with empty line items
        const invoice = createInvoice({
            clientId: '',
            projectId: '',
            lineItems: []
        });
        navigate(`/invoices/${invoice.id}`);
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm(t('common:confirmDelete', 'Are you sure you want to delete this invoice?'))) {
            deleteInvoice(id);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
    };

    const formatDate = (iso: string) => {
        return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    };



    return (
        <PageContainer>
            {/* Page Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                     <h1 className="text-3xl font-bold text-tokens-fg tracking-tight flex items-center gap-3">
                        <Receipt size={32} className="text-tokens-brand-DEFAULT" />
                        {t('invoices:list.title', 'Invoices')}
                    </h1>
                    <p className="text-tokens-muted text-sm mt-1">{t('invoices:list.subtitle', 'Manage and track your invoices')}</p>
                </div>
                <Button variant="primary" onClick={handleNewInvoice} icon={<Plus size={16} />}>
                    {t('invoices:list.create', 'New Invoice')}
                </Button>
            </div>
            
            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 min-w-[200px]">
                    <SearchInput
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('invoices:list.searchPlaceholder', 'Search by number or client...')}
                        fullWidth
                    />
                </div>

                {/* Status Filter Dropdown */}
                <InvoiceStatusFilter 
                    selectedStatuses={statusFilters}
                    onChange={setStatusFilters}
                    showUnlinkedOnly={showUnlinkedOnly}
                    onShowUnlinkedChange={setShowUnlinkedOnly}
                />
            </div>





            {/* Invoices List */}
            {invoices.length === 0 ? (
                <Card className="p-8 text-center">
                    <Receipt size={40} className="mx-auto text-tokens-muted mb-3 opacity-50" />
                    <p className="text-tokens-muted">
                        {searchQuery || statusFilters.length > 0
                            ? t('invoices:list.noResults', 'No invoices found')
                            : t('invoices:list.noInvoices', 'No invoices yet. Create your first invoice!')}
                    </p>
                </Card>
            ) : (
                <div className="space-y-2">
                    {invoices.map(invoice => (
                        <div 
                            key={invoice.id}
                            onClick={() => navigate(`/invoices/${invoice.id}`)}
                            className="cursor-pointer group"
                        >
                            <Card className="p-4 hover:bg-tokens-panel2 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-mono font-semibold text-tokens-brand-DEFAULT">{invoice.number}</span>
                                            <Badge variant={STATUS_COLORS[invoice.status]}>
                                                {t(`invoices:status.${invoice.status}`, invoice.status)}
                                            </Badge>
                                        </div>
                                        <div className="text-sm text-tokens-muted truncate">
                                            {invoice.snapshot.clientName || invoice.snapshot.clientCompany || t('invoices:list.noClient', 'No client')}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-mono font-semibold">{formatPrice(invoice.total)}</div>
                                        <div className="text-xs text-tokens-muted">{formatDate(invoice.updatedAt)}</div>
                                    </div>
                                    
                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2">
                                        {invoice.status === 'draft' && (
                                            <button 
                                                onClick={(e) => handleDelete(e, invoice.id)}
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
