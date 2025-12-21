import { useState, useEffect, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from '@/hooks/useTranslation';
import useGlobalStore from '@/store/global.store';

/**
 * Comprehensive hook pattern for drawer screen components
 * Ensures hook consistency and provides common functionality
 */
export function useDrawerScreenPattern<T = any>(options: {
    title: string;
    showBackButton?: boolean;
    showMenu?: boolean;
    showLanguageSwitcher?: boolean;
    backRoute?: string;
    hideBottomBar?: boolean;
    requireAuth?: boolean;
    onFocus?: () => void;
    onBlur?: () => void;
}) {
    // All hooks called at top level
    const { t } = useTranslation();
    const {
        user,
        isLoggedIn,
        setTabVisibility
    } = useGlobalStore();

    // Screen state
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<T | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    // Authentication state
    const isUserAuthenticated = useMemo(() => {
        if (!options.requireAuth) return true;
        return isLoggedIn && user && user.id;
    }, [isLoggedIn, user, options.requireAuth]);

    const showLoginPrompt = useMemo(() => {
        return options.requireAuth && !isUserAuthenticated;
    }, [options.requireAuth, isUserAuthenticated]);

    // Navigation configuration
    useFocusEffect(
        useCallback(() => {
            // Hide/show bottom bar
            if (options.hideBottomBar !== undefined) {
                setTabVisibility(!options.hideBottomBar);
            }

            // Call onFocus callback
            if (options.onFocus) {
                options.onFocus();
            }

            return () => {
                // Show bottom bar when leaving
                if (options.hideBottomBar !== undefined) {
                    setTabVisibility(true);
                }

                // Call onBlur callback
                if (options.onBlur) {
                    options.onBlur();
                }
            };
        }, [
            setTabVisibility,
            options
        ])
    );

    // Utility functions
    const setLoading = useCallback((loading: boolean) => {
        setIsLoading(loading);
    }, []);

    const setErrorState = useCallback((errorMessage: string | null) => {
        setError(errorMessage);
    }, []);

    const setScreenData = useCallback((newData: T | null) => {
        setData(newData);
    }, []);

    const resetState = useCallback(() => {
        setIsLoading(false);
        setError(null);
        setData(null);
        setRefreshing(false);
    }, []);

    const handleRefresh = useCallback(async (refreshFunction?: () => Promise<void>) => {
        setRefreshing(true);
        try {
            if (refreshFunction) {
                await refreshFunction();
            }
        } catch (err) {
            setError('Failed to refresh data');
        } finally {
            setRefreshing(false);
        }
    }, []);

    return {
        // Translation
        t,

        // User state
        user,
        isLoggedIn,
        isUserAuthenticated,
        showLoginPrompt,

        // Screen state
        isLoading,
        error,
        data,
        refreshing,

        // State setters
        setLoading,
        setErrorState,
        setScreenData,
        resetState,
        handleRefresh,
    };
}

/**
 * Hook for handling API calls in drawer screens
 * Ensures consistent error handling and loading states
 */
export function useDrawerApiCall<T = any>() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<T | null>(null);

    const executeApiCall = useCallback(async (
        apiFunction: () => Promise<T>,
        onSuccess?: (data: T) => void,
        onError?: (error: string) => void
    ) => {
        try {
            setIsLoading(true);
            setError(null);

            const result = await apiFunction();
            setData(result);

            if (onSuccess) {
                onSuccess(result);
            }

            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred';
            setError(errorMessage);

            if (onError) {
                onError(errorMessage);
            }

            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const resetApiState = useCallback(() => {
        setIsLoading(false);
        setError(null);
        setData(null);
    }, []);

    return {
        isLoading,
        error,
        data,
        executeApiCall,
        resetApiState,
    };
}

/**
 * Hook for handling form state in drawer screens
 * Provides consistent form management
 */
export function useDrawerForm<T extends Record<string, any>>(initialValues: T) {
    const [values, setValues] = useState<T>(initialValues);
    const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
    const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const setValue = useCallback((field: keyof T, value: any) => {
        setValues(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    }, [errors]);

    const setError = useCallback((field: keyof T, error: string) => {
        setErrors(prev => ({ ...prev, [field]: error }));
    }, []);

    const setTouchedField = useCallback((field: keyof T) => {
        setTouched(prev => ({ ...prev, [field]: true }));
    }, []);

    const resetForm = useCallback(() => {
        setValues(initialValues);
        setErrors({});
        setTouched({});
        setIsSubmitting(false);
    }, [initialValues]);

    const validateForm = useCallback((validationRules?: Partial<Record<keyof T, (value: any) => string | undefined>>) => {
        const newErrors: Partial<Record<keyof T, string>> = {};

        if (validationRules) {
            Object.keys(validationRules).forEach(field => {
                const fieldKey = field as keyof T;
                const validator = validationRules[fieldKey];
                if (validator) {
                    const error = validator(values[fieldKey]);
                    if (error) {
                        newErrors[fieldKey] = error;
                    }
                }
            });
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [values]);

    const handleSubmit = useCallback(async (
        onSubmit: (values: T) => Promise<void>
    ) => {
        setIsSubmitting(true);
        try {
            await onSubmit(values);
        } finally {
            setIsSubmitting(false);
        }
    }, [values]);

    return {
        values,
        errors,
        touched,
        isSubmitting,
        setValue,
        setError,
        setTouchedField,
        resetForm,
        validateForm,
        handleSubmit,
    };
}
