// Invoice Detail Page - S6-B: Read-only stub for BUSINESS workspace
// Shows invoice summary, edit button disabled with "Coming in S6-C" message

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '../components/PageContainer';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { ArrowLeft, Edit, FileText, Building2, User } from 'lucide-react';
import { usePersona } from '../hooks/usePersona';
import { getInvoiceById, type Invoice, type InvoiceStatus } from '../stores/invoiceStore';

const STATUS_COLORS: Record<InvoiceStatus, 'neutral' | 'brand' | 'success' | 'warning'> = {
    draft: 'neutral',
    sent: 'brand',
    paid: 'success',
    cancelled: 'warning'
};

export function InvoiceDetailPage() {
    const { t } = useTranslation(['invoices', 'common']);
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { activePersona } = usePersona();

    const [invoice, setInvoice] = useState<Invoice | null>(null);

    // Redirect if not business persona
    useEffect(() => {
        if (activePersona !== 'business') {
            navigate('/compass', { replace: true });
        }
    }, [activePersona, navigate]);

    // Load invoice
    useEffect(() => {
        if (id) {
            const inv = getInvoiceById(id);
            setInvoice(inv);
        }
    }, [id]);

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
                <Button 
                    variant="outline" 
                    icon={<Edit size={16} />}
                    disabled
                    title={t('invoices:detail.editDisabled', 'Coming in S6-C')}
                >
                    {t('common:buttons.edit', 'Edit')}
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

            {/* Totals */}
            <Card className="mb-6">
                <div className="p-4">
                    <div className="flex items-center gap-2 mb-4 text-tokens-muted">
                        <FileText size={16} />
                        <span className="text-sm font-medium">{t('invoices:detail.summary', 'Summary')}</span>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-tokens-muted">{t('invoices:editor.lineItems', 'Line Items')}</span>
                            <span>{invoice.lineItems.length} {t('invoices:detail.items', 'items')}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-tokens-muted">{t('invoices:editor.subtotal', 'Subtotal')}</span>
                            <span className="font-mono">{formatPrice(invoice.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-tokens-muted">{t('invoices:editor.adjustments', 'Adjustments')}</span>
                            <span className="font-mono">{formatPrice(invoice.adjustments)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-semibold border-t border-tokens-border pt-2 mt-2">
                            <span>{t('invoices:editor.total', 'Total')}</span>
                            <span className="font-mono text-tokens-brand-DEFAULT">{formatPrice(invoice.total)}</span>
                        </div>
                    </div>
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

            {/* S6-C Notice */}
            <div className="mt-6 p-4 bg-tokens-panel2 rounded-lg text-center text-tokens-muted text-sm">
                {t('invoices:detail.editorNotice', 'Invoice editor (line items grid) coming in S6-C')}
            </div>
        </PageContainer>
    );
}
