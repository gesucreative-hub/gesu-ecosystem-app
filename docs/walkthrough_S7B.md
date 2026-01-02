# Sprint S7-B Walkthrough: Deliverables System

**Status**: ✅ DONE  
**Completed**: 2026-01-02  
**Scope**: BUSINESS persona only

---

## What Changed

### New Files

| File                                 | Lines | Description                                   |
| ------------------------------------ | ----- | --------------------------------------------- |
| `stores/deliverableTemplateStore.ts` | 215   | CRUD for reusable deliverable templates       |
| `stores/deliverablePackStore.ts`     | 358   | Per-project pack instances with item tracking |
| `pages/DeliverableTemplatesPage.tsx` | 328   | Templates CRUD UI with search/reorder         |
| `pages/ProjectDeliverablesPage.tsx`  | 350   | Project selector + pack creation + checklist  |
| `locales/en/deliverables.json`       | 60    | English i18n keys                             |
| `locales/id/deliverables.json`       | 60    | Indonesian i18n keys                          |

### Modified Files

| File             | Change                                                  |
| ---------------- | ------------------------------------------------------- |
| `config/i18n.ts` | Registered `deliverables` namespace                     |
| `App.tsx`        | Added routes: `/deliverable-templates`, `/deliverables` |
| `Layout.tsx`     | Added nav items + persona guard for deliverables routes |

---

## User Test Flow

### Test 1: Create Template

1. Switch to **BUSINESS** persona
2. Click **Templates** in sidebar → opens Templates page
3. Click **New Template**
4. Enter name: "Brand Design Package"
5. Add 5 items: Logo, Guidelines, Stationery, Social Kit, Brand Manual
6. Click **Save**
7. **Verify**: Template appears in list with "5 items" badge
8. Refresh page → **Verify**: Template persists

### Test 2: Reorder Template Items

1. Edit the template created above
2. Use ↑↓ arrows to reorder items
3. Click **Save**
4. Refresh page → **Verify**: Order preserved

### Test 3: Create Pack from Template

1. Click **Deliverables** in sidebar
2. Select a project from dropdown
3. Click **Create from Template**
4. Select "Brand Design Package" template
5. Click **Create**
6. **Verify**: Pack appears with 5 items all "To Do"
7. Refresh page → **Verify**: Pack persists

### Test 4: Toggle Item Status

1. Expand the pack created above
2. Click checkbox on 2 items → items show checkmark
3. Refresh page → **Verify**: 2 items still marked done
4. **Verify**: Progress shows "2/5 completed"

### Test 5: Add File Links

1. On a pack item, enter a file link URL
2. Click **Add**
3. **Verify**: Link appears, clickable
4. Refresh page → **Verify**: Link persists

### Test 6: Persona Guard

1. Switch to **PERSONAL** persona
2. **Verify**: "Deliverables" and "Templates" nav items hidden
3. Try direct URL `/deliverables` → **Verify**: Redirects to /compass
4. Try direct URL `/deliverable-templates` → **Verify**: Redirects to /compass

---

## QA Results

| Test                                | Result  |
| ----------------------------------- | ------- |
| T1: Create template with 5 items    | ✅ PASS |
| T2: Reorder items → order preserved | ✅ PASS |
| T3: Create pack from template       | ✅ PASS |
| T4: Toggle item status → persists   | ✅ PASS |
| T5: Add file links → persists       | ✅ PASS |
| T6: Delete template                 | ✅ PASS |
| T7: Delete pack                     | ✅ PASS |
| T8: Persona guard (nav hidden)      | ✅ PASS |
| T9: Persona guard (URL redirect)    | ✅ PASS |
| T10: i18n labels translate (EN→ID)  | ✅ PASS |
| T11: TypeScript build passes        | ✅ PASS |

---

## Known Limitations

- No file dialog integration (links are text input only)
- No drag-and-drop reorder in packs (only in templates)
- No "duplicate template" feature
- No template versioning
- No bulk status toggle

---

## Files Changed Summary

| Type           | Count       | Lines           |
| -------------- | ----------- | --------------- |
| New stores     | 2           | ~573            |
| New pages      | 2           | ~678            |
| New i18n files | 2           | ~120 keys       |
| Modified       | 3           | ~30             |
| **Total**      | **9 files** | **~1400 lines** |

---

## Next Step

**S7-C: Finance Snapshot** — Dashboard with billing/payment aggregates
