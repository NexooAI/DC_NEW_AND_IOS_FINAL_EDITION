import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  LayoutChangeEvent,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { moderateScale } from "react-native-size-matters";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { useAppTheme } from "@/store/global.store";

export interface FlashNewsV2Props {
  messages?: string[];
  onPress?: (message: string) => void;
  scrollSpeed?: number; // pixels per second (default 55 px/s)
  restartDelay?: number; // delay in ms before next loop (default 800ms)
}

export const FlashNewsV2: React.FC<FlashNewsV2Props> = ({
  messages = [],
  onPress,
  scrollSpeed = 55,
  restartDelay = 800,
}) => {
  const theme = useAppTheme();
  const { screenWidth } = useResponsiveLayout();
  const baseWidth = screenWidth || 360;

  const validMessages = React.useMemo(() => {
    return (messages || []).map((m) => (m || "").trim()).filter(Boolean);
  }, [messages]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const [loopKey, setLoopKey] = useState(0);

  const translateX = useRef(new Animated.Value(baseWidth)).current;

  // Pulse animation for Flash badge icon
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  // Handle measurement of current text width
  const handleTextLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - measuredWidth) > 4) {
      setMeasuredWidth(w);
    }
  }, [measuredWidth]);

  // Dynamic continuous marquee scrolling calculation based on message length
  useEffect(() => {
    if (!validMessages.length) return;

    const currentMsg = validMessages[currentIndex] || "";
    if (!currentMsg) return;

    // Approximate width if onLayout hasn't fired yet
    const effectiveWidth =
      measuredWidth > 0
        ? measuredWidth
        : Math.max(currentMsg.length * 8.5 + 40, 140);

    // Total distance = screen width + text width + margin
    const totalDistance = baseWidth + effectiveWidth + 30;

    // Calculate reading duration dynamically (proportional to text length)
    const duration = Math.max(
      Math.round((totalDistance / (scrollSpeed || 55)) * 1000),
      3500
    );

    translateX.setValue(baseWidth);

    let isMounted = true;
    let timer: NodeJS.Timeout | null = null;

    const anim = Animated.timing(translateX, {
      toValue: -effectiveWidth - 20,
      duration,
      easing: Easing.linear,
      useNativeDriver: true,
    });

    anim.start(({ finished }) => {
      if (finished && isMounted) {
        timer = setTimeout(() => {
          if (!isMounted) return;
          setMeasuredWidth(0);
          setCurrentIndex((prev) => (prev + 1) % validMessages.length);
          setLoopKey((k) => k + 1);
        }, restartDelay);
      }
    });

    return () => {
      isMounted = false;
      anim.stop();
      if (timer) clearTimeout(timer);
    };
  }, [currentIndex, loopKey, validMessages, baseWidth, measuredWidth, restartDelay, scrollSpeed]);

  if (!validMessages.length) {
    return null;
  }

  const currentText = validMessages[currentIndex] || "";

  const handlePress = () => {
    if (onPress) {
      onPress(currentText);
    } else {
      Alert.alert("Flash News", currentText, [{ text: "Close", style: "cancel" }]);
    }
  };

  const primaryColor = theme.colors.primary || "#a3203a";

  return (
    <TouchableOpacity
      style={styles.wrapper}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={[primaryColor, "#1E293B"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientBar}
      >
        {/* Left Badge: Flash icon with pulsing glow */}
        <View style={styles.badgeContainer}>
          <Animated.View style={{ opacity: pulseAnim }}>
            <Ionicons name="flash" size={moderateScale(13)} color="#FACC15" />
          </Animated.View>
          <Text style={styles.badgeText}>FLASH NEWS</Text>
        </View>

        {/* Marquee Scrolling Text Area */}
        <View style={styles.marqueeViewport}>
          <Animated.View
            style={[
              styles.marqueeTrack,
              {
                transform: [{ translateX }],
              },
            ]}
          >
            <Text
              style={styles.newsText}
              numberOfLines={1}
              onLayout={handleTextLayout}
            >
              {currentText}
            </Text>
          </Animated.View>
        </View>

        {/* Counter indicator if multiple news */}
        {validMessages.length > 1 && (
          <View style={styles.counterPill}>
            <Text style={styles.counterText}>
              {currentIndex + 1}/{validMessages.length}
            </Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gradientBar: {
    height: moderateScale(36),
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: moderateScale(10),
  },
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: moderateScale(7),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(12),
    marginRight: moderateScale(8),
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(250, 204, 21, 0.4)",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: moderateScale(9),
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  marqueeViewport: {
    flex: 1,
    overflow: "hidden",
    justifyContent: "center",
    height: "100%",
  },
  marqueeTrack: {
    flexDirection: "row",
    alignItems: "center",
  },
  newsText: {
    color: "#FFFFFF",
    fontSize: moderateScale(12),
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  counterPill: {
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(8),
    marginLeft: moderateScale(6),
  },
  counterText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: moderateScale(9),
    fontWeight: "700",
  },
});

export default FlashNewsV2;
