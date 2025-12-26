#!/usr/bin/env node

/**
 * S0-2 Test Data Generator
 * Generates synthetic media job history entries for pagination testing
 * 
 * Usage: node scripts/generate-test-history.js [--count N] [--workflowRoot PATH]
 * 
 * SAFETY: Creates .backup of existing file before overwriting
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Parse args
const args = process.argv.slice(2);

function getArg(name, defaultValue) {
    const index = args.indexOf(name);
    return index >= 0 ? args[index + 1] : defaultValue;
}

const count = parseInt(getArg('--count', '10000'), 10);
const workflowRoot = getArg('--workflowRoot', 
    process.env.GESU_WORKFLOW_ROOT || 
    'D:\\03. Resources\\_Gesu\'s\\WorkFlowDatabase'
);

// Path must match media-jobs.cjs: workflowRoot/_Media/JobHistory.jsonl
const mediaDir = path.join(workflowRoot, '_Media');
const historyPath = path.join(mediaDir, 'JobHistory.jsonl');

console.log('[generate-test-history] ========================================');
console.log(`[generate-test-history] Target: ${historyPath}`);
console.log(`[generate-test-history] Count : ${count}`);
console.log('[generate-test-history] ========================================');

// Ensure directory exists
if (!fs.existsSync(mediaDir)) {
    fs.mkdirSync(mediaDir, { recursive: true });
    console.log(`[generate-test-history] Created directory: ${mediaDir}`);
}

// Backup existing file
if (fs.existsSync(historyPath)) {
    const backupPath = historyPath + '.backup';
    fs.copyFileSync(historyPath, backupPath);
    console.log(`[generate-test-history] ✅ Backed up existing file to: ${backupPath}`);
} else {
    console.log(`[generate-test-history] No existing file to backup`);
}

// Generate entries
const engines = ['yt-dlp', 'ffmpeg', 'imagemagick'];
const statuses = ['success', 'error', 'canceled'];
const downloadPresets = ['music-mp3', 'video-1080p', 'video-best'];
const convertPresets = ['audio-mp3-320', 'audio-mp3-192', 'video-mp4-1080p', 'video-mp4-720p', 'image-png', 'image-jpg-90'];
const sampleUrls = [
    'https://youtube.com/watch?v=dQw4w9WgXcQ',
    'https://soundcloud.com/sample-track',
    'https://vimeo.com/123456789',
    'https://twitter.com/i/status/123456789'
];
const sampleInputs = [
    'D:\\Downloads\\video.mp4',
    'D:\\Downloads\\audio.wav',
    'D:\\Downloads\\image.png',
    'C:\\Users\\Media\\clip.mkv'
];

const stream = fs.createWriteStream(historyPath);
const startTime = Date.now();

for (let i = 0; i < count; i++) {
    const isDownload = Math.random() > 0.4;
    const kind = isDownload ? 'download' : 'convert';
    const engine = isDownload ? 'yt-dlp' : (Math.random() > 0.3 ? 'ffmpeg' : 'imagemagick');
    const preset = isDownload 
        ? downloadPresets[Math.floor(Math.random() * downloadPresets.length)]
        : convertPresets[Math.floor(Math.random() * convertPresets.length)];
    
    // Generate timestamps - entries should be spread over last 30 days
    const daysAgo = Math.floor(Math.random() * 30);
    const hoursAgo = Math.floor(Math.random() * 24);
    const createdAt = new Date(Date.now() - (daysAgo * 86400000) - (hoursAgo * 3600000));
    const completedAt = new Date(createdAt.getTime() + (15000 + Math.floor(Math.random() * 300000))); // 15s to 5min later
    
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    const job = {
        id: crypto.randomUUID(),
        kind: kind,
        engine: engine,
        input: isDownload 
            ? sampleUrls[Math.floor(Math.random() * sampleUrls.length)]
            : sampleInputs[Math.floor(Math.random() * sampleInputs.length)],
        output: 'D:\\03. Resources\\_Gesu\'s\\WorkFlowDatabase\\_Apps\\GesuMediaSuite\\Downloads',
        status: status,
        progress: status === 'success' ? 100 : (status === 'error' ? Math.floor(Math.random() * 50) : 0),
        createdAt: createdAt.toISOString(),
        startedAt: new Date(createdAt.getTime() + 1000).toISOString(),
        completedAt: completedAt.toISOString(),
        logsTail: [],
        errorMessage: status === 'error' ? `Test error message for job ${i}` : null,
        options: {
            preset: preset,
            network: isDownload ? 'normal' : undefined,
            target: 'shell'
        }
    };

    stream.write(JSON.stringify(job) + '\n');

    if ((i + 1) % 1000 === 0) {
        process.stdout.write(`\r[generate-test-history] Progress: ${i + 1}/${count} (${Math.round((i + 1) / count * 100)}%)`);
    }
}

stream.end();

const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
console.log(`\n[generate-test-history] ========================================`);
console.log(`[generate-test-history] ✅ Done! Generated ${count} entries in ${elapsed}s`);
console.log(`[generate-test-history] File size: ${(fs.statSync(historyPath).size / 1024 / 1024).toFixed(2)} MB`);
console.log(`[generate-test-history] To restore: copy ${historyPath}.backup to ${historyPath}`);
console.log('[generate-test-history] ========================================');
