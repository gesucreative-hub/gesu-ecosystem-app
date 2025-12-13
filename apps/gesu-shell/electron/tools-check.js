import { execFile, exec } from 'node:child_process';
import { promisify } from 'node:util';
import { access } from 'node:fs/promises';
import { constants } from 'node:fs';

const execFileAsync = promisify(execFile);
const execAsync = promisify(exec);

/**
 * Checks if a file exists and is executable.
 */
async function isExecutable(path) {
    try {
        await access(path, constants.X_OK);
        return true;
    } catch {
        return false;
    }
}

/**
 * Resolves a command/path.
 * 1. If manualPath is provided, checks if it's executable.
 * 2. If not, runs `where <defaultCommand>` to find it in PATH.
 */
export async function resolveToolPath(manualPath, defaultCommand) {
    let configuredExists = false;

    // 1. Check Configured Path
    if (manualPath && manualPath.trim() !== '') {
        configuredExists = await isExecutable(manualPath);
        if (configuredExists) {
            return {
                path: manualPath,
                source: 'configured',
                configuredPath: manualPath,
                configuredExists: true
            };
        }
    }

    // 2. Fallback to System PATH
    try {
        // 'where' on Windows returns all matches; take first
        const { stdout } = await execAsync(`where ${defaultCommand}`);
        const firstLine = stdout.split('\r\n')[0].trim();
        if (firstLine) {
            return {
                path: firstLine,
                source: 'path',
                configuredPath: manualPath || null,
                configuredExists: false
            };
        }
    } catch (error) {
        // Ignore error (tool not found in path)
    }

    // 3. Missing
    return {
        path: null,
        source: 'missing',
        configuredPath: manualPath || null,
        configuredExists: false
    };
}

/**
 * Runs a version check for a specific tool.
 */
async function checkTool(name, manualPath, defaultCommand, versionArgs = ['--version']) {
    const resolution = await resolveToolPath(manualPath, defaultCommand);
    const { path: resolvedPath, source, configuredPath } = resolution;

    const result = {
        name,
        status: 'unknown', // 'ready_configured' | 'ready_path' | 'fallback_path' | 'missing' | 'error'
        resolution: source, // 'configured' | 'path' | 'missing'
        resolvedPath,
        configuredPath,
        version: null,
        lastCheckedAt: new Date().toISOString(),
        errorMessage: undefined,
    };

    if (!resolvedPath) {
        result.status = 'missing';
        return result;
    }

    // STRICT Logic (Option 1)
    if (source === 'configured') {
        // We found the tool at the user's manual path
        result.status = 'ready_configured';
    } else if (source === 'path') {
        // We found it in system PATH
        if (configuredPath && configuredPath.trim() !== '') {
            // User tried to configure, but that failed (otherwise source would be 'configured')
            // So this is a Fallback scenario
            result.status = 'fallback_path';
        } else {
            // No configuration attempted; just using system default
            result.status = 'ready_path';
        }
    }

    try {
        const { stdout } = await execFileAsync(resolvedPath, versionArgs);
        // Take the first line as version info (or part of it)
        result.version = stdout.split('\n')[0].trim();
    } catch (error) {
        result.status = 'error';
        result.errorMessage = error.message;
    }

    return result;
}

export async function runGlobalToolsCheck(input = {}) {
    // Parallel checks
    const [ffmpeg, ytDlp, imageMagick, libreOffice] = await Promise.all([
        checkTool('ffmpeg', input.ffmpegPath, 'ffmpeg', ['-version']),
        checkTool('yt-dlp', input.ytDlpPath, 'yt-dlp', ['--version']),
        checkTool('image-magick', input.imageMagickPath, 'magick', ['-version']),
        checkTool('libreoffice', input.libreOfficePath, 'soffice', ['--version']),
        // Note: soffice --version can be tricky, sometimes needs --help or returns to stderr. 
        // We'll trust --version for now as a standard first attempt.
    ]);

    return {
        ffmpeg,
        ytDlp,
        imageMagick,
        libreOffice,
    };
}
