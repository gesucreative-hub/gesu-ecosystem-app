// Workflow Blueprint Renderer
// Sprint 20 - Convert blueprint nodes to renderable WorkflowNode format

import { WorkflowNode, DoDItem, WorkflowPhase, WORKFLOW_NODES } from '../pages/workflowData';
import { BlueprintNode, WorkflowBlueprint } from '../types/workflowBlueprints';

/**
 * Convert a BlueprintNode to a WorkflowNode for rendering.
 * Maps blueprint data to the display format expected by WorkflowCanvas.
 */
export function blueprintNodeToWorkflowNode(
    node: BlueprintNode,
    rowIndex: number
): WorkflowNode {
    // Map DoD strings to DoDItem objects
    const dodChecklist: DoDItem[] = node.dod.map((label, idx) => ({
        id: `${node.id}-${idx}`,
        label,
        done: false
    }));

    return {
        id: node.id,
        phase: node.phaseId as WorkflowPhase,
        title: node.title,
        description: node.description,
        status: 'todo', // Will be overridden by progress store
        row: rowIndex,
        dodChecklist,
        tools: node.tools
    };
}

/**
 * Convert a blueprint to an array of WorkflowNodes.
 * Organizes nodes by phase and assigns row positions.
 */
export function blueprintToWorkflowNodes(blueprint: WorkflowBlueprint): WorkflowNode[] {
    // Group nodes by phase
    const phases = ['planning', 'design', 'frontend', 'backend', 'ops'];
    const nodesByPhase: Record<string, BlueprintNode[]> = {};

    for (const phase of phases) {
        nodesByPhase[phase] = blueprint.nodes.filter(n => n.phaseId === phase);
    }

    // Convert to WorkflowNodes with row assignments
    const result: WorkflowNode[] = [];

    for (const phase of phases) {
        const phaseNodes = nodesByPhase[phase] || [];
        phaseNodes.forEach((node, rowIndex) => {
            result.push(blueprintNodeToWorkflowNode(node, rowIndex));
        });
    }

    return result;
}

/**
 * Fallback to static WORKFLOW_NODES when no blueprint is available.
 * This ensures graceful degradation.
 */
export function getStaticWorkflowNodes(): WorkflowNode[] {
    return [...WORKFLOW_NODES];
}
