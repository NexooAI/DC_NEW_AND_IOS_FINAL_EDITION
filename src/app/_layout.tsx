import "@/services/networkInterceptor";
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
import * as Linking from "expo-linking";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "../global.css";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { initializeAppLocale } from "@/i18n";
import { LanguageProvider1 } from "@/contexts/LanguageContext";
import useGlobalStore from "@/store/global.store";
import * as SecureStore from "expo-secure-store";
import LoadingService from "@/services/loadingServices";
import setupAppStateListener from "@/store/appState";
import { theme } from "@/constants/theme";
import { RootSiblingParent } from "react-native-root-siblings";
import GlobalLoadingProvider from "@/components/GlobalLoadingProvider";
import { useForceUpdate } from "@/hooks/useForceUpdate";
import ForceUpdateScreen from "@/components/ForceUpdateScreen";
import { logger } from "@/utils/logger";
import { fetchRemoteConfig } from "@/services/configService";

interface NotificationData {
  type?: string;
  screen?: string;
  notificationId?: string;
  [key: string]: any;
}

export default function RootLayout() {
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
      logger.log("ðŸ”” Handling notification navigation with data:", data);

      if (!isLoggedIn) {
        logger.log("âš ï¸ User not logged in, ignoring notification navigation");
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
          case "gold_rate":
          case "rate":
          case "ratechart":
            router.push("/(app)/(tabs)/home/ratechart");
            break;
          case "lucky_draw":
          case "luckydraw":
            router.push("/(app)/lucky_draw");
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
                router.push("/(app)/(tabs)/home/ratechart");
                break;
              case "lucky_draw":
              case "luckydraw":
                router.push("/(app)/lucky_draw");
                break;
              default:
                router.push("/(app)/(tabs)/notifications");
                break;
            }
            break;
        }

        logger.log("âœ… Navigated to screen based on notification");
      } catch (error) {
        logger.error("âŒ Error navigating from notification:", error);
        try {
          router.push("/(app)/(tabs)/notifications");
        } catch (fallbackError) {
          logger.error("âŒ Fallback navigation also failed:", fallbackError);
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

  const currentDeepLinkUrl = Linking.useURL();

  // Deep link listener to capture and cache referral code across app cold starts/redirects
  useEffect(() => {
    if (!currentDeepLinkUrl) return;
    logger.log("🔗 [_layout] Expo Linking useURL detected URL:", currentDeepLinkUrl);
    
    const parseAndSaveReferralCode = async (urlStr: string) => {
      try {
        let referralCode: string | null = null;
        const regex = /[?&](code|emp_code|employee_code|referral_code|empCode)=([^&]+)/i;
        
        // Try direct matching
        const match = urlStr.match(regex);
        if (match && match[2]) {
          referralCode = match[2];
        } else {
          // Check for nested link query parameter (e.g. Firebase Dynamic Links)
          const nestedUrlMatch = urlStr.match(/[?&]link=([^&]+)/i);
          if (nestedUrlMatch && nestedUrlMatch[1]) {
            const decodedNestedUrl = decodeURIComponent(nestedUrlMatch[1]);
            const nestedMatch = decodedNestedUrl.match(regex);
            if (nestedMatch && nestedMatch[2]) {
              referralCode = nestedMatch[2];
            }
          }
        }

        if (referralCode) {
          const cleanCode = referralCode.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().trim();
          if (cleanCode && cleanCode.length === 6) {
            logger.log("✅ [_layout] Saved pending referral code to AsyncStorage:", cleanCode);
            await AsyncStorage.setItem("pendingReferralCode", cleanCode);
          }
        }
      } catch (error) {
        logger.error("❌ [_layout] Error parsing deep link URL:", error);
      }
    };

    parseAndSaveReferralCode(currentDeepLinkUrl);
  }, [currentDeepLinkUrl]);

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
            "ðŸ”” Notification tapped:",
            response.notification.request.content
          );

          const data = response.notification.request.content
            .data as NotificationData;

          if (isNavigationReady.current) {
            setTimeout(() => {
              handleNotificationNavigation(data);
            }, 500);
          } else {
            notificationResponseRef.current = response;
            logger.log("ðŸ“Œ Stored notification for later navigation");
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
            "ðŸš€ App launched from notification:",
            lastNotificationResponse.notification.request.content
          );
          notificationResponseRef.current = lastNotificationResponse;
        }
      } catch (error) {
        logger.error("Error checking initial notification:", error);
      }
    };

    checkInitialNotification();
  }, [isExpoGo]);

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
    const initializeUserData = async () => {
      try {
        try {
          await fetchRemoteConfig();
        } catch (configErr) {
          logger.error("Error fetching remote config:", configErr);
        }

        const token = await SecureStore.getItemAsync("authToken");
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
  );
}
