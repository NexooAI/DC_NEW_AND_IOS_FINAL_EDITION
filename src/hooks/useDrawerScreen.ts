import { useCallback, useState, useEffect, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from './useTranslation';
import useGlobalStore from '@/store/global.store';

interface DrawerScreenOptions {
    title: string;
    showBackButton?: boolean;
    showMenu?: boolean;
    showLanguageSwitcher?: boolean;
    backRoute?: string;
    hideBottomBar?: boolean;
}

/**
 * Custom hook for drawer screen consistency
 * Ensures all hooks are called unconditionally and handles navigation options properly
 */
export function useDrawerScreen(options: DrawerScreenOptions) {
    const { t } = useTranslation();
    const { setTabVisibility } = useGlobalStore();

    // Update tab visibility on focus
    useFocusEffect(
        useCallback(() => {
            // Hide/show bottom bar if specified
            if (options.hideBottomBar !== undefined) {
                setTabVisibility(!options.hideBottomBar);
            }

            return () => {
                // Show bottom bar when leaving screen
                if (options.hideBottomBar !== undefined) {
                    setTabVisibility(true);
                }
            };
        }, [setTabVisibility, options])
    );

    return { t };
}

/**
 * Hook for handling loading states in drawer screens
 * Prevents hook inconsistency by ensuring all hooks are called
 */
export function useDrawerScreenState() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<any>(null);

    const setLoading = useCallback((loading: boolean) => {
        setIsLoading(loading);
    }, []);

    const setErrorState = useCallback((errorMessage: string | null) => {
        setError(errorMessage);
    }, []);

    const setScreenData = useCallback((newData: any) => {
        setData(newData);
    }, []);

    const resetState = useCallback(() => {
        setIsLoading(false);
        setError(null);
        setData(null);
    }, []);

    return {
        isLoading,
        error,
        data,
        setLoading,
        setErrorState,
        setScreenData,
        resetState,
    };
}

/**
 * Hook for handling user authentication state in drawer screens
 * Ensures consistent hook calls regardless of user state
 */
export function useDrawerAuthState() {
    const { user, isLoggedIn } = useGlobalStore();
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);

    // Check if user is properly authenticated
    const isUserAuthenticated = useMemo(() => {
        return isLoggedIn && user && user.id;
    }, [isLoggedIn, user]);

    // Show login prompt if user is not authenticated
    useEffect(() => {
        if (!isUserAuthenticated) {
            setShowLoginPrompt(true);
        } else {
            setShowLoginPrompt(false);
        }
    }, [isUserAuthenticated]);

    return {
        user,
        isLoggedIn,
        isUserAuthenticated,
        showLoginPrompt,
        setShowLoginPrompt,
    };
}
