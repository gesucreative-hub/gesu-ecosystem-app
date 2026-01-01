# Sprint S7-A Walkthrough: Payments Store + Recording

**Status**: ✅ DONE  
**Completed**: 2026-01-02  
**Scope**: BUSINESS persona only

---

## What Changed

### New Files

- `stores/paymentStore.ts` — Full CRUD store for payment records linked to invoices

### Modified Files

- `stores/invoiceStore.ts` — Added dueDate field, isOverdue detection, setDueDate function
- `pages/InvoiceDetailPage.tsx` — Payment recording UI with modal, list, and overdue badge
- `locales/en/invoices.json` — Added payments i18n section (+25 keys)
- `locales/id/invoices.json` — Added payments i18n section (+25 keys)

---

## User Test Flow

### Test 1: Record Partial Payment

1. Navigate to **Invoices**
2. Create an invoice with 2+ line items (total ~1,000,000)
3. Click **Mark as Sent**
4. In the **Payments** section, click **Record Payment**
5. Enter amount: 500,000
6. Select method: Transfer
7. Click **Save Payment**
8. **Verify**: Payment appears in list, Remaining shows 500,000

### Test 2: Complete Payment

1. On same invoice, click **Record Payment** again
2. Enter remaining amount: 500,000
3. Click **Save Payment**
4. **Verify**: Remaining shows Rp 0
5. **Verify**: Green "Invoice is fully paid!" banner appears
6. Click **Mark as Paid**
7. **Verify**: Status badge changes to "Paid"

### Test 3: Overdue Detection

1. Create a new invoice, mark as Sent
2. In the Payments section, change **Due Date** to 45 days ago
3. **Verify**: Red "Overdue" badge appears next to Payments title

### Test 4: Delete Payment

1. On a Sent invoice with payments, click the trash icon next to a payment
2. Confirm deletion
3. **Verify**: Payment removed, totals recalculate

### Test 5: Persistence

1. Record a payment
2. Refresh the page
3. **Verify**: Payment still visible in list

---

## QA Results

| Test                                         | Result  |
| -------------------------------------------- | ------- |
| T1: Record partial payment                   | ✅ PASS |
| T2: Complete payment → fully paid suggestion | ✅ PASS |
| T3: Overdue badge for past due date          | ✅ PASS |
| T4: Delete payment → recalculates            | ✅ PASS |
| T5: Data persists after reload               | ✅ PASS |
| T6: i18n labels translate (EN→ID)            | ✅ PASS |
| T7: TypeScript build passes                  | ✅ PASS |

---

## Known Limitations

- Payments can only be recorded on Sent invoices (not Paid or Draft)
- No payment editing (only delete and re-add)
- No receipt/PDF generation
- No email reminders for overdue

---

## Files Changed Summary

| File                          | Lines Added    |
| ----------------------------- | -------------- |
| `stores/paymentStore.ts`      | +220 (new)     |
| `stores/invoiceStore.ts`      | +44            |
| `pages/InvoiceDetailPage.tsx` | +150           |
| `locales/en/invoices.json`    | +25 keys       |
| `locales/id/invoices.json`    | +25 keys       |
| **Total**                     | **~464 lines** |

---

## Next Step

**S7-B: Deliverables System** — Template store + per-project deliverable tracking
