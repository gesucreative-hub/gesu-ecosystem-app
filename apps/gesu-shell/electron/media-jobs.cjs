// Media Jobs Manager - Job queue with persistent history
// Handles job execution, progress tracking, cancellation

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { killProcessTree } = require('./process-utils.cjs');

// Job state
let jobs = new Map(); // jobId -> job object
let runningProcesses = new Map(); // jobId -> child process
let historyFilePath = null;
let webContents = null; // For emitting events to renderer

const MAX_CONCURRENT_JOBS = 3;

/**
 * Initialize job manager
 * @param {string} workflowRoot - Workflow root directory for history storage
 * @param {Electron.WebContents} contents - WebContents for IPC events
 */
function initJobManager(workflowRoot, contents) {
    webContents = contents;

    if (workflowRoot) {
        const mediaDir = path.join(workflowRoot, '_Media');

        // Ensure directory exists
        if (!fs.existsSync(mediaDir)) {
            fs.mkdirSync(mediaDir, { recursive: true });
        }

        const newHistoryPath = path.join(mediaDir, 'JobHistory.jsonl');

        // Reinitialize if path changed
        if (historyFilePath !== newHistoryPath) {
            historyFilePath = newHistoryPath;
            jobs.clear(); // Clear in-memory to reload from new file
            loadHistory();
            console.log('[media-jobs] Initialized with history:', historyFilePath);
        }
    } else {
        console.warn('[media-jobs] No workflowRoot - history will not persist');
    }
}

/**
 * Reinitialize with new workflowRoot (call when settings change)
 * @param {string} workflowRoot - New workflow root
 */
function reinitWithRoot(workflowRoot) {
    if (workflowRoot) {
        const mediaDir = path.join(workflowRoot, '_Media');
        if (!fs.existsSync(mediaDir)) {
            fs.mkdirSync(mediaDir, { recursive: true });
        }
        historyFilePath = path.join(mediaDir, 'JobHistory.jsonl');
        jobs.clear();
        loadHistory();
        console.log('[media-jobs] Reinitialized with history:', historyFilePath);
    }
}

/**
 * Load job history from JSONL file
 */
function loadHistory() {
    if (!historyFilePath || !fs.existsSync(historyFilePath)) {
        return;
    }

    try {
        const content = fs.readFileSync(historyFilePath, 'utf-8');
        const lines = content.trim().split('\n').filter(line => line.length > 0);

        lines.forEach(line => {
            try {
                const job = JSON.parse(line);
                jobs.set(job.id, job);
            } catch (parseError) {
                console.error('[media-jobs] Failed to parse history line:', parseError);
            }
        });

        console.log(`[media-jobs] Loaded ${lines.length} jobs from history`);
    } catch (error) {
        console.error('[media-jobs] Failed to load history:', error);
    }
}

/**
 * Persist job to history file
 * @param {Object} job - Job to persist
 */
function persistJob(job) {
    if (!historyFilePath) return;

    try {
        const line = JSON.stringify(job) + '\n';
        fs.appendFileSync(historyFilePath, line, 'utf-8');
    } catch (error) {
        console.error('[media-jobs] Failed to persist job:', error);
    }
}

/**
 * Update job status and persist
 * @param {string} jobId - Job ID
 * @param {Object} updates - Fields to update
 */
function updateJob(jobId, updates) {
    const job = jobs.get(jobId);
    if (!job) return;

    Object.assign(job, updates);
    persistJob(job);

    // Emit update to renderer  
    if (webContents) {
        webContents.send('media:job:update', job);
    }
}

/**
 * Enqueue a new job
 * @param {Object} payload - Job payload
 * @returns {string} - Job ID
 */
function enqueueJob(payload) {
    const job = {
        id: crypto.randomUUID(),
        kind: payload.kind,
        engine: payload.engine,
        input: payload.input,
        output: payload.output,
        status: 'queued',
        progress: null,
        createdAt: new Date().toISOString(),
        startedAt: null,
        completedAt: null,
        logsTail: [],
        errorMessage: null,
        options: payload.options || {},
    };

    jobs.set(job.id, job);
    persistJob(job);

    console.log(`[media-jobs] Enqueued job ${job.id}: ${job.engine}`);

    // Try to start execution
    processQueue();

    return job.id;
}

/**
 * Process queue - start jobs if slots available
 */
function processQueue() {
    const runningCount = Array.from(jobs.values()).filter(j => j.status === 'running').length;
    const availableSlots = MAX_CONCURRENT_JOBS - runningCount;

    if (availableSlots <= 0) {
        return; // No slots available
    }

    // Get queued jobs (FIFO)
    const queuedJobs = Array.from(jobs.values())
        .filter(j => j.status === 'queued')
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const jobsToStart = queuedJobs.slice(0, availableSlots);
    jobsToStart.forEach(job => executeJob(job));
}

/**
 * Execute a job - spawn process and monitor
 * @param {Object} job - Job to execute
 */
function executeJob(job) {
    updateJob(job.id, {
        status: 'running',
        startedAt: new Date().toISOString(),
    });

    console.log(`[media-jobs] Starting job ${job.id}: ${job.engine}`);

    try {
        const { command, args } = buildCommand(job);

        // Redact sensitive args from logs (cookie paths/browsers)
        const safeArgs = args.map((arg, i) => {
            const prevArg = args[i - 1];
            if (prevArg === '--cookies' || prevArg === '--cookies-from-browser') {
                return '<redacted>';
            }
            return arg;
        });
        console.log(`[media-jobs] Executing: ${command} ${safeArgs.join(' ')}`);

        // Spawn process
        const child = spawn(command, args, {
            stdio: ['ignore', 'pipe', 'pipe'], // stdin ignored, capture stdout/stderr
        });

        runningProcesses.set(job.id, child);

        // Capture stdout
        child.stdout.on('data', (data) => {
            const line = data.toString().trim();
            handleOutput(job.id, line);
        });

        // Capture stderr
        child.stderr.on('data', (data) => {
            const line = data.toString().trim();
            handleOutput(job.id, line);
        });

        // Handle exit
        child.on('exit', (code, signal) => {
            runningProcesses.delete(job.id);

            const currentJob = jobs.get(job.id);
            if (!currentJob) return;

            if (currentJob.status === 'canceled') {
                // Already marked as canceled
                return;
            }

            // Log for debugging
            console.log(`[media-jobs] Job ${job.id} exited: code=${code}, signal=${signal}`);

            let finalStatus = 'error';
            let errorMessage = null;

            if (signal) {
                // Process was killed by signal
                errorMessage = `Process killed by signal ${signal}`;
            } else if (code === 0) {
                finalStatus = 'success';
            } else if (code === null) {
                // Edge case: code is null but no signal - treat as success if no error
                finalStatus = 'success';
                console.log(`[media-jobs] Job ${job.id} - null exit code, treating as success`);
            } else {
                // Include last lines from log to help debug
                const lastLines = (currentJob.logsTail || []).slice(-5).join(' | ');
                errorMessage = `Exit code ${code}: ${lastLines || 'No output'}`;
                console.error(`[media-jobs] Job ${job.id} last output: ${lastLines}`);
            }

            updateJob(job.id, {
                status: finalStatus,
                completedAt: new Date().toISOString(),
                errorMessage: errorMessage,
            });

            if (finalStatus === 'success') {
                console.log(`[media-jobs] Job ${job.id} completed successfully`);
            } else {
                console.error(`[media-jobs] Job ${job.id} failed with code ${code}`);
            }

            // Emit complete event with the UPDATED status
            if (webContents) {
                webContents.send('media:job:complete', {
                    jobId: job.id,
                    status: finalStatus,
                    errorMessage: errorMessage,
                });
            }

            // Process next queued job
            processQueue();
        });

        // Handle spawn error
        child.on('error', (error) => {
            runningProcesses.delete(job.id);

            updateJob(job.id, {
                status: 'error',
                completedAt: new Date().toISOString(),
                errorMessage: `Spawn error: ${error.message}`,
            });

            console.error(`[media-jobs] Job ${job.id} spawn error:`, error);

            // Process next queued job
            processQueue();
        });

    } catch (error) {
        updateJob(job.id, {
            status: 'error',
            completedAt: new Date().toISOString(),
            errorMessage: `Failed to start: ${error.message}`,
        });

        console.error(`[media-jobs] Job ${job.id} failed to start:`, error);
        processQueue();
    }
}

/**
 * Handle output from child process
 * @param {string} jobId - Job ID
 * @param {string} line - Output line
 */
function handleOutput(jobId, line) {
    if (!line) return;

    const job = jobs.get(jobId);
    if (!job) return;

    // Add to logs tail (keep last 50 lines)
    job.logsTail.push(line);
    if (job.logsTail.length > 50) {
        job.logsTail.shift();
    }

    // Parse progress (best-effort)
    const progress = parseProgress(job.engine, line);
    if (progress !== null) {
        job.progress = progress;
    }

    // Emit progress event
    if (webContents) {
        webContents.send('media:job:progress', {
            jobId: job.id,
            progress: job.progress,
            logLine: line,
        });
    }
}

/**
 * Parse progress from output line (engine-specific)
 * @param {string} engine - Engine name
 * @param {string} line - Output line
 * @returns {number|null} - Progress percentage (0-100) or null
 */
function parseProgress(engine, line) {
    try {
        if (engine === 'yt-dlp') {
            // yt-dlp: [download]  45.2% of 100.00MiB at 1.50MiB/s
            const match = line.match(/\[download\]\s+(\d+\.?\d*)%/);
            if (match) {
                return Math.min(100, Math.max(0, parseFloat(match[1])));
            }
        } else if (engine === 'ffmpeg') {
            // FFmpeg progress parsing - look for frame or time output
            // frame= 1234 fps=30 q=28.0 size=   12345kB time=00:01:23.45
            const frameMatch = line.match(/frame=\s*(\d+)/);
            if (frameMatch) {
                // Can't calculate %, but at least show job is actively processing
                return null; // Keep as null - job is working
            }
        } else if (engine === 'imagemagick') {
            // ImageMagick jobs are typically very fast (single file operations)
            // No progress output, they complete quickly
            return null;
        }
    } catch (error) {
        // Parsing failed, return null
    }

    return null;
}

/**
 * Map yt-dlp preset to format arguments
 * @param {string} preset - Download preset
 * @returns {string[]} - yt-dlp arguments
 */
function getYtDlpArgs(preset) {
    // Match PowerShell GesuMediaSuiteGUI.ps1 format selectors exactly
    switch (preset) {
        case 'music-mp3':
            // PowerShell: -f ba/b -x --audio-format mp3 --audio-quality 0
            return ['-f', 'ba/b', '-x', '--audio-format', 'mp3', '--audio-quality', '0'];
        case 'video-1080p':
            // PowerShell: -f bv*[height<=1080]+ba/b[height<=1080]
            return ['-f', 'bv*[height<=1080]+ba/b[height<=1080]'];
        case 'video-best':
            // PowerShell: -f bv*+ba/b
            return ['-f', 'bv*+ba/b'];
        default:
            return [];
    }
}

/**
 * Map FFmpeg preset to encoding arguments
 * @param {string} preset - Convert preset
 * @param {Object} advancedOptions - Advanced options for video-advanced preset
 * @returns {string[]} - FFmpeg arguments
 */
function getFFmpegArgs(preset, advancedOptions) {
    // Handle advanced mode first
    if (preset === 'video-advanced' && advancedOptions) {
        const args = ['-c:v', 'libx264', '-preset', 'medium'];

        // Resolution
        const resMap = { '1080p': 'scale=-2:1080', '720p': 'scale=-2:720', '540p': 'scale=-2:540' };
        if (resMap[advancedOptions.resolution]) {
            args.push('-vf', resMap[advancedOptions.resolution]);
        }

        // Quality (CRF)
        const crfMap = { 'high': '18', 'medium': '23', 'lite': '28' };
        args.push('-crf', crfMap[advancedOptions.quality] || '23');

        // Audio
        if (advancedOptions.audio === 'copy') {
            args.push('-c:a', 'copy');
        } else if (advancedOptions.audio === 'aac-192') {
            args.push('-c:a', 'aac', '-b:a', '192k');
        } else if (advancedOptions.audio === 'aac-128') {
            args.push('-c:a', 'aac', '-b:a', '128k');
        }

        return args;
    }

    switch (preset) {
        case 'audio-mp3-320':
            return ['-vn', '-acodec', 'libmp3lame', '-ab', '320k'];
        case 'audio-mp3-192':
            return ['-vn', '-acodec', 'libmp3lame', '-ab', '192k'];
        case 'audio-wav-48k':
            return ['-vn', '-ar', '48000', '-acodec', 'pcm_s16le'];
        case 'audio-aac-256':
            return ['-vn', '-acodec', 'aac', '-ab', '256k'];
        case 'video-mp4-1080p':
            return ['-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-vf', 'scale=-2:1080', '-c:a', 'aac', '-b:a', '192k'];
        case 'video-mp4-720p':
            return ['-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-vf', 'scale=-2:720', '-c:a', 'aac', '-b:a', '128k'];
        case 'video-mp4-540p-lite':
            return ['-c:v', 'libx264', '-preset', 'fast', '-crf', '28', '-vf', 'scale=-2:540', '-c:a', 'aac', '-b:a', '96k'];
        default:
            // Reasonable defaults
            return ['-c:v', 'libx264', '-crf', '23', '-c:a', 'aac', '-b:a', '128k'];
    }
}

/**
 * Map ImageMagick preset to args and output extension
 * @param {string} preset - Image convert preset
 * @returns {{args: string[], ext: string}} - ImageMagick args and output extension
 */
function getImageMagickArgs(preset) {
    switch (preset) {
        case 'image-png':
            return { args: [], ext: '.png' };
        case 'image-jpg-90':
            return { args: ['-quality', '90'], ext: '.jpg' };
        case 'image-webp':
            return { args: ['-quality', '90'], ext: '.webp' };
        case 'image-ico-256':
            return { args: ['-resize', '256x256'], ext: '.ico' };
        default:
            // Keep original extension if unknown preset
            return { args: [], ext: null };
    }
}

/**
 * Build command and args for job
 * @param {Object} job - Job object
 * @returns {{command: string, args: string[]}} - Command and args
 */
function buildCommand(job) {
    // Ensure output directory exists
    if (job.output && !fs.existsSync(job.output)) {
        try {
            fs.mkdirSync(job.output, { recursive: true });
        } catch (e) {
            console.error(`[media-jobs] Failed to create output dir: ${job.output}`, e);
        }
    }

    switch (job.engine) {
        case 'yt-dlp':
            // Get preset-specific args - match PowerShell implementation exactly
            const dlArgs = getYtDlpArgs(job.options.preset);

            // Build cookie args from ytDlpSettings
            const cookieArgs = [];
            const ytDlpSettings = job.options.ytDlpSettings || {};

            if (ytDlpSettings.cookiesMode === 'browser' && ytDlpSettings.cookiesBrowser) {
                cookieArgs.push('--cookies-from-browser', ytDlpSettings.cookiesBrowser);
            } else if (ytDlpSettings.cookiesMode === 'file' && ytDlpSettings.cookiesFilePath) {
                cookieArgs.push('--cookies', ytDlpSettings.cookiesFilePath);
            }

            // Build throttling args from ytDlpSettings
            const throttlingArgs = [];
            if (ytDlpSettings.throttling?.enabled) {
                const t = ytDlpSettings.throttling;
                // sleep-interval must be set for max-sleep-interval to work
                if (t.sleepInterval > 0) {
                    throttlingArgs.push('--sleep-interval', t.sleepInterval.toString());
                    // max-sleep-interval only valid when sleep-interval is set
                    if (t.maxSleepInterval > 0 && t.maxSleepInterval > t.sleepInterval) {
                        throttlingArgs.push('--max-sleep-interval', t.maxSleepInterval.toString());
                    }
                }
                if (t.limitRate) {
                    throttlingArgs.push('--limit-rate', t.limitRate);
                }
            }

            // PowerShell arg order: [cookies] [throttling] [preset-args] [user-args] -o template URL
            return {
                command: job.options.toolPath || 'yt-dlp',
                args: [
                    ...cookieArgs,
                    ...throttlingArgs,
                    ...dlArgs,
                    ...(job.options.args || []),
                    '-o', path.join(job.output, '%(title)s.%(ext)s'),
                    job.input, // URL at END - matches PowerShell
                ],
            };

        case 'ffmpeg':
            // Determine extension from preset or default to mp4
            let ext = '.mp4';
            const preset = (job.options.preset || '').toLowerCase();
            if (preset.includes('mp3')) ext = '.mp3';
            else if (preset.includes('wav')) ext = '.wav';
            else if (preset.includes('aac')) ext = '.m4a';
            else if (preset.includes('flac')) ext = '.flac';
            else if (preset.includes('avi')) ext = '.avi';
            else if (preset.includes('mkv')) ext = '.mkv';

            // Construct output filename: [name]_converted.[ext]
            const inputName = path.basename(job.input, path.extname(job.input));
            const outputFilename = `${inputName}_converted${ext}`;
            const outputPath = path.join(job.output, outputFilename);

            // Get preset-specific encoding args
            const ffmpegArgs = getFFmpegArgs(job.options.preset, job.options.advancedOptions);

            return {
                command: job.options.toolPath || 'ffmpeg',
                args: [
                    '-i', job.input,
                    '-y', // Overwrite without asking
                    ...ffmpegArgs,
                    ...(job.options.args || []),
                    outputPath,
                ],
            };

        case 'imagemagick':
            // Get preset-specific args and output extension
            const imgPreset = getImageMagickArgs(job.options.preset);
            const imgName = path.basename(job.input, path.extname(job.input));
            // Use preset extension or fall back to original
            const imgExt = imgPreset.ext || path.extname(job.input);
            const imgPath = path.join(job.output, `${imgName}_converted${imgExt}`);

            return {
                command: job.options.toolPath || 'magick',
                args: [
                    'convert',
                    job.input,
                    ...imgPreset.args,
                    ...(job.options.args || []),
                    imgPath,
                ],
            };

        // soffice/LibreOffice document conversion is deferred - not supported in current release
        case 'soffice':
            throw new Error('Document conversion (soffice) is not supported in this release. Use a dedicated document converter.');

        default:
            throw new Error(`Unknown engine: ${job.engine}`);
    }
}

/**
 * Cancel a job
 * @param {string} jobId - Job ID to cancel
 * @returns {boolean} - True if canceled
 */
function cancelJob(jobId) {
    const job = jobs.get(jobId);
    if (!job) return false;

    if (job.status === 'running') {
        const child = runningProcesses.get(jobId);
        if (child) {
            killProcessTree(child.pid);
            runningProcesses.delete(jobId);
        }
    }

    updateJob(jobId, {
        status: 'canceled',
        completedAt: new Date().toISOString(),
    });

    console.log(`[media-jobs] Canceled job ${jobId}`);

    // Process next queued job
    processQueue();

    return true;
}

/**
 * Cancel all jobs (running + queued)
 * @returns {number} - Number of jobs canceled
 */
function cancelAllJobs() {
    let count = 0;

    for (const [jobId, job] of jobs.entries()) {
        if (job.status === 'running' || job.status === 'queued') {
            cancelJob(jobId);
            count++;
        }
    }

    console.log(`[media-jobs] Canceled ${count} jobs`);
    return count;
}

/**
 * Get queue and history
 * @returns {{queue: Object[], history: Object[]}} - Queue and history
 */
function getQueue() {
    const allJobs = Array.from(jobs.values());

    const queue = allJobs
        .filter(j => j.status === 'running' || j.status === 'queued')
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const history = allJobs
        .filter(j => j.status === 'success' || j.status === 'error' || j.status === 'canceled')
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
        .slice(0, 50); // Last 50 history items

    return { queue, history };
}

module.exports = {
    initJobManager,
    enqueueJob,
    cancelJob,
    cancelAllJobs,
    getQueue,
};
