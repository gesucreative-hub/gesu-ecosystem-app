// Currency formatting utilities
// Used by Pricelist, Invoice, Contract, and Finance Snapshot pages

const CURRENCY_SYMBOLS: Record<string, string> = {
    IDR: 'Rp',
    USD: '$',
    EUR: '€',
    SGD: 'S$',
    MYR: 'RM',
    GBP: '£',
    JPY: '¥',
    AUD: 'A$',
};

/**
 * Get the symbol for a currency code
 */
export function getCurrencySymbol(currency: string = 'IDR'): string {
    return CURRENCY_SYMBOLS[currency] || currency;
}

/**
 * Format a number with the currency symbol
 */
export function formatCurrency(amount: number, currency: string = 'IDR'): string {
    const symbol = getCurrencySymbol(currency);
    // Use locale formatting for number with thousand separators
    const formatted = amount.toLocaleString('id-ID'); // Indonesian locale uses dot for thousands
    return `${symbol} ${formatted}`;
}
