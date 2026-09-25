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

export default function BottomBarV4Curved({
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
    <View
      style={[
        styles.outerContainer,
        {
          borderTopColor: secondaryColor
            ? `${secondaryColor}66`
            : "rgba(212, 175, 55, 0.45)",
        },
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
          const isActive =
            current === tab.name ||
            (tab.name === "dashboard_tab" && current === "dashboard");
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
              <Animated.View
                style={[
                  styles.tabContent,
                  {
                    transform: [
                      {
                        scale: isActive
                          ? Animated.multiply(scale, 1.05)
                          : scale,
                      },
                    ],
                  },
                ]}
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
                      size={25}
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
                  color={isActive ? secondaryColor || "#d4af37" : "#cbd5e1"}
                  align="center"
                  style={styles.label}
                  numberOfLines={1}
                >
                  {t(tab.label)}
                </ResponsiveText>

                {isActive ? (
                  <View
                    style={[
                      styles.glowingDot,
                      {
                        backgroundColor: secondaryColor || "#d4af37",
                        shadowColor: secondaryColor || "#d4af37",
                      },
                    ]}
                  />
                ) : (
                  <View style={styles.dotPlaceholder} />
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
  outerContainer: {
    width: "100%",
    zIndex: 999,
    elevation: 999,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1.5,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  gradientContainer: {
    flexDirection: "row",
    height: Platform.OS === "ios" ? 75 : 62,
    paddingBottom: Platform.OS === "ios" ? 15 : 2,
    alignItems: "center",
    justifyContent: "space-around",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
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
  iconContainer: {
    position: "relative",
    marginBottom: 2,
  },
  avatar: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    borderWidth: 1.5,
  },
  label: {
    fontSize: 10,
    textAlign: "center",
    marginTop: 1,
  },
  glowingDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 5,
    elevation: 4,
  },
  dotPlaceholder: {
    width: 5,
    height: 5,
    marginTop: 3,
  },
  badge: {
    position: "absolute",
    top: -5,
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
});
