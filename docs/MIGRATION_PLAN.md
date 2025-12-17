# Gesu Ecosystem v2 - Massive Migration / Build Checklist

## 1. North Star / Vision
To migrate the Gesu Ecosystem from a PowerShell/WPF script collection into a unified, modern **React + TypeScript + Electron** application ("Gesu Ecosystem v2"). The goal is to provide a premium, cohesive "Operating System for Life" that integrates Focus (Compass), Mental Reset (Refocus), Media Management (Media Suite), and Project Initiation (Initiator) under one performant shell, while enforcing strict data safety constraints.

## 2. Architecture Overview

### Current State (Legacy)
- **Stack**: PowerShell scripts + WPF XAML GUIs.
- **Data**: Loose CSVs and JSONs in `WorkFlowDatabase`.
- **Execution**: Manual script launching via shortcuts.

### Target State (v2)
- **Frontend**: React + TypeScript + Tailwind CSS.
- **Container**: Electron (Main + Renderer processes).
- **Styling**: Semantic Design Token System (CSS Variables + Tailwind).
- **Backend (Bridge)**: Electron IPC -> Node.js handlers -> Safe File System interactions.
- **Data Safety**: Strict boundary enforcement (NO deleting outside known workspaces, NO touching `_backup-reference`).

---

## 3. Workstreams

### A. UI Design System & Tokens
**Owner**: Frontend Lead | **Status**: In Progress
- [x] **Semantic Tokens**: Define `--bg`, `--fg`, `--brand`, `--sidebar-*` CSS variables for Light (Theme 1) and Dark (Theme 2).
- [x] **Tailwind Mapping**: Map `tokens.*` in `tailwind.config.js`.
- [x] **Sidebar Spec**: Implement "Pill" item style, subtle borders, and harmonious bottom controls.
- [x] **Button Primitives**: precise "pill + circle icon" `Button` component.
- [x] **Accessibility**: Ensure 4.5:1 contrast for text (Theme 1 Blue #4141b9 / Theme 2 Green #a4db74) against backgrounds.
- [x] **Manual Visual Regression**: Verify sidebar and buttons match reference in both themes.
- [x] **Icon Standardization**: Replaced emojis with `lucide-react` icons; created `Icon.tsx` wrapper.

### B. Shell App (Gesu Shell)
**Owner**: Core Team | **Status**: Planned
- [x] **Layout Consistency**: `PageContainer` with standardized padding/margins.
- [ ] **Navigation**: `react-router-dom` setup with strict route definitions.
- [ ] **Global Error Boundary**: Catch React errors and show a friendly "Gesu Recovery" UI.
- [x] **Assets**: Standardize app icons and window chrome (title bar controls).
- [ ] **Window State**: Persist window size/position in `localStorage`.

### C. Settings (Gesu Settings)
**Owner**: Backend Lead | **Status**: Backlog
- [ ] **Global Schema**: Define `GesuSettings` interface (Zod schema).
- [ ] **Engine Manager UI**: UI to point/validate external CLI tools (yt-dlp, ffmpeg, git, code).
- [ ] **Path Browsing**: Electron IPC dialog for selecting `WorkflowRoot` (Read-only initially).
- [ ] **Persistence**: Safe write logic to `gesu.settings.json`.
- [ ] **Diagnostics**: Panel to check environment health (node version, path access).

### D. Media Suite
**Owner**: Media Team | **Status**: Backlog
- [ ] **Downloader UI**: Input URL -> Queue visualizer.
- [ ] **Status Logic**: Precedence rules (Configured > System Path > Missing).
- [ ] **Activity Feed**: Read/Tail logs to show "Recent Downloads".
- [ ] **Converters**: Frontend tab for FFmpeg presets (MP3/MP4/MKV).
- [ ] **Engine Contract**: Define standardized JSON job format for media operations.

### E. Compass (Focus & Energy)
**Owner**: Product/Life | **Status**: Backlog
- [ ] **Data Model**: `FocusSession` (start, duration, energy_level, tags).
- [ ] **Session Snapshot**: Capture intended task vs actual completion.
- [ ] **Log Export**: Hook to append to daily CSVs (matching legacy format).
- [ ] **Integration Stub**: Placeholders for Notion/Obsidian sync (do not implement yet).

### F. Refocus (Mental Reset)
**Owner**: Product/Life | **Status**: Backlog
- [ ] **Reset Flow**: 3-step wizard (Breathe -> Assess -> Act).
- [ ] **Journaling**: "Brain Dump" text area with local persist.
- [ ] **Routing**: "Back to Compass" explicit action after reset.

### G. Initiator (Project)
**Owner**: Dev Tools | **Status**: Backlog
- [ ] **Template Model**: Selection UI for project types (React, Node, Script).
- [ ] **Preview**: Tree view generator for "What will be created".
- [ ] **Safety Config**: Block creation in non-safe directories.

### H. Data & Storage
**Owner**: Architecture | **Status**: Planned
- [ ] **Schemas**: Zod definitions for all major entities.
- [ ] **Path Conventions**: Enforce `WorkflowRoot/Projects` and `WorkflowRoot/Resources`.
- [ ] **Backups**: Strict rule: **READ-ONLY** access to `_backup-reference`.
- [ ] **Migration Plan**: Scripts to port old XML/CSV data to new JSON formats (Future).

### I. Electron Backend
**Owner**: System | **Status**: Planned
- [ ] **IPC Contract**: Typed channels (`gs:settings:read`, `gs:media:download`, etc.).
- [ ] **FS Safety**: Wrapper around `fs` that throws if path is outside allowlist.
- [ ] **Job Runner**: Queue system for long-running CLI tasks (yt-dlp).

### J. QA & Ops
**Owner**: QA | **Status**: Continuous
- [ ] **Smoke Tests**: Manual checklist for "Launch -> Nav -> Settings -> Close".
- [ ] **Build Packaging**: Electron Builder config for Windows NSIS installer.
- [ ] **Crash Logging**: Simple file logger for uncaught main process errors.
- [ ] **Release Notes**: Template for "What's New in v2.x".

---

## 4. Release Train

| Milestone | Goal | Scope | DoD |
| :--- | :--- | :--- | :--- |
| **Alpha 1** | "It Runs" | Shell, basic Nav, Settings UI (Read-only) | App opens, navigates, theme toggles, no console errors. |
| **Alpha 2** | "Tokenized" | Full Semantic Design System, Sidebar, Buttons | Visuals match reference 100%. |
| **Beta 1** | "Media Ready" | Media Suite (Download/Queue) | Can accept URL and "mock" download process. |
| **v1.0** | "Migration" | All modules at MVP parity with Legacy | User can uninstall PowerShell scripts. |

---

## 5. Risk Register & Mitigations

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| **Data Loss** | Critical | **Strict Rule**: No delete/write outside app sandbox. `_backup-reference` is strictly READ-ONLY. |
| **Performance** | Medium | Large log files (CSV) might lag UI. **Mitigation**: Paginated loading or virtualized lists. |
| **Complexity** | High | Electron IPC boilerplate can get messy. **Mitigation**: Use typed IPC hooks and rigorous patterns. |

---

## 6. Definition of Done (DoD)
1.  **Code**: Compiles with 0 TypeScript errors.
2.  **Lint**: Passes `eslint` (no dead code).
3.  **Visuals**: Verified against Theme 1/Theme 2 specs.
4.  **Safety**: "Sanity Test" passed.
5.  **Docs**: Changelog updated.

---

## 7. Sanity Test Checklist (Run before EVERY PR/Commit)
- [ ] **Does the app compile?** (`npm run build` or `tsc`)
- [ ] **Are we modifying files outside the workspace?** (MUST BE NO)
- [ ] **Are we touching the backup folder?** (MUST BE NO)
- [ ] **Did visual tokens break?** (Check Light/Dark toggle)
- [ ] **Are dependencies safe?** (No weird unknown packages)

---

## 8. Changelog
*(Template)*

### [Unreleased]
- Initial creation of Migration Plan.
- Setup of basic Semantic Token System.

### [0.12.0] - Media Suite Execution Core (Sprint 14) (2025-12-16)
- **Job Queue + State Machine**: Implemented persistent job queue with JSONL history file at workflowRoot/_Media/JobHistory.jsonl
- **Executor Pool**: Max 3 concurrent jobs with FIFO queue ordering
- **Process Spawning**: Real child process spawning for yt-dlp, ffmpeg, imagemagick, soffice
- **Progress Reporting**: Best-effort progress parsing from stdout (yt-dlp percentage, ffmpeg time)
- **Cancellation**: Windows-safe process tree termination using taskkill /T /F
- **IPC Architecture**: media:job:enqueue/list/cancel/cancelAll handlers in main.js
- **Preload Bridge**: window.gesu.mediaJobs API with event subscriptions for progress/complete/update
- **Renderer Service**: mediaJobsService.ts with bridge detection and fallback
- **Renderer Store**: mediaQueueStore.ts with React hook for state management
- **MediaSuitePage Integration**: Wired existing UI to new real execution backend
- **Files Added**: process-utils.js, media-jobs.js, mediaJobsService.ts, mediaQueueStore.ts
- **Files Modified**: main.js (IPC handlers), preload.cjs (mediaJobs API), global.d.ts (types), MediaSuitePage.tsx (wiring)
- **Status**: Implementation complete; awaiting manual QA verification

### [0.11.0] - Focus Engine Global (Sprint 13) (2025-12-16)
- **Global Pomodoro Timer**: Implemented single-instance focus timer with Focus/Short Break/Long Break phases, global state management, and localStorage persistence.
- **Timer UI**: Added FocusTimerPill (always-visible header button, expands to pill during session) and FocusTimerPanel (full controls, presets, config editor).
- **Phase Management**: Auto-transitions between phases, cycle tracking, configurable durations (default 25/5/15 Pomodoro).
- **Notifications**: Windows notifications on phase completion using Notification API.
- **Sound Hook**: Configurable sound cue on phase transitions (user-supplied audio path, no bundled assets).
- **Distraction Shield**: Browser close/refresh warning when session active (beforeunload event). In-app navigation shield deferred (requires React Router data router migration).
- **Universal Task Guardrail**: Enforced max 3 active tasks across all sources (Project Hub + Finish Mode) using centralized taskGuardrail utility.
- **Integration**: Updated StepDetailPanel to use universal guardrail, replacing per-source limits.
- **Timer Positioning**: Top-right anchored panel (56px from top, 24px from right) following popover-near-trigger UX pattern.
- **Files Added**: focusTimerStore.ts, useFocusTimer.ts, taskGuardrail.ts, FocusTimerPill.tsx, FocusTimerPanel.tsx, DistractionGuard.tsx.
- **Files Modified**: Layout.tsx (integrated timer pill + distraction guard), StepDetailPanel.tsx (universal guardrail).
- **Browser Compatibility**: Fixed setInterval type from NodeJS.Timeout to number for browser/Electron renderer context.

### [0.10.2] - Settings Persistence Fix (Sprint 12) (2025-12-16)
- **Settings Refresh**: Fixed Settings page to call refresh() after saving, ensuring workflowRoot and other settings persist correctly across navigation.
- **Root Cause**: SettingsPage maintained local state that was not re-hydrated after save, causing stale values despite successful disk writes.
- **Fix**: Added await refresh() call after saveSettings() in SettingsPage.tsx (line 347).
- **Impact**: Desktop file-backed Compass snapshots now work correctly - Compass shows File-backed badge when workflowRoot is configured.
- **Files Modified**: apps/gesu-shell/src/pages/SettingsPage.tsx (one-line fix + destructuring update).
- **Status**: Sprint 12 complete; Settings persistence verified in desktop mode; Compass File-backed badge confirmed working.

### [0.10.1] - Compass Snapshots UI Integration (2025-12-16)
- **Renderer Service Layer**: Created src/services/compassSnapshotsService.ts with bridge detection and localStorage fallback.
- **CompassPage Updates**: Added Recent Snapshots section (limit 10 newest-first), wired Save Snapshot to call append + refresh.
- **Storage Mode Badges**: Shows File-backed indicator when using bridge + workflowRoot; Simulation badge when using fallback.
- **WorkflowRoot Guidance**: Displays link to Settings when workflowRoot missing.
- **Focus Derivation**: Focus calculated from focusAreas average (meaningful representation of multi-dimensional focus).
- **Data Transformation**: Service layer maps between rich UI format (focusAreas object, SessionData array) and simple bridge format (energy/focus numbers, sessions string array).
- **Newest-First Ordering**: Consistent ordering in both file-backed and localStorage fallback modes.
- **Safety**: Desktop mode saves to workflowRoot/_Index/CompassSnapshots.jsonl; web/simulation uses localStorage; never crashes UI.
- **Status**: Sprint 11 complete; web/simulation mode live-tested, desktop mode code-verified (preload bridge + IPC handlers + backend module confirmed present and correctly wired).

### [0.10.0] - Compass File-Backed Snapshots (Backend) (2025-12-16)
- **Compass Snapshots Module**: Created electron/compass-snapshots.js for append-only JSONL persistence.
- **Storage Location**: Snapshots saved to workflowRoot/_Index/CompassSnapshots.jsonl (append-only format).
- **IPC Handlers**: Added compass:snapshots:append and compass:snapshots:list in electron/main.js.
- **Preload Bridge**: Exposed window.gesu.compassSnapshots.append/list in electron/preload.cjs.
- **Safety**: Reused assertPathWithin pattern; BACKUP_ROOT defense maintained.
- **Typing**: Added compassSnapshots API to src/types/global.d.ts with full TypeScript support.
- **Status**: Backend infrastructure complete; UI integration completed in Sprint 11 (v0.10.1).

### [0.9.1] - Checklist Reconciliation (2025-12-16)
- **Documentation Only**: Reconciled task.md PHASE 6 and PHASE 7 checkboxes with actual Sprint 9/10 deliverables.
- **PHASE 6 Complete**: Ticked all items (template structures, folder generation, project.meta.json, Brief.md, ProjectLog).
- **PHASE 7 Partial**: Ticked Native File Dialogs (completed in Sprint 8); process spawning items remain pending.
- **No Code Changes**: This version contains documentation updates only.

### [0.9.0] - Generator Bridge + Disk Discovery + ProjectLog (2025-12-16)
- **Projects Registry**: Created electron/projects-registry.js to scan disk for existing projects by detecting project.meta.json files.
- **Disk Discovery**: Added projects:list IPC handler to return projects from projectsRoot with safe path validation.
- **Centralized ProjectLog**: Appends creation events to projectsRoot/_Index/ProjectLog.jsonl (append-only JSONL format).
- **Scaffold Enhanced**: Updated scaffold:create to extract projectId from meta, call appendProjectLog, and return projectId/projectName.
- **Store Import**: Added importFromDisk and refreshFromDisk to projectStore.ts for merging disk projects (duplicate-safe).
- **Generator Bridge**: Updated handleGenerate to automatically register created projects and set them active.
- **Preload Bridge**: Exposed window.gesu.projects.list() with full typing in global.d.ts.
- **First-Class Projects**: Generated projects now appear in Project Hub selector immediately and become active automatically.

### [0.8.0] - Generator Real Scaffolding (2025-12-16)
- **Electron Scaffolding Module**: Created electron/scaffolding.js with sanitizeProjectName, assertPathWithin (allowlist + BACKUP_ROOT defense), buildPlan, and applyPlan.
- **IPC Handlers**: Added scaffold:preview and scaffold:create to electron/main.js using projectsRoot from settings.
- **Preload Bridge**: Exposed window.gesu.scaffold.preview/create in electron/preload.cjs.
- **Window Typing**: Added scaffold API types to src/types/global.d.ts.
- **Service Layer**: Updated scaffoldingService.ts to use Electron bridge when available with simulation fallback.
- **Generator UI**: Added Preview and Generate buttons to InitiatorPage with error display and simulation mode badge.
- **Safety**: Strict allowlist validation (projectsRoot only), BACKUP_ROOT defense, 'wx' flag prevents overwrite, sanitized project names.

### [0.7.0] - Real I/O Foundation (2025-12-16)
- **File-Backed Settings**: Updated useGesuSettings to prioritize window.gesu.settings (reads/writes Gesu.GlobalSettings.json via Electron) with localStorage fallback for web dev.
- **Native Path Dialogs**: Confirmed window.gesu.dialog.pickFolder/pickFile already wired and functional in SettingsPage.
- **Real Engine Status**: Validated electron/tools-check.js provides real file existence checks via IPC 'tools:check' handler.
- **Infrastructure Complete**: All Real I/O foundation components already implemented and functional.

### [0.6.0] - Post-MVP Hardening (2025-12-15)
- **Project Store**: Created projectStore.ts with Project model (id, name, createdAt, updatedAt, archived), CRUD operations, and schemaVersion.
- **Workflow Progress Store**: Created workflowProgressStore.ts for per-project persistence of node status and DoD completion.
- **Project Selector UI**: Added project dropdown to InitiatorPage header with create/switch capabilities.
- **Persistence Wiring**: WorkflowCanvas now merges static nodes with persisted progress; DoD/status changes persist to localStorage.
- **Store Hardening**: Added schemaVersion to projectHubTasksStore with legacy array migration.
- **Placeholder Removal**: Replaced "Current Project" with activeProject.name in StepDetailPanel.

### [0.5.0] - Tech Debt + UI Sanity (2025-12-16)
- **Unified Engine Status**: Created engineStatusStore.ts with single source of truth, subscription model, refresh capability, and last-checked timestamp.
- **useEngineStatus Hook**: React hook for consuming unified engine status store.
- **Compass Snapshot Persistence**: Created compassSnapshotStore.ts with localStorage persistence, schemaVersion, and CRUD operations.
- **Scaffolding Service Interface**: Created scaffoldingService.ts with clean interface boundary (IScaffoldingService) and mock implementation, ready for real FS swap.
- **Dashboard Update**: Uses unified engine status with refresh button and last-checked label.
- **Compass Update**: saveSnapshot now persists to localStorage instead of console.log mock.
- **UI Sanity**: Verified all modules via code review - no regressions detected.

### [0.7.0] - Sprint 15: Standards Tab v1 (Workflow Blueprints) (2025-12-17)
- **Data Model**: BlueprintFileShape with categories, blueprints, nodes structure (schemaVersion: 1).
- **Electron Persistence**: workflow-blueprints.js with get/save to _Index/WorkflowBlueprints.json.
- **IPC Handlers**: workflow:blueprints:get, workflow:blueprints:save in main.js.
- **Bridge**: workflowBlueprints.get/save exposed in preload.cjs.
- **Service**: workflowBlueprintsService.ts with Electron detection and localStorage fallback.
- **Default Seeding**: Blueprints seeded from existing 16 WORKFLOW_NODES with stable IDs.
- **Standards Tab**: 3-column layout (categories, blueprint nodes, step editor) in Project Hub.
- **Step Editor**: Edit title, description, DoD items (max 7), tools per step. No structural editing.
- **v1 Constraints**: 1 category (General Creative), auto-assign default blueprint on project create.
- **Files**: 9 files created/modified with zero regressions to existing modules.
- **Verification**: Browser QA PASSED - all acceptance criteria verified, file persistence tested.

### [0.8.0] - Sprint 16: Refocus MVP (Rescue Loop) (2025-12-17)
- **State Selection**: 4-state picker (Overwhelm/Restless/Avoiding/Foggy) replacing overwhelm slider.
- **Suggested Actions**: 1-3 hardcoded tiny actions per state (finish-first UX).
- **15-min Rescue Focus**: Start button wired to focusTimerStore.start({ focusMinutes: 15 }).
- **Lost Mode**: New page at /refocus/lost with exactly 3 ultra-short journaling prompts.
- **Convert to Task**: Uses projectHubTasksStore.addTaskToToday() with guardrail enforcement (max 3/day).
- **Timer Integration**: Rescue focus survives navigation and uses existing global timer system.
- **soffice Cleanup**: Removed LibreOffice/soffice references from Settings UI and MediaSuitePage (cosmetic only).
- **Files**: RefocusPage.tsx (modified), LostModePage.tsx (new), App.tsx (routing), SettingsPage.tsx (cleanup).
- **Acceptance**: Refocus flow < 60 seconds, Lost Mode 3 prompts, no regressions verified.

### [0.8.1] - Sprint 13: Focus Guardrails (Distraction Shield + Universal Max-3 Tasks) (2025-12-17)
- **In-App Distraction Shield**: Intercepts navigation attempts during active focus sessions with modal.
- **Modal Actions**: Pause timer & continue, End session & continue, Continue (keep running) + ESC support.
- **Universal Task Guardrail**: taskGuardrail.ts enforces max 3 active tasks across all sources.
- **Guardrail Integration**: LostModePage and StepDetailPanel use canAddTask() and getBlockedMessage().
- **Known Issue**: Cross-page localStorage sync may cause inconsistent slot counts (page reload shows correct count).
- **Files**: DistractionGuard.tsx (enhanced), DistractionModal.tsx (new), LostModePage.tsx (guardrail),MIGRATION_PLAN.md (entry).
- **QA**: Distraction Shield PASS, Universal Guardrail PARTIAL (works but has sync timing issue).

### [0.8.2] - Sprint 17: Universal Guardrail Sync Hardening (2025-12-17)
- **Reactive Subscription Pattern**: Added subscribe() to projectHubTasksStore with notifySubscribers() on all mutations.
- **React Hook**: Created useTaskGuardrail hook for reactive task capacity updates across pages.
- **Cross-Page Sync**: Task counts now update immediately across all pages (Project Hub, Lost Mode, Compass) without page refresh.
- **LostModePage Integration**: Updated to use useTaskGuardrail hook for real-time slot updates.
- **Manual QA**: VERIFIED - Lost Mode correctly shows "Daily limit reached (0/3)" after tasks created in Project Hub without refresh.
- **Files**: projectHubTasksStore.ts (+subscribe), useTaskGuardrail.ts (new), LostModePage.tsx (hook integration).
- **Status**: Universal guardrail now fully functional with reactive cross-page synchronization.

### [0.6.3] - Sprint 14.3: YouTube Cookie Support + Safe Throttling (2025-12-17)
- **Cookies Support**: Added first-class cookie configuration for yt-dlp to handle YouTube authentication.
- **Cookie Modes**: Browser (Chrome/Edge) or File (cookies.txt via native picker).
- **Safe Throttling**: Optional sleep intervals (min/max) and rate limiting (e.g. "2M").
- **Privacy Guarantee**: Cookie paths redacted in logs, only file paths stored in localStorage.
- **UI**: YouTube Authentication card in MediaSuite Downloader with dropdowns, toggle, and inputs.
- **Executor**: Dynamic ytDlpSettings injection in buildCommand, log redaction for sensitive args.

### [0.6.2] - Sprint 14.2: Cancel All + History Verification (2025-12-17)
- **Cancel All UI**: Added `handleCancelAllJobs` handler in MediaSuitePage (lines 516-532).
- **Cancel All Button**: Added button in Job Queue header that appears only when jobs are running/queued.
- **History Persistence**: Fixed in Sprint 14.1 via `settings.paths.workflowRoot` path correction.
- **soffice De-scoped**: Document conversion remains deferred; soffice hidden via UI filter.
- **Verification Pending**: User must manually verify Cancel All with running jobs and history persistence across restart.


- **Finish Mode Store**: Created finishModeStore.ts with session management, action toggling, and localStorage persistence.
- **StepDetailPanel**: Added Finish Mode section with action selection (max 3), active indicator, and "Mulai Finish Mode" button.
- **CompassPage**: Added Finish Mode card at top when session active - shows current step, action checklist, start/end/clear buttons, guidance text.
- **Anti-planning trap**: User cannot create >3 actions, WIP limit enforced, one step at a time, survives reload.
- **Integration**: Selected actions sync to "Project Hub Tasks (Today)" on Compass.

### [0.3.0] - Settings MVP (2025-12-15)
- **Global Settings Model**: Created typed GesuSettings interface with workflowRoot, projectsRoot, backupRoot, and toolPaths (yt-dlp, ffmpeg, imagemagick, libreoffice).
- **localStorage Adapter**: Implemented settingsStore.ts with schema versioning and migration support.
- **Settings Persistence**: Rewrote useGesuSettings hook to use localStorage instead of window.gesu bridge.
- **Engine Status Wiring**: Dashboard now derives engine status (configured/missing) from global settings.
- **Consumption Proven**: Dashboard engine chips update after settings save and app refresh.
- **Milestone**: Global Configuration Persists achieved.

### [0.2.0] - Project Hub MVP (2025-12-15)
- **Project Hub**: Renamed Initiator to Project Hub with Workflow/Generator tabs.
- **Workflow Canvas**: Pannable canvas with 5 swimlanes, 16 fixed nodes, bezier connectors.
- **Step Detail Panel**: Right panel with phase badge, DoD checklist, mark as done, tools chips.
- **Compass Integration**: Send 1-3 DoD items to Compass with WIP limit (max 3 active tasks/day).
- **localStorage Store**: Date-scoped task persistence with duplicate prevention.
- **QA Verified**: All features working, no regressions across Dashboard/Media/Compass/Refocus/Settings.
- **Milestone**: Project Hub MVP usable end-to-end achieved.

### [0.1.0] - Alpha
- Skeleton setup.

