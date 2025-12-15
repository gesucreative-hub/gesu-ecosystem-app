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

### [0.5.0] - Tech Debt + UI Sanity (2025-12-16)
- **Unified Engine Status**: Created engineStatusStore.ts with single source of truth, subscription model, refresh capability, and last-checked timestamp.
- **useEngineStatus Hook**: React hook for consuming unified engine status store.
- **Compass Snapshot Persistence**: Created compassSnapshotStore.ts with localStorage persistence, schemaVersion, and CRUD operations.
- **Scaffolding Service Interface**: Created scaffoldingService.ts with clean interface boundary (IScaffoldingService) and mock implementation, ready for real FS swap.
- **Dashboard Update**: Uses unified engine status with refresh button and last-checked label.
- **Compass Update**: saveSnapshot now persists to localStorage instead of console.log mock.
- **UI Sanity**: Verified all modules via code review - no regressions detected.

### [0.4.0] - Finish Mode Guardrails (2025-12-15)
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

