import Constants from "expo-constants";
import { Stack, useNavigation, useRouter, usePathname } from "expo-router";
import { useFirstLaunch } from "@/common/hooks/useFirstLaunch";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { logAppEvent, logDeviceInfo } from "@/services/appEventService";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  StatusBar,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "../global.css";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { initializeAppLocale } from "@/i18n";
import { LanguageProvider1 } from "@/contexts/LanguageContext";
import useGlobalStore, { useAppTheme, getAppConfig } from "@/store/global.store";
import * as SecureStore from "expo-secure-store";
import LoadingService from "@/services/loadingServices";
import setupAppStateListener from "@/store/appState";
import { theme } from "@/constants/theme";
import { RootSiblingParent } from "react-native-root-siblings";
import { SafeAreaProvider } from "react-native-safe-area-context";
import GlobalLoadingProvider from "@/components/GlobalLoadingProvider";
import { useForceUpdate } from "@/hooks/useForceUpdate";
import ForceUpdateScreen from "@/components/ForceUpdateScreen";
import { logger } from "@/utils/logger";

const getSecureItemWithTimeout = async (key: string, timeoutMs = 1500): Promise<string | null> => {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      logger.warn(`⚠️ SecureStore.getItemAsync('${key}') timed out after ${timeoutMs}ms.`);
      resolve(null);
    }, timeoutMs);

    SecureStore.getItemAsync(key)
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        logger.error(`Error reading ${key} from SecureStore:`, err);
        resolve(null);
      });
  });
};

interface NotificationData {
  type?: string;
  screen?: string;
  notificationId?: string;
  [key: string]: any;
}

let pendingNotificationData: NotificationData | null = null;

export default function RootLayout() {
  const theme = useAppTheme();
  const isExpoGo = Constants.executionEnvironment === "storeClient";
  const { isFirstLaunch } = useFirstLaunch();
  const router = useRouter();
  const navigation = useNavigation();
  const pathname = usePathname();
  const [overallLoading, setOverallLoading] = useState<boolean>(false);
  const { updateUser, setLanguage, isLoggedIn } = useGlobalStore();

  // Log screen view events when path changes
  useEffect(() => {
    if (pathname && isLoggedIn) {
      logAppEvent('view_screen', {
        screen_name: pathname,
        screen_source: 'navigation'
      });
    }
  }, [pathname, isLoggedIn]);

  // Log login success when isLoggedIn transitions to true
  const prevIsLoggedInRef = useRef(isLoggedIn);
  useEffect(() => {
    if (isLoggedIn && !prevIsLoggedInRef.current) {
      logAppEvent('login_success');
      logDeviceInfo(true); // Force device info log on login
    }
    prevIsLoggedInRef.current = isLoggedIn;
  }, [isLoggedIn]);

  const notificationResponseRef = useRef<any>(null);
  const isNavigationReady = useRef(false);

  const {
    isChecking: isCheckingUpdate,
    needsUpdate,
    updateInfo,
    retryCheck,
  } = useForceUpdate();

  // Trigger force update check on every navigation to home or root
  useEffect(() => {
    if (pathname && (pathname.includes("home") || pathname === "/")) {
      logger.log("🔄 Pathname changed to home/root, triggering force update check:", pathname);
      retryCheck();
    }
  }, [pathname, retryCheck]);

  const handleNotificationNavigation = useCallback(
    (data: NotificationData) => {
      logger.log("🔔 Handling notification navigation with data:", data);

      if (!isLoggedIn) {
        logger.log("⚠️ User not logged in, storing notification for post-login navigation");
        pendingNotificationData = data;
        router.replace("/(auth)/login");
        return;
      }

      const targetScreen = data?.screen || "notifications";
      const notificationType = data?.type || "general";

      try {
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
          case "ratechart":
          case "rate-chart":
            router.push("/(app)/(tabs)/home/ratechart");
            break;
          default:
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
              case "ratechart":
              case "rate_chart":
                router.push("/(app)/(tabs)/home/ratechart");
                break;
              default:
                router.push("/(app)/(tabs)/notifications");
                break;
            }
            break;
        }

        logger.log("✅ Navigated to screen based on notification");
      } catch (error) {
        logger.error("❌ Error navigating from notification:", error);
        try {
          router.push("/(app)/(tabs)/notifications");
        } catch (fallbackError) {
          logger.error("❌ Fallback navigation also failed:", fallbackError);
        }
      }
    },
    [router, isLoggedIn]
  );

  useEffect(() => {
    const initLanguage = async () => {
      try {
        const locale = await initializeAppLocale();
        setLanguage(locale as "en" | "mal" | "ta");
      } catch (error) {
        logger.error("Failed to initialize language:", error);
        setLanguage("en");
      }
    };

    initLanguage();
  }, [setLanguage]);

  useEffect(() => {
    if (isExpoGo) {
      return;
    }

    let responseSubscription: { remove: () => void } | null = null;
    let receivedSubscription: { remove: () => void } | null = null;
    let isMounted = true;

    const setupNotifications = async () => {
      const [{ default: NotificationService }, Notifications] = await Promise.all(
        [import("@/services/NotificationService"), import("expo-notifications")]
      );

      if (!isMounted) {
        return;
      }

      await NotificationService.setupNotifications();

      responseSubscription =
        Notifications.addNotificationResponseReceivedListener((response) => {
          logger.log(
            "🔔 Notification tapped:",
            response.notification.request.content
          );

          const data = response.notification.request.content
            .data as NotificationData;

          if (isNavigationReady.current && isLoggedIn) {
            setTimeout(() => {
              handleNotificationNavigation(data);
            }, 500);
          } else {
            pendingNotificationData = data;
            logger.log("📌 Stored notification for later navigation (not logged in or not ready)");
            if (!isLoggedIn) {
              router.replace("/(auth)/login");
            }
          }
        });

      receivedSubscription = Notifications.addNotificationReceivedListener(
        (notification) => {
          logger.log(
            "ðŸ”” Notification received in foreground:",
            notification.request.content
          );
        }
      );
    };

    setupNotifications().catch((error) => {
      logger.error("Error setting up notifications:", error);
    });

    return () => {
      isMounted = false;
      responseSubscription?.remove();
      receivedSubscription?.remove();
    };
  }, [handleNotificationNavigation, isExpoGo]);

  useEffect(() => {
    if (isExpoGo) {
      return;
    }

    const checkInitialNotification = async () => {
      try {
        const Notifications = await import("expo-notifications");
        const lastNotificationResponse =
          await Notifications.getLastNotificationResponseAsync();

        if (lastNotificationResponse) {
          logger.log(
            "🚀 App launched from notification:",
            lastNotificationResponse.notification.request.content
          );
          const data = lastNotificationResponse.notification.request.content
            .data as NotificationData;
          if (!isLoggedIn) {
            pendingNotificationData = data;
            router.replace("/(auth)/login");
          } else {
            notificationResponseRef.current = lastNotificationResponse;
          }
        }
      } catch (error) {
        logger.error("Error checking initial notification:", error);
      }
    };

    checkInitialNotification();
  }, [isExpoGo, isLoggedIn]);

  useEffect(() => {
    const timer = setTimeout(() => {
      isNavigationReady.current = true;

      if (notificationResponseRef.current && !isFirstLaunch) {
        const data = notificationResponseRef.current.notification.request.content
          .data as NotificationData;
        logger.log("ðŸ”„ Processing pending notification navigation");
        handleNotificationNavigation(data);
        notificationResponseRef.current = null;
      } else if (isFirstLaunch) {
        logger.log(
          "ðŸ†• First launch detected, ignoring any pending notifications"
        );
        notificationResponseRef.current = null;
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [handleNotificationNavigation, isFirstLaunch]);

  useEffect(() => {
    if (isLoggedIn && isNavigationReady.current && pendingNotificationData) {
      const data = pendingNotificationData;
      pendingNotificationData = null; // Clear first to prevent double runs
      logger.log("🔄 Processing pending notification after login:", data);
      setTimeout(() => {
        handleNotificationNavigation(data);
      }, 1000);
    }
  }, [isLoggedIn, handleNotificationNavigation]);

  useEffect(() => {
    const initializeUserData = async () => {
      try {
        const token = await getSecureItemWithTimeout("authToken");
        const storedUserData = await AsyncStorage.getItem("userData");

        if (token && storedUserData) {
          try {
            const parsedUser = JSON.parse(storedUserData);
            logger.auth("ðŸ” Layout: Found stored user data:", parsedUser);

            if (parsedUser.user_id) {
              updateUser({
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
                branch_id: parsedUser.branch_id,
                allow_multi_branch: parsedUser.allow_multi_branch,
              });
              logger.auth(
                "ðŸ” Layout: Updated global store with user data"
              );
            } else {
              logger.auth("ðŸ” Layout: No valid user_id found in stored data");
            }
          } catch (parseError) {
            logger.error("Error parsing stored user data:", parseError);
          }
        } else {
          logger.auth("ðŸ” Layout: No token or user data found");
        }
      } catch (error) {
        logger.error("Error retrieving stored user:", error);
      }
    };

    initializeUserData();
  }, [updateUser]);

  useEffect(() => {
    LoadingService.register((isLoading: boolean) => {
      setOverallLoading(isLoading);
    });
  }, []);

  useEffect(() => {
    return setupAppStateListener();
  }, []);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        const state = navigation.getState?.();
        const currentRoute = state?.routes?.[state.index];

        const allowedBackScreens = [
          "home",
          "savings",
          "transactions",
          "profile",
          "login",
        ];

        if (currentRoute && allowedBackScreens.includes(currentRoute.name)) {
          return false;
        }

        if (currentRoute?.name === "(tabs)" || currentRoute?.name === "index") {
          Alert.alert(
            "Exit App",
            "Are you sure you want to exit?",
            [
              { text: "Cancel", onPress: () => null, style: "cancel" },
              { text: "Exit", onPress: () => BackHandler.exitApp() },
            ],
            { cancelable: false }
          );
          return true;
        }

        return false;
      }
    );

    return () => backHandler.remove();
  }, [navigation]);

  console.log("🎨 RootLayout render state:", { needsUpdate, hasUpdateInfo: !!updateInfo, isCheckingUpdate });
  if (needsUpdate && updateInfo) {
    return (
      <ForceUpdateScreen
        currentVersion={updateInfo.currentVersion}
        latestVersion={updateInfo.latestVersion}
        storeUrl={updateInfo.storeUrl}
        onRetry={retryCheck}
      />
    );
  }

  if (isFirstLaunch === null || overallLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <RootSiblingParent>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <StatusBar
            barStyle="light-content"
            backgroundColor={theme.colors.primary}
            translucent={false}
          />
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
    </SafeAreaProvider>
  );
}
