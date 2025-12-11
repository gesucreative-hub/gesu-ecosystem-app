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
async function resolveToolPath(manualPath, defaultCommand) {
    if (manualPath && (await isExecutable(manualPath))) {
        return { path: manualPath, source: 'manual' };
    }

    try {
        const { stdout } = await execAsync(`where ${defaultCommand}`);
        const firstLine = stdout.split('\r\n')[0].trim();
        if (firstLine) {
            return { path: firstLine, source: 'system' };
        }
    } catch (error) {
        // Ignore error, tool not found
    }

    return { path: null, source: null };
}

/**
 * Runs a version check for a specific tool.
 */
async function checkTool(name, manualPath, defaultCommand, versionArgs = ['--version']) {
    const { path: resolvedPath } = await resolveToolPath(manualPath, defaultCommand);

    const result = {
        name,
        status: 'unknown',
        resolvedPath,
        version: null,
        lastCheckedAt: new Date().toISOString(),
        errorMessage: undefined,
    };

    if (!resolvedPath) {
        result.status = 'not_found';
        return result;
    }

    try {
        const { stdout } = await execFileAsync(resolvedPath, versionArgs);
        // Take the first line as version info (or part of it)
        result.version = stdout.split('\n')[0].trim();
        result.status = 'installed';
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
