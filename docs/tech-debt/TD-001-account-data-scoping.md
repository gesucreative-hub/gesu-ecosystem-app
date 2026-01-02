# Tech Debt: Account Data Persistence Scoping

## Issue ID: TD-001

**Priority**: High  
**Reported**: 2026-01-02  
**Status**: Documented

## Problem Description

All localStorage-based stores use generic keys without user scoping:

- `gesu-clients`
- `gesu-invoices`
- `gesu-contracts`
- `gesu-projects`
- `gesu-pricelist`
- etc.

When users switch accounts, data from the previous account persists, causing data bleed between users.

## Affected Stores

- `clientStore.ts`
- `invoiceStore.ts`
- `contractStore.ts`
- `projectStore.ts`
- `serviceCatalogStore.ts`
- `deliverablePackStore.ts`
- `paymentStore.ts`

## Proposed Solution

Scope all localStorage keys by user ID:

```typescript
// Before
const STORAGE_KEY = "gesu-clients";

// After
const getStorageKey = (userId: string) => `gesu-clients-${userId}`;
```

## Migration Requirements

1. Detect on login if old (unscoped) data exists
2. Migrate to new scoped format
3. Clear old unscoped data after migration
4. Handle logged-out state (guest data)

## Risk Level: HIGH

- Breaking change for existing users
- Requires careful data migration
- Need to handle edge cases (guest mode, multiple tabs)

## Recommendation

Dedicate a focused sprint for this migration with:

- [ ] Full backup/restore capability
- [ ] Migration testing with real user data
- [ ] Rollback plan
