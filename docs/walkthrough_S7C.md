# Sprint S7-C Walkthrough: Finance Snapshot

**Status**: ✅ DONE  
**Completed**: 2026-01-02  
**Scope**: BUSINESS persona only

---

## What Changed

### New Files

| File                                 | Lines | Description                                 |
| ------------------------------------ | ----- | ------------------------------------------- |
| `services/financeSnapshotService.ts` | 150   | Monthly aggregation + overdue detection     |
| `pages/FinanceSnapshotPage.tsx`      | 210   | Dashboard with summary cards + overdue list |
| `locales/en/finance.json`            | 12    | English i18n keys                           |
| `locales/id/finance.json`            | 12    | Indonesian i18n keys                        |

### Modified Files

| File             | Change                                   |
| ---------------- | ---------------------------------------- |
| `config/i18n.ts` | Registered `finance` namespace           |
| `App.tsx`        | Added route `/finance`                   |
| `Layout.tsx`     | Added "Finance" nav item + persona guard |

---

## User Test Flow

### Test 1: View Finance Snapshot

1. Switch to **BUSINESS** persona
2. Click **Finance** in sidebar → opens Finance Snapshot page
3. **Verify**: Month selector shows current month
4. **Verify**: 4 summary cards: Invoiced / Paid / Outstanding / Overdue

### Test 2: Create Test Data

1. Create an invoice for 1,000,000 IDR
2. Mark as Sent
3. Record partial payment: 600,000
4. **Verify** on Finance page:
   - Invoiced: Rp 1.000.000
   - Paid: Rp 600.000
   - Outstanding: Rp 400.000

### Test 3: Overdue Invoice

1. On the same invoice, set Due Date to 30 days in the past
2. Go to Finance page
3. **Verify**: Overdue card shows Rp 400.000
4. **Verify**: Overdue Invoices list shows the invoice
5. Click the row → navigates to invoice detail

### Test 4: Month Selection

1. Use month dropdown to select previous month
2. **Verify**: Totals update (likely show zero if no invoices)
3. **Verify**: "No invoices in this month" if empty

### Test 5: Persona Guard

1. Switch to **PERSONAL** persona
2. **Verify**: "Finance" nav item hidden
3. Try direct URL `/finance` → **Verify**: Redirects to /compass

---

## QA Results

| Test                                             | Result  |
| ------------------------------------------------ | ------- |
| T1: Finance page loads with summary cards        | ✅ PASS |
| T2: Invoiced total correct                       | ✅ PASS |
| T3: Paid total correct (capped at invoice total) | ✅ PASS |
| T4: Outstanding total correct                    | ✅ PASS |
| T5: Overdue total correct for overdue invoices   | ✅ PASS |
| T6: Overdue list shows invoice with link         | ✅ PASS |
| T7: Month selector changes data                  | ✅ PASS |
| T8: Empty state for no invoices                  | ✅ PASS |
| T9: Persona guard (nav hidden)                   | ✅ PASS |
| T10: Persona guard (URL redirect)                | ✅ PASS |
| T11: TypeScript build passes                     | ✅ PASS |

---

## Known Limitations

- No charts or graphs (text-only summary)
- No export/PDF functionality
- No year-over-year comparison
- No category breakdown
- No email reminders for overdue

---

## Files Changed Summary

| Type           | Count       | Lines          |
| -------------- | ----------- | -------------- |
| New service    | 1           | ~150           |
| New page       | 1           | ~210           |
| New i18n files | 2           | ~24 keys       |
| Modified       | 3           | ~15            |
| **Total**      | **7 files** | **~400 lines** |

---

## Sprint S7 Complete!

All three slices complete:

- **S7-A**: Payment recording ✅
- **S7-B**: Deliverables system ✅
- **S7-C**: Finance snapshot ✅
