import React, { useEffect, useRef } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useSegments } from "expo-router";
import { theme } from "@/constants/theme";
import { useTranslation } from "@/hooks/useTranslation";
import useGlobalStore from "@/store/global.store";
import { LinearGradient } from "expo-linear-gradient";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import ResponsiveText from "@/components/ResponsiveText";
import { useNavigationState } from "@/hooks/useNavigationState";

type Tab = {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
  badge?: number | null;
};

export default function CustomBottomBar(props: BottomTabBarProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const segments = useSegments();
  const { language } = useGlobalStore();
  const { unreadCount } = useUnreadNotifications();
  const { navigate, isNavigating } = useNavigationState();
  const current = segments[segments.length - 1] || "home";

  const {
    screenWidth,
    screenHeight,
    deviceScale,
    getResponsiveFontSize,
    getResponsivePadding,
    spacing,
    fontSize,
    padding,
    getCardWidth,
    getGridColumns,
    getListItemHeight,
  } = useResponsiveLayout();

  // Animation refs for each tab
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
  ];

  const tabs: Tab[] = [
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
    // {
    //   name: "home/gold_advance",
    //   label: "bottom_nav_gold_advance",
    //   icon: "diamond-outline",
    //   iconActive: "diamond",
    // },
    // {
    //   name: "notifications",
    //   label: "bottom_nav_notifications",
    //   icon: "notifications-outline",
    //   iconActive: "notifications",
    //   badge: unreadCount > 0 ? unreadCount : null,
    // },
    {
      name: "profile",
      label: "bottom_nav_profile",
      icon: "person-outline",
      iconActive: "person",
    },
  ];

  // Animate tab press
  const animateTabPress = (index: number) => {
    Animated.sequence([
      Animated.timing(tabAnimations[index], {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(tabAnimations[index], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Animate badge
  const animateBadge = (index: number) => {
    Animated.sequence([
      Animated.timing(badgeAnimations[index], {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(badgeAnimations[index], {
        toValue: 1,
        duration: 200,
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

  const handleTabPress = (tab: Tab, index: number) => {
    if (isNavigating) return; // Prevent multiple simultaneous navigations

    animateTabPress(index);
    if (tab.badge && tab.badge > 0) {
      animateBadge(index);
    }

    // Use the navigation state manager to prevent Fragment management errors
    navigate(`/(tabs)/${tab.name}`);
  };

  // Check if tab bar should be hidden - do this after all hooks are called
  if (hideTabBarRoutes.includes(current)) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="box-none">
      <LinearGradient
        colors={[
          "rgba(26, 42, 57, 0.95)", // Primary color with transparency
          "rgba(26, 42, 57, 0.98)", // Primary color with more opacity
          "rgba(26, 42, 57, 0.95)", // Primary color with transparency
        ]}
        style={styles.gradientContainer}
      >
        {tabs.map((tab, index) => {
          const isActive = current === tab.name;
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tab}
              onPress={() => handleTabPress(tab, index)}
              activeOpacity={0.7}
            >
              <Animated.View
                style={[
                  styles.tabContent,
                  {
                    transform: [{ scale: tabAnimations[index] }],
                  },
                ]}
              >
                <View style={styles.iconContainer}>
                  <Ionicons
                    name={isActive ? tab.iconActive : tab.icon}
                    size={26}
                    color={isActive ? theme.colors.secondary : "#ffffff"}
                  />
                  {tab.badge && (
                    <Animated.View
                      style={[
                        styles.badge,
                        {
                          transform: [{ scale: badgeAnimations[index] }],
                        },
                      ]}
                    >
                      <ResponsiveText
                        variant="caption"
                        size="xs"
                        weight="bold"
                        color="#fff"
                        align="center"
                        allowWrap={false}
                        maxLines={1}
                        adjustsFontSizeToFit={true}
                        minimumFontScale={0.6}
                        style={styles.badgeText}
                      >
                        {tab.badge > 99 ? "99+" : tab.badge}
                      </ResponsiveText>
                    </Animated.View>
                  )}
                </View>
                <ResponsiveText
                  variant="caption"
                  size="xs"
                  weight="medium"
                  color={isActive ? theme.colors.secondary : "#ffffff"}
                  align="center"
                  allowWrap={false}
                  maxLines={1}
                  adjustsFontSizeToFit={true}
                  minimumFontScale={0.7}
                  style={styles.label}
                >
                  {t(tab.label)}
                </ResponsiveText>
                {isActive && <View style={styles.activeIndicator} />}
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
    zIndex: 999, // High value
    elevation: 999, // Android
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  gradientContainer: {
    flex: 1,
    flexDirection: "row",
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 193, 12, 0.3)", // Gold accent border
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    position: "relative",
  },
  tabContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  iconContainer: {
    position: "relative",
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 2,
  },
  badge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#FF4444",
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "#fff",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#fff",
  },
  activeIndicator: {
    position: "absolute",
    bottom: -2,
    left: 0,
    right: 0,
    width: "auto",
    height: 3,
    backgroundColor: theme.colors.secondary, // Gold accent for active indicator
    borderRadius: 2,
    marginLeft: "auto",
    marginRight: "auto",
  },
});
