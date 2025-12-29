// Standards Tab Component
// Sprint 15 - Workflow Blueprints Editor (v1 - Step content editing only)
// Sprint 21.3 - Added Folder Templates management
// Sprint 21.3 Phase 7 - Template system redesign (flat blueprints list)
// Sprint 21.4 - UI redesign to match Folder Template Manager styling

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Badge } from '../components/Badge';
import { Save, Check, Plus, X, Wrench, ListChecks, ChevronDown, ChevronUp, ChevronRight, Trash2, Search, Settings as SettingsIcon, GripVertical, Edit2, Copy, Download, ChevronsDownUp, ChevronsUpDown, FolderOpen } from 'lucide-react';
import { useAlertDialog } from '../components/AlertDialog';
import { useConfirmDialog } from '../components/ConfirmDialog';
import {
    BlueprintFileShape,
    BlueprintNode,
    WorkflowBlueprint,
    DEFAULT_CATEGORY_ID,
    WorkflowPhaseDefinition
} from '../types/workflowBlueprints';
import { loadBlueprints, saveBlueprints } from '../services/workflowBlueprintsService';
import { getProjectsByBlueprintId, updateProjectBlueprint, Project } from '../stores/projectStore';
import { WORKFLOW_PHASES } from './workflowData';
import { TemplatePickerModal } from '../components/TemplatePickerModal';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AIEnhanceButton } from '../components/ai/AIEnhanceButton';
import { AISuggestionModal } from '../components/ai/AISuggestionModal';
import { getAIProvider, BlueprintSuggestion } from '../services/ai';
import { applyOpsToBlueprintDraft } from '../services/ai/applyOps';
import { useGesuSettings } from '../lib/gesuSettings';

// Sortable Step Component for drag-and-drop
interface SortableStepProps {
    node: BlueprintNode;
    isSelected: boolean;
    onSelect: () => void;
    onDelete: () => void;
}

function SortableStep({ node, isSelected, onSelect, onDelete }: SortableStepProps) {
    const { t } = useTranslation(['initiator']);
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: node.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : 0
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group flex items-center gap-1 ${isDragging ? 'ring-2 ring-tokens-brand-DEFAULT rounded-lg' : ''}`}
        >
            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                className="text-tokens-muted/50 cursor-grab hover:text-tokens-muted active:cursor-grabbing"
            >
                <GripVertical size={14} />
            </div>
            <button
                onClick={onSelect}
                className={`flex-1 text-left px-3 py-2 rounded-lg transition-all ${isSelected
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
            {/* Delete button */}
            <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="opacity-0 group-hover:opacity-100 text-tokens-muted hover:text-red-400 p-1.5 transition-opacity"
                title={t('initiator:tooltips.deleteStep', 'Delete step')}
            >
                <Trash2 size={14} />
            </button>
        </div>
    );
}

export function StandardsTab() {
    const { t, i18n } = useTranslation(['initiator', 'common']);
    // State
    const [data, setData] = useState<BlueprintFileShape | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>(DEFAULT_CATEGORY_ID);  // Keep for backward compat
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    // Sprint 20: Category creation state (keeping for backward compatibility)
    const [showNewCategory, setShowNewCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    // Sprint 21.3 Phase 7: Template picker modal
    const [showTemplatePicker, setShowTemplatePicker] = useState(false);

    // Sprint 21.3 Phase 6: Collapsible phase sections (track which are collapsed)
    const [collapsedPhases, setCollapsedPhases] = useState<Set<string>>(new Set());

    // Sprint 21.4: Search and settings
    const [blueprintSearch, setBlueprintSearch] = useState('');
    const [showBlueprintSettings, setShowBlueprintSettings] = useState(false);
    const [isRenamingBlueprint, setIsRenamingBlueprint] = useState(false);
    const [blueprintRenameValue, setBlueprintRenameValue] = useState('');
    const blueprintSettingsRef = useRef<HTMLDivElement>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Phase CRUD state
    const [editingPhaseId, setEditingPhaseId] = useState<string | null>(null);
    const [phaseEditValue, setPhaseEditValue] = useState('');
    const [showAddPhase, setShowAddPhase] = useState(false);
    const [newPhaseName, setNewPhaseName] = useState('');

    // Polished Dialog Hooks
    const { alert, AlertDialogComponent } = useAlertDialog();
    const { confirm, ConfirmDialogComponent } = useConfirmDialog();

    // Max phases constant
    const MAX_PHASES = 8;

    // Confirmation states
    const [pendingDeletePhaseId, setPendingDeletePhaseId] = useState<string | null>(null);

    // Get current category and blueprint (Move up to be available for hooks)
    const selectedCategory = data?.categories.find(c => c.id === selectedCategoryId);
    const selectedBlueprint = data?.blueprints.find(b => b.id === selectedCategory?.defaultBlueprintId);
    const selectedNode = selectedBlueprint?.nodes.find(n => n.id === selectedNodeId);

    // Sprint 24: AI Suggestions State
    const [aiModalOpen, setAiModalOpen] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const [aiSuggestions, setAiSuggestions] = useState<BlueprintSuggestion[]>([]);
    const { settings: gesuSettings } = useGesuSettings();
    const aiSettings = gesuSettings?.ai;

    // Load blueprints on mount
    useEffect(() => {
        loadBlueprints().then(loadedData => {
            setData(loadedData);
            // Auto-select first non-default category
            const firstUserCategory = loadedData.categories.find(c => c.id !== DEFAULT_CATEGORY_ID);
            if (firstUserCategory) {
                setSelectedCategoryId(firstUserCategory.id);
            } else {
                setSelectedCategoryId(''); // No selection if only default exists
            }
        });
    }, []);

    // Refs to track latest values for unmount save
    const dataRef = useRef(data);
    const isDirtyRef = useRef(isDirty);

    useEffect(() => { dataRef.current = data; }, [data]);
    useEffect(() => { isDirtyRef.current = isDirty; }, [isDirty]);

    // Auto-save when data changes (debounced)
    useEffect(() => {
        if (!data || !isDirty) return;

        const timer = setTimeout(async () => {
            const result = await saveBlueprints(data);
            if (result.ok) {
                setIsDirty(false);
                console.log('[StandardsTab] Auto-saved');
            } else {
                console.error('[StandardsTab] Auto-save failed:', result.error);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [data, isDirty]);

    // Save on unmount (when switching tabs)
    useEffect(() => {
        return () => {
            if (isDirtyRef.current && dataRef.current) {
                console.log('[StandardsTab] Saving on unmount...');
                saveBlueprints(dataRef.current);
            }
        };
    }, []);

    // Click outside to close blueprint settings dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (blueprintSettingsRef.current && !blueprintSettingsRef.current.contains(event.target as Node)) {
                setShowBlueprintSettings(false);
            }
        };

        if (showBlueprintSettings) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showBlueprintSettings]);

    // Drag and Drop Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Handle Drag End
    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id && selectedBlueprint) {
            setData(prev => {
                if (!prev) return prev;

                const activeId = active.id as string;
                const overId = over?.id as string;

                const oldIndex = selectedBlueprint.nodes.findIndex(n => n.id === activeId);
                const newIndex = selectedBlueprint.nodes.findIndex(n => n.id === overId);

                if (oldIndex !== -1 && newIndex !== -1) {
                    const newNodes = arrayMove(selectedBlueprint.nodes, oldIndex, newIndex);

                    return {
                        ...prev,
                        blueprints: prev.blueprints.map(b =>
                            b.id === selectedBlueprint.id
                                ? { ...b, nodes: newNodes, version: b.version + 1 }
                                : b
                        )
                    };
                }
                return prev;
            });
            setIsDirty(true);
        }
    }, [selectedBlueprint]);

    // Sprint 20: Create new category with default blueprint
    const handleCreateCategory = useCallback(() => {
        if (!data || !newCategoryName.trim()) return;

        const categoryId = newCategoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const blueprintId = `${categoryId}-default`;

        // Check if exists
        if (data.categories.some(c => c.id === categoryId)) {
            alert({
                title: 'Duplicate Category',
                message: 'A category with this name already exists',
                type: 'warning'
            });
            return;
        }

        // Create new category with its default blueprint (clone from existing default)
        const defaultBlueprint = data.blueprints.find(b => b.categoryId === DEFAULT_CATEGORY_ID);
        const newNodes = defaultBlueprint?.nodes.map(node => ({
            ...node,
            id: `${categoryId}-${node.id}`, // Unique IDs for new category
        })) || [];

        // Copy phases from default blueprint
        const newPhases = defaultBlueprint?.phases ? [...defaultBlueprint.phases] : undefined;

        const newCategory = {
            id: categoryId,
            name: newCategoryName.trim(),
            defaultBlueprintId: blueprintId
        };

        const newBlueprint = {
            id: blueprintId,
            name: newCategoryName.trim(), // No "Default" suffix
            categoryId: categoryId,
            version: 1,
            nodes: newNodes,
            phases: newPhases // Include phases
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
    }, [data, newCategoryName, alert]);

    // Sprint 21.3 Phase 7: Add blueprint from template
    const handleAddFromTemplate = useCallback((newBlueprint: WorkflowBlueprint) => {
        if (!data) return;

        // Prevent duplicate additions (check by name, case-insensitive)
        const nameExists = data.blueprints.some(
            b => b.name.toLowerCase() === newBlueprint.name.toLowerCase()
        );
        if (nameExists) {
            alert({
                title: 'Blueprint Exists',
                message: `A blueprint named "${newBlueprint.name}" already exists.`,
                type: 'warning'
            });
            return;
        }

        // Check if 'custom' category exists, create if not
        const customCategoryExists = data.categories.some(c => c.id === 'custom');

        setData(prev => {
            if (!prev) return prev;

            const updatedData = {
                ...prev,
                blueprints: [...prev.blueprints, newBlueprint]
            };

            // Create 'Custom Blueprints' category if it doesn't exist
            if (!customCategoryExists) {
                updatedData.categories = [
                    ...prev.categories,
                    {
                        id: 'custom',
                        name: 'Custom Blueprints',
                        defaultBlueprintId: newBlueprint.id
                    }
                ];
            }

            return updatedData;
        });

        // Select the new blueprint by selecting its category
        setSelectedCategoryId('custom');
        setSelectedNodeId(null);
        setIsDirty(true);
    }, [data, alert]);

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

    // S4-1: Action Hints Management

    // Add action hint
    const addActionHint = useCallback((nodeId: string) => {
        if (!data) return;
        const node = data.blueprints.flatMap(b => b.nodes).find(n => n.id === nodeId);
        if (!node) return;
        
        const currentHints = node.actionHints || [];
        if (currentHints.length >= 6) return;  // FP3: Max 6 hints

        updateNodeField(nodeId, 'actionHints', [...currentHints, '']);  // FP3: Default empty
    }, [data, updateNodeField]);

    // Remove action hint
    const removeActionHint = useCallback((nodeId: string, index: number) => {
        if (!data) return;
        const node = data.blueprints.flatMap(b => b.nodes).find(n => n.id === nodeId);
        if (!node || !node.actionHints) return;

        const newHints = node.actionHints.filter((_, i) => i !== index);
        updateNodeField(nodeId, 'actionHints', newHints.length > 0 ? newHints : undefined);
    }, [data, updateNodeField]);

    // Update action hint
    const updateActionHint = useCallback((nodeId: string, index: number, value: string) => {
        if (!data) return;
        const node = data.blueprints.flatMap(b => b.nodes).find(n => n.id === nodeId);
        if (!node || !node.actionHints) return;

        const newHints = [...node.actionHints];
        newHints[index] = value;
        updateNodeField(nodeId, 'actionHints', newHints);
    }, [data, updateNodeField]);

    // S4-3: Move action hint up
    const moveHintUp = useCallback((nodeId: string, index: number) => {
        if (!data || index === 0) return;
        const node = data.blueprints.flatMap(b => b.nodes).find(n => n.id === nodeId);
        if (!node?.actionHints || index >= node.actionHints.length) return;

        const newHints = [...node.actionHints];
        [newHints[index - 1], newHints[index]] = [newHints[index], newHints[index - 1]];
        updateNodeField(nodeId, 'actionHints', newHints);
    }, [data, updateNodeField]);

    // S4-3: Move action hint down
    const moveHintDown = useCallback((nodeId: string, index: number) => {
        if (!data) return;
        const node = data.blueprints.flatMap(b => b.nodes).find(n => n.id === nodeId);
        if (!node?.actionHints || index >= node.actionHints.length - 1) return;

        const newHints = [...node.actionHints];
        [newHints[index], newHints[index + 1]] = [newHints[index + 1], newHints[index]];
        updateNodeField(nodeId, 'actionHints', newHints);
    }, [data, updateNodeField]);

    // Sprint 21.3 Phase 6: Add new step to blueprint
    const addStep = useCallback((phaseId: string) => {
        if (!data || !selectedBlueprint) return;

        const newStepId = `${selectedBlueprint.id}-step-${Date.now()}`;
        const newNode: BlueprintNode = {
            id: newStepId,
            phaseId,
            title: 'New Step',
            description: 'Step description',
            dod: ['Checklist item 1'],
            tools: []
        };

        setData(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                blueprints: prev.blueprints.map(b =>
                    b.id === selectedBlueprint.id
                        ? { ...b, nodes: [...b.nodes, newNode], version: b.version + 1 }
                        : b
                )
            };
        });
        setIsDirty(true);
        setSelectedNodeId(newStepId);  // Auto-select new step for editing
    }, [data, selectedBlueprint]);

    // Delete step from blueprint
    const deleteStep = useCallback((nodeId: string) => {
        if (!data || !selectedBlueprint) return;

        setData(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                blueprints: prev.blueprints.map(b =>
                    b.id === selectedBlueprint.id
                        ? { ...b, nodes: b.nodes.filter(n => n.id !== nodeId), version: b.version + 1 }
                        : b
                )
            };
        });
        setIsDirty(true);
        if (selectedNodeId === nodeId) {
            setSelectedNodeId(null);  // Deselect if deleted node was selected
        }
    }, [data, selectedBlueprint, selectedNodeId]);



    // Phase color palette for new phases
    const PHASE_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6'];

    // Add new phase to blueprint
    const addPhase = useCallback((phaseName: string) => {
        if (!data || !selectedBlueprint || !phaseName.trim()) return;

        // Generate phase ID from name
        const phaseId = phaseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        // Get current phases (or default)
        const currentPhases = selectedBlueprint.phases || WORKFLOW_PHASES;

        // Check if phase already exists
        if (currentPhases.some(p => p.id === phaseId)) {
            alert({
                title: 'Phase Already Exists',
                message: `A phase with a similar name already exists.`,
                type: 'warning'
            });
            return;
        }

        // Pick a color (cycle through palette)
        const colorIndex = currentPhases.length % PHASE_COLORS.length;
        const newPhase: WorkflowPhaseDefinition = {
            id: phaseId,
            label: phaseName.trim(),
            color: PHASE_COLORS[colorIndex]
        };

        setData(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                blueprints: prev.blueprints.map(b =>
                    b.id === selectedBlueprint.id
                        ? { ...b, phases: [...currentPhases, newPhase], version: b.version + 1 }
                        : b
                )
            };
        });
        setIsDirty(true);
        setShowAddPhase(false);
        setNewPhaseName('');
    }, [data, selectedBlueprint, alert]);

    // Rename existing phase
    const renamePhase = useCallback((phaseId: string, newLabel: string) => {
        if (!data || !selectedBlueprint || !newLabel.trim()) return;

        const currentPhases = selectedBlueprint.phases || WORKFLOW_PHASES;
        const updatedPhases = currentPhases.map(p =>
            p.id === phaseId ? { ...p, label: newLabel.trim() } : p
        );

        setData(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                blueprints: prev.blueprints.map(b =>
                    b.id === selectedBlueprint.id
                        ? { ...b, phases: updatedPhases, version: b.version + 1 }
                        : b
                )
            };
        });
        setIsDirty(true);
        setEditingPhaseId(null);
        setPhaseEditValue('');
    }, [data, selectedBlueprint]);

    // Delete phase and all its steps
    const deletePhase = useCallback((phaseId: string) => {
        if (!data || !selectedBlueprint) return;

        const currentPhases = selectedBlueprint.phases || WORKFLOW_PHASES;
        if (currentPhases.length <= 1) {
            alert({
                title: 'Cannot Delete',
                message: 'You must have at least one phase.',
                type: 'warning'
            });
            return;
        }

        // Delete all steps in this phase
        const updatedNodes = selectedBlueprint.nodes.filter(n => n.phaseId !== phaseId);

        // Remove the phase
        const updatedPhases = currentPhases.filter(p => p.id !== phaseId);

        setData(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                blueprints: prev.blueprints.map(b =>
                    b.id === selectedBlueprint.id
                        ? { ...b, phases: updatedPhases, nodes: updatedNodes, version: b.version + 1 }
                        : b
                )
            };
        });
        setIsDirty(true);
    }, [data, selectedBlueprint, alert]);

    // State for delete confirmation
    const [pendingDeleteStepId, setPendingDeleteStepId] = useState<string | null>(null);

    // State for Migration Dialog
    const [migrationDialog, setMigrationDialog] = useState<{ isOpen: boolean; affectedProjects: Project[]; blueprintId: string } | null>(null);
    const [migrationTargetId, setMigrationTargetId] = useState<string>('');

    // ─────────────────────────────────────────────────────────────────────────
    // Blueprint Actions: Rename, Duplicate, Export, Delete
    // ─────────────────────────────────────────────────────────────────────────

    // Rename blueprint
    const handleRenameBlueprint = useCallback(() => {
        if (!data || !selectedBlueprint || !blueprintRenameValue.trim()) return;

        setData(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                blueprints: prev.blueprints.map(b =>
                    b.id === selectedBlueprint.id
                        ? { ...b, name: blueprintRenameValue.trim(), version: b.version + 1 }
                        : b
                )
            };
        });
        setIsDirty(true);
        setIsRenamingBlueprint(false);
        setBlueprintRenameValue('');
    }, [data, selectedBlueprint, blueprintRenameValue]);

    const handleDuplicateBlueprint = useCallback(() => {
        if (!data || !selectedBlueprint || !selectedCategory) return;

        const timestamp = Date.now();
        const newBlueprintId = `${selectedBlueprint.id}-copy-${timestamp}`;
        const newCategoryId = `${selectedCategory.id}-copy-${timestamp}`;

        // Create phase ID mapping (old -> new)
        const phaseIdMap: Record<string, string> = {};
        const newPhases = selectedBlueprint.phases?.map(phase => {
            const newPhaseId = `${newBlueprintId}-phase-${phase.id.split('-').pop() || timestamp}`;
            phaseIdMap[phase.id] = newPhaseId;
            return {
                ...phase,
                id: newPhaseId
            };
        }) || [];

        // Deep copy nodes with new IDs and remapped phase references
        const newNodes = selectedBlueprint.nodes.map((node, idx) => ({
            ...node,
            id: `${newBlueprintId}-step-${idx}`,
            phaseId: node.phaseId ? (phaseIdMap[node.phaseId] || node.phaseId) : node.phaseId,
            // Deep copy DoD array
            dod: node.dod ? [...node.dod] : []
        }));

        const newBlueprint = {
            ...selectedBlueprint,
            id: newBlueprintId,
            name: `${selectedBlueprint.name} Copy`,
            categoryId: newCategoryId,
            version: 1,
            nodes: newNodes,
            phases: newPhases
        };

        // Create new category pointing to this blueprint
        const newCategory = {
            ...selectedCategory,
            id: newCategoryId,
            name: `${selectedCategory.name} Copy`,
            defaultBlueprintId: newBlueprintId
        };

        setData(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                blueprints: [...prev.blueprints, newBlueprint],
                categories: [...prev.categories, newCategory]
            };
        });
        setIsDirty(true);
        setShowBlueprintSettings(false);

        // Select the new category
        setSelectedCategoryId(newCategoryId);
        console.log('[StandardsTab] Duplicated blueprint:', newBlueprint.name, 'with', newNodes.length, 'nodes');
    }, [data, selectedBlueprint, selectedCategory]);

    // Export blueprint as JSON
    const handleExportBlueprint = useCallback(() => {
        if (!selectedBlueprint) return;

        const exportData = {
            ...selectedBlueprint,
            exportedAt: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedBlueprint.name.replace(/[^a-z0-9]/gi, '_')}.blueprint.json`;
        a.click();
        URL.revokeObjectURL(url);
        setShowBlueprintSettings(false);
    }, [selectedBlueprint]);

    // Delete blueprint
    const handleDeleteBlueprint = useCallback(() => {
        if (!data || !selectedBlueprint || !selectedCategory) return;

        // SAFE DELETION CHECK
        const affectedProjects = getProjectsByBlueprintId(selectedBlueprint.id);
        if (affectedProjects.length > 0) {
            // Trigger Migration Dialog if projects are using this blueprint
            setMigrationDialog({
                isOpen: true,
                affectedProjects,
                blueprintId: selectedBlueprint.id
            });
            // Pre-select the first available alternative blueprint
            const firstAlternative = data.blueprints.find(b => b.id !== selectedBlueprint.id);
            setMigrationTargetId(firstAlternative?.id || '');
            setShowDeleteConfirm(false);
            return;
        }

        // --- Standard Deletion if safe ---

        // Don't allow deleting if it's the last blueprint
        if (data.blueprints.length <= 1) {
            alert({
                title: 'Cannot Delete',
                message: 'You must have at least one blueprint.',
                type: 'error'
            });
            return;
        }

        performBlueprintDeletion(selectedBlueprint.id, selectedCategory.id);
    }, [data, selectedBlueprint, selectedCategory, alert]);

    // Helper to perform the actual deletion
    const performBlueprintDeletion = (blueprintId: string, categoryId: string) => {
        if (!data) return;

        // Find another category to select after deletion
        const nextCategory = data.categories.find(c => c.id !== categoryId);

        setData(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                // Delete BOTH the blueprint AND its parent category
                blueprints: prev.blueprints.filter(b => b.id !== blueprintId),
                categories: prev.categories.filter(c => c.id !== categoryId)
            };
        });

        // Select another category (which will auto-select its default blueprint)
        setSelectedCategoryId(nextCategory?.id || '');
        setSelectedNodeId(null);
        setIsDirty(true);
        setShowDeleteConfirm(false);
        setMigrationDialog(null);
    };

    // Execute Migration & Delete
    const handleMigrateAndDelete = () => {
        if (!migrationDialog || !migrationTargetId || !data) return;

        // 1. Get target blueprint details
        const targetBlueprint = data.blueprints.find(b => b.id === migrationTargetId);
        if (!targetBlueprint) return;

        // 2. Batch update affected projects
        migrationDialog.affectedProjects.forEach(project => {
            updateProjectBlueprint(project.id, {
                blueprintId: targetBlueprint.id,
                categoryId: targetBlueprint.categoryId,
                blueprintVersion: targetBlueprint.version
            });
        });

        console.log(`[StandardsTab] Migrated ${migrationDialog.affectedProjects.length} projects to ${targetBlueprint.name}`);

        // 3. Perform Deletion
        // We need to find the category ID of the blueprint being deleted
        const bpToDelete = data.blueprints.find(b => b.id === migrationDialog.blueprintId);
        if (bpToDelete) {
            performBlueprintDeletion(bpToDelete.id, bpToDelete.categoryId);
        }
    };

    if (!data) {
        return (
            <div className="flex items-center justify-center h-64 text-tokens-muted">
                Loading blueprints...
            </div>
        );
    }

    // Group nodes by phase - use blueprint's custom phases if available, otherwise default
    const phasesToUse = selectedBlueprint?.phases || WORKFLOW_PHASES;
    const nodesByPhase = phasesToUse.map(phase => ({
        phase,
        nodes: selectedBlueprint?.nodes.filter(n => n.phaseId === phase.id) || []
    }));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr_350px] gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">

            {/* Left Column: Blueprints - Redesigned to match Folder Template Manager */}
            <div className="space-y-3">
                {/* Search Bar */}
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-tokens-muted" />
                    <input
                        type="text"
                        placeholder={t('initiator:standards.searchPlaceholder', 'Search blueprints...')}
                        value={blueprintSearch}
                        onChange={(e) => setBlueprintSearch(e.target.value)}
                        className="w-full bg-tokens-panel2 border border-tokens-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-tokens-fg placeholder:text-tokens-muted/50 focus:outline-none focus:ring-1 focus:ring-tokens-brand-DEFAULT/50"
                    />
                </div>

                {/* Blueprint Cards */}
                <div className="space-y-1.5">
                    {data.categories
                        .filter(cat => cat.id !== DEFAULT_CATEGORY_ID) // Hide default blueprint
                        .filter(cat => cat.name.toLowerCase().includes(blueprintSearch.toLowerCase()))
                        .length > 0 ? (
                        data.categories
                            .filter(cat => cat.id !== DEFAULT_CATEGORY_ID)
                            .filter(cat => cat.name.toLowerCase().includes(blueprintSearch.toLowerCase()))
                            .map(cat => {
                                const categoryBlueprints = data.blueprints.filter(b => b.categoryId === cat.id);
                                const defaultBlueprint = categoryBlueprints.find(b => b.id === cat.defaultBlueprintId);
                                const isSelected = selectedCategoryId === cat.id;

                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => {
                                            setSelectedCategoryId(cat.id);
                                            setSelectedNodeId(null);
                                        }}
                                        className={`w-full text-left px-4 py-3 rounded-lg border transition-all group ${isSelected
                                            ? 'bg-tokens-brand-DEFAULT/10 border-l-4 border-l-tokens-brand-DEFAULT border-t-tokens-border border-r-tokens-border border-b-tokens-border'
                                            : 'bg-tokens-panel2 border-transparent hover:bg-tokens-panel hover:border-tokens-border'
                                            }`}
                                    >
                                        <div className="font-medium text-sm text-tokens-fg">{defaultBlueprint?.name || cat.name}</div>
                                        <div className="text-xs text-tokens-muted mt-0.5">
                                            {t('initiator:standards.stepsCount', { count: defaultBlueprint?.nodes.length || 0, defaultValue: `${defaultBlueprint?.nodes.length || 0} steps` })}
                                        </div>
                                    </button>
                                );
                            })
                    ) : (
                        <div className="text-center py-12 px-4">
                            <div className="text-sm text-tokens-muted mb-2">{t('initiator:standards.noBlueprints', 'No blueprints yet')}</div>
                            <div className="text-xs text-tokens-muted/70">{t('initiator:standards.createNewHint', 'Create a new one or add from templates below')}</div>
                        </div>
                    )}
                </div>

                {/* Create Category Mini-Form */}
                {showNewCategory && (
                    <div className="p-3 bg-tokens-panel2 border border-tokens-border rounded-lg space-y-2">
                        <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="Blueprint name..."
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
                                {t('common:buttons.create', 'Create')}
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => {
                                setShowNewCategory(false);
                                setNewCategoryName('');
                            }}>
                                {t('common:buttons.cancel', 'Cancel')}
                            </Button>
                        </div>
                    </div>
                )}

                {/* New Blueprint Button */}
                <button
                    onClick={() => setShowNewCategory(true)}
                    className="w-full text-left px-4 py-3 rounded-lg border-2 border-dashed border-tokens-border text-sm text-tokens-brand-DEFAULT hover:border-tokens-brand-DEFAULT/50 hover:bg-tokens-brand-DEFAULT/5 transition-colors flex items-center gap-2"
                >
                    <Plus size={16} />
                    {t('initiator:standards.newBlueprint', 'New Blueprint')}
                </button>

                {/* Templates Button (opens picker) */}
                <button
                    onClick={() => setShowTemplatePicker(true)}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-tokens-border bg-tokens-panel hover:bg-tokens-panel2 group transition-all shadow-sm hover:shadow mt-2"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-tokens-brand-DEFAULT/10 rounded-md text-tokens-brand-DEFAULT group-hover:scale-110 transition-transform">
                            <FolderOpen size={18} />
                        </div>
                        <div className="text-left">
                            <div className="text-sm font-medium text-tokens-fg">{t('initiator:standards.templates', 'Templates')}</div>
                            <div className="text-xs text-tokens-muted">{t('initiator:standards.manageStructures', 'Manage structures')}</div>
                        </div>
                    </div>
                    <ChevronRight size={16} className="text-tokens-muted group-hover:text-tokens-fg transition-colors" />
                </button>
            </div>

            {/* Middle Column: Workflow Structure */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <div className="bg-tokens-bg rounded-xl border border-tokens-border h-fit">
                    {/* Header with settings gear */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-tokens-border">
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-tokens-muted">Blueprint:</span>
                            <span className="font-medium text-tokens-fg">{selectedBlueprint?.name || 'Blueprint'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* AI Enhance Button */}
                            {aiSettings?.enabled && aiSettings?.provider !== 'none' && selectedBlueprint && (
                                <AIEnhanceButton
                                    onClick={async () => {
                                        const provider = getAIProvider(aiSettings);
                                        if (!provider) return;
                                        
                                        setAiLoading(true);
                                        setAiError(null);
                                        
                                        try {
                                            const phases = (selectedBlueprint.phases || WORKFLOW_PHASES).map(p => ({ id: p.id, label: p.label }));
                                            const nodes = selectedBlueprint.nodes.map(n => ({
                                                id: n.id,
                                                phaseId: n.phaseId,
                                                title: n.title,
                                                description: n.description,
                                                dod: n.dod
                                            }));
                                            
                                            const result = await provider.suggestBlueprintEnhancements({
                                                blueprint: { id: selectedBlueprint.id, name: selectedBlueprint.name, phases, nodes },
                                                language: i18n.language.startsWith('id') ? 'id' : 'en',
                                                maxSuggestions: 3
                                            });
                                            
                                            setAiSuggestions(result.suggestions);
                                            setAiModalOpen(true);
                                        } catch (err) {
                                            setAiError(err instanceof Error ? err.message : t('initiator:ai.errorTitle'));
                                            setAiModalOpen(true);
                                        } finally {
                                            setAiLoading(false);
                                        }
                                    }}
                                    isLoading={aiLoading}
                                    isAvailable={true}
                                />
                            )}
                        <div className="relative" ref={blueprintSettingsRef}>
                            <button
                                onClick={() => setShowBlueprintSettings(!showBlueprintSettings)}
                                className="p-2 hover:bg-tokens-panel2 rounded-lg transition-colors"
                            >
                                <SettingsIcon size={16} className="text-tokens-muted" />
                            </button>
                            {showBlueprintSettings && (
                                <div className="absolute right-0 top-full mt-1 w-44 bg-tokens-bg border border-tokens-border rounded-lg shadow-xl z-10 overflow-hidden">
                                    <button
                                        onClick={() => {
                                            setBlueprintRenameValue(selectedBlueprint?.name || '');
                                            setIsRenamingBlueprint(true);
                                            setShowBlueprintSettings(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-tokens-fg hover:bg-tokens-panel2 transition-colors"
                                    >
                                        <Edit2 size={14} className="text-tokens-muted" />
                                        {t('common:buttons.rename', 'Rename')}
                                    </button>
                                    <button
                                        onClick={handleDuplicateBlueprint}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-tokens-fg hover:bg-tokens-panel2 transition-colors"
                                    >
                                        <Copy size={14} className="text-tokens-muted" />
                                        {t('common:buttons.duplicate', 'Duplicate')}
                                    </button>
                                    <button
                                        onClick={handleExportBlueprint}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-tokens-fg hover:bg-tokens-panel2 transition-colors"
                                    >
                                        <Download size={14} className="text-tokens-muted" />
                                        {t('common:buttons.exportJson', 'Export JSON')}
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (!selectedBlueprint || !data) return;

                                            // Check if this blueprint name already exists in templates
                                            const isDuplicate = data.blueprints.some(bp =>
                                                bp.id !== selectedBlueprint.id &&
                                                bp.name === selectedBlueprint.name &&
                                                JSON.stringify(bp.nodes) === JSON.stringify(selectedBlueprint.nodes)
                                            );

                                            if (isDuplicate) {
                                                alert({
                                                    title: t('initiator:standards.duplicateTemplate', 'Duplicate Template'),
                                                    message: t('initiator:standards.duplicateTemplateMessage', 'This blueprint already exists as a template.'),
                                                    type: 'warning'
                                                });
                                                setShowBlueprintSettings(false);
                                                return;
                                            }

                                            handleDuplicateBlueprint();
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-tokens-fg hover:bg-tokens-panel2 transition-colors"
                                    >
                                        <Plus size={14} className="text-tokens-muted" />
                                        {t('common:buttons.addFromTemplates', 'Add from templates')}
                                    </button>
                                    <div className="border-t border-tokens-border" />
                                    <button
                                        onClick={() => {
                                            setShowDeleteConfirm(true);
                                            setShowBlueprintSettings(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                                    >
                                        <Trash2 size={14} />
                                        {t('common:buttons.delete', 'Delete')}
                                    </button>
                                </div>
                            )}
                        </div>
                        </div>
                    </div>

                    {/* Workflow Structure Label with Collapse/Expand Toggle */}
                    <div className="px-5 py-3 flex items-center justify-between border-b border-tokens-border bg-tokens-panel/30">
                        <div className="flex items-center gap-3">
                           <span className="text-sm font-medium text-tokens-fg">{t('initiator:standards.workflowStructure')}</span>
                            <span className="text-xs text-tokens-muted">({t('initiator:standards.stepsCount', { count: selectedBlueprint?.nodes.length || 0, defaultValue: `${selectedBlueprint?.nodes.length || 0} steps` })})</span>
                        </div>
                        <button
                            onClick={() => {
                                const allPhaseIds = phasesToUse.map(p => p.id);
                                const allCollapsed = allPhaseIds.every(id => collapsedPhases.has(id));

                                if (allCollapsed) {
                                    // Expand all
                                    setCollapsedPhases(new Set());
                                } else {
                                    // Collapse all
                                    setCollapsedPhases(new Set(allPhaseIds));
                                }
                            }}
                            className="text-tokens-muted hover:text-tokens-fg p-1.5 rounded hover:bg-tokens-panel2 transition-colors"
                            title={phasesToUse.every(p => collapsedPhases.has(p.id)) ? "Expand all" : "Collapse all"}
                        >
                            {phasesToUse.every(p => collapsedPhases.has(p.id)) ? (
                                <ChevronsUpDown size={14} />
                            ) : (
                                <ChevronsDownUp size={14} />
                            )}
                        </button>
                    </div>

                    <div className="p-5 space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto custom-scrollbar">
                        {nodesByPhase.map(({ phase, nodes }) => {
                            const isExpanded = !collapsedPhases.has(phase.id);
                            const togglePhase = () => {
                                setCollapsedPhases(prev => {
                                    const next = new Set(prev);
                                    if (next.has(phase.id)) {
                                        next.delete(phase.id);  // Expand
                                    } else {
                                        next.add(phase.id);     // Collapse
                                    }
                                    return next;
                                });
                            };

                            // Check if this is the default "General Creative" blueprint
                            // If so, we want to disable editing of phases (but steps can still be edited)
                            const isDefaultBlueprint = selectedBlueprint?.name === "General Creative";

                            return (
                                <div key={phase.id} className="group/phase">
                                    <div
                                        className="flex items-center mb-1 rounded hover:opacity-90 transition-opacity"
                                        style={{ backgroundColor: `${phase.color}15` }}
                                    >
                                        {/* Phase rename inline input */}
                                        {editingPhaseId === phase.id ? (
                                            <div className="flex-1 px-2 py-1">
                                                <input
                                                    type="text"
                                                    value={phaseEditValue}
                                                    onChange={(e) => setPhaseEditValue(e.target.value)}
                                                    className="w-full bg-tokens-panel border border-tokens-border rounded px-2 py-1 text-xs font-semibold uppercase tracking-wider text-tokens-fg focus:outline-none focus:ring-1 focus:ring-tokens-brand-DEFAULT/50"
                                                    autoFocus
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && phaseEditValue.trim()) {
                                                            renamePhase(phase.id, phaseEditValue);
                                                        }
                                                        if (e.key === 'Escape') {
                                                            setEditingPhaseId(null);
                                                            setPhaseEditValue('');
                                                        }
                                                    }}
                                                    onBlur={() => {
                                                        if (phaseEditValue.trim()) {
                                                            renamePhase(phase.id, phaseEditValue);
                                                        } else {
                                                            setEditingPhaseId(null);
                                                        }
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <button
                                                onClick={togglePhase}
                                                className="flex-1 text-left text-xs font-semibold uppercase tracking-wider px-2 py-1.5 flex items-center justify-between"
                                                style={{ color: phase.color }}
                                            >
                                                <span className="flex items-center gap-1">
                                                    {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                                    {phase.label}
                                                </span>
                                                <span className="text-xs opacity-60">{nodes.length}</span>
                                            </button>
                                        )}
                                        {/* Edit/Delete icons for non-default blueprints */}
                                        {!isDefaultBlueprint && !editingPhaseId && (
                                            <div className="flex items-center gap-0.5 opacity-0 group-hover/phase:opacity-100 transition-opacity pr-1">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingPhaseId(phase.id);
                                                        setPhaseEditValue(phase.label);
                                                    }}
                                                    className="p-1 text-tokens-muted hover:text-tokens-fg rounded"
                                                    title={t('initiator:tooltips.renamePhase', 'Rename phase')}
                                                >
                                                    <Edit2 size={12} />
                                                </button>
                                                <button
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        const phaseStepCount = nodes.length;
                                                        const confirmed = await confirm({
                                                            title: 'Delete Phase?',
                                                            message: phaseStepCount > 0
                                                                ? `This will delete the phase "${phase.label}" and all ${phaseStepCount} step(s) in it. This action cannot be undone.`
                                                                : `Delete the phase "${phase.label}"?`,
                                                            confirmLabel: 'Delete',
                                                            type: 'danger'
                                                        });
                                                        if (confirmed) {
                                                            deletePhase(phase.id);
                                                        }
                                                    }}
                                                    className="p-1 text-tokens-muted hover:text-red-400 rounded"
                                                    title={t('initiator:tooltips.deletePhase', 'Delete phase')}
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    {isExpanded && (
                                        <div className="space-y-1 mb-2">
                                            <SortableContext
                                                items={nodes}
                                                strategy={verticalListSortingStrategy}
                                            >
                                                {nodes.map((node) => (
                                                    <SortableStep
                                                        key={node.id}
                                                        node={node}
                                                        isSelected={selectedNodeId === node.id}
                                                        onSelect={() => setSelectedNodeId(node.id)}
                                                        onDelete={() => setPendingDeleteStepId(node.id)}
                                                    />
                                                ))}
                                            </SortableContext>

                                            {/* Add Step Button */}
                                            <button
                                                onClick={() => addStep(phase.id)}
                                                className="w-full py-1.5 text-xs text-tokens-muted hover:text-tokens-fg hover:bg-tokens-panel2 rounded border border-dashed border-tokens-border/50 hover:border-tokens-border transition-all flex items-center justify-center gap-1.5 group/btn"
                                            >
                                                <Plus size={12} className="opacity-70 group-hover/btn:opacity-100" />
                                                Add Step
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Add Phase Button (only for non-default blueprints) */}
                        {selectedBlueprint?.name !== "General Creative" && (
                            <div className="pt-2 border-t border-dashed border-tokens-border mt-4">
                                {!showAddPhase ? (
                                    <button
                                        onClick={() => {
                                            const currentPhases = nodesByPhase.length;
                                            if (currentPhases >= MAX_PHASES) {
                                                alert({
                                                    title: 'Maximum Phases Reached',
                                                    message: `You can have at most ${MAX_PHASES} phases per blueprint.`,
                                                    type: 'warning'
                                                });
                                                return;
                                            }
                                            setShowAddPhase(true);
                                        }}
                                        className="w-full py-2 text-xs font-medium text-tokens-muted hover:text-tokens-fg hover:bg-tokens-panel2 rounded border border-dashed border-tokens-border hover:border-tokens-brand-DEFAULT/50 transition-all flex items-center justify-center gap-2 group"
                                    >
                                        <Plus size={14} className="group-hover:scale-110 transition-transform" />
                                        Add Phase
                                    </button>
                                ) : (
                                    <div className="bg-tokens-panel rounded-lg border border-tokens-border p-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                        <div className="text-xs font-medium text-tokens-fg mb-2">{t('initiator:standards.newPhaseName')}</div>
                                        <input
                                            type="text"
                                            value={newPhaseName}
                                            onChange={(e) => setNewPhaseName(e.target.value)}
                                            placeholder="e.g. DEPLOYMENT"
                                            className="w-full bg-tokens-bg border border-tokens-border rounded px-2 py-1.5 text-xs text-tokens-fg mb-3 focus:outline-none focus:ring-1 focus:ring-tokens-brand-DEFAULT/50"
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && newPhaseName.trim()) {
                                                    addPhase(newPhaseName);
                                                }
                                                if (e.key === 'Escape') {
                                                    setShowAddPhase(false);
                                                    setNewPhaseName('');
                                                }
                                            }}
                                        />
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="primary"
                                                onClick={() => addPhase(newPhaseName)}
                                                className="flex-1"
                                            >
                                                {t('common:buttons.create', 'Create')}
                                            </Button>
                                            <Button size="sm" variant="secondary" onClick={() => {
                                                setShowAddPhase(false);
                                                setNewPhaseName('');
                                            }}>
                                                {t('common:buttons.cancel', 'Cancel')}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </DndContext>{pendingDeleteStepId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setPendingDeleteStepId(null)}>
                    <div className="bg-tokens-panel border border-tokens-border rounded-lg p-4 max-w-sm mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
                        <div className="text-sm font-medium text-tokens-fg mb-2">{t('initiator:standards.deleteStepConfirm')}</div>
                        <div className="text-xs text-tokens-muted mb-4">
                            This will remove the step from the blueprint. This action cannot be undone.
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="secondary" onClick={() => setPendingDeleteStepId(null)}>{t('common:buttons.cancel', 'Cancel')}</Button>
                            <Button
                                size="sm"
                                variant="primary"
                                onClick={() => {
                                    deleteStep(pendingDeleteStepId);
                                    setPendingDeleteStepId(null);
                                }}
                                className="bg-red-500 hover:bg-red-600"
                            >
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Right Column: Node Editor */}
            <div className="space-y-4">
                {selectedNode ? (
                    <>
                        <Card title={
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-primary-700 dark:bg-secondary-300 rounded-full"></span>
                                {t('initiator:standards.editStep', 'Edit Step')}
                            </div>
                        }>
                            <div className="space-y-4">
                                {/* Title */}
                                <Input
                                    label={t('initiator:standards.stepTitle', 'Title')}
                                    value={selectedNode.title}
                                    onChange={(e) => updateNodeField(selectedNode.id, 'title', e.target.value)}
                                    fullWidth
                                />

                                {/* Description */}
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-tokens-muted">{t('initiator:standards.stepDescription', 'Description')}</label>
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
                                            {t('initiator:standards.definitionOfDone', { count: selectedNode.dod.length, defaultValue: `Definition of Done (${selectedNode.dod.length}/7)` })}
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
                                            placeholder={t('initiator:standards.addToolPlaceholder', 'Add tool...')}
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

                            {/* S4-1: Action Hints Editor */}
                            <div className="border-t border-tokens-border pt-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-semibold text-tokens-muted uppercase tracking-wide">
                                            {t('initiator:standards.actionHints', 'Action Hints')}
                                        </h3>
                                        <span className="text-xs text-tokens-muted">
                                            {selectedNode.actionHints?.length || 0}/6
                                        </span>
                                    </div>

                                    {/* Helper text */}
                                    <p className="text-xs text-tokens-muted italic">
                                        {t('initiator:standards.actionHintsHelp', 'Practical steps or tips to guide execution of this step')}
                                    </p>

                                    {/* Hints list */}
                                    <div className="space-y-1.5">
                                        {(selectedNode.actionHints || []).map((hint, index) => {
                                            const isFirst = index === 0;
                                            const isLast = index === (selectedNode.actionHints?.length || 1) - 1;
                                            
                                            return (
                                                <div key={index} className="flex items-start gap-2">
                                                    <span className="text-xs text-tokens-muted mt-2 min-w-[1.5rem]">
                                                        {index + 1}.
                                                    </span>
                                                    
                                                    {/* S4-3: Reorder buttons */}
                                                    <div className="flex flex-col gap-0.5 mt-1">
                                                        <button
                                                            onClick={() => moveHintUp(selectedNode.id, index)}
                                                            disabled={isFirst}
                                                            className={`p-0.5 rounded text-tokens-muted ${
                                                                isFirst 
                                                                    ? 'opacity-30 cursor-not-allowed' 
                                                                    : 'hover:bg-tokens-panel2 hover:text-tokens-fg'
                                                            }`}
                                                            title={t('initiator:standards.moveUp', 'Move up')}
                                                        >
                                                            <ChevronUp size={12} />
                                                        </button>
                                                        <button
                                                            onClick={() => moveHintDown(selectedNode.id, index)}
                                                            disabled={isLast}
                                                            className={`p-0.5 rounded text-tokens-muted ${
                                                                isLast 
                                                                    ? 'opacity-30 cursor-not-allowed' 
                                                                    : 'hover:bg-tokens-panel2 hover:text-tokens-fg'
                                                            }`}
                                                            title={t('initiator:standards.moveDown', 'Move down')}
                                                        >
                                                            <ChevronDown size={12} />
                                                        </button>
                                                    </div>
                                                    
                                                    <Input
                                                        value={hint}
                                                        onChange={(e) => updateActionHint(selectedNode.id, index, e.target.value)}
                                                        placeholder={t('initiator:standards.hintPlaceholder', 'Hint text...')}
                                                        className="flex-1 text-sm"
                                                    />
                                                    <button
                                                        onClick={() => removeActionHint(selectedNode.id, index)}
                                                        className="p-1 text-tokens-muted hover:text-red-500 transition-colors mt-1"
                                                        title={t('common:remove', 'Remove')}
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Add hint button */}
                                    {(selectedNode.actionHints?.length || 0) < 6 && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => addActionHint(selectedNode.id)}
                                            icon={<Plus size={14} />}
                                        >
                                            {t('initiator:standards.addHint', 'Add Hint')}
                                        </Button>
                                    )}
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
                            {isSaving ? t('initiator:standards.saving', 'Saving...') : saveMessage === 'Saved' ? t('initiator:standards.saved', 'Saved!') : t('initiator:standards.saveChanges', 'Save Changes')}
                        </Button>
                        {saveMessage && saveMessage !== 'Saved' && (
                            <div className="text-xs text-red-400 text-center">{saveMessage}</div>
                        )}
                    </>
                ) : (
                    <Card className="h-64 flex items-center justify-center">
                        <div className="text-tokens-muted text-center">
                            <ListChecks size={32} className="mx-auto mb-2 opacity-50" />
                            <div>{t('initiator:standards.selectStep', 'Select a step to edit')}</div>
                        </div>
                    </Card>
                )}
            </div>

            {/* Sprint 21.3 Phase 7: Template Picker Modal */}
            <TemplatePickerModal
                isOpen={showTemplatePicker}
                onClose={() => setShowTemplatePicker(false)}
                onSelect={handleAddFromTemplate}
            />

            {/* Blueprint Rename Dialog */}
            {isRenamingBlueprint && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setIsRenamingBlueprint(false)}>
                    <div className="bg-tokens-panel border border-tokens-border rounded-xl p-5 max-w-sm mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-tokens-brand-DEFAULT/10 flex items-center justify-center">
                                <Edit2 size={20} className="text-tokens-brand-DEFAULT" />
                            </div>
                            <div>
                                <div className="text-base font-medium text-tokens-fg">{t('initiator:standards.renameBlueprint')}</div>
                                <div className="text-xs text-tokens-muted">Enter a new name for this blueprint</div>
                            </div>
                        </div>
                        <input
                            type="text"
                            value={blueprintRenameValue}
                            onChange={(e) => setBlueprintRenameValue(e.target.value)}
                            placeholder="Blueprint name..."
                            autoFocus
                            className="w-full bg-tokens-bg border border-tokens-border rounded-lg px-3 py-2 text-sm text-tokens-fg placeholder:text-tokens-muted/50 focus:outline-none focus:ring-2 focus:ring-tokens-brand-DEFAULT/50 mb-4"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenameBlueprint();
                                if (e.key === 'Escape') setIsRenamingBlueprint(false);
                            }}
                        />
                        <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="secondary" onClick={() => setIsRenamingBlueprint(false)}>{t('common:buttons.cancel', 'Cancel')}</Button>
                            <Button size="sm" variant="primary" onClick={handleRenameBlueprint}>{t('common:buttons.rename', 'Rename')}</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Blueprint Delete Confirmation */}
            {showDeleteConfirm && selectedBlueprint && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDeleteConfirm(false)}>
                    <div className="bg-tokens-panel border border-tokens-border rounded-xl p-5 max-w-sm mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                                <Trash2 size={20} className="text-red-500" />
                            </div>
                            <div>
                                <div className="text-base font-medium text-tokens-fg">{t('initiator:standards.deleteBlueprint')}</div>
                                <div className="text-xs text-tokens-muted">This action cannot be undone</div>
                            </div>
                        </div>
                        <div className="text-sm text-tokens-muted mb-4">
                            Are you sure you want to delete "<span className="font-medium text-tokens-fg">{selectedBlueprint.name || 'this blueprint'}</span>"?
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="secondary" onClick={() => setShowDeleteConfirm(false)}>{t('common:buttons.cancel', 'Cancel')}</Button>
                            <Button size="sm" variant="primary" onClick={handleDeleteBlueprint} className="bg-red-500 hover:bg-red-600">{t('common:buttons.delete', 'Delete')}</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Phase Delete Confirmation */}
            {
                pendingDeletePhaseId && (() => {
                    const phaseToDelete = phasesToUse.find(p => p.id === pendingDeletePhaseId);
                    return (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setPendingDeletePhaseId(null)}>
                            <div className="bg-tokens-panel border border-tokens-border rounded-lg p-5 max-w-sm mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
                                <div className="text-base font-medium text-tokens-fg mb-2">{t('initiator:standards.deletePhaseConfirm')}</div>
                                <div className="text-sm text-tokens-muted mb-4">
                                    Delete "{phaseToDelete?.label}" phase? All steps will be moved to the first remaining phase.
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <Button size="sm" variant="secondary" onClick={() => setPendingDeletePhaseId(null)}>{t('common:buttons.cancel', 'Cancel')}</Button>
                                    <Button
                                        size="sm"
                                        variant="primary"
                                        onClick={() => {
                                            if (pendingDeletePhaseId) {
                                                deletePhase(pendingDeletePhaseId);
                                                setPendingDeletePhaseId(null);
                                            }
                                        }}
                                        className="bg-red-500 hover:bg-red-600"
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        </div>
                    );
                })()
            }

            {/* AlertDialog */}
            {/* Migration Dialog */}
            {migrationDialog && migrationDialog.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-tokens-panel border border-tokens-border rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col gap-2">
                            <h3 className="text-lg font-semibold text-tokens-fg flex items-center gap-2">
                                <span className="bg-amber-500/10 text-amber-500 p-1.5 rounded-md"><SettingsIcon size={18} /></span>
                                Migrate & Delete
                            </h3>
                            <p className="text-sm text-tokens-muted leading-relaxed">
                                This blueprint is currently used by <span className="font-semibold text-tokens-fg">{migrationDialog.affectedProjects.length} project(s)</span>.
                                <br />
                                To delete it safely, you must reassign these projects to another blueprint.
                            </p>
                        </div>

                        <div className="bg-tokens-panel2 p-3 rounded-lg border border-tokens-border/50 max-h-32 overflow-y-auto">
                            <ul className="text-xs space-y-1">
                                {migrationDialog.affectedProjects.map(p => (
                                    <li key={p.id} className="flex items-center gap-2 text-tokens-muted">
                                        <span className="w-1.5 h-1.5 rounded-full bg-tokens-brand-DEFAULT/50"></span>
                                        {p.name}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-tokens-muted uppercase">{t('initiator:standards.reassignTo')}</label>
                            <select
                                value={migrationTargetId}
                                onChange={(e) => setMigrationTargetId(e.target.value)}
                                className="w-full bg-tokens-panel2 border border-tokens-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-tokens-brand-DEFAULT"
                            >
                                {data?.blueprints
                                    .filter(b => b.id !== migrationDialog.blueprintId)
                                    .map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))
                                }
                            </select>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <Button
                                variant="ghost"
                                onClick={() => setMigrationDialog(null)}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleMigrateAndDelete}
                                disabled={!migrationTargetId}
                                style={{ backgroundColor: '#d97706', color: 'white' }}
                            >
                                Migrate & Delete
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* AI Suggestions Modal */}
            <AISuggestionModal
                isOpen={aiModalOpen}
                onClose={() => {
                    setAiModalOpen(false);
                    setAiSuggestions([]);
                    setAiError(null);
                }}
                suggestions={aiSuggestions}
                isLoading={aiLoading}
                error={aiError}
                onApply={(selectedOps) => {
                    if (!selectedBlueprint || !data) return;
                    
                    // Build selected IDs from ops
                    const selectedIds = new Set<string>();
                    aiSuggestions.forEach(s => {
                        if (selectedOps.some(op => s.ops.includes(op))) {
                            selectedIds.add(s.id);
                        }
                    });
                    
                    // Apply ops to draft
                    const phases = selectedBlueprint.phases || WORKFLOW_PHASES;
                    const draftInput = {
                        id: selectedBlueprint.id,
                        name: selectedBlueprint.name,
                        phases: phases.map(p => ({ id: p.id, label: p.label })),
                        nodes: selectedBlueprint.nodes.map(n => ({
                            id: n.id,
                            phaseId: n.phaseId,
                            title: n.title,
                            description: n.description,
                            dod: n.dod || [],
                            tools: n.tools || []
                        }))
                    };
                    
                    const updated = applyOpsToBlueprintDraft(draftInput, aiSuggestions, selectedIds);
                    
                    // Update state with new blueprint data
                    setData(prev => {
                        if (!prev) return prev;
                        return {
                            ...prev,
                            blueprints: prev.blueprints.map(b =>
                                b.id === selectedBlueprint.id
                                    ? {
                                        ...b,
                                        phases: phases.map((p, i) => ({
                                            ...p,
                                            label: updated.phases?.[i]?.label || p.label
                                        })),
                                        nodes: b.nodes.map(n => {
                                            const updatedNode = updated.nodes.find(un => un.id === n.id);
                                            if (updatedNode) {
                                                return {
                                                    ...n,
                                                    title: updatedNode.title,
                                                    description: updatedNode.description || n.description,
                                                    dod: updatedNode.dod || n.dod
                                                };
                                            }
                                            return n;
                                        }),
                                        version: b.version + 1
                                    }
                                    : b
                            )
                        };
                    });
                    setIsDirty(true);
                    setAiModalOpen(false);
                    setAiSuggestions([]);
                }}
            />
            
            <AlertDialogComponent />
            <ConfirmDialogComponent />
        </div >
    );
}
