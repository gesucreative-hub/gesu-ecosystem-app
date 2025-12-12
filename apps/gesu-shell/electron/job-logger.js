import fs from 'node:fs';
import path from 'node:path';

const LOG_DIR = path.join(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'media-suite-jobs.log');

/**
 * Appends a structured log entry to the job log file.
 * @param {Object} entry - The log entry details
 * @param {string} entry.id - Job ID
 * @param {string} entry.url - Download URL
 * @param {string} entry.preset - Download preset
 * @param {string} entry.network - Network profile
 * @param {'queued' | 'spawned' | 'success' | 'failed'} entry.status - Current job status
 * @param {string[]} [entry.args] - Optional command line arguments
 * @param {string} [entry.errorMessage] - Optional error message
 */
export function appendJobLog(entry) {
    try {
        if (!fs.existsSync(LOG_DIR)) {
            fs.mkdirSync(LOG_DIR, { recursive: true });
        }

        const logEntry = {
            ...entry,
            timestamp: new Date().toISOString()
        };

        const line = JSON.stringify(logEntry) + '\n';
        fs.appendFileSync(LOG_FILE, line, 'utf-8');
    } catch (err) {
        console.error('[JobLogger] Failed to write log:', err);
    }
}

/**
 * Reads recent job logs.
 * @returns {Array} List of job entries sorted by timestamp desc
 */
export function getRecentJobs(limit = 50) {
    try {
        if (!fs.existsSync(LOG_FILE)) return [];

        const content = fs.readFileSync(LOG_FILE, 'utf-8');
        const lines = content.split('\n').filter(line => line.trim() !== '');

        const jobs = lines
            .map(line => {
                try {
                    return JSON.parse(line);
                } catch {
                    return null;
                }
            })
            .filter(job => job !== null)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        return jobs.slice(0, limit);
    } catch (err) {
        console.error('[JobLogger] Failed to read logs:', err);
        return [];
    }
}
