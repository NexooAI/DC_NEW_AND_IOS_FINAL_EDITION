import React, { useEffect, useRef, useState } from "react";
import {
  TouchableOpacity,
  Animated,
  StyleSheet,
  Platform,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, usePathname } from "expo-router";
import { theme } from "@/constants/theme";
import { shouldHideTabs } from "@/config/navigation";

interface FloatingHomeButtonProps {
  onPress?: () => void;
}

export default function FloatingHomeButton({
  onPress,
}: FloatingHomeButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const current = pathname.split("/").pop() || "home";

  // Animation values
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;

  // Check if current route should hide tabs (show floating button)
  const shouldShow = shouldHideTabs(current);

  useEffect(() => {
    if (shouldShow) {
      // Animate in with scale and bounce
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: 1.1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      // Animate out
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [shouldShow, scaleAnim, bounceAnim]);

  const handlePress = () => {
    // Animate button press
    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(bounceAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate to home
    if (onPress) {
      onPress();
    } else {
      router.push("/(app)/(tabs)/home");
    }
  };

  // Don't render if not on a page that should show the floating button
  if (!shouldShow) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }, { scale: bounceAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.button}
        onPress={handlePress}
        activeOpacity={0.8}
        accessibilityLabel="Go to Home"
        accessibilityHint="Double tap to navigate to the home screen"
      >
        <LinearGradient
          colors={[theme.colors.redBurgundyLight, theme.colors.redBurgundyDark]}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="home" size={24} color={theme.colors.white} />
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 180 : 160, // Position above chat button
    right: 20,
    zIndex: 999, // Lower than chat button
    elevation: 999,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: theme.colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  gradient: {
    width: "100%",
    height: "100%",
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: theme.colors.borderWhiteLight,
  },
});
