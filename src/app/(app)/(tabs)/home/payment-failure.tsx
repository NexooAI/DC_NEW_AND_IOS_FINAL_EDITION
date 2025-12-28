import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  BackHandler,
  InteractionManager,
  Alert,
  ToastAndroid,
  Platform
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@/constants/theme";
import { useTranslation } from "@/hooks/useTranslation";
import useGlobalStore from "@/store/global.store";
import { logger } from "@/utils/logger";
import { responsiveUtils } from "@/utils/responsiveUtils";

// Responsive constants
const { wp, hp, rf, rp, rm, rb, getShadows } = responsiveUtils;
const shadows = getShadows();

export default function PaymentFailure() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const router = useRouter();
  const { user, setTabVisibility } = useGlobalStore();

  // Hide tab bar on focus & Handle Back Button
  useFocusEffect(
    useCallback(() => {
      setTabVisibility(false);
      
      const onBackPress = () => {
        router.replace("/(tabs)/home");
        return true;
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => {
        setTabVisibility(true);
        backHandler.remove();
      };
    }, [setTabVisibility, router])
  );

  // Log payment failure data when component mounts
  useEffect(() => {
    const logData = {
      timestamp: new Date().toISOString(),
      message: params.message,
      txnId: params.txnId,
      orderId: params.orderId,
      amount: params.amount,
      status: params.status,
      allParams: params,
    };

    logger.log("📋 PAYMENT FAILURE PAGE - Received Params:", logData);

    // Also save to persistent storage (survives crashes)
    logger.payment("PAYMENT FAILURE PAGE - Params Received", logData);
  }, []);

  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [pulseAnim] = useState(new Animated.Value(1));
  const [iconAnim] = useState(new Animated.Value(0));


  useEffect(() => {
    // Initial animation sequence
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(iconAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
    ]).start();

    // Infinite pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
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
    ).start();
  }, []);

  const handleHomePress = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => router.replace("/(tabs)/home"));
  };

  const handleCopy = async (text: string, label: string) => {
    if (!text) return;
    await Clipboard.setStringAsync(text);
    if (Platform.OS === 'android') {
      ToastAndroid.show(`${label} Copied`, ToastAndroid.SHORT);
    } else {
      Alert.alert("Copied", `${label} copied to clipboard`);
    }
  };

  const handleRetry = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      try {
        // Get payment session from global store
        const paymentSession = useGlobalStore.getState().getCurrentPaymentSession();

        if (paymentSession?.userDetails) {
          logger.log("Retrying payment - using payment session from global store");

          // Prepare userDetails for navigation (exclude orderId for retry)
          const userDetailsForNav = {
            ...paymentSession.userDetails,
            amount: paymentSession.amount || params.amount,
            // Remove orderId as we'll get a new one
            orderId: undefined,
          };

          // Prepare navigation params with fallbacks
          const navigationParams: any = {
            pathname: "/(tabs)/home/paymentNewOverView",
            params: {
              amount: String(paymentSession.amount || params.amount || 0),
              userDetails: JSON.stringify(userDetailsForNav),
            },
          };

          // Add optional params only if they exist
          const userDetails = paymentSession.userDetails as any; // Type assertion for additional fields

          if (userDetails.schemeId) {
            navigationParams.params.schemeId = String(userDetails.schemeId);
          }
          if (userDetails.chitId) {
            navigationParams.params.chitId = String(userDetails.chitId);
          }
          if (userDetails.paymentFrequency) {
            navigationParams.params.paymentFrequency = userDetails.paymentFrequency;
          }
          if (userDetails.schemeType) {
            navigationParams.params.schemeType = userDetails.schemeType;
          }
          navigationParams.params.source = userDetails.source || "payment_retry";

          // Use InteractionManager to ensure UI is ready before navigation
          InteractionManager.runAfterInteractions(() => {
            try {
              router.replace(navigationParams);
              logger.log("Navigated to paymentNewOverView for retry", {
                amount: navigationParams.params.amount,
                hasUserDetails: !!navigationParams.params.userDetails,
              });
            } catch (navError) {
              logger.error("Error navigating to paymentNewOverView:", navError);
              // Fallback: try to go back
              router.back();
            }
          });
        } else {
          // No payment session found, try to navigate back to payment overview
          logger.warn("No payment session found for retry, navigating back");
          router.back();
        }
      } catch (error) {
        logger.error("Error in handleRetry:", error);
        // Fallback: navigate back
        router.back();
      }
    });
  };
  const iconScale = iconAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View style={styles.iconContainer}>
          <Animated.View
            style={[styles.iconWrapper, { transform: [{ scale: pulseAnim }] }]}
          >
            <Animated.View
              style={[styles.iconInner, { transform: [{ scale: iconScale }] }]}
            >
              <Ionicons
                name="close-circle"
                size={rp(80)}
                color={theme.colors.error}
              />
            </Animated.View>
          </Animated.View>
        </View>

        <Text style={styles.title}>{t("paymentFailed")}</Text>
        <Text style={styles.message}>
          {Array.isArray(params.message) ? params.message[0] : (params.message || t("paymentFailedMessage"))}
        </Text>

        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>{t("paymentDetails")}</Text>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons
                name="receipt-outline"
                size={rp(20)}
                color={theme.colors.error}
              />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>{t("transactionId")}</Text>
              <TouchableOpacity 
                style={styles.copyRow} 
                onPress={() => handleCopy(Array.isArray(params.txnId) ? params.txnId[0] : (params.txnId || ""), t("transactionId"))}
              >
                <Text style={styles.detailValue}>
                  {Array.isArray(params.txnId) ? params.txnId[0] : (params.txnId || "N/A")}
                </Text>
                <Ionicons name="copy-outline" size={16} color={theme.colors.error} style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons
                name="document-text-outline"
                size={rp(20)}
                color={theme.colors.error}
              />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>{t("orderId")}</Text>
              <TouchableOpacity 
                style={styles.copyRow} 
                onPress={() => handleCopy(Array.isArray(params.orderId) ? params.orderId[0] : (params.orderId || ""), t("orderId"))}
              >
                <Text style={styles.detailValue}>
                  {Array.isArray(params.orderId) ? params.orderId[0] : (params.orderId || "N/A")}
                </Text>
                <Ionicons name="copy-outline" size={16} color={theme.colors.error} style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons
                name="wallet-outline"
                size={rp(20)}
                color={theme.colors.error}
              />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>{t("amount")}</Text>
              <Text style={[styles.detailValue, styles.amountValue]}>
                {new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: "INR",
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(Number(Array.isArray(params.amount) ? params.amount[0] : params.amount) || 0)}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.buttonHalf, styles.buttonRetry]}
            onPress={handleRetry}
            activeOpacity={0.9}
          >
            <Ionicons name="refresh" size={rp(20)} color="#fff" />
            <Text style={styles.buttonText}>{t("retry")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.buttonHalf, styles.buttonHome]}
            onPress={handleHomePress}
            activeOpacity={0.9}
          >
            <Ionicons name="home" size={rp(20)} color={theme.colors.textDark} />
            <Text style={[styles.buttonText, styles.buttonTextHome]}>{t("home")}</Text>
          </TouchableOpacity>
        </View>
        </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9ff",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  content: {
    padding: rp(16),
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingVertical: rp(20),
  },
  iconContainer: {
    marginBottom: rp(10), // Reduced margin
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  iconWrapper: {
    width: rp(80), // Reduced size
    height: rp(80),
    borderRadius: rp(40),
    backgroundColor: "#ffebee",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: rp(12),
  },
  iconInner: {
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: rf(22, { minSize: 20, maxSize: 26 }),
    fontWeight: "800",
    color: theme.colors.error,
    marginBottom: rp(8), // Reduced
    textAlign: "center",
    fontFamily: "Inter_700Bold",
  },
  message: {
    fontSize: rf(15, { minSize: 13, maxSize: 17 }),
    color: "#616161",
    textAlign: "center",
    marginBottom: rp(20), // Reduced
    lineHeight: rp(22),
    maxWidth: "90%",
    fontFamily: "Inter_400Regular",
  },
  detailsCard: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: rb(24),
    padding: rp(20), // Reduced
    marginBottom: rp(20), // Reduced
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  detailsTitle: {
    fontSize: rf(18, { minSize: 16, maxSize: 20 }),
    fontWeight: "700",
    color: "#2d3748",
    marginBottom: rp(16), // Reduced
    fontFamily: "Inter_600SemiBold",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: rp(12),
  },
  copyRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailIcon: {
    width: rp(36),
    height: rp(36),
    borderRadius: rb(12),
    backgroundColor: "#fde8e8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: rp(16),
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: rf(14, { minSize: 12, maxSize: 16 }),
    color: "#718096",
    marginBottom: rp(4),
    fontFamily: "Inter_400Regular",
  },
  detailValue: {
    fontSize: rf(16, { minSize: 14, maxSize: 18 }),
    color: "#1a202c",
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  amountValue: {
    color: theme.colors.error,
    fontWeight: "700",
    fontSize: rf(18, { minSize: 16, maxSize: 22 }),
  },
  divider: {
    height: 1,
    backgroundColor: "#edf2f7",
    marginVertical: rp(4),
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: rp(20),
  },
  buttonRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: rp(20),
    gap: rp(16),
  },
  button: {
    paddingVertical: rp(18),
    paddingHorizontal: rp(24),
    borderRadius: rb(16),
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    minHeight: rp(56),
    ...shadows.small,
  },
  buttonHalf: {
    flex: 1,
  },
  buttonRetry: {
    backgroundColor: theme.colors.error,
    elevation: 8,
    shadowColor: theme.colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  buttonHome: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e5e5",
    elevation: 2,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: rf(16, { minSize: 14, maxSize: 18 }),
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginLeft: rp(8),
  },
  buttonTextHome: {
    color: theme.colors.textDark,
  },
});
