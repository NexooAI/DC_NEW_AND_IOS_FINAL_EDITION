// components/ForceUpdateScreen.tsx - Force Update Screen Component
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Image,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "@/constants/theme";
import { COLORS } from "@/constants/colors";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import forceUpdateService from "@/services/forceUpdateService";
import { useTranslation } from "@/hooks/useTranslation";

import { logger } from "@/utils/logger";
// ============================================================================
// TYPES
// ============================================================================

interface ForceUpdateScreenProps {
  currentVersion: string;
  latestVersion: string;
  storeUrl: string;
  onRetry?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function ForceUpdateScreen({
  currentVersion,
  latestVersion,
  storeUrl,
  onRetry,
}: ForceUpdateScreenProps) {
  const { t } = useTranslation();
  const { screenWidth, screenHeight } = useResponsiveLayout();
  const [isUpdating, setIsUpdating] = React.useState(false);

  const handleUpdateNow = async () => {
    try {
      setIsUpdating(true);
      await forceUpdateService.openStore(storeUrl);
    } catch (error) {
      logger.error("Error opening store:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };

  return (
    <ImageBackground
      source={
        typeof theme.image.bg_image === "string"
          ? { uri: theme.image.bg_image }
          : theme.image.bg_image
      }
      style={styles.backgroundImage}
    >
      <LinearGradient
        colors={[
          theme.colors.bgBlackHeavy,
          theme.colors.bgBlackMedium,
          theme.colors.bgBlackHeavy,
        ]}
        style={styles.gradient}
      >
        <View style={styles.container}>
          {/* Logo */}
          <Image
            source={
              typeof theme.images.auth.logo === "string"
                ? { uri: theme.images.auth.logo }
                : theme.images.auth.logo
            }
            style={[
              styles.logo,
              {
                width: screenWidth * 0.4,
                aspectRatio: 1,
              },
            ]}
            resizeMode="contain"
          />

          {/* Update Icon */}
          <View style={styles.updateIconContainer}>
            <View style={styles.updateIcon}>
              <Text style={styles.updateIconText}>↻</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>{t("updateRequired")}</Text>

          {/* Message */}
          <Text style={styles.message}>{t("updateRequiredMessage")}</Text>

          {/* Version Info */}
          <View style={styles.versionContainer}>
            <View style={styles.versionRow}>
              <Text style={styles.versionLabel}>{t("currentVersion")}</Text>
              <Text style={styles.versionValue}>{currentVersion}</Text>
            </View>
            <View style={styles.versionRow}>
              <Text style={styles.versionLabel}>{t("latestVersion")}</Text>
              <Text style={styles.versionValue}>{latestVersion}</Text>
            </View>
          </View>

          {/* Update Button */}
          <TouchableOpacity
            style={[
              styles.updateButton,
              isUpdating && styles.updateButtonDisabled,
            ]}
            onPress={handleUpdateNow}
            disabled={isUpdating}
            activeOpacity={0.8}
          >
            {isUpdating ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Text style={styles.updateButtonText}>{t("updateNow")}</Text>
            )}
          </TouchableOpacity>

          {/* Retry Button (if onRetry is provided) */}
          {onRetry && (
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetry}
              activeOpacity={0.8}
            >
              <Text style={styles.retryButtonText}>{t("checkAgain")}</Text>
            </TouchableOpacity>
          )}

          {/* Additional Info */}
          <Text style={styles.additionalInfo}>{t("updateRequiredInfo")}</Text>
        </View>
      </LinearGradient>
    </ImageBackground>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: "cover",
  },
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logo: {
    marginBottom: 40,
  },
  updateIconContainer: {
    marginBottom: 24,
  },
  updateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  updateIconText: {
    fontSize: 32,
    color: COLORS.white,
    fontWeight: "bold",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.white,
    textAlign: "center",
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: COLORS.white,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
    opacity: 0.9,
  },
  versionContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    width: "100%",
    maxWidth: 300,
  },
  versionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  versionLabel: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.8,
  },
  versionValue: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: "600",
  },
  updateButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    minWidth: 200,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  updateButtonDisabled: {
    opacity: 0.7,
  },
  updateButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginBottom: 16,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 14,
    textAlign: "center",
    opacity: 0.8,
    textDecorationLine: "underline",
  },
  additionalInfo: {
    fontSize: 12,
    color: COLORS.white,
    textAlign: "center",
    opacity: 0.6,
    lineHeight: 18,
  },
});
