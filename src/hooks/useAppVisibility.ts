import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/utils/logger';
import api from '@/services/api';
import useGlobalStore from '@/store/global.store';

// Type definition for the API response
export interface AppVisibilityData {
    id: number;
    showGoldRate: number;
    showSilverRate: number;
    showCollection: number;
    showPoster: number;
    showFlashnews: number;
    showCustomerCard: number;
    showSchemes: number;
    showFlexiScheme: number;
    showFixedScheme: number;
    showDailyScheme: number;
    showWeeklyScheme: number;
    showMonthlyScheme: number;
    showSocialMedia: number;
    showSupportCard: number;
    showHallmark: number;
    showLiveChatBox: number;
    showTranslate: number;
    showYoutube: number;
    showSchemsPage: number;
    bypassToPayment: number;
    shortKyc: number;
    showDashboardAfterLogin?: number;
    updated_at: string;
}

export function useAppVisibility() {
    const visibleData = useGlobalStore((state) => state.cachedVisibility?.data);
    const [isLoading, setIsLoading] = useState(!visibleData);
    const [error, setError] = useState<string | null>(null);

    // Fetch visibility data from API
    const fetchVisibilityData = useCallback(async (forceRefresh: boolean = false) => {
        const storeState = useGlobalStore.getState();

        // Check if cache is valid first
        if (!forceRefresh && storeState.isVisibilityCacheValid()) {
            const cached = storeState.getCachedVisibility();
            logger.log("📦 [Cache] Using cached visibility data", {
                age: Date.now() - (cached?.timestamp || 0),
            });
            setIsLoading(false);
            return;
        }

        try {
            logger.log("📡 [API] Fetching app visibility data from API...");
            setIsLoading(true);
            setError(null);

            const response = await api.get('/app-visible');

            if (response.data) {
                storeState.setCachedVisibility(response.data);
                logger.log("✅ [API] App visibility data fetched successfully and cached");
            } else {
                throw new Error('No data received from API');
            }
        } catch (err: any) {
            const errorMessage = err?.response?.data?.message || err?.message || 'Failed to fetch visibility data';
            setError(errorMessage);
            logger.error("❌ [API] Error fetching app visibility data:", errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initial data fetch
    useEffect(() => {
        fetchVisibilityData();
    }, [fetchVisibilityData]);

    // Helper function to check if a component should be visible
    const isVisible = useCallback((componentName: keyof Omit<AppVisibilityData, 'id' | 'updated_at'>) => {
        if (!visibleData) {
            // Default core components to true if visibleData is not loaded yet
            const defaultVisible: Array<keyof Omit<AppVisibilityData, 'id' | 'updated_at'>> = [
                'showGoldRate', 'showPoster', 'showFlashnews', 'showCustomerCard',
                'showSchemes', 'showSocialMedia', 'showSupportCard', 'showHallmark',
                'showDashboardAfterLogin'
            ];
            return defaultVisible.includes(componentName);
        }
        // Ensure gold rate component defaults to true unless explicitly disabled (0)
        if (componentName === 'showGoldRate') {
            return visibleData[componentName] !== 0;
        }
        return visibleData[componentName] === 1;
    }, [visibleData]);

    // Helper function to get all visible components
    const getVisibleComponents = useCallback(() => {
        if (!visibleData) return [];

        const components = Object.keys(visibleData).filter(key =>
            key !== 'id' && key !== 'updated_at' && visibleData[key as keyof AppVisibilityData] === 1
        ) as (keyof Omit<AppVisibilityData, 'id' | 'updated_at'>)[];

        return components;
    }, [visibleData]);

    return {
        visibleData,
        isLoading,
        error,
        isVisible,
        getVisibleComponents,
        refetch: fetchVisibilityData,
    };
}
