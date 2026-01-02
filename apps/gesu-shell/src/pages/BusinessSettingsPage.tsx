// Business Settings Page - S5-1: Business Profile management
// BUSINESS workspace only

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '../components/PageContainer';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Badge } from '../components/Badge';
import { Building2, CreditCard, FileText, Hash, Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import { usePersona } from '../hooks/usePersona';
import {
    getBusinessProfile,
    updateBusinessProfile,
    addPaymentMethod,
    removePaymentMethod,
    getPaymentMethods,
    type BusinessProfile,
    type PaymentMethod
} from '../stores/businessProfileStore';

export function BusinessSettingsPage() {
    const { t } = useTranslation(['business', 'common']);
    const navigate = useNavigate();
    const { activePersona } = usePersona();

    // Redirect if not BUSINESS persona
    useEffect(() => {
        if (activePersona !== 'business') {
            navigate('/compass');
        }
    }, [activePersona, navigate]);

    // Profile state
    const [profile, setProfile] = useState<BusinessProfile>(getBusinessProfile());
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(getPaymentMethods());
    const [isDirty, setIsDirty] = useState(false);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);

    // New payment method form
    const [showAddPayment, setShowAddPayment] = useState(false);
    const [newPayment, setNewPayment] = useState({
        label: '',
        bankName: '',
        accountNumber: '',
        accountHolder: '',
        isDefault: false
    });

    // Reload data
    useEffect(() => {
        setProfile(getBusinessProfile());
        setPaymentMethods(getPaymentMethods());
    }, []);

    const handleProfileChange = (field: keyof BusinessProfile, value: string | number) => {
        setProfile(prev => ({ ...prev, [field]: value }));
        setIsDirty(true);
    };

    const handleSave = () => {
        updateBusinessProfile(profile);
        setIsDirty(false);
        setSaveMessage('Settings saved successfully!');
        setTimeout(() => setSaveMessage(null), 3000);
    };

    const handleAddPaymentMethod = () => {
        if (!newPayment.bankName || !newPayment.accountNumber) return;
        
        addPaymentMethod(newPayment);
        setPaymentMethods(getPaymentMethods());
        setNewPayment({ label: '', bankName: '', accountNumber: '', accountHolder: '', isDefault: false });
        setShowAddPayment(false);
    };

    const handleRemovePaymentMethod = (id: string) => {
        if (confirm(t('business:settings.payment.removeConfirm', 'Remove this payment method?'))) {
            removePaymentMethod(id);
            setPaymentMethods(getPaymentMethods());
        }
    };

    if (activePersona !== 'business') {
        return null;
    }

    return (
        <PageContainer className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-tokens-fg tracking-tight flex items-center gap-3">
                        <Building2 size={32} className="text-tokens-brand-DEFAULT" />
                        {t('business:settings.title', 'Business Settings')}
                    </h1>
                    <p className="text-tokens-muted text-sm mt-1">
                        {t('business:settings.subtitle', 'Configure your business identity, payment methods, and document numbering')}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="secondary"
                        onClick={() => navigate(-1)}
                        icon={<ArrowLeft size={16} />}
                    >
                        {t('common:buttons.back', 'Back')}
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        disabled={!isDirty}
                        icon={<Save size={16} />}
                    >
                        {t('common:buttons.save', 'Save')}
                    </Button>
                </div>
            </div>

            {/* Save Message */}
            {saveMessage && (
                <div className="bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 px-4 py-2 rounded-lg text-sm">
                    ✓ {saveMessage}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Business Identity */}
                <Card
                    title={
                        <div className="flex items-center gap-2">
                            <Building2 size={18} className="text-tokens-brand-DEFAULT" />
                            <span>{t('business:settings.identity.title', 'Business Identity')}</span>
                        </div>
                    }
                >
                    <div className="space-y-4">
                        <Input
                            label={t('business:settings.identity.businessName', 'Business Name')}
                            value={profile.businessName}
                            onChange={(e) => handleProfileChange('businessName', e.target.value)}
                            placeholder="PT Gesu Creative"
                        />
                        <Input
                            label={t('business:settings.identity.address', 'Business Address')}
                            value={profile.businessAddress}
                            onChange={(e) => handleProfileChange('businessAddress', e.target.value)}
                            placeholder="Jl. Example No. 123, Jakarta"
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label={t('business:settings.identity.email', 'Email')}
                                value={profile.businessEmail}
                                onChange={(e) => handleProfileChange('businessEmail', e.target.value)}
                                placeholder="hello@example.com"
                            />
                            <Input
                                label={t('business:settings.identity.phone', 'Phone')}
                                value={profile.businessPhone}
                                onChange={(e) => handleProfileChange('businessPhone', e.target.value)}
                                placeholder="+62 812 3456 789"
                            />
                        </div>
                        <Input
                            label={t('business:settings.identity.taxId', 'Tax ID (NPWP)')}
                            value={profile.taxId}
                            onChange={(e) => handleProfileChange('taxId', e.target.value)}
                            placeholder="12.345.678.9-012.000"
                        />
                    </div>
                </Card>

                {/* Payment Methods */}
                <Card
                    title={
                        <div className="flex items-center gap-2">
                            <CreditCard size={18} className="text-tokens-brand-DEFAULT" />
                            <span>{t('business:settings.payment.title', 'Payment Methods')}</span>
                        </div>
                    }
                    headerAction={
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowAddPayment(!showAddPayment)}
                            icon={<Plus size={14} />}
                        >
                            {t('business:settings.payment.add', 'Add')}
                        </Button>
                    }
                >
                    <div className="space-y-3">
                        {paymentMethods.length === 0 ? (
                            <p className="text-tokens-muted text-sm italic text-center py-4">
                                {t('business:settings.payment.noPayment', 'No payment methods configured')}
                            </p>
                        ) : (
                            paymentMethods.map((pm) => (
                                <div
                                    key={pm.id}
                                    className="flex items-center justify-between p-3 bg-tokens-bg rounded-lg border border-tokens-border"
                                >
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-tokens-fg">{pm.label || pm.bankName}</span>
                                            {pm.isDefault && <Badge variant="brand">{t('business:settings.payment.default', 'Default')}</Badge>}
                                        </div>
                                        <div className="text-xs text-tokens-muted">
                                            {pm.bankName} - {pm.accountNumber}
                                        </div>
                                        <div className="text-xs text-tokens-muted">{pm.accountHolder}</div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleRemovePaymentMethod(pm.id)}
                                        icon={<Trash2 size={14} className="text-red-500" />}
                                    />
                                </div>
                            ))
                        )}

                        {/* Add Payment Form */}
                        {showAddPayment && (
                            <div className="mt-4 p-4 bg-tokens-panel2/50 rounded-lg border border-tokens-border space-y-3">
                                <Input
                                    label={t('business:settings.payment.label', 'Label (optional)')}
                                    value={newPayment.label}
                                    onChange={(e) => setNewPayment(p => ({ ...p, label: e.target.value }))}
                                    placeholder={t('business:settings.payment.labelPlaceholder', 'e.g., BCA - Main')}
                                />
                                <Input
                                    label={t('business:settings.payment.bankName', 'Bank Name')}
                                    value={newPayment.bankName}
                                    onChange={(e) => setNewPayment(p => ({ ...p, bankName: e.target.value }))}
                                    placeholder={t('business:settings.payment.bankNamePlaceholder', 'Bank Central Asia')}
                                />
                                <Input
                                    label={t('business:settings.payment.accountNumber', 'Account Number')}
                                    value={newPayment.accountNumber}
                                    onChange={(e) => setNewPayment(p => ({ ...p, accountNumber: e.target.value }))}
                                    placeholder={t('business:settings.payment.accountNumberPlaceholder', '1234567890')}
                                />
                                <Input
                                    label={t('business:settings.payment.accountHolder', 'Account Holder')}
                                    value={newPayment.accountHolder}
                                    onChange={(e) => setNewPayment(p => ({ ...p, accountHolder: e.target.value }))}
                                    placeholder={t('business:settings.payment.accountHolderPlaceholder', 'PT Gesu Creative')}
                                />
                                <label className="flex items-center gap-2 text-sm text-tokens-fg">
                                    <input
                                        type="checkbox"
                                        checked={newPayment.isDefault}
                                        onChange={(e) => setNewPayment(p => ({ ...p, isDefault: e.target.checked }))}
                                        className="rounded"
                                    />
                                    {t('business:settings.payment.setDefault', 'Set as default')}
                                </label>
                                <div className="flex gap-2 justify-end">
                                    <Button size="sm" variant="secondary" onClick={() => setShowAddPayment(false)}>
                                        {t('common:buttons.cancel', 'Cancel')}
                                    </Button>
                                    <Button size="sm" variant="primary" onClick={handleAddPaymentMethod}>
                                        {t('common:buttons.add', 'Add')}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Numbering Rules */}
                <Card
                    title={
                        <div className="flex items-center gap-2">
                            <Hash size={18} className="text-tokens-brand-DEFAULT" />
                            <span>{t('business:settings.numbering.title', 'Document Numbering')}</span>
                        </div>
                    }
                >
                    <div className="space-y-4">
                        <div>
                            <Input
                                label={t('business:settings.numbering.invoiceFormat', 'Invoice Number Format')}
                                value={profile.invoiceNumberFormat}
                                onChange={(e) => handleProfileChange('invoiceNumberFormat', e.target.value)}
                            />
                            <p className="text-xs text-tokens-muted mt-1">
                                {t('business:settings.numbering.tokenHelp', 'Tokens: {YYYY}, {YY}, {MM}, {DD}, {####}')}
                            </p>
                        </div>
                        <Input
                            label={t('business:settings.numbering.nextInvoice', 'Next Invoice Sequence')}
                            type="number"
                            value={profile.nextInvoiceSeq}
                            onChange={(e) => handleProfileChange('nextInvoiceSeq', parseInt(e.target.value) || 1)}
                        />
                        <hr className="border-tokens-border" />
                        <div>
                            <Input
                                label={t('business:settings.numbering.contractFormat', 'Contract Number Format')}
                                value={profile.contractNumberFormat}
                                onChange={(e) => handleProfileChange('contractNumberFormat', e.target.value)}
                            />
                            <p className="text-xs text-tokens-muted mt-1">
                                {t('business:settings.numbering.example', 'Example')}: GCL/BRD/{'{MM}'}/{'{###}'}/{'{YYYY}'}
                            </p>
                        </div>
                        <Input
                            label={t('business:settings.numbering.nextContract', 'Next Contract Sequence')}
                            type="number"
                            value={profile.nextContractSeq}
                            onChange={(e) => handleProfileChange('nextContractSeq', parseInt(e.target.value) || 1)}
                        />
                    </div>
                </Card>

                {/* Default Terms */}
                <Card
                    title={
                        <div className="flex items-center gap-2">
                            <FileText size={18} className="text-tokens-brand-DEFAULT" />
                            <span>{t('business:settings.terms.title', 'Default Terms')}</span>
                        </div>
                    }
                    className="lg:col-span-2"
                >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-tokens-fg mb-2">
                                {t('business:settings.terms.invoiceTerms', 'Invoice Terms')}
                            </label>
                            <textarea
                                value={profile.invoiceTerms}
                                onChange={(e) => handleProfileChange('invoiceTerms', e.target.value)}
                                className="w-full h-40 px-4 py-3 bg-tokens-bg border border-tokens-border rounded-lg text-tokens-fg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-tokens-brand-DEFAULT/30"
                                placeholder="Payment terms, late fees, notes..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-tokens-fg mb-2">
                                {t('business:settings.terms.contractTerms', 'Contract Terms')}
                            </label>
                            <textarea
                                value={profile.contractTerms}
                                onChange={(e) => handleProfileChange('contractTerms', e.target.value)}
                                className="w-full h-40 px-4 py-3 bg-tokens-bg border border-tokens-border rounded-lg text-tokens-fg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-tokens-brand-DEFAULT/30"
                                placeholder="General terms and conditions..."
                            />
                        </div>
                    </div>
                </Card>
            </div>
        </PageContainer>
    );
}
