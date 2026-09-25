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

export default function BottomBarV2Floating({
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
    <View style={styles.dockedWrapper}>
      <View
        style={[
          styles.floatingCapsule,
          {
            borderColor: secondaryColor
              ? `${secondaryColor}66`
              : "rgba(212, 175, 55, 0.45)",
          },
        ]}
      >
        <LinearGradient
          colors={[
            primaryColor || "#0e1e38",
            primaryColor || "#0e1e38",
            "#0a1526",
          ]}
          style={styles.gradientContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
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
                activeOpacity={0.75}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
              >
                <Animated.View
                  style={[
                    styles.tabContent,
                    isActive && [
                      styles.activePill,
                      {
                        backgroundColor: secondaryColor
                          ? `${secondaryColor}22`
                          : "rgba(212, 175, 55, 0.18)",
                        borderColor: secondaryColor
                          ? `${secondaryColor}44`
                          : "rgba(212, 175, 55, 0.35)",
                      },
                    ],
                    { transform: [{ scale }] },
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
                        size={23}
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
                    color={isActive ? secondaryColor || "#d4af37" : "#e2e8f0"}
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
    </View>
  );
}

const styles = StyleSheet.create({
  dockedWrapper: {
    width: "100%",
    backgroundColor: "transparent",
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: Platform.OS === "ios" ? 10 : 8,
    zIndex: 999,
    elevation: 999,
  },
  floatingCapsule: {
    borderRadius: 30,
    borderWidth: 1.5,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  gradientContainer: {
    flexDirection: "row",
    height: Platform.OS === "ios" ? 70 : 66,
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 6,
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
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "transparent",
  },
  activePill: {
    // Styling handled dynamically via secondaryColor
  },
  iconContainer: {
    position: "relative",
    marginBottom: 2,
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
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -8,
    backgroundColor: "#ef4444",
    borderRadius: 10,
    minWidth: 17,
    height: 17,
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
