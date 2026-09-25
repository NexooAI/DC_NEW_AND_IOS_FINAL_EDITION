import React, { useEffect, useRef } from "react";
import { Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useSegments } from "expo-router";
import useGlobalStore, { useAppTheme, getAppConfig } from "@/store/global.store";
import { useAppVisibility, isSchemesV2Active } from "@/hooks/useAppVisibility";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { getFullImageUrl } from "@/utils/imageUtils";
import { useNavigationState } from "@/hooks/useNavigationState";

import BottomBarV1Classic from "./bars/BottomBarV1Classic";
import BottomBarV2Floating from "./bars/BottomBarV2Floating";
import BottomBarV3CenterFab from "./bars/BottomBarV3CenterFab";
import BottomBarV4Curved from "./bars/BottomBarV4Curved";
import { TabItem, BottomBarProps } from "./bars/types";

export type BottomNavStyleType =
  | "v1_classic"
  | "v2_floating"
  | "v3_center_fab"
  | "v4_curved";

/**
 * Resolves which bottom bar style should be rendered.
 * Priority:
 * 1. Admin API (useAppVisibility.bottomNavStyle)
 * 2. Admin API numeric version (useAppVisibility.bottomNavVersion: 1..4)
 * 3. Local Config (theme.config.js / getAppConfig().bottomNavStyle)
 * 4. Local Config numeric version (theme.config.js / getAppConfig().bottomNavVersion: 1..4)
 * 5. Default Fallback ("v1_classic")
 */
export function resolveBottomNavStyle(
  apiVisibility?: any,
  appConfig?: any
): BottomNavStyleType {
  // 1. API string style
  const apiStyle = apiVisibility?.bottomNavStyle?.toString()?.toLowerCase()?.trim();
  if (apiStyle) {
    if (apiStyle.includes("v2") || apiStyle.includes("float")) return "v2_floating";
    if (apiStyle.includes("v3") || apiStyle.includes("fab") || apiStyle.includes("center"))
      return "v3_center_fab";
    if (apiStyle.includes("v4") || apiStyle.includes("curve")) return "v4_curved";
    if (apiStyle.includes("v1") || apiStyle.includes("classic")) return "v1_classic";
  }

  // 2. API numeric version
  const apiVersion = Number(apiVisibility?.bottomNavVersion);
  if (apiVersion === 2) return "v2_floating";
  if (apiVersion === 3) return "v3_center_fab";
  if (apiVersion === 4) return "v4_curved";
  if (apiVersion === 1) return "v1_classic";

  // 3. Local config string style
  const configStyle = (
    appConfig?.bottomNavStyle ||
    appConfig?.constants?.bottomNavStyle
  )
    ?.toString()
    ?.toLowerCase()
    ?.trim();

  if (configStyle) {
    if (configStyle.includes("v2") || configStyle.includes("float")) return "v2_floating";
    if (configStyle.includes("v3") || configStyle.includes("fab") || configStyle.includes("center"))
      return "v3_center_fab";
    if (configStyle.includes("v4") || configStyle.includes("curve")) return "v4_curved";
    if (configStyle.includes("v1") || configStyle.includes("classic")) return "v1_classic";
  }

  // 4. Local config numeric version
  const configVersion = Number(
    appConfig?.bottomNavVersion || appConfig?.constants?.bottomNavVersion
  );
  if (configVersion === 2) return "v2_floating";
  if (configVersion === 3) return "v3_center_fab";
  if (configVersion === 4) return "v4_curved";
  if (configVersion === 1) return "v1_classic";

  return "v1_classic";
}

/**
 * Resolves whether the 5th Dashboard tab should be displayed in the bottom bar.
 */
export function resolveShowDashboardTab(
  apiVisibility?: any,
  appConfig?: any
): boolean {
  if (
    apiVisibility?.showBottomNavDashboard !== undefined &&
    apiVisibility?.showBottomNavDashboard !== null
  ) {
    return (
      Number(apiVisibility.showBottomNavDashboard) === 1 ||
      apiVisibility.showBottomNavDashboard === true
    );
  }
  if (
    apiVisibility?.showTabDashboard !== undefined &&
    apiVisibility?.showTabDashboard !== null
  ) {
    return Number(apiVisibility.showTabDashboard) === 1;
  }
  if (appConfig?.showBottomNavDashboard !== undefined) {
    return Boolean(appConfig.showBottomNavDashboard);
  }
  if (appConfig?.constants?.showBottomNavDashboard !== undefined) {
    return Boolean(appConfig.constants.showBottomNavDashboard);
  }
  return Boolean(appConfig?.constants?.enableDashboard);
}

export default function CustomBottomBar(props: BottomTabBarProps) {
  const theme = useAppTheme();
  const router = useRouter();
  const segments = useSegments();
  const { user, isTabVisible } = useGlobalStore();
  const { unreadCount } = useUnreadNotifications();
  const { isVisible, visibleData: apiVisibility } = useAppVisibility();
  const { navigate, isNavigating } = useNavigationState();
  const appConfig = getAppConfig();

  const current = segments[segments.length - 1] || "home";

  // Animation refs for up to 5 tabs
  const tabAnimations = useRef(
    [0, 1, 2, 3, 4].map(() => new Animated.Value(1))
  ).current;
  const badgeAnimations = useRef(
    [0, 1, 2, 3, 4].map(() => new Animated.Value(1))
  ).current;

  // List of special pages where the tab bar should be hidden
  const hideTabBarRoutes = [
    "offers",
    "refer_earn",
    "our_stores",
    "contact_us",
    "about_us",
    "faq",
    "ourPolicies",
    "privacyPolicy",
    "termsAndConditionsPolicies",
    "policies/ourPolicies",
    "policies/privacyPolicy",
    "policies/termsAndConditionsPolicies",
    "payment-success",
    "payment-failure",
    "SavingsDetail",
    "savings/SavingsDetail",
  ];

  // Resolve style and 4 vs 5 tabs dashboard inclusion
  const effectiveStyle = resolveBottomNavStyle(apiVisibility, appConfig);
  const hasDashboard = resolveShowDashboardTab(apiVisibility, appConfig);

  const tabs: TabItem[] = [
    {
      name: "home",
      label: "bottom_nav_home",
      icon: "home-outline",
      iconActive: "home",
    },
    {
      name: "savings",
      label: "bottom_nav_savings",
      icon: "wallet-outline",
      iconActive: "wallet",
    },
    ...(hasDashboard
      ? [
          {
            name: "dashboard_tab",
            label: "dashboard",
            icon: "grid-outline" as keyof typeof Ionicons.glyphMap,
            iconActive: "grid" as keyof typeof Ionicons.glyphMap,
          },
        ]
      : []),
    {
      name: "rewards",
      label: "rewards",
      icon: "gift-outline" as keyof typeof Ionicons.glyphMap,
      iconActive: "gift" as keyof typeof Ionicons.glyphMap,
    },
    {
      name: "profile",
      label: "bottom_nav_profile",
      icon: "person-outline",
      iconActive: "person",
    },
  ].filter((tab) => {
    if (tab.name === "home") return isVisible("showTabHome");
    if (tab.name === "savings") return isVisible("showTabSavings");
    if (tab.name === "dashboard_tab") return isVisible("showTabDashboard");
    if (tab.name === "rewards") return isVisible("showTabRewards");
    if (tab.name === "profile") return isVisible("showTabProfile");
    return true;
  });

  // Animate tab press
  const animateTabPress = (index: number) => {
    if (!tabAnimations[index]) return;
    Animated.sequence([
      Animated.timing(tabAnimations[index], {
        toValue: 0.82,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.timing(tabAnimations[index], {
        toValue: 1,
        duration: 90,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Animate badge
  const animateBadge = (index: number) => {
    if (!badgeAnimations[index]) return;
    Animated.sequence([
      Animated.timing(badgeAnimations[index], {
        toValue: 1.25,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(badgeAnimations[index], {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Animate badges on mount or when badge count changes
  useEffect(() => {
    tabs.forEach((tab, index) => {
      if (tab.badge && tab.badge > 0) {
        setTimeout(() => animateBadge(index), index * 100);
      }
    });
  }, [unreadCount]);

  const handleTabPress = (tab: TabItem, index: number) => {
    if (isNavigating) return;

    animateTabPress(index);
    if (tab.badge && tab.badge > 0) {
      animateBadge(index);
    }

    if (tab.name === "dashboard_tab") {
      router.push("/(app)/dashboard");
    } else {
      navigate(`/(tabs)/${tab.name}`);
    }
  };

  const isSavingsDetail =
    segments.some((s) => s?.toString()?.toLowerCase() === "savingsdetail") ||
    current?.toString()?.toLowerCase() === "savingsdetail";

  const isSchemesV2 = isSchemesV2Active(apiVisibility);
  const isOnSchemesPage =
    segments.some((s) => s?.toString()?.toLowerCase() === "schemes") ||
    current?.toString()?.toLowerCase() === "schemes" ||
    current?.toString()?.toLowerCase() === "scheme_detail_v2";

  // If tab visibility is turned off globally, or if in Schemes on Version 2, hide the bottom bar completely
  if (!isTabVisible || (isSchemesV2 && isOnSchemesPage) || hideTabBarRoutes.includes(current) || isSavingsDetail) {
    return null;
  }

  const commonProps: BottomBarProps = {
    tabs,
    current,
    onTabPress: handleTabPress,
    primaryColor: theme?.colors?.primary || "#0e1e38",
    secondaryColor: theme?.colors?.secondary || "#d4af37",
    userProfileImage: user?.profileImage
      ? getFullImageUrl(user.profileImage)
      : undefined,
    tabAnimations,
    badgeAnimations,
  };

  switch (effectiveStyle) {
    case "v2_floating":
      return <BottomBarV2Floating {...commonProps} />;
    case "v3_center_fab":
      return <BottomBarV3CenterFab {...commonProps} />;
    case "v4_curved":
      return <BottomBarV4Curved {...commonProps} />;
    case "v1_classic":
    default:
      return <BottomBarV1Classic {...commonProps} />;
  }
}
