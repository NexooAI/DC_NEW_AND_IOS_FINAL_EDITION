import React, { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Animated,
  Image,
  Text,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { theme } from "@/constants/theme";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";

interface EnhancedLoaderProps {
  visible: boolean;
  message?: string;
  size?: "small" | "medium" | "large";
  overlay?: boolean;
}

const EnhancedLoader: React.FC<EnhancedLoaderProps> = ({
  visible,
  message = "Loading...",
  size = "medium",
  overlay = true,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const crownRotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  const getSizeConfig = () => {
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
    switch (size) {
      case "small":
        return { logoSize: 100, containerSize: 160 };
      case "large":
        return { logoSize: 160, containerSize: 240 };
      default:
        return { logoSize: 120, containerSize: 200 };
    }
  };

  const { logoSize, containerSize } = getSizeConfig();

  useEffect(() => {
    if (visible) {
      // Start entrance animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      // Start continuous animations
      const rotateAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      );

      const crownAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(crownRotateAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(crownRotateAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );

      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );

      const floatAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );

      const shimmerAnimation = Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      );

      rotateAnimation.start();
      crownAnimation.start();
      pulseAnimation.start();
      floatAnimation.start();
      shimmerAnimation.start();

      return () => {
        rotateAnimation.stop();
        crownAnimation.stop();
        pulseAnimation.stop();
        floatAnimation.stop();
        shimmerAnimation.stop();
      };
    } else {
      // Exit animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 0.8,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const crownRotateInterpolate = crownRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "20deg"],
  });

  const floatInterpolate = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  const shimmerInterpolate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-containerSize, containerSize],
  });

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        overlay && styles.overlay,
        {
          opacity: fadeAnim,
        },
      ]}
    >
      {overlay && Platform.OS === "ios" ? (
        <BlurView intensity={10} style={StyleSheet.absoluteFill} />
      ) : null}

      {/* Background gradient with theme colors */}
      <LinearGradient
        colors={[
          `${theme.colors.primary}E6`,
          `${theme.colors.support_container[1]}E6`,
          `${theme.colors.support_container[2]}E6`,
        ]}
        style={[styles.gradientBackground, overlay && StyleSheet.absoluteFill]}
      />

      {/* Floating gold particles */}
      <View style={styles.particlesContainer}>
        {[...Array(8)].map((_, index) => (
          <Animated.View
            key={index}
            style={[
              styles.particle,
              {
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                transform: [
                  { translateY: floatInterpolate },
                  {
                    rotate: rotateAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0deg", "360deg"],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.particleText}>✨</Text>
          </Animated.View>
        ))}
      </View>

      <Animated.View
        style={[
          styles.loaderContainer,
          {
            width: containerSize,
            height: containerSize,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Outer rotating ring with theme colors */}
        <Animated.View
          style={[
            styles.outerRing,
            {
              width: containerSize,
              height: containerSize,
              transform: [{ rotate: rotateInterpolate }],
            },
          ]}
        >
          <LinearGradient
            colors={["#2a5a8d", "#2a5a8d"]}
            style={styles.ringGradient}
          />
        </Animated.View>

        {/* Shimmer effect */}
        <Animated.View
          style={[
            styles.shimmer,
            {
              transform: [{ translateX: shimmerInterpolate }],
            },
          ]}
        />

        {/* Inner glow effect */}
        <Animated.View
          style={[
            styles.innerGlow,
            {
              width: containerSize - 20,
              height: containerSize - 20,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />

        {/* Logo container with GIF animation */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              width: logoSize,
              height: logoSize,
              transform: [{ rotate: crownRotateInterpolate }],
            },
          ]}
        >
          {/* DC Jewellers logo */}
          <Image
            source={require("../../assets/images/adaptive-icon.png")}
            style={[styles.logo, { width: logoSize, height: logoSize }]}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Sparkle effects */}
        <View style={styles.sparkleContainer}>
          {[...Array(6)].map((_, index) => (
            <Animated.View
              key={index}
              style={[
                styles.sparkle,
                {
                  transform: [
                    {
                      rotate: rotateAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [
                          `${index * 60}deg`,
                          `${index * 60 + 360}deg`,
                        ],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.sparkleText}>💎</Text>
            </Animated.View>
          ))}
        </View>
      </Animated.View>

      {/* Loading text */}
      <Animated.View
        style={[
          styles.textContainer,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: scaleAnim.interpolate({
                  inputRange: [0.8, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.loadingText}>{message}</Text>
        <Text style={styles.brandText}>{theme.constants.customerName}</Text>
        <View style={styles.dotsContainer}>
          {[...Array(3)].map((_, index) => (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: theme.colors.secondary,
                  opacity: rotateAnim.interpolate({
                    inputRange: [0, 0.33, 0.66, 1],
                    outputRange:
                      index === 0
                        ? [1, 0.5, 0.5, 1]
                        : index === 1
                        ? [0.5, 1, 0.5, 0.5]
                        : [0.5, 0.5, 1, 0.5],
                  }),
                },
              ]}
            />
          ))}
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: `${theme.colors.primary}E6`,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  gradientBackground: {
    borderRadius: 25,
  },
  loaderContainer: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  outerRing: {
    position: "absolute",
    borderRadius: 1000,
    overflow: "hidden",
  },
  ringGradient: {
    flex: 1,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: theme.colors.secondary,
  },
  innerGlow: {
    position: "absolute",
    backgroundColor: `${theme.colors.primary}20`,
    borderRadius: 1000,
    borderWidth: 1,
    borderColor: `${theme.colors.secondary}40`,
  },
  logoContainer: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  logo: {
    borderRadius: 0,
  },
  sparkleContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  sparkle: {
    position: "absolute",
    top: 10,
    left: "50%",
    marginLeft: -10,
  },
  sparkleText: {
    fontSize: 16,
    textShadowColor: `${theme.colors.secondary}80`,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  textContainer: {
    alignItems: "center",
    marginTop: 30,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.secondary,
    marginBottom: 8,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  brandText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    letterSpacing: 2,
    marginBottom: 15,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  dotsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  particlesContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  particle: {
    position: "absolute",
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  particleText: {
    fontSize: 16,
    textShadowColor: `${theme.colors.secondary}80`,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  shimmer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 1000,
  },
});

export default EnhancedLoader;
