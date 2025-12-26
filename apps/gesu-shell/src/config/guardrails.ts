/**
 * Guardrails Configuration
 * Single source of truth for UX safety limits
 * 
 * S1-1: Hard WIP limit + Distraction Shield
 */

// --- WIP LIMIT ---
export const MAX_ACTIVE_ITEMS = 3;

// --- DISTRACTION SHIELD ---

/**
 * Route Policy during Focus Session
 * 
 * BLOCKED: High-distraction screens - navigation prevented with toast
 * ALLOWED: Focus-essential screens - navigate silently
 * PROMPT: Confirm-to-open screens - show modal with Pause/End/Continue
 * 
 * Routes from App.tsx:
 * - / (dashboard) -> BLOCKED (noisy, Compass is focus home)
 * - /dashboard -> BLOCKED
 * - /launcher -> BLOCKED
 * - /compass -> ALLOWED (focus home)
 * - /activity -> BLOCKED
 * - /refocus -> ALLOWED (mental reset)
 * - /refocus/lost -> ALLOWED (mental reset flow)
 * - /media-suite -> BLOCKED (distraction-heavy)
 * - /initiator -> BLOCKED (project hub, scope creep risk)
 * - /settings -> PROMPT (avoid tinkering during focus)
 * - /login -> ALLOWED (essential)
 */
export const FOCUS_ROUTE_POLICY = {
  /**
   * BLOCKED: Cannot navigate during focus session
   * Navigation prevented, toast shown
   */
  blocked: [
    '/',           // Dashboard root
    '/dashboard',  // Dashboard explicit
    '/launcher',   // Legacy launcher
    '/activity',   // Activity tracking (distraction)
    '/media-suite', // Media downloads/converts
    '/initiator',  // Project Hub (scope creep risk)
  ],
  
  /**
   * ALLOWED: Navigate freely during focus
   * Focus-essential screens, no interruption
   */
  allowed: [
    '/compass',       // Focus home - timer controls
    '/refocus',       // Mental reset
    '/refocus/lost',  // Lost mode flow
    '/login',         // Essential auth flow
  ],
  
  /**
   * PROMPT: Confirm-to-open during focus
   * Show modal with Pause/End/Continue options
   * (Routes not in blocked or allowed default to PROMPT)
   */
  // Note: /settings is implicitly PROMPT (not in blocked or allowed)
} as const;

export type RoutePolicy = 'blocked' | 'allowed' | 'prompt';

/**
 * Get the policy for a given route path
 * @param path - Route path (e.g., '/media-suite')
 * @returns Policy: 'blocked', 'allowed', or 'prompt'
 */
export function getRoutePolicy(path: string): RoutePolicy {
  // Normalize path (remove trailing slash if present)
  const normalizedPath = path.endsWith('/') && path !== '/' 
    ? path.slice(0, -1) 
    : path;
  
  // Check blocked routes (exact match or starts with)
  if (FOCUS_ROUTE_POLICY.blocked.some(r => 
    normalizedPath === r || normalizedPath.startsWith(r + '/')
  )) {
    return 'blocked';
  }
  
  // Check allowed routes
  if (FOCUS_ROUTE_POLICY.allowed.some(r => 
    normalizedPath === r || normalizedPath.startsWith(r + '/')
  )) {
    return 'allowed';
  }
  
  // Default: prompt for unknown routes (safe default)
  return 'prompt';
}
