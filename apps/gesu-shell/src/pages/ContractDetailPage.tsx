// Contract Detail Page - S6-B: Read-only stub for BUSINESS workspace
// Shows contract summary, edit button disabled with "Coming in S6-C" message

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '../components/PageContainer';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { ArrowLeft, Edit, FileText, Building2, User, List } from 'lucide-react';
import { usePersona } from '../hooks/usePersona';
import { getContractById, type Contract, type ContractStatus } from '../stores/contractStore';

const STATUS_COLORS: Record<ContractStatus, 'neutral' | 'brand' | 'success' | 'warning'> = {
    draft: 'neutral',
    sent: 'brand',
    signed: 'success',
    cancelled: 'warning'
};

export function ContractDetailPage() {
    const { t } = useTranslation(['invoices', 'common']);
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { activePersona } = usePersona();

    const [contract, setContract] = useState<Contract | null>(null);

    // Redirect if not business persona
    useEffect(() => {
        if (activePersona !== 'business') {
            navigate('/compass', { replace: true });
        }
    }, [activePersona, navigate]);

    // Load contract
    useEffect(() => {
        if (id) {
            const ctr = getContractById(id);
            setContract(ctr);
        }
    }, [id]);

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
                <Button 
                    variant="outline" 
                    icon={<Edit size={16} />}
                    disabled
                    title={t('invoices:contractDetail.editDisabled', 'Coming in S6-C')}
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
                            <span className="text-sm font-medium">{t('invoices:contractDetail.client', 'Client')}</span>
                        </div>
                        <div className="font-semibold">{contract.snapshot.clientName || '-'}</div>
                        {contract.snapshot.clientCompany && (
                            <div className="text-sm text-tokens-muted">{contract.snapshot.clientCompany}</div>
                        )}
                        {contract.snapshot.clientAddress && (
                            <div className="text-sm text-tokens-muted mt-1">{contract.snapshot.clientAddress}</div>
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
            </div>

            {/* Scope */}
            <Card className="mb-6">
                <div className="p-4">
                    <div className="flex items-center gap-2 mb-4 text-tokens-muted">
                        <List size={16} />
                        <span className="text-sm font-medium">{t('invoices:contractDetail.scope', 'Project Scope')}</span>
                        <Badge variant="neutral">{contract.scope.length}</Badge>
                    </div>
                    {contract.scope.length === 0 ? (
                        <p className="text-tokens-muted text-sm">{t('invoices:contractDetail.noScope', 'No scope items defined')}</p>
                    ) : (
                        <ul className="space-y-2">
                            {contract.scope.map((item, index) => (
                                <li key={item.id} className="flex gap-2 text-sm">
                                    <span className="text-tokens-muted">{index + 1}.</span>
                                    <span>{item.description}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </Card>

            {/* Terms Preview */}
            <Card className="mb-6">
                <div className="p-4">
                    <div className="flex items-center gap-2 mb-3 text-tokens-muted">
                        <FileText size={16} />
                        <span className="text-sm font-medium">{t('invoices:contractDetail.terms', 'Terms & Conditions')}</span>
                    </div>
                    <pre className="text-sm text-tokens-fg whitespace-pre-wrap font-sans">
                        {contract.terms || t('invoices:contractDetail.noTerms', 'No terms defined')}
                    </pre>
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

            {/* S6-C Notice */}
            <div className="mt-6 p-4 bg-tokens-panel2 rounded-lg text-center text-tokens-muted text-sm">
                {t('invoices:contractDetail.editorNotice', 'Contract editor (scope builder) coming in S6-C')}
            </div>
        </PageContainer>
    );
}
