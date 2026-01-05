// Business Dashboard Data Hook
// Aggregates data from invoices, contracts, and clients for dashboard widgets

import { useState, useEffect } from 'react';
import { listInvoices, subscribe as subscribeInvoices, type Invoice } from '../stores/invoiceStore';
import { listContracts, subscribe as subscribeContracts, type Contract } from '../stores/contractStore';
import { listClients, subscribe as subscribeClients, type Client } from '../stores/clientStore';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface MonthlyRevenue {
    month: string; // e.g., "Jan", "Feb"
    year: number;
    amount: number;
}

export interface BusinessDashboardStats {
    totalUnpaid: number;
    unpaidCount: number;
    overdueCount: number;
    activeClients: number;
    pendingContracts: number;
    revenueThisMonth: number;
}

export interface BusinessDashboardData {
    // Invoice data
    unpaidInvoices: Invoice[];
    overdueInvoices: Invoice[];
    paidInvoices: Invoice[];
    
    // Contract data
    contracts: Contract[];
    contractsByStatus: {
        draft: number;
        sent: number;
        signed: number;
    };
    
    // Client data
    clients: Client[];
    recentClients: Client[];
    
    // Revenue data
    monthlyRevenue: MonthlyRevenue[];
    
    // Quick stats
    stats: BusinessDashboardStats;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

function isOverdue(invoice: Invoice): boolean {
    if (!invoice.dueDate || invoice.status !== 'sent') return false;
    return new Date(invoice.dueDate) < new Date();
}

function getMonthName(monthIndex: number): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[monthIndex];
}

function groupByMonth(invoices: Invoice[]): MonthlyRevenue[] {
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // Initialize all months of current year
    const monthlyData: Map<string, MonthlyRevenue> = new Map();
    for (let i = 0; i < 12; i++) {
        const key = `${currentYear}-${i}`;
        monthlyData.set(key, {
            month: getMonthName(i),
            year: currentYear,
            amount: 0
        });
    }
    
    // Aggregate paid invoice amounts
    invoices.forEach(invoice => {
        if (invoice.status !== 'paid') return;
        
        const date = new Date(invoice.updatedAt || invoice.createdAt);
        const year = date.getFullYear();
        const month = date.getMonth();
        
        if (year === currentYear) {
            const key = `${year}-${month}`;
            const existing = monthlyData.get(key);
            if (existing) {
                existing.amount += invoice.total;
            }
        }
    });
    
    return Array.from(monthlyData.values());
}

function getRevenueThisMonth(invoices: Invoice[]): number {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return invoices
        .filter(i => i.status === 'paid')
        .filter(i => {
            const d = new Date(i.updatedAt || i.createdAt);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        })
        .reduce((sum, i) => sum + i.total, 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useBusinessDashboardData() {
    const [data, setData] = useState<BusinessDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        function loadData() {
            try {
                // Load raw data
                const invoices = listInvoices();
                const contracts = listContracts();
                const clients = listClients();
                
                // Filter invoices
                const unpaidInvoices = invoices.filter(i => i.status === 'sent');
                const overdueInvoices = unpaidInvoices.filter(isOverdue);
                const paidInvoices = invoices.filter(i => i.status === 'paid');
                
                // Group contracts by status
                const contractsByStatus = {
                    draft: contracts.filter(c => c.status === 'draft').length,
                    sent: contracts.filter(c => c.status === 'sent').length,
                    signed: contracts.filter(c => c.status === 'signed').length
                };
                
                // Get recent clients (sorted by most recently associated with invoices/contracts)
                const clientActivity = new Map<string, Date>();
                invoices.forEach(i => {
                    const date = new Date(i.updatedAt || i.createdAt);
                    const existing = clientActivity.get(i.clientId);
                    if (!existing || date > existing) {
                        clientActivity.set(i.clientId, date);
                    }
                });
                contracts.forEach(c => {
                    const date = new Date(c.updatedAt || c.createdAt);
                    const existing = clientActivity.get(c.clientId);
                    if (!existing || date > existing) {
                        clientActivity.set(c.clientId, date);
                    }
                });
                
                const recentClients = [...clients]
                    .map(client => ({
                        client,
                        lastActivity: clientActivity.get(client.id) || new Date(0)
                    }))
                    .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime())
                    .slice(0, 5)
                    .map(item => item.client);
                
                // Calculate monthly revenue
                const monthlyRevenue = groupByMonth(invoices);
                
                // Calculate stats
                const stats: BusinessDashboardStats = {
                    totalUnpaid: unpaidInvoices.reduce((sum, i) => sum + i.total, 0),
                    unpaidCount: unpaidInvoices.length,
                    overdueCount: overdueInvoices.length,
                    activeClients: clients.length,
                    pendingContracts: contractsByStatus.sent,
                    revenueThisMonth: getRevenueThisMonth(invoices)
                };
                
                setData({
                    unpaidInvoices,
                    overdueInvoices,
                    paidInvoices,
                    contracts,
                    contractsByStatus,
                    clients,
                    recentClients,
                    monthlyRevenue,
                    stats
                });
            } catch (err) {
                console.error('[useBusinessDashboardData] Failed to load data:', err);
            } finally {
                setLoading(false);
            }
        }
        
        // Initial load
        loadData();
        
        // Subscribe to store changes
        const unsubInvoices = subscribeInvoices(loadData);
        const unsubContracts = subscribeContracts(loadData);
        const unsubClients = subscribeClients(loadData);
        
        return () => {
            unsubInvoices();
            unsubContracts();
            unsubClients();
        };
    }, []);
    
    return { data, loading };
}

export default useBusinessDashboardData;
