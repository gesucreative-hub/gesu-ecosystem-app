// User Menu - Shows user avatar and sign-out option
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LogOut, User, Settings, HelpCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { ConfirmModal } from '../ConfirmModal';

interface UserMenuProps {
    isCollapsed?: boolean;
}

export function UserMenu({ isCollapsed = false }: UserMenuProps) {
    const { t } = useTranslation('common');
    const { user, signOut } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
    const [signingOut, setSigningOut] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleSignOut = async () => {
        setSigningOut(true);
        await signOut();
        setIsOpen(false);
        setShowSignOutConfirm(false);
        setSigningOut(false);
    };

    if (!user) return null;

    return (
        <>
            <div ref={menuRef} className="relative">
                {/* Avatar Button */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 p-2 rounded-xl hover:bg-tokens-panel2 transition-colors w-full"
                    title={user.displayName || user.email || 'User'}
                >
                    {user.photoURL ? (
                        <img
                            src={user.photoURL}
                            alt={user.displayName || 'User'}
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-tokens-brand-DEFAULT/20 flex items-center justify-center flex-shrink-0">
                            <User size={16} className="text-tokens-brand-DEFAULT" />
                        </div>
                    )}
                    {!isCollapsed && (
                        <div className="flex-1 text-left min-w-0">
                            <p className="text-xs font-medium text-tokens-fg truncate">{user.displayName || 'User'}</p>
                            <p className="text-[10px] text-tokens-muted truncate">{user.email}</p>
                        </div>
                    )}
                </button>

                {/* Dropdown Menu - Opens upwards */}
                {isOpen && (
                    <div className="absolute bottom-full left-0 mb-2 w-full bg-tokens-panel border border-tokens-border rounded-xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                        {/* Settings */}
                        <Link
                            to="/settings"
                            onClick={() => setIsOpen(false)}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-tokens-fg hover:bg-tokens-panel2 transition-colors"
                        >
                            <Settings size={16} />
                            {t('nav.settings')}
                        </Link>

                        {/* Help */}
                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-tokens-fg hover:bg-tokens-panel2 transition-colors text-left"
                        >
                            <HelpCircle size={16} />
                            {t('auth.helpSupport', 'Help & Support')}
                        </button>

                        <div className="h-px bg-tokens-border my-1"></div>

                        {/* Sign Out Button - Opens Modal */}
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                setShowSignOutConfirm(true);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                        >
                            <LogOut size={16} />
                            {t('auth.signOut')}
                        </button>
                    </div>
                )}
            </div>

            {/* Centered Sign Out Confirmation Modal */}
            <ConfirmModal
                isOpen={showSignOutConfirm}
                onClose={() => setShowSignOutConfirm(false)}
                onConfirm={handleSignOut}
                title={t('auth.signOutConfirmTitle')}
                message={t('auth.signOutConfirmMessage')}
                confirmLabel={t('auth.signOut')}
                cancelLabel={t('buttons.cancel')}
                variant="danger"
                loading={signingOut}
            />
        </>
    );
}
