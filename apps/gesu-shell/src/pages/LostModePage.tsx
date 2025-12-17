import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/PageContainer';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Textarea } from '../components/Textarea';
import { Badge } from '../components/Badge';
import { CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import {
    addTaskToToday,
    canAddMoreTasksToday,
    getRemainingSlots
} from '../stores/projectHubTasksStore';

const PROMPTS = [
    {
        id: 'avoiding',
        question: 'What are you avoiding?',
        placeholder: 'The task, emotion, or situation you\'re steering away from...'
    },
    {
        id: 'smallest_step',
        question: 'Smallest step (2 minutes)?',
        placeholder: 'The tiniest action you could take right now...'
    },
    {
        id: 'next_action',
        question: 'Next action after this?',
        placeholder: 'What comes after you complete that tiny step...'
    }
];

export function LostModePage() {
    const navigate = useNavigate();
    const [answers, setAnswers] = useState<Record<string, string>>({
        avoiding: '',
        smallest_step: '',
        next_action: ''
    });
    const [taskCreated, setTaskCreated] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const canCreateTask = canAddMoreTasksToday();
    const remainingSlots = getRemainingSlots();
    const isFormComplete = answers.next_action.trim().length > 0;

    const handleAnswerChange = (id: string, value: string) => {
        setAnswers(prev => ({ ...prev, [id]: value }));
        setErrorMessage(null);
    };

    const handleConvertToTask = () => {
        const taskTitle = answers.next_action.trim();

        if (!taskTitle) {
            setErrorMessage('Please answer the "Next action" prompt first.');
            return;
        }

        if (!canCreateTask) {
            setErrorMessage(`You've reached the daily limit (3 active tasks). Complete existing tasks first.`);
            return;
        }

        const task = addTaskToToday({
            stepId: 'lost-mode',
            stepTitle: 'Lost Mode',
            dodItemId: `lm-${Date.now()}`,
            dodItemLabel: taskTitle,
            projectName: 'Refocus'
        });

        if (task) {
            setTaskCreated(true);
            setErrorMessage(null);
            // Navigate to Compass after brief delay
            setTimeout(() => navigate('/compass'), 1500);
        } else {
            setErrorMessage('Failed to create task. Please try again.');
        }
    };

    return (
        <PageContainer>
            {/* Header */}
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h1 className="text-3xl font-bold text-tokens-fg tracking-tight">Lost Mode</h1>
                    <p className="text-tokens-muted text-sm mt-1">
                        3 quick prompts to find your next step.
                    </p>
                </div>
                <Link to="/refocus" className="px-4 py-2 bg-tokens-panel border border-tokens-border hover:bg-tokens-panel2 text-tokens-fg rounded-lg text-sm transition-colors">
                    ← Back to Refocus
                </Link>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">

                {/* LEFT COLUMN - Prompts */}
                <div className="flex-1 flex flex-col gap-6">

                    {PROMPTS.map((prompt, index) => (
                        <Card
                            key={prompt.id}
                            title={
                                <div className="flex items-center gap-3">
                                    <Badge variant="neutral">{index + 1}</Badge>
                                    <span>{prompt.question}</span>
                                </div>
                            }
                        >
                            <Textarea
                                id={prompt.id}
                                label=""
                                value={answers[prompt.id]}
                                onChange={(e) => handleAnswerChange(prompt.id, e.target.value)}
                                rows={4}
                                placeholder={prompt.placeholder}
                                className="resize-none"
                            />
                        </Card>
                    ))}

                </div>

                {/* RIGHT COLUMN - Actions */}
                <div className="lg:w-80 xl:w-96 flex flex-col gap-4">

                    {/* Task Creation Card */}
                    <Card
                        title={
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
                                Create Next Action
                            </div>
                        }
                        className="sticky top-24"
                    >
                        <div className="space-y-4">

                            {/* Guardrail Status */}
                            <div className="p-3 bg-tokens-panel2 rounded-lg border border-tokens-border">
                                <div className="flex items-center gap-2 text-sm">
                                    {canCreateTask ? (
                                        <>
                                            <CheckCircle2 size={16} className="text-emerald-500" />
                                            <span className="text-tokens-fg">
                                                {remainingSlots} {remainingSlots === 1 ? 'slot' : 'slots'} remaining today
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircle size={16} className="text-amber-500" />
                                            <span className="text-tokens-fg">
                                                Daily limit reached (3/3)
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Success/Error Messages */}
                            {taskCreated && (
                                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg animate-in fade-in slide-in-from-bottom-2">
                                    <div className="flex items-center gap-2 text-sm text-emerald-500">
                                        <CheckCircle2 size={16} />
                                        <span>Task created! Navigating to Compass...</span>
                                    </div>
                                </div>
                            )}

                            {errorMessage && (
                                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg animate-in fade-in slide-in-from-bottom-2">
                                    <div className="flex items-start gap-2 text-sm text-red-500">
                                        <AlertCircle size={16} className="mt-0.5" />
                                        <span>{errorMessage}</span>
                                    </div>
                                </div>
                            )}

                            {/* Instructions */}
                            <p className="text-xs text-tokens-muted leading-relaxed">
                                Answer the prompts above, especially "Next action after this".
                                We'll convert it into a task in your Compass.
                            </p>

                            {/* Convert to Task Button */}
                            <Button
                                variant="primary"
                                onClick={handleConvertToTask}
                                disabled={!isFormComplete || !canCreateTask || taskCreated}
                                icon={<ArrowRight size={16} />}
                                fullWidth
                                className="justify-center"
                            >
                                {taskCreated ? 'Task Created!' : 'Convert to Task'}
                            </Button>

                            {/* Secondary Actions */}
                            {!canCreateTask && (
                                <Button
                                    variant="secondary"
                                    onClick={() => navigate('/compass')}
                                    fullWidth
                                    className="justify-center"
                                >
                                    Open Compass
                                </Button>
                            )}

                        </div>
                    </Card>

                </div>
            </div>
        </PageContainer>
    );
}
