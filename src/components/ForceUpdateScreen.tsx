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
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@/constants/theme";
import { COLORS } from "@/constants/colors";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import forceUpdateService from "@/services/forceUpdateService";
import { useTranslation } from "@/hooks/useTranslation";
import { logger } from "@/utils/logger";

interface ForceUpdateScreenProps {
  currentVersion: string;
  latestVersion: string;
  storeUrl: string;
  onRetry?: () => void;
}

export default function ForceUpdateScreen({
  currentVersion,
  latestVersion,
  storeUrl,
  onRetry,
}: ForceUpdateScreenProps) {
  const { t } = useTranslation();
  const { screenWidth } = useResponsiveLayout();
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

  const PRIMARY_COLOR = theme.colors.primary || "#850111";

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
          "rgba(20, 20, 20, 0.92)",
          "rgba(15, 0, 0, 0.96)",
          "rgba(0, 0, 0, 0.98)",
        ]}
        style={styles.gradient}
      >
        <View style={styles.container}>
          {/* Logo Header */}
          <View style={styles.logoContainer}>
            <Image
              source={
                typeof theme.images.auth.logo === "string"
                  ? { uri: theme.images.auth.logo }
                  : theme.images.auth.logo
              }
              style={[
                styles.logo,
                {
                  width: screenWidth * 0.45,
                  height: 60,
                },
              ]}
              resizeMode="contain"
            />
          </View>

          {/* Main Visual Content Card */}
          <View style={styles.contentCard}>
            {/* Glowing Icon Container */}
            <View style={styles.outerGlow}>
              <View style={[styles.innerGlow, { backgroundColor: PRIMARY_COLOR + "15" }]}>
                <View style={[styles.iconWrapper, { backgroundColor: PRIMARY_COLOR, shadowColor: PRIMARY_COLOR }]}>
                  <Ionicons name="cloud-download-outline" size={44} color={COLORS.white} />
                </View>
              </View>
            </View>

            {/* Title */}
            <Text style={styles.title}>{t("updateRequired") || "Update Required"}</Text>

            {/* Message */}
            <Text style={styles.message}>
              {t("updateRequiredMessage") || "To continue using the app, please update to the latest version. It includes critical bug fixes and performance improvements."}
            </Text>

            {/* Glassmorphic Version Stats */}
            <View style={styles.versionCard}>
              <View style={styles.versionCol}>
                <Text style={styles.versionLabel}>{t("currentVersion") || "Current"}</Text>
                <Text style={styles.versionValue}>{currentVersion}</Text>
              </View>
              <View style={styles.versionDivider} />
              <View style={styles.versionCol}>
                <Text style={styles.versionLabel}>{t("latestVersion") || "Latest"}</Text>
                <Text style={[styles.versionValue, { color: "#4CAF50" }]}>{latestVersion}</Text>
              </View>
            </View>

            {/* Update Button */}
            <TouchableOpacity
              style={[
                styles.updateButton,
                { backgroundColor: PRIMARY_COLOR, shadowColor: PRIMARY_COLOR },
                isUpdating && styles.updateButtonDisabled,
              ]}
              onPress={handleUpdateNow}
              disabled={isUpdating}
              activeOpacity={0.8}
            >
              {isUpdating ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.updateButtonText}>{t("updateNow") || "Update Now"}</Text>
                  <Ionicons name="arrow-forward" size={18} color={COLORS.white} style={styles.buttonIcon} />
                </View>
              )}
            </TouchableOpacity>

            {/* Retry Link */}
            {onRetry && (
              <TouchableOpacity
                style={styles.retryButton}
                onPress={handleRetry}
                activeOpacity={0.7}
              >
                <Text style={[styles.retryButtonText, { color: PRIMARY_COLOR }]}>
                  {t("checkAgain") || "Check Again"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Footer Info */}
          <Text style={styles.additionalInfo}>
            {t("updateRequiredInfo") || "We regularly update the app to make sure you have the best experience."}
          </Text>
        </View>
      </LinearGradient>
    </ImageBackground>
  );
}

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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 24,
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  logo: {
    marginBottom: 0,
  },
  contentCard: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    width: "100%",
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 5,
  },
  outerGlow: {
    width: 130,
    height: 130,
    borderRadius: 65,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
  },
  innerGlow: {
    width: 106,
    height: 106,
    borderRadius: 53,
    justifyContent: "center",
    alignItems: "center",
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.white,
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  message: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  versionCard: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 28,
    width: "100%",
    justifyContent: "space-around",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.04)",
  },
  versionCol: {
    alignItems: "center",
    flex: 1,
  },
  versionDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  versionLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.45)",
    marginBottom: 4,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  versionValue: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: "700",
  },
  updateButton: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 8,
    width: "100%",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  updateButtonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  updateButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
  buttonIcon: {
    marginLeft: 8,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 4,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  additionalInfo: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.4)",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 16,
  },
});
