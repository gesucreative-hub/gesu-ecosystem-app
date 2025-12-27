# Persona Split Architecture

**Version**: 1.0  
**Created**: 2025-12-27  
**Status**: Architecture Definition (DOCS ONLY)

---

## 1) Purpose & Non-Goals

### Purpose

This document defines the **architectural boundaries** for splitting Gesu Ecosystem into two personas:

1. **Personal** — Operating system for sustainable high performance
2. **Business** — Client/work pipeline, project management, CRM-like functions

The goal is to establish clear data ownership, navigation rules, and guardrail compatibility **before any implementation begins**.

### Non-Goals

This document does NOT:

- Implement any persona split logic (that is S2-1+)
- Change any existing application code
- Modify focus guardrails, WIP limits, or distraction shield behavior
- Require immediate i18n changes
- Define UI mockups or visual designs

---

## 2) Persona Definitions

### 2.1) Personal Persona

**Goal**: Operating system for sustainable high performance

**Philosophy**: Managing YOUR energy, focus, and wellbeing. The user is the subject.

| Feature           | Role                                |
| ----------------- | ----------------------------------- |
| Focus Timer       | Core self-management tool           |
| Refocus Protocols | Recovery/normal/push modes          |
| Daily Check-in    | Energy + why + focus intention      |
| Compass           | Daily task radar and prioritization |
| Activity Tracking | Session history, heatmaps           |

**Tagline**: "How am I doing? What should I focus on?"

### 2.2) Business Persona

**Goal**: Client/work pipeline & project lifecycle management

**Philosophy**: Managing WORK deliverables, client relationships, and project progress. The project is the subject.

| Feature         | Role                                |
| --------------- | ----------------------------------- |
| Project Hub     | Project registry, filtering, search |
| Workflow Canvas | Blueprint nodes, DoD tracking       |
| Standards Tab   | Blueprint & template management     |
| Generator       | Project creation/scaffolding        |

**Tagline**: "What needs to get done? What's the status?"

### 2.3) Why Two Personas?

| Problem                                                           | Solution                                   |
| ----------------------------------------------------------------- | ------------------------------------------ |
| Mixed context: self-care tasks mixed with client deliverables     | Separate navigation contexts               |
| Cognitive overload: too many modules visible at once              | Show only relevant modules per persona     |
| Scope creep during focus: business tasks distract from deep work  | Block persona switching during focus       |
| Future scaling: adding CRM/invoicing would clutter Personal space | Business persona absorbs new work features |

---

## 3) Data Boundaries

### 3.1) Entity Classification Matrix

| Entity/Store          | Persona                    | Notes                                       |
| --------------------- | -------------------------- | ------------------------------------------- |
| `focus-timer-state`   | Personal                   | Focus session management                    |
| `finish-mode-session` | Personal                   | Session reflection                          |
| `gesu-daily-checkin`  | Personal                   | Energy/why/focus check-in                   |
| `compass-snapshots`   | Personal                   | Daily priorities snapshot                   |
| `gesu-projects`       | **Shared**                 | Projects have `persona` field (see 3.2)     |
| `workflow-progress`   | Shared                     | DoD progress (follows project persona)      |
| `project-hub-tasks`   | Shared                     | Date-scoped tasks (follows project persona) |
| `gesu-settings`       | Shared                     | Global app config                           |
| `engine-status`       | Shared                     | Tool availability cache                     |
| `gesu.gamification.*` | Personal (OPTIONAL/FUTURE) | XP/leveling — not core S2 scope             |

### 3.2) Project Entity: Shared with Persona Field

**Locked Decision (A1)**: `gesu-projects` is NOT Business-only. Projects are Shared entities with a `persona` field.

**Schema Addition** (future S2-1):

```typescript
interface Project {
  id: string;
  name: string;
  displayName: string;
  blueprintId?: string;
  // ... existing fields ...

  persona: "personal" | "business"; // NEW: Required field
}
```

**Filtering Behavior**:

- Project Hub in Business mode → shows `persona: 'business'` projects
- Project Hub in Personal mode → shows `persona: 'personal'` projects (if any)
- Dashboard → respects `activePersona` context (see D4)

### 3.3) Bridging Rules: Explicit vs Automatic

**Locked Decision (A2)**: No automatic cross-context population. Explicit user action required.

| Action                                                          | Type          | Allowed? | Example                                                     |
| --------------------------------------------------------------- | ------------- | -------- | ----------------------------------------------------------- |
| User clicks "Set as Today's Focus" in Project Hub               | **Explicit**  | ✅ YES   | Business project becomes today's focus in Personal check-in |
| System auto-populates daily focus from recent Business projects | **Automatic** | ❌ NO    | Would violate cross-context boundary                        |
| User starts focus timer while viewing a Business project        | **Explicit**  | ✅ YES   | Timer context links to project (optional)                   |
| Business project deadline triggers Personal notification        | **Automatic** | ❌ NO    | Would violate cross-context boundary                        |
| User manually adds Business task to Compass radar               | **Explicit**  | ✅ YES   | User explicitly chose to bridge                             |

**Key Principle**: The user, not the system, decides when contexts merge.

### 3.4) Focus Session Bridging

**Locked Decision (D5)**: Focus sessions belong to Personal OS, but may explicitly link to a Business project/task.

| Scenario                                                    | Behavior                                    |
| ----------------------------------------------------------- | ------------------------------------------- |
| Start focus in Personal mode                                | Timer runs normally                         |
| Start focus while in Business mode                          | Timer runs, session is still Personal-owned |
| Link focus session to a Business project                    | Allowed via explicit user action            |
| Auto-log focus time to Business project without user action | NOT allowed                                 |

**Rationale**: You are always managing YOUR focus. The work you're focusing ON may be a Business project, but the focus session itself is Personal.

---

## 4) Navigation Boundaries

### 4.1) Route Classification

| Route           | Persona            | Notes                                   |
| --------------- | ------------------ | --------------------------------------- |
| `/`             | Context-dependent  | Redirects based on `activePersona`      |
| `/dashboard`    | **Active Persona** | Shows only current persona context (D4) |
| `/compass`      | Personal           | Daily task radar                        |
| `/activity`     | Personal           | Session history                         |
| `/refocus`      | Personal           | Focus protocols                         |
| `/refocus/lost` | Personal           | Lost mode recovery                      |
| `/initiator`    | Business           | Project Hub                             |
| `/media-suite`  | Shared             | Utility tool (D3)                       |
| `/settings`     | Shared             | Global config                           |
| `/login`        | Shared             | Auth                                    |

### 4.2) Active Persona Context

**Locked Decision (D2)**: Use a context variable `activePersona`, not URL prefixes.

**Implementation** (future S2-2):

```typescript
// Store: personaStore.ts
interface PersonaState {
  activePersona: "personal" | "business";
}
```

**Persistence**: localStorage key `gesu-active-persona`

**Benefits**:

- No route refactoring required
- Existing deep links continue to work
- Sidebar can filter visible routes based on context

### 4.3) Default Landing Pages

| Persona  | Landing Route |
| -------- | ------------- |
| Personal | `/compass`    |
| Business | `/initiator`  |

### 4.4) Persona Switching

| Method            | Implementation                             |
| ----------------- | ------------------------------------------ |
| Sidebar toggle    | Icon/button to switch personas             |
| Keyboard shortcut | TBD (e.g., `Ctrl+Shift+P`, `Ctrl+Shift+B`) |

**Constraint**: Switching is BLOCKED when `focusActive=true` (see Section 5).

---

## 5) Guardrails Compatibility

### 5.1) WIP Limit: Global MAX_ACTIVE_TASKS=3

**Locked Decision (D1)**: WIP limit is GLOBAL, not per-persona.

| Scenario                                    | Allowed?           |
| ------------------------------------------- | ------------------ |
| 2 Personal tasks + 1 Business task active   | ✅ YES (total = 3) |
| 3 Personal tasks + any Business task active | ❌ NO (exceeds 3)  |
| 0 Personal tasks + 3 Business tasks active  | ✅ YES (total = 3) |

**Rationale**: Cognitive load is human-wide. Allowing 3+3 defeats the purpose of WIP limits.

**Implementation Note**: `getRemainingSlots()` and `canAddTask()` remain unchanged in logic, just aware that tasks may be from either persona.

### 5.2) Distraction Shield: Unchanged

**Locked Decision (A4)**: Persona split does NOT change existing Focus guardrail policy.

| Route Policy | Behavior During Focus          | Change in S2? |
| ------------ | ------------------------------ | ------------- |
| `blocked`    | Navigation denied, toast shown | NO CHANGE     |
| `allowed`    | Navigation permitted silently  | NO CHANGE     |
| `prompt`     | DistractionModal shown         | NO CHANGE     |

**Route Policies Remain**:

| Route                                      | Policy    |
| ------------------------------------------ | --------- |
| `/dashboard`, `/initiator`, `/media-suite` | `blocked` |
| `/compass`, `/refocus`, `/refocus/lost`    | `allowed` |
| `/settings`, `/activity`                   | `prompt`  |

### 5.3) Persona Switch During Focus: BLOCKED

When `focusActive=true`:

| Action                                      | Result                                                      |
| ------------------------------------------- | ----------------------------------------------------------- |
| Attempt to switch from Personal to Business | **BLOCKED**                                                 |
| Attempt to switch from Business to Personal | **BLOCKED**                                                 |
| Toast message                               | "Complete your focus session first" or localized equivalent |

**Rationale**: Prevents scope creep mid-focus. If you're focusing, stay in your current context.

### 5.4) Focus Timer: Remains Global Singleton

No changes. One timer instance, one active session at a time.

---

## 6) Migration Phases

### Phase S2-1: Data Tagging

**Scope**: Add `persona` field to Project entity, default migration

**DoD**:

- [ ] `Project` interface includes `persona: 'personal' | 'business'`
- [ ] Schema migration assigns existing projects to `'business'` (safe default)
- [ ] UI unchanged (no filtering yet)

**What NOT to Do**:

- Do NOT change UI or routes
- Do NOT add persona switching UI
- Do NOT modify focus guardrails

---

### Phase S2-2: Persona Context Variable

**Scope**: Add `activePersona` store, persist to localStorage

**DoD**:

- [ ] `personaStore.ts` created with `activePersona` state
- [ ] Persisted to `gesu-active-persona` localStorage key
- [ ] No UI visible changes yet (store only)

**What NOT to Do**:

- Do NOT add sidebar persona toggle yet
- Do NOT filter routes or data yet

---

### Phase S2-3: UI Separation

**Scope**: Sidebar filtering, landing page routing, persona toggle UI

**DoD**:

- [ ] Sidebar shows routes based on `activePersona`
- [ ] Root `/` redirects to persona-appropriate landing
- [ ] Persona toggle button in sidebar/header
- [ ] Dashboard shows only active persona data (D4)

**What NOT to Do**:

- Do NOT duplicate components
- Do NOT create separate apps
- Do NOT break existing deep links

---

### Phase S2-4: Cross-Persona Guardrails

**Scope**: Enforce WIP across personas, block switch during focus

**DoD**:

- [ ] `canAddTask()` counts tasks from BOTH personas
- [ ] Persona switch blocked when `focusActive=true`
- [ ] Toast shown on blocked switch attempt

**What NOT to Do**:

- Do NOT relax existing guardrails
- Do NOT allow WIP=3+3

---

### Phase S2-5: QA & Polish

**Scope**: End-to-end testing, regression verification

**DoD**:

- [ ] All acceptance tests pass (see Section 7)
- [ ] No S1 regressions (focus loop, check-in, guardrails)
- [ ] i18n keys added for new persona labels/toasts

**What NOT to Do**:

- Do NOT ship without full QA
- Do NOT skip acceptance test checklist

---

## 7) Acceptance Tests

These tests verify persona split without breaking existing focus loops.

### T1: Persona Context Persists Across Refresh

**Steps**:

1. Switch to Business persona
2. Navigate to multiple pages
3. Refresh browser

**Expected**: App reloads in Business mode (not reset to Personal)

---

### T2: WIP Limit is Global

**Steps**:

1. Activate 2 tasks in Personal context
2. Switch to Business context
3. Activate 1 task (total now 3)
4. Try to activate another task

**Expected**: 4th task activation blocked with WIP limit toast

---

### T3: Persona Switch Blocked During Focus

**Steps**:

1. Start focus timer (any context)
2. Attempt to switch persona via sidebar toggle

**Expected**: Switch blocked, toast shows "Complete your focus session first"

---

### T4: Default Landing Respects Persona

**Steps**:

1. Set `activePersona` to Personal, navigate to `/`
2. Set `activePersona` to Business, navigate to `/`

**Expected**:

- Personal → redirects to `/compass`
- Business → redirects to `/initiator`

---

### T5: Explicit Bridging Works

**Steps**:

1. In Business mode, open Project Hub
2. Click "Set as Today's Focus" on a Business project
3. Switch to Personal mode (when not focusing)
4. Open Daily Check-in

**Expected**: The Business project appears as today's focus

---

### T6: No Focus Loop Regression

**Steps**:

1. Complete full focus cycle: start → pause → resume → complete
2. Verify XP awarded (if gamification enabled)
3. Verify Activity page shows session
4. Verify Compass updates if task was linked

**Expected**: All existing focus behaviors work unchanged

---

### T7: Dashboard Shows Active Persona Only

**Steps**:

1. Have projects in both Personal and Business
2. Set `activePersona` to Personal, view Dashboard
3. Set `activePersona` to Business, view Dashboard

**Expected**: Dashboard widgets show only current persona's data

---

### T8: Shared Routes Accessible in Both Personas

**Steps**:

1. In Personal mode, navigate to `/settings`
2. In Business mode, navigate to `/settings`
3. Repeat for `/media-suite`

**Expected**: Shared routes accessible regardless of persona

---

## Appendix A: Decision Log

| ID  | Decision                                               | Rationale                                   |
| --- | ------------------------------------------------------ | ------------------------------------------- |
| D1  | WIP limit is GLOBAL MAX 3                              | Cognitive load is human-wide                |
| D2  | Use `activePersona` context variable, not URL prefixes | Minimal route changes, deep links preserved |
| D3  | Media Suite is SHARED                                  | It's a utility, not persona-specific        |
| D4  | Dashboard shows ACTIVE persona only                    | Reduces cognitive overload                  |
| D5  | Focus sessions are Personal, may link to Business work | You manage YOUR focus; work may be Business |
| A1  | Projects are Shared with `persona` field               | Both personas can have projects             |
| A2  | Explicit bridging only, no auto cross-context          | User decides when contexts merge            |
| A3  | XP/gamification is OPTIONAL/FUTURE                     | Not core S2 scope                           |
| A4  | Focus guardrails unchanged                             | Blocked/Allowed/Prompt policies remain      |

---

## Appendix B: Entity-Persona Quick Reference

```
┌─────────────────────────────────────────────────────────────┐
│                        SHARED                               │
│  ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐  │
│  │ gesu-projects   │ │ gesu-settings   │ │ engine-status │  │
│  │ (persona field) │ │                 │ │               │  │
│  └─────────────────┘ └─────────────────┘ └───────────────┘  │
│  ┌─────────────────┐ ┌─────────────────┐                    │
│  │workflow-progress│ │project-hub-tasks│                    │
│  └─────────────────┘ └─────────────────┘                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                       PERSONAL                              │
│  ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐  │
│  │focus-timer-state│ │finish-mode-sess │ │daily-checkin  │  │
│  └─────────────────┘ └─────────────────┘ └───────────────┘  │
│  ┌─────────────────┐                                        │
│  │compass-snapshots│  XP/Gamification (FUTURE)              │
│  └─────────────────┘                                        │
└─────────────────────────────────────────────────────────────┘
```

---

**End of Document**
