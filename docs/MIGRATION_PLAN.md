# Gesu Ecosystem v2 - Massive Migration / Build Checklist

## Current Status (Single Source of Truth)

- Previous Sprint: **S5 — Business Toolkit Foundation** ✅ COMPLETE (2026-01-02)
- Current Sprint: **S6 — Invoices & Contracts**
- Completed: **S6-A — Stores + Numbering** ✅ DONE (2026-01-02)
- Completed: **S6-B — Nav + List Pages** ✅ DONE (2026-01-02)
- Completed: **S5-1 — Business Profile Store + Settings** ✅ DONE (2026-01-01)
- Completed: **S5-2 — Clients Store + Pages** ✅ DONE (2026-01-01)
- Completed: **S5-3 — Projects clientId + Client Linking** ✅ DONE (2026-01-01)
- Completed: **S5-4 — i18n Complete (EN/ID)** ✅ DONE (2026-01-02)
- Completed: **S5-5 — Client Dropdown in Project Hub** ✅ DONE (2026-01-02)

> **S5 Implementation COMPLETE**: Business foundations with full i18n support.
>
> **Data Stores**:
>
> - `businessProfileStore.ts` — Business identity, payment methods, numbering config
> - `clientStore.ts` — Client CRM with search and subscription patterns
> - `projectStore.ts` v4 — Added `clientId` field with migration from v3
>
> **UI Pages**:
>
> - `BusinessSettingsPage.tsx` — Business identity, payments, numbering, terms
> - `ClientsPage.tsx` — Client list/search with CRUD operations
> - `ClientDetailPage.tsx` — Client details + linked projects + Link Project dropdown
> - `InitiatorPage.tsx` — Client dropdown (replaces text input) with "Add Client" button
>
> **i18n Coverage**:
>
> - EN/ID locale files: `business.json` (96 keys), `common.json` (nav keys)
> - All pages fully translated (forms, labels, buttons, empty states, tooltips)
> - Registered `business` namespace in `i18n.ts`
>
> **Features**:
>
> - Project↔Client linking/unlinking with dropdown UI
> - Client dropdown in Project Hub generator (BUSINESS persona only)
> - Click-outside-to-close for Link Project dropdown
> - Persona-based navigation (Clients/Business Settings in sidebar)
>
> See [Sprint S5 Walkthrough](file:///C:/Users/Surya/.gemini/antigravity/brain/ff9d2e4e-9cbe-467a-b21d-3eb397fcf4b8/walkthrough.md)

---

## S6 — Invoices & Contracts

### S6-A — Stores + Numbering — ✅ DONE (2026-01-02)

**Scope**: Data foundation for invoices/contracts with snapshot-safe persistence

**Files Created**:

- `stores/serviceCatalogStore.ts` — Pricelist CRUD + search + category filter (schemaVersion=1)
- `stores/invoiceStore.ts` — Invoice + line items with snapshot values, freeze rule (schemaVersion=1)
- `stores/contractStore.ts` — Contract with scope[], terms, snapshot (schemaVersion=1)
- `services/documentNumberingService.ts` — Token replacement + sequence increment

**Numbering Tokens Supported**:

- `{YYYY}` — 4-digit year
- `{YY}` — 2-digit year
- `{MM}` — 2-digit month
- `{DD}` — 2-digit day
- `{####}` — 4-digit sequence
- `{###}` — 3-digit sequence

**Default Formats** (from BusinessProfile):

- Invoice: `GC-INV-{YY}{MM}{DD}-{####}`
- Contract: `GCL/BRD/{MM}/{###}/{YYYY}`

**Freeze Rules**:

- Invoice: if `status !== 'draft'` → content edits blocked, only status transitions allowed
- Contract: same freeze rule

**Snapshot Safety**:

- Line items store snapshot values (itemName, unitPrice) not references
- Invoice/contract store client + businessProfile snapshot at creation time
- Edits to pricelist or profile do NOT affect historical documents

**QA Results (DevTools)**:

| Test                                                                           | Result  |
| ------------------------------------------------------------------------------ | ------- |
| Create invoice → number generated                                              | ✅ PASS |
| Second invoice → seq increments                                                | ✅ PASS |
| Create pricelist item → invoice created → modify pricelist → invoice unchanged | ✅ PASS |
| Mark invoice sent → attempt update → blocked                                   | ✅ PASS |
| Create contract → number format correct                                        | ✅ PASS |
| Contract freeze rule                                                           | ✅ PASS |

**Build**: ✅ Passing (0 new errors, 1 pre-existing warning in ActivityPage.tsx)

### S6-B — Nav + List Pages — ✅ DONE (2026-01-02)

**Scope**: Navigation, routing, and list pages for BUSINESS workspace

**Pages Created**:

- `pages/PricelistPage.tsx` — CRUD table with search + category filter
- `pages/InvoicesPage.tsx` — List with status tabs and search
- `pages/InvoiceDetailPage.tsx` — Read-only stub (Edit disabled: "Coming in S6-C")
- `pages/ContractsPage.tsx` — List with status tabs and search
- `pages/ContractDetailPage.tsx` — Read-only stub (Edit disabled: "Coming in S6-C")

**Routes Added** (App.tsx):

- `/pricelist` → PricelistPage
- `/invoices` → InvoicesPage
- `/invoices/:id` → InvoiceDetailPage
- `/contracts` → ContractsPage
- `/contracts/:id` → ContractDetailPage

**Navigation** (Layout.tsx):

- Added 3 nav items for BUSINESS persona: Invoices, Contracts, Pricelist
- Updated `businessRoutes` array for persona guards

**i18n** (EN/ID):

- Created `locales/en/invoices.json` + `locales/id/invoices.json` (~100 keys each)
- Added nav keys to `common.json` (pricelist, invoices, contracts)
- Registered `invoices` namespace in `i18n.ts`

**QA Results**:

| Test                                                | Result  |
| --------------------------------------------------- | ------- |
| BUSINESS: Nav shows new entries                     | ✅ PASS |
| PricelistPage: Create item → appears in table       | ✅ PASS |
| PricelistPage: Edit/delete item                     | ✅ PASS |
| PricelistPage: Search + category filter             | ✅ PASS |
| InvoicesPage: New Invoice → number generated → list | ✅ PASS |
| InvoicesPage: Click → detail stub opens             | ✅ PASS |
| ContractsPage: New Contract → number generated      | ✅ PASS |
| PERSONAL: Nav items hidden                          | ✅ PASS |
| PERSONAL: Direct /invoices → redirect to /compass   | ✅ PASS |

**Build**: ✅ Passing (0 new errors)

---

## S2 — Persona Split

### Architecture Reference

See: [docs/PERSONA_SPLIT_ARCHITECTURE.md](./PERSONA_SPLIT_ARCHITECTURE.md)

### S2-0 — Persona Split Architecture — ✅ DONE

**Completed**: 2025-12-27

Evidence:

- File: `docs/PERSONA_SPLIT_ARCHITECTURE.md`
- Commit: **e43b202** — "Docs: add S2-0 persona split architecture"

**Scope**: Architecture definition only, NO application code changes

**Key Decisions Documented**:

| ID  | Decision                                               |
| --- | ------------------------------------------------------ |
| D1  | WIP limit is GLOBAL MAX 3 (not per-persona)            |
| D2  | Use `activePersona` context variable, not URL prefixes |
| D3  | Media Suite is SHARED utility                          |
| D4  | Dashboard shows ACTIVE persona only                    |
| D5  | Focus sessions are Personal, may link to Business work |

**DoD Checklist**:

- [x] Purpose & Non-goals defined
- [x] Personal vs Business personas defined
- [x] Data boundaries (Shared/Personal/Business) classified
- [x] Navigation boundaries (routes, landing pages) specified
- [x] Guardrails compatibility confirmed (WIP global, distraction shield unchanged)
- [x] Migration phases (S2-1 through S2-5) outlined with DoD
- [x] Acceptance tests (T1–T8) defined

---

### S2-1 — Data Tagging — ✅ IMPLEMENTED

**Completed**: 2025-12-27

Evidence:

- Commit: **(this commit)** — "S2-1: add project persona field + migrate defaults"
- Files changed:
  - `projectStore.ts` (+45 lines, -8 lines)
  - `scaffolding.js` (+1 line)
  - `projects-registry.js` (+3 lines)

Changes Made:

- **Project Interface**: Added `persona: 'personal' | 'business'` field (required)
- **Schema v2→v3**: Added `migrateProjectsV2ToV3` function defaulting to `'business'`
- **Migration Chain**: v2→v3 and v1→v3 paths with backup-before-migration
- **createProject**: Defaults `persona: 'business'` for new projects
- **importFromDisk**: Preserves disk persona or defaults to `'business'`
- **Scaffolding**: Writes `persona: 'business'` to `project.meta.json`
- **Disk Import**: Parses `metadata.persona` with default `'business'`
- **Legacy Fallback**: Includes `persona: 'business'` for projects without meta

QA Checklist:

- [x] Project interface includes `persona: 'personal' | 'business'`
- [x] Schema migration v2→v3 defaults existing projects to `'business'`
- [x] Migration chain handles v1→v3 path with single backup
- [x] Disk import preserves persona from meta or defaults to `'business'`
- [x] New projects created with `persona: 'business'`
- [x] Legacy project detection includes `persona: 'business'`
- [x] UI unchanged (no filtering yet - deferred to S2-3)
- [ ] TypeScript build passes (pre-existing errors in InitiatorPage.tsx unrelated to persona changes)

**Notes**:

- TypeScript compilation has pre-existing errors in `InitiatorPage.tsx:100` and `activityTrackingService.ts` unrelated to S2-1 changes
- All persona-related type changes are type-safe
- No UI behavior changes—projects list still shows all projects without filtering

---

### S2-2 — Persona Context Variable — ✅ IMPLEMENTED

**Completed**: 2025-12-27

Evidence:

- Commit: **14c5e19** — "S2-2: add personaStore + localStorage persistence"
- Files: `personaStore.ts` (created, ~100 lines)

Changes Made:

- **personaStore.ts**: Created with activePersona state ('personal' | 'business')
- **Persistence**: localStorage key `gesu-active-persona`
- **Pattern**: Module-level state, subscribe/notifySubscribers, init on load
- **Default**: `'business'` for missing/invalid values
- **Error Handling**: try/catch for localStorage operations, guards for non-browser context
- **DEV Helper**: `window.__gesuPersona` for console QA (DEV mode only)

QA Checklist:

- [x] personaStore.ts with activePersona state
- [x] Persisted to `gesu-active-persona`
- [x] Invalid values fallback to 'business' and storage corrected
- [x] LocalStorage unavailable failsafe (returns 'business')
- [x] Subscription pattern implemented
- [x] No UI changes (deferred to S2-3)

---

### S2-3 — UI Separation — ✅ IMPLEMENTED

**Completed**: 2025-12-27

Evidence:

- Commits: **5b66f06**, **ce728be**, **987ee93** — "S2-3: wire active persona into UI filtering + redirect"
- Files: `usePersona.ts` (created), `Layout.tsx` (persona toggle + nav filtering + redirect), `InitiatorPage.tsx` (persona filter), `App.tsx` (landing redirect), i18n keys

Changes Made:

- **usePersona hook**: React hook for personaStore subscription/reactive updates
- **PersonaToggle**: Segmented control in sidebar (Personal/Business), focus protection via `isSessionActive()`
- **Nav filtering**: Conditional rendering (Personal: Compass/Activity/Refocus, Business: Initiator, Shared: Dashboard/Media Suite)
- **Landing redirect**: `/` → `/compass` (personal) or `/initiator` (business)
- **Auto-redirect**: Persona switch redirects incompatible routes (e.g., Business + `/compass` → `/initiator`)
- **i18n**: Added `persona.personal`/`persona.business` (EN + ID)

QA Checklist:

- [x] Sidebar filters routes by activePersona
- [x] Root `/` redirects to persona landing
- [x] Persona toggle in sidebar
- [x] Nav visibility correct for both personas
- [x] Auto-redirect on persona switch
- [x] Focus protection (toggle blocked during `isSessionActive===true`)
- [x] No regression: nav works, routing works

---

### S2-4 — Cross-Persona Guardrails — ✅ IMPLEMENTED

**Completed**: 2025-12-27

Evidence:

- Commit: **3d9bfb4** — "S2-4: cross-persona guardrails (global WIP + block switch during focus)"
- Files: `personaStore.ts` (focus guard in setActivePersona), `Layout.tsx` (PersonaBlockedToast with auto-dismiss)

Changes Made:

- **Focus guard in personaStore**: `setActivePersona()` now checks `isSessionActive()` and returns false if blocked
- **PersonaBlockedToast**: Inline toast with auto-dismiss (3s) when persona switch blocked during focus
- **Global WIP**: Verified that `canAddMoreTasksToday()` already counts ALL tasks regardless of persona (no filter by persona in `getTodayTasks`)

QA Checklist:

- [x] `canAddTask()` counts tasks from both personas (global WIP MAX 3)
- [x] Persona switch blocked during `focusActive=true`
- [x] Toast shown on blocked switch attempt (auto-dismisses after 3s)
- [x] No regression: nav works, focus timer flow unchanged

---

### S2-5 — QA & Polish — ✅ IMPLEMENTED

**Completed**: 2025-12-29

Evidence:

- Commit: **[will be filled upon commit]** — "S2-5: QA closeout + dashboard persona filtering"
- Files changed: `ActiveProjectsWidget.tsx` (persona filtering), `MIGRATION_PLAN.md` (documentation)

**QA Results** (Code-based verification):

Acceptance Tests:

- [x] T1: Persona toggle + nav filtering ✅ PASS (verified: Layout.tsx lines 108-191, nav items conditionally rendered)
- [x] T2: Global WIP MAX 3 ✅ PASS (verified: projectHubTasksStore.ts getTodayTasks() has no persona filter)
- [x] T3: Persona switch blocked during focus ✅ PASS (verified: personaStore.ts lines 64-74, isSessionActive() guard)
- [x] T4: Landing redirect ✅ PASS (verified: App.tsx lines 66-70, activePersona-based redirect)
- [x] T5: Persistence across reload ✅ PASS (verified: personaStore.ts lines 26-43, localStorage STORAGE_KEY)
- [x] T6: Cross-context bridging works ✅ PASS (verified: daily check-in accepts any project)
- [x] T7: Dashboard persona-only ✅ PASS (FIXED: ActiveProjectsWidget now filters by activePersona)
- [x] T8: Shared routes accessible ✅ PASS (verified: Settings/Media Suite in nav without persona filter)

S1 Regression Checks:

- [x] R1: Daily check-in banner ✅ PASS (no changes to DailyCheckInBanner)
- [x] R2: Ctrl+K distraction shield ✅ PASS (no changes to CommandPaletteModal)

**Known Issues**: None (all tests passed after T7 fix)

**Note**: Browser-based QA was attempted but encountered technical issues with browser tool. QA was conducted via code review and implementation verification against architecture requirements.

---

## S1 — Guardrails (COMPLETE)

### S1-3b — Fix Daily Check-in Prompt Reliability — ✅ IMPLEMENTED

**Completed**: 2025-12-27

Evidence:

- Commit: **de91abe** — "S1-3b: make daily check-in prompt reliable"
- Files changed: `DailyCheckInBanner.tsx` (+22 lines, -3 lines)

Changes Made:

- **isComplete Check**: Banner now checks `today.isComplete === true` instead of just `today !== null`
- **Reactive focusActive**: Store subscription to `focusTimerStore` for reactive state updates
- **Show Condition**: Banner appears when NO completed check-in exists OR focus is inactive
- **Dev Diagnostics**: Console logging (dev-only) for debugging show/hide decisions

QA Checklist:

- [x] TypeScript compilation passes
- [x] T1: No record → banner appears
- [x] T2: Incomplete record (`isComplete: false`) → banner appears
- [x] T3: Complete check-in → banner hides immediately, stays hidden on reload
- [x] T4: Focus active → banner never appears
- [x] T5: Corrupt storage → app safe, banner appears as fallback
- [x] T6: Next day (yesterday's record) → banner appears for new day

**Rationale**: Fixed bug where minimal check-ins (S1-2c "Set Focus" with `isComplete: false`) incorrectly hid the banner. Banner now reliably prompts for full check-in flow.

---

### S1-3a — Prevent Focus Guardrail Bypass via Ctrl+K — ✅ IMPLEMENTED

**Completed**: 2025-12-27

Evidence:

- Commit: **3cc240e** — "S1-3a: block ctrl+k navigation to distraction routes during focus"
- Files changed: `CommandPaletteModal.tsx` (+154 lines, -101 lines)

Changes Made:

- **targetPath Field**: Added `targetPath?: string` to `SearchResult` interface for explicit route tracking
- **Reactive focusActive**: Store subscription to `focusTimerStore` for reactive state updates
- **Filtering Logic**: Blocked routes (dashboard, initiator, media-suite) filtered from results when `focusActive=true`
- **Execution Guard**: Last-line defense checks `getRoutePolicy(targetPath)`, cancels navigation if blocked
- **BlockedRouteToast**: Reused existing toast component for consistent feedback
- **Focus-Safe Whitelist**: Compass, Refocus, Settings remain accessible during focus

QA Checklist:

- [x] TypeScript compilation passes
- [x] Blocked routes filtered when focus active (Dashboard, Project Hub, Media Suite)
- [x] Allowed routes visible when focus active (Compass, Refocus)
- [x] Prompt routes proceed normally (Settings → DistractionGuard handles)
- [x] All results visible when NO focus active
- [x] Execution guard blocks navigation and shows toast
- [x] focusActive reactive (updates when timer starts/stops)

**Rationale**: Closes guardrail bypass vector. Command Palette now enforces same route policy as Link-based navigation.

---

### S1-2c — Project Hub "Set as Today's Focus" — ✅ IMPLEMENTED

**Completed**: 2025-12-27

Evidence:

- Commit: **16035fe** — "S1-2c: project hub set today's focus + wip surface audit"
- Files changed: `dailyCheckInStore.ts` (+12 lines), `ProjectSearch.tsx` (+30 lines), `locales/*/common.json`

Changes Made:

- **isComplete Field**: Added `isComplete?: boolean` to DailyCheckIn interface to distinguish full check-ins from focus-only updates
- **Set Focus Button**: Hover-visible Target icon button on each project row in ProjectSearch
- **focusActive Guard**: Button hidden when focus timer is active (belt-and-suspenders)
- **Toast Message**: Shows "Focus Updated - Today's focus set to [Name]" on click
- **updateTodayTopFocus**: Preserves existing isComplete value when updating focus

WIP Surface Audit:

- [x] LostModePage: Enforced via `canAddTask()`
- [x] StepDetailPanel: Enforced via `canAddTask()`
- [x] CompassPage Focus First: Enforced via `getRemainingSlots()`
- [x] Finish Mode: Inherent WIP counting (session counts as 1 task)
- **Result**: No WIP bypass found

QA Checklist:

- [x] TypeScript compilation passes
- [x] Set Focus button appears on hover in ProjectSearch
- [x] Button hidden when focusActive
- [x] Toast shows on click
- [x] isComplete=false for minimal check-ins from Project Hub
- [N/A] E2E test (Simulation Mode — requires Electron)

Design Notes:

- **isComplete=false stub**: When focus is set from Project Hub, creates minimal check-in with `isComplete: false`. Full check-in flow (banner → modal) sets `isComplete: true`. This prevents silent "completion" of check-ins.
- **"Go to Compass" action**: Deferred due to AlertDialog type constraints (string-only message).

**Rationale**: Extends focus activation from Compass to Project Hub. Preference-only update, does NOT create tasks.

---

### S1-2a — Daily Check-in v0 (Energy/Why/Top Focus) — ✅ IMPLEMENTED

**Completed**: 2025-12-27

Evidence:

- Commits: **cbc8092**, **21afa8c**, **d1b8169**, **40dc867**, **6b525ed**, **0bd651e**, **52b9305**, **c728e28**
- Files changed: `dailyCheckInStore.ts` (NEW), `DailyCheckInBanner.tsx` (NEW), `DailyCheckInModal.tsx` (NEW), `Layout.tsx`, `locales/*/common.json`

Changes Made:

- **Store**: Created dailyCheckInStore with 90-day retention, getTodayCheckIn(), saveCheckIn()
- **Banner**: Non-blocking prompt on app launch if no check-in today (hidden when focus active)
- **Modal**: 3-step form (Energy 1-5, Why text, Top Focus select/text)
- **Top Focus**: Reference-only (does NOT create/activate tasks), auto-selects first item
- **Persistence**: localStorage with safe migration pattern
- **CRITICAL FIX**: Unwrap parse() result wrapper (`parsed.data`) - `safeMigration.parse()` returns `{success: true, data: {...}}`, not raw object

QA Checklist:

- [x] First launch: banner shows (if no check-in today)
- [x] Focus active: banner hidden
- [x] Save check-in: banner disappears
- [x] **Relaunch: banner does NOT show if check-in exists (FIXED persistence bug)**
- [x] No projects: "Other / Quick text" works
- [x] Dismiss: hides until next launch
- [x] Auto-select: first item shown clearly, 1-click to change

Known Limitations:

- No analytics/trends in v0
- No "View past check-in" UI
- Midnight rollover requires navigation/reload

---

### S1-2b — Activate First / Focus First Workflow — ✅ IMPLEMENTED

**Completed**: 2025-12-27

Evidence:

- Commit: **7a39b02** — "S1-2b: activate first / focus first workflow"
- Files changed: `dailyCheckInStore.ts` (+36 lines), `CompassPage.tsx` (+160 lines), `locales/*/compass.json`

Changes Made:

- **Focus First Card**: Inline card at top of Compass left column (Compass-first approach)
- **3-Step Flow**: Pick focus (project/task/text) → Quick win (optional) → Start Focus
- **Pre-fill from Check-in**: If today's check-in exists, pre-fills from `topFocus` fields
- **Update Check-in**: `updateTodayTopFocus()` updates or creates minimal check-in with selected focus
- **WIP Enforcement**: If WIP at 3/3, button disabled unless selecting existing active task
- **Timer Integration**: Starts `focusTimerStore.startWithTask()` with context from selection

QA Checklist:

- [x] Focus First card visible at top of Compass left column
- [x] Mode toggle (Select project vs Type manually) works correctly
- [x] Text inputs for focus and quick win work
- [x] Start Focus button starts timer with correct task context
- [x] Card shows active state with "Focus Active" badge when timer running
- [x] Timer pill in header shows focus task title
- [x] No console errors during interaction

Design Decisions:

- **Compass-first, not Project Hub**: Entry point is Compass (user lands here to execute)
- **Micro-step resets each session**: No persistence, stored only in `sessionGoal` when timer starts
- **Project Hub button deferred to S1-2c**: Keeps this sprint minimal

**Rationale**: Reduces friction between check-in and execution. Enforces "decide once, execute immediately" pattern.

---

### S1-1 — WIP Limit + Distraction Shield — ✅ DONE

**Completed**: 2025-12-26

Evidence:

- Commit: **0dac83d** — "S1-1: enforce WIP limit and add distraction shield"
- Files changed: `config/guardrails.ts` (NEW), `components/focus/BlockedRouteToast.tsx` (NEW), `components/focus/DistractionGuard.tsx`, `stores/projectHubTasksStore.ts`, `locales/*/focus.json`

Changes Made:

- **Config**: Created `config/guardrails.ts` with MAX_ACTIVE_ITEMS=3 constant + route policies
- **WIP Limit**: projectHubTasksStore now imports from shared config
- **Distraction Shield**: DistractionGuard now checks route policy (blocked/allowed/prompt)
- **Route Policies** (during active focus session):
  - **BLOCKED**: `/`, `/dashboard`, `/launcher`, `/activity`, `/media-suite`, `/initiator`
    - **Rationale for /dashboard**: Dashboard is review/analytics UI; during focus, user should execute in `/compass`, not review metrics
  - **ALLOWED**: `/compass`, `/refocus`, `/refocus/lost`, `/login`
    - **Rationale**: Compass is execution UI, Refocus is rescue flow, both support active focus work
  - **PROMPT**: `/settings`, unknown routes
    - **Rationale**: Settings may be needed mid-focus (e.g., adjust timer config); prompt gives user choice to pause/end/continue
- **UI**: BlockedRouteToast shows when blocked route attempted

QA Checklist:

- [x] Focus active => click Dashboard => toast shows, no navigation (BLOCKED)
- [x] Focus active => click Media Suite => toast shows, no navigation (BLOCKED)
- [x] Focus active => click Refocus => navigates silently (ALLOWED)
- [x] Focus active => click Settings => modal with Pause/End/Continue (PROMPT)
- [x] Focus NOT active => any navigation works normally
- [x] Ctrl+K (command palette) works during focus
- [x] WIP limit enforced: Cannot add 4th active task from Project Hub
- [x] WIP limit verified: State remains with only 3 active tasks

---

### S0-2 — Media job history pagination/performance — ✅ DONE

**Completed**: 2025-12-26

Evidence:

- Commit: **c8bffa8** — "S0-2: paginate media job history for performance"
- Files changed: `media-jobs.cjs`, `main.js`, `preload.cjs`, `global.d.ts`, `MediaSuitePage.tsx`
- Test script: `scripts/generate-test-history.js`

Changes Made:

- **Backend**: Added `getRecentHistory(limit, offset)` with reverse JSONL reader (reads from end of file)
- **Startup optimization**: `loadHistory()` now scans only 2000 recent entries for active jobs (not full file)
- **IPC**: Added `media:job:history` handler with pagination params
- **UI**: Added Load More button in History tab with loading state
- **Test harness**: Generator script creates 10k entries with automatic backup

QA Checklist:

- [x] Generate test data: `node scripts/generate-test-history.js --count 10000`
- [x] Backup created automatically (.backup file)
- [x] App starts without freeze (verified)
- [x] History tab shows 50 entries initially
- [x] "Load More" button visible and functional
- [x] Console shows `[history] Loaded X entries in Yms`

Known Limitations:

- `total` is null (unknown without full file scan) - by design for performance
- Edge case: extremely large files (>100k entries) may still be slow on lookup

---

### S0-1 — Safe migrations (backup + no reset on unknown schema) — ✅ DONE

Evidence:

- Commit: **c68d120** — "S0-1: QA closeout evidence (safe migrations verified)"
- QA Walkthrough: `walkthrough.md`
- Final Closeout Report: `s0-1_final_closeout_report.md`

Outcome (summary):

- FUTURE_VERSION: preserved data + FS backup + warning banner, no destructive reset
- CORRUPT payload: preserved data + FS backup + warning banner, no destructive reset
- v1→v2: backup-before-migration confirmed
- SchemaWarningBanner mounted globally

Known limitations / Backlog (NOT in S0-1):

- LexendDeca font decode warning
- ECharts DOM size warnings
- Repeated 429 requests / Firebase deprecation notices

---

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

| Milestone   | Goal          | Scope                                         | DoD                                                     |
| :---------- | :------------ | :-------------------------------------------- | :------------------------------------------------------ |
| **Alpha 1** | "It Runs"     | Shell, basic Nav, Settings UI (Read-only)     | App opens, navigates, theme toggles, no console errors. |
| **Alpha 2** | "Tokenized"   | Full Semantic Design System, Sidebar, Buttons | Visuals match reference 100%.                           |
| **Beta 1**  | "Media Ready" | Media Suite (Download/Queue)                  | Can accept URL and "mock" download process.             |
| **v1.0**    | "Migration"   | All modules at MVP parity with Legacy         | User can uninstall PowerShell scripts.                  |

---

## 5. Risk Register & Mitigations

| Risk            | Impact   | Mitigation                                                                                         |
| :-------------- | :------- | :------------------------------------------------------------------------------------------------- |
| **Data Loss**   | Critical | **Strict Rule**: No delete/write outside app sandbox. `_backup-reference` is strictly READ-ONLY.   |
| **Performance** | Medium   | Large log files (CSV) might lag UI. **Mitigation**: Paginated loading or virtualized lists.        |
| **Complexity**  | High     | Electron IPC boilerplate can get messy. **Mitigation**: Use typed IPC hooks and rigorous patterns. |

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

_(Template)_

### [Unreleased]

- Initial creation of Migration Plan.
- Setup of basic Semantic Token System.

### [0.12.0] - Media Suite Execution Core (Sprint 14) (2025-12-16)

- **Job Queue + State Machine**: Implemented persistent job queue with JSONL history file at workflowRoot/\_Media/JobHistory.jsonl
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
- **Safety**: Desktop mode saves to workflowRoot/\_Index/CompassSnapshots.jsonl; web/simulation uses localStorage; never crashes UI.
- **Status**: Sprint 11 complete; web/simulation mode live-tested, desktop mode code-verified (preload bridge + IPC handlers + backend module confirmed present and correctly wired).

### [0.10.0] - Compass File-Backed Snapshots (Backend) (2025-12-16)

- **Compass Snapshots Module**: Created electron/compass-snapshots.js for append-only JSONL persistence.
- **Storage Location**: Snapshots saved to workflowRoot/\_Index/CompassSnapshots.jsonl (append-only format).
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
- **Centralized ProjectLog**: Appends creation events to projectsRoot/\_Index/ProjectLog.jsonl (append-only JSONL format).
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
- **Electron Persistence**: workflow-blueprints.js with get/save to \_Index/WorkflowBlueprints.json.
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

### [DOC] - Product/UX Audit Completed (2025-12-17)

- **Audit Document**: Created `docs/PRODUCT_UX_AUDIT.md` with holistic finish-first flow evaluation.
- **Key Findings**: Dashboard noise, Launcher redundancy, Compass slider overload, timer-task disconnect.
- **Proposed Sprint 18**: Make Compass home, hide Launcher, reorder Compass sections (tasks above sliders).
- **No code changes** - documentation only.

### [0.9.0] - Sprint 18: Smoothness - Navigation Alignment (2025-12-17)

- **Compass as Home**: Changed index route from Dashboard to Compass for finish-first landing.
- **Dashboard Route**: Moved Dashboard to /dashboard route (still accessible for deep links).
- **Launcher Removed**: Removed Launcher NavItem from sidebar navigation (route still exists).
- **Compass Reordered**: Moved "Project Hub Tasks (Today)" to top of Compass left column (above Energy/Focus sliders).
- **Section Order**: Tasks -> Energy -> Focus Areas -> Sessions -> Snapshots for finish-first priority.
- **Files**: App.tsx (routing), Layout.tsx (nav removal + unused import cleanup), CompassPage.tsx (section reorder).
- **QA**: All P0 acceptance criteria verified - no regressions in timer, distraction shield, canvas panning, or Media Suite.

### [0.10.0] - Sprint 20: Standards-Workflow-Generator Integration (2025-12-17)

- **Project Model Extended**: Added categoryId, blueprintId, blueprintVersion, projectPath to Project interface.
- **Generator Blueprint Assignment**: Generator now loads blueprint categories on mount, maps template to category, assigns default blueprint to new projects.
- **Category Creation UI**: Added "+ Add" button to Standards tab for creating new categories with default blueprints.
- **Dynamic Category Dropdown**: Generator category dropdown now populated from blueprint store, shows step count.
- **Scaffolding Extended**: buildPlan/scaffold:create IPC now accept and write blueprint fields to project.meta.json.
- **Workflow Blueprint Rendering**: WorkflowCanvas dynamically loads blueprint based on active project's blueprintId (graceful fallback to static WORKFLOW_NODES).
- **Disk Import Enhanced**: projects-registry.js now parses categoryId/blueprintId/blueprintVersion from project.meta.json.
- **Refresh from Disk Button**: Added RefreshCw button in Project Hub header to scan projectsRoot and import projects.
- **Services Extended**: scaffoldingService now accepts blueprintOptions; workflowBlueprintRenderer service converts BlueprintNode[] to WorkflowNode[].
- **Files**: projectStore.ts, InitiatorPage.tsx, WorkflowCanvas.tsx, StandardsTab.tsx, scaffolding.js, main.js, projects-registry.js, scaffoldingService.ts, workflowBlueprintRenderer.ts.
- **QA Status**: Verified by user - category creation, blueprint assignment, and workflow rendering all working.

### [0.10.1] - Sprint 20.1: Project Indexing & Auto-Swap (2025-12-17)

- **Auto-Load Disk Projects**: Project Hub now auto-loads projects from projectsRoot on mount (no manual refresh needed).
- **Simplified Dropdown**: Shows only project name (parsed from YYMMDD_CatXXX_Name folder format). Removed "+ New Project" option.
- **Auto-Swap Workflow**: Switching project in dropdown automatically refreshes Workflow tab via key prop.
- **Blueprint Warning Banner**: Amber banner displayed in Workflow when project has no blueprintId.
- **Legacy Project Detection**: Folders without project.meta.json now detected, name parsed from folder naming convention.
- **Functional Preview**: Generator preview now shows real file tree from previewResult.plan instead of static mock.
- **Files**: InitiatorPage.tsx, WorkflowCanvas.tsx, projects-registry.js.
- **QA Status**: Implementation complete, pending user verification.

### [0.9.1] - Sprint 19: Finish-First Compass + Task-Timer Coupling + Density (2025-12-17)

- **Task-Timer Coupling**: Extended focusTimerStore with TaskContext (taskId, taskTitle, projectName, stepTitle) and startWithTask() function.
- **Timer UI Enhancement**: FocusTimerPill now displays linked task title instead of generic "Focus" label when task context is set.
- **Start Focus Button**: Added "Start Focus" button to each task in Project Hub Tasks list on Compass.
- **Switch Task Confirmation**: Prompts user if attempting to start focus on another task while session active.
- **Energy Simplification**: Replaced 0-10 slider with 3-state picker (Low/Medium/High) for faster daily calibration.
- **Focus Areas Collapsed**: Focus details now collapsed by default, showing derived score. Click to expand 6 sliders.
- **Sessions Removed**: Removed "Sessions Today" section from Compass (redundant, not task-tied).
- **Density Prop**: Added density prop to PageContainer (compact/normal/spacious) for consistent padding control.
- **Media Suite Density**: Applied compact density to Media Suite to reduce "too deep" padding.
- **Files**: focusTimerStore.ts (+TaskContext), FocusTimerPill.tsx (task label), CompassPage.tsx (complete rewrite), PageContainer.tsx (+density), MediaSuitePage.tsx (compact).
- **QA Note**: Browser-based QA unavailable due to navigation errors. Code review confirms all acceptance criteria met. Desktop manual QA recommended.

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

### [0.10.2] - Sprint 20.2: UI Polish & Robust Dialogs (2025-12-17)

- **Robust Dialogs**: Refactored `ConfirmDialog` and `AlertDialog` to use `React Portals` (`createPortal`), rendering them at `document.body` level. This permanently resolves z-index stacking context issues and parent container clipping.
- **UI Polish**: Relocated "Focus Score" badge to the left side of the Focus Details header for better scanability.
- **Code Quality**: Fixed unused variable lint errors in `scaffoldingService.ts` and `CompassPage.tsx`.
- **Theme Awareness**: Updated `Button` component to strictly use `primary-700` (Light) and `secondary-300` (Dark).
- **Files**: `ConfirmDialog.tsx`, `AlertDialog.tsx`, `CompassPage.tsx`, `scaffoldingService.ts`, `Button.tsx`.
- **QA Status**:
  - **Browser QA**: Verified "Stop Timer" dialog appears above all elements (PASS). Verified Focus Details UI layout (PASS).
  - **Desktop QA**: Verified file-backed features remain stable (PASS).

### [0.11.0] - Sprint 21: Workflow Overlay Panel + Progress Indicator (2025-12-17)

- **Progress Indicator**: Added `workflowProgress.ts` utility to calculate DoD-based completion percentage. Progress bar displays at top-left of Workflow canvas showing live progress (e.g., "51% (28/55)").
- **Overlay Side Panel**: Converted StepDetailPanel from fixed column to on-demand overlay. Panel appears on node click with blur/dim backdrop (`backdrop-blur-sm`). Click backdrop or press ESC to close.
- **ESC Key Handler**: Added keyboard handler to close overlay panel with Escape key.
- **Scroll Lock**: Prevents background scroll while overlay is open.
- **Horizontal Lanes (Dropped)**: Attempted horizontal phase lanes layout but reverted due to visual regression - broke card positioning and display. Keeping original vertical swimlanes.
- **Files**: `WorkflowCanvas.tsx`, `workflowProgress.ts` (NEW).
- **QA Status**:
  - **Browser QA**: Verified progress indicator shows correct DoD count (PASS). Verified overlay panel with blur (PASS). Verified ESC closes panel (PASS). Verified no regressions in panning/selection (PASS).
  - **Desktop QA**: Verified file-backed persistence stable (PASS).

### [0.11.1] - Sprint 21.1: Workflow Horizontal View + Toggle (2025-12-17)

- **View Toggle**: Added toggle button to switch between Swimlane (vertical columns) and Horizontal (phase rows) views. Default remains swimlane to preserve existing behavior. Toggle button shows view-specific icons (`LayoutGrid` for swimlane, `List` for horizontal).
- **Horizontal View - Left Sidebar**: Implemented left sidebar (~200px) containing two sections: "PHASES" (lists all 5 phases with node counts) and "STATUS PROJECT" (displays progress percentage, progress bar, and DoD completion count).
- **Horizontal View - Main Canvas**: Implemented horizontal phase rows layout where each phase is rendered as a horizontal row with cards flowing left-to-right. Cards display title, description, and status badges. Native horizontal scrollbar appears for long phase rows.
- **Shared Overlay Panel**: Overlay panel (from Sprint 21) works identically in both Swimlane and Horizontal views. Click any card in either view to open overlay with blur/dim backdrop. ESC key or backdrop click closes the overlay.
- **Progress Consistency**: Both views show the same progress data - Horizontal view shows it in sidebar, Swimlane shows it at top-left. Live DoD-based calculation ensures accuracy.
- **No Regressions**: Swimlane view preserved all original functionality (panning, connectors, phase headers, absolute positioning). Toggle seamlessly switches between views without state loss.
- **Files**: `WorkflowCanvas.tsx` (major refactor - conditional rendering based on `viewMode` state).
- **QA Status**:
  - **Browser QA**: Verified via user manual testing with screenshots. Horizontal view matches reference UX design (PASS). Toggle functional (PASS). Overlay works in both views (PASS). Progress accurate (PASS). No regressions to Compass/Media Suite (PASS).
  - **Evidence**: User-provided screenshots show horizontal layout with sidebar, phase rows, and functioning overlay panel. See `sprint21_1_browser_qa_report.md` for full QA documentation.

### [0.11.2] - Sprint 21.2: Horizontal Workflow Refinements (2025-12-18)

- **Arrow Enhancements**: Updated horizontal arrows between cards to use slight quadratic bezier curve (`Q 20 16`) instead of straight lines for visual appeal. Removed cross-lane arrows connecting phases per user request. Arrow markers properly sized (5x5) with direct connection to nodes.
- **Canvas Panning**: Implemented middle-click drag panning using mouse event handlers (`onMouseDown`, `onMouseMove`, `onMouseUp`, `onMouseLeave`). Cursor changes to `grabbing` during pan. Scroll behavior dynamically switches between 'smooth' and 'auto'. Works alongside touchpad/wheel scrolling.
- **Status Indicators**: Added colored status dots with labels to each card header (Done: green solid, WiP: amber with pulse animation, Todo: gray). Positioned at top-right of cards. Added Legend section in left sidebar showing all 3 status types with visual examples for quick reference.
- **Striped Dividers**: Implemented horizontal repeating-linear-gradient striped lines between phase rows using phase color at 20% opacity. Subtle thickness (h-1) provides non-intrusive visual separation.
- **Reopen/Undo Feature**: Added "Buka Kembali" button (secondary with RotateCcw icon) in StepDetailPanel footer for Done nodes. Allows reverting status from Done back to In Progress using `setNodeStatus('in-progress')`. Footer dynamically shows either "Tandai Selesai" (for Todo/WiP) or "Buka Kembali" (for Done) based on node status.
- **Toggle Removed**: Removed view toggle per user preference - horizontal view now the only mode. Eliminated swimlane view code, unused imports (`RotateCcw`, `WORKFLOW_EDGES`, `CANVAS_CONFIG`), pan-related state, nodePositions calculation, and WorkflowNodeCard component.
- **Files**: `WorkflowCanvas.tsx` (major simplification - removed toggle/swimlane code, added panning handlers and status indicators), `StepDetailPanel.tsx` (added `onReopenNode` prop and conditional footer).
- **QA Status**:
  - **Browser QA**: Verified via user manual testing. Arrows curved correctly (PASS). Cross-lane arrows removed (PASS). Middle-click panning functional (PASS). Status indicators clear with legend (PASS). Striped dividers subtle (PASS). Reopen button functional for Done nodes (PASS).
  - **Evidence**: User provided annotated screenshots showing desired arrow styles and confirmed all refinements working as expected.

### [0.12.0] - Sprint 21.3 Phase 1: Folder Templates Foundation (2025-12-18)

- **FolderTemplate Type**: Added `FolderTemplate` interface to `workflowBlueprints.ts` with `id`, `name`, and `folders: string[]` (flat path strings). Added `FolderTemplatesFileShape` for file persistence with `schemaVersion`, `templates`, and `updatedAt`.
- **Blueprint Extension**: Added optional `folderTemplateId?: string` field to `WorkflowBlueprint` interface. Backward compatible - existing blueprints still work.
- **Service Layer**: Created `workflowFolderTemplatesService.ts` with same pattern as workflowBlueprintsService: Electron bridge with localStorage fallback, load/save functions, and CRUD helpers.
- **Seeded Defaults**: 6 folder templates pre-seeded: General Creative, Brand Design Standard, ArchViz (SketchUp + D5), Web Development, App Development, Content Creator.
- **TypeScript Declarations**: Added `folderTemplates` API to `global.d.ts` for Electron bridge support.
- **Files**: `src/types/workflowBlueprints.ts`, `src/services/workflowFolderTemplatesService.ts` (NEW), `src/types/global.d.ts`.
- **QA Status**: Pending UI implementation in Phase 3.

### [0.12.1] - Sprint 21.3 Phase 2: Set Default Blueprint (2025-12-18)

- **Default Blueprint Selector**: Added dropdown in Standards Tab category section to set default blueprint per category. When a category is selected, shows all blueprints for that category with version numbers. Selection updates `defaultBlueprintId` and marks form dirty for save.
- **UI Enhancement**: Category buttons refactored to div containers with nested button for category name and conditional dropdown. Shows step count when collapsed, dropdown when expanded.
- **Generator Integration**: Verified Generator already uses `selectedBlueprint` which resolves from category's `defaultBlueprintId` - changes take effect automatically when blueprints are saved.
- **Files**: `src/pages/StandardsTab.tsx` (refactored category list UI).
- **QA Status**: Functional - dropdown appears when category selected.

### [0.12.2] - Sprint 21.3 Phase 3: Folder Templates UI (2025-12-18)

- **Templates List**: Added folder templates section below Categories in Standards Tab left column. Shows all templates with folder count, click to select for editing.
- **Create Template**: "+ Add" button opens inline form. Enter name + press Enter or click Create. Auto-generates ID, seeds with default folders.
- **Template Editor**: When template selected, shows inline editor with: template name header, delete button (with confirm), folder path list with up/down/remove buttons, add folder button, and save button.
- **Folder Management**: Each folder path is editable inline. ChevronUp/ChevronDown for reordering, X to remove. "Add Folder" appends new entry.
- **Persistence**: Save Templates button appears when dirty. Saves to localStorage (web) or file (desktop via Electron bridge when wired).
- **Files**: `src/pages/StandardsTab.tsx` (major additions - ~200 lines), imports from `workflowFolderTemplatesService.ts`.
- **QA Status**: UI functional in browser - templates load, CRUD works, save persists to localStorage.

### [0.12.3] - Sprint 21.3 Phase 4: Generator Integration (2025-12-18)

- **buildPlan Enhancement**: Modified `electron/scaffolding.js` to accept `folderTemplateFolders` parameter. When provided, creates those folders instead of hardcoded template-based structures. Falls back to legacy behavior for backward compatibility.
- **IPC Handlers**: Updated `scaffold:preview` and `scaffold:create` handlers in `main.js` to pass `folderTemplateFolders` from renderer to buildPlan.
- **Service Interface**: Extended `IScaffoldingService` in `scaffoldingService.ts` with `folderTemplateFolders` in `preview()` and `scaffold()` method signatures.
- **TypeScript Declarations**: Updated `global.d.ts` scaffold types to include `folderTemplateFolders?: string[]` parameter.
- **Backward Compatible**: Existing projects without folder templates continue to use hardcoded folders based on templateId.
- **Files**: `electron/scaffolding.js`, `electron/main.js`, `src/services/scaffoldingService.ts`, `src/types/global.d.ts`.
- **QA Status**: Ready for integration testing - scaffolding accepts folder templates from blueprints.

### [0.12.4] - Sprint 21.3 Phase 5: Real Generator Preview (2025-12-18)

- **Preview Enhancement**: `handlePreview` now resolves `folderTemplateFolders` from blueprint's `folderTemplateId` and folder templates data, passes to `scaffoldingService.preview()`.
- **Generate Enhancement**: `handleGenerate` similarly resolves and passes `folderTemplateFolders` to `scaffoldingService.scaffold()`.
- **Fixed Folder Tree Display**: Changed `item.kind === 'directory'` to `item.kind === 'dir'` to correctly match scaffolding.js output format.
- **No More Mockups**: Preview now shows actual folder structure that will be created, not static placeholder folders.
- **Files**: `src/pages/InitiatorPage.tsx` (handlePreview, handleGenerate, folder tree render logic).
- **QA Status**: Ready for manual verification - preview should show real folder templates when blueprint has folderTemplateId set.

### [0.12.5] - Sprint 21.3 Phase 6: Structural Editing & Phases (2025-12-18)

- **Collapsible Phases**: Phase headers in blueprint editor are now clickable to expand/collapse. Shows ChevronRight (collapsed) or ChevronDown (expanded) with step count.
- **Bugfix**: Fixed collapse logic by tracking `collapsedPhases` instead of `expandedPhases` - prevents edge case where collapsing last phase expanded all others.
- **Per-Blueprint Phases**: Added `WorkflowPhaseDefinition` interface and optional `phases[]` field to `WorkflowBlueprint`. Blueprints can override default phases.
- **Default Phase Sets**: Added 4 phase sets to `workflowData.ts`: General Creative, Development, Content Creator, Admin/Ops. Each with 5 phases and appropriate colors.
- **Add Step**: Each phase section has "+ Add Step" button. Creates new step with default values, auto-selects for editing.
- **Delete Step**: Hover over step shows trash icon. Click shows confirmation dialog. Deletes from nodes array with version increment.
- **Reorder Steps**: Hover over step shows up/down arrows. Swaps position in nodes array. Disabled at boundaries.
- **Files**: `src/types/workflowBlueprints.ts`, `src/pages/workflowData.ts`, `src/pages/StandardsTab.tsx`.
- **QA Status**: ✅ Verified - collapse/expand working correctly, add/delete/reorder steps functional.

### [0.12.6] - i18n Phase 3: Stabilization + Workflow Card Localization (2025-12-22)

- **Refocus Label Leak Verification**: Verified all mental state labels (Overwhelmed/Restless/Avoiding/Foggy) already use `t()` with STATE_KEY_MAP pattern. FlowStateRadar:161, CustomProtocolCreator:221, RefocusInsights:129 all correctly wrapped.
- **Grep Verification**: Confirmed 0 direct `{config.label}`, `{state.label}`, `{segment.config.label}` renders in UI - all go through t() with fallbacks.
- **Workflow Card i18n Implementation**: Extended `WorkflowNode` interface with optional `titleKey` and `descKey` fields for i18n support.
- **workflowData.ts Updates**: Added titleKey/descKey to all 8 default WORKFLOW_NODES (p1-p3, e1-e3, f1-f2) with `initiator:workflow.steps.*` namespace.
- **WORKFLOW_PHASES Updates**: Added optional `labelKey` field to phase configuration array (5 phases: planning, design, frontend, backend, ops) with `initiator:workflow.phases.*` namespace.
- **Render Site Updates**: WorkflowCanvas.tsx and StepDetailPanel.tsx now use conditional `node.titleKey ? t(node.titleKey, node.title) : node.title` pattern for backward compatibility.
- **Translation Keys Added**:
  - EN/ID `initiator.json`: Added `workflow.phases{}` object (7 phase labels) and `workflow.steps{}` object (8 steps with title + desc).
  - Fixed duplicate key lint errors by renaming old string keys to `phasesLabel` and removing legacy `planning/execution/finalize` string duplicates.
- **Date Locale Fixes**: Fixed 2 remaining hardcoded 'en-US' references:
  - ActivityPage.tsx:197 - formatTime() now uses dateLocale
  - CompassPage.tsx:953 - Snapshot timestamp now uses dateLocale
  - MediaSuitePage.tsx:228-230 - Added i18n + dateLocale variables
- **Files Modified**: workflowData.ts, WorkflowCanvas.tsx, StepDetailPanel.tsx, RefocusPage.tsx, MediaSuitePage.tsx, ActivityPage.tsx, CompassPage.tsx, InitiatorPage.tsx, locales/en/initiator.json, locales/id/initiator.json, locales/en/refocus.json, locales/id/refocus.json.
- **Total Impact**: 15 date locale fixes across session, 100+ translation keys added, workflow cards now fully i18n-capable.
- **Evidence**: Static grep verification showed 0 label leaks, viewModes pattern verified correct (value='daily', label=t()).
- **Status**: Refocus and workflow card i18n complete. Date formatting now consistently uses i18n-aware locale pattern.

### [DOC] - i18n Phase 4: UI/UX Stability Audit (2025-12-22)

- **Comprehensive Static Audit**: Conducted grep audit across entire codebase to identify remaining EN leaks, day/month hardcoding, and translation key leak patterns.
- **Findings Summary**: 6 remaining EN leaks identified:
  - Dashboard: WeeklyActivityChart.tsx:35 - Hardcoded `['Su','Mo','Tu','We','Th','Fr','Sa']` day array
  - Compass: CompassPage.tsx:917 - "Saving to local files" hardcoded status text
  - Activity: ActivityPage.tsx:456 - "Today's Focus (Minutes)" hardcoded chart title
  - Templates: FolderTemplateEditorModal.tsx:167,289 - "New Template" and search placeholder hardcoded
  - Standards: StandardsTab.tsx:922 - "New Blueprint" button hardcoded
- **Fix Strategy**: Created implementation_plan.md with surgical fixes: replace hardcoded day array with `Intl.DateTimeFormat(dateLocale, { weekday: 'short' })` pattern, wrap all remaining strings with `t('namespace:key', 'fallback')`.
- **Locale Keys Required**: compass.json (status.savingToFiles/simulationMode), activity.json (charts.todaysFocusMinutes), initiator.json (standards.newBlueprint), modals.json (templateEditor.searchPlaceholder).
- **Not Addressed**: StandardsTab context menu items (grep found no hardcoded strings - likely already use t()), ActivityHeatmap month labels (already uses Intl.DateTimeFormat correctly).
- **Guardrails Established**: 4 non-negotiable rules documented: (1) Translate labels, never identifiers, (2) Always use t() with fallbacks, (3) All dates use dateLocale pattern, (4) viewModes regression test via grep.
- **Implementation Status**: Audit complete, implementation plan approved by user, awaiting execution.
- **Files Created**: docs/implementation_plan.md (artifact), stability_report.md (artifact).

### [0.12.7] - i18n Phase 4: UI Leak Elimination + Regression Guardrails (2025-12-22)

- **Dashboard WeeklyActivityChart**: Replaced hardcoded `['Su','Mo','Tu','We','Th','Fr','Sa']` array with `Intl.DateTimeFormat(dateLocale, { weekday: 'short' })` for locale-aware day labels.
- **Activity Page**: Localized "Today's Focus (Minutes)" chart title using `t('activity:charts.todaysFocusMinutes')` with fallback.
- **Compass Page**: Localized storage status "Saving to local files" / "Simulation Mode" using `t('compass:status.*')` pattern.
- **Standards Tab**: Localized "New Blueprint" button using `t('initiator:standards.newBlueprint')`.
- **Locale Keys Added**:
  - EN: activity.json (todaysFocusMinutes, weeklyTotal), compass.json (status section), initiator.json (standards.newBlueprint)
  - ID: Same keys with Indonesian translations ("Fokus Hari Ini (Menit)", "Menyimpan ke file lokal", "Blueprint Baru")
- **Automated Leak Detection**: Created `scripts/check-i18n-leaks.js` using ripgrep to detect hardcoded EN strings and translation key leaks in TSX files.
- **Verification**: Static grep checks confirm 0 leaks for all fixed patterns (weekday arrays, "Today's Focus", "Saving to local files", "New Blueprint").
- **Regex Patterns**: Script checks for 10 leak patterns including hardcoded EN phrases and raw translation keys (viewModes._, mentalStates._, workflow.steps.\*).
- **Not Addressed**: StandardsTab context menu items already use `t()` (verified), ActivityHeatmap months already use Intl (verified).
- **Files Modified**: WeeklyActivityChart.tsx, ActivityPage.tsx, CompassPage.tsx, StandardsTab.tsx, 6 locale JSON files (EN/ID for activity, compass, initiator).
- **Files Created**: scripts/check-i18n-leaks.js, docs/UI_UX_STABILITY_QA.md.
- **QA Status**: Implementation complete; awaiting user visual QA using checklist in UI_UX_STABILITY_QA.md.

### [0.12.8] - i18n Phase 5: Blueprint Templates + Settings External Tools (2025-12-23)

- **TemplatePickerModal i18n**:
  - Replaced hardcoded `CATEGORY_LABELS` with `CATEGORY_KEYS` map pointing to locale keys
  - Category labels now use `t(CATEGORY_KEYS[category])` → "Kreatif", "Pengembangan", "Umum"
  - Phase/step count format uses `t('initiator:templatePicker.phaseStepCount', { phases, steps })` → "5 fase · 10 langkah"
  - Button text localized: "Salin Prompt AI", "Tersalin!", "Impor", "Batal"
  - Show/Hide hidden toggle: "Tampilkan Tersembunyi (N)" / "Sembunyikan"
  - Tooltips: "Pulihkan template" / "Sembunyikan template"
  - Empty state: "Tidak ada template cocok \"{{query}}\""
- **Settings StatusBadge i18n**:
  - Refactored `StatusBadge` component to accept `t` function prop
  - Created `getStatusLabel()` helper with switch statement for all 6 status types
  - Status labels now use `t('settings:engineStatus.*')` keys
  - Labels: "Tidak Diketahui", "Siap (Terkonfigurasi)", "Siap (System PATH)", "Peringatan (Fallback)", "Hilang", "Error"
- **Locale Keys Added**:
  - EN/ID initiator.json: `templatePicker.categories.*`, `templatePicker.phaseStepCount`, `templatePicker.copied`, `templatePicker.showHidden`, `templatePicker.hideHidden`, `templatePicker.restoreTemplate`, `templatePicker.hideTemplate`, `templatePicker.noResults`
  - EN/ID initiator.json: `blueprints.templates.*` (8 template names - preserved for future nameKey pattern)
  - ID settings.json: `engineStatus.*` keys already present
- **Guardrail Script**: `node scripts/check-i18n-leaks.js` passes with exit 0
- **Browser QA**:
  - Template Picker: Categories (KREATIF/PENGEMBANGAN/UMUM), counts (X fase · Y langkah), buttons verified ✅
  - Settings page: Health status badges show "Tidak Diketahui" ✅
  - Screenshots: template_picker_indonesian_1766428619732.png, settings_indonesian_1766428638147.png
- **task.md Updated**: Ticked Blueprint Templates, Media Suite, Cosmetics Modal, Leaderboard Modal, Settings External Tools
- **Files Modified**:
  - TemplatePickerModal.tsx (11 i18n changes)
  - SettingsPage.tsx (StatusBadge refactored with getStatusLabel)
  - locales/en/initiator.json (templatePicker + blueprints sections expanded)
  - locales/id/initiator.json (same)
- **Not Modified**: Template names remain hardcoded in blueprintTemplates.ts (nameKey pattern deferred - would require additional render site changes)
- **Status**: Complete. All target flows (Blueprint Templates Modal, Settings External Tools) now display Indonesian translations.

### [0.12.9] - i18n Phase 6: Alerts/Toasts Localization Sweep (2025-12-23)

- **MediaSuitePage**: Converted 33 `showToast()` calls from hardcoded English strings to `t('common:alerts.*')` keys with proper fallbacks and interpolation for dynamic values (count, filenames).
- **CompassPage**: Converted 3 `alert({})` dialog calls for snapshot save success/failure messages.
- **InitiatorPage**: Converted 2 `alert({})` calls for project creation success and project list refresh messages.
- **TemplatePickerModal**: Converted 2 native `window.alert()` calls for invalid blueprint file and JSON parse errors.
- **Locale Keys Added** (60+ keys in common.json EN/ID):
  - Core: success, error, info, warning, saved, saving, updated, deleted, copied, refreshed, queued, canceled, failed
  - Validation: invalidInput, invalidFile, noData, notAvailableInBrowser
  - Job Operations: jobQueued, jobCanceled, jobsQueued, jobsCanceled, filesSelected, filesAdded
  - Errors: failedWithReason, failedToEnqueueJob, failedToPickFile, failedToPickFiles, failedToPickFolder, failedToCancelJob, failedToCancelAllJobs, failedToOpenFolder, failedToUpdate
  - Media Suite Specific: pleaseEnterValidUrl, pleaseSelectSourceFile, convertJobQueued, downloadJobQueued, noFilesForBatchConvert, filePickerNotSupported, folderPickerNotAvailable, cancelNotAvailable, updateNotAvailable, openFolderNotAvailable
  - Project Operations: projectCreated, projectCreatedMessage, projectListRefreshed
  - Blueprint Operations: blueprintSaved, blueprintDeleted, phaseSaved, phaseDeleted, stepSaved, stepDeleted, maxPhasesReached, maxPhasesMessage
  - Compass: snapshotSaved, snapshotSaveFailed
  - Import: invalidBlueprintFile, failedToParseJson
- **Indonesian Translations**: All 60+ keys translated to Indonesian (e.g., "Tugas diantrekan", "Gagal memilih file", "Snapshot berhasil disimpan!")
- **Interpolation Support**: Dynamic messages use {{count}}, {{reason}} vars (e.g., "{{count}} tugas diantrekan", "Gagal: {{reason}}")
- **Files Modified**: MediaSuitePage.tsx, CompassPage.tsx, InitiatorPage.tsx, TemplatePickerModal.tsx, en/common.json, id/common.json
- **Files Created**: docs/I18N_ALERTS_SWEEP.md (inventory, keys list, QA checklist)
- **Status**: Complete. All 40+ alert/toast calls now use i18n with proper fallbacks.

### [0.12.10] - QC Pass: Pre-New User Guides Sprint (2025-12-23)

- **QC_REPORT.md**: Comprehensive quality control report covering 5 focus areas:
  - A) UI/UX Consistency: ✅ PASS - Design tokens, button states, scrollbars consistent
  - B) i18n Coverage: ⚠️ PARTIAL - Core flows translated, ~20 gaps in modals/data-driven content
  - C) Backend Services: ✅ PASS - Path traversal protection, job queue resilient
  - D) Data Persistence: ✅ PASS - localStorage with schema versioning, file persistence working
  - E) Performance: ✅ PASS - useMemo/useCallback in all major pages
- **RISK_REGISTER.md**: 10 identified risks with severity/likelihood/impact ratings and mitigations
- **QA_CHECKLIST_RELEASE.md**: Step-by-step manual verification checklist (19 test areas)
- **Architecture Documented**: 15 Electron backend modules, 18 frontend services, 10 Zustand stores
- **Security Audit**: Path traversal protection via assertPathWithin(), BACKUP_ROOT explicitly blocked
- **Verdict**: ⚠️ CONDITIONAL PASS - Ready for "New User Guides" sprint with i18n gaps as known issues

### [0.12.11] - Sprint 23: Data-Driven i18n nameKey Pattern (2025-12-23)

**Closes**: RISK_REGISTER Risk #1 (i18n data-driven leaks) + Risk #2 (Template name hardcoding)

- **Type Extensions**: Added optional `nameKey?: string` property to `WorkflowBlueprint` and `FolderTemplate` interfaces in `types/workflowBlueprints.ts`
- **Blueprint Templates** (`blueprintTemplates.ts`): Added `nameKey` to all 8 templates:
  - `initiator:templates.archvizStandard`, `brandDesign`, `motionGraphics`, `uiuxProject`
  - `initiator:templates.webDevelopment`, `appDevelopment`, `contentCreator`, `clientProject`
- **Folder Templates** (`workflowFolderTemplatesService.ts`): Added `nameKey` to all 9 templates:
  - `initiator:folderTemplates.*` keys for archvizStandard, brandDesignStandard, motionGraphics, uiuxProject, webDevelopment, appDevelopment, contentCreator, clientProject, generalCreative
- **Locale Keys Added** (26 keys in `initiator.json` EN + ID):
  - `templates.*`: 8 blueprint name translations
  - `folderTemplates.*`: 9 folder template name translations
  - `templateCategories.*`: creative, development, general (with ID translations)
- **Render Sites Updated** (3 locations):
  - `TemplatePickerModal.tsx:302`: `{template.nameKey ? t(template.nameKey, template.name) : template.name}`
  - `FolderTemplateEditorModal.tsx:307`: List view template name
  - `FolderTemplateEditorModal.tsx:354`: Header selected template name
- **Pattern**: Backward compatible - `nameKey` is optional, falls back to `name` if not present
- **Evidence**: BEFORE count: 8 raw `.name` renders, AFTER: 0 unlocalized template name renders

### [0.12.12] - Sprint 24: Local-First AI Suggestion Layer (2025-12-24)

**Feature**: Optional AI-powered blueprint enhancement suggestions

#### AI Service Layer (New)

- **`src/services/ai/AIProvider.ts`**: Interface + Zod schemas (schemaVersion: 1)
- **`src/services/ai/OllamaProvider.ts`**: HTTP client with 30s timeout, AbortController
- **`src/services/ai/MockProvider.ts`**: Deterministic test provider
- **`src/services/ai/prompts.ts`**: Structured prompts enforcing JSON-only response
- **`src/services/ai/index.ts`**: Factory function + exports

#### UI Components (New)

- **`src/components/ai/AIEnhanceButton.tsx`**: Trigger button with loading state
- **`src/components/ai/AISuggestionModal.tsx`**: Diff preview with checkboxes, Apply/Cancel

#### Settings Extension

- **`src/types/settings.ts`**: Added `AISettings` interface and `AIProviderType`
- **`src/stores/settingsStore.ts`**: Added `ai` defaults (enabled: false, provider: 'none')

#### Localization

- **EN**: 21 keys in `settings.json`, 17 keys in `initiator.json`
- **ID**: Complete translations for all AI keys

#### Documentation

- **`docs/AI_INTEGRATION.md`**: Setup guide, usage, architecture, troubleshooting

#### Safety Features

- Schema validation via Zod (invalid responses discarded)
- 30-second request timeout
- ID stability enforced (AI cannot change blueprint/node IDs)
- No direct disk writes by AI layer
- Graceful No-AI fallback when Ollama unavailable

#### UI Integration (Complete)

- **SettingsPage.tsx**: AI Suggestions card with enable toggle, provider dropdown, endpoint/model inputs, test connection
- **StandardsTab.tsx**: AIEnhanceButton in blueprint header (conditional on AI enabled), AISuggestionModal with apply handler
- **applyOps.ts**: Safe suggestion application with ID stability, key preservation, DoD deduplication

**QA Status**: Code complete, awaiting browser QA verification

---

## S3 — Daily Loop Polish (Thin Slices)

### S3-0a — Daily Check-in Completion State Fix — ✅ IMPLEMENTED

**Completed**: 2025-12-29

Evidence:

- Commit: **6c2e983** — "S3-0a: fix daily check-in completion + persona guard"
- Files: `DailyCheckInModal.tsx` (+1 line), `DailyCheckInBanner.tsx` (+8 lines)

**Problem**: "Set Today's Focus" flow created draft check-in but banner incorrectly hid after partial completion

**Solution**:

- DailyCheckInModal now sets `isComplete: true` when saving full check-in
- DailyCheckInBanner respects persona (Personal-only, no flicker)
- Draft check-ins (`isComplete: false`) keep banner visible until completion

**QA Results** (Manual verification):

- [x] T1: Banner shows on fresh start (Personal mode)
- [x] T2: Draft check-in (Set Focus) → banner still shows
- [x] T3: Complete check-in → banner hides + persists
- [x] T4: Business mode → banner never shows
- [x] Draft→Complete upgrade verified

**Known Issues**: None

---

### S3-0b — Plan From Daily Check-in (Compass) — ✅ IMPLEMENTED

**Completed**: 2025-12-29

Evidence:

- Commit: **cc0d102** — "S3-0b: add Daily Plan to Compass (combined WIP cap)"
- Files:
  - `dailyCheckInStore.ts` (+60 lines) - Plan model + functions
  - `taskGuardrail.ts` (rewritten) - Combined WIP count including plan tasks
  - `CompassPage.tsx` (+130 lines) - Daily Plan card UI
  - `locales/en/compass.json` (+25 lines) - i18n keys
  - `locales/id/compass.json` (+25 lines) - i18n keys

**Feature Summary**:

- Users can define a Daily Plan (Top Outcome + up to 3 Tasks) after completing check-in
- Plan card shown in Compass (Personal persona only)
- Combined WIP limit: Plan tasks share MAX 3 with Project Hub + Finish Mode
- Focus can be started directly from plan tasks (with session-switch confirmation)
- No silent truncation: add blocked when at limit with i18n message

**Key Implementation Decisions**:
| Aspect | Decision |
|--------|----------|
| WIP Counting | **Combined-cap** — Plan + Hub + Finish share MAX_ACTIVE_ITEMS (3) |
| Circular Imports | **Avoided** — Stores don't import taskGuardrail; guardrail imports from stores |
| Persona Guard | Personal only, plan card hidden in Business |
| Focus Integration | Uses `startWithTask()` with ephemeral TaskContext |

**QA Results** (Manual verification):

Core Tests:

- [x] T1: Personal + completed check-in → plan card visible
- [x] T2: Add 3 plan tasks (no Hub) → 4th blocked
- [x] T3: Click "Start Focus" on plan task → timer starts
- [x] T4: Reload app → plan persists
- [x] T5: Business mode → plan card hidden

WIP Bidirectional Tests:

- [x] E1: 3 Hub tasks → Compass → plan add blocked
- [x] E2: 3 Plan tasks → Hub → add blocked
- [x] E3: 2 Hub + 1 Plan → plan add blocked (combined = 3)
- [x] E4: Focus active → Start Focus from plan → confirm dialog appears
- [x] E5: Create 3 plan tasks → Project Hub → add task → blocked

Regression Tests:

- [x] R1: Old check-in without `plan` field → no crash, empty plan shown
- [x] R2: Save plan → close → reopen → plan persists

**Known Issues**: None

---

### S3-1 — Promote Daily Plan Tasks to Project Hub — ✅ IMPLEMENTED

**Completed**: 2025-12-29

Evidence:

- Commit: **2a629ea** — "S3-1: promote daily plan tasks to Project Hub (move semantics)"
- Files:
  - `CompassPage.tsx` (+50 lines) - handlePromotePlanTask with move semantics + UI button
  - `locales/en/compass.json` (+5 keys) - promote button labels and error messages
  - `locales/id/compass.json` (+5 keys) - Indonesian translations
- **Note**: Evidence reconciled on 2025-12-29. Original commit 7d6dcad was amended with commit hash update, resulting in final commit 2a629ea.

**Feature Summary**:

- Each Daily Plan task now has a "Promote" button → moves task to Project Hub
- **MOVE semantics**: Task removed from plan after successful promotion (total WIP unchanged)
- Pattern follows LostMode: uses synthetic stepId/dodItemId (`daily-plan`, `dp-{timestamp}-{index}`)
- WIP checked before promotion with i18n error if at limit
- Atomic-like: add to Hub first, remove from plan only on success
- No circular imports: UI calls both store APIs directly

**Implementation Pattern**:

```typescript
// Add to Hub first
const hubTask = addTaskToToday({
  stepId: "daily-plan",
  stepTitle: "Daily Plan",
  dodItemId: `dp-${Date.now()}-${index}`,
  dodItemLabel: taskText,
  projectName: planTopOutcome || "Daily Plan",
});

// Only remove from plan if Hub add succeeded
if (hubTask) {
  const newTasks = planTasks.filter((_, i) => i !== index);
  setPlanTasks(newTasks);
  handleSavePlan(planTopOutcome, newTasks);
}
```

**QA Results** (Manual verification):

Core Tests:

- [x] P1: Promote plan task → appears in Project Hub, removed from plan
- [x] P2: 3 plan tasks → promote 1 → 2 remain in plan, 1 in Hub (total still 3)
- [x] P3: WIP at limit → promote blocked with error alert
- [x] P4: Promotion failure → plan task unchanged (no data loss)
- [x] P5: Reload after promote → Hub task persists, plan updated
- [x] P6: Business mode → promote button hidden (Personal-only feature)

**Known Issues**: None

---

### S3-2 — Promote All Daily Plan Tasks — ✅ IMPLEMENTED

**Completed**: 2025-12-29

Evidence:

- Commit: **11e4973** — "S3-2: promote all daily plan tasks to Project Hub"
- Files:
  - `CompassPage.tsx` (+73 lines) - handlePromoteAllPlanTasks with partial failure handling + UI button
  - `locales/en/compass.json` (+7 keys) - success/partial/failure messages
  - `locales/id/compass.json` (+7 keys) - Indonesian translations

**Feature Summary**:

- Added "Promote All" button in Daily Plan card header (shown when tasks exist)
- Batch promotes all plan tasks to Project Hub with partial failure support
- If all succeed: plan becomes empty, all in Hub
- If some fail: only successful tasks removed from plan, failed tasks remain
- Shows appropriate alert: success (all), partial (N of M), or failure (none)

**Implementation**:

- Iterates through plan tasks, attempts to promote each
- Tracks successful/failed indices
- Updates plan to keep only failed tasks
- Force reloads Hub tasks after batch operation
- Reuses same S3-1 `addTaskToToday` API with synthetic IDs

**QA Results** (Manual verification):

Core Tests:

- [x] B1: 2 plan + 0 Hub → Promote All → 0 plan + 2 Hub (success alert)
- [x] B2: 2 plan + 1 Hub → Promote All → 0 plan + 3 Hub (success alert)
- [x] B3: 3 plan + 0 Hub → Promote All → WIP check works incrementally
- [x] B4: Partial failure simulation → failed tasks remain in plan (partial alert)
- [x] B5: All fail (WIP full) → all tasks remain in plan (failure alert)
- [x] B6: Business mode → Promote All button hidden (Personal-only)
- [x] B7: Reload after promote all → Hub tasks persist, plan updated

**Known Issues**: None

---

### S3-3 — Daily Plan Task Completion Checkboxes — ✅ IMPLEMENTED

**Completed**: 2025-12-29

Evidence:

- Commit: **a96e742** — "S3-3: plan task completion checkboxes"
- Files:
  - `dailyCheckInStore.ts` (+120 lines) - PlanTask model, migration, WIP filter, toggle/clear functions
  - `CompassPage.tsx` (+158/-89 lines) - Checkboxes, strikethrough, updated handlers, Clear Completed button
  - `locales/en/compass.json` (+6 keys) - Clear Completed, cannot promote done messages
  - `locales/id/compass.json` (+6 keys) - Indonesian translations

**Feature Summary**:

- Each Daily Plan task now has a checkbox for done/undone state
- Done tasks show strikethrough text and faded appearance
- Actions (remove/promote/focus) hidden for done tasks
- WIP count excludes done tasks (only active/undone count toward limit)
- "Clear Completed" button removes all done tasks with confirmation
- Promote/Promote All skip done tasks automatically

**Implementation**:

- **Data Model**: Changed `tasks: string[]` → `tasks: PlanTask[]` where `PlanTask = {id, text, done}`
- **Migration**: Non-destructive migration converts old `string[]` to `PlanTask[]` with `done: false`
- **FP1**: `saveTodayPlan()` validates max 3 ACTIVE tasks (not total)
- **FP2**: Normalizes tasks before saving (ensures consistent shape)
- **FP3**: UI `canAddPlanTask` counts only active tasks
- **WIP Filtering**: `getTodayPlanTaskCount()` returns `tasks.filter(t => !t.done).length`
- **Toggle**: Click checkbox calls `togglePlanTaskDone(taskId)`, updates store, refreshes UI
- **Clear**: Filters out done tasks, saves remaining to store

**QA Results** (Manual verification required):

Core Functionality:

- [ ] C1: Toggle done → checkbox updates immediately
- [ ] C2: Reload app → done state persists
- [ ] C3: Done task → strikethrough + faded (opacity-60)
- [ ] C4: 3 undone tasks → add blocked (WIP check)
- [ ] C5: 2 undone + 1 done (3 total) → can add 1 more ✅ CRITICAL
- [ ] C6: Mark task done → frees WIP slot immediately

Migration:

- [ ] M1: Old plan with `tasks: ["Task 1", "Task 2"]` → migrates to PlanTask[]
- [ ] M2: Old tasks default to `done: false`
- [ ] M3: No data loss (all task text preserved)

Clear Completed:

- [ ] CC1: "Clear Completed" button shows only when done tasks exist
- [ ] CC2: Click → confirmation dialog with count
- [ ] CC3: Confirm → only done tasks removed

Promote:

- [ ] P1: Done task → actions hidden (no promote button visible)
- [ ] P2: Promote All with 2 undone + 1 done → only 2 promoted
- [ ] P3: Try promote done via code → alert shown

Regression:

- [ ] R1: Add new task → creates with `done: false`
- [ ] R2: Remove task → works by ID
- [ ] R3: Focus start → works correctly
- [ ] R4: Business mode → plan card hidden

**✅ QA Complete (2026-01-01)**: All checklist items above executed manually — **All PASS**.  
Core (C1-C6), Migration (M1-M3), Clear Completed (CC1-CC3), Promote (P1-P3), Regression (R1-R4) verified successfully.  
See [Closeout Pack Walkthrough](file:///C:/Users/Surya/.gemini/antigravity/brain/ff9d2e4e-9cbe-467a-b21d-3eb397fcf4b8/walkthrough.md) for evidence.

**Known Issues**: None

---

### S4-0 — Workflow Action Hints (Read-Only) — ✅ IMPLEMENTED

**Completed**: 2025-12-29

Evidence:

- Commit: **321c7ba** — "S4-0: workflow action hints (read-only)"
- Files:
  - `workflowData.ts` (+8 lines) - Added actionHints field and seeded p2 node
  - `StepDetailPanel.tsx` (+24 lines) - Conditional rendering of hints section
  - `locales/en/initiator.json` (+1 line) - Action hints label
  - `locales/id/initiator.json` (+1 line) - Indonesian translation

**Feature Summary**:

- Workflow nodes can now have optional `actionHints?: string[]` field
- Step detail panel shows "Action Hints" section when hints exist
- Hidden when hints absent/empty (no visual clutter)
- Seeded 'p2' (Research & Brief) node with 4 example hints

**QA Results** (Manual verification):

- [x] H1: Hints visible for p2 node (4 hints displayed with numbers)
- [x] H2: Hints hidden for nodes without them (p1, e1, f1, etc.)
- [x] H3: Long text wraps properly (break-words applied)
- [x] H4: Hints display in array order (1, 2, 3, 4)
- [x] R1: DoD checklist still toggleable
- [x] R2: Node status colors work correctly
- [x] R3: Persona split unchanged

**Known Issues**: None

---

### S4-1 — Workflow Action Hints (Editable + Persisted) — ✅ IMPLEMENTED

**Completed**: 2025-12-29

Evidence:

- Commit: **f963325** — "S4-1: editable action hints in blueprint editor"
- Files:
  - `workflowBlueprints.ts` (+1 line) - Added actionHints field to BlueprintNode
  - `StandardsTab.tsx` (+93 lines) - Action hints editor UI and handlers
  - `locales/en/initiator.json` (+4 lines) - EN labels
  - `locales/id/initiator.json` (+4 lines) - ID labels

**Feature Summary**:

- BlueprintNode now has optional `actionHints?: string[]` field
- Standards editor has action hints section (add/edit/remove, max 6 hints)
- Hints persist in blueprint JSON via save/load flow
- Empty hints default to "" (not placeholder text)
- Flow verified: blueprint → project → workflow canvas → step detail panel

**QA Results** (Manual verification):

Editing Tests:

- [x] E1: Add hint → persists after reload
- [x] E2: Edit hint text → persists correctly
- [x] E3: Remove hint → persists removal
- [x] E4: Max 6 enforced → "Add Hint" button hidden at limit
- [x] E5: Empty actionHints → section hidden in detail panel

Data Flow:

- [x] F1: Edit in Standards → create project → workflow canvas shows hints
- [x] F2: Blueprint without hints → detail panel shows no hints section
- [x] F3: Static hints from S4-0 (p2 node) → still works as expected

Regression:

- [x] R1: DoD editing → unchanged, still works
- [x] R2: Tools editing → unchanged, still works
- [x] R3: Blueprint save/load → no data loss

**Known Issues**: None

---

### S4-2 — Action Hint → Add to Today Task — ✅ IMPLEMENTED

**Completed**: 2025-12-29

Evidence:

- Commit: **8149cdf** — "S4-2: add action hints to today task"
- Files:
  - `StepDetailPanel.tsx` (+94 lines) - Hash function, handler, Add to Today buttons
  - `locales/en/initiator.json` (+9 lines) - EN labels
  - `locales/id/initiator.json` (+9 lines) - ID labels

**Feature Summary**:

- Each action hint has "Add to Today" button in step detail panel
- Creates Project Hub Today Task with WIP enforcement (MAX 3)
- Duplicate prevention via stable hint key: `hint-${nodeId}-${hash(hintText)}`
- FP1: Deterministic string hash ensures stable keys across reorders
- Reuses existing DoD→Today Task APIs (addTaskToToday, canAddTask, isDodItemAlreadySentToday)

**QA Results** (Manual verification):

- [x] A1: Add hint → task appears in Project Hub Today
- [x] A2: Reload → task persists
- [x] A3: Duplicate → blocked + button shows "Added" (disabled)
- [x] A4: WIP full (3 tasks) → blocked with message
- [x] A5: Remove one task → can add hint again
- [x] R1: DoD send-to-today still works
- [x] R2: Action hints display unchanged

**Known Issues**: None

---

### S4-3 — Action Hints Reorder (Up/Down) — ✅ IMPLEMENTED

**Completed**: 2025-12-29

Evidence:

- Commit: **979166d** — "S4-3: reorder action hints"
- Files:
  - `StandardsTab.tsx` (+60 lines) - Reorder handlers + Up/Down buttons
  - `locales/en/initiator.json` (+2 lines) - Move labels
  - `locales/id/initiator.json` (+2 lines) - Indonesian

**Feature Summary**:

- Up/Down buttons per action hint in blueprint editor (StandardsTab)
- Move up swaps with previous, move down swaps with next
- Persists order via existing save pipeline (updateNodeField + auto-save)
- Disabled states: Up disabled on first, Down disabled on last, both disabled when only one hint
- Order verified in StepDetailPanel after reload and project creation

**QA Results** (Manual verification):

Reorder Tests:

- [x] R1: Add 3 hints (A, B, C), move B up → Order: B, A, C
- [x] R2: Move A down → Order: B, C, A
- [x] R3: Reload page → Order preserved
- [x] R4: Create project → workflow → step detail → Order: B, C, A

Edge Cases:

- [x] E1: Click Up on first → Disabled, no action
- [x] E2: Click Down on last → Disabled, no action
- [x] E3: Single hint → Both disabled

Regression:

- [x] RG1: Add/remove/edit hints → Still works
- [x] RG2: DoD/tools editing → Unchanged

**Known Issues**: None

---

## Historical Sprints Roadmap (Post-Phase 1)

### Sprint S0: Stabilize / Trust Fixes

#### S0-1: Safe Migrations (backup + no reset on unknown schema) ✅

**Completed**: 2024-12-26

**Summary**: Implemented backup-before-migration for all versioned persisted stores. Application no longer performs destructive reset when encountering unknown or newer schema versions.

**Changes Made**:

1. **New Module**: `src/services/persistence/safeMigration.ts`
   - `safeLoad<T>()` - Safe load with backup/warning on FUTURE_VERSION/CORRUPT
   - `createBackupSnapshot()` - FS-primary (Electron userData), localStorage fallback
   - Warning registry with React subscription support
   - Backup retention policy (10 per store)

2. **IPC Handlers**: `electron/main.js`
   - `schemaBackups:getPath` - Get backup directory path
   - `schemaBackups:create` - Create backup with metadata
   - `schemaBackups:list` - List backups for a store
   - `schemaBackups:read` - Read backup contents

3. **Stores Integrated** (6 total):
   - `projectStore.ts` (HIGH risk - v1→v2 migration)
   - `workflowProgressStore.ts` (HIGH risk)
   - `settingsStore.ts` (HIGH risk)
   - `compassSnapshotStore.ts` (MED risk)
   - `finishModeStore.ts` (MED risk)
   - `projectHubTasksStore.ts` (MED risk - legacy array migration)

4. **UI Component**: `src/components/SchemaWarningBanner.tsx`
   - Non-blocking amber banner for schema warnings
   - Shows affected stores, backup filenames, help text

**Behavior Changes**:

| Scenario                | Before                    | After                                         |
| ----------------------- | ------------------------- | --------------------------------------------- |
| FUTURE_VERSION detected | Reset to empty, data lost | Backup created, data preserved, warning shown |
| CORRUPT payload         | Reset to empty            | Backup of raw created, warning shown          |
| Migration needed        | Direct overwrite          | Backup BEFORE migrate, then migrate           |

**QA Checklist**:

- [x] Set `schemaVersion: 999` in `gesu-projects` → verify backup created, no data loss
- [x] Set invalid JSON in `gesu-projects` → verify backup exists, warning shown
- [x] Run v1→v2 project migration → verify backup created before migration

#### S0-2: Job History Pagination/Perf (future)

- **Risk**: Large job history has no pagination
- **DoD**: `getRecentJobs()` paginated, virtualized list in UI

---

### Sprint S1: Guardrails (future)

#### S1-1: MAX_ACTIVE_TASKS Constant

- Central constant defined and enforced in all task sources

#### S1-2: Distraction Shield Hardening

- Block navigation during focus, confirmation modal

---

### Sprint S2+: Feature Development (future)

- Persona Split
- Business Toolkit
- Website Integration Boundary
