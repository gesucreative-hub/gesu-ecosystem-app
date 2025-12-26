import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Trash2, GripVertical, ChevronRight, ChevronDown } from 'lucide-react';
import { FolderNode } from '../types/workflowBlueprints';
import { generateNodeId } from '../utils/folderTemplateUtils';

interface FolderTreeEditorProps {
    folders: FolderNode[];
    onChange: (folders: FolderNode[]) => void;
}

interface SortableFolderItemProps {
    node: FolderNode;
    depth: number;
    onRename: (id: string, newName: string) => void;
    onDelete: (id: string) => void;
    onAddChild: (parentId: string) => void;
    onToggleCollapse: (id: string) => void;
    isCollapsed: boolean;
}

function SortableFolderItem({
    node,
    depth,
    onRename,
    onDelete,
    onAddChild,
    onToggleCollapse,
    isCollapsed
}: SortableFolderItemProps) {
    const { t } = useTranslation(['modals']);
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(node.name);

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
        marginLeft: `${depth * 24}px`
    };

    const handleRename = () => {
        if (editValue.trim()) {
            onRename(node.id, editValue.trim());
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleRename();
        } else if (e.key === 'Escape') {
            setEditValue(node.name);
            setIsEditing(false);
        }
    };

    const hasChildren = node.children && node.children.length > 0;

    return (
        <div ref={setNodeRef} style={style}>
            <div className="flex items-center gap-2 p-2 bg-tokens-panel border border-tokens-border rounded-lg hover:bg-tokens-panel2 group">
                {/* Drag Handle */}
                <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
                    <GripVertical size={16} className="text-tokens-muted" />
                </div>

                {/* Collapse/Expand */}
                {hasChildren ? (
                    <button
                        onClick={() => onToggleCollapse(node.id)}
                        className="p-0.5 hover:bg-tokens-border rounded"
                    >
                        {isCollapsed ? (
                            <ChevronRight size={14} className="text-tokens-muted" />
                        ) : (
                            <ChevronDown size={14} className="text-tokens-muted" />
                        )}
                    </button>
                ) : (
                    <div className="w-[14px]" />
                )}

                {/* Folder Icon & Name */}
                <div className="flex-1 flex items-center gap-2">
                    <span className="text-sm">📁</span>
                    {isEditing ? (
                        <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleRename}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            className="flex-1 px-2 py-1 text-sm bg-tokens-bg border border-tokens-brand-DEFAULT rounded focus:outline-none"
                        />
                    ) : (
                        <span
                            onClick={() => setIsEditing(true)}
                            className="flex-1 text-sm text-tokens-fg cursor-text hover:text-tokens-brand-DEFAULT"
                        >
                            {node.name}
                        </span>
                    )}
                </div>

                {/* Actions - visible on hover */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onAddChild(node.id)}
                        className="p-1 hover:bg-tokens-border rounded text-tokens-muted hover:text-tokens-brand-DEFAULT"
                        title={t('modals:tooltips.addSubfolder', 'Add subfolder')}
                    >
                        <Plus size={14} />
                    </button>
                    <button
                        onClick={() => {
                            if (confirm(t('modals:folderTemplate.folders.deleteConfirm', { name: node.name, defaultValue: `Delete "${node.name}" and all its contents?` }))) {
                                onDelete(node.id);
                            }
                        }}
                        className="p-1 hover:bg-tokens-border rounded text-tokens-muted hover:text-red-500"
                        title={t('modals:tooltips.deleteFolder', 'Delete folder')}
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}

export function FolderTreeEditor({ folders, onChange }: FolderTreeEditorProps) {
    const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates
        })
    );

    // Flatten tree for drag-and-drop (preserving depth info)
    const flattenTree = (nodes: FolderNode[], depth = 0): Array<{ node: FolderNode; depth: number }> => {
        const result: Array<{ node: FolderNode; depth: number }> = [];
        nodes.forEach(node => {
            result.push({ node, depth });
            if (node.children && !collapsedNodes.has(node.id)) {
                result.push(...flattenTree(node.children, depth + 1));
            }
        });
        return result;
    };

    const flatItems = flattenTree(folders);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const activeIndex = flatItems.findIndex(item => item.node.id === active.id);
        const overIndex = flatItems.findIndex(item => item.node.id === over.id);

        if (activeIndex !== overIndex) {
            // For simplicity, we'll only allow reordering at the same level
            // Full hierarchical drag-drop is complex and can be added later
            const newFlatItems = arrayMove(flatItems, activeIndex, overIndex);

            // Rebuild tree from flat list (simplified - assumes same-level moves)
            // This is a basic implementation; full tree rebuilding is more complex
            const newFolders = rebuildTreeFromFlat(newFlatItems);
            onChange(newFolders);
        }
    };

    // Simplified tree rebuild (only handles root-level reordering for now)
    const rebuildTreeFromFlat = (items: Array<{ node: FolderNode; depth: number }>): FolderNode[] => {
        // For now, just return the nodes in new order (assumes same-level moves)
        // Full implementation would rebuild the entire tree structure
        return items.filter(item => item.depth === 0).map(item => item.node);
    };

    const handleAddRoot = () => {
        const { t } = useTranslation(['modals']);
        const newNode: FolderNode = {
            id: generateNodeId(),
            name: t('modals:folderTemplate.folders.newFolder', 'New Folder')
        };
        onChange([...folders, newNode]);
    };

    const handleAddChild = (parentId: string) => {
        const { t } = useTranslation(['modals']);
        const addChild = (nodes: FolderNode[]): FolderNode[] => {
            return nodes.map(node => {
                if (node.id === parentId) {
                    const newChild: FolderNode = {
                        id: generateNodeId(),
                        name: t('modals:folderTemplate.folders.newSubfolder', 'New Subfolder')
                    };
                    return {
                        ...node,
                        children: [...(node.children || []), newChild]
                    };
                }
                if (node.children) {
                    return { ...node, children: addChild(node.children) };
                }
                return node;
            });
        };
        onChange(addChild(folders));
    };

    const handleRename = (id: string, newName: string) => {
        const rename = (nodes: FolderNode[]): FolderNode[] => {
            return nodes.map(node => {
                if (node.id === id) {
                    return { ...node, name: newName };
                }
                if (node.children) {
                    return { ...node, children: rename(node.children) };
                }
                return node;
            });
        };
        onChange(rename(folders));
    };

    const handleDelete = (id: string) => {
        const deleteNode = (nodes: FolderNode[]): FolderNode[] => {
            return nodes
                .filter(node => node.id !== id)
                .map(node => ({
                    ...node,
                    children: node.children ? deleteNode(node.children) : undefined
                }));
        };
        onChange(deleteNode(folders));
    };

    const toggleCollapse = (id: string) => {
        setCollapsedNodes(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const { t } = useTranslation(['modals']);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-tokens-fg">{t('modals:folderTemplate.structure', 'Folder Structure')}</h3>
                <button
                    onClick={handleAddRoot}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-tokens-brand-DEFAULT text-white rounded-lg hover:bg-tokens-brand-DEFAULT/90 transition-colors"
                >
                    <Plus size={14} />
                    {t('modals:folderTemplate.folders.addFolder', 'Add Folder')}
                </button>
            </div>

            {/* Folder Tree */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={flatItems.map(item => item.node.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-1">
                        {flatItems.length > 0 ? (
                            flatItems.map(({ node, depth }) => (
                                <SortableFolderItem
                                    key={node.id}
                                    node={node}
                                    depth={depth}
                                    onRename={handleRename}
                                    onDelete={handleDelete}
                                    onAddChild={handleAddChild}
                                    onToggleCollapse={toggleCollapse}
                                    isCollapsed={collapsedNodes.has(node.id)}
                                />
                            ))
                        ) : (
                            <div className="text-center py-8 text-tokens-muted text-sm">
                                {t('modals:folderTemplate.folders.emptyState', 'No folders yet. Click "Add Folder" to create one.')}
                            </div>
                        )}
                    </div>
                </SortableContext>
            </DndContext>

            {/* Folder Count */}
            {folders.length > 0 && (
                <div className="text-xs text-tokens-muted text-right">
                    {t('modals:folderTemplate.folders.folderCount', {
                        count: flatItems.length,
                        defaultValue: `${flatItems.length} ${flatItems.length === 1 ? 'folder' : 'folders'} total`
                    })}
                </div>
            )}
        </div>
    );
}
