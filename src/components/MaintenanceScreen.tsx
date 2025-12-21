// components/MaintenanceScreen.tsx - Maintenance Status Screen
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "@/hooks/useTranslation";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import MaintenanceService, {
  MaintenanceState,
} from "@/services/maintenanceService";
import { logger } from "@/utils/logger";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { responsiveUtils } from "@/utils/responsiveUtils";
import useGlobalStore from "@/store/global.store";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface MaintenanceScreenProps {
  onRetry?: () => void;
}

export default function MaintenanceScreen({ onRetry }: MaintenanceScreenProps) {
  const { t } = useTranslation();
  const [maintenanceState, setMaintenanceState] = useState<MaintenanceState>(
    MaintenanceService.getInstance().getState()
  );
  const [pulseAnim] = useState(new Animated.Value(1));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [forceUpdate, setForceUpdate] = useState(0);

  // Language switching functionality
  const { language, setLanguage } = useGlobalStore();

  // Toggle language function
  const toggleLanguage = () => {
    const newLanguage = language === "en" ? "ta" : "en";
    setLanguage(newLanguage);
    logger.log(`🌐 Language switched to: ${newLanguage}`);
  };

  // Use responsive layout hook for better mobile screen coverage
  const {
    screenWidth: responsiveWidth,
    screenHeight: responsiveHeight,
    deviceType,
    isTinyScreen,
    isSmallScreen,
    isMediumScreen,
    isLargeScreen,
    isTablet,
    deviceScale,
    getResponsiveFontSize,
    getResponsivePadding,
    getResponsiveWidth,
    getResponsiveHeight,
    spacing,
    fontSize,
    borderRadius,
    padding,
    shadows,
  } = useResponsiveLayout();

  // Create responsive styles using the hook values
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      width: responsiveWidth,
      height: responsiveHeight,
    },
    gradient: {
      flex: 1,
      width: responsiveWidth,
      height: responsiveHeight,
    },
    languageToggleContainer: {
      position: "absolute",
      top: spacing.lg,
      right: spacing.lg,
      zIndex: 1000,
    },
    languageToggleButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.lg,
      gap: spacing.xs,
    },
    languageToggleText: {
      color: "#fff",
      fontSize: getResponsiveFontSize(12, 14, 16),
      fontWeight: "600",
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: spacing.xxl,
    },
    content: {
      flex: 1,
      paddingHorizontal: getResponsivePadding(16, 20, 24),
      paddingVertical: getResponsivePadding(16, 20, 24),
      justifyContent: "space-between",
      minHeight: responsiveHeight * 0.8,
    },
    header: {
      alignItems: "center",
      marginTop: getResponsiveHeight(4),
    },
    iconContainer: {
      marginBottom: spacing.lg,
      padding: spacing.lg,
      borderRadius: borderRadius.round,
      backgroundColor: "rgba(255, 255, 255, 0.2)",
    },
    title: {
      fontSize: getResponsiveFontSize(24, 28, 32),
      fontWeight: "bold",
      color: "#fff",
      textAlign: "center",
      marginBottom: spacing.sm,
    },
    subtitle: {
      fontSize: getResponsiveFontSize(14, 16, 18),
      color: "rgba(255, 255, 255, 0.8)",
      textAlign: "center",
      lineHeight: getResponsiveFontSize(20, 22, 24),
    },
    infoContainer: {
      marginVertical: spacing.xl,
    },
    infoCard: {
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
      flexDirection: "row",
      alignItems: "flex-start",
      ...shadows.medium,
    },
    infoTitle: {
      fontSize: getResponsiveFontSize(12, 14, 16),
      fontWeight: "600",
      color: "#667eea",
      marginLeft: spacing.sm,
      marginBottom: spacing.xs,
      flex: 1,
    },
    infoText: {
      fontSize: getResponsiveFontSize(12, 14, 16),
      color: "#333",
      marginLeft: spacing.sm,
      flex: 1,
      lineHeight: getResponsiveFontSize(18, 20, 22),
    },
    countdownContainer: {
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      alignItems: "center",
      marginTop: spacing.sm,
      ...shadows.medium,
    },
    countdownLabel: {
      fontSize: getResponsiveFontSize(12, 14, 16),
      fontWeight: "600",
      color: "#667eea",
      marginBottom: spacing.sm,
    },
    countdownTime: {
      fontSize: getResponsiveFontSize(20, 24, 28),
      fontWeight: "bold",
      color: "#333",
      fontFamily: "monospace",
    },
    messageContainer: {
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,
    },
    message: {
      fontSize: getResponsiveFontSize(14, 16, 18),
      color: "#333",
      textAlign: "center",
      lineHeight: getResponsiveFontSize(20, 24, 28),
    },
    buttonContainer: {
      gap: spacing.md,
    },
    retryButton: {
      backgroundColor: "#667eea",
      borderRadius: borderRadius.lg,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.xl,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      ...shadows.large,
    },
    buttonText: {
      color: "#fff",
      fontSize: getResponsiveFontSize(14, 16, 18),
      fontWeight: "600",
    },
    backButton: {
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      borderRadius: borderRadius.lg,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.xl,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
    },
    backButtonText: {
      color: "#667eea",
      fontSize: getResponsiveFontSize(14, 16, 18),
      fontWeight: "600",
    },
    footer: {
      alignItems: "center",
      marginBottom: spacing.lg,
    },
    footerText: {
      fontSize: getResponsiveFontSize(12, 14, 16),
      color: "rgba(255, 255, 255, 0.7)",
      textAlign: "center",
    },
  });

  useEffect(() => {
    // Subscribe to maintenance state changes
    const unsubscribe =
      MaintenanceService.getInstance().subscribe(setMaintenanceState);

    // Start animations
    startAnimations();

    // Force update every second to ensure countdown displays properly
    const timer = setInterval(() => {
      setForceUpdate((prev) => prev + 1);
    }, 1000);

    // Periodic maintenance status check every 30 seconds
    const maintenanceCheckTimer = setInterval(async () => {
      try {
        const { maintenanceAPI } = await import("@/services/api");
        const response = await maintenanceAPI.checkMaintenanceStatus();

        if (response.data && response.data.success) {
          const maintenanceData = response.data.data;

          // Check if maintenance data is null or empty (maintenance finished)
          if (!maintenanceData || maintenanceData === null) {
            logger.log(
              "✅ Maintenance data is null - maintenance finished automatically, clearing maintenance mode"
            );
            MaintenanceService.getInstance().clearMaintenanceMode();
            return;
          }

          // Check if maintenance is still active
          if (maintenanceData.maintenance_status === 1) {
            // Check if maintenance has ended
            const endTime = new Date(maintenanceData.end_time);
            const currentTime = new Date();

            if (currentTime >= endTime) {
              // Maintenance has ended, clear maintenance mode
              logger.log(
                "✅ Maintenance period has ended automatically, clearing maintenance mode"
              );
              MaintenanceService.getInstance().clearMaintenanceMode();
            } else {
              // Update maintenance data with latest info
              const transformedData = {
                maintenanceStatus: true,
                startTime: maintenanceData.start_time,
                endTime: maintenanceData.end_time,
                reason: maintenanceData.reason,
                message: maintenanceData.message,
              };

              MaintenanceService.getInstance().setMaintenanceMode(
                transformedData
              );
            }
          } else {
            // Maintenance is not active, clear maintenance mode
            logger.log(
              "✅ Maintenance is not active (status: " +
              maintenanceData.maintenance_status +
              "), clearing maintenance mode"
            );
            MaintenanceService.getInstance().clearMaintenanceMode();
          }
        } else {
          // API call failed or unsuccessful response, clear maintenance mode
          logger.log(
            "❌ Periodic maintenance check failed or unsuccessful response, clearing maintenance mode to allow normal flow"
          );
          MaintenanceService.getInstance().clearMaintenanceMode();
        }
      } catch (error) {
        logger.warn("⚠️ Periodic maintenance check failed:", error);
        // Clear maintenance mode on error to allow normal flow
        logger.log(
          "🔄 Clearing maintenance mode due to periodic check error to allow normal flow"
        );
        MaintenanceService.getInstance().clearMaintenanceMode();
      }
    }, 30000); // Check every 30 seconds

    return () => {
      unsubscribe();
      clearInterval(timer);
      clearInterval(maintenanceCheckTimer);
    };
  }, []);

  const startAnimations = () => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Pulse animation for the icon
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();
  };

  const handleRetry = async () => {
    logger.log("🔄 User requested retry during maintenance");

    try {
      // Set checking state
      MaintenanceService.getInstance().setChecking(true);

      // Check maintenance status from API
      const { maintenanceAPI } = await import("@/services/api");
      const response = await maintenanceAPI.checkMaintenanceStatus();

      if (response.data && response.data.success) {
        const maintenanceData = response.data.data;

        // Check if maintenance data is null or empty (maintenance finished)
        if (!maintenanceData || maintenanceData === null) {
          logger.log(
            "✅ Maintenance data is null - maintenance finished, clearing maintenance mode"
          );
          MaintenanceService.getInstance().clearMaintenanceMode();
          router.replace("/(app)/(tabs)/home");
          return;
        }

        // Check if maintenance is still active
        if (maintenanceData.maintenance_status === 1) {
          // Maintenance is still active, check if it has ended
          const endTime = new Date(maintenanceData.end_time);
          const currentTime = new Date();

          if (currentTime >= endTime) {
            // Maintenance has ended, clear maintenance mode
            logger.log(
              "✅ Maintenance period has ended, clearing maintenance mode"
            );
            MaintenanceService.getInstance().clearMaintenanceMode();

            // Navigate to home page
            router.replace("/(app)/(tabs)/home");
          } else {
            // Maintenance is still active, update the maintenance data
            logger.log(
              "🔧 Maintenance is still active, updating maintenance data"
            );

            const transformedData = {
              maintenanceStatus: true,
              startTime: maintenanceData.start_time,
              endTime: maintenanceData.end_time,
              reason: maintenanceData.reason,
              message: maintenanceData.message,
            };

            MaintenanceService.getInstance().setMaintenanceMode(
              transformedData
            );
          }
        } else {
          // Maintenance is not active (status = 0 or other), clear maintenance mode
          logger.log(
            "✅ Maintenance is not active (status: " +
            maintenanceData.maintenance_status +
            "), clearing maintenance mode"
          );
          MaintenanceService.getInstance().clearMaintenanceMode();

          // Navigate to home page
          router.replace("/(app)/(tabs)/home");
        }
      } else {
        // API call failed or returned unsuccessful response, clear maintenance mode
        logger.log(
          "❌ API call failed or unsuccessful response, clearing maintenance mode to allow normal flow"
        );
        MaintenanceService.getInstance().clearMaintenanceMode();
        router.replace("/(app)/(tabs)/home");
      }
    } catch (error) {
      logger.error("❌ Error checking maintenance status:", error);
      // Clear maintenance mode on error to allow normal flow
      logger.log(
        "🔄 Clearing maintenance mode due to error to allow normal flow"
      );
      MaintenanceService.getInstance().clearMaintenanceMode();
      router.replace("/(app)/(tabs)/home");
    } finally {
      // Clear checking state
      MaintenanceService.getInstance().setChecking(false);
    }
  };

  const handleGoBack = () => {
    logger.log("🔙 User requested to go back during maintenance");
    router.back();
  };

  const formatTimeRemaining = (): string => {
    return MaintenanceService.getInstance().formatTimeRemaining();
  };

  const getMaintenanceMessage = (): string => {
    return (
      maintenanceState.maintenanceData?.message ||
      t("maintenance.defaultMessage")
    );
  };

  const getMaintenanceReason = (): string => {
    return (
      maintenanceState.maintenanceData?.reason || t("maintenance.defaultReason")
    );
  };

  const getMaintenanceEndTime = (): string => {
    if (!maintenanceState.maintenanceData?.endTime) return "";

    try {
      const endDate = new Date(maintenanceState.maintenanceData.endTime);
      return endDate.toLocaleString();
    } catch (error) {
      logger.error("Error formatting end time:", error);
      return maintenanceState.maintenanceData.endTime;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#667eea", "#764ba2"]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Language Toggle Button */}
        <View style={styles.languageToggleContainer}>
          <TouchableOpacity
            style={styles.languageToggleButton}
            onPress={toggleLanguage}
          >
            <Ionicons name="language" size={deviceScale(24)} color="#fff" />
            <Text style={styles.languageToggleText}>
              {language === "en" ? "தமிழ்" : "English"}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            {/* Header */}
            <View style={styles.header}>
              <Animated.View
                style={[
                  styles.iconContainer,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <Ionicons
                  name="construct"
                  size={deviceScale(80)}
                  color="#fff"
                />
              </Animated.View>

              <Text style={styles.title}>{t("maintenance.title")}</Text>

              <Text style={styles.subtitle}>{t("maintenance.subtitle")}</Text>
            </View>

            {/* Maintenance Info */}
            <View style={styles.infoContainer}>
              <View style={styles.infoCard}>
                <Ionicons
                  name="information-circle"
                  size={deviceScale(24)}
                  color="#667eea"
                />
                <Text style={styles.infoTitle}>{t("maintenance.reason")}</Text>
                <Text style={styles.infoText}>{getMaintenanceReason()}</Text>
              </View>

              <View style={styles.infoCard}>
                <Ionicons name="time" size={deviceScale(24)} color="#667eea" />
                <Text style={styles.infoTitle}>
                  {t("maintenance.estimatedEnd")}
                </Text>
                <Text style={styles.infoText}>{getMaintenanceEndTime()}</Text>
              </View>

              {maintenanceState.timeRemaining > 0 && (
                <View style={styles.countdownContainer}>
                  <Text style={styles.countdownLabel}>
                    {t("maintenance.timeRemaining")}
                  </Text>
                  <Text style={styles.countdownTime}>
                    {formatTimeRemaining()}
                  </Text>
                </View>
              )}
            </View>

            {/* Message */}
            <View style={styles.messageContainer}>
              <Text style={styles.message}>{getMaintenanceMessage()}</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={handleRetry}
                disabled={maintenanceState.isChecking}
              >
                {maintenanceState.isChecking ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons
                      name="refresh"
                      size={deviceScale(20)}
                      color="#fff"
                    />
                    <Text style={styles.buttonText}>
                      {maintenanceState.isChecking
                        ? t("maintenance.checking") || "Checking..."
                        : t("maintenance.retry") || "Check Again"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* <TouchableOpacity
                style={styles.backButton}
                onPress={handleGoBack}
              >
                <Ionicons
                  name="arrow-back"
                  size={deviceScale(20)}
                  color="#667eea"
                />
                <Text style={styles.backButtonText}>
                  {t("maintenance.goBack")}
                </Text>
              </TouchableOpacity> */}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>{t("maintenance.thankYou")}</Text>
            </View>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}
