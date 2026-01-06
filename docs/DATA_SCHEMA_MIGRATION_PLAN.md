# Gesu Ecosystem - Data Schema Migration Plan

> **Version**: 1.0  
> **Date**: 2026-01-06  
> **Status**: Blueprint for Hybrid Migration  
> **Dependency**: [DATA_SCHEMA_SOURCE_OF_TRUTH.md](./DATA_SCHEMA_SOURCE_OF_TRUTH.md)

---

## Executive Summary

This document outlines a practical, incremental migration path from the current localStorage-first architecture to a **hybrid local-first + Firestore sync** model. The plan follows a **strangler pattern** - no big rewrites, progressive migration per domain.

### Target Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Application                         │
├─────────────────────────────────────────────────────────────┤
│                  Domain Stores (Zustand-like)                │
│   projectStore │ clientStore │ invoiceStore │ etc...        │
├─────────────────────────────────────────────────────────────┤
│              Persistence Adapter Interface                   │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│   │ localStorage │  │   SQLite     │  │   Firestore  │      │
│   │   Adapter    │  │   Adapter    │  │    Adapter   │      │
│   └──────────────┘  └──────────────┘  └──────────────┘      │
├─────────────────────────────────────────────────────────────┤
│                    Sync Engine                               │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│   │ Write Queue │  │  Conflict   │  │   Offline   │         │
│   │   (WAL)     │  │  Resolver   │  │   Detector  │         │
│   └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

---

## Migration Stages

### Stage 0: Normalize Contracts + Versions (PREREQUISITE)

**Goal**: Fix known blockers before any sync implementation

#### 0.1 Fix User-Scoping Gaps

| Store                   | Current Key              | Target Key                        |
| ----------------------- | ------------------------ | --------------------------------- |
| `dailyCheckInStore`     | `gesu-daily-checkin`     | `gesu-daily-checkin-{userId}`     |
| `compassSnapshotStore`  | `compass-snapshots`      | `gesu-compass-snapshots-{userId}` |
| `workflowProgressStore` | `gesu-workflow-progress` | `gesu-workflow-progress-{userId}` |
| `finishModeStore`       | `gesu-finish-mode`       | `gesu-finish-mode-{userId}`       |

**Implementation**:

```typescript
// Before
const STORAGE_KEY = "gesu-daily-checkin";

// After
import { getUserStorageKey } from "../utils/getUserStorageKey";
const BASE_STORAGE_KEY = "gesu-daily-checkin";
const getStorageKey = () => getUserStorageKey(BASE_STORAGE_KEY);
```

**Migration Script**: Auto-migrate existing data on first load:

```typescript
function migrateToUserScoped() {
  const oldKey = "gesu-daily-checkin";
  const newKey = getStorageKey();
  if (localStorage.getItem(oldKey) && !localStorage.getItem(newKey)) {
    localStorage.setItem(newKey, localStorage.getItem(oldKey));
    localStorage.removeItem(oldKey);
  }
}
```

#### 0.2 Add Missing Schema Versions

| Store          | Current | Target |
| -------------- | ------- | ------ |
| `personaStore` | None    | v1     |

#### 0.3 Add `updatedAt` Timestamps

Ensure all entities have `updatedAt: string` (ISO 8601) for LWW conflict resolution.

**Already Have**: Project, Client, Invoice, Contract, Payment, SecondBrain  
**Need to Add**: DailyCheckIn, CompassSnapshot, WorkflowProgress

---

### Stage 1: Local-First Canonical Store + Adapters

**Goal**: Abstract persistence layer without changing behavior

#### 1.1 Create Persistence Adapter Interface

```typescript
// packages/schema/src/persistence.ts

interface PersistenceAdapter<T> {
  read(): Promise<T | null>;
  write(data: T): Promise<void>;
  subscribe(callback: (data: T) => void): () => void;
}

interface LocalStorageAdapter<T> extends PersistenceAdapter<T> {
  key: string;
  schemaVersion: number;
}

interface FirestoreAdapter<T> extends PersistenceAdapter<T> {
  collectionPath: string;
  userId: string;
}
```

#### 1.2 Create Write-Ahead Log (WAL)

```typescript
// services/persistence/writeQueue.ts

interface PendingWrite {
  id: string;
  entity: string; // 'project', 'client', etc.
  operation: "create" | "update" | "delete";
  data: unknown;
  timestamp: number;
  retryCount: number;
}

const QUEUE_KEY = "gesu-pending-writes";

export function enqueue(write: PendingWrite): void;
export function dequeue(id: string): void;
export function getPendingWrites(): PendingWrite[];
export function processPendingWrites(): Promise<void>;
```

---

### Stage 2: Firestore Sync Layer

**Goal**: Add bi-directional sync for prioritized entities

#### 2.1 Entity Priority Order

| Priority | Entity    | Rationale                          |
| -------- | --------- | ---------------------------------- |
| P0       | Projects  | Core domain, cross-device critical |
| P1       | Clients   | Business critical                  |
| P2       | Invoices  | Financial records                  |
| P3       | Contracts | Business records                   |
| P4       | Payments  | Transaction history                |
| P5       | Others    | Nice to have                       |

#### 2.2 Firestore Collection Structure

```
users/
  {userId}/
    projects/
      {projectId}
    clients/
      {clientId}
    invoices/
      {invoiceId}
    contracts/
      {contractId}
    payments/
      {paymentId}
    gamification/
      data              <- Already exists
    sync_metadata/
      lastSyncAt
      pendingWrites
```

#### 2.3 Conflict Resolution Rules

| Entity       | Strategy | Rule                                   |
| ------------ | -------- | -------------------------------------- |
| Project      | LWW      | Higher `updatedAt` wins                |
| Client       | LWW      | Higher `updatedAt` wins                |
| Invoice      | LWW      | Higher `updatedAt` wins + freeze guard |
| Contract     | LWW      | Higher `updatedAt` wins + freeze guard |
| Payment      | Append   | Never overwrite, only create           |
| Gamification | Max      | `Math.max()` for XP, union for arrays  |

**LWW (Last-Write-Wins) Implementation**:

```typescript
function resolveConflict<T extends { updatedAt: string }>(
  local: T,
  cloud: T
): T {
  const localTime = new Date(local.updatedAt).getTime();
  const cloudTime = new Date(cloud.updatedAt).getTime();
  return localTime > cloudTime ? local : cloud;
}
```

**Freeze Guard** (for Invoice/Contract):

```typescript
function canSync(entity: Invoice | Contract): boolean {
  // Only draft status can be synced with content changes
  // Non-draft can only sync status changes
  return entity.status === "draft";
}
```

---

### Stage 3: Gradual Cutover Per Domain

#### 3.1 Feature Flags

```typescript
// config/featureFlags.ts

export const SYNC_FLAGS = {
  projectsSync: false, // Enable when Stage 2 complete for projects
  clientsSync: false,
  invoicesSync: false,
  contractsSync: false,
  paymentsSync: false,
} as const;
```

#### 3.2 Rollout Plan

| Week | Entity    | Actions                                          |
| ---- | --------- | ------------------------------------------------ |
| 1    | Projects  | Enable flag, monitor for 3 days, then production |
| 2    | Clients   | Enable flag, monitor, production                 |
| 3    | Invoices  | Enable flag, monitor (critical - financial)      |
| 4    | Contracts | Enable flag, monitor                             |
| 5    | Payments  | Enable flag, monitor                             |

#### 3.3 Rollback Plan

```typescript
// Emergency rollback: disable sync, restore from local
async function emergencyRollback(entity: string) {
  SYNC_FLAGS[`${entity}Sync`] = false;
  await clearPendingWrites(entity);
  console.warn(`[Sync] Rollback: ${entity} sync disabled`);
}
```

---

## Data Safety

### Backup Strategy

1. **Local Backup**: Before any sync operation

   ```typescript
   function backupBeforeSync(entity: string) {
     const key = getStorageKey(entity);
     const data = localStorage.getItem(key);
     localStorage.setItem(`${key}-backup-${Date.now()}`, data);
   }
   ```

2. **Cloud Backup**: Firestore has built-in versioning
   - Enable Firestore automatic backups
   - Store `_lastSnapshot` document with full state

3. **Export Bundle**: User-initiated full export
   ```typescript
   async function exportAllData(): Promise<Blob> {
     const bundle = {
       exportedAt: new Date().toISOString(),
       projects: await getAll("projects"),
       clients: await getAll("clients"),
       invoices: await getAll("invoices"),
       // ... etc
     };
     return new Blob([JSON.stringify(bundle)], { type: "application/json" });
   }
   ```

### Restore Process

1. **From Local Backup**:

   ```typescript
   function restoreFromBackup(entity: string, timestamp: number) {
     const backupKey = `gesu-${entity}-backup-${timestamp}`;
     const data = localStorage.getItem(backupKey);
     localStorage.setItem(getStorageKey(entity), data);
   }
   ```

2. **From Cloud**:
   - Firestore restore from backup
   - Or fetch from `_lastSnapshot` document

---

## Offline Queue Architecture

### Queue Processing

```typescript
interface OfflineQueue {
  pendingWrites: PendingWrite[];
  isProcessing: boolean;
  lastProcessedAt: number | null;
}

// Queue processing on reconnect
window.addEventListener("online", async () => {
  const queue = getPendingQueue();
  for (const write of queue) {
    try {
      await syncToCloud(write);
      dequeue(write.id);
    } catch (err) {
      write.retryCount++;
      if (write.retryCount > 3) {
        markAsFailed(write);
      }
    }
  }
});
```

### Deduplication

```typescript
// If same entity updated multiple times offline, keep only latest
function deduplicateQueue(writes: PendingWrite[]): PendingWrite[] {
  const latest = new Map<string, PendingWrite>();
  for (const write of writes) {
    const key = `${write.entity}-${write.data.id}`;
    const existing = latest.get(key);
    if (!existing || write.timestamp > existing.timestamp) {
      latest.set(key, write);
    }
  }
  return Array.from(latest.values());
}
```

---

## Aggregated Documents

### When to Use

| Scenario                     | Pattern                       |
| ---------------------------- | ----------------------------- |
| Single entity (Project)      | Document per entity           |
| Large collections (1000+)    | Consider aggregated summaries |
| Frequently accessed together | Sub-collections in parent     |

### Implementation for Finance Summary

```typescript
// Instead of reading all invoices to compute totals
// Store pre-computed summary

// users/{userId}/summaries/finance
{
  month: '2026-01',
  invoiced: 50000000,
  paid: 35000000,
  outstanding: 15000000,
  updatedAt: '2026-01-06T12:00:00Z'
}
```

---

## Timeline Estimate

| Stage     | Duration      | Deliverable                            |
| --------- | ------------- | -------------------------------------- |
| 0         | 1 day         | User-scoping fixes, missing timestamps |
| 1         | 2-3 days      | Adapter interface, WAL implementation  |
| 2         | 5-7 days      | Firestore sync for P0-P1 entities      |
| 3         | 3-5 days      | Feature flags, gradual rollout         |
| **Total** | **2-3 weeks** | Full hybrid sync operational           |

---

## Risks & Mitigations

| Risk                       | Mitigation                               |
| -------------------------- | ---------------------------------------- |
| Data loss during migration | Backup before every sync operation       |
| Conflict resolution bugs   | Extensive testing, LWW as simple default |
| Offline queue overflow     | Limit queue size, oldest-first eviction  |
| Firestore cost explosion   | Aggregated docs, debounced writes        |
| Performance degradation    | Async sync, UI never waits for cloud     |

---

## Definition of Done

- [ ] All stores use user-scoped keys
- [ ] All entities have `updatedAt` timestamps
- [ ] Persistence adapter interface created
- [ ] WAL/offline queue implemented
- [ ] At least Projects sync operational
- [ ] Backup/restore tested
- [ ] Feature flags for gradual rollout
- [ ] Rollback plan tested

---

_This plan follows strangler pattern principles - no big rewrite, incremental migration with rollback at each stage._
