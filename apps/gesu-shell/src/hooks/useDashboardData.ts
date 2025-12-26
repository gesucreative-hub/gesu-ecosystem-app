/**
 * useDashboardData Hook
 * 
 * React hook for loading dashboard data from Compass snapshots
 */

import { useState, useEffect } from 'react';
import { useGesuSettings } from '../lib/gesuSettings';
import { loadDashboardData, DashboardData } from '../services/dashboardDataUtils';

export function useDashboardData() {
    const { settings } = useGesuSettings();
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function fetchData() {
            try {
                setIsLoading(true);
                setError(null);

                const dashboardData = await loadDashboardData(settings?.paths?.workflowRoot);

                if (isMounted) {
                    setData(dashboardData);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        fetchData();

        return () => {
            isMounted = false;
        };
    }, [settings?.paths?.workflowRoot]);

    const refresh = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const dashboardData = await loadDashboardData(settings?.paths?.workflowRoot);
            setData(dashboardData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
        } finally {
            setIsLoading(false);
        }
    };

    return {
        data,
        isLoading,
        error,
        refresh,
    };
}
