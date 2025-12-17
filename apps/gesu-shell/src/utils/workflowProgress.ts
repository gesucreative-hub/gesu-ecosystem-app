import { WorkflowNode } from '../pages/workflowData';

export interface WorkflowProgressStats {
    percent: number;
    completedDoD: number;
    totalDoD: number;
    completedSteps: number;
    totalSteps: number;
}

/**
 * Calculate overall project progress based on DoD completion.
 * Prefers DoD-based calculation if DoD items exist; otherwise falls back to step completion.
 */
export function calculateOverallProgress(nodes: WorkflowNode[]): WorkflowProgressStats {
    let completedDoD = 0;
    let totalDoD = 0;
    let completedSteps = 0;

    nodes.forEach(node => {
        // Count DoD items
        if (node.dodChecklist && node.dodChecklist.length > 0) {
            totalDoD += node.dodChecklist.length;
            completedDoD += node.dodChecklist.filter(d => d.done).length;
        }

        // Count completed steps
        if (node.status === 'done') {
            completedSteps++;
        }
    });

    const totalSteps = nodes.length;

    // Prefer DoD-based progress if DoD items exist; otherwise use step completion
    const percent = totalDoD > 0
        ? Math.round((completedDoD / totalDoD) * 100)
        : totalSteps > 0
            ? Math.round((completedSteps / totalSteps) * 100)
            : 0;

    return {
        percent,
        completedDoD,
        totalDoD,
        completedSteps,
        totalSteps,
    };
}
