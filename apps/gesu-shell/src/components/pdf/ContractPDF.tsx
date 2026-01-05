// Contract PDF Template - Matches Gesu Creative Lab contract design
// Uses @react-pdf/renderer for PDF generation
// Updated with i18n support, logo integration, and design tokens

import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { type Contract } from '../../stores/contractStore';

// Logo path (relative to public folder)
const LOGO_PATH = '/Logo/GCL Logo.png';

// Color scheme - Aligned with design tokens
const colors = {
    brand: '#3B3F8C',    // tokens-brand-DEFAULT
    text: '#1a1a1a',     // tokens-fg
    muted: '#666666',    // tokens-muted
    border: '#e5e5e5',   // tokens-border
};

// i18n translations interface
export interface ContractPDFTranslations {
    title: string;
    section1Title: string;
    section1Content: string;
    section2Title: string;
    section2Intro: string;
    section2Outro: string;
    section3Title: string;
    section3Bullets: string[];
    section4Title: string;
    section4Intro: string;
    section4Bullets: string[];
    section4Outro: string;
    section5Title: string;
    section5Content: string;
    section5Outro: string;
    section6Title: string;
    section6Bullets: string[];
    section7Title: string;
    designerLabel: string;
    clientLabel: string;
}

// Default Indonesian translations
export const DEFAULT_CONTRACT_TRANSLATIONS: ContractPDFTranslations = {
    title: 'Kontrak Proyek',
    section1Title: 'Informasi Umum',
    section1Content: 'Kontrak ini dibuat antara {businessName} ("Desainer") dan {clientName} ("Klien"). Kedua belah pihak menyetujui syarat dan ketentuan di bawah ini terkait proyek desain yang disepakati.',
    section2Title: 'Ruang Lingkup Proyek',
    section2Intro: 'Desainer akan menyediakan layanan sesuai kebutuhan klien, berupa salah satu atau gabungan dari:',
    section2Outro: 'Detail proyek akan didiskusikan dan disepakati sebelum pengerjaan dimulai.',
    section3Title: 'Waktu dan Revisi',
    section3Bullets: [
        'Pengerjaan proyek dimulai setelah pembayaran uang muka (30%).',
        'Klien mendapatkan maksimal 8 kali revisi gratis.',
        'Revisi tambahan akan dikenakan biaya sesuai kesepakatan.',
        'Estimasi waktu kerja akan diinformasikan sesuai jenis proyek.',
    ],
    section4Title: 'Pembayaran',
    section4Intro: 'Total biaya proyek dibagi dalam dua tahap:',
    section4Bullets: [
        '30% sebagai uang muka (non-refundable)',
        '70% setelah proyek selesai, sebelum file akhir dikirimkan.',
    ],
    section4Outro: 'Pembayaran dilakukan melalui metode yang disepakati bersama.',
    section5Title: 'Hak Cipta & Portofolio',
    section5Content: 'Hak cipta desain akan menjadi milik klien setelah pembayaran penuh. Namun, {businessName} berhak menggunakan hasil desain sebagai portofolio terbatas di media sosial resmi.',
    section5Outro: 'Hak komersial tambahan dapat didiskusikan jika diperlukan.',
    section6Title: 'Pembatalan & Komunikasi',
    section6Bullets: [
        'Klien dapat membatalkan sebelum pengerjaan dimulai. Setelah uang muka dibayarkan, pembatalan tidak akan mengembalikan dana tersebut.',
        'Jika klien tidak merespon selama 7 hari berturut-turut tanpa pemberitahuan, proyek dianggap dibatalkan sepihak.',
        'Komunikasi proyek dilakukan melalui:',
        'Email: {businessEmail}',
        'Desainer berhak menolak revisi besar di luar kesepakatan awal.',
    ],
    section7Title: 'Tanda Tangan',
    designerLabel: 'Desainer',
    clientLabel: 'Klien',
};

// Styles matching reference image
const styles = StyleSheet.create({
    page: {
        padding: 50,
        fontFamily: 'Helvetica',
        fontSize: 11,
        color: colors.text,
        paddingBottom: 80,
    },
    titleSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    mainTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.brand,
        textDecoration: 'underline',
        marginBottom: 5,
    },
    contractNumber: {
        fontSize: 10,
        color: colors.muted,
    },
    section: {
        marginBottom: 15,
    },
    sectionNumber: {
        fontWeight: 'bold',
        marginRight: 5,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: colors.brand,
        marginBottom: 8,
    },
    sectionContent: {
        fontSize: 10,
        lineHeight: 1.6,
        textAlign: 'justify',
    },
    bulletList: {
        marginLeft: 15,
        marginTop: 5,
    },
    bulletItem: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    bullet: {
        width: 15,
        fontSize: 10,
    },
    bulletText: {
        flex: 1,
        fontSize: 10,
    },
    signatureSection: {
        marginTop: 50,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    signatureColumn: {
        width: '40%',
        alignItems: 'center',
    },
    signatureLabel: {
        fontSize: 10,
        marginBottom: 50,
    },
    signatureLine: {
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        width: '80%',
        marginBottom: 5,
    },
    signatureName: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    signatureCompany: {
        fontSize: 9,
        color: colors.muted,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 50,
        right: 50,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerLogo: {
        width: 60,
        height: 30,
        objectFit: 'contain',
    },
    footerPage: {
        fontSize: 9,
        color: colors.muted,
    },
});

export interface ContractPDFProps {
    contract: Contract;
    projectName?: string;
    translations?: ContractPDFTranslations;
    logoBase64?: string;
    ownerName?: string; // Business owner name for signature
}

export function ContractPDF({ 
    contract, 
    translations = DEFAULT_CONTRACT_TRANSLATIONS,
    logoBase64,
    ownerName = 'I Gede Surya Dharma'
}: ContractPDFProps) {
    const t = translations;
    
    // Replace placeholders in translations
    const formatText = (text: string): string => {
        return text
            .replace(/{businessName}/g, contract.snapshot.businessName)
            .replace(/{clientName}/g, contract.snapshot.clientName)
            .replace(/{businessEmail}/g, contract.snapshot.businessEmail);
    };
    
    // Build sections with contract data
    const contractSections = [
        {
            number: 1,
            title: t.section1Title,
            content: formatText(t.section1Content),
        },
        {
            number: 2,
            title: t.section2Title,
            content: t.section2Intro,
            bullets: contract.scope.map(s => s.description),
            postContent: t.section2Outro,
        },
        {
            number: 3,
            title: t.section3Title,
            bullets: t.section3Bullets,
        },
        {
            number: 4,
            title: t.section4Title,
            content: t.section4Intro,
            bullets: t.section4Bullets,
            postContent: t.section4Outro,
        },
        {
            number: 5,
            title: t.section5Title,
            content: formatText(t.section5Content),
            postContent: t.section5Outro,
        },
        {
            number: 6,
            title: t.section6Title,
            bullets: t.section6Bullets.map(b => formatText(b)),
        },
        {
            number: 7,
            title: t.section7Title,
            isSignature: true,
        },
    ];
    
    const page1Sections = contractSections.slice(0, 5);
    const page2Sections = contractSections.slice(5);
    
    const renderSection = (section: typeof contractSections[0]) => {
        if (section.isSignature) {
            return (
                <View key={section.number} style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        <Text style={styles.sectionNumber}>{section.number}.</Text> {section.title}
                    </Text>
                    
                    <View style={styles.signatureSection}>
                        <View style={styles.signatureColumn}>
                            <Text style={styles.signatureLabel}>{t.designerLabel}</Text>
                            <Text style={styles.signatureCompany}>{contract.snapshot.businessName}</Text>
                            <View style={styles.signatureLine} />
                            <Text style={styles.signatureName}>{ownerName}</Text>
                        </View>
                        <View style={styles.signatureColumn}>
                            <Text style={styles.signatureLabel}>{t.clientLabel}</Text>
                            <Text style={styles.signatureCompany}>{contract.snapshot.clientCompany || 'Brand'}</Text>
                            <View style={styles.signatureLine} />
                            <Text style={styles.signatureName}>{contract.snapshot.clientName}</Text>
                        </View>
                    </View>
                </View>
            );
        }
        
        return (
            <View key={section.number} style={styles.section}>
                <Text style={styles.sectionTitle}>
                    <Text style={styles.sectionNumber}>{section.number}.</Text> {section.title}
                </Text>
                
                {section.content && (
                    <Text style={styles.sectionContent}>{section.content}</Text>
                )}
                
                {section.bullets && section.bullets.length > 0 && (
                    <View style={styles.bulletList}>
                        {section.bullets.map((bullet, idx) => (
                            <View key={idx} style={styles.bulletItem}>
                                <Text style={styles.bullet}>•</Text>
                                <Text style={styles.bulletText}>{bullet}</Text>
                            </View>
                        ))}
                    </View>
                )}
                
                {section.postContent && (
                    <Text style={[styles.sectionContent, { marginTop: 8 }]}>{section.postContent}</Text>
                )}
            </View>
        );
    };
    
    return (
        <Document>
            {/* Page 1 */}
            <Page size="A4" style={styles.page}>
                {/* Title */}
                <View style={styles.titleSection}>
                    <Text style={styles.mainTitle}>{t.title}</Text>
                    <Text style={styles.contractNumber}>{contract.number}</Text>
                </View>
                
                {/* Sections */}
                {page1Sections.map(renderSection)}
                
                {/* Footer */}
                <View style={styles.footer} fixed>
                    {logoBase64 ? (
                        <Image style={styles.footerLogo} src={logoBase64} />
                    ) : (
                        <Image style={styles.footerLogo} src={LOGO_PATH} />
                    )}
                    <Text style={styles.footerPage} render={({ pageNumber }) => `${pageNumber}`} />
                </View>
            </Page>
            
            {/* Page 2 - Remaining sections */}
            {page2Sections.length > 0 && (
                <Page size="A4" style={styles.page}>
                    {page2Sections.map(renderSection)}
                    
                    {/* Footer */}
                    <View style={styles.footer} fixed>
                        {logoBase64 ? (
                            <Image style={styles.footerLogo} src={logoBase64} />
                        ) : (
                            <Image style={styles.footerLogo} src={LOGO_PATH} />
                        )}
                        <Text style={styles.footerPage} render={({ pageNumber }) => `${pageNumber}`} />
                    </View>
                </Page>
            )}
        </Document>
    );
}

export default ContractPDF;
