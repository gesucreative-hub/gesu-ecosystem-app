// Distraction Modal - Shown when user tries to navigate during active focus session
import { Button } from '../Button';
import { AlertCircle } from 'lucide-react';

interface DistractionModalProps {
    onPause: () => void;
    onEnd: () => void;
    onContinue: () => void;
}

export function DistractionModal({ onPause, onEnd, onContinue }: DistractionModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-tokens-bg border border-tokens-border rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 animate-in fade-in slide-in-from-bottom-4 duration-200">

                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-amber-500/10 rounded-lg">
                        <AlertCircle size={24} className="text-amber-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-tokens-fg">Focus session active</h2>
                        <p className="text-sm text-tokens-muted">What would you like to do?</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                    <Button
                        variant="secondary"
                        onClick={onPause}
                        fullWidth
                        className="justify-center"
                    >
                        Pause timer & continue
                    </Button>

                    <Button
                        variant="secondary"
                        onClick={onEnd}
                        fullWidth
                        className="justify-center text-red-500 hover:text-red-600"
                    >
                        End session & continue
                    </Button>

                    <Button
                        variant="primary"
                        onClick={onContinue}
                        fullWidth
                        className="justify-center"
                        autoFocus
                    >
                        Continue (keep timer running)
                    </Button>
                </div>

                {/* Hint */}
                <p className="text-xs text-tokens-muted mt-4 text-center">
                    Press ESC or click Continue to proceed without changes
                </p>
            </div>
        </div>
    );
}
