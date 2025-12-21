import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import api from '@/services/api';
import { logger } from '@/utils/logger';

// TypeScript interface for the API response
export interface VisibilityConfig {
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
    updated_at: string;
}

// Hook return type
export interface UseDynamicVisibilityReturn {
    // State
    visibilityConfig: VisibilityConfig | null;
    isLoading: boolean;
    error: string | null;

    // Methods
    fetchVisibilityConfig: () => Promise<void>;
    refreshConfig: () => Promise<void>;
    isVisible: (key: keyof Omit<VisibilityConfig, 'id' | 'updated_at'>) => boolean;
    resetState: () => void;
}

/**
 * Custom hook for managing dynamic component visibility based on API response
 * 
 * Features:
 * - Fetches visibility configuration from API
 * - Provides loading and error states
 * - Offers utility methods for checking visibility
 * - Handles refresh functionality
 * - Type-safe with TypeScript interfaces
 * 
 * @param apiEndpoint - The API endpoint to fetch visibility config from
 * @param autoFetch - Whether to automatically fetch on mount (default: true)
 * @returns Object containing state and methods for managing visibility
 */
export function useDynamicVisibility(
    apiEndpoint: string = '/visibility-config',
    autoFetch: boolean = true
): UseDynamicVisibilityReturn {
    // State management
    const [visibilityConfig, setVisibilityConfig] = useState<VisibilityConfig | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Fetches visibility configuration from the API
     */
    const fetchVisibilityConfig = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            logger.log('🔍 Fetching visibility configuration from:', apiEndpoint);

            const response = await api.get(apiEndpoint);

            if (response.data) {
                setVisibilityConfig(response.data);
                logger.log('✅ Visibility configuration loaded successfully:', response.data);
            } else {
                throw new Error('No data received from API');
            }
        } catch (err: any) {
            const errorMessage = err?.response?.data?.message || err?.message || 'Failed to fetch visibility configuration';
            setError(errorMessage);
            logger.error('❌ Error fetching visibility configuration:', errorMessage);

            // Show user-friendly error message
            Alert.alert(
                'Configuration Error',
                'Unable to load component visibility settings. Some features may not be available.',
                [{ text: 'OK' }]
            );
        } finally {
            setIsLoading(false);
        }
    }, [apiEndpoint]);

    /**
     * Refreshes the visibility configuration
     */
    const refreshConfig = useCallback(async () => {
        await fetchVisibilityConfig();
    }, [fetchVisibilityConfig]);

    /**
     * Checks if a specific component should be visible
     * @param key - The visibility key to check
     * @returns true if the component should be visible (value is 1), false otherwise
     */
    const isVisible = useCallback((key: keyof Omit<VisibilityConfig, 'id' | 'updated_at'>): boolean => {
        if (!visibilityConfig) {
            return false; // Default to hidden if config not loaded
        }

        const value = visibilityConfig[key];
        return value === 1;
    }, [visibilityConfig]);

    /**
     * Resets all state to initial values
     */
    const resetState = useCallback(() => {
        setVisibilityConfig(null);
        setIsLoading(false);
        setError(null);
    }, []);

    // Auto-fetch on mount if enabled
    useEffect(() => {
        if (autoFetch) {
            fetchVisibilityConfig();
        }
    }, [autoFetch, fetchVisibilityConfig]);

    return {
        visibilityConfig,
        isLoading,
        error,
        fetchVisibilityConfig,
        refreshConfig,
        isVisible,
        resetState,
    };
}

export default useDynamicVisibility;
