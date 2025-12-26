# Repo Reality Snapshot

**Generated**: 2025-12-24  
**Purpose**: Evidence-based architecture snapshot for AI integration planning

---

## 0) Executive Summary

### Module Maturity

| Module          | Maturity  | Status                                                 |
| --------------- | --------- | ------------------------------------------------------ |
| **Compass**     | ✅ Stable | Verified - i18n complete, storage working              |
| **Project Hub** | ✅ Stable | Blueprint/template system verified, nameKey i18n done  |
| **Media Suite** | ✅ Stable | Job engine working, yt-dlp/ffmpeg integration verified |
| **Refocus**     | ✅ Stable | Protocols i18n verified, completion flow working       |
| **Settings**    | ✅ Stable | External tools config, path management                 |
| **Timer**       | ✅ Stable | Global singleton, cross-page persistence               |

### What is Stable vs Implemented-Only

**Stable/Verified** (browser QA + i18n verified):

- All 6 main modules have browser QA docs
- i18n coverage at ~90%+ with nameKey pattern
- Persistence: 10 stores with schemaVersion migrations

**Implemented-Only** (less tested):

- Leaderboard/gamification sync
- Multi-user database switching
- Advanced cosmetic customization

### Top 5 Integration Risks

1. **Blueprint/Template data format** - nameKey pattern must be preserved
2. **Focus Timer singleton** - Global state, cannot have parallel instances
3. **workflowRoot dependency** - 17 files depend on this path setting
4. **i18n namespace structure** - 11 namespaces with fallback patterns
5. **Job engine concurrency** - MAX_CONCURRENT_JOBS=3, JSONL history

---

## 1) Repo Topology

### Monorepo Structure

```
GesuEcosystemApp/
├── apps/
│   ├── gesu-shell/     # Main Electron+React app (185 files)
│   └── gesu-desktop/   # Desktop-specific (placeholder)
├── docs/               # 17 documentation files
├── scripts/            # 1 file (check-i18n-leaks.js)
├── _backup-reference/  # READ-ONLY legacy reference
├── package.json        # Root workspace config
└── pnpm-workspace.yaml # Workspace definition
```

### Toolchain

| Tool       | Version | Purpose              |
| ---------- | ------- | -------------------- |
| pnpm       | ≥8.0.0  | Package manager      |
| Electron   | 28.x    | Desktop container    |
| Vite       | -       | Dev server + bundler |
| TypeScript | 5.3.x   | Type safety          |
| React      | 18.x    | UI framework         |
| i18next    | -       | Internationalization |
| Firebase   | 12.7.x  | Auth + optional sync |

**Evidence**: `package.json:5-8` defines workspaces: `apps/*`, `packages/*`, `services/*`

---

## 2) Current Data & Persistence Model

### Persistence Mechanisms

| Type         | Location     | Files Using                            |
| ------------ | ------------ | -------------------------------------- |
| localStorage | Browser      | 10 stores (schemaVersion pattern)      |
| JSON files   | workflowRoot | Blueprints, folder templates, settings |
| SQLite       | Electron     | Activity sessions, job history         |
| JSONL        | workflowRoot | Media job logs                         |

### Schema Versioned Stores

```
src/stores/
├── compassSnapshotStore.ts    # schemaVersion migration
├── engineStatusStore.ts       # schemaVersion migration
├── finishModeStore.ts         # schemaVersion migration
├── focusTimerStore.ts         # schemaVersion=1, global singleton
├── gamificationStore.ts       # User-scoped, schemaVersion
├── projectStore.ts            # schemaVersion=2 (v1→v2 migration)
├── projectHubTasksStore.ts    # Date-scoped, schemaVersion
├── settingsStore.ts           # schemaVersion migration
├── workflowProgressStore.ts   # schemaVersion migration
└── mediaQueueStore.ts         # Simple queue state
```

**Evidence**: `grep schemaVersion` found 11 files with migration logic

### Settings Root Paths

**Key paths stored in settings**:

- `workflowRoot` - Base for all file operations (17 files reference)
- Used by: CompassPage, SettingsPage, workflowBlueprintsService, scaffoldingService, etc.

**Evidence**: `grep workflowRoot` → 17 files including electron/main.js, services/_, stores/_

---

## 3) Project Hub Reality

### Standards (Blueprints/Templates)

**Source of Truth**:

```
workflowRoot/gesu-config/workflow-blueprints.json   # User blueprints
workflowRoot/gesu-config/folder-templates.json      # User folder templates
src/services/blueprintTemplates.ts                  # System templates (8)
src/services/workflowFolderTemplatesService.ts      # System templates (9)
```

**Type Definitions**: `src/types/workflowBlueprints.ts`

- `WorkflowBlueprint`: id, name, nameKey?, categoryId, nodes[], phases[]
- `FolderTemplate`: id, name, nameKey?, folders[]
- `BlueprintNode`: id, phaseId, title, description, dod[], tools[]

**i18n Pattern**: `nameKey` optional property for localized names

```typescript
// Render pattern:
{
  template.nameKey ? t(template.nameKey, template.name) : template.name;
}
```

### Generator (Project Creation)

**Key Files**:

- `electron/scaffolding.js`: buildPlan(), applyPlan(), assertPathWithin()
- `src/services/scaffoldingService.ts`: Frontend bridge
- `src/pages/InitiatorPage.tsx`: Generator UI

**Metadata Written**: `project.meta.json`

```json
{
  "id": "uuid",
  "name": "Project Name",
  "blueprintId": "template-id",
  "folderTemplateId": "template-id",
  "createdAt": "ISO timestamp"
}
```

**Evidence**: `grep project.meta.json` → 6 files (scaffolding.js, projects-registry.js, etc.)

### Workflow Renderer

**Key Files**:

- `src/pages/WorkflowCanvas.tsx`: Canvas with node rendering
- `src/pages/StepDetailPanel.tsx`: Step detail side panel
- `src/stores/workflowProgressStore.ts`: DoD progress tracking

**Node Rendering**:

- Nodes NOT draggable (UX constraint)
- Canvas background pannable only
- titleKey/descKey for node titles (if present)

---

## 4) i18n Reality

### Setup

**Configuration**: `src/i18n.ts`

- Detector: languageDetector (browser)
- Fallback: `fallbackLng: 'en'`
- Namespaces loaded on-demand

### Locale File Layout

```
src/locales/
├── en/                     # 11 namespaces
│   ├── activity.json       # 3.2KB
│   ├── common.json         # 7.5KB
│   ├── compass.json        # 3.6KB
│   ├── dashboard.json      # 2KB
│   ├── focus.json          # 2.9KB
│   ├── initiator.json      # 9.8KB
│   ├── login.json          # 2.1KB
│   ├── mediasuite.json     # 6KB
│   ├── modals.json         # 4.9KB
│   ├── refocus.json        # 6.2KB
│   └── settings.json       # 3.9KB
└── id/                     # Same 11 namespaces
```

### Guardrails

**Script**: `scripts/check-i18n-leaks.js`

- Checks for hardcoded EN strings in TSX
- Detects raw translation key leaks
- Exit code 0 = pass, 1 = leaks found

**Coverage**: ~90%+ after Sprint 23 nameKey pattern

---

## 5) Media Suite / Job Engine Reality

### Architecture

**Key File**: `electron/media-jobs.cjs` (665 lines)

```javascript
const MAX_CONCURRENT_JOBS = 3;
// Job state
let jobs = new Map(); // jobId -> job object
let runningProcesses = new Map(); // jobId -> child process
```

### Job Lifecycle

1. **Enqueue**: `enqueueJob(payload)` → creates job, persists to JSONL
2. **Process**: `processQueue()` → checks slots, spawns process
3. **Execute**: `executeJob(job)` → builds command, spawns yt-dlp/ffmpeg
4. **Progress**: `handleOutput()` → parses progress from stderr
5. **Complete/Error**: Updates job, emits to renderer

### External Tools

| Tool        | Spawn Method        | Config              |
| ----------- | ------------------- | ------------------- |
| yt-dlp      | spawn() shell:false | Settings.ytdlpPath  |
| ffmpeg      | spawn() shell:false | Settings.ffmpegPath |
| ImageMagick | spawn() shell:false | Settings.magickPath |

**Exception**: yt-dlp update uses `shell:true` (internal only)

**Evidence**: `electron/main.js:385`, `media-jobs.cjs:204`

### Persistence

- **History**: JSONL file at `workflowRoot/gesu-config/media-job-history.jsonl`
- **Behavior**: Appends completed jobs, loads on init

---

## 6) Guardrails & Product Rules Reality

### Focus Tasks Hard Limit

**Location**: Not found as explicit constant  
**Behavior**: UI enforces selection limits in focus modes

### One Global Focus Timer

**Singleton**: `src/stores/focusTimerStore.ts`

```typescript
// Global State - single instance
let state: FocusTimerState = { ... };
let tickInterval: number | null = null;
const subscribers = new Set<() => void>();
```

**Key Exports**:

- `start()`, `pause()`, `resume()`, `stop()`
- `startWithTask(taskContext)`
- `getState()`, `subscribe()`

**Evidence**: focusTimerStore.ts lines 50-66, module-level singleton

### Distraction Shield

**Component**: Not found as "DistractionModal"  
**Behavior**: Timer running → shows focus overlay preventing navigation

---

## 7) QA Reality

### Existing QA Documents

| Document                     | Focus                     |
| ---------------------------- | ------------------------- |
| `UI_UX_STABILITY_QA.md`      | Post-fix QA checklist     |
| `BROWSER_QA_RESULTS.md`      | Browser test evidence     |
| `I18N_BROWSER_QA_RESULTS.md` | i18n verification         |
| `QC_REPORT.md`               | Comprehensive QC findings |
| `QA_CHECKLIST_RELEASE.md`    | Pre-release checklist     |
| `RISK_REGISTER.md`           | 10 risks with mitigations |

### QA Execution Method

- **Primary**: Browser QA via localhost:5173
- **Desktop**: Electron via `pnpm run dev:desktop`
- **Static**: grep audits, TypeScript checks

### Highest-Risk Flows

1. Project creation (file system writes)
2. Media Suite job execution (external tools)
3. Settings path changes (affects all modules)
4. Focus timer lifecycle (global state)
5. Language switching (i18n coverage)

---

## 8) AI Integration Readiness Assessment

### Safe Integration Points (LOW EFFORT / LOW RISK)

| Integration Point               | Effort | Risk | Notes                               |
| ------------------------------- | ------ | ---- | ----------------------------------- |
| **Generator suggestion layer**  | Low    | Low  | Pre-write preview, no direct writes |
| **Blueprint enhancement diffs** | Low    | Low  | Generate suggestions, user applies  |
| **Template folder naming**      | Low    | Low  | Schema-validated suggestions        |
| **Task description generation** | Low    | Low  | Text-only, user confirms            |
| **Protocol recommendation**     | Low    | Low  | Read-only state analysis            |

### Collision Risks

| Risk Area                        | Effort to Avoid | Risk Level | Details                                   |
| -------------------------------- | --------------- | ---------- | ----------------------------------------- |
| **Blueprint format mutation**    | High            | High       | nameKey pattern, schemaVersion migrations |
| **Timer singleton interference** | High            | High       | Global state, cannot parallelize          |
| **workflowRoot file writes**     | Medium          | High       | Path validation required                  |
| **i18n key generation**          | Medium          | Medium     | Must follow namespace pattern             |
| **Job queue injection**          | Medium          | Medium     | Must use enqueueJob() API                 |

### Local LLM Feasibility

**Ollama/LM Studio Assessment**:

| Factor                 | Assessment                         |
| ---------------------- | ---------------------------------- |
| **Network isolation**  | ✅ Feasible - no cloud dependency  |
| **Model loading**      | ⚠️ Electron can spawn local server |
| **Memory footprint**   | ⚠️ 7B models need 8GB+ RAM         |
| **Inference latency**  | ⚠️ CPU-only = 5-10s per response   |
| **Integration method** | HTTP to localhost:11434 (Ollama)   |

**Recommendation**: Local-first with Ollama is viable for:

- Suggestion generation (non-blocking)
- Content enhancement (async)
- NOT recommended for real-time features

---

## Decision Matrix Summary

### Integration Effort vs Risk

```
                 LOW RISK           MEDIUM RISK        HIGH RISK
LOW EFFORT    ✅ Suggestions      ⚠️ i18n keys       ❌ -
              ✅ Diffs preview
              ✅ Naming hints

MED EFFORT    ✅ Workflow assist  ⚠️ Job queue       ❌ File writes
                                  ⚠️ Settings

HIGH EFFORT   -                   -                   ❌ Timer
                                                      ❌ Blueprint format
```

---

## Files Referenced

```
apps/gesu-shell/
├── electron/
│   ├── main.js (1258 lines)
│   ├── media-jobs.cjs (665 lines)
│   ├── scaffolding.js (275 lines)
│   └── settings-store.js
├── src/
│   ├── stores/ (10 stores)
│   ├── services/ (18 services)
│   ├── pages/ (major pages)
│   ├── types/workflowBlueprints.ts
│   └── locales/ (en/, id/)
docs/ (17 files)
```

---

_This snapshot is read-only analysis. No runtime changes made._
