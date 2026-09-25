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
export type { TabItem, BottomBarProps };

export default function BottomBarV1Classic({
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

  return (
    <View style={[styles.container, { borderTopColor: secondaryColor || "rgba(212, 175, 55, 0.4)" }]}>
      <LinearGradient
        colors={[primaryColor, primaryColor, primaryColor]}
        style={styles.gradientContainer}
      >
        {tabs.map((tab, index) => {
          const isActive = current === tab.name || (tab.name === "dashboard_tab" && current === "dashboard");
          const scale = tabAnimations[index] || new Animated.Value(1);
          const badgeScale = badgeAnimations[index] || new Animated.Value(1);

          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tab}
              onPress={() => onTabPress(tab, index)}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Animated.View style={[styles.tabContent, { transform: [{ scale }] }]}>
                <View style={styles.iconContainer}>
                  {tab.name === "profile" && userProfileImage ? (
                    <Image
                      source={{ uri: userProfileImage }}
                      style={[
                        styles.avatar,
                        { borderColor: isActive ? secondaryColor : "transparent" },
                      ]}
                      resizeMode="cover"
                    />
                  ) : (
                    <Ionicons
                      name={isActive ? tab.iconActive : tab.icon}
                      size={25}
                      color={isActive ? secondaryColor : "#ffffff"}
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
                  color={isActive ? secondaryColor : "#ffffff"}
                  align="center"
                  style={styles.label}
                  numberOfLines={1}
                >
                  {t(tab.label)}
                </ResponsiveText>

                {isActive && (
                  <View
                    style={[
                      styles.activeIndicator,
                      { backgroundColor: secondaryColor || "#d4af37" },
                    ]}
                  />
                )}
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
    paddingVertical: 6,
    position: "relative",
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
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
  },
  label: {
    fontSize: 11,
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
  badgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#ffffff",
  },
  activeIndicator: {
    position: "absolute",
    bottom: -4,
    left: 4,
    right: 4,
    height: 3,
    borderRadius: 2,
  },
});
