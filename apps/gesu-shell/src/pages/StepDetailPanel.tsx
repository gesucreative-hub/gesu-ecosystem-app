import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, CheckCircle2, Send, Compass, Target } from 'lucide-react';
import { WorkflowNode, WORKFLOW_PHASES } from './workflowData';
import { Button } from '../components/Button';
import {
    isDodItemAlreadySentToday,
    getRemainingSlots,
    addTaskToToday,
    canAddMoreTasksToday,
} from '../stores/projectHubTasksStore';
import {
    isActiveForStep,
    startFinishMode,
} from '../stores/finishModeStore';

interface StepDetailPanelProps {
    selectedNode: WorkflowNode | null;
    onToggleDoDItem: (nodeId: string, dodItemId: string) => void;
    onMarkAsDone: (nodeId: string) => void;
}

export function StepDetailPanel({
    selectedNode,
    onToggleDoDItem,
    onMarkAsDone
}: StepDetailPanelProps) {
    // State for Compass send selection
    const [selectedForCompass, setSelectedForCompass] = useState<Set<string>>(new Set());
    const [sentItems, setSentItems] = useState<Set<string>>(new Set());
    const [remainingSlots, setRemainingSlots] = useState(3);

    // Refresh sent status when node changes
    useEffect(() => {
        if (selectedNode) {
            const sent = new Set<string>();
            selectedNode.dodChecklist.forEach(item => {
                if (isDodItemAlreadySentToday(selectedNode.id, item.id)) {
                    sent.add(item.id);
                }
            });
            setSentItems(sent);
            setSelectedForCompass(new Set());
            setRemainingSlots(getRemainingSlots());
        }
    }, [selectedNode?.id]);

    const handleToggleCompassSelection = useCallback((dodItemId: string) => {
        setSelectedForCompass(prev => {
            const next = new Set(prev);
            if (next.has(dodItemId)) {
                next.delete(dodItemId);
            } else {
                // Limit to remaining slots or 3 max per send
                const maxAllowed = Math.min(remainingSlots, 3);
                if (next.size < maxAllowed) {
                    next.add(dodItemId);
                }
            }
            return next;
        });
    }, [remainingSlots]);

    const handleSendToCompass = useCallback(() => {
        if (!selectedNode || selectedForCompass.size === 0) return;

        selectedForCompass.forEach(dodItemId => {
            const item = selectedNode.dodChecklist.find(d => d.id === dodItemId);
            if (item) {
                addTaskToToday({
                    stepId: selectedNode.id,
                    stepTitle: selectedNode.title,
                    dodItemId: item.id,
                    dodItemLabel: item.label,
                    projectName: 'Current Project',
                });
            }
        });

        // Update UI
        setSentItems(prev => {
            const next = new Set(prev);
            selectedForCompass.forEach(id => next.add(id));
            return next;
        });
        setSelectedForCompass(new Set());
        setRemainingSlots(getRemainingSlots());
    }, [selectedNode, selectedForCompass]);

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

        // Check WIP limit
        if (!canAddMoreTasksToday()) {
            alert('Batas 3 task Project Hub untuk hari ini tercapai. Selesaikan dulu sebelum memulai Finish Mode.');
            return;
        }

        // Build actions from selected DoD items
        const actions = Array.from(selectedForFinish).map(id => {
            const item = selectedNode.dodChecklist.find(d => d.id === id);
            return { id, label: item?.label || 'Action' };
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
                        projectName: 'Current Project',
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
    const canSend = canAddMoreTasksToday() && selectedForCompass.size > 0;
    const limitReached = remainingSlots === 0;

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

                {/* Compass - Hari Ini Section */}
                <div className="border-t border-tokens-border pt-6">
                    <div className="flex items-center gap-2 mb-3">
                        <Compass size={16} className="text-tokens-brand-DEFAULT" />
                        <h3 className="text-xs font-semibold text-tokens-brand-DEFAULT uppercase tracking-wider">
                            Compass - Hari Ini
                        </h3>
                    </div>

                    {limitReached ? (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-600 dark:text-amber-400">
                            Batas 3 task Project Hub untuk hari ini tercapai. Selesaikan dulu sebelum menambah.
                        </div>
                    ) : (
                        <>
                            <p className="text-xs text-tokens-muted mb-3">
                                Pilih 1-{remainingSlots} item DoD untuk dikirim sebagai task hari ini.
                            </p>

                            <div className="space-y-2 mb-4">
                                {selectedNode.dodChecklist.map((item) => {
                                    const isSent = sentItems.has(item.id);
                                    const isSelected = selectedForCompass.has(item.id);

                                    return (
                                        <label
                                            key={`compass-${item.id}`}
                                            className={`flex items-center gap-3 p-2 rounded-lg border transition-all cursor-pointer
                                                      ${isSent
                                                    ? 'bg-emerald-500/10 border-emerald-500/30 cursor-default'
                                                    : isSelected
                                                        ? 'bg-tokens-brand-DEFAULT/10 border-tokens-brand-DEFAULT/50'
                                                        : 'bg-tokens-panel border-tokens-border hover:border-tokens-brand-DEFAULT/30'}`}
                                        >
                                            {isSent ? (
                                                <Check size={14} className="text-emerald-500" />
                                            ) : (
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleToggleCompassSelection(item.id)}
                                                    disabled={isSent}
                                                    className="rounded border-tokens-border bg-tokens-panel2
                                                             text-tokens-brand-DEFAULT focus:ring-tokens-brand-DEFAULT/40"
                                                />
                                            )}
                                            <span className={`text-xs flex-1 ${isSent ? 'text-emerald-600 dark:text-emerald-400' : 'text-tokens-fg'}`}>
                                                {item.label}
                                            </span>
                                            {isSent && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                                                    Terkirim
                                                </span>
                                            )}
                                        </label>
                                    );
                                })}
                            </div>

                            <Button
                                variant="secondary"
                                size="sm"
                                fullWidth
                                onClick={handleSendToCompass}
                                disabled={!canSend}
                                icon={<Send size={14} />}
                            >
                                Kirim ke Compass ({selectedForCompass.size})
                            </Button>
                        </>
                    )}
                </div>

                {/* Finish Mode Section */}
                <div className="border-t border-tokens-border pt-6">
                    <div className="flex items-center gap-2 mb-3">
                        <Target size={16} className="text-amber-500" />
                        <h3 className="text-xs font-semibold text-amber-500 uppercase tracking-wider">
                            Finish Mode
                        </h3>
                        {isFinishModeActive && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
                                Active
                            </span>
                        )}
                    </div>

                    {isFinishModeActive ? (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-600 dark:text-amber-400">
                            Finish Mode aktif untuk step ini. Buka Compass untuk melanjutkan.
                        </div>
                    ) : (
                        <>
                            <p className="text-xs text-tokens-muted mb-3">
                                Pilih 1-3 aksi untuk fokus (max 3). Selesaikan sebelum menambah task baru.
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
                                className="!bg-amber-500 hover:!bg-amber-600"
                            >
                                Mulai Finish Mode ({selectedForFinish.size}/3)
                            </Button>
                        </>
                    )}
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
                        Semua checklist sudah selesai!
                    </p>
                )}
            </div>
        </div>
    );
}
