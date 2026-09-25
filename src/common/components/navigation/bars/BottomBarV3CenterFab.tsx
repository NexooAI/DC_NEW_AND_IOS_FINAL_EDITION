import React from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import ResponsiveText from "@/components/ResponsiveText";
import { useTranslation } from "@/hooks/useTranslation";
import { TabItem, BottomBarProps } from "./types";

export default function BottomBarV3CenterFab({
  tabs,
  current,
  onTabPress,
  primaryColor,
  secondaryColor,
  userProfileImage,
  tabAnimations,
  badgeAnimations,
}: BottomBarProps) {
  const { t } = useTranslation();

  // If 5 tabs (or odd), center is index 2. If 4 tabs, center is index 1 (savings).
  const centerIndex =
    tabs.length === 5
      ? 2
      : tabs.findIndex((t) => t.name === "dashboard_tab" || t.name === "savings") !== -1
      ? tabs.findIndex((t) => t.name === "dashboard_tab" || t.name === "savings")
      : Math.floor(tabs.length / 2);

  return (
    <View
      style={[
        styles.container,
        { borderTopColor: secondaryColor ? `${secondaryColor}55` : "rgba(212, 175, 55, 0.4)" },
      ]}
    >
      <LinearGradient
        colors={[
          primaryColor || "#0e1e38",
          primaryColor || "#0e1e38",
          primaryColor || "#0a1526",
        ]}
        style={styles.gradientContainer}
      >
        {tabs.map((tab, index) => {
          const isCenter = index === centerIndex;
          const isActive =
            current === tab.name ||
            (tab.name === "dashboard_tab" && current === "dashboard");
          const scale = tabAnimations[index] || new Animated.Value(1);
          const badgeScale = badgeAnimations[index] || new Animated.Value(1);

          if (isCenter) {
            return (
              <TouchableOpacity
                key={tab.name}
                style={styles.centerTabWrapper}
                onPress={() => onTabPress(tab, index)}
                activeOpacity={0.85}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
              >
                <View style={styles.centerFabButton}>
                  <Animated.View
                    style={[
                      styles.fabGlowRing,
                      {
                        borderColor: primaryColor || "#0e1e38",
                        transform: [{ scale }],
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={
                        isActive
                          ? ["#FFF1A8", "#E6BE44", "#AA7C11"]
                          : ["#FFE259", "#D4AF37", "#9A7B1C"]
                      }
                      style={styles.fabGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Ionicons
                        name={isActive ? tab.iconActive : tab.icon}
                        size={28}
                        color="#ffffff"
                      />
                      {tab.badge && tab.badge > 0 ? (
                        <Animated.View
                          style={[
                            styles.centerBadge,
                            { transform: [{ scale: badgeScale }] },
                          ]}
                        >
                          <ResponsiveText
                            variant="caption"
                            size="xs"
                            weight="bold"
                            color="#ffffff"
                            align="center"
                            style={styles.badgeText}
                          >
                            {tab.badge > 99 ? "99+" : tab.badge}
                          </ResponsiveText>
                        </Animated.View>
                      ) : null}
                    </LinearGradient>
                  </Animated.View>
                </View>

                <ResponsiveText
                  variant="caption"
                  size="xs"
                  weight={isActive ? "bold" : "medium"}
                  color={isActive ? secondaryColor || "#d4af37" : "#ffffff"}
                  align="center"
                  style={styles.centerLabel}
                  numberOfLines={1}
                >
                  {t(tab.label)}
                </ResponsiveText>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tab}
              onPress={() => onTabPress(tab, index)}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Animated.View
                style={[styles.tabContent, { transform: [{ scale }] }]}
              >
                <View style={styles.iconContainer}>
                  {tab.name === "profile" && userProfileImage ? (
                    <Image
                      source={{ uri: userProfileImage }}
                      style={[
                        styles.avatar,
                        {
                          borderColor: isActive
                            ? secondaryColor || "#d4af37"
                            : "transparent",
                        },
                      ]}
                      resizeMode="cover"
                    />
                  ) : (
                    <Ionicons
                      name={isActive ? tab.iconActive : tab.icon}
                      size={24}
                      color={isActive ? secondaryColor || "#d4af37" : "#ffffff"}
                    />
                  )}

                  {tab.badge && tab.badge > 0 ? (
                    <Animated.View
                      style={[
                        styles.badge,
                        { transform: [{ scale: badgeScale }] },
                      ]}
                    >
                      <ResponsiveText
                        variant="caption"
                        size="xs"
                        weight="bold"
                        color="#ffffff"
                        align="center"
                        style={styles.badgeText}
                      >
                        {tab.badge > 99 ? "99+" : tab.badge}
                      </ResponsiveText>
                    </Animated.View>
                  ) : null}
                </View>

                <ResponsiveText
                  variant="caption"
                  size="xs"
                  weight={isActive ? "bold" : "medium"}
                  color={isActive ? secondaryColor || "#d4af37" : "#ffffff"}
                  align="center"
                  style={styles.label}
                  numberOfLines={1}
                >
                  {t(tab.label)}
                </ResponsiveText>
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
    width: "100%",
    zIndex: 999,
    elevation: 999,
    borderTopWidth: 1.5,
  },
  gradientContainer: {
    flexDirection: "row",
    height: Platform.OS === "ios" ? 75 : 62,
    paddingBottom: Platform.OS === "ios" ? 15 : 2,
    alignItems: "center",
    justifyContent: "space-around",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  tabContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  centerTabWrapper: {
    flex: 1.1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  centerFabButton: {
    top: -22,
    alignItems: "center",
    justifyContent: "center",
  },
  fabGlowRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3.5,
    overflow: "hidden",
    shadowColor: "#d4af37",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 10,
  },
  fabGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  centerLabel: {
    fontSize: 10,
    textAlign: "center",
    position: "absolute",
    bottom: Platform.OS === "ios" ? 4 : 2,
  },
  iconContainer: {
    position: "relative",
    marginBottom: 3,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  label: {
    fontSize: 10,
    textAlign: "center",
    marginTop: 2,
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -8,
    backgroundColor: "#ef4444",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: "#ffffff",
  },
  centerBadge: {
    position: "absolute",
    top: 3,
    right: 3,
    backgroundColor: "#ef4444",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: "#ffffff",
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#ffffff",
  },
});
