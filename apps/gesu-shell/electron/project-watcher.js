// Project Watcher Service - Real-time file system monitoring
// Detects project folder changes instantly using chokidar

import chokidar from 'chokidar';
import path from 'path';

export class ProjectWatcher {
    constructor(win, workflowRoot) {
        this.win = win;
        this.workflowRoot = workflowRoot;
        this.watcher = null;
    }

    start() {
        if (this.watcher) {
            console.log('[ProjectWatcher] Already watching');
            return;
        }

        console.log('[ProjectWatcher] Starting watcher on:', this.workflowRoot);

        this.watcher = chokidar.watch(this.workflowRoot, {
            ignored: /(^|[\/\\])\../, // Ignore dotfiles
            persistent: true,
            ignoreInitial: true,      // Don't fire events for existing files
            depth: 1,                 // Only watch immediate children (project folders)
            awaitWriteFinish: {       // Wait for write operations to complete
                stabilityThreshold: 500,
                pollInterval: 100
            }
        });

        this.watcher
            .on('addDir', (folderPath) => {
                // Only notify for direct children, not nested folders
                const relativePath = path.relative(this.workflowRoot, folderPath);
                if (!relativePath.includes(path.sep)) {
                    console.log('[ProjectWatcher] New project folder:', path.basename(folderPath));
                    this.notifyRenderer();
                }
            })
            .on('unlinkDir', (folderPath) => {
                const relativePath = path.relative(this.workflowRoot, folderPath);
                if (!relativePath.includes(path.sep)) {
                    console.log('[ProjectWatcher] Project folder deleted:', path.basename(folderPath));
                    this.notifyRenderer();
                }
            })
            .on('change', (filePath) => {
                // Notify when gesu.project.json is modified
                if (path.basename(filePath) === 'gesu.project.json') {
                    console.log('[ProjectWatcher] Project metadata changed:', filePath);
                    this.notifyRenderer();
                }
            })
            .on('error', (error) => {
                console.error('[ProjectWatcher] Error:', error);
            })
            .on('ready', () => {
                console.log('[ProjectWatcher] Ready and watching for changes');
            });
    }

    notifyRenderer() {
        if (this.win && !this.win.isDestroyed()) {
            this.win.webContents.send('projects:changed');
        }
    }

    stop() {
        if (this.watcher) {
            this.watcher.close();
            this.watcher = null;
            console.log('[ProjectWatcher] Stopped watching');
        }
    }

    updatePath(newPath) {
        console.log('[ProjectWatcher] Updating path to:', newPath);
        this.stop();
        this.workflowRoot = newPath;
        this.start();
    }
}
