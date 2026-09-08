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
    showReferEarn?: number;
    showLuckyDraw?: number;
    showGoldScheme?: number;
    showSilverScheme?: number;
    showDiamondScheme?: number;
    showPlatinumScheme?: number;
    showOldGoldScheme?: number;
    showLoginBackgroundImages?: number;
    enableLoginBackgroundMovement?: number;
    showLangTamil?: number;
    showLangEnglish?: number;
    showLangHindi?: number;
    showLangMalayalam?: number;
    showLangTelugu?: number;
    // Bottom Tabs
    showTabHome?: number;
    showTabSavings?: number;
    showTabQuickJoin?: number;
    showTabRewards?: number;
    showTabProfile?: number;
    // Version 2 Home Screen & Dashboard controls
    showHomeV2?: number;
    enableHomeV2?: number;
    homeVersion?: string;
    showQuickActions?: number;
    enableDashboard?: number;
    showDashboard?: number;
    // Side Menu Drawer
    showSideReferEarn?: number;
    showSideTickets?: number;
    showSideOffers?: number;
    showSideStores?: number;
    showSideContactUs?: number;
    showSideFaq?: number;
    showSidePrivacy?: number;
    showSideTerms?: number;
    // Profile Settings
    showProfileKyc?: number;
    showProfileMpin?: number;
    showProfileBiometrics?: number;
    showProfileLanguage?: number;
    showProfileRateChart?: number;
    showProfileRateUs?: number;
    showProfilePaymentHistory?: number;
    showProfileDeleteAccount?: number;
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
                'showReferEarn', 'showLuckyDraw', 'showGoldScheme', 'showSilverScheme',
                'showDiamondScheme', 'showPlatinumScheme', 'showOldGoldScheme',
                'showLoginBackgroundImages', 'enableLoginBackgroundMovement',
                'showLangTamil', 'showLangEnglish', 'showLangHindi', 'showLangMalayalam', 'showLangTelugu',
                // Tabs
                'showTabHome', 'showTabSavings', 'showTabQuickJoin', 'showTabRewards', 'showTabProfile',
                // Side Menu
                'showSideReferEarn', 'showSideTickets', 'showSideOffers', 'showSideStores',
                'showSideContactUs', 'showSideFaq', 'showSidePrivacy', 'showSideTerms',
                // Profile Settings
                'showProfileKyc', 'showProfileMpin', 'showProfileBiometrics', 'showProfileLanguage',
                'showProfileRateChart', 'showProfileRateUs', 'showProfilePaymentHistory', 'showProfileDeleteAccount'
            ];
            return defaultVisible.includes(componentName);
        }
        // Ensure components default to true unless explicitly disabled (0)
        if (
            componentName === 'showGoldRate' || componentName === 'showReferEarn' || 
            componentName === 'showLuckyDraw' || componentName === 'showGoldScheme' || 
            componentName === 'showSilverScheme' || componentName === 'showDiamondScheme' || 
            componentName === 'showPlatinumScheme' || componentName === 'showOldGoldScheme' ||
            componentName === 'showLoginBackgroundImages' || componentName === 'enableLoginBackgroundMovement' ||
            componentName === 'showLangTamil' || componentName === 'showLangEnglish' || 
            componentName === 'showLangHindi' || componentName === 'showLangMalayalam' || 
            componentName === 'showLangTelugu' ||
            // Tabs
            componentName === 'showTabHome' || componentName === 'showTabSavings' || 
            componentName === 'showTabQuickJoin' || componentName === 'showTabRewards' || 
            componentName === 'showTabProfile' ||
            // Side Menu
            componentName === 'showSideReferEarn' || componentName === 'showSideTickets' || 
            componentName === 'showSideOffers' || componentName === 'showSideStores' || 
            componentName === 'showSideContactUs' || componentName === 'showSideFaq' || 
            componentName === 'showSidePrivacy' || componentName === 'showSideTerms' ||
            // Profile Settings
            componentName === 'showProfileKyc' || componentName === 'showProfileMpin' || 
            componentName === 'showProfileBiometrics' || componentName === 'showProfileLanguage' || 
            componentName === 'showProfileRateChart' || componentName === 'showProfileRateUs' || 
            componentName === 'showProfilePaymentHistory' || componentName === 'showProfileDeleteAccount'
        ) {
            return (visibleData as any)[componentName] !== 0;
        }
        return (visibleData as any)[componentName] === 1;
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
