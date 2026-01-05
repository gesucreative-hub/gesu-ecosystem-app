// Invoice Detail Page - S6-C + S7-A: Full editor for BUSINESS workspace
// Draft: editable grid; Non-draft: read-only view (freeze)
// S7-A: Payment recording, overdue detection

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '../components/PageContainer';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Badge } from '../components/Badge';
import { SelectDropdown } from '../components/Dropdown';
import { Combobox } from '../components/Combobox';
import { 
    ArrowLeft, Save, Send, DollarSign, Plus, 
    Trash2, FileText, Building2, User, ChevronUp, ChevronDown, AlertTriangle, Calendar, X, Download
} from 'lucide-react';
import { exportInvoicePDF } from '../utils/pdfExport';
import { usePersona } from '../hooks/usePersona';
import { 
    getInvoiceById, 
    updateInvoice,
    markInvoiceSent,
    markInvoicePaid,
    revertToSent,
    deleteInvoice,
    subscribe,
    isOverdue,
    getEffectiveDueDate,
    setDueDate,
    type Invoice, 
    type InvoiceStatus
} from '../stores/invoiceStore';
import { listItems, type ServiceCatalogItem } from '../stores/serviceCatalogStore';
import {
    listByInvoiceId,
    createPayment,
    deletePayment,
    getTotalPaid,
    getRemaining,
    subscribe as subscribePayments,
    type Payment,
    type PaymentMethod
} from '../stores/paymentStore';
import { listClients, type Client } from '../stores/clientStore';
import { listProjects, getProjectsByClientId, type Project } from '../stores/projectStore';

const STATUS_COLORS: Record<InvoiceStatus, 'neutral' | 'brand' | 'success' | 'warning'> = {
    draft: 'neutral',
    sent: 'brand',
    paid: 'success',
    cancelled: 'warning'
};

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
    { value: 'transfer', label: 'Bank Transfer' },
    { value: 'cash', label: 'Cash' },
    { value: 'other', label: 'Other' }
];

// Local line item for editing (without computed fields)
interface EditableLineItem {
    id: string;
    itemName: string;
    description: string;
    quantity: number;
    unitPrice: number;
}

export function InvoiceDetailPage() {
    const { t } = useTranslation(['invoices', 'common']);
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { activePersona } = usePersona();

    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [lineItems, setLineItems] = useState<EditableLineItem[]>([]);
    const [adjustments, setAdjustments] = useState<number>(0);
    const [notes, setNotes] = useState<string>('');
    const [catalogItems, setCatalogItems] = useState<ServiceCatalogItem[]>([]);
    const [hasChanges, setHasChanges] = useState(false);

    // S7-A: Payment state
    const [payments, setPayments] = useState<Payment[]>([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState<number>(0);
    const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('transfer');
    const [paymentNotes, setPaymentNotes] = useState<string>('');
    const [localDueDate, setLocalDueDate] = useState<string>('');
    const [clients, setClients] = useState<Client[]>([]);

    // Redirect if not business persona
    useEffect(() => {
        if (activePersona !== 'business') {
            navigate('/compass', { replace: true });
        }
    }, [activePersona, navigate]);

    // Load invoice, catalog, and payments
    const loadData = useCallback(() => {
        if (id) {
            const inv = getInvoiceById(id);
            setInvoice(inv);
            if (inv) {
                setLineItems(inv.lineItems.map(li => ({
                    id: li.id,
                    itemName: li.itemName,
                    description: li.description,
                    quantity: li.quantity,
                    unitPrice: li.unitPrice
                })));
                setAdjustments(inv.adjustments);
                setNotes(inv.notes);
                setLocalDueDate(getEffectiveDueDate(inv));
                setPayments(listByInvoiceId(inv.id));
            }
        }
        setCatalogItems(listItems());
        setClients(listClients());
    }, [id]);

    useEffect(() => {
        loadData();
        const unsub1 = subscribe(loadData);
        const unsub2 = subscribePayments(loadData);
        return () => { unsub1(); unsub2(); };
    }, [loadData]);

    const isDraft = invoice?.status === 'draft';

    // Computed totals
    const subtotal = lineItems.reduce((sum, li) => sum + (li.quantity * li.unitPrice), 0);
    const total = subtotal + adjustments;

    // --- Line Item Handlers ---

    const addLineItem = () => {
        const newItem: EditableLineItem = {
            id: `new-${Date.now()}`,
            itemName: '',
            description: '',
            quantity: 1,
            unitPrice: 0
        };
        setLineItems([...lineItems, newItem]);
        setHasChanges(true);
    };

    const removeLineItem = (itemId: string) => {
        setLineItems(lineItems.filter(li => li.id !== itemId));
        setHasChanges(true);
    };

    const updateLineItem = (itemId: string, field: keyof EditableLineItem, value: string | number) => {
        setLineItems(lineItems.map(li => 
            li.id === itemId ? { ...li, [field]: value } : li
        ));
        setHasChanges(true);
    };

    const moveLineItem = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === lineItems.length - 1) return;
        
        const newItems = [...lineItems];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
        setLineItems(newItems);
        setHasChanges(true);
    };

    const selectCatalogItem = (lineItemId: string, catalogId: string) => {
        const catalogItem = catalogItems.find(c => c.id === catalogId);
        if (catalogItem) {
            setLineItems(lineItems.map(li => 
                li.id === lineItemId 
                    ? { ...li, itemName: catalogItem.name, unitPrice: catalogItem.unitPrice, description: catalogItem.description }
                    : li
            ));
            setHasChanges(true);
        }
    };

    // --- Save & Status ---

    const handleSave = () => {
        if (!invoice || !isDraft) return;
        
        const result = updateInvoice(invoice.id, {
            lineItems: lineItems.map(li => ({
                itemName: li.itemName,
                description: li.description,
                quantity: li.quantity,
                unitPrice: li.unitPrice
            })),
            adjustments,
            notes
        });
        
        if (result) {
            setHasChanges(false);
            loadData();
        }
    };

    const handleSend = () => {
        if (!invoice) return;
        
        // Validate: at least 1 line item with valid qty
        if (lineItems.length === 0) {
            alert(t('invoices:editor.errorNoItems', 'Add at least one line item'));
            return;
        }
        if (lineItems.some(li => li.quantity <= 0)) {
            alert(t('invoices:editor.errorInvalidQty', 'All quantities must be greater than 0'));
            return;
        }
        
        // Save first if changes exist
        if (hasChanges) {
            handleSave();
        }
        
        if (markInvoiceSent(invoice.id)) {
            loadData();
        }
    };

    const handleMarkPaid = () => {
        if (!invoice || invoice.status !== 'sent') return;
        if (markInvoicePaid(invoice.id)) {
            loadData();
        }
    };

    const handleRevertToSent = () => {
        if (!invoice || invoice.status !== 'paid') return;
        if (confirm(t('invoices:editor.undoPaidConfirm', 'Revert this invoice from Paid to Sent? This will NOT delete payment records.'))) {
            if (revertToSent(invoice.id)) {
                loadData();
            }
        }
    };

    // --- S7-A: Payment Handlers ---

    const totalPaid = invoice ? getTotalPaid(invoice.id) : 0;
    const remaining = invoice ? getRemaining(invoice.total, invoice.id) : 0;
    const invoiceIsOverdue = invoice ? isOverdue(invoice) : false;

    const openPaymentModal = () => {
        setPaymentAmount(remaining > 0 ? remaining : 0);
        setPaymentDate(new Date().toISOString().split('T')[0]);
        setPaymentMethod('transfer');
        setPaymentNotes('');
        setShowPaymentModal(true);
    };

    const handleRecordPayment = () => {
        if (!invoice || paymentAmount <= 0) return;
        createPayment({
            invoiceId: invoice.id,
            amount: paymentAmount,
            paidAt: paymentDate,
            method: paymentMethod,
            notes: paymentNotes
        });
        setShowPaymentModal(false);
        loadData();
    };

    const handleDeletePayment = (paymentId: string) => {
        if (confirm(t('invoices:payments.deleteConfirm', 'Delete this payment?'))) {
            deletePayment(paymentId);
            loadData();
        }
    };

    const handleDueDateChange = (newDate: string) => {
        if (!invoice) return;
        setLocalDueDate(newDate);
        setDueDate(invoice.id, newDate);
    };

    // --- Formatting ---

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
    };

    const formatDate = (iso: string) => {
        return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    if (!invoice) {
        return (
            <PageContainer>
                <Card className="p-8 text-center">
                    <p className="text-tokens-muted">{t('invoices:detail.notFound', 'Invoice not found')}</p>
                    <Button variant="ghost" onClick={() => navigate('/invoices')} className="mt-4">
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
                <h1 className="text-2xl font-bold text-tokens-fg">{invoice.number}</h1>
                <p className="text-tokens-muted mt-1">{t('invoices:detail.subtitle', 'Invoice details')}</p>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" onClick={() => navigate('/invoices')} icon={<ArrowLeft size={16} />}>
                    {t('common:buttons.back', 'Back')}
                </Button>
                <div className="flex-1" />
                <Badge variant={STATUS_COLORS[invoice.status]} className="text-sm px-3 py-1">
                    {t(`invoices:status.${invoice.status}`, invoice.status)}
                </Badge>
                
                {isDraft && (
                    <>
                        <Button 
                            variant="outline" 
                            icon={<Trash2 size={16} />}
                            className="text-tokens-error hover:text-tokens-error hover:bg-tokens-error/10"
                            onClick={() => {
                                if (window.confirm(t('common:confirmDelete', 'Are you sure you want to delete this invoice?'))) {
                                    if (id && deleteInvoice(id)) {
                                        navigate('/invoices');
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
                            {t('invoices:editor.send', 'Mark as Sent')}
                        </Button>
                    </>
                )}
                
                {invoice.status === 'sent' && (
                    <Button 
                        icon={<DollarSign size={16} />}
                        onClick={handleMarkPaid}
                    >
                        {t('invoices:editor.markPaid', 'Mark as Paid')}
                    </Button>
                )}
                
                {invoice.status === 'paid' && (
                    <Button 
                        variant="outline"
                        icon={<ArrowLeft size={16} />}
                        onClick={handleRevertToSent}
                    >
                        {t('invoices:editor.undoPaid', 'Undo Paid')}
                    </Button>
                )}
                
                {/* Export PDF - available for all statuses */}
                <Button 
                    variant="outline"
                    icon={<Download size={16} />}
                    onClick={() => exportInvoicePDF(invoice)}
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
                            <span className="text-sm font-medium">{t('invoices:detail.client', 'Client')}</span>
                        </div>
                        {isDraft && clients.length > 0 ? (
                            <Combobox
                                value={invoice.clientId}
                                onChange={(value) => {
                                    updateInvoice(invoice.id, { clientId: value });
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
                                <div className="font-semibold">{invoice.snapshot.clientName || '-'}</div>
                                {invoice.snapshot.clientCompany && (
                                    <div className="text-sm text-tokens-muted">{invoice.snapshot.clientCompany}</div>
                                )}
                                {invoice.snapshot.clientAddress && (
                                    <div className="text-sm text-tokens-muted mt-1">{invoice.snapshot.clientAddress}</div>
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
                            <span className="text-sm font-medium">{t('invoices:detail.business', 'From')}</span>
                        </div>
                        <div className="font-semibold">{invoice.snapshot.businessName || '-'}</div>
                        {invoice.snapshot.businessAddress && (
                            <div className="text-sm text-tokens-muted">{invoice.snapshot.businessAddress}</div>
                        )}
                    </div>
                </Card>

                {/* Project Selector (Draft only) */}
                {isDraft && (
                    <Card>
                        <div className="p-4">
                            <div className="flex items-center gap-2 mb-3 text-tokens-muted">
                                <FileText size={16} />
                                <span className="text-sm font-medium">{t('invoices:detail.project', 'Project')}</span>
                            </div>
                            <Combobox
                                value={invoice.projectId || ''}
                                onChange={(value) => {
                                    updateInvoice(invoice.id, { projectId: value || undefined });
                                    loadData();
                                }}
                                options={[
                                    { value: '', label: t('invoices:detail.selectProject', '-- No Project --') },
                                    ...(invoice.clientId ? getProjectsByClientId(invoice.clientId) : listProjects()).map((p: Project) => ({ 
                                        value: p.id, 
                                        label: p.name 
                                    }))
                                ]}
                                placeholder={t('invoices:detail.searchProject', 'Search projects...')}
                            />
                            {!invoice.clientId && (
                                <div className="text-xs text-tokens-muted mt-2">
                                    {t('invoices:detail.selectClientFirst', 'Select a client to filter projects')}
                                </div>
                            )}
                        </div>
                    </Card>
                )}
            </div>

            {/* Line Items Editor / Viewer */}
            <Card className="mb-6">
                <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-tokens-muted">
                            <FileText size={16} />
                            <span className="text-sm font-medium">{t('invoices:editor.lineItems', 'Line Items')}</span>
                            <Badge variant="neutral">{lineItems.length}</Badge>
                        </div>
                        {isDraft && (
                            <Button variant="outline" size="sm" icon={<Plus size={14} />} onClick={addLineItem}>
                                {t('invoices:editor.addItem', 'Add Item')}
                            </Button>
                        )}
                    </div>

                    {lineItems.length === 0 ? (
                        <p className="text-tokens-muted text-sm text-center py-8">
                            {t('invoices:editor.noItems', 'No line items. Click "Add Item" to start.')}
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-tokens-border text-left text-tokens-muted">
                                        {isDraft && <th className="p-2 w-16"></th>}
                                        <th className="p-2">{t('invoices:editor.item', 'Item')}</th>
                                        <th className="p-2 w-24 text-right">{t('invoices:editor.qty', 'Qty')}</th>
                                        <th className="p-2 w-32 text-right">{t('invoices:editor.price', 'Unit Price')}</th>
                                        <th className="p-2 w-32 text-right">{t('invoices:editor.lineTotal', 'Total')}</th>
                                        {isDraft && <th className="p-2 w-12"></th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {lineItems.map((li, index) => (
                                        <tr key={li.id} className="border-b border-tokens-border">
                                            {isDraft && (
                                                <td className="p-2">
                                                    <div className="flex flex-col gap-0.5">
                                                        <button 
                                                            onClick={() => moveLineItem(index, 'up')}
                                                            disabled={index === 0}
                                                            className="p-1 text-tokens-muted hover:text-tokens-fg disabled:opacity-30"
                                                        >
                                                            <ChevronUp size={12} />
                                                        </button>
                                                        <button 
                                                            onClick={() => moveLineItem(index, 'down')}
                                                            disabled={index === lineItems.length - 1}
                                                            className="p-1 text-tokens-muted hover:text-tokens-fg disabled:opacity-30"
                                                        >
                                                            <ChevronDown size={12} />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                            <td className="p-2">
                                                {isDraft ? (
                                                    <div className="space-y-1">
                                                        {catalogItems.length > 0 && (
                                                            <SelectDropdown
                                                                value=""
                                                                onChange={(value) => selectCatalogItem(li.id, value)}
                                                                options={[
                                                                    { value: '', label: t('invoices:editor.selectFromPricelist', '-- From Pricelist --') },
                                                                    ...catalogItems.map(c => ({ value: c.id, label: `${c.name} (${formatPrice(c.unitPrice)})` }))
                                                                ]}
                                                            />
                                                        )}
                                                        <Input
                                                            value={li.itemName}
                                                            onChange={(e) => updateLineItem(li.id, 'itemName', e.target.value)}
                                                            placeholder={t('invoices:editor.itemName', 'Item name')}
                                                            className="text-sm"
                                                        />
                                                        <Input
                                                            value={li.description}
                                                            onChange={(e) => updateLineItem(li.id, 'description', e.target.value)}
                                                            placeholder={t('invoices:editor.description', 'Description (optional)')}
                                                            className="text-xs"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <div className="font-medium">{li.itemName}</div>
                                                        {li.description && <div className="text-xs text-tokens-muted">{li.description}</div>}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-2 text-right">
                                                {isDraft ? (
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        value={li.quantity}
                                                        onChange={(e) => updateLineItem(li.id, 'quantity', Number(e.target.value))}
                                                        className="text-right text-sm w-20"
                                                    />
                                                ) : (
                                                    <span>{li.quantity}</span>
                                                )}
                                            </td>
                                            <td className="p-2 text-right">
                                                {isDraft ? (
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        value={li.unitPrice}
                                                        onChange={(e) => updateLineItem(li.id, 'unitPrice', Number(e.target.value))}
                                                        className="text-right text-sm w-28"
                                                    />
                                                ) : (
                                                    <span className="font-mono">{formatPrice(li.unitPrice)}</span>
                                                )}
                                            </td>
                                            <td className="p-2 text-right font-mono">
                                                {formatPrice(li.quantity * li.unitPrice)}
                                            </td>
                                            {isDraft && (
                                                <td className="p-2">
                                                    <button 
                                                        onClick={() => removeLineItem(li.id)}
                                                        className="p-1.5 text-tokens-muted hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Totals */}
                    <div className="border-t border-tokens-border mt-4 pt-4 space-y-2">
                        <div className="flex justify-between">
                            <span className="text-tokens-muted">{t('invoices:editor.subtotal', 'Subtotal')}</span>
                            <span className="font-mono">{formatPrice(subtotal)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-tokens-muted">{t('invoices:editor.adjustments', 'Adjustments')}</span>
                            {isDraft ? (
                                <Input
                                    type="number"
                                    value={adjustments}
                                    onChange={(e) => { setAdjustments(Number(e.target.value)); setHasChanges(true); }}
                                    className="text-right text-sm w-28"
                                />
                            ) : (
                                <span className="font-mono">{formatPrice(adjustments)}</span>
                            )}
                        </div>
                        <div className="flex justify-between text-lg font-semibold">
                            <span>{t('invoices:editor.total', 'Total')}</span>
                            <span className="font-mono text-tokens-brand-DEFAULT">{formatPrice(total)}</span>
                        </div>
                        {/* S7-A: Payment Summary */}
                        {!isDraft && (
                            <div className="border-t border-tokens-border mt-3 pt-3 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-tokens-muted">{t('invoices:payments.paid', 'Paid')}</span>
                                    <span className="font-mono text-green-600">{formatPrice(totalPaid)}</span>
                                </div>
                                <div className="flex justify-between text-sm font-medium">
                                    <span>{t('invoices:payments.remaining', 'Remaining')}</span>
                                    <span className={`font-mono ${remaining > 0 ? 'text-orange-500' : 'text-green-600'}`}>
                                        {formatPrice(remaining)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            {/* S7-A: Payments Section (only for non-draft) */}
            {!isDraft && (
                <Card className="mb-6">
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2 text-tokens-muted">
                                <DollarSign size={16} />
                                <span className="text-sm font-medium">{t('invoices:payments.title', 'Payments')}</span>
                                <Badge variant="neutral">{payments.length}</Badge>
                                {invoiceIsOverdue && (
                                    <Badge variant="error" className="ml-2">
                                        <AlertTriangle size={12} className="mr-1" />
                                        {t('invoices:payments.overdue', 'Overdue')}
                                    </Badge>
                                )}
                            </div>
                            {invoice?.status === 'sent' && (
                                <Button variant="outline" size="sm" icon={<Plus size={14} />} onClick={openPaymentModal}>
                                    {t('invoices:payments.record', 'Record Payment')}
                                </Button>
                            )}
                        </div>

                        {/* Due Date */}
                        <div className="flex items-center gap-2 mb-4 text-sm">
                            <Calendar size={14} className="text-tokens-muted" />
                            <span className="text-tokens-muted">{t('invoices:payments.dueDate', 'Due Date')}:</span>
                            <Input
                                type="date"
                                value={localDueDate}
                                onChange={(e) => handleDueDateChange(e.target.value)}
                                className="w-40 text-sm"
                            />
                        </div>

                        {/* Payments List */}
                        {payments.length === 0 ? (
                            <p className="text-tokens-muted text-sm text-center py-4">
                                {t('invoices:payments.noPayments', 'No payments recorded yet')}
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {payments.map((p) => (
                                    <div key={p.id} className="flex items-center justify-between p-3 bg-tokens-panel2 rounded-lg">
                                        <div>
                                            <div className="font-mono font-medium text-green-600">{formatPrice(p.amount)}</div>
                                            <div className="text-xs text-tokens-muted">
                                                {formatDate(p.paidAt)} • {p.method}
                                                {p.notes && ` • ${p.notes}`}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeletePayment(p.id)}
                                            className="p-1.5 text-tokens-muted hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Fully Paid Suggestion */}
                        {remaining <= 0 && invoice?.status === 'sent' && (
                            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                                <span className="text-sm text-green-700">
                                    {t('invoices:payments.fullyPaidSuggestion', 'Invoice is fully paid!')}
                                </span>
                                <Button size="sm" onClick={handleMarkPaid}>
                                    {t('invoices:editor.markPaid', 'Mark as Paid')}
                                </Button>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md mx-4">
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold">{t('invoices:payments.recordTitle', 'Record Payment')}</h3>
                                <button onClick={() => setShowPaymentModal(false)} className="text-tokens-muted hover:text-tokens-fg">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <Input
                                    label={t('invoices:payments.amount', 'Amount (IDR)')}
                                    type="number"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                                    min={1}
                                />
                                <Input
                                    label={t('invoices:payments.date', 'Payment Date')}
                                    type="date"
                                    value={paymentDate}
                                    onChange={(e) => setPaymentDate(e.target.value)}
                                />
                                <SelectDropdown
                                    label={t('invoices:payments.method', 'Payment Method')}
                                    value={paymentMethod}
                                    onChange={(value) => setPaymentMethod(value as PaymentMethod)}
                                    options={PAYMENT_METHODS.map(m => ({ value: m.value, label: t(`invoices:payments.methods.${m.value}`, m.label) }))}
                                />
                                <Input
                                    label={t('invoices:payments.notes', 'Notes (optional)')}
                                    value={paymentNotes}
                                    onChange={(e) => setPaymentNotes(e.target.value)}
                                    placeholder={t('invoices:payments.notesPlaceholder', 'e.g. Partial payment, DP...')}
                                />
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <Button variant="ghost" onClick={() => setShowPaymentModal(false)}>
                                    {t('common:buttons.cancel', 'Cancel')}
                                </Button>
                                <Button onClick={handleRecordPayment} disabled={paymentAmount <= 0}>
                                    {t('invoices:payments.save', 'Save Payment')}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Notes */}
            <Card className="mb-6">
                <div className="p-4">
                    <div className="flex items-center gap-2 mb-3 text-tokens-muted">
                        <FileText size={16} />
                        <span className="text-sm font-medium">{t('invoices:editor.notes', 'Notes')}</span>
                    </div>
                    {isDraft ? (
                        <textarea
                            value={notes}
                            onChange={(e) => { setNotes(e.target.value); setHasChanges(true); }}
                            placeholder={t('invoices:editor.notesPlaceholder', 'Additional notes...')}
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
                        <span>{t('invoices:detail.created', 'Created')}</span>
                        <span>{formatDate(invoice.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>{t('invoices:detail.updated', 'Updated')}</span>
                        <span>{formatDate(invoice.updatedAt)}</span>
                    </div>
                </div>
            </Card>

            {/* Freeze Notice */}
            {!isDraft && (
                <div className="mt-6 p-4 bg-tokens-panel2 rounded-lg text-center text-tokens-muted text-sm">
                    {t('invoices:editor.frozenNotice', 'This invoice is locked and cannot be edited.')}
                </div>
            )}
        </PageContainer>
    );
}
