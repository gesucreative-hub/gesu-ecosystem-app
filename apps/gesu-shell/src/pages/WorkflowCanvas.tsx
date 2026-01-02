import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    WORKFLOW_PHASES,
    WORKFLOW_NODES,
    WorkflowNode,
    NodeStatus,
} from './workflowData';
import { StepDetailPanel } from './StepDetailPanel';
import {
    mergeNodesWithProgress,
    toggleDoDItem as persistToggleDoDItem,
    markNodeDone as persistMarkNodeDone,
    setNodeStatus,
    setAllDoDItemsDone,
    clearAllDoDItems,
    clearProgressForProject,
} from '../stores/workflowProgressStore';
import { getActiveProject, getActiveProjectId, Project, deleteProject } from '../stores/projectStore';
import { loadBlueprints, getBlueprintById } from '../services/workflowBlueprintsService';
import { blueprintToWorkflowNodes } from '../services/workflowBlueprintRenderer';
import { calculateOverallProgress } from '../utils/workflowProgress';
import { markAllTasksDoneForStep, markAllTasksUndoneForStep, toggleTaskForDoDItem } from '../stores/projectHubTasksStore';
import { isFinishModeForStep, markAllActionsDone, markAllActionsUndone, setActionDone } from '../stores/finishModeStore';
import { FolderOpen, Search, FileWarning, Trash2, RotateCcw } from 'lucide-react';
import { useConfirmDialog } from '../components/ConfirmDialog';

interface WorkflowCanvasProps {
    project?: Project;
}

// --- Main Canvas Component ---
export function WorkflowCanvas({ project }: WorkflowCanvasProps) {
    const { t } = useTranslation(['initiator', 'common']);
    const containerRef = useRef<HTMLDivElement>(null);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [hoveredPhase, setHoveredPhase] = useState<string | null>(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const { confirm, ConfirmDialogComponent } = useConfirmDialog();

    // Blueprint loading state - start empty until we check for active project
    const [baseNodes, setBaseNodes] = useState<WorkflowNode[]>([]);
    const [blueprintError, setBlueprintError] = useState<string | null>(null);
    const [currentBlueprint, setCurrentBlueprint] = useState<any>(null); // Track loaded blueprint

    // Local state for nodes (merged with persisted progress) - start empty
    const [nodes, setNodes] = useState<WorkflowNode[]>([]);

    // Load blueprint for active project on mount and when project changes
    useEffect(() => {
        const loadBlueprintForProject = async () => {
            const project = getActiveProject();
            if (!project) {
                console.log('[WorkflowCanvas] No active project, showing select project message');
                setBaseNodes([]);
                setNodes([]);
                setBlueprintError(null);  // null = "Select a project" message
                return;
            }

            const hasOwnBlueprint = !!project.blueprintId;

            if (!hasOwnBlueprint) {
                console.log('[WorkflowCanvas] Project has no blueprint, showing blank canvas:', project.name);
                setBaseNodes([]);
                setNodes([]);
                setBlueprintError(`Project "${project.name}" has no blueprint assigned. Go to Standards tab to create one.`);
                return;
            }

            try {
                const blueprints = await loadBlueprints();
                const blueprint = getBlueprintById(blueprints, project.blueprintId!);

                if (blueprint) {
                    console.log('[WorkflowCanvas] Loaded blueprint:', blueprint.name, 'with', blueprint.nodes.length, 'nodes');
                    const workflowNodes = blueprintToWorkflowNodes(blueprint);
                    setBaseNodes(workflowNodes);
                    setNodes(mergeNodesWithProgress(workflowNodes));
                    setCurrentBlueprint(blueprint); // Store the blueprint
                    setBlueprintError(null);
                } else {
                    console.warn('[WorkflowCanvas] Blueprint not found:', project.blueprintId);
                    setBaseNodes(WORKFLOW_NODES);
                    setNodes(mergeNodesWithProgress(WORKFLOW_NODES));
                    setBlueprintError(`Blueprint "${project.blueprintId}" not found. Using default workflow.`);
                }
            } catch (error) {
                console.error('[WorkflowCanvas] Failed to load blueprint:', error);
                setBaseNodes(WORKFLOW_NODES);
                setNodes(mergeNodesWithProgress(WORKFLOW_NODES));
            }
        };

        loadBlueprintForProject();
    }, []);

    // Auto-select step from URL param (when navigating from Compass)
    useEffect(() => {
        const stepId = searchParams.get('stepId');
        if (stepId && nodes.length > 0) {
            // Check if this step exists in current nodes
            const stepExists = nodes.some(n => n.id === stepId);
            if (stepExists) {
                setSelectedNodeId(stepId);
                // Clear the param after selection to keep URL clean
                searchParams.delete('stepId');
                setSearchParams(searchParams, { replace: true });
            }
        }
    }, [searchParams, nodes, setSearchParams]);

    // Find selected node
    const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;

    // Handler to toggle DoD item (persists to store and syncs with Compass/Finish Mode)
    const handleToggleDoDItem = useCallback((nodeId: string, dodItemId: string) => {
        // Toggle in workflow store and get new value
        const newValue = persistToggleDoDItem(nodeId, dodItemId);

        // Sync with Compass tasks (if task was sent to Compass)
        toggleTaskForDoDItem(nodeId, dodItemId, newValue);

        // Sync with Finish Mode (if Finish Mode is active for this step)
        if (isFinishModeForStep(nodeId)) {
            setActionDone(dodItemId, newValue);
        }

        setNodes(mergeNodesWithProgress(baseNodes));
    }, [baseNodes]);

    // Handler to mark node as done (persists to store + marks all DoD items done + syncs Compass/Finish Mode)
    const handleMarkAsDone = useCallback((nodeId: string) => {
        // Find the node to get its DoD item IDs
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
            const dodItemIds = node.dodChecklist.map(item => item.id);
            // Mark all DoD items as done in workflow progress
            setAllDoDItemsDone(nodeId, dodItemIds);
        } else {
            persistMarkNodeDone(nodeId);
        }

        // Sync with Compass tasks for this step
        markAllTasksDoneForStep(nodeId);

        // Sync with Finish Mode if active for this step
        if (isFinishModeForStep(nodeId)) {
            markAllActionsDone();
        }

        setNodes(mergeNodesWithProgress(baseNodes));
    }, [baseNodes, nodes]);

    // Handler to reopen a done node (revert to in-progress + clear all DoD items + sync Compass/Finish Mode)
    const handleReopenNode = useCallback((nodeId: string) => {
        // Find the node to get its DoD item IDs
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
            const dodItemIds = node.dodChecklist.map(item => item.id);
            // Clear all DoD items in workflow progress
            clearAllDoDItems(nodeId, dodItemIds);
        } else {
            setNodeStatus(nodeId, 'in-progress');
        }

        // Sync with Compass tasks for this step
        markAllTasksUndoneForStep(nodeId);

        // Sync with Finish Mode if active for this step
        if (isFinishModeForStep(nodeId)) {
            markAllActionsUndone();
        }

        setNodes(mergeNodesWithProgress(baseNodes));
    }, [baseNodes, nodes]);

    // Handler to clear all progress for current project
    const handleClearProgress = useCallback(async () => {
        const projectId = getActiveProjectId();
        if (!projectId) return;

        const shouldClear = await confirm({
            title: t('initiator:workflow.clearProgressTitle', 'Clear All Progress?'),
            message: t('initiator:workflow.clearProgressMessage', 'This will reset all step statuses and checklist items for this project. This action cannot be undone.'),
            confirmLabel: t('initiator:workflow.clearProgress', 'Clear Progress'),
            cancelLabel: t('common:buttons.cancel', 'Cancel'),
            type: 'warning'
        });

        if (shouldClear) {
            clearProgressForProject(projectId);
            setNodes(mergeNodesWithProgress(baseNodes));
        }
    }, [baseNodes, confirm]);

    // Re-merge nodes when baseNodes change
    useEffect(() => {
        setNodes(mergeNodesWithProgress(baseNodes));
    }, [baseNodes]);

    const isEmptyCanvas = nodes.length === 0;

    // Sprint 21: Calculate overall progress
    const progress = useMemo(() => calculateOverallProgress(nodes), [nodes]);

    // Sprint 21: ESC key to close overlay panel
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && selectedNodeId) {
                setSelectedNodeId(null);
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [selectedNodeId]);

    // Sprint 21: Prevent background scroll when overlay is open
    useEffect(() => {
        if (selectedNodeId) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [selectedNodeId]);

    // Sprint 21.1: Group nodes by phase for horizontal view - use blueprint's phases
    const phasesToUse = currentBlueprint?.phases || WORKFLOW_PHASES;
    const nodesByPhase = useMemo(() => {
        const grouped = phasesToUse.reduce((acc: Record<string, WorkflowNode[]>, phase: any) => {
            acc[phase.id] = nodes.filter(n => n.phase === phase.id);
            return acc;
        }, {} as Record<string, WorkflowNode[]>);
        return grouped;
    }, [nodes, phasesToUse]);

    // Sprint 21.2: Panning state for middle-click drag
    const [isPanning, setIsPanning] = useState(false);
    const panStart = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

    // Panning handlers
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        // Middle mouse button (button === 1)
        if (e.button === 1 && containerRef.current) {
            e.preventDefault();
            setIsPanning(true);
            panStart.current = {
                x: e.clientX,
                y: e.clientY,
                scrollLeft: containerRef.current.scrollLeft,
                scrollTop: containerRef.current.scrollTop
            };
        }
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isPanning || !containerRef.current) return;

        const dx = e.clientX - panStart.current.x;
        const dy = e.clientY - panStart.current.y;

        containerRef.current.scrollLeft = panStart.current.scrollLeft - dx;
        containerRef.current.scrollTop = panStart.current.scrollTop - dy;
    }, [isPanning]);

    const handleMouseUp = useCallback(() => {
        setIsPanning(false);
    }, []);

    // Also stop panning if mouse leaves canvas
    const handleMouseLeave = useCallback(() => {
        setIsPanning(false);
    }, []);


    return (
        <div className="flex gap-6 h-[600px]">
            {/* Horizontal View (Only Mode) */}
            <div className="flex-1 flex h-full rounded-xl border border-tokens-border overflow-hidden">
                {/* Left Sidebar - only show when canvas has content */}
                {!isEmptyCanvas && (
                    <div className="w-52 border-r border-tokens-border bg-tokens-panel flex flex-col">
                        {/* Phases Section */}
                        <div className="p-4 border-b border-tokens-border">
                            <h3 className="text-xs font-semibold text-tokens-muted uppercase tracking-wider mb-3">{t('initiator:workflow.phasesLabel', 'Phases')}</h3>
                            <div className="space-y-2">
                                {phasesToUse.map((phase: any) => {
                                    const count = nodesByPhase[phase.id]?.length || 0;
                                    return (
                                        <div
                                            key={phase.id}
                                            className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-tokens-panel2 transition-colors cursor-pointer"
                                        >
                                            <div
                                                className="w-2 h-2 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: phase.color }}
                                            />
                                            <span className="text-xs text-tokens-fg flex-1 truncate">{phase.label}</span>
                                            <span className="text-[10px] text-tokens-muted">{count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Progress Section */}
                        <div className="p-4 border-b border-tokens-border">
                            <h3 className="text-xs font-semibold text-tokens-muted uppercase tracking-wider mb-2">{t('initiator:workflow.statusProject')}</h3>
                            <div className="space-y-2">
                                <div className="text-xs text-tokens-muted">{t('initiator:workflow.progress', 'Progress')}</div>
                                <div className="text-2xl font-bold text-tokens-fg">{progress.percent}%</div>
                                <div className="w-full h-1.5 bg-tokens-panel2 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary-700 dark:bg-secondary-300 transition-all duration-300"
                                        style={{ width: `${progress.percent}%` }}
                                    />
                                </div>
                                {progress.totalDoD > 0 && (
                                    <div className="text-[10px] text-tokens-muted">
                                        {t('initiator:workflow.itemsCompleted', '{{completed}}/{{total}} items completed', { completed: progress.completedDoD, total: progress.totalDoD })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Status Legend */}
                        <div className="p-4">
                            <h3 className="text-xs font-semibold text-tokens-muted uppercase tracking-wider mb-3">{t('initiator:workflow.legend', 'Legend')}</h3>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-tokens-success flex-shrink-0" />
                                    <span className="text-xs text-tokens-fg">{t('initiator:workflow.done', 'Done')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-tokens-warning flex-shrink-0 animate-pulse" />
                                    <span className="text-xs text-tokens-fg">{t('initiator:workflow.inProgress')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-tokens-muted flex-shrink-0" />
                                    <span className="text-xs text-tokens-fg">{t('initiator:workflow.toDo')}</span>
                                </div>
                            </div>

                            {/* Clear Progress Button */}
                            {progress.percent > 0 && (
                                <button
                                    onClick={handleClearProgress}
                                    className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs text-tokens-error hover:bg-tokens-error/10 rounded-lg border border-tokens-error/20 hover:border-tokens-error/40 transition-colors"
                                    title={t('initiator:tooltips.clearProgress', 'Clear all progress')}
                                >
                                    <RotateCcw size={12} />
                                    {t('initiator:workflow.clearProgress', 'Clear Progress')}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Main Canvas Area - Pannable with middle-click */}
                <div
                    ref={containerRef}
                    className={`flex-1 overflow-auto bg-tokens-panel2 relative ${isPanning ? 'cursor-grabbing select-none' : ''}`}
                    style={{ scrollBehavior: isPanning ? 'auto' : 'smooth' }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                >
                    {/* Custom scrollbar hiding */}
                    <style>{`
                        .canvas-scroll::-webkit-scrollbar {
                            width: 6px;
                            height: 6px;
                        }
                        .canvas-scroll::-webkit-scrollbar-track {
                            background: transparent;
                        }
                        .canvas-scroll::-webkit-scrollbar-thumb {
                            background: rgba(128, 128, 128, 0.3);
                            border-radius: 3px;
                        }
                        .canvas-scroll::-webkit-scrollbar-thumb:hover {
                            background: rgba(128, 128, 128, 0.5);
                        }
                    `}</style>

                    {/* Project Info Header - only shown when project is selected and has content */}
                    {project && !isEmptyCanvas && (
                        <div className="sticky top-0 z-sticky m-4 mb-0 p-3 bg-tokens-panel/95 backdrop-blur-sm border border-tokens-border rounded-lg flex items-center gap-4 text-xs shadow-sm">
                            {/* Project Type */}
                            <div className="flex items-center gap-1.5">
                                <span className="text-tokens-muted">{t('initiator:workflow.type', 'Type')}:</span>
                                <span className="font-medium text-tokens-fg">
                                    {project.type === 'client' ? t('initiator:projectTypes.client', 'Client') :
                                        project.type === 'gesu-creative' ? t('initiator:projectTypes.gesu-creative', 'Personal') :
                                            t('initiator:projectTypes.other', 'Other')}
                                </span>
                            </div>

                            {/* Client Name - only for client projects */}
                            {project.type === 'client' && project.clientName && (
                                <div className="flex items-center gap-1.5">
                                    <span className="text-tokens-muted">{t('initiator:workflow.client', 'Client')}:</span>
                                    <span className="font-medium text-tokens-brand-DEFAULT">{project.clientName}</span>
                                </div>
                            )}

                            {/* Folder Path - clickable */}
                            {project.projectPath && (
                                <button
                                    onClick={() => {
                                        if (window.gesu?.shell?.openPath) {
                                            window.gesu.shell.openPath(project.projectPath!);
                                        } else {
                                            console.log('[WorkflowCanvas] Would open:', project.projectPath);
                                        }
                                    }}
                                    className="flex items-center gap-1.5 flex-1 min-w-0 group hover:text-tokens-brand-DEFAULT transition-colors"
                                    title={t('initiator:tooltips.openFolder', 'Open folder in explorer')}
                                >
                                    <FolderOpen size={12} className="text-tokens-muted group-hover:text-tokens-brand-DEFAULT shrink-0" />
                                    <span className="font-mono text-tokens-muted group-hover:text-tokens-brand-DEFAULT truncate">{project.projectPath}</span>
                                </button>
                            )}
                        </div>
                    )}

                    {/* Empty state message */}
                    {isEmptyCanvas && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="px-8 py-6 rounded-xl border-2 border-dashed border-tokens-border bg-tokens-panel/80 backdrop-blur-sm max-w-sm text-center">
                                {blueprintError ? (
                                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-tokens-warning/10 flex items-center justify-center">
                                        <FileWarning className="text-tokens-warning" size={24} />
                                    </div>
                                ) : (
                                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-tokens-brand-DEFAULT/10 flex items-center justify-center">
                                        <Search className="text-tokens-brand-DEFAULT" size={24} />
                                    </div>
                                )}
                                <div className="text-tokens-fg text-sm font-medium mb-1">
                                    {blueprintError ? 'No Blueprint Assigned' : 'No Project Selected'}
                                </div>
                                <div className="text-tokens-muted/70 text-xs mb-4">
                                    {blueprintError
                                        ? blueprintError
                                        : 'Select a project from the top bar to view its workflow.'}
                                </div>
                                {blueprintError && (
                                    <div className="flex gap-2 justify-center">
                                        <button
                                            onClick={() => {
                                                // Navigate to Generator tab with 'Existing Project' mode
                                                setSearchParams({ tab: 'generator', mode: 'exist' });
                                            }}
                                            className="px-4 py-2 bg-tokens-fg text-tokens-bg text-xs font-medium rounded-lg hover:opacity-90 transition-colors"
                                        >
                                            Assign Blueprint →
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if (project && await confirm({
                                                    title: 'Delete Project?',
                                                    message: t('initiator:messages.deleteProjectConfirm', { name: project.name }),
                                                    type: 'danger',
                                                    confirmLabel: 'Delete',
                                                    cancelLabel: 'Keep Project'
                                                })) {
                                                    deleteProject(project.id);
                                                    // Force reload to clear state and refresh UI
                                                    window.location.reload();
                                                }
                                            }}
                                            className="px-4 py-2 bg-tokens-error/10 text-tokens-error border border-tokens-error/20 text-xs font-medium rounded-lg hover:bg-tokens-error/20 transition-colors flex items-center gap-1"
                                            title={t('initiator:tooltips.deleteProject', 'Delete this project permanently')}
                                        >
                                            <Trash2 size={12} />
                                            Delete Project
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Phase Rows - Extra padding for hover overflow */}
                    {!isEmptyCanvas && (
                        <div className="p-6 pb-12 min-w-max">
                            {phasesToUse.map((phase: any, phaseIndex: number) => {
                                const phaseNodes = nodesByPhase[phase.id] || [];
                                if (phaseNodes.length === 0) return null;

                                const isPhaseHovered = hoveredPhase === phase.id;
                                const nextPhase = phasesToUse[phaseIndex + 1];
                                const nextPhaseNodes = nextPhase ? nodesByPhase[nextPhase.id] || [] : [];
                                const hasNextPhase = nextPhaseNodes.length > 0;

                                return (
                                    <div key={phase.id}>
                                        {/* Phase Row */}
                                        <div
                                            className="flex gap-4 py-3 group"
                                            onMouseEnter={() => setHoveredPhase(phase.id)}
                                            onMouseLeave={() => setHoveredPhase(null)}
                                        >
                                            {/* Vertical Phase Label */}
                                            <div
                                                className="flex items-center justify-center w-7 flex-shrink-0 rounded-lg py-3"
                                                style={{ backgroundColor: `${phase.color}15` }}
                                            >
                                                <div
                                                    className="text-[9px] font-bold uppercase tracking-widest whitespace-nowrap"
                                                    style={{
                                                        writingMode: 'vertical-rl',
                                                        textOrientation: 'mixed',
                                                        color: phase.color,
                                                        letterSpacing: '0.15em'
                                                    }}
                                                >
                                                    {phase.label}
                                                </div>
                                            </div>

                                            {/* Horizontal Cards with Arrows */}
                                            <div className="flex-1 flex items-center gap-0">
                                                {phaseNodes.map((node: WorkflowNode, index: number) => {
                                                    const statusColors: Record<NodeStatus, string> = {
                                                        'todo': 'border-tokens-border/50 bg-tokens-panel',
                                                        'in-progress': 'border-tokens-warning/60 bg-tokens-warning/5',
                                                        'done': 'border-tokens-success/60 bg-tokens-success/5',
                                                    };

                                                    return (
                                                        <div key={node.id} className="flex items-center">
                                                            {/* Card */}
                                                            <div
                                                                onClick={() => setSelectedNodeId(node.id)}
                                                                className={`flex-shrink-0 w-44 rounded-xl border-2 p-2.5 cursor-pointer 
                                                                            transition-all duration-200 relative
                                                                            ${statusColors[node.status]}
                                                                            ${selectedNodeId === node.id
                                                                        ? 'ring-2 ring-tokens-brand-DEFAULT ring-offset-2 ring-offset-tokens-panel2 shadow-xl scale-105 z-20'
                                                                        : 'hover:shadow-lg hover:scale-[1.02] hover:border-tokens-brand-DEFAULT/70 hover:-translate-y-1 z-10'}`}
                                                            >
                                                                {/* Status Indicator + Phase Badge */}
                                                                <div className="flex items-center justify-between gap-1 mb-1">
                                                                    <span
                                                                        className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded"
                                                                        style={{
                                                                            backgroundColor: `${phase.color}20`,
                                                                            color: phase.color
                                                                        }}
                                                                    >
                                                                        {phase.label}
                                                                    </span>
                                                                    {/* Status Dot */}
                                                                    <div className="flex items-center gap-1">
                                                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${node.status === 'done' ? 'bg-tokens-success' :
                                                                            node.status === 'in-progress' ? 'bg-tokens-warning animate-pulse' :
                                                                                'bg-tokens-muted'
                                                                            }`} />
                                                                        <span className={`text-[9px] font-medium uppercase ${node.status === 'done' ? 'text-tokens-success' :
                                                                            node.status === 'in-progress' ? 'text-tokens-warning' :
                                                                                'text-tokens-muted'
                                                                            }`}>
                                                                            {node.status === 'in-progress' ? 'WiP' : node.status === 'done' ? 'Done' : 'Todo'}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                <h4 className="text-xs font-semibold text-tokens-fg line-clamp-2 leading-tight mb-1">
                                                                    {index}. {node.titleKey ? t(node.titleKey, node.title) : node.title}
                                                                </h4>
                                                                <p className="text-[10px] text-tokens-muted line-clamp-2 mb-1.5 min-h-[1.75rem]">
                                                                    {node.descKey ? t(node.descKey, node.description) : node.description}
                                                                </p>

                                                                {/* Details - only visible on phase hover */}
                                                                <button
                                                                    className={`text-[10px] text-tokens-brand-DEFAULT font-medium flex items-center gap-0.5 transition-all duration-200
                                                                               ${isPhaseHovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 pointer-events-none'}`}
                                                                >
                                                                    Details →
                                                                </button>
                                                            </div>

                                                            {/* Horizontal Arrow Connector */}
                                                            {index < phaseNodes.length - 1 && (
                                                                <svg width="40" height="24" viewBox="0 0 40 24" className="flex-shrink-0">
                                                                    <defs>
                                                                        <marker id={`arrow-${phase.id}-${index}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                                                                            <polygon points="0 0, 6 3, 0 6" fill="#9ca3af" />
                                                                        </marker>
                                                                    </defs>
                                                                    <path
                                                                        d="M 4 10 Q 20 16, 34 10"
                                                                        fill="none"
                                                                        stroke="#9ca3af"
                                                                        strokeWidth="1.5"
                                                                        markerEnd={`url(#arrow-${phase.id}-${index})`}
                                                                    />
                                                                </svg>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Striped Divider between phases */}
                                        {hasNextPhase && (
                                            <div className="relative h-1 my-2 mx-10 overflow-hidden rounded-full">
                                                <div
                                                    className="absolute inset-0"
                                                    style={{
                                                        background: `repeating-linear-gradient(90deg, ${phase.color}20, ${phase.color}20 4px, transparent 4px, transparent 10px)`
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Overlay Side Panel - appears when node selected */}
            {selectedNode && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    {/* Blur/dim backdrop */}
                    <div
                        className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
                        onClick={() => setSelectedNodeId(null)}
                    />

                    {/* Panel overlay - right side */}
                    <div className="relative w-full max-w-md h-full bg-tokens-bg border-l border-tokens-border shadow-2xl overflow-y-auto">
                        <StepDetailPanel
                            selectedNode={selectedNode}
                            onToggleDoDItem={handleToggleDoDItem}
                            onMarkAsDone={handleMarkAsDone}
                            onReopenNode={handleReopenNode}
                            blueprintPhases={currentBlueprint?.phases}
                        />
                    </div>
                </div>
            )}
            <ConfirmDialogComponent />
        </div>
    );
}
