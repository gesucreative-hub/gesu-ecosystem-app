// Second Brain Page - S8: Inbox + PARA assignment for PERSONAL persona
// Quick capture input + items list with PARA dropdown + export

import { useState, useEffect, useCallback } from 'react';

import { useTranslation } from 'react-i18next';
import { PageContainer } from '../components/PageContainer';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Badge } from '../components/Badge';
import { SelectDropdown } from '../components/Dropdown';
import { 
    Brain, Plus, Trash2, Download, Inbox, FolderKanban, 
    Compass, BookOpen, Archive, Filter, Check, ChevronDown
} from 'lucide-react';
import {
    listItems,
    addItem,
    deleteItem,
    assignParaBucket,
    getInboxCount,
    exportToMarkdown,
    subscribe,
    type SecondBrainItem,
    type ParaBucket
} from '../stores/secondBrainStore';

const PARA_OPTIONS: { value: ParaBucket; label: string; icon: React.ReactNode }[] = [
    { value: null, label: 'Inbox', icon: <Inbox size={14} /> },
    { value: 'projects', label: 'Projects', icon: <FolderKanban size={14} /> },
    { value: 'areas', label: 'Areas', icon: <Compass size={14} /> },
    { value: 'resources', label: 'Resources', icon: <BookOpen size={14} /> },
    { value: 'archives', label: 'Archives', icon: <Archive size={14} /> }
];

export function SecondBrainPage() {
    const { t } = useTranslation(['secondbrain', 'common']);


    // State
    const [items, setItems] = useState<SecondBrainItem[]>([]);
    const [inboxCount, setInboxCount] = useState(0);
    const [filterBucket, setFilterBucket] = useState<ParaBucket | 'all'>('all');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    
    // Quick capture
    const [captureTitle, setCaptureTitle] = useState('');
    const [captureContent, setCaptureContent] = useState('');

    // Redirect if not personal persona


    // Load data
    const loadData = useCallback(() => {
        const filters = filterBucket === 'all' ? undefined : { paraBucket: filterBucket };
        setItems(listItems(filters));
        setInboxCount(getInboxCount());
    }, [filterBucket]);

    useEffect(() => {
        loadData();
        const unsub = subscribe(loadData);
        return unsub;
    }, [loadData]);

    // Handlers
    const handleCapture = () => {
        if (!captureContent.trim()) return;
        
        addItem({
            content: captureContent,
            title: captureTitle || undefined
        });
        
        setCaptureTitle('');
        setCaptureContent('');
        loadData();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            handleCapture();
        }
    };

    const handleAssignBucket = (itemId: string, bucket: ParaBucket) => {
        assignParaBucket(itemId, bucket);
        loadData();
    };

    const handleDelete = (itemId: string) => {
        if (confirm(t('secondbrain:deleteConfirm', 'Delete this item?'))) {
            deleteItem(itemId);
            loadData();
        }
    };

    const handleExport = () => {
        const md = exportToMarkdown();
        const blob = new Blob([md], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `second-brain-export-${new Date().toISOString().split('T')[0]}.md`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const formatDate = (iso: string) => {
        return new Date(iso).toLocaleDateString('id-ID', { 
            day: 'numeric', 
            month: 'short' 
        });
    };

    const getBucketLabel = (bucket: ParaBucket) => {
        const opt = PARA_OPTIONS.find(o => o.value === bucket);
        return opt?.label || 'Inbox';
    };

    const getBucketVariant = (bucket: ParaBucket): 'neutral' | 'success' | 'warning' | 'error' => {
        switch (bucket) {
            case 'projects': return 'success';
            case 'areas': return 'warning';
            case 'resources': return 'neutral';
            case 'archives': return 'neutral';
            default: return 'neutral';
        }
    };

    return (
        <PageContainer>
            {/* Header */}
            <Card className="mb-6">
                <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <Brain size={24} className="text-tokens-brand-DEFAULT" />
                            <div>
                                <h1 className="text-xl font-semibold">{t('secondbrain:title', 'Second Brain')}</h1>
                                <p className="text-sm text-tokens-muted">{t('secondbrain:subtitle', 'Capture and organize your thoughts')}</p>
                            </div>
                            {inboxCount > 0 && (
                                <Badge variant="warning">{inboxCount} {t('secondbrain:inbox', 'inbox')}</Badge>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                            {/* Filter Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                                    className={`
                                        flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all
                                        ${filterBucket !== 'all'
                                            ? 'bg-tokens-brand-DEFAULT/10 border-tokens-brand-DEFAULT/50 text-tokens-brand-DEFAULT'
                                            : 'bg-tokens-panel border-tokens-border text-tokens-muted hover:text-tokens-fg hover:border-tokens-fg/20'
                                        }
                                    `}
                                >
                                    <Filter size={16} />
                                    <span>
                                        {filterBucket === 'all' 
                                            ? t('secondbrain:all', 'All Items')
                                            : getBucketLabel(filterBucket)
                                        }
                                    </span>
                                    <ChevronDown size={14} className={`transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isFilterOpen && (
                                    <>
                                        <div 
                                            className="fixed inset-0 z-40"
                                            onClick={() => setIsFilterOpen(false)}
                                        />
                                        <div className="absolute right-0 top-full mt-2 w-48 bg-tokens-panel border border-tokens-border rounded-lg shadow-xl z-50 p-1 animate-in fade-in zoom-in-95 duration-200">
                                            <div className="text-xs font-semibold text-tokens-muted px-2 py-1.5 uppercase tracking-wider">
                                                {t('secondbrain:filterBy', 'Filter View')}
                                            </div>
                                            <div className="px-1 pb-1 space-y-0.5">
                                                <button
                                                    onClick={() => {
                                                        setFilterBucket('all');
                                                        setIsFilterOpen(false);
                                                    }}
                                                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors ${
                                                        filterBucket === 'all' 
                                                            ? 'bg-tokens-brand-DEFAULT/10 text-tokens-brand-DEFAULT font-medium' 
                                                            : 'text-tokens-fg hover:bg-tokens-panel2'
                                                    }`}
                                                >
                                                    <span className="flex items-center gap-2">
                                                        <Filter size={14} />
                                                        {t('secondbrain:all', 'All Items')}
                                                    </span>
                                                    {filterBucket === 'all' && <Check size={14} />}
                                                </button>
                                                
                                                <div className="border-t border-tokens-border my-1"></div>

                                                {PARA_OPTIONS.map(opt => (
                                                    <button
                                                        key={opt.value || 'inbox'}
                                                        onClick={() => {
                                                            setFilterBucket(opt.value);
                                                            setIsFilterOpen(false);
                                                        }}
                                                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors ${
                                                            filterBucket === opt.value 
                                                                ? 'bg-tokens-brand-DEFAULT/10 text-tokens-brand-DEFAULT font-medium' 
                                                                : 'text-tokens-fg hover:bg-tokens-panel2'
                                                        }`}
                                                    >
                                                        <span className="flex items-center gap-2">
                                                            {opt.icon}
                                                            {t(`secondbrain:para.${opt.value || 'inbox'}`, opt.label)}
                                                        </span>
                                                        {filterBucket === opt.value && <Check size={14} />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            <Button variant="outline" icon={<Download size={16} />} onClick={handleExport}>
                                {t('secondbrain:export', 'Export')}
                            </Button>
                        </div>
                    </div>

                    {/* Quick Capture */}
                    <div className="space-y-2">
                        <Input
                            placeholder={t('secondbrain:titlePlaceholder', 'Title (optional)')}
                            value={captureTitle}
                            onChange={(e) => setCaptureTitle(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <div className="flex gap-2 w-full">
                            <div className="flex-1">
                                <Input
                                    placeholder={t('secondbrain:contentPlaceholder', 'What\'s on your mind? (Ctrl+Enter to save)')}
                                    value={captureContent}
                                    onChange={(e) => setCaptureContent(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    fullWidth
                                />
                            </div>
                            <Button icon={<Plus size={16} />} onClick={handleCapture} disabled={!captureContent.trim()}>
                                {t('secondbrain:capture', 'Capture')}
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>



            {/* Items List */}
            {items.length === 0 ? (
                <Card className="p-8 text-center">
                    <Brain size={40} className="mx-auto mb-4 text-tokens-muted opacity-50" />
                    <p className="text-tokens-muted">
                        {filterBucket === 'all' 
                            ? t('secondbrain:empty', 'Your Second Brain is empty. Start capturing!')
                            : t('secondbrain:emptyFilter', 'No items in this category')}
                    </p>
                </Card>
            ) : (
                <div className="space-y-3">
                    {items.map((item) => (
                        <Card key={item.id} className="p-4">
                            <div className="flex items-start gap-3">
                                <div className="flex-1">
                                    {item.title && (
                                        <h3 className="font-medium mb-1">{item.title}</h3>
                                    )}
                                    <p className="text-sm text-tokens-fg/80 whitespace-pre-wrap">{item.content}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-xs text-tokens-muted">{formatDate(item.createdAt)}</span>
                                        <Badge variant={getBucketVariant(item.paraBucket)} className="text-xs">
                                            {getBucketLabel(item.paraBucket)}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <SelectDropdown
                                        value={item.paraBucket || ''}
                                        onChange={(value) => handleAssignBucket(item.id, (value || null) as ParaBucket)}
                                        options={PARA_OPTIONS.map(o => ({ 
                                            value: o.value || '', 
                                            label: t(`secondbrain:para.${o.value || 'inbox'}`, o.label) 
                                        }))}
                                    />
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="p-2 text-tokens-muted hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </PageContainer>
    );
}
