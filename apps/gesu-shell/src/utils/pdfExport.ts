// PDF Export Utilities
// Uses @react-pdf/renderer to generate and download PDFs
// Updated with i18n support via translations props

import { pdf } from '@react-pdf/renderer';
import { InvoicePDF, DEFAULT_INVOICE_TRANSLATIONS, type InvoicePDFTranslations } from '../components/pdf/InvoicePDF';
import { ContractPDF, DEFAULT_CONTRACT_TRANSLATIONS, type ContractPDFTranslations } from '../components/pdf/ContractPDF';
import { type Invoice } from '../stores/invoiceStore';
import { type Contract } from '../stores/contractStore';
import { getProjectById } from '../stores/projectStore';

/**
 * Generate a PDF blob from a React PDF document
 */
async function generatePDFBlob(element: React.ReactElement): Promise<Blob> {
    return await pdf(element).toBlob();
}

/**
 * Download a blob as a file
 */
function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Export an invoice to PDF and trigger download
 * @param invoice - The invoice data
 * @param translations - Optional i18n translations (defaults to Indonesian)
 */
export async function exportInvoicePDF(
    invoice: Invoice, 
    translations: InvoicePDFTranslations = DEFAULT_INVOICE_TRANSLATIONS
): Promise<void> {
    // Get project name if available
    let projectName = '-';
    if (invoice.projectId) {
        const project = getProjectById(invoice.projectId);
        if (project) {
            projectName = project.name;
        }
    }
    
    const element = InvoicePDF({ invoice, projectName, translations });
    const blob = await generatePDFBlob(element);
    const filename = `Invoice_${invoice.number.replace(/\//g, '-')}.pdf`;
    downloadBlob(blob, filename);
}

/**
 * Export a contract to PDF and trigger download
 * @param contract - The contract data
 * @param translations - Optional i18n translations (defaults to Indonesian)
 */
export async function exportContractPDF(
    contract: Contract, 
    translations: ContractPDFTranslations = DEFAULT_CONTRACT_TRANSLATIONS
): Promise<void> {
    // Get project name if available
    let projectName = '-';
    if (contract.projectId) {
        const project = getProjectById(contract.projectId);
        if (project) {
            projectName = project.name;
        }
    }
    
    const element = ContractPDF({ contract, projectName, translations });
    const blob = await generatePDFBlob(element);
    const filename = `Contract_${contract.number.replace(/\//g, '-')}.pdf`;
    downloadBlob(blob, filename);
}
