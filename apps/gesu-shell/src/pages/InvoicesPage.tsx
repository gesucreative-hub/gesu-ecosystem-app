// Invoices Page - S6-B: Invoice list for BUSINESS workspace
// List with search + status filter, create new invoice, navigate to detail

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '../components/PageContainer';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Badge } from '../components/Badge';
import { Plus, Search, Receipt, ChevronRight } from 'lucide-react';
import { usePersona } from '../hooks/usePersona';
import { 
    listInvoices, 
    getInvoicesByStatus,
    createInvoice,
    subscribe,
    type Invoice,
    type InvoiceStatus
} from '../stores/invoiceStore';

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
    const [statusFilter, setStatusFilter] = useState<InvoiceStatus | ''>('');

    // Load data
    const loadData = () => {
        let result: Invoice[];
        if (statusFilter) {
            result = getInvoicesByStatus(statusFilter);
        } else {
            result = listInvoices();
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
        
        setInvoices(result);
    };

    useEffect(() => {
        loadData();
        const unsub = subscribe(loadData);
        return unsub;
    }, [searchQuery, statusFilter]);

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

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
    };

    const formatDate = (iso: string) => {
        return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const statusTabs: { value: InvoiceStatus | '', label: string }[] = [
        { value: '', label: t('invoices:list.all', 'All') },
        { value: 'draft', label: t('invoices:list.draft', 'Draft') },
        { value: 'sent', label: t('invoices:list.sent', 'Sent') },
        { value: 'paid', label: t('invoices:list.paid', 'Paid') },
        { value: 'cancelled', label: t('invoices:list.cancelled', 'Cancelled') }
    ];

    return (
        <PageContainer>
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-tokens-fg">{t('invoices:list.title', 'Invoices')}</h1>
                <p className="text-tokens-muted mt-1">{t('invoices:list.subtitle', 'Manage and track your invoices')}</p>
            </div>
            {/* Search + Add */}
            <div className="flex flex-wrap gap-3 mb-4">
                <div className="flex-1 min-w-[200px] relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-tokens-muted" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('invoices:list.searchPlaceholder', 'Search by number or client...')}
                        className="pl-9"
                    />
                </div>
                <Button onClick={handleNewInvoice} icon={<Plus size={16} />}>
                    {t('invoices:list.create', 'New Invoice')}
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

            {/* Invoices List */}
            {invoices.length === 0 ? (
                <Card className="p-8 text-center">
                    <Receipt size={40} className="mx-auto text-tokens-muted mb-3 opacity-50" />
                    <p className="text-tokens-muted">
                        {searchQuery || statusFilter
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
                            className="cursor-pointer"
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
                                    <ChevronRight size={16} className="text-tokens-muted" />
                                </div>
                            </Card>
                        </div>
                    ))}
                </div>
            )}
        </PageContainer>
    );
}
