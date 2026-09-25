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
    showTabDashboard?: number;
    showBottomNavDashboard?: number | boolean;
    bottomNavStyle?: 'v1_classic' | 'v2_floating' | 'v3_center_fab' | 'v4_curved' | string;
    bottomNavVersion?: number | string;
    bottomNavCenterTab?: string;
    bottomNavTabsOrder?: string;
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
    // Home Page V2 Keys & Order
    showV2LiveRates?: number;
    showV2Stories?: number;
    showV2Poster?: number;
    showV2QuickActions?: number;
    showV2PopularSchemes?: number;
    showV2Savings?: number;
    showV2SocialMedia?: number;
    showV2SupportCard?: number;
    showV2LiveChatBox?: number;
    homeV2SectionsOrder?: string;
    homeSectionsOrder?: string;
    rewardScreenVersion?: 'v1' | 'v2' | string;
    rewardsVersion?: 'v1' | 'v2' | string;
    enableRewardsV2?: number | boolean;
    loginScreenVersion?: number;
    loginVersion?: string | number;
    schemesVersion?: 'v1' | 'v2' | string;
    schemes_version?: string;
    enableSchemesV2?: number | boolean;
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
                'showProfileRateChart', 'showProfileRateUs', 'showProfilePaymentHistory', 'showProfileDeleteAccount',
                // Home V2 Sections
                'showV2LiveRates', 'showV2Stories', 'showV2Poster', 'showV2QuickActions',
                'showV2PopularSchemes', 'showV2Savings', 'showV2SocialMedia', 'showV2SupportCard', 'showV2LiveChatBox'
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
            componentName === 'showProfilePaymentHistory' || componentName === 'showProfileDeleteAccount' ||
            // Home V2 Sections
            componentName === 'showV2LiveRates' || componentName === 'showV2Stories' ||
            componentName === 'showV2Poster' || componentName === 'showV2QuickActions' ||
            componentName === 'showV2PopularSchemes' || componentName === 'showV2Savings' ||
            componentName === 'showV2SocialMedia' || componentName === 'showV2SupportCard' ||
            componentName === 'showV2LiveChatBox'
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
        isSchemesV2: isSchemesV2Active(visibleData),
        getVisibleComponents,
        refetch: fetchVisibilityData,
    };
}

/**
 * Resolves whether Schemes Version 2 is active.
 * Checks API visibleData first, then fallback to theme.config.js
 */
export function isSchemesV2Active(visibleData?: any): boolean {
    const { themeConfig } = require('@/constants/theme.config');
    const apiVer = (
        visibleData?.schemesVersion ||
        visibleData?.schemes_version ||
        (visibleData as any)?.enable_schemes_v2
    )?.toString()?.toLowerCase()?.trim();

    if (apiVer === "v2" || apiVer === "1" || visibleData?.enableSchemesV2 === 1) return true;
    if (apiVer === "v1" || apiVer === "0" || visibleData?.enableSchemesV2 === 0) return false;

    const configVer = (
        (themeConfig as any)?.schemesVersion ||
        (themeConfig as any)?.schemes_version
    )?.toString()?.toLowerCase()?.trim();

    if (configVer === "v2") return true;
    return false;
}
