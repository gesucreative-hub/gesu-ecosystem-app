# Gesu Ecosystem - Current State Document

**Generated**: 2025-12-26  
**Purpose**: Evidence-based 1:1 snapshot of the Gesu Ecosystem as it exists today  
**Scope**: Read-only analysis - no behavior changes

---

## Quick Index

| Section                                                          | Jump Link                      |
| ---------------------------------------------------------------- | ------------------------------ |
| [Executive Summary](#0-executive-summary)                        | High-level overview            |
| [Repo Topology](#1-repo-topology--build-runtime-overview)        | Monorepo structure             |
| [Product Guardrails](#2-product-principles--guardrails)          | UX rules enforced              |
| [Module: Dashboard](#31-dashboard)                               | Home widget page               |
| [Module: Compass](#32-compass)                                   | Task radar + snapshots         |
| [Module: Activity](#33-activity)                                 | Session tracking               |
| [Module: Refocus](#34-refocus--timer)                            | Focus modes + protocols        |
| [Module: Media Suite](#35-media-suite)                           | Download/convert tools         |
| [Module: Project Hub](#36-project-hub)                           | Standards, Workflow, Generator |
| [Module: Settings](#37-settings)                                 | Configuration page             |
| [Module: Gamification](#38-gamification)                         | XP/leveling system             |
| [Project Hub Deep Dive](#4-project-hub-deep-dive)                | Standards, Generator, Workflow |
| [Data & Persistence](#5-data--persistence-map)                   | Storage mechanisms             |
| [i18n Map](#6-i18n-map--stability-guarantees)                    | Internationalization           |
| [External Tools](#7-external-tools--media-suite-execution-model) | Job engine                     |
| [AI Integration](#8-ai-integration-state-as-is)                  | Ollama/local LLM               |
| [Quality & Readiness](#9-quality--release-readiness)             | QA docs summary                |
| [Fundamental Gaps](#10-fundamental-gaps)                         | Known issues                   |

---

## 0) Executive Summary

### What the App Is

Gesu Ecosystem is a **desktop productivity application** for creative professionals, built with Electron + React + TypeScript + Tailwind. It provides:

- **Focus management** (Compass task radar, focus timer, refocus protocols)
- **Project lifecycle** (blueprint-driven project creation, workflow tracking)
- **Media tools** (yt-dlp downloads, ffmpeg conversions)
- **Gamification** (XP, levels, achievements)

**Target Users**: Solo developer/creative managing daily tasks and client projects.

### Current Maturity Snapshot

| Module           | Status         | Evidence                                                  |
| ---------------- | -------------- | --------------------------------------------------------- |
| **Compass**      | ✅ Verified    | Browser QA + i18n complete, file-backed snapshots working |
| **Project Hub**  | ✅ Verified    | Blueprint/template system working, nameKey i18n done      |
| **Media Suite**  | ✅ Verified    | Job engine tested, yt-dlp/ffmpeg integration working      |
| **Refocus**      | ✅ Verified    | Protocols localized, completion flow functional           |
| **Settings**     | ✅ Verified    | External tools config, path management functional         |
| **Timer**        | ✅ Verified    | Global singleton, cross-page persistence                  |
| **Activity**     | ✅ Implemented | Heatmap/charts render, session tracking via SQLite        |
| **Gamification** | ✅ Implemented | XP/level system working, leaderboard less tested          |
| **Dashboard**    | ✅ Implemented | Widgets render, less integration testing                  |

### Top 10 Facts That Define the System

1. **Monorepo**: `apps/gesu-shell` (React+Electron), `apps/gesu-desktop` placeholder, `docs/`, `scripts/`
2. **10 localStorage stores** with schemaVersion migration pattern (Evidence: `grep schemaVersion` → 11 files)
3. **workflowRoot** path is central - 17+ files depend on it for file operations
4. **projectsRoot** separate from workflowRoot - used for project creation
5. **Focus timer is a global singleton** - cannot run parallel instances
6. **MAX_CONCURRENT_JOBS=3** for media processing (Evidence: `media-jobs.cjs:16`)
7. **SQLite database** stores activity sessions and job history (Evidence: `database.js`)
8. **11 i18n namespaces** (en/id) with English fallback (Evidence: `config/i18n.ts`)
9. **AI integration** is local-first via Ollama (optional, suggestion-only)
10. **BACKUP_ROOT defense** - `assertPathWithin()` rejects writes to backup directories

### Top 5 Fundamental Gaps

| #   | Gap                                         | Evidence                                                              | Risk                                 |
| --- | ------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------ |
| 1   | **No explicit MAX_ACTIVE_TASKS=3 constant** | `grep -r "MAX_ACTIVE" → 0 results`                                    | UX guardrail not code-enforced       |
| 2   | **Distraction shield incomplete**           | No "DistractionModal" found; timer overlay may exist but undocumented | Users may navigate away during focus |
| 3   | **Large job history has no pagination**     | `getRecentJobs()` returns all jobs (RISK_REGISTER.md Risk 9)          | Performance on heavy use             |
| 4   | **Schema migration is lossy on failure**    | Unknown versions reset to empty (projectStore.ts:101-103)             | Data loss on version mismatch        |
| 5   | **Cosmetic modal i18n incomplete**          | ~11 EN strings in gamification cosmetics (RISK_REGISTER.md Risk 10)   | Minor UX for ID users                |

---

## 1) Repo Topology + Build/Runtime Overview

### Monorepo Layout

```
GesuEcosystemApp/
├── apps/
│   ├── gesu-shell/           # Main app (193 files)
│   │   ├── electron/         # Electron main process (15 modules)
│   │   ├── src/              # React renderer
│   │   │   ├── components/   # 68 components
│   │   │   ├── pages/        # 14 page files
│   │   │   ├── stores/       # 10 stores
│   │   │   ├── services/     # 18 services + ai/ subfolder
│   │   │   ├── locales/      # en/ (11 files), id/ (11 files)
│   │   │   └── ...
│   │   └── package.json
│   └── gesu-desktop/         # Placeholder (src/ empty)
├── docs/                     # 19 documentation files
├── scripts/                  # 1 file (check-i18n-leaks.js)
├── _backup-reference/        # READ-ONLY legacy reference
├── package.json              # Root workspace
└── pnpm-workspace.yaml       # Workspace: apps/*, packages/*, services/*
```

**Evidence**: `list_dir` on `apps/gesu-shell/src/` shows 13 subdirectories, 4 root files.

### Electron Boot Sequence

**Entry Point**: `apps/gesu-shell/electron/main.js` (40,972 bytes, ~1000+ lines)

Key initialization:

1. `createWindow()` - Creates BrowserWindow
2. `initDatabase()` - Opens SQLite for sessions
3. `initJobManager()` - Initializes media job queue
4. `ProjectWatcher` - Watches projectsRoot for changes
5. IPC handlers registered for all bridge calls

**Evidence**: `main.js` lines 89-105 show workflowRoot/projectsRoot initialization.

### Renderer Entry

**Main**: `src/main.tsx` → `src/App.tsx`

```tsx
// App.tsx imports config/i18n first
import "./config/i18n";
// Then sets up routes
```

### Routing Map

| Route           | Component        | Purpose               |
| --------------- | ---------------- | --------------------- |
| `/`             | `DashboardPage`  | Home with widgets     |
| `/dashboard`    | `DashboardPage`  | Alias                 |
| `/compass`      | `CompassPage`    | Task radar            |
| `/activity`     | `ActivityPage`   | Session tracking      |
| `/refocus`      | `RefocusPage`    | Focus protocols       |
| `/refocus/lost` | `LostModePage`   | Lost mode recovery    |
| `/media-suite`  | `MediaSuitePage` | Download/convert      |
| `/initiator`    | `ProjectHubPage` | Project hub (3 tabs)  |
| `/settings`     | `SettingsPage`   | Configuration         |
| `/login`        | `LoginPage`      | Auth (outside Layout) |
| `/launcher`     | `LauncherPage`   | Legacy tool launcher  |

**Evidence**: `App.tsx` lines 57-73.

### Scripts

| Script                | Location   | Purpose                     |
| --------------------- | ---------- | --------------------------- |
| `pnpm dev`            | Root       | Start Vite dev server       |
| `pnpm dev:desktop`    | Root       | Start Electron + Vite       |
| `check-i18n-leaks.js` | `scripts/` | Detect hardcoded EN strings |

---

## 2) Product Principles & Guardrails (as implemented)

### Max 3 Active Tasks

**Status**: ⚠️ Not explicitly code-enforced

**Search Result**: `grep -r "MAX.*TASK\|maxTasks\|ACTIVE_LIMIT" → 0 results`

**Inference**: The 3-task limit appears to be a UX guideline rather than a hard-coded constraint. The UI may limit selections visually but there's no constant defining this limit.

### Single Global Focus Timer

**Status**: ✅ Enforced via singleton pattern

**Location**: `src/stores/focusTimerStore.ts`

```typescript
// Module-level singleton (lines 50-66)
let state: FocusTimerState = { ... };
let tickInterval: number | null = null;
const subscribers = new Set<() => void>();
```

**Exports**: `start()`, `pause()`, `resume()`, `stop()`, `startWithTask()`, `getState()`, `subscribe()`

**Evidence**: focusTimerStore.ts has one global `state` variable - no class instantiation possible.

### Distraction Shield

**Status**: ⚠️ Partially implemented (Inference)

**Search Result**: `grep -r "DistractionModal\|distraction" → 0 results`

**Inference**: Timer UI may show a focus overlay during active sessions, but there's no dedicated distraction blocking component found. Navigation is not explicitly blocked during focus.

### Workflow Canvas UX

**Status**: ✅ Documented constraints

Per existing docs (REPO_REALITY_SNAPSHOT.md):

- Nodes are NOT draggable
- Canvas is pannable via background drag only
- Global scroll behavior preserved

---

## 3) Module-by-Module State

### 3.1) Dashboard

**Purpose**: Home page displaying widgets for quick access to key metrics and features.

**Main User Flows**:

- View today's tasks, calendar, recent activity
- Quick navigation to other modules
- Gamification stats display

**Data Sources**:

- `stores/gamificationStore.ts` - XP/level
- `stores/focusTimerStore.ts` - Timer state
- `services/dashboardDataUtils.ts` - Data aggregation

**Persistence**: None directly (reads from other stores)

**i18n Status**: ✅ `dashboard` namespace (2KB)

**Key Files**:

- `pages/DashboardPage.tsx` (4,821 bytes)
- `components/dashboard/CalendarWidget.tsx`

| Feature              | Status      |
| -------------------- | ----------- |
| Widget layout        | Implemented |
| Calendar integration | Implemented |
| Navigation cards     | Implemented |
| Real-time updates    | Implemented |

---

### 3.2) Compass

**Purpose**: Task radar showing daily priorities with category distribution and snapshot history.

**Main User Flows**:

- Add/remove tasks to today's focus
- View radar chart of task categories
- Take snapshots for historical tracking
- Clear data with confirmation

**Data Sources**:

- `stores/compassSnapshotStore.ts` - Snapshot history
- `services/compassSnapshotsService.ts` - File persistence bridge

**Persistence**:

- **Desktop**: `workflowRoot/_Index/CompassSnapshots.jsonl` (append-only)
- **Browser/Simulation**: localStorage `compass-snapshots`

**i18n Status**: ✅ `compass` namespace (3.6KB) - clearData keys added

**Key Files**:

- `pages/CompassPage.tsx` (64,537 bytes)
- `stores/compassSnapshotStore.ts` (3,890 bytes)
- `electron/compass-snapshots.js` (4,033 bytes)

| Feature                        | Status   |
| ------------------------------ | -------- |
| Radar chart                    | Verified |
| Task input                     | Verified |
| Snapshot save/load             | Verified |
| File-backed storage (Electron) | Verified |
| Storage mode badge             | Verified |
| Clear data                     | Verified |

---

### 3.3) Activity

**Purpose**: View session history with heatmaps, charts, and daily/weekly/monthly/yearly views.

**Main User Flows**:

- Switch between time view modes
- View activity heatmap (GitHub-style)
- See daily session breakdown
- Navigate year picker

**Data Sources**:

- SQLite database via `electron/database.js`
- `stores/gamificationStore.ts` for XP data

**Persistence**:

- **SQLite**: `database.js` → user session records
- **Schema**: `database-schema.js`

**i18n Status**: ✅ `activity` namespace (3.2KB)

**Key Files**:

- `pages/ActivityPage.tsx` (39,210 bytes)
- `electron/database.js` (6,319 bytes)

| Feature             | Status      |
| ------------------- | ----------- |
| Heatmap rendering   | Verified    |
| View mode switching | Verified    |
| Year navigation     | Verified    |
| SQLite persistence  | Implemented |
| Session breakdown   | Implemented |

---

### 3.4) Refocus + Timer

**Purpose**: Focus protocols (Quick, Classic, Deep, Custom) with global timer and completion flow.

**Main User Flows**:

- Select focus protocol
- Start/pause/resume/stop timer
- Complete focus session with XP award
- Access "Lost Mode" recovery

**Data Sources**:

- `stores/focusTimerStore.ts` - Timer state (singleton)
- `stores/finishModeStore.ts` - Finish session state
- `services/refocusService.ts` - Protocol logic

**Persistence**:

- localStorage: `focus-timer-state` (schemaVersion=1)
- localStorage: `finish-mode-session`

**i18n Status**: ✅ `refocus` + `focus` namespaces

**Key Files**:

- `pages/RefocusPage.tsx` (25,190 bytes)
- `pages/LostModePage.tsx` (9,525 bytes)
- `stores/focusTimerStore.ts` (10,939 bytes)
- `stores/finishModeStore.ts` (6,355 bytes)

| Feature                | Status      |
| ---------------------- | ----------- |
| Protocol selection     | Verified    |
| Timer start/pause/stop | Verified    |
| XP on completion       | Verified    |
| Lost Mode              | Implemented |
| Preset names i18n      | Verified    |

---

### 3.5) Media Suite

**Purpose**: Download media (yt-dlp) and convert files (ffmpeg) with job queue management.

**Main User Flows**:

- Enter URL for download
- Select format/quality
- Queue multiple jobs
- Monitor progress
- View job history
- Cancel running jobs

**Data Sources**:

- `stores/mediaQueueStore.ts` - Queue state
- `electron/media-jobs.cjs` - Job execution
- `electron/job-logger.js` - History persistence

**Persistence**:

- **JSONL**: `workflowRoot/gesu-config/media-job-history.jsonl`
- **SQLite**: Job records in database

**i18n Status**: ⚠️ Partial - `mediasuite` namespace (6KB), some preset names EN

**Key Files**:

- `pages/MediaSuitePage.tsx` (86,985 bytes)
- `electron/media-jobs.cjs` (22,517 bytes)
- `services/mediaJobsService.ts` (4,253 bytes)

| Feature             | Status      |
| ------------------- | ----------- |
| Job queue           | Verified    |
| yt-dlp download     | Verified    |
| ffmpeg conversion   | Verified    |
| Progress tracking   | Verified    |
| Job cancellation    | Verified    |
| History persistence | Implemented |

**Known Gaps**:

- No pagination for large history (Risk 9)
- Some preset names not localized

---

### 3.6) Project Hub

**Purpose**: Three-tab interface for project lifecycle: Workflow, Generator, Standards.

**Main User Flows**:

- **Workflow**: View project workflow canvas, track step completion
- **Generator**: Create new projects or assign blueprints to existing folders
- **Standards**: Manage blueprints and folder templates

**Data Sources**:

- `stores/projectStore.ts` - Project registry
- `stores/workflowProgressStore.ts` - DoD progress
- `services/workflowBlueprintsService.ts` - Blueprint loading
- `services/workflowFolderTemplatesService.ts` - Template loading

**Persistence**:

- localStorage: `gesu-projects` (schemaVersion=2)
- localStorage: `workflow-progress`
- Files: `workflowRoot/gesu-config/workflow-blueprints.json`
- Files: `workflowRoot/gesu-config/folder-templates.json`
- Files: `project.meta.json` in each project folder

**i18n Status**: ⚠️ Partial - `initiator` namespace (9.8KB), template names use nameKey

**Key Files**:

- `pages/InitiatorPage.tsx` (49,535 bytes)
- `pages/WorkflowCanvas.tsx` (39,067 bytes)
- `pages/StandardsTab.tsx` (89,961 bytes)
- `pages/StepDetailPanel.tsx` (19,790 bytes)

| Feature              | Status   |
| -------------------- | -------- |
| Blueprint filter     | Verified |
| Status filter        | Verified |
| Type filter          | Verified |
| Project search       | Verified |
| Workflow canvas      | Verified |
| DoD checklist        | Verified |
| Template management  | Verified |
| Project creation     | Verified |
| Blueprint assignment | Verified |

---

### 3.7) Settings

**Purpose**: Configure paths, external tools, appearance, AI, and other preferences.

**Main User Flows**:

- Set workflowRoot, projectsRoot, backupRoot paths
- Configure external tool paths (yt-dlp, ffmpeg, etc.)
- Change language and theme
- Enable/configure AI suggestions
- Test tool connectivity

**Data Sources**:

- `lib/gesuSettings.ts` - Settings hook
- `stores/settingsStore.ts` - localStorage wrapper
- `electron/settings-store.js` - File-based settings

**Persistence**:

- localStorage: `gesu-settings` (browser/simulation)
- JSON file: Electron settings via `settings-store.js`

**i18n Status**: ✅ `settings` namespace (3.9KB)

**Key Files**:

- `pages/SettingsPage.tsx` (62,147 bytes)
- `stores/settingsStore.ts` (3,480 bytes)
- `electron/settings-store.js` (4,508 bytes)
- `electron/tools-check.js` (4,318 bytes)

| Feature            | Status      |
| ------------------ | ----------- |
| Path configuration | Verified    |
| Tool path config   | Verified    |
| Tool status check  | Verified    |
| Theme toggle       | Verified    |
| Language switch    | Verified    |
| AI settings        | Implemented |
| Save persistence   | Verified    |

---

### 3.8) Gamification

**Purpose**: XP, levels, achievements, cosmetics, and leaderboard for engagement.

**Main User Flows**:

- Earn XP from focus sessions
- Level up with progress bar
- Unlock cosmetics
- View leaderboard (Firebase)

**Data Sources**:

- `stores/gamificationStore.ts` - XP/level state
- `services/gamificationService.ts` - XP calculations
- `services/gamificationSyncService.ts` - Cloud sync
- `services/leaderboardService.ts` - Leaderboard API

**Persistence**:

- localStorage: `gesu.gamification.{userId}` (user-scoped)

**i18n Status**: ⚠️ Partial - cosmetic modal labels EN

**Key Files**:

- `stores/gamificationStore.ts` (24,028 bytes)
- `components/GamificationCard.tsx`
- `services/gamificationService.ts` (9,765 bytes)

| Feature               | Status      |
| --------------------- | ----------- |
| XP earning            | Verified    |
| Level progress        | Verified    |
| Progress bar gradient | Verified    |
| Cosmetic modal        | Implemented |
| Leaderboard           | Implemented |
| Cloud sync            | Implemented |

---

## 4) Project Hub Deep Dive

### 4.1) Standards (Blueprints + Templates)

**Source of Truth**:

| Type       | System Source                                              | User Source                                         |
| ---------- | ---------------------------------------------------------- | --------------------------------------------------- |
| Blueprints | `services/blueprintTemplates.ts` (8 templates)             | `workflowRoot/gesu-config/workflow-blueprints.json` |
| Folders    | `services/workflowFolderTemplatesService.ts` (9 templates) | `workflowRoot/gesu-config/folder-templates.json`    |

**Type Definitions** (`types/workflowBlueprints.ts`):

```typescript
interface WorkflowBlueprint {
  id: string;
  name: string;
  nameKey?: string; // i18n key
  categoryId: string;
  version: number;
  nodes: BlueprintNode[];
  phases: Phase[];
}

interface BlueprintNode {
  id: string;
  phaseId: string;
  title: string;
  titleKey?: string; // i18n key
  description?: string;
  dod: string[]; // Definition of Done items
  tools?: string[];
}
```

**Evidence**: `workflowBlueprints.ts:44` shows `schemaVersion: 1`

**Editing Pathway**:

1. User edits in StandardsTab UI
2. Changes held in local state
3. "Save" triggers `saveBlueprints()` → IPC → `workflow-blueprints.js`
4. Writes to `workflowRoot/gesu-config/workflow-blueprints.json`

### 4.2) Generator/Initiator

**Project Creation Flow**:

```
1. User fills form (name, type, blueprint, template)
        ↓
2. scaffoldingService.scaffold() called
        ↓
3. IPC → scaffold:create handler
        ↓
4. buildPlan() generates folder structure
        ↓
5. assertPathWithin() validates paths
        ↓
6. applyPlan() creates folders + files
        ↓
7. Writes project.meta.json
        ↓
8. appendProjectLog() adds to ProjectLog.jsonl
        ↓
9. Returns success + projectId
```

**Safety Checks** (`electron/scaffolding.js`):

```javascript
// assertPathWithin() - prevents path traversal
// Line 139: await assertPathWithin(projectsRoot, projectPath);
// Line 159: await assertPathWithin(projectsRoot, fullPath);
```

**Metadata Written** (`project.meta.json`):

```json
{
  "id": "proj-xxxx",
  "name": "Project Name",
  "displayName": "Display Name",
  "blueprintId": "archviz-default",
  "folderTemplateId": "archviz-standard",
  "projectType": "client",
  "clientName": "ClientName",
  "createdAt": "ISO timestamp"
}
```

### 4.3) Workflow Canvas

**Blueprint → Nodes Rendering**:

```
1. WorkflowCanvas receives project prop
        ↓
2. Loads blueprint via workflowBlueprintsService
        ↓
3. blueprintToWorkflowNodes() converts to nodes
        ↓
4. mergeNodesWithProgress() applies progress state
        ↓
5. Renders nodes with StepDetailPanel for selection
```

**DoD/Checklist Storage**:

- **Store**: `workflowProgressStore.ts`
- **Key**: `workflow-progress`
- **Format**: `{ schemaVersion, progressByProject: { [projectId]: { [nodeId]: completed } } }`

**Key Functions**:

- `getProgressForProject(projectId)`
- `setNodeCompleted(projectId, nodeId, completed)`
- `calculateOverallProgress(nodes)`

---

## 5) Data & Persistence Map

### Persistence Mechanisms Summary

| Mechanism    | Location          | Files Using                     | Schema                |
| ------------ | ----------------- | ------------------------------- | --------------------- |
| localStorage | Browser           | 10 stores                       | schemaVersion pattern |
| JSON files   | workflowRoot      | blueprints, templates, settings | schemaVersion: 1      |
| SQLite       | Electron userData | database.js                     | database-schema.js    |
| JSONL        | workflowRoot      | snapshots, job history          | Append-only           |

### localStorage Keys

| Key                          | Store                 | schemaVersion       | Notes                 |
| ---------------------------- | --------------------- | ------------------- | --------------------- |
| `gesu-projects`              | projectStore          | v2 (migrates v1→v2) | Project registry      |
| `focus-timer-state`          | focusTimerStore       | 1                   | Timer singleton       |
| `workflow-progress`          | workflowProgressStore | 1                   | DoD completion        |
| `compass-snapshots`          | compassSnapshotStore  | 1                   | Fallback storage      |
| `finish-mode-session`        | finishModeStore       | 1                   | Active finish session |
| `gesu-settings`              | settingsStore         | 1                   | Settings cache        |
| `project-hub-tasks`          | projectHubTasksStore  | 1                   | Date-scoped tasks     |
| `gesu.gamification.{userId}` | gamificationStore     | -                   | User-scoped XP        |
| `engine-status`              | engineStatusStore     | 1                   | Tool check cache      |
| `gesu_language`              | i18n                  | -                   | Language preference   |

### File Paths on Disk

| Path                                                | Purpose          | Written By           |
| --------------------------------------------------- | ---------------- | -------------------- |
| `workflowRoot/gesu-config/workflow-blueprints.json` | User blueprints  | StandardsTab         |
| `workflowRoot/gesu-config/folder-templates.json`    | User templates   | StandardsTab         |
| `workflowRoot/_Index/CompassSnapshots.jsonl`        | Compass history  | compass-snapshots.js |
| `workflowRoot/gesu-config/media-job-history.jsonl`  | Media jobs       | job-logger.js        |
| `projectsRoot/_Index/ProjectLog.jsonl`              | Created projects | scaffolding.js       |
| `projectsRoot/{projectName}/project.meta.json`      | Project metadata | scaffolding.js       |

### Write Paths

| Feature          | Writes What         | How                               |
| ---------------- | ------------------- | --------------------------------- |
| Project creation | Folders + files     | `applyPlan()` with atomic creates |
| Blueprint save   | JSON file           | `writeFile()` with validation     |
| Compass snapshot | JSONL append        | `appendFile()`                    |
| Settings save    | JSON + localStorage | Dual write                        |
| Session tracking | SQLite INSERT       | Prepared statements               |

### Read Paths (Startup Hydration)

1. **main.js**: Reads settings from `settings-store.js`
2. **App.tsx**: Imports `config/i18n.ts` → loads language
3. **Each page**: Calls respective store's `loadState()`
4. **Project Hub**: Calls `refreshFromDisk()` → IPC → `listProjects()`

---

## 6) i18n Map + Stability Guarantees

### Configuration

**File**: `src/config/i18n.ts`

```typescript
i18n.init({
  resources, // Static imports
  fallbackLng: "en", // Always falls back to English
  defaultNS: "common",
  ns: [
    "common",
    "dashboard",
    "compass",
    "settings",
    "activity",
    "initiator",
    "refocus",
    "mediasuite",
    "login",
    "focus",
    "modals",
  ],
  detection: {
    order: ["localStorage", "navigator"],
    lookupLocalStorage: "gesu_language",
  },
});
```

### Namespace Map

| Namespace  | File Size (EN) | Primary Usage           |
| ---------- | -------------- | ----------------------- |
| common     | 7.5KB          | Buttons, labels, alerts |
| dashboard  | 2KB            | Dashboard widgets       |
| compass    | 3.6KB          | Compass page            |
| settings   | 3.9KB          | Settings page           |
| activity   | 3.2KB          | Activity page           |
| initiator  | 9.8KB          | Project Hub (largest)   |
| refocus    | 6.2KB          | Refocus page            |
| mediasuite | 6KB            | Media Suite             |
| login      | 2.1KB          | Login page              |
| focus      | 2.9KB          | Focus timer             |
| modals     | 4.9KB          | Shared modals           |

### Identifier vs Label Pattern

**ViewModes Example**:

- Values remain canonical: `'daily' | 'weekly' | 'monthly' | 'yearly'`
- Display uses: `t(\`activity:viewModes.${mode}\`)`

**Template nameKey Pattern**:

```typescript
// Data structure
{ id: 'archviz-default', name: 'ArchiViz Standard', nameKey: 'initiator:templates.archviz' }

// Render site
{ template.nameKey ? t(template.nameKey, template.name) : template.name }
```

### Leak Prevention

**Script**: `scripts/check-i18n-leaks.js` (7,847 bytes)

- Checks TSX files for hardcoded strings
- Detects patterns like `"Ready to start"` instead of `t('...')`
- Exit code 0 = pass, 1 = leaks found

**Coverage**: ~90%+ after nameKey pattern implementation (per I18N_FINAL_STATUS.md)

### Known i18n Gaps

| Area                       | Gap                  | Status       |
| -------------------------- | -------------------- | ------------ |
| Cosmetic labels            | EN hardcoded         | Deferred     |
| Some Media Suite presets   | EN text              | Low priority |
| Data-driven template names | Uses nameKey pattern | Resolved     |

---

## 7) External Tools + Media Suite Execution Model

### Job Engine Architecture

**File**: `electron/media-jobs.cjs` (22,517 bytes)

```javascript
const MAX_CONCURRENT_JOBS = 3; // Line 16
let jobs = new Map(); // jobId → job object
let runningProcesses = new Map(); // jobId → child process
```

### Job Lifecycle

```
enqueueJob(payload)
    ↓
Job added to queue with status='pending'
    ↓
processQueue() checks available slots
    ↓
If slots < MAX_CONCURRENT_JOBS:
    executeJob(job)
        ↓
    Spawn child process (yt-dlp/ffmpeg)
        ↓
    handleOutput() parses progress
        ↓
    Job completes → status='done' or 'error'
        ↓
    Emit to renderer via webContents.send()
```

### External Tool Invocation

| Tool          | Spawn Method          | Config Path                      | Safety                     |
| ------------- | --------------------- | -------------------------------- | -------------------------- |
| yt-dlp        | `spawn()` shell:false | `settings.toolPaths.ytdlp`       | Safe                       |
| ffmpeg        | `spawn()` shell:false | `settings.toolPaths.ffmpeg`      | Safe                       |
| ImageMagick   | `spawn()` shell:false | `settings.toolPaths.imagemagick` | Safe                       |
| yt-dlp update | `spawn()` shell:true  | Hardcoded                        | Acceptable (internal only) |

**Evidence**:

- `media-jobs.cjs:204` - ffmpeg spawn
- `main.js:385` - yt-dlp update with shell:true

### Cancel Semantics

```javascript
// cancelJob(jobId)
1. Get process from runningProcesses
2. Call process.kill()
3. Update job status to 'cancelled'
4. Remove from runningProcesses
5. Emit update to renderer
```

### Persistence

- **History**: JSONL at `workflowRoot/gesu-config/media-job-history.jsonl`
- **Behavior**: Appends completed jobs, loads on init
- **Gap**: No pagination implemented (Risk 9)

---

## 8) AI Integration State (as-is)

### Foundation Status: ✅ Implemented

**Location**: `src/services/ai/`

| File                | Purpose                 | Lines       |
| ------------------- | ----------------------- | ----------- |
| `AIProvider.ts`     | Interface + Zod schemas | 3,090 bytes |
| `OllamaProvider.ts` | Ollama HTTP client      | 7,111 bytes |
| `MockProvider.ts`   | Test provider           | 3,988 bytes |
| `prompts.ts`        | Prompt templates        | 2,785 bytes |
| `applyOps.ts`       | Apply AI suggestions    | 4,543 bytes |
| `index.ts`          | Factory + exports       | 1,532 bytes |

### Integration Points

| Integration     | Status         | Location                        |
| --------------- | -------------- | ------------------------------- |
| Settings UI     | ✅ Implemented | SettingsPage.tsx AI section     |
| Standards UI    | ✅ Implemented | Inferred from AI_INTEGRATION.md |
| Connection test | ✅ Implemented | Settings → Test Connection      |
| Model selection | ✅ Implemented | Settings → Model dropdown       |

### Settings Schema

```typescript
ai: {
  enabled: boolean; // default: false
  provider: "none" | "ollama" | "mock";
  endpoint: string; // default: http://localhost:11434
  model: string; // default: llama3.2
}
```

### Safety Guarantees

| Guarantee          | Implementation                       |
| ------------------ | ------------------------------------ |
| No direct writes   | AI layer never writes to disk        |
| Schema validation  | Zod schemas reject invalid responses |
| ID stability       | AI cannot change blueprint/node IDs  |
| Timeout protection | 30s max request time                 |
| Graceful fallback  | No-AI mode always works              |

### What's Missing for Full UX

- **Inference**: "Enhance with AI" button may exist in Standards but not explicitly verified
- Model download UI exists in Settings (Ollama integration)
- End-to-end flow from suggestion → apply → save not browser-QA'd

---

## 9) Quality & Release Readiness

### Existing QA Documents

| Document                     | Purpose                   | Date       |
| ---------------------------- | ------------------------- | ---------- |
| `QC_REPORT.md`               | Comprehensive QC findings | 2025-12-23 |
| `RISK_REGISTER.md`           | 10 risks with mitigations | 2025-12-23 |
| `QA_CHECKLIST_RELEASE.md`    | Pre-release checklist     | -          |
| `BROWSER_QA_RESULTS.md`      | Browser test evidence     | -          |
| `I18N_BROWSER_QA_RESULTS.md` | i18n verification         | -          |
| `I18N_FINAL_STATUS.md`       | i18n coverage analysis    | -          |
| `UI_UX_STABILITY_QA.md`      | Post-fix QA checklist     | -          |
| `REPO_REALITY_SNAPSHOT.md`   | Architecture snapshot     | 2025-12-24 |

### QC Report Summary

**Verdict**: CONDITIONAL PASS - Deploy-ready with acknowledged risks

| Area             | Status             |
| ---------------- | ------------------ |
| Frontend UI/UX   | ✅ PASS            |
| i18n Coverage    | ⚠️ PARTIAL (~90%+) |
| Backend Services | ✅ PASS            |
| Data Persistence | ✅ PASS            |
| Performance      | ✅ PASS            |
| Security         | ✅ PASS            |

### Release Gate Checklist

Based on existing docs:

- [x] All main routes render (QC_REPORT.md)
- [x] localStorage stores have schemaVersion (RISK_REGISTER.md)
- [x] assertPathWithin() protects file writes (QC_REPORT.md)
- [x] External tools checked before use (QC_REPORT.md)
- [x] i18n fallback works (I18N_FINAL_STATUS.md)
- [x] Timer singleton tested (BROWSER_QA_RESULTS.md)
- [x] Job queue concurrency limited (REPO_REALITY_SNAPSHOT.md)
- [ ] Large job history pagination (Gap - Risk 9)
- [ ] Cosmetic modal i18n (Gap - Risk 10)
- [ ] Schema backup before migration (Gap - Risk 7)

### Top Fragile Flows

1. **Project creation** - Multiple file writes, path validation critical
2. **Media job execution** - External tool dependency, process spawning
3. **Settings path changes** - Affects 17+ files
4. **Focus timer lifecycle** - Global singleton state
5. **Language switching** - All UI must respond

---

## 10) Fundamental Gaps

### Gap 1: No Explicit MAX_ACTIVE_TASKS Constant

**Symptom**: Cannot verify 3-task limit is code-enforced

**Evidence**:

- `grep -r "MAX_ACTIVE\|maxTasks\|ACTIVE_LIMIT" → 0 results`
- No constant found in Compass, Refocus, or Timer stores

**Risk Impact**: UX guardrail may be inconsistently applied across modules

**Classification**: Inference (may be enforced via UI selection limits)

---

### Gap 2: Distraction Shield Not Fully Implemented

**Symptom**: No DistractionModal component found

**Evidence**:

- `grep -r "DistractionModal\|distractionShield" → 0 results`
- No block-navigation logic found in timer store

**Risk Impact**: Users may navigate away during focus sessions without warning

**Classification**: Inference (some timer overlay may exist)

---

### Gap 3: Job History Has No Pagination

**Symptom**: `getRecentJobs()` returns all jobs

**Evidence**:

- RISK_REGISTER.md Risk 9: "No pagination implemented"
- `media-jobs.cjs` loads full history on init

**Risk Impact**: Performance degradation for heavy Media Suite users

**Classification**: Fact

---

### Gap 4: Schema Migration Failure Causes Data Loss

**Symptom**: Unknown schema versions reset to empty

**Evidence**:

- `projectStore.ts:101-103`:

```typescript
} else if (parsed.schemaVersion !== CURRENT_SCHEMA_VERSION) {
    console.warn('[projectStore] Unknown schema version, resetting.');
    return { schemaVersion: CURRENT_SCHEMA_VERSION, projects: [], activeProjectId: null };
}
```

**Risk Impact**: Future schema changes could lose user data if migration fails

**Classification**: Fact

---

### Gap 5: Cosmetic Modal i18n Incomplete

**Symptom**: EN labels in gamification cosmetics

**Evidence**:

- RISK_REGISTER.md Risk 10: "~11 leaks"
- I18N_FINAL_STATUS.md documents specific labels

**Risk Impact**: Minor UX for Indonesian users

**Classification**: Fact

---

### Gap 6: No Central Guardrail Enforcement Module

**Symptom**: Product rules scattered across files

**Evidence**:

- Timer singleton in store, not abstracted
- Task limits not in central config
- No "guardrails.ts" or equivalent

**Risk Impact**: Product rules may drift as codebase evolves

**Classification**: Inference

---

## Manual QA Click-Path Checklist

_Note: Assumes app is running via `pnpm dev:desktop` or accessible at localhost:5173_

### Compass Module

1. Navigate to /compass
2. Add a task to today's focus
3. View radar chart updates
4. Take a snapshot
5. Verify snapshot appears in history
6. Switch language to Indonesian
7. Verify all labels translated
8. Clear data and confirm

### Project Hub → Workflow

1. Navigate to /initiator
2. Select a project from dropdown
3. Verify workflow canvas loads
4. Click a step node
5. Verify StepDetailPanel opens
6. Toggle DoD items
7. Verify progress saves (refresh page)

### Project Hub → Generator

1. Switch to Generator tab
2. Fill in project name
3. Select blueprint
4. Click "Generate Project"
5. Verify success alert
6. Check project appears in workflow list

### Media Suite

1. Navigate to /media-suite
2. Enter a YouTube URL
3. Click Download
4. Verify job appears in queue
5. Monitor progress updates
6. Cancel job mid-progress
7. Verify cancellation reflected

### Settings

1. Navigate to /settings
2. Change workflowRoot path
3. Save settings
4. Verify saved (navigate away and back)
5. Test external tool connection
6. Toggle theme (dark/light)
7. Switch language

### Focus Timer

1. Navigate to /refocus
2. Select a protocol
3. Start timer
4. Verify timer counts down
5. Pause and resume
6. Complete session
7. Verify XP awarded

---

_Document generated: 2025-12-26_  
_Analysis method: Static inspection via grep, list_dir, view_file_  
_No runtime changes made_
