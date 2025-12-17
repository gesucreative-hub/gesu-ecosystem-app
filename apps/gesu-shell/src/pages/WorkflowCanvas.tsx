import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import {
    WORKFLOW_PHASES,
    WORKFLOW_NODES,
    WorkflowNode,
} from './workflowData';
import { StepDetailPanel } from './StepDetailPanel';
import {
    mergeNodesWithProgress,
    toggleDoDItem as persistToggleDoDItem,
    markNodeDone as persistMarkNodeDone,
    setNodeStatus,
} from '../stores/workflowProgressStore';
import { getActiveProject } from '../stores/projectStore';
import { loadBlueprints, getBlueprintById } from '../services/workflowBlueprintsService';
import { blueprintToWorkflowNodes } from '../services/workflowBlueprintRenderer';
import { calculateOverallProgress } from '../utils/workflowProgress';

// --- Main Canvas Component ---
export function WorkflowCanvas() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [hoveredPhase, setHoveredPhase] = useState<string | null>(null);

    // Blueprint loading state
    const [baseNodes, setBaseNodes] = useState<WorkflowNode[]>(WORKFLOW_NODES);
    const [blueprintError, setBlueprintError] = useState<string | null>(null);

    // Local state for nodes (merged with persisted progress)
    const [nodes, setNodes] = useState<WorkflowNode[]>(() => mergeNodesWithProgress(WORKFLOW_NODES));

    // Load blueprint for active project on mount and when project changes
    useEffect(() => {
        const loadBlueprintForProject = async () => {
            const project = getActiveProject();
            if (!project) {
                console.log('[WorkflowCanvas] No active project, using static nodes');
                setBaseNodes(WORKFLOW_NODES);
                setNodes(mergeNodesWithProgress(WORKFLOW_NODES));
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

    // Find selected node
    const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;

    // Handler to toggle DoD item (persists to store)
    const handleToggleDoDItem = useCallback((nodeId: string, dodItemId: string) => {
        persistToggleDoDItem(nodeId, dodItemId);
        setNodes(mergeNodesWithProgress(baseNodes));
    }, [baseNodes]);

    // Handler to mark node as done (persists to store)
    const handleMarkAsDone = useCallback((nodeId: string) => {
        persistMarkNodeDone(nodeId);
        setNodes(mergeNodesWithProgress(baseNodes));
    }, [baseNodes]);

    // Handler to reopen a done node (revert to in-progress)
    const handleReopenNode = useCallback((nodeId: string) => {
        setNodeStatus(nodeId, 'in-progress');
        setNodes(mergeNodesWithProgress(baseNodes));
    }, [baseNodes]);

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

    // Sprint 21.1: Group nodes by phase for horizontal view
    const nodesByPhase = useMemo(() => {
        const grouped = WORKFLOW_PHASES.reduce((acc, phase) => {
            acc[phase.id] = nodes.filter(n => n.phase === phase.id);
            return acc;
        }, {} as Record<string, WorkflowNode[]>);
        return grouped;
    }, [nodes]);

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
                {/* Left Sidebar */}
                <div className="w-52 border-r border-tokens-border bg-tokens-panel flex flex-col">
                    {/* Phases Section */}
                    <div className="p-4 border-b border-tokens-border">
                        <h3 className="text-xs font-semibold text-tokens-muted uppercase tracking-wider mb-3">Phases</h3>
                        <div className="space-y-2">
                            {WORKFLOW_PHASES.map(phase => {
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
                        <h3 className="text-xs font-semibold text-tokens-muted uppercase tracking-wider mb-2">Status Project</h3>
                        <div className="space-y-2">
                            <div className="text-xs text-tokens-muted">Progress</div>
                            <div className="text-2xl font-bold text-tokens-fg">{progress.percent}%</div>
                            <div className="w-full h-1.5 bg-tokens-panel2 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary-700 dark:bg-secondary-300 transition-all duration-300"
                                    style={{ width: `${progress.percent}%` }}
                                />
                            </div>
                            {progress.totalDoD > 0 && (
                                <div className="text-[10px] text-tokens-muted">
                                    {progress.completedDoD}/{progress.totalDoD} items completed
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Status Legend */}
                    <div className="p-4">
                        <h3 className="text-xs font-semibold text-tokens-muted uppercase tracking-wider mb-3">Legend</h3>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
                                <span className="text-xs text-tokens-fg">Done</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0 animate-pulse" />
                                <span className="text-xs text-tokens-fg">In Progress</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-gray-400 flex-shrink-0" />
                                <span className="text-xs text-tokens-fg">To Do</span>
                            </div>
                        </div>
                    </div>
                </div>

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

                    {/* No blueprint message */}
                    {isEmptyCanvas && blueprintError && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="px-6 py-4 rounded-xl border-2 border-dashed border-tokens-border bg-tokens-panel/80 backdrop-blur-sm">
                                <div className="text-tokens-muted text-sm font-medium text-center">
                                    No blueprint yet
                                </div>
                                <div className="text-tokens-muted/60 text-xs text-center mt-1">
                                    Go to Standards tab to create one
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Phase Rows - Extra padding for hover overflow */}
                    {!isEmptyCanvas && (
                        <div className="p-6 pb-12 min-w-max">
                            {WORKFLOW_PHASES.map((phase, phaseIndex) => {
                                const phaseNodes = nodesByPhase[phase.id] || [];
                                if (phaseNodes.length === 0) return null;

                                const isPhaseHovered = hoveredPhase === phase.id;
                                const nextPhase = WORKFLOW_PHASES[phaseIndex + 1];
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
                                                {phaseNodes.map((node, index) => {
                                                    const statusColors = {
                                                        'todo': 'border-tokens-border/50 bg-tokens-panel',
                                                        'in-progress': 'border-amber-400/60 bg-amber-500/5',
                                                        'done': 'border-emerald-400/60 bg-emerald-500/5',
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
                                                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${node.status === 'done' ? 'bg-emerald-500' :
                                                                            node.status === 'in-progress' ? 'bg-amber-500 animate-pulse' :
                                                                                'bg-gray-400'
                                                                            }`} />
                                                                        <span className={`text-[9px] font-medium uppercase ${node.status === 'done' ? 'text-emerald-500' :
                                                                            node.status === 'in-progress' ? 'text-amber-500' :
                                                                                'text-gray-400'
                                                                            }`}>
                                                                            {node.status === 'in-progress' ? 'WiP' : node.status === 'done' ? 'Done' : 'Todo'}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                <h4 className="text-xs font-semibold text-tokens-fg line-clamp-2 leading-tight mb-1">
                                                                    {index}. {node.title}
                                                                </h4>
                                                                <p className="text-[10px] text-tokens-muted line-clamp-2 mb-1.5 min-h-[1.75rem]">
                                                                    {node.description}
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
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
