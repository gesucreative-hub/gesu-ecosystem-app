// Pricelist Page - S6-B: Service catalog management for BUSINESS workspace
// CRUD operations + search + category filter

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '../components/PageContainer';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { SearchInput } from '../components/SearchInput';
import { SelectDropdown } from '../components/Dropdown';
import { SidePanel } from '../components/SidePanel';
import { Plus, Edit2, Trash2, Tag, X, Check } from 'lucide-react';
import { usePersona } from '../hooks/usePersona';
import { 
    listItems, 
    searchItems, 
    getItemsByCategory,
    getCategories,
    createItem, 
    updateItem, 
    deleteItem,
    subscribe,
    type ServiceCatalogItem 
} from '../stores/serviceCatalogStore';

type FormMode = 'closed' | 'create' | 'edit';

interface FormData {
    name: string;
    description: string;
    unit: 'item' | 'jam' | 'hari' | 'paket';
    unitPrice: number;
    category: string;
}

const UNIT_OPTIONS = [
    { value: 'item', label: 'Item' },
    { value: 'jam', label: 'Jam (Hour)' },
    { value: 'hari', label: 'Hari (Day)' },
    { value: 'paket', label: 'Paket (Package)' }
];

export function PricelistPage() {
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
    const [items, setItems] = useState<ServiceCatalogItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [categories, setCategories] = useState<string[]>([]);
    const [formMode, setFormMode] = useState<FormMode>('closed');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<FormData>({
        name: '',
        description: '',
        unit: 'item',
        unitPrice: 0,
        category: ''
    });

    // Load data
    const loadData = () => {
        let result: ServiceCatalogItem[];
        if (searchQuery) {
            result = searchItems(searchQuery);
        } else if (categoryFilter) {
            result = getItemsByCategory(categoryFilter);
        } else {
            result = listItems();
        }
        setItems(result);
        setCategories(getCategories());
    };

    useEffect(() => {
        loadData();
        const unsub = subscribe(loadData);
        return unsub;
    }, [searchQuery, categoryFilter]);

    // Form handlers
    const resetForm = () => {
        setFormMode('closed');
        setEditingId(null);
        setFormData({ name: '', description: '', unit: 'item', unitPrice: 0, category: '' });
    };

    const openCreate = () => {
        resetForm();
        setFormMode('create');
    };

    const openEdit = (item: ServiceCatalogItem) => {
        setFormMode('edit');
        setEditingId(item.id);
        setFormData({
            name: item.name,
            description: item.description,
            unit: item.unit,
            unitPrice: item.unitPrice,
            category: item.category
        });
    };

    const handleSubmit = () => {
        if (!formData.name.trim()) {
            alert(t('invoices:pricelist.nameRequired', 'Name is required'));
            return;
        }

        if (formMode === 'create') {
            createItem(formData);
        } else if (formMode === 'edit' && editingId) {
            updateItem(editingId, formData);
        }
        resetForm();
    };

    const handleDelete = (id: string, name: string) => {
        if (confirm(t('invoices:pricelist.deleteConfirm', `Delete "${name}"?`))) {
            deleteItem(id);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
    };

    return (
        <PageContainer>
            {/* Page Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-tokens-fg tracking-tight flex items-center gap-3">
                        <Tag size={32} className="text-tokens-brand-DEFAULT" />
                        {t('invoices:pricelist.title', 'Pricelist')}
                    </h1>
                    <p className="text-tokens-muted text-sm mt-1">
                        {t('invoices:pricelist.subtitle', 'Manage your service catalog and pricing')}
                    </p>
                </div>
                <Button variant="primary" onClick={openCreate} icon={<Plus size={16} />}>
                    {t('invoices:pricelist.add', 'Add Item')}
                </Button>
            </div>

            {/* Search + Filter */}
            <div className="flex flex-wrap gap-3 mb-6">
                <div className="flex-1 min-w-[200px]">
                    <SearchInput
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('invoices:pricelist.searchPlaceholder', 'Search items...')}
                        fullWidth
                    />
                </div>
                <SelectDropdown
                    value={categoryFilter}
                    onChange={(value) => setCategoryFilter(value)}
                    options={[
                        { value: '', label: t('invoices:pricelist.allCategories', 'All Categories') },
                        ...categories.map(c => ({ value: c, label: c }))
                    ]}
                />
            </div>

            {/* Form (Create/Edit) Panel */}
            <SidePanel
                isOpen={formMode !== 'closed'}
                onClose={resetForm}
                title={formMode === 'create' 
                    ? t('invoices:pricelist.addTitle', 'Add New Item')
                    : t('invoices:pricelist.editTitle', 'Edit Item')}
                width="600px"
            >
                <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-4">
                        <Input
                            label={t('invoices:pricelist.name', 'Name') + ' *'}
                            value={formData.name}
                            onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                            placeholder="Desain Merek"
                            autoFocus
                        />
                        <Input
                            label={t('invoices:pricelist.description', 'Description')}
                            value={formData.description}
                            onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
                            placeholder="Logo design and brand guidelines"
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <SelectDropdown
                                label={t('invoices:pricelist.unit', 'Unit')}
                                value={formData.unit}
                                onChange={(value) => setFormData(f => ({ ...f, unit: value as FormData['unit'] }))}
                                options={UNIT_OPTIONS}
                            />
                            <Input
                                label={t('invoices:pricelist.price', 'Unit Price (IDR)')}
                                type="number"
                                value={formData.unitPrice}
                                onChange={(e) => setFormData(f => ({ ...f, unitPrice: Number(e.target.value) }))}
                                placeholder="45000"
                            />
                        </div>
                        <Input
                            label={t('invoices:pricelist.category', 'Category')}
                            value={formData.category}
                            onChange={(e) => setFormData(f => ({ ...f, category: e.target.value }))}
                            placeholder="Desain"
                        />
                    </div>

                    <div className="flex gap-3 justify-end pt-4 border-t border-tokens-border">
                        <Button variant="secondary" onClick={resetForm}>
                            {t('common:buttons.cancel', 'Cancel')}
                        </Button>
                        <Button variant="primary" onClick={handleSubmit}>
                            {formMode === 'create' 
                                ? t('common:buttons.create', 'Create')
                                : t('common:buttons.update', 'Update')}
                        </Button>
                    </div>
                </div>
            </SidePanel>

            {/* Items List */}
            {items.length === 0 ? (
                <Card className="p-8 text-center">
                    <Tag size={40} className="mx-auto text-tokens-muted mb-3 opacity-50" />
                    <p className="text-tokens-muted">
                        {searchQuery || categoryFilter
                            ? t('invoices:pricelist.noResults', 'No items found')
                            : t('invoices:pricelist.noItems', 'No items yet. Add your first service!')}
                    </p>
                </Card>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-tokens-border text-left text-sm text-tokens-muted">
                                <th className="p-3 font-medium">{t('invoices:pricelist.name', 'Name')}</th>
                                <th className="p-3 font-medium">{t('invoices:pricelist.category', 'Category')}</th>
                                <th className="p-3 font-medium">{t('invoices:pricelist.unit', 'Unit')}</th>
                                <th className="p-3 font-medium text-right">{t('invoices:pricelist.price', 'Price')}</th>
                                <th className="p-3 font-medium w-16"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(item => (
                                <tr 
                                    key={item.id} 
                                    className="border-b border-tokens-border hover:bg-tokens-panel2 transition-colors cursor-pointer group"
                                    onClick={() => openEdit(item)}
                                >
                                    <td className="p-3">
                                        <div className="font-medium text-tokens-fg">{item.name}</div>
                                        {item.description && (
                                            <div className="text-sm text-tokens-muted">{item.description}</div>
                                        )}
                                    </td>
                                    <td className="p-3 text-sm">{item.category || '-'}</td>
                                    <td className="p-3 text-sm">{item.unit}</td>
                                    <td className="p-3 text-right font-mono text-tokens-brand-DEFAULT">{formatPrice(item.unitPrice)}</td>
                                    <td className="p-3 text-right">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(item.id, item.name); }}
                                            className="p-1.5 rounded hover:bg-red-500/10 text-tokens-muted hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                            title={t('common:buttons.delete', 'Delete')}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </PageContainer>
    );
}
