import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@/constants/theme";
import { images } from "@/constants/images";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";

import { logger } from "@/utils/logger";
interface FlashBannerProps {
  message?: string;
  children?: React.ReactNode;
  onClose?: () => void;
  imageSource?: any;
}

const FlashBanner: React.FC<FlashBannerProps> = React.memo(
  ({
    message,
    children,
    onClose,
    imageSource = images.banners.flashBanner,
  }) => {
    const [visible, setVisible] = useState(true);
    const [imageError, setImageError] = useState(false);
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

    const handleClose = () => {
      setVisible(false);
      if (onClose) onClose();
    };

    const handleImageError = () => {
      logger.warn("FlashBanner: Image failed to load, using fallback");
      setImageError(true);
    };

    if (!visible) return null;

    // Create dynamic styles with responsive values
    const dynamicStyles = StyleSheet.create({
      overlay: {
        position: "absolute",
        top: 0,
        left: 0,
        width: screenWidth,
        height: screenHeight,
        backgroundColor: "rgba(0,0,0,0.8)", // Dark overlay
        zIndex: 9999,
        justifyContent: "center",
        alignItems: "center",
      },
      bannerImage: {
        width: screenWidth,
        height: screenHeight,
        position: "absolute",
        top: 0,
        left: 0,
      },
    });

    return (
      <View style={dynamicStyles.overlay}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Ionicons name="close" size={32} color={theme.colors.white} />
        </TouchableOpacity>
        {children ? (
          children
        ) : (
          <Image
            source={imageError ? images.banners.banner : imageSource}
            style={dynamicStyles.bannerImage}
            resizeMode="cover"
            onError={handleImageError}
            onLoad={() => setImageError(false)}
          />
        )}
      </View>
    );
  }
);

FlashBanner.displayName = "FlashBanner";

const styles = StyleSheet.create({
  closeButton: {
    position: "absolute",
    top: 40,
    right: 30,
    zIndex: 10000,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 24,
    padding: 6,
  },
  message: {
    fontSize: 22,
    fontWeight: "bold",
    color: theme.colors.redDarker,
    textAlign: "center",
    marginVertical: 10,
  },
});

export default FlashBanner;
