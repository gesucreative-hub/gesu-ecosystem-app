// Login Button - Navigates to login page or shows compact sign-in
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogIn } from 'lucide-react';

export function LoginButton() {
    const navigate = useNavigate();
    const { t } = useTranslation('common');

    return (
        <button
            onClick={() => navigate('/login')}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-tokens-brand-DEFAULT/10 hover:bg-tokens-brand-DEFAULT/20 border border-tokens-brand-DEFAULT/30 rounded-xl transition-all group"
        >
            <LogIn size={18} className="text-tokens-brand-DEFAULT" />
            <span className="text-sm font-medium text-tokens-brand-DEFAULT group-hover:text-tokens-brand-light">
                {t('auth.signIn')}
            </span>
        </button>
    );
}
