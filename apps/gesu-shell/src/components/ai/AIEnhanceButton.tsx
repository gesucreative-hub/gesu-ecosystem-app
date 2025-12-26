// AI Enhance Button - Triggers AI suggestions flow
// Sprint 24: Local-first AI suggestion layer

import { Sparkles, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../Button';

interface AIEnhanceButtonProps {
    onClick: () => void;
    isLoading?: boolean;
    isAvailable?: boolean;
    size?: 'sm' | 'md';
}

export function AIEnhanceButton({
    onClick,
    isLoading = false,
    isAvailable = true,
    size = 'sm',
}: AIEnhanceButtonProps) {
    const { t } = useTranslation(['initiator']);

    if (!isAvailable) {
        return (
            <div className="flex items-center gap-2 text-xs text-tokens-muted">
                <Sparkles size={14} className="opacity-50" />
                <span>{t('initiator:ai.notAvailable', 'AI not available')}</span>
            </div>
        );
    }

    return (
        <Button
            onClick={onClick}
            variant="secondary"
            size={size}
            disabled={isLoading}
            icon={isLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            iconPosition="left"
            title={t('initiator:ai.enhanceTooltip', 'Get AI suggestions for this blueprint')}
        >
            {isLoading
                ? t('initiator:ai.enhancing', 'Enhancing...')
                : t('initiator:ai.enhanceButton', 'Enhance with AI')}
        </Button>
    );
}
