// Process Utilities - Windows-safe process tree termination
// Handles killing child processes reliably on Windows

const { execSync } = require('child_process');

/**
 * Kills a process tree on Windows using taskkill
 * @param {number} pid - Process ID to kill
 * @returns {boolean} - True if kill signal sent successfully
 */
function killProcessTree(pid) {
    if (!pid) {
        console.warn('[process-utils] killProcessTree called with invalid PID:', pid);
        return false;
    }

    try {
        // Windows: use taskkill with /T (tree) and /F (force) flags
        if (process.platform === 'win32') {
            execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore' });
            console.log(`[process-utils] Killed process tree for PID ${pid}`);
            return true;
        } else {
            // Unix-like: use process.kill (note: doesn't kill tree by default)
            process.kill(pid, 'SIGTERM');
            console.log(`[process-utils] Sent SIGTERM to PID ${pid}`);
            return true;
        }
    } catch (error) {
        console.error(`[process-utils] Failed to kill PID ${pid}:`, error.message);

        // Fallback: try process.kill directly
        try {
            process.kill(pid, 'SIGKILL');
            console.log(`[process-utils] Fallback: sent SIGKILL to PID ${pid}`);
            return true;
        } catch (fallbackError) {
            console.error(`[process-utils] Fallback kill also failed:`, fallbackError.message);
            return false;
        }
    }
}

/**
 * Validates if a process is still running
 * @param {number} pid - Process ID to check
 * @returns {boolean} - True if process is running
 */
function isProcessRunning(pid) {
    try {
        process.kill(pid, 0); // Signal 0 checks if process exists
        return true;
    } catch (error) {
        return false;
    }
}

module.exports = {
    killProcessTree,
    isProcessRunning,
};
