// Standards Tab Component
// Sprint 15 - Workflow Blueprints Editor (v1 - Step content editing only)

import { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Badge } from '../components/Badge';
import { Save, Check, Plus, X, Wrench, ListChecks } from 'lucide-react';
import {
    BlueprintFileShape,
    BlueprintNode,
    DEFAULT_CATEGORY_ID
} from '../types/workflowBlueprints';
import { loadBlueprints, saveBlueprints } from '../services/workflowBlueprintsService';
import { WORKFLOW_PHASES } from './workflowData';

export function StandardsTab() {
    // State
    const [data, setData] = useState<BlueprintFileShape | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>(DEFAULT_CATEGORY_ID);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    // Sprint 20: Category creation state
    const [showNewCategory, setShowNewCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    // Load blueprints on mount
    useEffect(() => {
        loadBlueprints().then(loadedData => {
            setData(loadedData);
            // Auto-select first category
            if (loadedData.categories.length > 0) {
                setSelectedCategoryId(loadedData.categories[0].id);
            }
        });
    }, []);

    // Get current category and blueprint
    const selectedCategory = data?.categories.find(c => c.id === selectedCategoryId);
    const selectedBlueprint = data?.blueprints.find(b => b.id === selectedCategory?.defaultBlueprintId);
    const selectedNode = selectedBlueprint?.nodes.find(n => n.id === selectedNodeId);

    // Sprint 20: Create new category with default blueprint
    const handleCreateCategory = useCallback(() => {
        if (!data || !newCategoryName.trim()) return;

        const categoryId = newCategoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const blueprintId = `${categoryId}-default`;

        // Check if category already exists
        if (data.categories.some(c => c.id === categoryId)) {
            alert('A category with this name already exists');
            return;
        }

        // Create new category with its default blueprint (clone from existing default)
        const defaultBlueprint = data.blueprints.find(b => b.categoryId === DEFAULT_CATEGORY_ID);
        const newNodes = defaultBlueprint?.nodes.map(node => ({
            ...node,
            id: `${categoryId}-${node.id}`, // Unique IDs for new category
        })) || [];

        const newCategory = {
            id: categoryId,
            name: newCategoryName.trim(),
            defaultBlueprintId: blueprintId
        };

        const newBlueprint = {
            id: blueprintId,
            name: `${newCategoryName.trim()} Default`,
            categoryId: categoryId,
            version: 1,
            nodes: newNodes
        };

        setData(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                categories: [...prev.categories, newCategory],
                blueprints: [...prev.blueprints, newBlueprint]
            };
        });

        setSelectedCategoryId(categoryId);
        setShowNewCategory(false);
        setNewCategoryName('');
        setIsDirty(true);
    }, [data, newCategoryName]);

    // Handle save
    const handleSave = useCallback(async () => {
        if (!data || !isDirty) return;
        setSaving(true);
        setSaveMessage(null);

        const result = await saveBlueprints(data);

        if (result.ok) {
            setIsDirty(false);
            setSaveMessage('Saved');
            setTimeout(() => setSaveMessage(null), 2000);
        } else {
            setSaveMessage(`Error: ${result.error}`);
        }
        setSaving(false);
    }, [data, isDirty]);

    // Update node fields
    const updateNodeField = useCallback((nodeId: string, field: keyof BlueprintNode, value: any) => {
        if (!data) return;

        setData(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                blueprints: prev.blueprints.map(bp => ({
                    ...bp,
                    nodes: bp.nodes.map(node =>
                        node.id === nodeId ? { ...node, [field]: value } : node
                    )
                }))
            };
        });
        setIsDirty(true);
    }, [data]);

    // Add DoD item
    const addDodItem = useCallback((nodeId: string) => {
        if (!data) return;
        const node = data.blueprints.flatMap(b => b.nodes).find(n => n.id === nodeId);
        if (!node || node.dod.length >= 7) return;

        updateNodeField(nodeId, 'dod', [...node.dod, 'New checklist item']);
    }, [data, updateNodeField]);

    // Remove DoD item
    const removeDodItem = useCallback((nodeId: string, index: number) => {
        if (!data) return;
        const node = data.blueprints.flatMap(b => b.nodes).find(n => n.id === nodeId);
        if (!node) return;

        const newDod = node.dod.filter((_, i) => i !== index);
        updateNodeField(nodeId, 'dod', newDod);
    }, [data, updateNodeField]);

    // Update DoD item
    const updateDodItem = useCallback((nodeId: string, index: number, value: string) => {
        if (!data) return;
        const node = data.blueprints.flatMap(b => b.nodes).find(n => n.id === nodeId);
        if (!node) return;

        const newDod = [...node.dod];
        newDod[index] = value;
        updateNodeField(nodeId, 'dod', newDod);
    }, [data, updateNodeField]);

    // Add tool
    const addTool = useCallback((nodeId: string, tool: string) => {
        if (!data || !tool.trim()) return;
        const node = data.blueprints.flatMap(b => b.nodes).find(n => n.id === nodeId);
        if (!node) return;

        if (!node.tools.includes(tool.trim())) {
            updateNodeField(nodeId, 'tools', [...node.tools, tool.trim()]);
        }
    }, [data, updateNodeField]);

    // Remove tool
    const removeTool = useCallback((nodeId: string, index: number) => {
        if (!data) return;
        const node = data.blueprints.flatMap(b => b.nodes).find(n => n.id === nodeId);
        if (!node) return;

        const newTools = node.tools.filter((_, i) => i !== index);
        updateNodeField(nodeId, 'tools', newTools);
    }, [data, updateNodeField]);

    if (!data) {
        return (
            <div className="flex items-center justify-center h-64 text-tokens-muted">
                Loading blueprints...
            </div>
        );
    }

    // Group nodes by phase
    const nodesByPhase = WORKFLOW_PHASES.map(phase => ({
        phase,
        nodes: selectedBlueprint?.nodes.filter(n => n.phaseId === phase.id) || []
    }));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr_350px] gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">

            {/* Left Column: Categories */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-tokens-muted uppercase tracking-wider">
                        Categories
                    </div>
                    <button
                        onClick={() => setShowNewCategory(true)}
                        className="text-xs text-tokens-brand-DEFAULT hover:text-tokens-brand-hover flex items-center gap-1"
                    >
                        <Plus size={12} /> Add
                    </button>
                </div>
                {data.categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => {
                            setSelectedCategoryId(cat.id);
                            setSelectedNodeId(null);
                        }}
                        className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${selectedCategoryId === cat.id
                            ? 'bg-tokens-brand-DEFAULT/10 border-tokens-brand-DEFAULT/50 text-tokens-fg'
                            : 'bg-tokens-panel2 border-tokens-border text-tokens-muted hover:bg-tokens-panel hover:text-tokens-fg'
                            }`}
                    >
                        <div className="font-medium text-sm">{cat.name}</div>
                        <div className="text-xs text-tokens-muted mt-1">
                            {data.blueprints.find(b => b.id === cat.defaultBlueprintId)?.nodes.length || 0} steps
                        </div>
                    </button>
                ))}

                {/* Create Category Mini-Form */}
                {showNewCategory && (
                    <div className="p-3 bg-tokens-panel2 border border-tokens-border rounded-lg space-y-2">
                        <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="Category name..."
                            className="w-full bg-tokens-panel border border-tokens-border rounded px-2 py-1.5 text-sm text-tokens-fg placeholder:text-tokens-muted/50 focus:outline-none focus:ring-1 focus:ring-tokens-brand-DEFAULT/50"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCreateCategory();
                                if (e.key === 'Escape') {
                                    setShowNewCategory(false);
                                    setNewCategoryName('');
                                }
                            }}
                        />
                        <div className="flex gap-2">
                            <Button size="sm" variant="primary" onClick={handleCreateCategory} className="flex-1">
                                Create
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => {
                                setShowNewCategory(false);
                                setNewCategoryName('');
                            }}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Middle Column: Blueprint Nodes */}
            <Card title={
                <div className="flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-primary-700 dark:bg-secondary-300 rounded-full"></span>
                    {selectedBlueprint?.name || 'Blueprint'}
                </div>
            } className="h-fit">
                <div className="space-y-4">
                    {nodesByPhase.map(({ phase, nodes }) => (
                        <div key={phase.id}>
                            <div
                                className="text-xs font-semibold uppercase tracking-wider mb-2 px-2 py-1 rounded"
                                style={{ color: phase.color, backgroundColor: `${phase.color}15` }}
                            >
                                {phase.label}
                            </div>
                            <div className="space-y-1">
                                {nodes.map(node => (
                                    <button
                                        key={node.id}
                                        onClick={() => setSelectedNodeId(node.id)}
                                        className={`w-full text-left px-3 py-2 rounded transition-all ${selectedNodeId === node.id
                                            ? 'bg-tokens-brand-DEFAULT/10 border border-tokens-brand-DEFAULT/50'
                                            : 'hover:bg-tokens-panel2 border border-transparent'
                                            }`}
                                    >
                                        <div className="text-sm font-medium text-tokens-fg truncate">
                                            {node.title}
                                        </div>
                                        <div className="text-xs text-tokens-muted mt-0.5 truncate">
                                            {node.dod.length} DoD · {node.tools.length} tools
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Right Column: Node Editor */}
            <div className="space-y-4">
                {selectedNode ? (
                    <>
                        <Card title={
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-primary-700 dark:bg-secondary-300 rounded-full"></span>
                                Edit Step
                            </div>
                        }>
                            <div className="space-y-4">
                                {/* Title */}
                                <Input
                                    label="Title"
                                    value={selectedNode.title}
                                    onChange={(e) => updateNodeField(selectedNode.id, 'title', e.target.value)}
                                    fullWidth
                                />

                                {/* Description */}
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-tokens-muted">Description</label>
                                    <textarea
                                        value={selectedNode.description}
                                        onChange={(e) => updateNodeField(selectedNode.id, 'description', e.target.value)}
                                        rows={3}
                                        className="w-full bg-tokens-panel2 border border-tokens-border rounded-lg px-3 py-2 text-tokens-fg text-sm focus:outline-none focus:ring-2 focus:ring-tokens-brand-DEFAULT/50 resize-none"
                                    />
                                </div>

                                {/* DoD Items */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-tokens-muted flex items-center gap-2">
                                            <ListChecks size={14} />
                                            Definition of Done ({selectedNode.dod.length}/7)
                                        </label>
                                        {selectedNode.dod.length < 7 && (
                                            <button
                                                onClick={() => addDodItem(selectedNode.id)}
                                                className="text-xs text-tokens-brand-DEFAULT hover:text-tokens-brand-hover flex items-center gap-1"
                                            >
                                                <Plus size={12} /> Add
                                            </button>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        {selectedNode.dod.map((item, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={item}
                                                    onChange={(e) => updateDodItem(selectedNode.id, i, e.target.value)}
                                                    className="flex-1 bg-tokens-panel2 border border-tokens-border rounded px-2 py-1 text-xs text-tokens-fg focus:outline-none focus:ring-1 focus:ring-tokens-brand-DEFAULT/50"
                                                />
                                                <button
                                                    onClick={() => removeDodItem(selectedNode.id, i)}
                                                    className="text-tokens-muted hover:text-red-400"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Tools */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-tokens-muted flex items-center gap-2">
                                        <Wrench size={14} />
                                        Tools
                                    </label>
                                    <div className="flex flex-wrap gap-1">
                                        {selectedNode.tools.map((tool, i) => (
                                            <Badge key={i} variant="neutral" className="gap-1">
                                                {tool}
                                                <button
                                                    onClick={() => removeTool(selectedNode.id, i)}
                                                    className="hover:text-red-400"
                                                >
                                                    <X size={10} />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Add tool..."
                                            className="flex-1 bg-tokens-panel2 border border-tokens-border rounded px-2 py-1 text-xs text-tokens-fg placeholder:text-tokens-muted/50 focus:outline-none focus:ring-1 focus:ring-tokens-brand-DEFAULT/50"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    addTool(selectedNode.id, (e.target as HTMLInputElement).value);
                                                    (e.target as HTMLInputElement).value = '';
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Save Button */}
                        <Button
                            variant="primary"
                            size="lg"
                            fullWidth
                            disabled={!isDirty || isSaving}
                            onClick={handleSave}
                            icon={saveMessage === 'Saved' ? <Check size={16} /> : <Save size={16} />}
                        >
                            {isSaving ? 'Saving...' : saveMessage === 'Saved' ? 'Saved!' : 'Save Changes'}
                        </Button>
                        {saveMessage && saveMessage !== 'Saved' && (
                            <div className="text-xs text-red-400 text-center">{saveMessage}</div>
                        )}
                    </>
                ) : (
                    <Card className="h-64 flex items-center justify-center">
                        <div className="text-tokens-muted text-center">
                            <ListChecks size={32} className="mx-auto mb-2 opacity-50" />
                            <div>Select a step to edit</div>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}
