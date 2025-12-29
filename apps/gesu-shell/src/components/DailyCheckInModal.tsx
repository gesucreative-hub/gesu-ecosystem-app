/**
 * Daily Check-in Modal
 * 3-step form: Energy (1-5), Why (text), Top Focus (project/task/text)
 * S1-2a: <60s completion flow
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { saveCheckIn } from '../stores/dailyCheckInStore';
import { loadState as getProjectState } from '../stores/projectStore';
import { getTodayTasks } from '../stores/projectHubTasksStore';

interface DailyCheckInModalProps {
    onClose: () => void;
}

export function DailyCheckInModal({ onClose }: DailyCheckInModalProps) {
    const { t } = useTranslation('common');
    const [step, setStep] = useState(1);
    const [energy, setEnergy] = useState(3); // Default to mid-point
    const [why, setWhy] = useState('');
    const [topFocusType, setTopFocusType] = useState<'project' | 'task' | 'text'>('project');
    const [topFocusRefId, setTopFocusRefId] = useState<string>('');
    const [topFocusText, setTopFocusText] = useState('');
    const [showTextInput, setShowTextInput] = useState(false);

    // Load projects and tasks
    const projects = getProjectState().projects.filter(p => !p.archived).slice(0, 5);
    const tasks = getTodayTasks().filter(t => !t.done).slice(0, 5);

    // Auto-select first item if exists
    useEffect(() => {
        if (projects.length > 0 && !topFocusRefId && !showTextInput) {
            setTopFocusType('project');
            setTopFocusRefId(projects[0].id);
        } else if (tasks.length > 0 && projects.length === 0 && !topFocusRefId && !showTextInput) {
            setTopFocusType('task');
            setTopFocusRefId(tasks[0].id);
        }
    }, [projects, tasks, topFocusRefId, showTextInput]);

    const handleSave = () => {
        const today = new Date();
        const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        saveCheckIn({
            date,
            energy,
            why,
            topFocusType: showTextInput ? 'text' : topFocusType,
            topFocusRefId: showTextInput ? undefined : topFocusRefId,
            topFocusText: showTextInput ? topFocusText : undefined,
            isComplete: true // S3-0a: Mark full check-in as complete
        });

        onClose();
    };

    const canProceed = () => {
        if (step === 3) {
            return showTextInput ? topFocusText.trim().length > 0 : topFocusRefId.length > 0;
        }
        return true;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-tokens-bg border border-tokens-border rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-tokens-fg">
                        {t('dailyCheckIn.title', 'Quick check-in')}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-tokens-panel transition-colors"
                        aria-label="Close"
                    >
                        <X size={20} className="text-tokens-muted" />
                    </button>
                </div>

                {/* Progress */}
                <div className="flex gap-2 mb-6">
                    {[1, 2, 3].map(s => (
                        <div
                            key={s}
                            className={`h-1 flex-1 rounded-full transition-colors ${
                                s <= step ? 'bg-brand' : 'bg-tokens-panel'
                            }`}
                        />
                    ))}
                </div>

                {/* Step 1: Energy */}
                {step === 1 && (
                    <div className="space-y-4">
                        <p className="text-sm text-tokens-muted">
                            {t('dailyCheckIn.energyPrompt', "How's your energy today?")}
                        </p>
                        <div className="flex items-center justify-between gap-2">
                            {[1, 2, 3, 4, 5].map(level => (
                                <button
                                    key={level}
                                    onClick={() => setEnergy(level)}
                                    className={`w-12 h-12 rounded-lg border-2 transition-all ${
                                        energy === level
                                            ? 'border-brand bg-brand/10 scale-110'
                                            : 'border-tokens-border hover:border-brand/50'
                                    }`}
                                >
                                    <span className="text-lg font-semibold">{level}</span>
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-between text-xs text-tokens-muted">
                            <span>{t('dailyCheckIn.low', 'Low')}</span>
                            <span>{t('dailyCheckIn.high', 'High')}</span>
                        </div>
                    </div>
                )}

                {/* Step 2: Why */}
                {step === 2 && (
                    <div className="space-y-4">
                        <p className="text-sm text-tokens-muted">
                            {t('dailyCheckIn.whyPrompt', "What's driving your focus today?")}
                        </p>
                        <Textarea
                            value={why}
                            onChange={(e) => setWhy(e.target.value)}
                            placeholder={t('dailyCheckIn.whyPlaceholder', 'Example: "Client deadline" or "Learning new skill"')}
                            rows={3}
                            autoFocus
                        />
                        <p className="text-xs text-tokens-muted">
                            {t('dailyCheckIn.whyHint', 'Optional but encouraged')}
                        </p>
                    </div>
                )}

                {/* Step 3: Top Focus */}
                {step === 3 && (
                    <div className="space-y-4">
                        <p className="text-sm text-tokens-muted">
                            {t('dailyCheckIn.focusPrompt', "What's your #1 focus?")}
                        </p>

                        {!showTextInput && (
                            <div className="space-y-2">
                                {/* Projects */}
                                {projects.length > 0 && (
                                    <div>
                                        <p className="text-xs font-medium text-tokens-muted mb-2">
                                            {t('dailyCheckIn.projects', 'Active Projects')}
                                        </p>
                                        {projects.map((proj: { id: string; name: string }) => (
                                            <label
                                                key={proj.id}
                                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-tokens-panel cursor-pointer transition-colors"
                                            >
                                                <input
                                                    type="radio"
                                                    name="topFocus"
                                                    checked={topFocusType === 'project' && topFocusRefId === proj.id}
                                                    onChange={() => {
                                                        setTopFocusType('project');
                                                        setTopFocusRefId(proj.id);
                                                    }}
                                                    className="text-brand"
                                                />
                                                <span className="text-sm text-tokens-fg">{proj.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}

                                {/* Tasks */}
                                {tasks.length > 0 && (
                                    <div>
                                        <p className="text-xs font-medium text-tokens-muted mb-2">
                                            {t('dailyCheckIn.tasks', "Today's Tasks")}
                                        </p>
                                        {tasks.map(task => (
                                            <label
                                                key={task.id}
                                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-tokens-panel cursor-pointer transition-colors"
                                            >
                                                <input
                                                    type="radio"
                                                    name="topFocus"
                                                    checked={topFocusType === 'task' && topFocusRefId === task.id}
                                                    onChange={() => {
                                                        setTopFocusType('task');
                                                        setTopFocusRefId(task.id);
                                                    }}
                                                    className="text-brand"
                                                />
                                                <span className="text-sm text-tokens-fg">{task.title}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}

                                {/* Other / Quick text */}
                                <button
                                    onClick={() => setShowTextInput(true)}
                                    className="w-full p-3 rounded-lg border border-dashed border-tokens-border hover:border-brand hover:bg-brand/5 transition-colors text-sm text-tokens-muted"
                                >
                                    {t('dailyCheckIn.other', 'Other / Quick text...')}
                                </button>
                            </div>
                        )}

                        {showTextInput && (
                            <div className="space-y-3">
                                <Input
                                    value={topFocusText}
                                    onChange={(e) => setTopFocusText(e.target.value)}
                                    placeholder={t('dailyCheckIn.textPlaceholder', 'Type your focus...')}
                                    autoFocus
                                />
                                <button
                                    onClick={() => {
                                        setShowTextInput(false);
                                        setTopFocusText('');
                                    }}
                                    className="text-xs text-brand hover:underline"
                                >
                                    {t('dailyCheckIn.back', 'Back to list')}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-between mt-6">
                    <Button
                        variant="secondary"
                        onClick={() => step > 1 ? setStep(step - 1) : onClose()}
                    >
                        {step > 1 ? (
                            <>
                                <ChevronLeft size={16} />
                                <span>{t('common:actions.back', 'Back')}</span>
                            </>
                        ) : (
                            <span>{t('common:actions.cancel', 'Cancel')}</span>
                        )}
                    </Button>

                    <Button
                        variant="primary"
                        onClick={() => step < 3 ? setStep(step + 1) : handleSave()}
                        disabled={!canProceed()}
                    >
                        {step < 3 ? (
                            <>
                                <span>{t('common:actions.continue', 'Continue')}</span>
                                <ChevronRight size={16} />
                            </>
                        ) : (
                            <span>{t('common:actions.save', 'Save')}</span>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
