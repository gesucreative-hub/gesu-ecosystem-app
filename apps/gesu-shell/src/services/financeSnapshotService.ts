// Finance Snapshot Service - S7-C: Monthly aggregation for BUSINESS dashboard
// Pure utility functions for computing invoice/payment totals and overdue detection

import { listInvoices, isOverdue, getEffectiveDueDate, type Invoice } from '../stores/invoiceStore';
import { getTotalPaid } from '../stores/paymentStore';

// --- Types ---

export interface MonthlySnapshot {
    monthKey: string;           // YYYY-MM
    totalInvoiced: number;      // Sum of all invoice totals
    totalPaid: number;          // Sum of payments (capped at invoice total)
    totalOutstanding: number;   // Sum of max(invoiceTotal - paid, 0)
    totalOverdue: number;       // Sum of outstanding for overdue invoices
    invoiceCount: number;
    overdueInvoices: OverdueInvoice[];
}

export interface OverdueInvoice {
    id: string;
    number: string;
    clientName: string;
    dueDate: string;
    total: number;
    paid: number;
    outstanding: number;
}

// --- Utility Functions ---

/**
 * Get YYYY-MM key from Date or ISO string.
 */
export function getMonthKey(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

/**
 * Get the invoice date for month grouping.
 * Uses createdAt since Invoice doesn't have a separate "issue date" field.
 */
export function getInvoiceMonthKey(invoice: Invoice): string {
    return getMonthKey(invoice.createdAt);
}

/**
 * Get paid amount for an invoice (capped at invoice total to avoid overpayment inflation).
 */
export function getInvoicePaidAmount(invoice: Invoice): number {
    const paid = getTotalPaid(invoice.id);
    return Math.min(paid, invoice.total);
}

/**
 * Get outstanding amount for an invoice.
 */
export function getInvoiceOutstanding(invoice: Invoice): number {
    const paid = getInvoicePaidAmount(invoice);
    return Math.max(invoice.total - paid, 0);
}

/**
 * Check if invoice belongs to a given month.
 */
export function isInvoiceInMonth(invoice: Invoice, monthKey: string): boolean {
    return getInvoiceMonthKey(invoice) === monthKey;
}

// --- Aggregation ---

/**
 * Build monthly snapshot with totals and overdue list.
 */
export function buildMonthlySnapshot(monthKey: string): MonthlySnapshot {
    const allInvoices = listInvoices();
    const monthInvoices = allInvoices.filter(inv => isInvoiceInMonth(inv, monthKey));
    
    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;
    let totalOverdue = 0;
    const overdueInvoices: OverdueInvoice[] = [];
    
    for (const invoice of monthInvoices) {
        const invoiceTotal = invoice.total;
        const paid = getInvoicePaidAmount(invoice);
        const outstanding = getInvoiceOutstanding(invoice);
        
        totalInvoiced += invoiceTotal;
        totalPaid += paid;
        totalOutstanding += outstanding;
        
        // Check if overdue AND has outstanding balance
        if (isOverdue(invoice) && outstanding > 0) {
            totalOverdue += outstanding;
            overdueInvoices.push({
                id: invoice.id,
                number: invoice.number,
                clientName: invoice.snapshot.clientName,
                dueDate: getEffectiveDueDate(invoice),
                total: invoiceTotal,
                paid,
                outstanding
            });
        }
    }
    
    // Sort overdue by outstanding amount (highest first)
    overdueInvoices.sort((a, b) => b.outstanding - a.outstanding);
    
    return {
        monthKey,
        totalInvoiced,
        totalPaid,
        totalOutstanding,
        totalOverdue,
        invoiceCount: monthInvoices.length,
        overdueInvoices
    };
}

/**
 * Generate list of last N months as YYYY-MM keys.
 */
export function getLast12Months(): { key: string; label: string }[] {
    const months: { key: string; label: string }[] = [];
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = getMonthKey(d);
        const label = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        months.push({ key, label });
    }
    
    return months;
}

/**
 * Get current month key.
 */
export function getCurrentMonthKey(): string {
    return getMonthKey(new Date());
}

// --- Dev Helper ---

if (import.meta.env?.DEV && typeof window !== 'undefined') {
    (window as any).__gesuFinanceSnapshot = {
        getMonthKey,
        getInvoiceMonthKey,
        getInvoicePaidAmount,
        getInvoiceOutstanding,
        buildMonthlySnapshot,
        getLast12Months,
        getCurrentMonthKey
    };
}
