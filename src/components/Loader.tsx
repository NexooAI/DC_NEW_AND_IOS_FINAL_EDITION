import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { theme } from "@/constants/theme";
import { COLORS } from "@/constants/colors";
import ResponsiveText from "./ResponsiveText";

interface LoaderProps {
  visible: boolean;
  message?: string;
  size?: "small" | "medium" | "large";
  overlay?: boolean;
  color?: string;
  backgroundColor?: string;
  textColor?: string;
  showSpinner?: boolean;
  showDots?: boolean;
  showProgress?: boolean;
  progress?: number; // 0-100
  type?: "default" | "minimal" | "fullscreen" | "inline";
  style?: any;
}

const Loader: React.FC<LoaderProps> = ({
  visible = false,
  message = "Loading...",
  size = "medium",
  overlay = true,
  color = COLORS.secondary,
  backgroundColor,
  textColor = COLORS.white,
  showSpinner = true,
  showDots = false,
  showProgress = false,
  progress = 0,
  type = "default",
  style,
}) => {
  const {
    screenWidth,
    screenHeight,
    deviceScale,
    isSmallScreen,
    isTablet,
    getResponsiveFontSize,
    getResponsivePadding,
  } = useResponsiveLayout();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Start rotation animation for spinner
      if (showSpinner) {
        Animated.loop(
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          })
        ).start();
      }

      // Animate progress if shown
      if (showProgress) {
        Animated.timing(progressAnim, {
          toValue: progress / 100,
          duration: 500,
          useNativeDriver: false,
        }).start();
      }
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, progress]);

  const getSizeConfig = () => {
    switch (size) {
      case "small":
        return {
          spinnerSize: isSmallScreen ? 20 : 24,
          containerPadding: getResponsivePadding(12, 16, 20),
          fontSize: getResponsiveFontSize(12, 14, 16),
        };
      case "large":
        return {
          spinnerSize: isSmallScreen ? 40 : 48,
          containerPadding: getResponsivePadding(24, 32, 40),
          fontSize: getResponsiveFontSize(16, 18, 20),
        };
      default: // medium
        return {
          spinnerSize: isSmallScreen ? 28 : 32,
          containerPadding: getResponsivePadding(16, 20, 24),
          fontSize: getResponsiveFontSize(14, 16, 18),
        };
    }
  };

  const sizeConfig = getSizeConfig();

  const getContainerStyle = () => {
    switch (type) {
      case "minimal":
        return {
          backgroundColor: "transparent",
          padding: 0,
          borderRadius: 0,
        };
      case "fullscreen":
        return {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: backgroundColor || COLORS.overlay,
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999,
        };
      case "inline":
        return {
          backgroundColor: backgroundColor || "transparent",
          padding: sizeConfig.containerPadding,
          borderRadius: deviceScale(8),
          alignItems: "center",
          justifyContent: "center",
        };
      default:
        return {
          backgroundColor: backgroundColor || COLORS.overlay,
          padding: sizeConfig.containerPadding,
          borderRadius: deviceScale(12),
          alignItems: "center",
          justifyContent: "center",
          minWidth: deviceScale(120),
          minHeight: deviceScale(80),
        };
    }
  };

  const renderSpinner = () => {
    if (!showSpinner) return null;

    const spin = rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ["0deg", "360deg"],
    });

    return (
      <Animated.View
        style={[
          styles.spinnerContainer,
          {
            transform: [{ rotate: spin }],
          },
        ]}
      >
        <ActivityIndicator size={sizeConfig.spinnerSize} color={color} />
      </Animated.View>
    );
  };

  const renderDots = () => {
    if (!showDots) return null;

    return (
      <View style={styles.dotsContainer}>
        {[0, 1, 2].map((index) => (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: color,
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
    );
  };

  const renderProgress = () => {
    if (!showProgress) return null;

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
                backgroundColor: color,
              },
            ]}
          />
        </View>
        <ResponsiveText
          variant="caption"
          size="sm"
          color={textColor}
          align="center"
          style={styles.progressText}
        >
          {Math.round(progress)}%
        </ResponsiveText>
      </View>
    );
  };

  const renderContent = () => (
    <Animated.View
      style={[
        styles.container,
        getContainerStyle(),
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
        style,
      ]}
    >
      {renderSpinner()}
      {renderDots()}

      {message && (
        <ResponsiveText
          variant="body"
          size="md"
          color={textColor}
          align="center"
          allowWrap={true}
          maxLines={2}
          adjustsFontSizeToFit={true}
          minimumFontScale={0.8}
          style={[
            styles.messageText,
            {
              fontSize: sizeConfig.fontSize,
              marginTop: showSpinner || showDots ? deviceScale(8) : 0,
            },
          ]}
        >
          {message}
        </ResponsiveText>
      )}

      {renderProgress()}
    </Animated.View>
  );

  if (type === "fullscreen") {
    return (
      <Modal visible={visible} transparent animationType="fade">
        {renderContent()}
      </Modal>
    );
  }

  if (overlay && type !== "inline") {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.overlay}>{renderContent()}</View>
      </Modal>
    );
  }

  return visible ? renderContent() : null;
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  spinnerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  messageText: {
    textAlign: "center",
    lineHeight: 20,
  },
  progressContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 12,
  },
  progressBar: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  progressText: {
    marginTop: 4,
    fontSize: 12,
  },
});

export default Loader;
