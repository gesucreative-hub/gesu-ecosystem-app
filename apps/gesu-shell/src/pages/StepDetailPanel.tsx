import { useState, useEffect, useCallback } from 'react';
import { useAlertDialog } from '../components/AlertDialog';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, CheckCircle2, Target } from 'lucide-react';
import { WorkflowNode, WORKFLOW_PHASES } from './workflowData';
import { Button } from '../components/Button';
import {
    isDodItemAlreadySentToday,
    addTaskToToday,
} from '../stores/projectHubTasksStore';
import {
    canAddTask,
    getBlockedMessage,
} from '../utils/taskGuardrail';
import {
    isActiveForStep,
    startFinishMode,
} from '../stores/finishModeStore';
import { RotateCcw } from 'lucide-react';
import { getActiveProject } from '../stores/projectStore';

interface BlueprintPhase {
    id: string;
    label: string;
    color: string;
}

interface StepDetailPanelProps {
    selectedNode: WorkflowNode | null;
    onToggleDoDItem: (nodeId: string, dodItemId: string) => void;
    onMarkAsDone: (nodeId: string) => void;
    onReopenNode?: (nodeId: string) => void;
    blueprintPhases?: BlueprintPhase[];
}

export function StepDetailPanel({
    selectedNode,
    onToggleDoDItem,
    onMarkAsDone,
    onReopenNode,
    blueprintPhases
}: StepDetailPanelProps) {
    const { t } = useTranslation(['initiator', 'common']);
    // Use blueprint phases if provided, otherwise fallback to defaults
    const phasesToUse = blueprintPhases || WORKFLOW_PHASES;



    const { alert, AlertDialogComponent } = useAlertDialog();

    // --- Finish Mode State ---
    const navigate = useNavigate();
    const [selectedForFinish, setSelectedForFinish] = useState<Set<string>>(new Set());
    const [isFinishModeActive, setIsFinishModeActive] = useState(false);

    // Check if Finish Mode is active for this step
    useEffect(() => {
        if (selectedNode) {
            setIsFinishModeActive(isActiveForStep(selectedNode.id));
            setSelectedForFinish(new Set());
        }
    }, [selectedNode?.id]);

    const handleToggleFinishSelection = useCallback((dodItemId: string) => {
        setSelectedForFinish(prev => {
            const next = new Set(prev);
            if (next.has(dodItemId)) {
                next.delete(dodItemId);
            } else {
                // Max 3 actions for Finish Mode
                if (next.size < 3) {
                    next.add(dodItemId);
                }
            }
            return next;
        });
    }, []);

    const handleStartFinishMode = useCallback(() => {
        if (!selectedNode || selectedForFinish.size === 0) return;

        // Check universal task guardrail
        if (!canAddTask()) {
            alert({
                title: t('common:alerts.limitReached', 'Limit Reached'),
                message: getBlockedMessage(),
                type: 'warning'
            });
            return;
        }

        // Build actions from selected DoD items
        const actions = Array.from(selectedForFinish).map(id => {
            const item = selectedNode.dodChecklist.find(d => d.id === id);
            return { id: id as string, label: item?.label || 'Action' };
        });

        // Start Finish Mode session
        const session = startFinishMode({
            projectName: 'Current Project',
            stepId: selectedNode.id,
            stepTitle: selectedNode.title,
            actions,
        });

        if (session) {
            // Also add to Compass tasks (sync)
            actions.forEach(action => {
                const item = selectedNode.dodChecklist.find(d => d.id === action.id);
                if (item && !isDodItemAlreadySentToday(selectedNode.id, item.id)) {
                    addTaskToToday({
                        stepId: selectedNode.id,
                        stepTitle: selectedNode.title,
                        dodItemId: item.id,
                        dodItemLabel: item.label,
                        projectName: getActiveProject()?.name || 'Project',
                    });
                }
            });

            // Navigate to Compass
            navigate('/compass');
        }
    }, [selectedNode, selectedForFinish, navigate]);

    // Empty state
    if (!selectedNode) {
        return (
            <div className="w-80 xl:w-96 flex-shrink-0 flex items-center justify-center p-6">
                <div className="text-center max-w-xs">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-tokens-panel2 flex items-center justify-center">
                        <CheckCircle2 size={32} className="text-tokens-muted" />
                    </div>
                    <h3 className="text-sm font-medium text-tokens-muted mb-2">
                        {t('initiator:workflow.selectStep', 'Select a Step')}
                    </h3>
                    <p className="text-xs text-tokens-muted/70">
                        {t('initiator:workflow.selectStepDesc', 'Click a node on the canvas to view step details and checklist.')}
                    </p>
                </div>
            </div>
        );
    }

    // Find phase info
    const phaseInfo = phasesToUse.find(p => p.id === selectedNode.phase);
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
                    {selectedNode.titleKey ? t(selectedNode.titleKey, selectedNode.title) : selectedNode.title}
                </h2>

                {/* Status Badge */}
                <div className="flex items-center gap-2">
                    {selectedNode.status === 'done' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium
                                       bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                            <Check size={12} />
                            {t('common:status.completed', 'Done')}
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
                        {t('initiator:stepDetail.whyThisStep', 'Why This Step Exists')}
                    </h3>
                    <p className="text-sm text-tokens-fg leading-relaxed">
                        {selectedNode.descKey ? t(selectedNode.descKey, selectedNode.description) : selectedNode.description}
                    </p>
                </div>

                {/* Definition of Done */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-semibold text-tokens-muted uppercase tracking-wider">
                            {t('initiator:stepDetail.definitionOfDone', 'Definition of Done')}
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

                {/* S4-0: Action Hints Section (conditionally rendered) */}
                {selectedNode.actionHints && selectedNode.actionHints.length > 0 && (
                    <div>
                        <h3 className="text-xs font-semibold text-tokens-muted uppercase tracking-wider mb-3">
                            {t('initiator:stepDetail.actionHints', 'Action Hints')}
                        </h3>
                        <div className="space-y-2">
                            {selectedNode.actionHints.map((hint, index) => (
                                <div
                                    key={index}
                                    className="flex items-start gap-2 p-2 rounded-lg bg-tokens-panel2/50 border border-tokens-border/50"
                                >
                                    <span className="text-tokens-brand-DEFAULT text-xs font-semibold mt-0.5 min-w-[1rem]">
                                        {index + 1}.
                                    </span>
                                    <span className="text-sm text-tokens-fg flex-1 break-words">
                                        {hint}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}


                {/* Today's Focus Section (formerly Finish Mode) */}
                <div className="border-t border-tokens-border pt-6">
                    <div className="flex items-center gap-2 mb-3">
                        <Target size={16} className={allDoDDone ? 'text-emerald-500' : 'text-amber-500'} />
                        <h3 className={`text-xs font-semibold uppercase tracking-wider ${allDoDDone ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {allDoDDone ? t('initiator:stepDetail.stepCompleted', 'Step Completed') : t('initiator:stepDetail.todaysFocus', "Today's Focus")}
                        </h3>
                        {isFinishModeActive && !allDoDDone && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
                                Active
                            </span>
                        )}
                    </div>

                    {/* State 1: All DoD items completed - show success */}
                    {allDoDDone ? (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircle2 size={18} className="text-emerald-500" />
                                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                    {t('initiator:stepDetail.allTasksFinished', 'All tasks finished!')}
                                </span>
                            </div>
                            <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mb-3">
                                {t('initiator:stepDetail.allTasksFinishedDesc', 'You\'ve completed all {{count}} items in this step. Great work!', { count: totalCount })}
                            </p>
                            {onReopenNode && (
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    fullWidth
                                    onClick={() => onReopenNode(selectedNode.id)}
                                    icon={<RotateCcw size={14} />}
                                >
                                    {t('initiator:stepDetail.reopenStep', 'Reopen Step')}
                                </Button>
                            )}
                        </div>
                    ) : isFinishModeActive ? (
                        /* State 2: Focus session is active */
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-600 dark:text-amber-400">
                            {t('initiator:stepDetail.focusSessionActive', 'Focus session active. Go to Compass page to work on your tasks.')}
                        </div>
                    ) : (
                        /* State 3: Default - selection form */
                        <>
                            <p className="text-xs text-tokens-muted mb-3">
                                {t('initiator:stepDetail.selectFocusItems', 'Select 1-3 items to focus on. Opens in Compass for focused work session.')}
                            </p>

                            <div className="space-y-2 mb-4">
                                {selectedNode.dodChecklist.map((item) => {
                                    const isSelected = selectedForFinish.has(item.id);
                                    const isDisabled = !isSelected && selectedForFinish.size >= 3;

                                    return (
                                        <label
                                            key={`finish-${item.id}`}
                                            className={`flex items-center gap-3 p-2 rounded-lg border transition-all
                                                      ${isDisabled
                                                    ? 'opacity-50 cursor-not-allowed bg-tokens-panel border-tokens-border'
                                                    : isSelected
                                                        ? 'bg-amber-500/10 border-amber-500/50 cursor-pointer'
                                                        : 'bg-tokens-panel border-tokens-border hover:border-amber-500/30 cursor-pointer'}`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => !isDisabled && handleToggleFinishSelection(item.id)}
                                                disabled={isDisabled}
                                                className="rounded border-tokens-border bg-tokens-panel2
                                                         text-amber-500 focus:ring-amber-500/40"
                                            />
                                            <span className={`text-xs flex-1 ${isSelected ? 'text-amber-600 dark:text-amber-400' : 'text-tokens-fg'}`}>
                                                {item.label}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>

                            <Button
                                variant="primary"
                                size="sm"
                                fullWidth
                                onClick={handleStartFinishMode}
                                disabled={selectedForFinish.size === 0}
                                icon={<Target size={14} />}
                            >
                                {t('initiator:stepDetail.startFocusedWork', 'Start Focused Work →')} ({selectedForFinish.size}/3)
                            </Button>
                        </>
                    )}
                </div>

                {/* Recommended Tools */}
                {selectedNode.tools && selectedNode.tools.length > 0 && (
                    <div>
                        <h3 className="text-xs font-semibold text-tokens-muted uppercase tracking-wider mb-2">
                            {t('initiator:stepDetail.recommendedTools', 'Recommended Tools')}
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
            <div className="p-6 border-t border-tokens-border flex-shrink-0 space-y-2">
                {selectedNode.status === 'done' ? (
                    <>
                        <Button
                            variant="secondary"
                            size="lg"
                            fullWidth
                            onClick={() => onReopenNode?.(selectedNode.id)}
                            icon={<RotateCcw size={16} />}
                        >
                            {t('initiator:stepDetail.reopenStep', 'Reopen Step')}
                        </Button>
                        <p className="text-xs text-tokens-muted text-center">
                            {t('initiator:stepDetail.stepCompletedUndo', 'This step is completed. Click to undo.')}
                        </p>
                    </>
                ) : (
                    <>
                        <Button
                            variant="primary"
                            size="lg"
                            fullWidth
                            onClick={() => onMarkAsDone(selectedNode.id)}
                            icon={allDoDDone ? <Check size={16} /> : undefined}
                        >
                            {t('initiator:stepDetail.markAsDone', 'Mark as Done')}
                        </Button>
                        {allDoDDone && (
                            <p className="text-xs text-tokens-brand-DEFAULT text-center">
                                {t('initiator:stepDetail.allChecklistComplete', 'All checklist items are complete!')}
                            </p>
                        )}
                    </>
                )}
            </div>
            <AlertDialogComponent />
        </div>
    );
}
