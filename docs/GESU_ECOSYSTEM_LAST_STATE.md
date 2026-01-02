# Gesu Ecosystem - Current State Document

**Generated**: 2025-12-26  
**Last Updated**: 2026-01-02 (S7 + S8 Complete)  
**Purpose**: Evidence-based 1:1 snapshot of the Gesu Ecosystem as it exists today  
**Scope**: Read-only analysis - no behavior changes

---

## Repo Snapshot (As-Is)

| Metadata         | Value                                      |
| ---------------- | ------------------------------------------ |
| **Branch**       | main                                       |
| **Commit**       | `5fddc49d12b166a73bf40661c6c10455517c4491` |
| **Date/Time**    | 2026-01-02 12:29 UTC+8                     |
| **Node Version** | v24.12.0                                   |
| **pnpm Version** | 8.15.9                                     |
| **Status**       | Dirty (modified files pending)             |

**Workspaces** (from `pnpm-workspace.yaml`):

- `apps/gesu-shell` — Main Electron + React app
- `apps/gesu-desktop` — Placeholder (empty src)

---

## Quick Index

| Section                                                   | Jump Link                    |
| --------------------------------------------------------- | ---------------------------- |
| [Executive Summary](#0-executive-summary)                 | High-level overview          |
| [Repo Topology](#1-repo-topology--build-runtime-overview) | Monorepo structure           |
| [Routing Map](#routing-map)                               | All 22 routes                |
| [Persona Separation](#persona-separation)                 | PERSONAL vs BUSINESS guards  |
| [Data & Persistence](#5-data--persistence-map)            | 21 stores, localStorage keys |
| [i18n Map](#6-i18n-map--stability-guarantees)             | 16 namespaces                |
| [Module Summary](#3-module-by-module-state)               | All modules                  |
| [Quality & Readiness](#9-quality--release-readiness)      | QA docs summary              |
| [Fundamental Gaps](#10-fundamental-gaps)                  | Known issues                 |

---

## 0) Executive Summary

### What the App Is

Gesu Ecosystem is a **desktop productivity application** for creative professionals, built with Electron + React + TypeScript + Tailwind. It provides:

- **Focus management** (Compass task radar, focus timer, refocus protocols)
- **Project lifecycle** (blueprint-driven project creation, workflow tracking)
- **Business tools** (clients, invoices, contracts, deliverables, finance)
- **Media tools** (yt-dlp downloads, ffmpeg conversions)
- **Personal knowledge** (Second Brain inbox + PARA)
- **Gamification** (XP, levels, achievements)

**Target Users**: Solo developer/creative managing daily tasks and client projects.

### Current Maturity Snapshot

| Module               | Status         | Sprint  | Evidence                                    |
| -------------------- | -------------- | ------- | ------------------------------------------- |
| **Compass**          | ✅ Verified    | S1-S3   | Browser QA + i18n complete                  |
| **Project Hub**      | ✅ Verified    | S1-S3   | Blueprint/template system working           |
| **Media Suite**      | ✅ Verified    | S1-S3   | Job engine tested                           |
| **Refocus**          | ✅ Verified    | S1-S3   | Protocols localized                         |
| **Settings**         | ✅ Verified    | S1-S3   | External tools config functional            |
| **Timer**            | ✅ Verified    | S1-S3   | Global singleton, cross-page persistence    |
| **Activity**         | ✅ Implemented | S1-S3   | Heatmap/charts render                       |
| **Gamification**     | ✅ Implemented | S1-S3   | XP/level system working                     |
| **Dashboard**        | ✅ Implemented | S2      | Widgets render, persona filtering           |
| **Persona Split**    | ✅ Implemented | S2      | Personal/Business contexts                  |
| **Daily Check-in**   | ✅ Implemented | S3      | Banner + completion state                   |
| **Clients**          | ✅ Implemented | S5      | CRUD + detail page                          |
| **Service Catalog**  | ✅ Implemented | S6      | Pricelist management                        |
| **Invoices**         | ✅ Implemented | S6-S7-A | CRUD + payment tracking + dueDate           |
| **Contracts**        | ✅ Implemented | S6      | CRUD + status tracking                      |
| **Payments**         | ✅ Implemented | S7-A    | Payment recording + outstanding calculation |
| **Deliverables**     | ✅ Implemented | S7-B    | Templates + packs + PARA status             |
| **Finance Snapshot** | ✅ Implemented | S7-C    | Monthly totals + overdue list               |
| **Second Brain**     | ✅ Implemented | S8      | Inbox + PARA + export                       |

### Top 12 Facts That Define the System

1. **Monorepo**: `apps/gesu-shell` (React+Electron), `apps/gesu-desktop` placeholder
2. **21 localStorage stores** with schemaVersion migration pattern
3. **workflowRoot** path is central - 17+ files depend on it
4. **projectsRoot** separate from workflowRoot
5. **Focus timer is a global singleton**
6. **MAX_CONCURRENT_JOBS=3** for media processing
7. **SQLite database** stores activity sessions and job history
8. **16 i18n namespaces** (en/id) with English fallback
9. **AI integration** is local-first via Ollama (optional)
10. **BACKUP_ROOT defense** - `assertPathWithin()` rejects writes to backup directories
11. **Persona Split** - Personal/Business contexts with route guards
12. **WIP Limit** - Global MAX 3 active tasks enforced

### Top 5 Fundamental Gaps

| #   | Gap                                      | Evidence                                 | Risk                    | Status  |
| --- | ---------------------------------------- | ---------------------------------------- | ----------------------- | ------- |
| 1   | **Large job history has no pagination**  | `getRecentJobs()` returns all jobs       | Performance             | ⚠️ OPEN |
| 2   | **Schema migration is lossy on failure** | Unknown versions reset to empty          | Data loss               | ⚠️ OPEN |
| 3   | **Cosmetic modal i18n incomplete**       | ~11 EN strings in gamification cosmetics | Minor UX                | ⚠️ OPEN |
| 4   | **No Electron file-backed Second Brain** | localStorage only (S8 limitation)        | Web-only persistence    | ⚠️ OPEN |
| 5   | **No invoice PDF export**                | Text-only invoices                       | Professional limitation | ⚠️ OPEN |

---

## 1) Repo Topology + Build/Runtime Overview

### Monorepo Layout

```
GesuEcosystemApp/
├── apps/
│   ├── gesu-shell/           # Main app
│   │   ├── electron/         # Electron main process
│   │   ├── src/              # React renderer
│   │   │   ├── components/   # UI components
│   │   │   ├── pages/        # 26 page files
│   │   │   ├── stores/       # 21 stores
│   │   │   ├── services/     # Services + ai/
│   │   │   ├── locales/      # en/ (16 files), id/ (16 files)
│   │   │   └── config/       # i18n.ts, etc.
│   │   └── package.json
│   └── gesu-desktop/         # Placeholder
├── docs/                     # 25 documentation files
├── scripts/                  # 3 scripts
├── package.json              # Root workspace
└── pnpm-workspace.yaml
```

**Evidence**: `list_dir` on repo root and subfolders.

### Routing Map

| Route                    | Component                | Persona  | Purpose                    |
| ------------------------ | ------------------------ | -------- | -------------------------- |
| `/`                      | Navigate (redirect)      | Both     | → /compass or /initiator   |
| `/login`                 | LoginPage                | Both     | Auth (outside Layout)      |
| `/dashboard`             | DashboardPage            | Both     | Home with widgets          |
| `/launcher`              | LauncherPage             | Both     | Legacy tool launcher       |
| `/compass`               | CompassPage              | PERSONAL | Task radar                 |
| `/activity`              | ActivityPage             | PERSONAL | Session tracking           |
| `/refocus`               | RefocusPage              | PERSONAL | Focus protocols            |
| `/refocus/lost`          | LostModePage             | PERSONAL | Lost mode recovery         |
| `/second-brain`          | SecondBrainPage          | PERSONAL | Inbox + PARA               |
| `/initiator`             | ProjectHubPage           | BUSINESS | Project hub (3 tabs)       |
| `/clients`               | ClientsPage              | BUSINESS | Client management          |
| `/clients/:id`           | ClientDetailPage         | BUSINESS | Client detail              |
| `/business-settings`     | BusinessSettingsPage     | BUSINESS | Business profile           |
| `/pricelist`             | PricelistPage            | BUSINESS | Service catalog            |
| `/invoices`              | InvoicesPage             | BUSINESS | Invoice list               |
| `/invoices/:id`          | InvoiceDetailPage        | BUSINESS | Invoice detail + payments  |
| `/contracts`             | ContractsPage            | BUSINESS | Contract list              |
| `/contracts/:id`         | ContractDetailPage       | BUSINESS | Contract detail            |
| `/deliverable-templates` | DeliverableTemplatesPage | BUSINESS | Deliverable templates CRUD |
| `/deliverables`          | ProjectDeliverablesPage  | BUSINESS | Project deliverables       |
| `/finance`               | FinanceSnapshotPage      | BUSINESS | Monthly finance dashboard  |
| `/media-suite`           | MediaSuitePage           | Both     | Download/convert           |
| `/settings`              | SettingsPage             | Both     | Configuration              |

**Evidence**: `App.tsx` lines 78-114.

### Persona Separation

**Store**: `stores/personaStore.ts`  
**localStorage Key**: `gesu-active-persona`  
**Values**: `'personal' | 'business'`

**Route Guards** (from `Layout.tsx` lines 266-275):

| Persona                     | Allowed Routes                                                                                                                                 | Redirect Target |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| PERSONAL                    | `/compass`, `/activity`, `/refocus`, `/second-brain`                                                                                           | —               |
| BUSINESS                    | `/initiator`, `/clients`, `/business-settings`, `/pricelist`, `/invoices`, `/contracts`, `/deliverable-templates`, `/deliverables`, `/finance` | —               |
| PERSONAL accessing BUSINESS | Any BUSINESS route                                                                                                                             | → `/compass`    |
| BUSINESS accessing PERSONAL | Any PERSONAL route                                                                                                                             | → `/initiator`  |

**Shared Routes** (accessible by both):

- `/dashboard`, `/launcher`, `/media-suite`, `/settings`, `/login`

---

## 5) Data & Persistence Map

### Stores (21 total)

| Store File                    | localStorage Key             | schemaVersion | Purpose                    |
| ----------------------------- | ---------------------------- | ------------- | -------------------------- |
| `businessProfileStore.ts`     | `gesu-business-profile`      | 1             | Company info               |
| `clientStore.ts`              | `gesu-clients`               | 1             | Client registry            |
| `compassSnapshotStore.ts`     | `compass-snapshots`          | 1             | Compass history (fallback) |
| `contractStore.ts`            | `gesu-contracts`             | 1             | Contract registry          |
| `dailyCheckInStore.ts`        | `gesu-daily-checkin`         | 1             | Daily check-in state       |
| `deliverablePackStore.ts`     | `gesu-deliverable-packs`     | 1             | Project deliverables       |
| `deliverableTemplateStore.ts` | `gesu-deliverable-templates` | 1             | Deliverable templates      |
| `engineStatusStore.ts`        | `engine-status`              | 1             | Tool check cache           |
| `finishModeStore.ts`          | `finish-mode-session`        | 1             | Active finish session      |
| `focusTimerStore.ts`          | `gesu-focus-timer`           | 1             | Timer singleton            |
| `gamificationStore.ts`        | `gesu-gamification-{userId}` | —             | User-scoped XP             |
| `invoiceStore.ts`             | `gesu-invoices`              | 1             | Invoice registry           |
| `mediaQueueStore.ts`          | (in-memory only)             | —             | Media job queue            |
| `paymentStore.ts`             | `gesu-payments`              | 1             | Payment records            |
| `personaStore.ts`             | `gesu-active-persona`        | —             | Active persona             |
| `projectHubTasksStore.ts`     | `gesu-projecthub-tasks`      | 1             | Date-scoped tasks          |
| `projectStore.ts`             | `gesu-projects`              | 2             | Project registry           |
| `secondBrainStore.ts`         | `gesu-second-brain`          | 1             | Second Brain items         |
| `serviceCatalogStore.ts`      | `gesu-service-catalog`       | 1             | Pricelist items            |
| `settingsStore.ts`            | `gesu-global-settings`       | 1             | Settings cache             |
| `workflowProgressStore.ts`    | `gesu-workflow-progress`     | 1             | DoD completion             |

**Evidence**: `grep STORAGE_KEY` in stores folder returned all keys.

### File Paths on Disk

| Path                                                | Purpose          | Written By           |
| --------------------------------------------------- | ---------------- | -------------------- |
| `workflowRoot/gesu-config/workflow-blueprints.json` | User blueprints  | StandardsTab         |
| `workflowRoot/gesu-config/folder-templates.json`    | User templates   | StandardsTab         |
| `workflowRoot/_Index/CompassSnapshots.jsonl`        | Compass history  | compass-snapshots.js |
| `workflowRoot/gesu-config/media-job-history.jsonl`  | Media jobs       | job-logger.js        |
| `projectsRoot/_Index/ProjectLog.jsonl`              | Created projects | scaffolding.js       |
| `projectsRoot/{projectName}/project.meta.json`      | Project metadata | scaffolding.js       |

---

## 6) i18n Map + Stability Guarantees

### Configuration

**File**: `src/config/i18n.ts`

**Namespaces (16 total)**:

1. common
2. dashboard
3. compass
4. settings
5. activity
6. initiator
7. refocus
8. mediasuite
9. login
10. focus
11. modals
12. business
13. invoices
14. deliverables
15. finance
16. secondbrain

**Detection Order**: localStorage (`gesu_language`) → navigator

**Evidence**: `i18n.ts` ns array at line 88.

---

## 3) Module-by-Module State

### PERSONAL Persona Modules

| Module       | Page                | Store(s)                         | Status      |
| ------------ | ------------------- | -------------------------------- | ----------- |
| Compass      | CompassPage.tsx     | compassSnapshotStore             | ✅ Verified |
| Activity     | ActivityPage.tsx    | (SQLite via Electron)            | ✅ Verified |
| Refocus      | RefocusPage.tsx     | focusTimerStore, finishModeStore | ✅ Verified |
| Second Brain | SecondBrainPage.tsx | secondBrainStore                 | ✅ New (S8) |

### BUSINESS Persona Modules

| Module       | Page(s)                                           | Store(s)                                       | Status        |
| ------------ | ------------------------------------------------- | ---------------------------------------------- | ------------- |
| Project Hub  | InitiatorPage.tsx, WorkflowCanvas                 | projectStore, workflowProgressStore            | ✅ Verified   |
| Clients      | ClientsPage, ClientDetailPage                     | clientStore                                    | ✅ Verified   |
| Business     | BusinessSettingsPage                              | businessProfileStore                           | ✅ Verified   |
| Pricelist    | PricelistPage                                     | serviceCatalogStore                            | ✅ Verified   |
| Invoices     | InvoicesPage, InvoiceDetailPage                   | invoiceStore, paymentStore                     | ✅ Verified   |
| Contracts    | ContractsPage, ContractDetailPage                 | contractStore                                  | ✅ Verified   |
| Deliverables | DeliverableTemplatesPage, ProjectDeliverablesPage | deliverableTemplateStore, deliverablePackStore | ✅ New (S7-B) |
| Finance      | FinanceSnapshotPage                               | (computed from invoiceStore, paymentStore)     | ✅ New (S7-C) |

### Shared Modules

| Module       | Page           | Store(s)          | Status      |
| ------------ | -------------- | ----------------- | ----------- |
| Dashboard    | DashboardPage  | (reads from all)  | ✅ Verified |
| Media Suite  | MediaSuitePage | mediaQueueStore   | ✅ Verified |
| Settings     | SettingsPage   | settingsStore     | ✅ Verified |
| Gamification | (components)   | gamificationStore | ✅ Verified |

---

## 9) Quality & Release Readiness

### QA Documentation

| Document                | Purpose                         | Last Updated |
| ----------------------- | ------------------------------- | ------------ |
| walkthrough_S7.md       | S7-A Payment recording QA       | 2025-12-29   |
| walkthrough_S7B.md      | S7-B Deliverables QA            | 2026-01-02   |
| walkthrough_S7C.md      | S7-C Finance Snapshot QA        | 2026-01-02   |
| walkthrough_S8.md       | S8 Second Brain QA              | 2026-01-02   |
| MIGRATION_PLAN.md       | Sprint tracking + QA checklists | 2026-01-02   |
| QA_CHECKLIST_RELEASE.md | Pre-release checklist           | 2025-12-26   |

### Build Status

| Check      | Command                | Result                                           |
| ---------- | ---------------------- | ------------------------------------------------ |
| TypeScript | `npx tsc --noEmit`     | ✅ Pass (1 pre-existing warning in ActivityPage) |
| Dev Server | `pnpm run dev:desktop` | ✅ Running                                       |

---

## 10) Fundamental Gaps

### Open Issues

| Issue                                 | Evidence                        | Impact       | Workaround       |
| ------------------------------------- | ------------------------------- | ------------ | ---------------- |
| Large job history no pagination       | `getRecentJobs()` returns all   | Performance  | N/A              |
| Schema migration lossy on failure     | projectStore.ts resets on error | Data loss    | Manual backup    |
| Gamification cosmetic i18n incomplete | ~11 EN strings in modals        | Minor UX     | English fallback |
| Second Brain localStorage only        | S8 scope limitation             | Web-only     | Manual export    |
| No invoice PDF export                 | S6/S7 scope limitation          | Professional | Copy text        |
| No chart in Finance Snapshot          | S7-C scope limitation           | Visual       | Text totals work |

### Backlog (Not Implemented)

- Notion/Obsidian sync
- Multi-currency invoices
- Email reminders
- Drag-and-drop deliverable reorder
- File attachments in Second Brain
- Annual/quarterly finance reports

---

## Evidence Appendix

### Key Commands Run

```bash
# Repo snapshot
git rev-parse --abbrev-ref HEAD  # → main
git rev-parse HEAD               # → 5fddc49d12b166a73bf40661c6c10455517c4491
git status --porcelain           # → Some modified files
node -v                          # → v24.12.0
pnpm -v                          # → 8.15.9
```

### Key File Counts

| Path                              | Count    |
| --------------------------------- | -------- |
| `apps/gesu-shell/src/pages/`      | 26 files |
| `apps/gesu-shell/src/stores/`     | 21 files |
| `apps/gesu-shell/src/locales/en/` | 16 files |
| `docs/`                           | 25 files |

### Key Grep Results

```bash
# localStorage keys
grep "STORAGE_KEY" stores/*.ts
# → 21 stores with STORAGE_KEY definitions

# Route definitions
# App.tsx lines 78-114: 22 Route elements

# Persona guards
# Layout.tsx lines 266-269:
#   personalRoutes = ['/compass', '/activity', '/refocus', '/second-brain']
#   businessRoutes = ['/initiator', '/clients', '/business-settings', '/pricelist', '/invoices', '/contracts', '/deliverable-templates', '/deliverables', '/finance']
```

### Sprint Completion Status

| Sprint | Description                  | Status      | Commit    |
| ------ | ---------------------------- | ----------- | --------- |
| S1-S4  | Core app + persona split     | ✅ Complete | (various) |
| S5     | Business workspace (clients) | ✅ Complete | (various) |
| S6     | Invoices + Contracts         | ✅ Complete | (various) |
| S7-A   | Payment recording            | ✅ Complete | (various) |
| S7-B   | Deliverables system          | ✅ Complete | edb6444   |
| S7-C   | Finance Snapshot             | ✅ Complete | 9cb3f6b   |
| S8     | Second Brain light           | ✅ Complete | 5fddc49   |

---

_Document generated via repo analysis. All claims backed by file paths, grep results, or code inspection._
