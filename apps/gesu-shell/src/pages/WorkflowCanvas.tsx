import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import {
    WORKFLOW_PHASES,
    WORKFLOW_NODES,
    WORKFLOW_EDGES,
    CANVAS_CONFIG,
    WorkflowNode,
} from './workflowData';
import { StepDetailPanel } from './StepDetailPanel';
import {
    mergeNodesWithProgress,
    toggleDoDItem as persistToggleDoDItem,
    markNodeDone as persistMarkNodeDone,
} from '../stores/workflowProgressStore';
import { getActiveProject } from '../stores/projectStore';
import { loadBlueprints, getBlueprintById } from '../services/workflowBlueprintsService';
import { blueprintToWorkflowNodes } from '../services/workflowBlueprintRenderer';
import { DEFAULT_BLUEPRINT_ID } from '../types/workflowBlueprints';

// --- Node Component ---
interface WorkflowNodeCardProps {
    node: WorkflowNode;
    x: number;
    y: number;
    isSelected?: boolean;
    onSelect?: (id: string) => void;
}

function WorkflowNodeCard({ node, x, y, isSelected, onSelect }: WorkflowNodeCardProps) {
    const statusColors = {
        'todo': 'border-tokens-border bg-tokens-panel',
        'in-progress': 'border-amber-400/50 bg-amber-500/10',
        'done': 'border-emerald-400/50 bg-emerald-500/10',
    };

    const statusBadge = {
        'todo': 'bg-tokens-muted/20 text-tokens-muted',
        'in-progress': 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
        'done': 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    };

    return (
        <div
            data-node-id={node.id}
            className={`absolute rounded-lg border-2 p-3 cursor-pointer pointer-events-auto
                        transition-all duration-150 select-none
                        ${statusColors[node.status]}
                        ${isSelected
                    ? 'ring-2 ring-tokens-brand-DEFAULT ring-offset-2 ring-offset-tokens-bg shadow-lg'
                    : 'hover:shadow-md hover:border-tokens-brand-DEFAULT/50'}
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tokens-brand-DEFAULT`}
            style={{
                left: x,
                top: y,
                width: CANVAS_CONFIG.nodeWidth,
                height: CANVAS_CONFIG.nodeHeight,
            }}
            onClick={(e) => {
                e.stopPropagation();
                onSelect?.(node.id);
            }}
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect?.(node.id);
                }
            }}
        >
            <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-medium text-tokens-fg truncate flex-1">
                    {node.title}
                </h4>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium uppercase ${statusBadge[node.status]}`}>
                    {node.status === 'in-progress' ? 'WIP' : node.status}
                </span>
            </div>
            <p className="text-xs text-tokens-muted mt-1 line-clamp-2">
                {node.description}
            </p>
        </div>
    );
}

// --- SVG Connectors ---
interface ConnectorProps {
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
}

function Connector({ fromX, fromY, toX, toY }: ConnectorProps) {
    // Calculate control points for a smooth curve
    const midX = (fromX + toX) / 2;

    // Create a bezier curve path
    const path = `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;

    return (
        <g>
            <path
                d={path}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="text-tokens-border"
                markerEnd="url(#arrowhead)"
            />
        </g>
    );
}

// --- Main Canvas Component ---
export function WorkflowCanvas() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    // Blueprint loading state
    const [baseNodes, setBaseNodes] = useState<WorkflowNode[]>(WORKFLOW_NODES);
    const [blueprintError, setBlueprintError] = useState<string | null>(null);
    const [isLoadingBlueprint, setIsLoadingBlueprint] = useState(false);

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

            const blueprintId = project.blueprintId || DEFAULT_BLUEPRINT_ID;
            console.log('[WorkflowCanvas] Loading blueprint for project:', project.name, 'blueprintId:', blueprintId);

            setIsLoadingBlueprint(true);
            setBlueprintError(null);

            try {
                const blueprintData = await loadBlueprints();
                const blueprint = getBlueprintById(blueprintData, blueprintId);

                if (blueprint) {
                    const blueprintNodes = blueprintToWorkflowNodes(blueprint);
                    console.log('[WorkflowCanvas] Loaded blueprint nodes:', blueprintNodes.length);
                    setBaseNodes(blueprintNodes);
                    setNodes(mergeNodesWithProgress(blueprintNodes));
                    setBlueprintError(null);
                } else {
                    console.warn('[WorkflowCanvas] Blueprint not found:', blueprintId, ', falling back to static');
                    setBaseNodes(WORKFLOW_NODES);
                    setNodes(mergeNodesWithProgress(WORKFLOW_NODES));
                    setBlueprintError(`Blueprint "${blueprintId}" not found. Using default workflow.`);
                }
            } catch (err) {
                console.error('[WorkflowCanvas] Failed to load blueprint:', err);
                setBaseNodes(WORKFLOW_NODES);
                setNodes(mergeNodesWithProgress(WORKFLOW_NODES));
                setBlueprintError('Failed to load blueprint. Using default workflow.');
            } finally {
                setIsLoadingBlueprint(false);
            }
        };

        loadBlueprintForProject();
    }, []); // Re-run when component mounts; external project switch triggers parent remount

    // Refresh helper for external triggers (uses current baseNodes)
    const refreshNodes = useCallback(() => {
        setNodes(mergeNodesWithProgress(baseNodes));
    }, [baseNodes]);

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

    // --- Calculate Node Positions ---
    const nodePositions = useMemo(() => {
        const positions: Record<string, { x: number; y: number }> = {};
        const { nodeWidth, nodeHeight, nodeGapX, nodeGapY, swimlaneHeaderHeight, swimlanePadding } = CANVAS_CONFIG;

        WORKFLOW_PHASES.forEach((phase, phaseIndex) => {
            const phaseX = phaseIndex * (nodeWidth + nodeGapX * 2) + swimlanePadding;
            const nodesInPhase = baseNodes.filter(n => n.phase === phase.id);

            nodesInPhase.forEach(node => {
                const nodeY = swimlaneHeaderHeight + swimlanePadding + node.row * (nodeHeight + nodeGapY);
                positions[node.id] = { x: phaseX, y: nodeY };
            });
        });

        return positions;
    }, [baseNodes]);

    // --- Calculate Canvas Size ---
    const canvasSize = useMemo(() => {
        const { nodeWidth, nodeHeight, nodeGapX, nodeGapY, swimlaneHeaderHeight, swimlanePadding } = CANVAS_CONFIG;

        const width = WORKFLOW_PHASES.length * (nodeWidth + nodeGapX * 2) + swimlanePadding * 2;

        // Find max row count across all phases
        const maxRows = Math.max(1, ...WORKFLOW_PHASES.map(phase =>
            baseNodes.filter(n => n.phase === phase.id).length
        ));

        const height = swimlaneHeaderHeight + swimlanePadding * 2 + maxRows * (nodeHeight + nodeGapY);

        return { width, height };
    }, []);

    // --- Panning Handlers ---
    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        // Only pan if clicking on background (check if target is the pannable layer)
        const target = e.target as HTMLElement;
        if (target.dataset.pannableBackground === 'true') {
            setIsPanning(true);
            setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
        }
    }, [pan]);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!isPanning) return;
        const newX = e.clientX - panStart.x;
        const newY = e.clientY - panStart.y;
        setPan({ x: newX, y: newY });
    }, [isPanning, panStart]);

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
        if (isPanning) {
            setIsPanning(false);
            (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        }
    }, [isPanning]);

    const handleReset = () => {
        setPan({ x: 0, y: 0 });
        setSelectedNodeId(null);
    };

    // --- Edge Endpoints Calculation ---
    const edgeLines = useMemo(() => {
        const { nodeWidth, nodeHeight } = CANVAS_CONFIG;

        return WORKFLOW_EDGES.map(edge => {
            const fromPos = nodePositions[edge.from];
            const toPos = nodePositions[edge.to];

            if (!fromPos || !toPos) return null;

            // Connect from right side of "from" node to left side of "to" node
            const fromX = fromPos.x + nodeWidth;
            const fromY = fromPos.y + nodeHeight / 2;
            const toX = toPos.x;
            const toY = toPos.y + nodeHeight / 2;

            return { id: edge.id, fromX, fromY, toX, toY };
        }).filter(Boolean) as { id: string; fromX: number; fromY: number; toX: number; toY: number }[];
    }, [nodePositions]);

    return (
        <div className="flex gap-6 h-[600px]">
            {/* Canvas Column */}
            <div className="flex-1 relative bg-tokens-panel2 rounded-xl border border-tokens-border overflow-hidden">
                {/* Reset View Button */}
                <button
                    onClick={handleReset}
                    className="absolute top-3 right-3 z-20 px-3 py-1.5 bg-tokens-panel border border-tokens-border 
                               rounded-lg text-xs font-medium text-tokens-muted hover:text-tokens-fg 
                               hover:bg-tokens-panel2 transition-colors flex items-center gap-1.5 shadow-sm"
                    title="Reset view"
                >
                    <RotateCcw size={14} />
                    Reset
                </button>

                {/* Pannable Container */}
                <div
                    ref={containerRef}
                    className={`absolute inset-0 ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                >
                    {/* Background layer for pan detection - always receives pointer events */}
                    <div
                        data-pannable-background="true"
                        className="absolute inset-0"
                        style={{ width: '200%', height: '200%', left: '-50%', top: '-50%' }}
                    />

                    {/* Transformed Layer */}
                    <div
                        className="absolute pointer-events-none"
                        style={{
                            transform: `translate(${pan.x}px, ${pan.y}px)`,
                            width: canvasSize.width,
                            height: canvasSize.height,
                        }}
                    >
                        {/* SVG Layer for Connectors */}
                        <svg
                            className="absolute inset-0 pointer-events-none"
                            width={canvasSize.width}
                            height={canvasSize.height}
                        >
                            <defs>
                                <marker
                                    id="arrowhead"
                                    markerWidth="10"
                                    markerHeight="7"
                                    refX="9"
                                    refY="3.5"
                                    orient="auto"
                                >
                                    <polygon
                                        points="0 0, 10 3.5, 0 7"
                                        className="fill-tokens-border"
                                    />
                                </marker>
                            </defs>
                            {edgeLines.map(edge => (
                                <Connector
                                    key={edge.id}
                                    fromX={edge.fromX}
                                    fromY={edge.fromY}
                                    toX={edge.toX}
                                    toY={edge.toY}
                                />
                            ))}
                        </svg>

                        {/* Swimlane Headers */}
                        {WORKFLOW_PHASES.map((phase, index) => {
                            const { nodeWidth, nodeGapX, swimlanePadding, swimlaneHeaderHeight } = CANVAS_CONFIG;
                            const phaseX = index * (nodeWidth + nodeGapX * 2) + swimlanePadding;

                            return (
                                <div
                                    key={phase.id}
                                    className="absolute flex items-center gap-2 px-3"
                                    style={{
                                        left: phaseX,
                                        top: 8,
                                        width: nodeWidth,
                                        height: swimlaneHeaderHeight - 16,
                                    }}
                                >
                                    <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: phase.color }}
                                    />
                                    <span className="text-xs font-semibold text-tokens-muted uppercase tracking-wider">
                                        {phase.label}
                                    </span>
                                </div>
                            );
                        })}

                        {/* Nodes - Use local state */}
                        {nodes.map(node => {
                            const pos = nodePositions[node.id];
                            if (!pos) return null;

                            return (
                                <WorkflowNodeCard
                                    key={node.id}
                                    node={node}
                                    x={pos.x}
                                    y={pos.y}
                                    isSelected={selectedNodeId === node.id}
                                    onSelect={setSelectedNodeId}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* Visual hint for panning */}
                <div className="absolute bottom-3 left-3 text-[10px] text-tokens-muted/50 pointer-events-none">
                    Drag to pan • Click node to select
                </div>
            </div>

            {/* Step Detail Panel Column */}
            <StepDetailPanel
                selectedNode={selectedNode}
                onToggleDoDItem={handleToggleDoDItem}
                onMarkAsDone={handleMarkAsDone}
            />
        </div>
    );
}
