// Invoice PDF Template - Matches Gesu Creative Lab invoice design
// Uses @react-pdf/renderer for PDF generation
// Updated with i18n support, logo integration, and design tokens

import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { type Invoice } from '../../stores/invoiceStore';

// Logo path (relative to public folder, loaded at runtime)
const LOGO_PATH = '/Logo/GCL Logo.png';

// Color scheme - Aligned with design tokens
const colors = {
    brand: '#3B3F8C',    // tokens-brand-DEFAULT
    accent: '#7BB662',   // Green accent
    text: '#1a1a1a',     // tokens-fg
    muted: '#666666',    // tokens-muted
    border: '#e5e5e5',   // tokens-border
    white: '#ffffff',
};

// i18n translations interface - passed from parent component
export interface InvoicePDFTranslations {
    title: string;
    invoiceFor: string;
    payableTo: string;
    invoiceNumber: string;
    project: string;
    dueDate: string;
    item: string;
    description: string;
    qty: string;
    unitPrice: string;
    totalPrice: string;
    notes: string;
    subtotal: string;
    adjustments: string;
    paidStamp: string;
    accountNumber: string;
    accountName: string;
    paymentConfirmation: string;
    termsTitle: string;
    additionalNotes: string;
}

// Default Indonesian translations
export const DEFAULT_INVOICE_TRANSLATIONS: InvoicePDFTranslations = {
    title: 'Invoice',
    invoiceFor: 'Invoice for',
    payableTo: 'Payable to',
    invoiceNumber: 'Invoice #',
    project: 'Project',
    dueDate: 'Due date',
    item: 'Item',
    description: 'Description',
    qty: 'Qty',
    unitPrice: 'Unit price',
    totalPrice: 'Total price',
    notes: 'Notes:',
    subtotal: 'Subtotal',
    adjustments: 'Adjustments',
    paidStamp: '✓ LUNAS / FULLY PAID',
    accountNumber: 'No. Rekening',
    accountName: 'a.n.',
    paymentConfirmation: 'Konfirmasi pembayaran dapat dikirim via WhatsApp ke {phone} atau email ke\n{email}',
    termsTitle: 'Syarat & Ketentuan :',
    additionalNotes: 'Catatan Tambahan :',
};

// Styles matching reference image
const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 10,
        color: colors.text,
    },
    // Header
    headerBar: {
        height: 4,
        backgroundColor: colors.accent,
        marginBottom: 20,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 30,
    },
    businessInfo: {
        fontSize: 9,
        color: colors.muted,
    },
    logo: {
        width: 80,
        height: 40,
        objectFit: 'contain',
    },
    // Title
    title: {
        fontSize: 36,
        color: colors.brand,
        marginBottom: 25,
        fontFamily: 'Helvetica-Bold',
    },
    // Info grid
    infoGrid: {
        flexDirection: 'row',
        marginBottom: 25,
    },
    infoColumn: {
        flex: 1,
        paddingRight: 15,
    },
    infoLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: colors.brand,
        marginBottom: 3,
    },
    infoValue: {
        fontSize: 10,
        color: colors.text,
        marginBottom: 8,
    },
    // Table
    table: {
        marginTop: 10,
        marginBottom: 20,
    },
    tableHeader: {
        flexDirection: 'row',
        borderBottomWidth: 2,
        borderBottomColor: colors.brand,
        paddingBottom: 8,
        marginBottom: 10,
    },
    tableHeaderCell: {
        fontWeight: 'bold',
        color: colors.brand,
        fontSize: 10,
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 5,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    colItem: { width: '18%' },
    colDesc: { width: '32%' },
    colQty: { width: '10%', textAlign: 'center' },
    colPrice: { width: '20%', textAlign: 'right' },
    colTotal: { width: '20%', textAlign: 'right' },
    // Notes
    notesSection: {
        marginTop: 15,
        marginBottom: 15,
    },
    notesLabel: {
        fontSize: 9,
        color: colors.muted,
    },
    notesValue: {
        fontSize: 9,
        color: colors.text,
    },
    // Totals
    totalsSection: {
        alignItems: 'flex-end',
        marginTop: 10,
    },
    totalsRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 5,
    },
    totalsLabel: {
        width: 100,
        textAlign: 'right',
        color: colors.muted,
        fontSize: 10,
    },
    totalsValue: {
        width: 100,
        textAlign: 'right',
        fontSize: 10,
    },
    totalFinal: {
        width: 100,
        textAlign: 'right',
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.brand,
    },
    paidStamp: {
        fontSize: 12,
        color: colors.accent,
        fontWeight: 'bold',
        marginTop: 5,
    },
    // Footer
    footer: {
        marginTop: 30,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    bankLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: colors.brand,
        marginBottom: 3,
    },
    bankInfo: {
        fontSize: 9,
        color: colors.text,
    },
    footerNote: {
        fontSize: 8,
        color: colors.muted,
        marginTop: 15,
    },
    // Page 2 - Terms
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: colors.brand,
        marginBottom: 8,
        textDecoration: 'underline',
    },
    termsText: {
        fontSize: 9,
        color: colors.text,
        lineHeight: 1.6,
    },
});

// Format currency as Indonesian Rupiah
function formatCurrency(amount: number): string {
    return `Rp${amount.toLocaleString('id-ID')}`;
}

// Format date as DD/MM/YYYY
function formatDate(isoDate: string): string {
    const d = new Date(isoDate);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

export interface InvoicePDFProps {
    invoice: Invoice;
    projectName?: string;
    translations?: InvoicePDFTranslations;
    logoBase64?: string; // Optional base64 encoded logo
}

export function InvoicePDF({ 
    invoice, 
    projectName, 
    translations = DEFAULT_INVOICE_TRANSLATIONS,
    logoBase64 
}: InvoicePDFProps) {
    const isPaid = invoice.status === 'paid';
    const t = translations;
    
    // Format payment confirmation message
    const paymentNote = t.paymentConfirmation
        .replace('{phone}', invoice.snapshot.businessPhone)
        .replace('{email}', invoice.snapshot.businessEmail);
    
    return (
        <Document>
            {/* Page 1 - Main Invoice */}
            <Page size="A4" style={styles.page}>
                {/* Green accent bar */}
                <View style={styles.headerBar} />
                
                {/* Header row */}
                <View style={styles.headerRow}>
                    <View style={styles.businessInfo}>
                        <Text>{invoice.snapshot.businessAddress}</Text>
                        <Text>{invoice.snapshot.businessPhone}</Text>
                    </View>
                    {logoBase64 ? (
                        <Image style={styles.logo} src={logoBase64} />
                    ) : (
                        <Image style={styles.logo} src={LOGO_PATH} />
                    )}
                </View>
                
                {/* Title */}
                <Text style={styles.title}>{t.title}</Text>
                
                {/* Info grid */}
                <View style={styles.infoGrid}>
                    <View style={styles.infoColumn}>
                        <Text style={styles.infoLabel}>{t.invoiceFor}</Text>
                        <Text style={styles.infoValue}>{invoice.snapshot.clientName}</Text>
                        <Text style={styles.infoValue}>{invoice.snapshot.clientAddress}</Text>
                    </View>
                    <View style={styles.infoColumn}>
                        <Text style={styles.infoLabel}>{t.payableTo}</Text>
                        <Text style={styles.infoValue}>{invoice.snapshot.businessName}</Text>
                        <Text style={styles.infoLabel}>{t.project}</Text>
                        <Text style={styles.infoValue}>{projectName || '-'}</Text>
                    </View>
                    <View style={styles.infoColumn}>
                        <Text style={styles.infoLabel}>{t.invoiceNumber}</Text>
                        <Text style={styles.infoValue}>{invoice.number}</Text>
                        <Text style={styles.infoLabel}>{t.dueDate}</Text>
                        <Text style={styles.infoValue}>{invoice.dueDate ? formatDate(invoice.dueDate) : '-'}</Text>
                    </View>
                </View>
                
                {/* Line items table */}
                <View style={styles.table}>
                    {/* Table header */}
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeaderCell, styles.colItem]}>{t.item}</Text>
                        <Text style={[styles.tableHeaderCell, styles.colDesc]}>{t.description}</Text>
                        <Text style={[styles.tableHeaderCell, styles.colQty]}>{t.qty}</Text>
                        <Text style={[styles.tableHeaderCell, styles.colPrice]}>{t.unitPrice}</Text>
                        <Text style={[styles.tableHeaderCell, styles.colTotal]}>{t.totalPrice}</Text>
                    </View>
                    
                    {/* Table rows */}
                    {invoice.lineItems.map((item) => (
                        <View key={item.id} style={styles.tableRow}>
                            <Text style={styles.colItem}>{item.itemName}</Text>
                            <Text style={styles.colDesc}>{item.description}</Text>
                            <Text style={styles.colQty}>{item.quantity}</Text>
                            <Text style={styles.colPrice}>{formatCurrency(item.unitPrice)}</Text>
                            <Text style={styles.colTotal}>{formatCurrency(item.total)}</Text>
                        </View>
                    ))}
                </View>
                
                {/* Notes */}
                {invoice.notes && (
                    <View style={styles.notesSection}>
                        <Text style={styles.notesLabel}>{t.notes}</Text>
                        <Text style={styles.notesValue}>{invoice.notes}</Text>
                    </View>
                )}
                
                {/* Totals */}
                <View style={styles.totalsSection}>
                    <View style={styles.totalsRow}>
                        <Text style={styles.totalsLabel}>{t.subtotal}</Text>
                        <Text style={styles.totalsValue}>{formatCurrency(invoice.subtotal)}</Text>
                    </View>
                    {invoice.adjustments !== 0 && (
                        <View style={styles.totalsRow}>
                            <Text style={styles.totalsLabel}>{t.adjustments}</Text>
                            <Text style={styles.totalsValue}>{formatCurrency(invoice.adjustments)}</Text>
                        </View>
                    )}
                    <View style={styles.totalsRow}>
                        <Text style={styles.totalsLabel}></Text>
                        <Text style={styles.totalFinal}>{formatCurrency(invoice.total)}</Text>
                    </View>
                    {isPaid && (
                        <Text style={styles.paidStamp}>{t.paidStamp}</Text>
                    )}
                </View>
                
                {/* Footer with bank info */}
                <View style={styles.footer}>
                    {invoice.snapshot.bankInfo && (
                        <>
                            <Text style={styles.bankLabel}>{invoice.snapshot.bankInfo.bankName} :</Text>
                            <Text style={styles.bankInfo}>{t.accountNumber}: {invoice.snapshot.bankInfo.accountNumber}</Text>
                            <Text style={styles.bankInfo}>{t.accountName} {invoice.snapshot.bankInfo.accountHolder}</Text>
                        </>
                    )}
                    <Text style={styles.footerNote}>{paymentNote}</Text>
                </View>
            </Page>
            
            {/* Page 2 - Terms & Notes (if present) */}
            {invoice.snapshot.terms && (
                <Page size="A4" style={styles.page}>
                    <Text style={styles.sectionTitle}>{t.termsTitle}</Text>
                    <Text style={styles.termsText}>{invoice.snapshot.terms}</Text>
                    
                    {invoice.notes && (
                        <>
                            <Text style={[styles.sectionTitle, { marginTop: 30 }]}>{t.additionalNotes}</Text>
                            <Text style={styles.termsText}>{invoice.notes}</Text>
                        </>
                    )}
                </Page>
            )}
        </Document>
    );
}

export default InvoicePDF;
