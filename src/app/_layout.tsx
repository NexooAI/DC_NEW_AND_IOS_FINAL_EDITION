import { Drawer } from "expo-router/drawer";
import Constants from 'expo-constants';
import { Stack, useRouter, useNavigation } from "expo-router";

import { useFirstLaunch } from "@/common/hooks/useFirstLaunch";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ActivityIndicator,
  View,
  StyleSheet,
  Alert,
  BackHandler,
  Platform,
  StatusBar,
  StatusBarStyle,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "../global.css";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { initializeAppLocale } from "@/i18n";
import { LanguageProvider1 } from "@/contexts/LanguageContext";
import useGlobalStore from "@/store/global.store";
import * as SecureStore from "expo-secure-store";
import LoadingService from "@/services/loadingServices";
import setupAppStateListener from "@/store/appState";
import { theme } from "@/constants/theme";
import NotificationService from "@/services/NotificationService";
import * as Notifications from "expo-notifications";
import { RootSiblingParent } from "react-native-root-siblings";
import GlobalLoadingProvider from "@/components/GlobalLoadingProvider";
import { useForceUpdate } from "@/hooks/useForceUpdate";
import ForceUpdateScreen from "@/components/ForceUpdateScreen";
import { logger } from "@/utils/logger";

// Define notification data type for deep linking
interface NotificationData {
  type?: string;
  screen?: string;
  notificationId?: string;
  [key: string]: any;
}

export default function RootLayout() {
  const { isFirstLaunch } = useFirstLaunch();
  const router = useRouter();
  const navigation = useNavigation();
  const [overallLoading, setOverallLoading] = useState<boolean>(false);
  const { user, updateUser, setLanguage, isLoggedIn } = useGlobalStore();

  // Ref to track if we've handled the initial notification
  const notificationResponseRef = useRef<Notifications.NotificationResponse | null>(null);
  const isNavigationReady = useRef(false);

  // Force update check
  const {
    isChecking: isCheckingUpdate,
    needsUpdate,
    updateInfo,
    retryCheck,
  } = useForceUpdate();

  // Function to handle notification navigation
  const handleNotificationNavigation = useCallback((data: NotificationData) => {
    logger.log("🔔 Handling notification navigation with data:", data);

    // Prevent navigation if user is not logged in
    if (!isLoggedIn) {
      logger.log("⚠️ User not logged in, ignoring notification navigation");
      return;
    }

    // Default to notifications screen if no specific screen is provided
    const targetScreen = data?.screen || "notifications";
    const notificationType = data?.type || "general";

    try {
      // Navigate based on notification type or screen
      switch (targetScreen) {
        case "notifications":
          router.push("/(app)/(tabs)/notifications");
          break;
        case "home":
          router.push("/(app)/(tabs)/home");
          break;
        case "transactions":
          router.push("/(app)/(tabs)/transactions");
          break;
        case "savings":
          router.push("/(app)/(tabs)/savings");
          break;
        case "profile":
          router.push("/(app)/(tabs)/profile");
          break;
        case "schemes":
          router.push("/(app)/(tabs)/home/schemes");
          break;
        case "gold-rate":
          router.push("/(app)/(tabs)/home/goldRate");
          break;
        default:
          // If type-based navigation
          switch (notificationType) {
            case "offer":
            case "offers":
              router.push("/(app)/(tabs)/home/schemes");
              break;
            case "transaction":
              router.push("/(app)/(tabs)/transactions");
              break;
            case "rate":
            case "gold_rate":
              router.push("/(app)/(tabs)/home/goldRate");
              break;
            case "reminder":
            case "alert":
            case "blog":
            default:
              // Default: go to notifications screen
              router.push("/(app)/(tabs)/notifications");
              break;
          }
      }

      logger.log("✅ Navigated to screen based on notification");
    } catch (error) {
      logger.error("❌ Error navigating from notification:", error);
      // Fallback: try to navigate to notifications
      try {
        router.push("/(app)/(tabs)/notifications");
      } catch (fallbackError) {
        logger.error("❌ Fallback navigation also failed:", fallbackError);
      }
    }
  }, [router, isLoggedIn]); // Add isLoggedIn dependency

  // Initialize language on app start
  useEffect(() => {
    const initLanguage = async () => {
      try {
        const locale = await initializeAppLocale();
        setLanguage(locale as "en" | "mal" | "ta");
      } catch (error) {
        logger.error("Failed to initialize language:", error);
        setLanguage("en"); // fallback
      }
    };

    initLanguage();
  }, [setLanguage]);

  // Setup notification handlers
  useEffect(() => {
    const setupNotifications = async () => {
      await NotificationService.setupNotifications();
    };

    setupNotifications();

    // Handle notification tap when app is in background or foreground
    // Only add listeners if NOT in Expo Go (to avoid crashes)
    if (Constants.executionEnvironment !== 'storeClient') {
      const responseSubscription = Notifications.addNotificationResponseReceivedListener(
        (response) => {
          logger.log("🔔 Notification tapped:", response.notification.request.content);

          const data = response.notification.request.content.data as NotificationData;

          // If navigation is ready, navigate immediately
          if (isNavigationReady.current) {
            // Small delay to ensure navigation state is stable
            setTimeout(() => {
              handleNotificationNavigation(data);
            }, 500);
          } else {
            // Store the response to handle after navigation is ready
            notificationResponseRef.current = response;
            logger.log("📌 Stored notification for later navigation");
          }
        }
      );

      // Handle notification received while app is in foreground (optional: show in-app alert)
      const receivedSubscription = Notifications.addNotificationReceivedListener(
        (notification) => {
          logger.log("🔔 Notification received in foreground:", notification.request.content);
          // You can show an in-app toast/banner here if needed
        }
      );

      return () => {
        responseSubscription.remove();
        receivedSubscription.remove();
      };
    }
  }, [handleNotificationNavigation]);

  // Handle initial notification (when app is launched from killed state by tapping notification)
  useEffect(() => {
    const checkInitialNotification = async () => {
      try {
        // Get the notification that launched the app (if any)
        const lastNotificationResponse = await Notifications.getLastNotificationResponseAsync();

        if (lastNotificationResponse) {
          logger.log("🚀 App launched from notification:", lastNotificationResponse.notification.request.content);

          const data = lastNotificationResponse.notification.request.content.data as NotificationData;

          // Store for navigation after app is ready
          notificationResponseRef.current = lastNotificationResponse;
        }
      } catch (error) {
        logger.error("Error checking initial notification:", error);
      }
    };

    checkInitialNotification();
  }, []);

  // Navigate when navigation is ready and we have a pending notification
  useEffect(() => {
    // Set navigation as ready after a short delay to ensure Stack is mounted
    const timer = setTimeout(() => {
      isNavigationReady.current = true;

      // Check if we have a pending notification to handle
      // Only process notifications if NOT first launch
      if (notificationResponseRef.current && !isFirstLaunch) {
        const data = notificationResponseRef.current.notification.request.content.data as NotificationData;
        logger.log("🔄 Processing pending notification navigation");
        handleNotificationNavigation(data);
        notificationResponseRef.current = null; // Clear after handling
      } else if (isFirstLaunch) {
        logger.log("🆕 First launch detected, ignoring any pending notifications");
        notificationResponseRef.current = null; // Clear preventing future triggers
      }
    }, 1500); // Wait for navigation to be fully ready

    return () => clearTimeout(timer);
  }, [handleNotificationNavigation, isFirstLaunch]);

  // Initialize user data from storage (without navigation)
  useEffect(() => {
    const initializeUserData = async () => {
      try {
        const token = await SecureStore.getItemAsync("authToken");
        const storedUserData = await AsyncStorage.getItem("userData");

        if (token && storedUserData) {
          try {
            const parsedUser = JSON.parse(storedUserData);
            logger.auth("🔍 Layout: Found stored user data:", parsedUser);

            // Only update global store if we have valid user data
            if (parsedUser.user_id) {
              const globalStoreUser = {
                id: parsedUser.user_id,
                name: parsedUser.name,
                email: parsedUser.email,
                mobile: parsedUser.mobile_number,
                profileImage: parsedUser.profile_photo || "",
                idProof: "",
                referralCode: parsedUser.referralCode || "",
                rewards: 0,
                mpinStatus: parsedUser.mpinStatus,
                usertype: parsedUser.userType,
              };
              updateUser(globalStoreUser);
              logger.auth("🔍 Layout: Updated global store with user data");
            } else {
              logger.auth("🔍 Layout: No valid user_id found in stored data");
            }
          } catch (parseError) {
            logger.error("Error parsing stored user data:", parseError);
          }
        } else {
          logger.auth("🔍 Layout: No token or user data found");
        }
      } catch (error) {
        logger.error("Error retrieving stored user:", error);
      }
    };

    initializeUserData();
  }, [updateUser]);

  // Register loading service
  useEffect(() => {
    LoadingService.register((isLoading: boolean) => {
      setOverallLoading(isLoading);
    });
  }, []);

  // Setup app state listener
  useEffect(() => {
    return setupAppStateListener();
  }, []);

  // Android back button handler
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        // Get current route
        const state = navigation.getState?.();
        const currentRoute = state?.routes?.[state.index];

        // Allow back on certain screens
        const allowedBackScreens = [
          "home",
          "savings",
          "transactions",
          "profile",
          "login",
        ];

        if (currentRoute && allowedBackScreens.includes(currentRoute.name)) {
          return false; // Allow default behavior
        }

        // On main tabs, show exit confirmation
        if (currentRoute?.name === "(tabs)" || currentRoute?.name === "index") {
          Alert.alert(
            "Exit App",
            "Are you sure you want to exit?",
            [
              {
                text: "Cancel",
                onPress: () => null,
                style: "cancel",
              },
              {
                text: "Exit",
                onPress: () => BackHandler.exitApp(),
              },
            ],
            { cancelable: false }
          );
          return true; // Prevent default behavior
        }

        return false; // Allow default behavior for other screens
      }
    );

    return () => backHandler.remove();
  }, [navigation]);

  // Show force update screen if update is required (skip in dev builds)
  if (!__DEV__ && needsUpdate && updateInfo) {
    return (
      <ForceUpdateScreen
        currentVersion={updateInfo.currentVersion}
        latestVersion={updateInfo.latestVersion}
        storeUrl={updateInfo.storeUrl}
        onRetry={retryCheck}
      />
    );
  }

  // Show loading while checking for updates or first launch
  if (isFirstLaunch === null || isCheckingUpdate) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <RootSiblingParent>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} translucent={false} />
        <LanguageProvider1>
          <GlobalLoadingProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="intro" options={{ gestureEnabled: false }} />
              <Stack.Screen name="login" options={{ gestureEnabled: false }} />
              <Stack.Screen
                name="[...missing]"
                options={{
                  gestureEnabled: false,
                  animation: "fade",
                }}
              />
            </Stack>
          </GlobalLoadingProvider>
        </LanguageProvider1>
      </GestureHandlerRootView>
    </RootSiblingParent>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.overlayDark,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
});
