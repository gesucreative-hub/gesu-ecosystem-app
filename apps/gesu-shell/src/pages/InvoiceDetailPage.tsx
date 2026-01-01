// Invoice Detail Page - S6-C: Full editor for BUSINESS workspace
// Draft: editable grid; Non-draft: read-only view (freeze)
// Supports: add/remove/edit line items, pricelist integration, status transitions

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '../components/PageContainer';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Badge } from '../components/Badge';
import { Select } from '../components/Select';
import { 
    ArrowLeft, Save, Send, DollarSign, Plus, 
    Trash2, FileText, Building2, User, ChevronUp, ChevronDown 
} from 'lucide-react';
import { usePersona } from '../hooks/usePersona';
import { 
    getInvoiceById, 
    updateInvoice,
    markInvoiceSent,
    markInvoicePaid,
    subscribe,
    type Invoice, 
    type InvoiceStatus
} from '../stores/invoiceStore';
import { listItems, type ServiceCatalogItem } from '../stores/serviceCatalogStore';

const STATUS_COLORS: Record<InvoiceStatus, 'neutral' | 'brand' | 'success' | 'warning'> = {
    draft: 'neutral',
    sent: 'brand',
    paid: 'success',
    cancelled: 'warning'
};

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

    // Redirect if not business persona
    useEffect(() => {
        if (activePersona !== 'business') {
            navigate('/compass', { replace: true });
        }
    }, [activePersona, navigate]);

    // Load invoice and catalog
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
            }
        }
        setCatalogItems(listItems());
    }, [id]);

    useEffect(() => {
        loadData();
        const unsub = subscribe(loadData);
        return unsub;
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
                        <div className="font-semibold">{invoice.snapshot.clientName || '-'}</div>
                        {invoice.snapshot.clientCompany && (
                            <div className="text-sm text-tokens-muted">{invoice.snapshot.clientCompany}</div>
                        )}
                        {invoice.snapshot.clientAddress && (
                            <div className="text-sm text-tokens-muted mt-1">{invoice.snapshot.clientAddress}</div>
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
                                                            <Select
                                                                value=""
                                                                onChange={(e) => selectCatalogItem(li.id, e.target.value)}
                                                                options={[
                                                                    { value: '', label: t('invoices:editor.selectFromPricelist', '-- From Pricelist --') },
                                                                    ...catalogItems.map(c => ({ value: c.id, label: `${c.name} (${formatPrice(c.unitPrice)})` }))
                                                                ]}
                                                                className="text-xs"
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
                    </div>
                </div>
            </Card>

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
