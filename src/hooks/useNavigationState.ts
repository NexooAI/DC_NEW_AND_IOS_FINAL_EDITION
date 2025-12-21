import { useRef, useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import { InteractionManager } from 'react-native';

import { logger } from '@/utils/logger';
interface NavigationState {
    isNavigating: boolean;
    currentRoute: string | null;
    navigationQueue: string[];
}

export const useNavigationState = () => {
    const router = useRouter();
    const [isNavigating, setIsNavigating] = useState(false);
    const navigationStateRef = useRef<NavigationState>({
        isNavigating: false,
        currentRoute: null,
        navigationQueue: [],
    });

    const navigate = useCallback(async (route: string) => {
        const state = navigationStateRef.current;

        // If already navigating, queue the navigation
        if (state.isNavigating || isNavigating) {
            state.navigationQueue.push(route);
            return;
        }

        // Set navigating state
        state.isNavigating = true;
        setIsNavigating(true);
        state.currentRoute = route;

        try {
            // Use InteractionManager to ensure UI is ready
            await new Promise(resolve => {
                InteractionManager.runAfterInteractions(() => {
                    resolve(true);
                });
            });

            // Use replace to prevent Fragment management issues
            await router.replace(route);

            // Process queued navigations
            if (state.navigationQueue.length > 0) {
                const nextRoute = state.navigationQueue.shift();
                if (nextRoute) {
                    setTimeout(() => navigate(nextRoute), 150);
                }
            }
        } catch (error) {
            logger.error('Navigation error:', error);
            // Fallback to push if replace fails
            try {
                await router.push(route);
            } catch (fallbackError) {
                logger.error('Fallback navigation error:', fallbackError);
            }
        } finally {
            state.isNavigating = false;
            setIsNavigating(false);
        }
    }, [router, isNavigating]);

    const clearNavigationQueue = useCallback(() => {
        navigationStateRef.current.navigationQueue = [];
        navigationStateRef.current.isNavigating = false;
        setIsNavigating(false);
    }, []);

    return {
        navigate,
        clearNavigationQueue,
        isNavigating,
    };
};
