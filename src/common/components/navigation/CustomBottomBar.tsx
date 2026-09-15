import React, { useEffect, useRef, useMemo } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useSegments } from "expo-router";
import { useTranslation } from "@/hooks/useTranslation";
import useGlobalStore, { useAppTheme } from "@/store/global.store";
import { useAppVisibility } from "@/hooks/useAppVisibility";
import { LinearGradient } from "expo-linear-gradient";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import ResponsiveText from "@/components/ResponsiveText";
import { getFullImageUrl } from "@/utils/imageUtils";
import { useNavigationState } from "@/hooks/useNavigationState";

type Tab = {
  name: string;
  label: string;
  icon: any;
  iconActive: any;
  badge?: number | null;
  isCenter?: boolean;
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

export default function CustomBottomBar(_props?: any) {
  const theme = useAppTheme();
  const styles = getStyles(theme);
  const { t } = useTranslation();
  const router = useRouter();
  const segments = useSegments();
  const { user } = useGlobalStore();
  const { unreadCount } = useUnreadNotifications();
  const { isVisible, visibleData } = useAppVisibility();
  const { navigate, isNavigating } = useNavigationState();

  const current = segments[segments.length - 1] || "home";

  // Dynamic Settings from API
  const bottomNavStyle = (visibleData?.bottomNavStyle || "v2_floating") as
    | "v1_classic"
    | "v2_floating"
    | "v3_center_fab"
    | "v4_curved";
  const bottomNavTabsOrder = visibleData?.bottomNavTabsOrder || "home,savings,quick_join,rewards,profile";
  const bottomNavCenterTab = visibleData?.bottomNavCenterTab || "quick_join";

  const getProfileImageSource = () => {
    if (user?.profileImage) {
      return { uri: getFullImageUrl(user.profileImage) };
    }
    return undefined;
  };

  // Animation refs for each tab (supports up to 6 tabs)
  const tabAnimations = useRef(
    [0, 1, 2, 3, 4, 5].map(() => new Animated.Value(1))
  ).current;
  const badgeAnimations = useRef(
    [0, 1, 2, 3, 4, 5].map(() => new Animated.Value(1))
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

  const hasDashboard = Boolean(
    theme?.constants?.enableDashboard ||
    visibleData?.enableDashboardV2 === 1 ||
    visibleData?.enableDashboard === 1
  );

  const tabs: Tab[] = useMemo(() => {
    const rawTabs: Tab[] = [
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
      ...(isVisible("showTabQuickJoin") ? [{
        name: "quick_join",
        label: "quickJoin",
        icon: "flash-outline" as keyof typeof Ionicons.glyphMap,
        iconActive: "flash" as keyof typeof Ionicons.glyphMap,
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
      if (tab.name === "quick_join") return isVisible("showTabQuickJoin");
      if (tab.name === "dashboard_tab") {
        return Boolean(
          hasDashboard &&
          visibleData?.enableDashboardV2 !== 0 &&
          visibleData?.enableDashboard !== 0 &&
          (visibleData?.enableDashboardV2 === 1 || visibleData?.enableDashboard === 1 || isVisible("enableDashboardV2" as any))
        );
      }
      if (tab.name === "rewards") return isVisible("showTabRewards");
      if (tab.name === "profile") return isVisible("showTabProfile");
      return true;
    });

    // 1. Order tabs dynamically
    const orderArray = bottomNavTabsOrder.split(",").map((s: string) => s.trim());
    const sortedTabs = [...rawTabs].sort((a, b) => {
      const idxA = orderArray.indexOf(a.name);
      const idxB = orderArray.indexOf(b.name);
      if (idxA === -1 && idxB === -1) return 0;
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });

    // 2. Format for v3_center_fab if selected
    if (bottomNavStyle === "v3_center_fab" && sortedTabs.length >= 3) {
      let targetCenterName = bottomNavCenterTab;
      let centerIdx = sortedTabs.findIndex(t => t.name === targetCenterName);
      if (centerIdx === -1) {
        centerIdx = sortedTabs.findIndex(t => t.name === "quick_join");
      }
      if (centerIdx === -1) {
        centerIdx = Math.floor(sortedTabs.length / 2);
      }

      const centerTab = { ...sortedTabs[centerIdx], isCenter: true };
      const remainingTabs = sortedTabs.filter((_, i) => i !== centerIdx);
      const half = Math.floor(remainingTabs.length / 2);

      return [...remainingTabs.slice(0, half), centerTab, ...remainingTabs.slice(half)];
    }

    return sortedTabs;
  }, [hasDashboard, visibleData, isVisible, bottomNavStyle, bottomNavTabsOrder, bottomNavCenterTab]);

  // Animate tab press
  const animateTabPress = (index: number) => {
    if (!tabAnimations[index]) return;
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
    if (!badgeAnimations[index]) return;
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

  useEffect(() => {
    tabs.forEach((tab, index) => {
      if (tab.badge && tab.badge > 0) {
        setTimeout(() => animateBadge(index), index * 100);
      }
    });
  }, [unreadCount, tabs]);

  const handleTabPress = (tab: Tab, index: number) => {
    if (isNavigating) return;

    animateTabPress(index);
    if (tab.badge && tab.badge > 0) {
      animateBadge(index);
    }

    if (tab.name === "dashboard_tab") {
      router.push("/(app)/dashboard");
    } else if (tab.name === "quick_join") {
      router.push("/(app)/(tabs)/quick_join");
    } else {
      navigate(`/(tabs)/${tab.name}`);
    }
  };

  if (hideTabBarRoutes.includes(current)) {
    return null;
  }

  // Determine Container Styles according to Model
  const isFloating = bottomNavStyle === "v2_floating";
  const isCurved = bottomNavStyle === "v4_curved";
  const isCenterFab = bottomNavStyle === "v3_center_fab";

  const containerStyle = [
    styles.container,
    isFloating && styles.floatingContainer,
    isCurved && styles.curvedContainer,
  ];

  return (
    <View style={containerStyle} pointerEvents="box-none">
      <LinearGradient
        colors={
          isFloating
            ? [theme.colors.primary || "#850111", "#4D000A", "#2E0005"]
            : [theme.colors.primary, theme.colors.primary, theme.colors.primary]
        }
        style={[
          styles.gradientContainer,
          isFloating && styles.floatingGradient,
          isCurved && styles.curvedGradient,
        ]}
      >
        {tabs.map((tab, index) => {
          const isActive = current === tab.name || (tab.name === "dashboard_tab" && current === "dashboard");
          const isCenterButton = Boolean(tab.isCenter || (isCenterFab && tab.name === "quick_join"));

          if (isCenterFab && isCenterButton) {
            return (
              <TouchableOpacity
                key={tab.name}
                style={styles.centerFabTabWrapper}
                onPress={() => handleTabPress(tab, index)}
                activeOpacity={0.85}
              >
                <Animated.View
                  style={[
                    styles.centerFabButtonContainer,
                    { transform: [{ scale: tabAnimations[index] }] },
                  ]}
                >
                  <LinearGradient
                    colors={["#FFE57F", "#FFB300", "#DAA520"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.centerFabGradient}
                  >
                    <Ionicons
                      name={isActive ? tab.iconActive : tab.icon}
                      size={26}
                      color="#000000"
                    />
                  </LinearGradient>
                  <ResponsiveText
                    variant="caption"
                    size="xs"
                    weight="bold"
                    color={isActive ? theme.colors.secondary : theme.colors.textLight || "#ffffff"}
                    align="center"
                    allowWrap={false}
                    maxLines={1}
                    style={styles.centerFabLabel}
                  >
                    {t(tab.label)}
                  </ResponsiveText>
                </Animated.View>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={tab.name}
              style={[
                styles.tab,
                isFloating && isActive && styles.floatingActiveTabBackdrop,
              ]}
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
                    size={24}
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

                {/* Model-specific active indicators */}
                {isActive && !isFloating && !isCurved && (
                  <View style={styles.activeIndicator} />
                )}

                {isActive && isCurved && (
                  <View style={styles.glowingDotIndicator} />
                )}
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </LinearGradient>
    </View>
  );
}

function getStyles(theme: any) {
  return StyleSheet.create({
    container: {
      width: "100%",
      zIndex: 999,
      elevation: 999,
      borderTopWidth: 1.5,
      borderTopColor: theme.colors.borderGold || theme.colors.secondary || "rgba(255, 193, 12, 0.3)",
    },
    floatingContainer: {
      position: "relative",
      paddingHorizontal: 12,
      paddingTop: 4,
      paddingBottom: Platform.OS === "ios" ? 12 : 6,
      backgroundColor: "transparent",
      borderTopWidth: 0,
    },
    curvedContainer: {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderTopWidth: 1.5,
      borderTopColor: theme.colors.secondary || "#DAA520",
      overflow: "hidden",
    },
    gradientContainer: {
      flexDirection: "row",
      height: Platform.OS === "ios" ? 75 : 60,
      paddingBottom: Platform.OS === "ios" ? 15 : 0,
      alignItems: "center",
      justifyContent: "space-around",
      overflow: "visible",
    },
    floatingGradient: {
      borderRadius: 24,
      height: Platform.OS === "ios" ? 56 : 52,
      paddingBottom: 0,
      borderWidth: 1.5,
      borderColor: "rgba(218, 165, 32, 0.6)",
      shadowColor: "#DAA520",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
      overflow: "hidden",
    },
    curvedGradient: {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
    },
    tab: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 4,
      position: "relative",
    },
    floatingActiveTabBackdrop: {
      backgroundColor: "rgba(218, 165, 32, 0.22)",
      borderRadius: 18,
      marginHorizontal: 3,
      paddingVertical: 2,
      borderWidth: 1,
      borderColor: "rgba(255, 215, 0, 0.35)",
    },
    tabContent: {
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 4,
    },
    iconContainer: {
      position: "relative",
      marginBottom: 3,
    },
    label: {
      fontSize: 10.5,
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
      minWidth: 18,
      height: 18,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 4,
      borderWidth: 2,
      borderColor: "#fff",
    },
    badgeText: {
      fontSize: 9.5,
      fontWeight: "bold",
      color: "#fff",
    },
    activeIndicator: {
      position: "absolute",
      bottom: -4,
      left: 0,
      right: 0,
      height: 3,
      backgroundColor: theme.colors.secondary,
      borderRadius: 2,
    },
    glowingDotIndicator: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: "#FFD700",
      marginTop: 3,
      shadowColor: "#FFD700",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.9,
      shadowRadius: 4,
      elevation: 4,
    },
    centerFabTabWrapper: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    },
    centerFabButtonContainer: {
      alignItems: "center",
      justifyContent: "center",
      transform: [{ translateY: -16 }],
    },
    centerFabGradient: {
      width: 52,
      height: 52,
      borderRadius: 26,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#DAA520",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.45,
      shadowRadius: 8,
      elevation: 8,
      borderWidth: 2,
      borderColor: "#FFFFFF",
    },
    centerFabLabel: {
      fontSize: 10,
      fontWeight: "700",
      marginTop: 2,
    },
  });
}
