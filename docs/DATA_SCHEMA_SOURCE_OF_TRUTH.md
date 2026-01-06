# Gesu Ecosystem - Data Schema Source of Truth

> **Version**: 1.0  
> **Date**: 2026-01-06  
> **Status**: Authoritative Reference  
> **Purpose**: Single source of truth for all data models, persistence mechanisms, and schema contracts to enable future hybrid migration (local-first + Firestore sync).

---

## 1. Repo Snapshot

| Metadata         | Value                          |
| ---------------- | ------------------------------ |
| **Branch**       | main                           |
| **Commit**       | `0e86c86`                      |
| **Status**       | Dirty (modified files pending) |
| **Date**         | 2026-01-06                     |
| **Node Version** | v24.12.0                       |
| **pnpm Version** | 8.15.9                         |

### Workspaces

| Workspace      | Path                 | Description               |
| -------------- | -------------------- | ------------------------- |
| `gesu-shell`   | `apps/gesu-shell/`   | Main Electron + React app |
| `gesu-desktop` | `apps/gesu-desktop/` | Placeholder (empty)       |

---

## 2. System Data Map

### Persistence Mechanisms Overview

| Mechanism           | Location                                            | Use Case                           |
| ------------------- | --------------------------------------------------- | ---------------------------------- |
| **localStorage**    | Browser/Electron renderer                           | Primary store for 21 domain stores |
| **SQLite (sql.js)** | `workflowRoot/users/{userId}/gesu-database.db`      | Activity sessions, metrics         |
| **File System**     | `workflowRoot/_Index/`, `workflowRoot/gesu-config/` | Blueprints, templates, history     |
| **Firestore**       | Cloud (`users/{userId}/gamification/data`)          | Gamification sync + leaderboard    |

### Domain Map

| Domain                | Persona  | Store File(s)                                            | Persistence              | UI Pages                                          |
| --------------------- | -------- | -------------------------------------------------------- | ------------------------ | ------------------------------------------------- |
| **Projects**          | BUSINESS | `projectStore.ts`                                        | localStorage (v4)        | InitiatorPage, WorkflowCanvas                     |
| **Clients**           | BUSINESS | `clientStore.ts`                                         | localStorage (v1)        | ClientsPage, ClientDetailPage                     |
| **Invoices**          | BUSINESS | `invoiceStore.ts`                                        | localStorage (v1)        | InvoicesPage, InvoiceDetailPage                   |
| **Contracts**         | BUSINESS | `contractStore.ts`                                       | localStorage (v1)        | ContractsPage, ContractDetailPage                 |
| **Payments**          | BUSINESS | `paymentStore.ts`                                        | localStorage (v1)        | InvoiceDetailPage                                 |
| **Service Catalog**   | BUSINESS | `serviceCatalogStore.ts`                                 | localStorage (v1)        | PricelistPage                                     |
| **Deliverables**      | BUSINESS | `deliverableTemplateStore.ts`, `deliverablePackStore.ts` | localStorage (v1)        | DeliverableTemplatesPage, ProjectDeliverablesPage |
| **Business Profile**  | BUSINESS | `businessProfileStore.ts`                                | localStorage (v1)        | BusinessSettingsPage                              |
| **Focus Timer**       | PERSONAL | `focusTimerStore.ts`                                     | localStorage (v1)        | CompassPage, RefocusPage                          |
| **Compass**           | PERSONAL | `compassSnapshotStore.ts`                                | localStorage (v1)        | CompassPage                                       |
| **Daily Check-in**    | PERSONAL | `dailyCheckInStore.ts`                                   | localStorage (v1)        | DailyCheckInBanner                                |
| **Second Brain**      | PERSONAL | `secondBrainStore.ts`                                    | localStorage (v1)        | SecondBrainPage                                   |
| **Finish Mode**       | PERSONAL | `finishModeStore.ts`                                     | localStorage (v1)        | RefocusPage                                       |
| **Tasks (Hub)**       | BOTH     | `projectHubTasksStore.ts`                                | localStorage (v1)        | InitiatorPage                                     |
| **Gamification**      | BOTH     | `gamificationStore.ts`                                   | localStorage + Firestore | GamificationBadge, GamificationCard               |
| **Activity**          | PERSONAL | SQLite (`activity_sessions`)                             | SQLite                   | ActivityPage                                      |
| **Persona**           | BOTH     | `personaStore.ts`                                        | localStorage (raw)       | Layout (PersonaToggle)                            |
| **Settings**          | BOTH     | `settingsStore.ts`                                       | localStorage (v1)        | SettingsPage                                      |
| **Engine Status**     | BOTH     | `engineStatusStore.ts`                                   | localStorage (v1)        | SettingsPage                                      |
| **Workflow Progress** | BOTH     | `workflowProgressStore.ts`                               | localStorage (v1)        | WorkflowCanvas                                    |

---

## 3. Canonical Entity Catalog

### 3.1 Project

| Attribute          | Value                                  |
| ------------------ | -------------------------------------- | ------------ |
| **Storage Key**    | `gesu-projects-{userId}` (user-scoped) |
| **Schema Version** | 4                                      |
| **Primary Key**    | `id: string` (UUID v4)                 |
| **Persona Scope**  | BUSINESS (field: `persona: 'personal'  | 'business'`) |

#### Required Fields

```typescript
interface Project {
  id: string;
  name: string;
  type: "workflow" | "classic";
  persona: "personal" | "business";
  status: "active" | "archived" | "completed";
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}
```

#### Optional Fields

```typescript
{
  clientId?: string;         // FK to Client
  blueprintId?: string;      // FK to Blueprint
  description?: string;
  disk?: { path: string };   // Disk project reference
}
```

#### Relationships

- `clientId` → `Client.id` (many-to-one)
- `blueprintId` → `WorkflowBlueprint.id` (many-to-one)

#### Migration History

| Version | Migration                                   |
| ------- | ------------------------------------------- |
| v1 → v2 | Added `status` field                        |
| v2 → v3 | Added `persona` field (default: 'business') |
| v3 → v4 | Added `clientId` field                      |

---

### 3.2 Client

| Attribute          | Value                                 |
| ------------------ | ------------------------------------- |
| **Storage Key**    | `gesu-clients-{userId}` (user-scoped) |
| **Schema Version** | 1                                     |
| **Primary Key**    | `id: string` (UUID v4)                |
| **Persona Scope**  | BUSINESS                              |

#### Required Fields

```typescript
interface Client {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}
```

#### Optional Fields

```typescript
{
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
}
```

#### Relationships

- One-to-many: `Client` → `Project[]` (via `Project.clientId`)
- One-to-many: `Client` → `Invoice[]` (via `Invoice.clientId`)
- One-to-many: `Client` → `Contract[]` (via `Contract.clientId`)

---

### 3.3 Invoice

| Attribute          | Value                                  |
| ------------------ | -------------------------------------- |
| **Storage Key**    | `gesu-invoices-{userId}` (user-scoped) |
| **Schema Version** | 1                                      |
| **Primary Key**    | `id: string` (UUID v4)                 |
| **Persona Scope**  | BUSINESS                               |

#### Required Fields

```typescript
interface Invoice {
  id: string;
  number: string; // Generated via documentNumberingService
  status: "draft" | "sent" | "paid" | "cancelled";
  lineItems: LineItem[];
  subtotal: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}
```

#### Optional Fields

```typescript
{
  clientId?: string;
  projectId?: string;
  adjustments?: number;
  notes?: string;
  dueDate?: string;
  clientSnapshot?: object;  // Frozen client data at creation
  businessSnapshot?: object; // Frozen business profile at creation
}
```

#### Invariants

- **Freeze Rule**: If `status !== 'draft'`, content edits are blocked
- **Snapshot Safety**: Line items store snapshot values (not references)

---

### 3.4 Contract

| Attribute          | Value                                   |
| ------------------ | --------------------------------------- |
| **Storage Key**    | `gesu-contracts-{userId}` (user-scoped) |
| **Schema Version** | 1                                       |
| **Primary Key**    | `id: string` (UUID v4)                  |
| **Persona Scope**  | BUSINESS                                |

#### Required Fields

```typescript
interface Contract {
  id: string;
  number: string;
  status: "draft" | "sent" | "signed" | "cancelled";
  scope: string[];
  createdAt: string;
  updatedAt: string;
}
```

#### Invariants

- **Freeze Rule**: If `status !== 'draft'`, edits blocked

---

### 3.5 Payment

| Attribute          | Value                                  |
| ------------------ | -------------------------------------- |
| **Storage Key**    | `gesu-payments-{userId}` (user-scoped) |
| **Schema Version** | 1                                      |
| **Primary Key**    | `id: string` (UUID v4)                 |
| **Persona Scope**  | BUSINESS                               |

#### Required Fields

```typescript
interface Payment {
  id: string;
  invoiceId: string; // FK to Invoice
  amount: number;
  date: string;
  method: "transfer" | "cash" | "other";
  createdAt: string;
}
```

---

### 3.6 Gamification

| Attribute          | Value                                     |
| ------------------ | ----------------------------------------- |
| **Storage Key**    | `gesu-gamification-{userId}`              |
| **Cloud Path**     | `users/{userId}/gamification/data`        |
| **Schema Version** | None (uses `version: timestamp` for sync) |
| **Persona Scope**  | BOTH                                      |

#### Fields

```typescript
interface GamificationState {
  xp: number;
  level: number;
  streak: number;
  achievements: string[];
  unlockedCosmetics: string[];
  equippedCosmetics: Record<string, string>;
  totalTasksCompleted: number;
  totalProjectsCompleted: number;
}
```

#### Sync Strategy

- **Primary**: localStorage (offline-first)
- **Secondary**: Firestore (sync backup)
- **Merge Rule**: `Math.max()` for numeric fields, union for arrays
- **Debounce**: 2 seconds before cloud push

---

### 3.7 Focus Timer

| Attribute          | Value                                     |
| ------------------ | ----------------------------------------- |
| **Storage Key**    | `gesu-focus-timer-{userId}` (user-scoped) |
| **Schema Version** | 1                                         |
| **Persona Scope**  | PERSONAL                                  |

#### Fields

```typescript
interface FocusTimerState {
  sessionActive: boolean;
  startTime: number | null;
  currentTask: string | null;
  sessionGoal?: string;
}
```

#### Invariants

- **Global Singleton**: Only one active session across all pages

---

### 3.8 Daily Check-in

| Attribute          | Value                             |
| ------------------ | --------------------------------- |
| **Storage Key**    | `gesu-daily-checkin` (NOT scoped) |
| **Schema Version** | 1                                 |
| **Persona Scope**  | PERSONAL                          |

#### Fields

```typescript
interface DailyCheckIn {
  date: string; // YYYY-MM-DD
  energy: number; // 1-5
  why?: string;
  topFocus?: string;
  isComplete: boolean;
}
```

> ⚠️ **ISSUE**: This store uses a static key, not user-scoped. Data may persist across accounts.

---

### 3.9 SQLite Tables (Activity Tracking)

**Location**: `workflowRoot/users/{userId}/gesu-database.db`

| Table               | Purpose                   | User-Scoped |
| ------------------- | ------------------------- | ----------- |
| `users`             | User profiles             | ✅          |
| `activity_sessions` | Focus/break/idle sessions | ✅          |
| `app_usage`         | App usage tracking        | ✅          |
| `daily_metrics`     | Aggregated daily stats    | ✅          |
| `task_completions`  | Task completion records   | ✅          |
| `achievements`      | Earned achievements       | ✅          |

---

## 4. User-Scoping Analysis

### Stores Using `getUserStorageKey()` (CORRECT)

| Store                         | Base Key                     | Status |
| ----------------------------- | ---------------------------- | ------ |
| `clientStore.ts`              | `gesu-clients`               | ✅     |
| `projectStore.ts`             | `gesu-projects`              | ✅     |
| `invoiceStore.ts`             | `gesu-invoices`              | ✅     |
| `contractStore.ts`            | `gesu-contracts`             | ✅     |
| `paymentStore.ts`             | `gesu-payments`              | ✅     |
| `serviceCatalogStore.ts`      | `gesu-service-catalog`       | ✅     |
| `deliverablePackStore.ts`     | `gesu-deliverable-packs`     | ✅     |
| `deliverableTemplateStore.ts` | `gesu-deliverable-templates` | ✅     |
| `focusTimerStore.ts`          | `gesu-focus-timer`           | ✅     |
| `secondBrainStore.ts`         | `gesu-second-brain`          | ✅     |
| `projectHubTasksStore.ts`     | `gesu-projecthub-tasks`      | ✅     |
| `settingsStore.ts`            | `gesu-global-settings`       | ✅     |

### Stores Using Static Keys (RISK)

| Store                      | Key                          | Risk Level     |
| -------------------------- | ---------------------------- | -------------- |
| `dailyCheckInStore.ts`     | `gesu-daily-checkin`         | ⚠️ HIGH        |
| `personaStore.ts`          | `gesu-active-persona`        | ⚠️ MEDIUM      |
| `finishModeStore.ts`       | `gesu-finish-mode`           | ⚠️ MEDIUM      |
| `workflowProgressStore.ts` | `gesu-workflow-progress`     | ⚠️ HIGH        |
| `compassSnapshotStore.ts`  | `compass-snapshots`          | ⚠️ HIGH        |
| `engineStatusStore.ts`     | `gesu-engine-status-cache`   | ✅ OK (shared) |
| `gamificationStore.ts`     | `gesu-gamification-{userId}` | ✅ (custom)    |

---

## 5. Hybrid Migration Readiness

### Already Firestore-Backed

| Entity       | Local Store         | Cloud Path                         | Sync Status       |
| ------------ | ------------------- | ---------------------------------- | ----------------- |
| Gamification | `gamificationStore` | `users/{userId}/gamification/data` | ✅ Bi-directional |
| Leaderboard  | N/A                 | `leaderboard/current`              | ✅ Read-only      |

### Local-Only (Migration Candidates)

| Entity            | Priority | Blockers                   |
| ----------------- | -------- | -------------------------- |
| Projects          | HIGH     | None - already user-scoped |
| Clients           | HIGH     | None - already user-scoped |
| Invoices          | HIGH     | None - already user-scoped |
| Contracts         | HIGH     | None - already user-scoped |
| Payments          | MEDIUM   | None - already user-scoped |
| Daily Check-in    | HIGH     | ⚠️ NOT user-scoped         |
| Compass           | MEDIUM   | ⚠️ NOT user-scoped         |
| Workflow Progress | MEDIUM   | ⚠️ NOT user-scoped         |

### Migration Blockers

| Blocker                      | Affected Stores                                             | Severity |
| ---------------------------- | ----------------------------------------------------------- | -------- |
| Missing user-scoping         | dailyCheckIn, compassSnapshot, workflowProgress, finishMode | HIGH     |
| No schemaVersion in persona  | personaStore                                                | LOW      |
| No change log/event sourcing | All stores                                                  | MEDIUM   |
| No conflict resolution rules | All stores (except gamification)                            | HIGH     |
| Write amplification possible | projectStore (large arrays)                                 | MEDIUM   |

---

## 6. Evidence Appendix

### Key grep queries used

```bash
# localStorage usage
grep -r "localStorage" apps/gesu-shell/src --include="*.ts" --include="*.tsx"
# → 174+ results across stores, services, contexts

# STORAGE_KEY definitions
grep -r "STORAGE_KEY" apps/gesu-shell/src/stores/
# → 21 stores identified

# getUserStorageKey usage
grep -r "getUserStorageKey" apps/gesu-shell/src/
# → 12 stores using user-scoped keys

# Firestore usage
grep -r "firestore" apps/gesu-shell/src --include="*.ts"
# → gamificationSyncService.ts, leaderboardService.ts, firebase.ts

# schemaVersion patterns
grep -r "schemaVersion" apps/gesu-shell/src --include="*.ts"
# → 78+ usages across stores

# SQLite usage
grep -r "sqlite" apps/gesu-shell/electron/
# → database.js, database-schema.js
```

### Key file paths

| Component         | Path                                      |
| ----------------- | ----------------------------------------- |
| getUserStorageKey | `src/utils/getUserStorageKey.ts`          |
| clearAllUserData  | `src/utils/clearAllUserData.ts`           |
| SQLite database   | `electron/database.js`                    |
| SQLite schema     | `electron/database-schema.js`             |
| Firestore sync    | `src/services/gamificationSyncService.ts` |
| Leaderboard       | `src/services/leaderboardService.ts`      |
| Firebase config   | `src/config/firebase.ts`                  |
| Settings types    | `src/types/settings.ts`                   |

---

## 7. Recommendations

### Immediate (Before Migration)

1. **Fix user-scoping gaps**: Update `dailyCheckInStore`, `compassSnapshotStore`, `workflowProgressStore`, `finishModeStore` to use `getUserStorageKey()`
2. **Update clearAllUserData.ts**: Ensure it clears user-scoped keys pattern `gesu-*-{userId}`
3. **Add schemaVersion to personaStore**: Currently stores raw string

### Short-Term (Stage 0)

1. Create centralized type definitions in `packages/schema/`
2. Add `updatedAt` timestamps to all entities for LWW conflict resolution
3. Implement change log/versioning for audit trail

### Medium-Term (Stages 1-2)

1. Create abstract persistence adapter interface
2. Implement Firestore adapter per entity
3. Add conflict resolution rules per entity type

---

_Document generated from repo analysis. All claims backed by grep results and code inspection._
