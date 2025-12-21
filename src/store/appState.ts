import { AppState, AppStateStatus } from 'react-native';
import useGlobalStore from '../store/global.store';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

import { logger } from '@/utils/logger';
let appStateTimeout: NodeJS.Timeout | null = null;
let backgroundTime: number = 0;
// Increased timeout to prevent automatic logout - set to 30 minutes instead of 30 seconds
const BACKGROUND_TIMEOUT = 1800000; // 30 minutes - much longer to prevent unwanted logouts

const setupAppStateListener = () => {
  const subscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
    const { isLoggedIn } = useGlobalStore.getState();

    if (nextAppState === 'background') {
      // Record when app goes to background
      backgroundTime = Date.now();

      // Commented out automatic logout - keeping user logged in
      // appStateTimeout = setTimeout(() => {
      //   if (isLoggedIn) {
      //     useGlobalStore.getState().logout();
      //     // Clear sensitive data
      //     SecureStore.deleteItemAsync("authToken");
      //     router.replace("/(auth)/login");
      //   }
      // }, 300000); // 5 minutes
    }

    if (nextAppState === 'active') {
      // Clear the logout timeout
      if (appStateTimeout) {
        clearTimeout(appStateTimeout);
        appStateTimeout = null;
      }

      // Check if user is logged in and app was in background
      if (isLoggedIn && backgroundTime > 0) {
        const timeInBackground = Date.now() - backgroundTime;

        // Only require MPIN if app was in background for a very long time (30 minutes)
        if (timeInBackground > BACKGROUND_TIMEOUT) {
          try {
            // Check if user has valid token and MPIN
            const token = await SecureStore.getItemAsync("authToken");
            const storedMPIN = await SecureStore.getItemAsync("user_mpin");

            if (token && storedMPIN) {
              // Force MPIN verification for security only after very long background time
              router.replace("/(auth)/mpin_verify");
            } else if (!token) {
              // Only logout if no token exists
              useGlobalStore.getState().logout();
              router.replace("/(auth)/login");
            }
            // If token exists but no MPIN, just continue without logout
          } catch (error) {
            logger.error("Error checking authentication on app resume:", error);
            // Don't automatically logout on error - let user continue
          }
        }
        // If background time is less than threshold, just continue without any action
      }

      // Reset background time
      backgroundTime = 0;
    }
  });

  // Return cleanup function
  return () => {
    subscription.remove();
    if (appStateTimeout) {
      clearTimeout(appStateTimeout);
    }
  };
};

export default setupAppStateListener;