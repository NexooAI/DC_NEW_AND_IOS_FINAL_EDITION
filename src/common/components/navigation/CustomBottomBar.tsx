import React, { useEffect, useRef } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Platform,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useSegments } from "expo-router";
import { theme } from "@/constants/theme";
import { useTranslation } from "@/hooks/useTranslation";
import useGlobalStore, { useAppTheme, getAppConfig } from "@/store/global.store";
import { useAppVisibility } from "@/hooks/useAppVisibility";
import { LinearGradient } from "expo-linear-gradient";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import ResponsiveText from "@/components/ResponsiveText";
import { getFullImageUrl } from "@/utils/imageUtils";
import { useNavigationState } from "@/hooks/useNavigationState";

type Tab = {
  name: string;
  label: string;
  icon: any;
  iconActive: any;
  badge?: number | null;
};

const TabProfileIcon = ({ source, defaultIcon, color, size, isActive, themeSecondary }: any) => {
  const [hasError, setHasError] = React.useState(false);
  if (source && !hasError) {
    return (
      <Image
        source={source}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: isActive ? 1.5 : 0,
          borderColor: themeSecondary,
        }}
        resizeMode="cover"
        onError={() => setHasError(true)}
      />
    );
  }
  return <Ionicons name={defaultIcon} size={size} color={color} />;
};

export default function CustomBottomBar(props: BottomTabBarProps) {
  const theme = useAppTheme();
  styles = getStyles(theme);
  const { t } = useTranslation();
  const router = useRouter();
  const segments = useSegments();
  const { language, user } = useGlobalStore();
  const { unreadCount } = useUnreadNotifications();
  const { isVisible } = useAppVisibility();

  const getProfileImageSource = () => {
    if (user?.profileImage) {
      return { uri: getFullImageUrl(user.profileImage) };
    }
    return undefined;
  };
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

  const hasDashboard = getAppConfig().constants.enableDashboard;

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
    ...(hasDashboard ? [{
      name: "dashboard_tab",
      label: "dashboard",
      icon: "grid-outline" as keyof typeof Ionicons.glyphMap,
      iconActive: "grid" as keyof typeof Ionicons.glyphMap,
    }] : []),
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
  ].filter(tab => {
    if (tab.name === "home") return isVisible("showTabHome");
    if (tab.name === "savings") return isVisible("showTabSavings");
    if (tab.name === "rewards") return isVisible("showTabRewards");
    if (tab.name === "profile") return isVisible("showTabProfile");
    return true;
  });

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

    if (tab.name === "dashboard_tab") {
      router.push("/(app)/dashboard");
    } else {
      // Use the navigation state manager to prevent Fragment management errors
      navigate(`/(tabs)/${tab.name}`);
    }
  };

  // Check if tab bar should be hidden - do this after all hooks are called
  if (hideTabBarRoutes.includes(current)) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="box-none">
      <LinearGradient
        colors={[
          theme.colors.primary,
          theme.colors.primary,
          theme.colors.primary,
        ]}
        style={styles.gradientContainer}
      >
        {tabs.map((tab, index) => {
          const isActive = current === tab.name || (tab.name === "dashboard_tab" && current === "dashboard");
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
                  <TabProfileIcon
                    source={tab.name === "profile" ? getProfileImageSource() : undefined}
                    defaultIcon={isActive ? tab.iconActive : tab.icon}
                    color={isActive ? theme.colors.secondary : theme.colors.textLight || "#ffffff"}
                    size={26}
                    isActive={isActive}
                    themeSecondary={theme.colors.secondary}
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
                        color={theme.colors.textLight || "#ffffff"}
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
                  color={isActive ? theme.colors.secondary : theme.colors.textLight || "#ffffff"}
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

function getStyles(theme: any) { return StyleSheet.create({
  container: {
    width: "100%",
    zIndex: 999, // High value
    elevation: 999, // Android
    borderTopWidth: 1.5,
    borderTopColor: theme.colors.borderGold || theme.colors.secondary || "rgba(255, 193, 12, 0.3)", // Gold accent border
  },
  gradientContainer: {
    flexDirection: "row",
    height: Platform.OS === "ios" ? 75 : 60,
    paddingBottom: Platform.OS === "ios" ? 15 : 0,
    alignItems: "center",
    justifyContent: "space-around",
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
}) }

var styles = getStyles(theme);;
