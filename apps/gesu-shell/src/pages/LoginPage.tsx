// Login Page - Premium login experience with animations
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import gesuLogo from '../assets/icons/gcl-logo.ico';

// Check if user has logged in before
function hasLoggedInBefore(): boolean {
    return localStorage.getItem('gesu.hasLoggedIn') === 'true';
}

function markAsLoggedIn(): void {
    localStorage.setItem('gesu.hasLoggedIn', 'true');
}

export function LoginPage() {
    const { t } = useTranslation(['login', 'common']);
    const { signIn } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showGuestWarning, setShowGuestWarning] = useState(false);
    const [isReturningUser] = useState(() => hasLoggedInBefore());

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        setError(null);

        try {
            await signIn();
            markAsLoggedIn();
            navigate('/');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to sign in');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGuestMode = () => {
        if (!showGuestWarning) {
            setShowGuestWarning(true);
            return;
        }
        // Proceed as guest
        navigate('/');
    };

    // Message based on user type
    const welcomeTitle = isReturningUser 
        ? t('login:welcomeBack.title', 'Welcome back!')
        : t('login:welcome.title', 'Welcome to Gesu Ecosystem');
    const welcomeSubtitle = isReturningUser 
        ? t('login:welcomeBack.subtitle', 'Ready to pick up where you left off?')
        : t('login:welcome.subtitle', 'Your productivity journey starts here. Powered by Gesu Creative Lab.');

    return (
        <div className="min-h-screen flex bg-tokens-bg">
            {/* Left Panel - Branding with theme-aware gradient */}
            <motion.div 
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-between relative overflow-hidden"
                style={{
                    background: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-hover) 50%, var(--brand) 100%)'
                }}
            >
                {/* Background Pattern - Ambient Animated Blobs */}
                <div className="absolute inset-0 overflow-hidden">
                    <motion.div 
                        animate={{ 
                            scale: [1, 1.2, 1], 
                            x: [0, 30, 0],
                            y: [0, -20, 0],
                            opacity: [0.3, 0.5, 0.3] 
                        }}
                        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-white/20 blur-3xl"
                    />
                    <motion.div 
                        animate={{ 
                            scale: [1, 1.3, 1], 
                            x: [0, -40, 0],
                            y: [0, 30, 0],
                            opacity: [0.2, 0.4, 0.2] 
                        }}
                        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                        className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-white/15 blur-3xl"
                    />
                    <motion.div 
                        animate={{ 
                            scale: [1, 1.1, 1],
                            rotate: [0, 180, 360],
                            opacity: [0.1, 0.2, 0.1] 
                        }}
                        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                        className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-white/10 blur-2xl"
                    />
                    {/* Floating sparkles */}
                    <motion.div
                        animate={{ y: [0, -100], opacity: [0, 1, 0] }}
                        transition={{ duration: 4, repeat: Infinity, delay: 0 }}
                        className="absolute bottom-0 left-1/4 w-2 h-2 rounded-full bg-white/60"
                    />
                    <motion.div
                        animate={{ y: [0, -120], opacity: [0, 1, 0] }}
                        transition={{ duration: 5, repeat: Infinity, delay: 1.5 }}
                        className="absolute bottom-0 left-1/2 w-1.5 h-1.5 rounded-full bg-white/40"
                    />
                    <motion.div
                        animate={{ y: [0, -80], opacity: [0, 1, 0] }}
                        transition={{ duration: 3.5, repeat: Infinity, delay: 2.5 }}
                        className="absolute bottom-0 right-1/3 w-2 h-2 rounded-full bg-white/50"
                    />
                </div>

                {/* Logo */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center gap-3 relative z-10"
                >
                    <img src={gesuLogo} alt="Gesu" className="w-10 h-10" />
                    <div>
                        <h1 className="text-xl font-bold text-white">Gesu</h1>
                        <span className="text-xs text-white/70 uppercase tracking-widest">Ecosystem</span>
                    </div>
                </motion.div>

                {/* Tagline */}
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="relative z-10"
                >
                    <h2 className="text-4xl font-bold text-white leading-tight mb-4">
                        {t('login:tagline.line1', 'Level up your')}<br />{t('login:tagline.line2', 'productivity')}
                    </h2>
                    <p className="text-lg text-white/80 mb-6">
                        {t('login:tagline.description', 'Track progress with XP & levels. Customize your focus pet. Compete on the leaderboard.')}
                    </p>
                    {/* Feature pills */}
                    <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-white/20 rounded-full text-white/90 text-xs">🏆 {t('login:features.xpLevels', 'XP & Levels')}</span>
                        <span className="px-3 py-1 bg-white/20 rounded-full text-white/90 text-xs">🐣 {t('login:features.focusPet', 'Focus Pet')}</span>
                        <span className="px-3 py-1 bg-white/20 rounded-full text-white/90 text-xs">🎨 {t('modals:cosmetics.title')}</span>
                        <span className="px-3 py-1 bg-white/20 rounded-full text-white/90 text-xs">📊 {t('modals:leaderboard.title')}</span>
                    </div>
                </motion.div>

                {/* Feature Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 relative z-10"
                >
                    <p className="text-white/90 text-sm italic mb-4">
                        "{t('login:testimonial.quote', 'Gesu helps me stay focused and deliver projects on time. The workflow canvas is a game-changer!')}"
                    </p>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
                            SU
                        </div>
                        <div>
                            <p className="text-white font-medium text-sm">Surya</p>
                            <p className="text-white/60 text-xs">{t('login:testimonial.role', 'Creative Professional')}</p>
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            {/* Right Panel - Login Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-tokens-bg">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="w-full max-w-md"
                >
                    {/* Mobile Logo */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="lg:hidden flex items-center justify-center gap-3 mb-8"
                    >
                        <img src={gesuLogo} alt="Gesu" className="w-12 h-12" />
                        <div>
                            <h1 className="text-2xl font-bold text-tokens-fg">Gesu</h1>
                            <span className="text-xs text-tokens-muted uppercase tracking-widest">Ecosystem</span>
                        </div>
                    </motion.div>

                    {/* Welcome Text */}
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-center mb-8"
                    >
                        <h2 className="text-2xl font-bold text-tokens-fg mb-2">{welcomeTitle}</h2>
                        <p className="text-tokens-muted text-sm">{welcomeSubtitle}</p>
                    </motion.div>

                    {/* Error Message */}
                    <AnimatePresence>
                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm text-center"
                            >
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Google Sign-In Button */}
                    <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleGoogleSignIn}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white dark:bg-[#1a1a1a] border-2 border-tokens-border rounded-xl hover:border-tokens-brand-DEFAULT/50 hover:shadow-lg hover:shadow-tokens-brand-DEFAULT/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-tokens-muted border-t-tokens-brand-DEFAULT rounded-full animate-spin" />
                        ) : (
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                        )}
                        <span className="font-medium text-tokens-fg group-hover:text-tokens-brand-DEFAULT transition-colors">
                            {isReturningUser ? t('common:auth.signInWithGoogle') : t('login:googleSignIn')}
                        </span>
                    </motion.button>

                    {/* Divider */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="flex items-center gap-4 my-6"
                    >
                        <div className="flex-1 h-px bg-tokens-border"></div>
                        <span className="text-xs text-tokens-muted">{t('login:or', 'or')}</span>
                        <div className="flex-1 h-px bg-tokens-border"></div>
                    </motion.div>

                    {/* Guest Mode with Warning */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                    >
                        <AnimatePresence>
                            {showGuestWarning && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mb-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2"
                                >
                                    <AlertTriangle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                                    <p className="text-xs text-amber-600 dark:text-amber-400">
                                        <strong>{t('login:guest.warning', 'Guest mode')}:</strong> {t('login:guest.warningMessage', "Your progress, XP, and achievements won't be saved across sessions.")}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        
                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={handleGuestMode}
                            className="w-full px-6 py-3 border border-tokens-border rounded-xl text-tokens-muted hover:text-tokens-fg hover:bg-tokens-panel transition-colors text-sm"
                        >
                            {showGuestWarning ? t('login:guest.continueAnyway', 'Continue anyway as Guest') : t('login:guest.continue', 'Continue without signing in')}
                        </motion.button>
                    </motion.div>

                    {/* Terms */}
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="mt-8 text-center text-xs text-tokens-muted"
                    >
                        {t('login:terms.prefix', 'By signing in, you agree to our')}{' '}
                        <a href="#" className="text-tokens-brand-DEFAULT hover:underline">{t('login:footer.terms')}</a>
                        {' '}{t('login:terms.and', 'and')}{' '}
                        <a href="#" className="text-tokens-brand-DEFAULT hover:underline">{t('login:footer.privacy')}</a>
                    </motion.p>

                    {/* Powered By */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.9 }}
                        className="mt-6 text-center text-[10px] text-tokens-muted/60 uppercase tracking-wider"
                    >
                        {t('login:poweredBy', 'Powered by Gesu Creative Lab')}
                    </motion.p>
                </motion.div>
            </div>
        </div>
    );
}
