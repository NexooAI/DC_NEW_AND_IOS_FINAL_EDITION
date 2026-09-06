import { useAppTheme } from "@/store/global.store";
import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Easing,
  LayoutChangeEvent,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@/constants/theme";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { logger } from "@/utils/logger";

interface FlashOfferProps {
  fallbackMessages?: string[];
  textColor?: string;
  duration?: number;
  onPress?: () => void;
  iconColor?: string;
  backgroundGradient?: [string, string];
  restartDelay?: number; // Delay in ms after scrolling finishes before next loop starts (default 1000ms)
  scrollSpeed?: number; // Reading speed in pixels per second (default 55 px/s)
}

const FlashOffer: React.FC<FlashOfferProps> = ({
  fallbackMessages = ["🎉 Welcome to Digital Gold Savings!"],
  textColor = theme.colors.white,
  onPress,
  iconColor = theme.colors.white,
  backgroundGradient = [theme.colors.primary, theme.colors.textDark],
  restartDelay = 1000,
  scrollSpeed = 55,
}) => {
  const theme = useAppTheme();
  styles = getStyles(theme);
  const { screenWidth } = useResponsiveLayout();
  const baseScreenWidth = screenWidth || 360;

  const translateX = useRef(new Animated.Value(baseScreenWidth)).current;
  const [newsMessages, setNewsMessages] = useState<string[]>(fallbackMessages);
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const [measuredTextWidth, setMeasuredTextWidth] = useState<number>(0);
  const [animKey, setAnimKey] = useState(0);

  // Sync newsMessages with fallbackMessages prop
  useEffect(() => {
    if (fallbackMessages && fallbackMessages.length > 0) {
      setNewsMessages(fallbackMessages);
      setCurrentNewsIndex(0);
      setMeasuredTextWidth(0);
      setAnimKey((k) => k + 1);
    }
  }, [fallbackMessages]);

  const handleTextLayout = useCallback((e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (width > 0 && Math.abs(width - measuredTextWidth) > 5) {
      setMeasuredTextWidth(width);
    }
  }, [measuredTextWidth]);

  // Animate scrolling marquee dynamically based on word count & text length
  useEffect(() => {
    if (!newsMessages.length) return;

    const currentMsg = newsMessages[currentNewsIndex] || "";
    if (!currentMsg) return;

    // Word & Character count calculation
    const words = currentMsg.trim().split(/\s+/).filter(Boolean).length;
    const chars = currentMsg.length;

    // Calculate effective text width: use measured width if available, or dynamic formula
    const effectiveTextWidth = measuredTextWidth > 0
      ? measuredTextWidth
      : Math.max(chars * 9 + 40, words * 55, 120);

    // Total travel distance = start off-screen right to finish off-screen left
    const totalDistance = baseScreenWidth + effectiveTextWidth + 30;

    // Duration dynamically calculated based on total distance and reading speed (55 px/sec)
    const calculatedDuration = Math.max(
      Math.round((totalDistance / (scrollSpeed || 55)) * 1000),
      3000
    );

    // Start from right of screen
    translateX.setValue(baseScreenWidth);

    let isMounted = true;
    let delayTimeout: NodeJS.Timeout | null = null;

    const animation = Animated.timing(translateX, {
      toValue: -effectiveTextWidth - 30,
      duration: calculatedDuration,
      useNativeDriver: true,
      easing: Easing.linear,
    });

    animation.start(({ finished }) => {
      if (finished && isMounted) {
        // Natural 1-second delay before starting next message/cycle (no long empty gaps!)
        delayTimeout = setTimeout(() => {
          if (!isMounted) return;
          setMeasuredTextWidth(0); // reset measurement for next text
          setCurrentNewsIndex((prev) => (prev + 1) % newsMessages.length);
          setAnimKey((k) => k + 1); // trigger next loop even if only 1 message
        }, restartDelay);
      }
    });

    return () => {
      isMounted = false;
      animation.stop();
      if (delayTimeout) clearTimeout(delayTimeout);
    };
  }, [currentNewsIndex, animKey, newsMessages, baseScreenWidth, measuredTextWidth, restartDelay, scrollSpeed]);

  if (newsMessages.length === 0) {
    return null;
  }

  const handlePress = () => {
    if (onPress) onPress();
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={backgroundGradient}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.contentContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="flash" size={16} color={iconColor} />
          </View>

          <View style={styles.textWrapper}>
            <Animated.View
              style={[
                styles.textContainer,
                {
                  transform: [{ translateX }],
                },
              ]}
            >
              <Text
                style={[styles.text, { color: textColor }]}
                numberOfLines={1}
                onLayout={handleTextLayout}
              >
                {newsMessages[currentNewsIndex]}
              </Text>
            </Animated.View>
          </View>

          {newsMessages.length > 1 && (
            <View style={styles.counterContainer}>
              <Text style={styles.counterText}>
                {currentNewsIndex + 1}/{newsMessages.length}
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

function getStyles(theme: any) {
  return StyleSheet.create({
    container: {
      height: 40,
      overflow: "hidden",
      justifyContent: "center",
      width: "100%",
      elevation: 5,
    },
    gradient: {
      flex: 1,
      justifyContent: "center",
    },
    contentContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
    },
    iconContainer: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: "rgba(255,255,255,0.2)",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 8,
    },
    textWrapper: {
      flex: 1,
      overflow: "hidden",
    },
    textContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    text: {
      fontSize: 14,
      fontWeight: "600",
      letterSpacing: 0.5,
      paddingRight: 30,
    },
    counterContainer: {
      backgroundColor: "rgba(255,255,255,0.2)",
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      marginLeft: 8,
    },
    counterText: {
      color: theme.colors.white,
      fontSize: 12,
      fontWeight: "500",
    },
  });
}

var styles = getStyles(theme);

export default FlashOffer;
