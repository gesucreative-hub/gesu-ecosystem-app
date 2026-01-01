// Document Numbering Service - Token replacement for invoice/contract numbers
// S6-A: Separated service for clean separation of concerns
// Used by invoiceStore and contractStore

import { 
    getBusinessProfile, 
    incrementInvoiceSeq, 
    incrementContractSeq 
} from '../stores/businessProfileStore';

/**
 * Supported tokens:
 * - {YYYY} - 4-digit year (2026)
 * - {YY} - 2-digit year (26)
 * - {MM} - 2-digit month (01-12)
 * - {DD} - 2-digit day (01-31)
 * - {####} - 4-digit sequence (0001)
 * - {###} - 3-digit sequence (001)
 */

/**
 * Format a document number by replacing tokens with current date and sequence.
 * @param format - The format string with tokens (e.g., "GC-INV-{YY}{MM}{DD}-{####}")
 * @param seq - The sequence number to use
 * @returns Formatted document number (e.g., "GC-INV-260102-0001")
 */
export function formatDocumentNumber(format: string, seq: number): string {
    const now = new Date();
    return format
        .replace(/{YYYY}/g, String(now.getFullYear()))
        .replace(/{YY}/g, String(now.getFullYear()).slice(-2))
        .replace(/{MM}/g, String(now.getMonth() + 1).padStart(2, '0'))
        .replace(/{DD}/g, String(now.getDate()).padStart(2, '0'))
        .replace(/{####}/g, String(seq).padStart(4, '0'))
        .replace(/{###}/g, String(seq).padStart(3, '0'));
}

/**
 * Generate the next invoice number and increment the sequence.
 * Should ONLY be called when SAVING a new invoice (not for preview).
 * @returns Formatted invoice number
 */
export function generateInvoiceNumber(): string {
    const profile = getBusinessProfile();
    const seq = incrementInvoiceSeq();  // Atomic increment + persist
    return formatDocumentNumber(profile.invoiceNumberFormat, seq);
}

/**
 * Generate the next contract number and increment the sequence.
 * Should ONLY be called when SAVING a new contract (not for preview).
 * @returns Formatted contract number
 */
export function generateContractNumber(): string {
    const profile = getBusinessProfile();
    const seq = incrementContractSeq();  // Atomic increment + persist
    return formatDocumentNumber(profile.contractNumberFormat, seq);
}

/**
 * Preview what the next invoice number would look like WITHOUT incrementing.
 * Use this for UI preview before user confirms creation.
 * @returns Preview of next invoice number
 */
export function previewNextInvoiceNumber(): string {
    const profile = getBusinessProfile();
    // Don't increment - just show what it would be
    return formatDocumentNumber(profile.invoiceNumberFormat, profile.nextInvoiceSeq);
}

/**
 * Preview what the next contract number would look like WITHOUT incrementing.
 * Use this for UI preview before user confirms creation.
 * @returns Preview of next contract number
 */
export function previewNextContractNumber(): string {
    const profile = getBusinessProfile();
    // Don't increment - just show what it would be
    return formatDocumentNumber(profile.contractNumberFormat, profile.nextContractSeq);
}

// --- Dev Helper ---

if (import.meta.env?.DEV && typeof window !== 'undefined') {
    (window as any).__gesuNumbering = {
        formatDocumentNumber,
        generateInvoiceNumber,
        generateContractNumber,
        previewNextInvoiceNumber,
        previewNextContractNumber
    };
}
