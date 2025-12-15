import { Check, CheckCircle2 } from 'lucide-react';
import { WorkflowNode, WORKFLOW_PHASES } from './workflowData';
import { Button } from '../components/Button';

interface StepDetailPanelProps {
    selectedNode: WorkflowNode | null;
    onClose?: () => void;
    onToggleDoDItem: (nodeId: string, dodItemId: string) => void;
    onMarkAsDone: (nodeId: string) => void;
}

export function StepDetailPanel({
    selectedNode,
    onToggleDoDItem,
    onMarkAsDone
}: StepDetailPanelProps) {
    // Empty state
    if (!selectedNode) {
        return (
            <div className="w-80 xl:w-96 flex-shrink-0 flex items-center justify-center p-6">
                <div className="text-center max-w-xs">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-tokens-panel2 flex items-center justify-center">
                        <CheckCircle2 size={32} className="text-tokens-muted" />
                    </div>
                    <h3 className="text-sm font-medium text-tokens-muted mb-2">
                        Pilih Step
                    </h3>
                    <p className="text-xs text-tokens-muted/70">
                        Klik salah satu node di canvas untuk melihat detail step dan checklist.
                    </p>
                </div>
            </div>
        );
    }

    // Find phase info
    const phaseInfo = WORKFLOW_PHASES.find(p => p.id === selectedNode.phase);
    const allDoDDone = selectedNode.dodChecklist.every(item => item.done);
    const completedCount = selectedNode.dodChecklist.filter(item => item.done).length;
    const totalCount = selectedNode.dodChecklist.length;

    return (
        <div className="w-80 xl:w-96 flex-shrink-0 border-l border-tokens-border bg-tokens-panel/30 flex flex-col">
            {/* Header - Fixed */}
            <div className="p-6 border-b border-tokens-border flex-shrink-0">
                {/* Phase Badge */}
                {phaseInfo && (
                    <div className="flex items-center gap-2 mb-3">
                        <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: phaseInfo.color }}
                        />
                        <span
                            className="text-[10px] font-bold uppercase tracking-wider"
                            style={{ color: phaseInfo.color }}
                        >
                            {phaseInfo.label}
                        </span>
                    </div>
                )}

                {/* Title */}
                <h2 className="text-xl font-bold text-tokens-fg mb-2">
                    {selectedNode.title}
                </h2>

                {/* Status Badge */}
                <div className="flex items-center gap-2">
                    {selectedNode.status === 'done' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium
                                       bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                            <Check size={12} />
                            Done
                        </span>
                    )}
                    {selectedNode.status === 'in-progress' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium
                                       bg-amber-500/20 text-amber-600 dark:text-amber-400">
                            WIP
                        </span>
                    )}
                    {selectedNode.status === 'todo' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium
                                       bg-tokens-muted/20 text-tokens-muted">
                            Todo
                        </span>
                    )}
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Description */}
                <div>
                    <h3 className="text-xs font-semibold text-tokens-muted uppercase tracking-wider mb-2">
                        Kenapa Step Ini Ada?
                    </h3>
                    <p className="text-sm text-tokens-fg leading-relaxed">
                        {selectedNode.description}
                    </p>
                </div>

                {/* Definition of Done */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-semibold text-tokens-muted uppercase tracking-wider">
                            Definition of Done
                        </h3>
                        <span className="text-xs text-tokens-muted">
                            {completedCount}/{totalCount}
                        </span>
                    </div>

                    <div className="space-y-2">
                        {selectedNode.dodChecklist.map((item) => (
                            <label
                                key={item.id}
                                className="flex items-start gap-3 p-2 rounded-lg hover:bg-tokens-panel2 
                                         transition-colors cursor-pointer group"
                            >
                                <input
                                    type="checkbox"
                                    checked={item.done}
                                    onChange={() => onToggleDoDItem(selectedNode.id, item.id)}
                                    className="mt-0.5 rounded border-tokens-border bg-tokens-panel2 
                                             text-tokens-brand-DEFAULT focus:ring-tokens-brand-DEFAULT/40
                                             cursor-pointer"
                                />
                                <span className={`text-sm flex-1 ${item.done ? 'line-through text-tokens-muted' : 'text-tokens-fg'}`}>
                                    {item.label}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Recommended Tools */}
                {selectedNode.tools && selectedNode.tools.length > 0 && (
                    <div>
                        <h3 className="text-xs font-semibold text-tokens-muted uppercase tracking-wider mb-2">
                            Recommended Tools
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {selectedNode.tools.map((tool, index) => (
                                <span
                                    key={index}
                                    className="px-2 py-1 rounded-md text-xs font-medium
                                             bg-tokens-panel2 text-tokens-fg border border-tokens-border"
                                >
                                    {tool}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer - Fixed */}
            <div className="p-6 border-t border-tokens-border flex-shrink-0">
                <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={() => onMarkAsDone(selectedNode.id)}
                    disabled={selectedNode.status === 'done'}
                    icon={selectedNode.status === 'done' ? <Check size={16} /> : undefined}
                >
                    {selectedNode.status === 'done' ? 'Sudah Selesai' : 'Tandai Selesai'}
                </Button>

                {allDoDDone && selectedNode.status !== 'done' && (
                    <p className="text-xs text-tokens-brand-DEFAULT text-center mt-2">
                        ✨ Semua checklist sudah selesai!
                    </p>
                )}
            </div>
        </div>
    );
}
