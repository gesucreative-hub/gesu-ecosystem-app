// Auth Context - Provides authentication state and workspace management
import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { GesuUser, onAuthChange, signInWithGoogle, signOut } from '../services/authService';
import { ensureUserWorkspace, UserWorkspace } from '../services/userWorkspaceService';
import { useGesuSettings } from '../lib/gesuSettings';
import { 
    syncFromCloud, 
    setupRealtimeSync, 
    stopRealtimeSync 
} from '../services/gamificationSyncService';
import { optInToLeaderboard } from '../services/leaderboardService';

interface AuthContextType {
    user: GesuUser | null;
    loading: boolean;
    workspace: UserWorkspace | null;
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<GesuUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [workspace, setWorkspace] = useState<UserWorkspace | null>(null);
    const { settings } = useGesuSettings();
    const syncCleanupRef = useRef<(() => void) | null>(null);

    // Handle workspace switching when user changes
    useEffect(() => {
        const setupWorkspace = async () => {
            if (!settings?.paths?.workflowRoot) {
                console.warn('[AuthContext] No workflowRoot in settings');
                return;
            }

            const userId = user?.uid || null;
            console.log('[AuthContext] Setting up workspace for user:', userId || 'default');

            // Store userId in localStorage for other stores to use (gamification, etc.)
            if (userId) {
                localStorage.setItem('gesu.userId', userId);
            } else {
                localStorage.removeItem('gesu.userId');
            }

            try {
                // 1. Create/ensure workspace directories
                const newWorkspace = await ensureUserWorkspace(settings.paths.workflowRoot, userId);
                setWorkspace(newWorkspace);
                console.log('[AuthContext] Workspace ready:', newWorkspace.workspacePath);

                // 2. Switch database to user's database
                if (window.gesu?.database?.switchUser) {
                    const result = await window.gesu.database.switchUser(userId);
                    if (result.ok) {
                        console.log('[AuthContext] Database switched to user:', userId || 'default');
                    } else {
                        console.error('[AuthContext] Failed to switch database:', result.error);
                    }
                }

                // 3. Cloud Sync - only for logged in users
                if (userId) {
                    // Stop any existing sync
                    if (syncCleanupRef.current) {
                        syncCleanupRef.current();
                    }
                    
                    // Pull from cloud first
                    await syncFromCloud(userId);
                    
                    // Setup realtime sync
                    syncCleanupRef.current = setupRealtimeSync(userId);
                    console.log('[AuthContext] Cloud sync enabled for user:', userId);
                    
                    // Always update leaderboard entry on login (force join/update)
                    try {
                        if (user) {
                            console.log('[AuthContext] Updating leaderboard entry for user');
                            await optInToLeaderboard(
                                userId,
                                user.displayName || 'User',
                                user.photoURL || undefined,
                                false // not anonymous by default
                            );
                        }
                    } catch (err) {
                        console.warn('[AuthContext] Failed to update leaderboard:', err);
                    }
                } else {
                    // Stop sync when logged out
                    if (syncCleanupRef.current) {
                        syncCleanupRef.current();
                        syncCleanupRef.current = null;
                    }
                    stopRealtimeSync();
                }
            } catch (err) {
                console.error('[AuthContext] Failed to setup workspace:', err);
            }
        };

        if (settings) {
            setupWorkspace();
        }
    }, [user, settings]);

    useEffect(() => {
        // Subscribe to auth state changes
        const unsubscribe = onAuthChange((newUser) => {
            setUser(newUser);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    // Cleanup sync on unmount
    useEffect(() => {
        return () => {
            if (syncCleanupRef.current) {
                syncCleanupRef.current();
            }
        };
    }, []);

    const handleSignIn = async () => {
        try {
            await signInWithGoogle();
            // Workspace will be created in the useEffect above
        } catch (error) {
            console.error('[AuthContext] Sign-in error:', error);
            throw error;
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut();
            
            // Force page reload to reinitialize all stores with new user's data
            // Each store now uses user-scoped localStorage keys
            window.location.reload();
        } catch (error) {
            console.error('[AuthContext] Sign-out error:', error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            workspace,
            signIn: handleSignIn,
            signOut: handleSignOut
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}

