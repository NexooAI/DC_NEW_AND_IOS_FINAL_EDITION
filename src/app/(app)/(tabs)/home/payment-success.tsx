import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  BackHandler,
  Alert,
  ToastAndroid,
  Platform,
  ScrollView,
  Share
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
import { LinearGradient } from "expo-linear-gradient";

// Responsive constants
const { wp, hp, rf, rp, rm, rb, getShadows } = responsiveUtils;
const shadows = getShadows();

export default function PaymentSuccess() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const router = useRouter();

  useEffect(() => {
    logger.log("Payment Success Params:", params);
  }, [params]);
  const { setTabVisibility } = useGlobalStore();

  // Hide tab bar on focus
  useFocusEffect(
    useCallback(() => {
      setTabVisibility(false);

      // Handle back button to go to home instead of back
      const onBackPress = () => {
        router.replace("/(tabs)/home");
        return true;
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => {
        // Show tabs again when leaving
        setTabVisibility(true);
        backHandler.remove();
      };
    }, [setTabVisibility, router])
  );

  // Log payment success data when component mounts
  useEffect(() => {
    const logData = {
      timestamp: new Date().toISOString(),
      txnId: params.txnId,
      orderId: params.orderId,
      amount: params.amount,
      investmentId: params.investmentId,
      schemeType: params.schemeType,
      paymentFrequency: params.paymentFrequency,
      allParams: params,
    };

    logger.log("📋 PAYMENT SUCCESS PAGE - Received Params:", logData);

    // Also save to persistent storage (survives crashes)
    logger.payment("PAYMENT SUCCESS PAGE - Params Received", logData);
  }, []);

  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(100)); // Start slightly off-screen
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [pulseAnim] = useState(new Animated.Value(1));
  const [checkmarkAnim] = useState(new Animated.Value(0));


  useEffect(() => {
    // Initial animation sequence
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(checkmarkAnim, {
        toValue: 1,
        duration: 600,
        delay: 300,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      })
    ]).start();

    // Infinite pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleHomePress = () => {
    router.replace("/(tabs)/home");
  };

  const handleSavingsPress = () => {
    router.replace("/(tabs)/home");
    setTimeout(() => {
      router.push({
        pathname: "/(tabs)/savings",
        params: {
          investmentId: params.investmentId,
          schemeType: params.schemeType,
          paymentFrequency: params.paymentFrequency,
        }
      });
    }, 100);
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

  const handleShare = async () => {
    try {
      const message = `Payment Successful!\n\nAmount: ${formatCurrency(Number(params.amount) || 0)}\nTransaction ID: ${params.txnId}\nDate: ${new Date().toLocaleDateString()}\n\nSri Murugan Gold House`;
      await Share.share({
        message,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const checkmarkScale = checkmarkAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View style={styles.container}>
      {/* Background Gradient for Top Half */}
      <View style={styles.topSection}>
        <LinearGradient
          colors={[theme.colors.successDark || "#2E7D32", theme.colors.success || "#4CAF50"]}
          style={styles.gradientBg}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Animated Checkmark Circle */}
        <Animated.View style={[styles.successIconContainer, { transform: [{ scale: scaleAnim }] }]}>
          <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }] }]} />
          <Animated.View style={[styles.iconCircle, { transform: [{ scale: checkmarkScale }] }]}>
            <Ionicons name="checkmark" size={rp(60)} color="#fff" />
          </Animated.View>
        </Animated.View>

        <Text style={styles.statusText}>{t("paymentSuccessful")}</Text>
        <Text style={styles.amountText}>{formatCurrency(Number(Array.isArray(params.amount) ? params.amount[0] : params.amount) || 0)}</Text>
      </View>

      {/* Bottom Content Card - Sliding Up */}
      <Animated.View
        style={[
          styles.bottomCard,
          {
            transform: [{ translateY: slideAnim }],
            opacity: fadeAnim
          }
        ]}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.messageText}>{t("paymentSuccessMessage")}</Text>

          <View style={styles.detailsContainer}>
            {/* Transaction ID */}
            <View style={styles.detailRow}>
              <View style={styles.iconBox}>
                <Ionicons name="receipt-outline" size={20} color={theme.colors.success} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>{t("transactionId")}</Text>
                <Text style={styles.detailValue} numberOfLines={1}>
                  {Array.isArray(params.txnId) ? params.txnId[0] : (params.txnId || "N/A")}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleCopy(Array.isArray(params.txnId) ? params.txnId[0] : (params.txnId || ""), t("transactionId"))}>
                <Ionicons name="copy-outline" size={20} color="#999" />
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            {/* Order ID */}
            <View style={styles.detailRow}>
              <View style={styles.iconBox}>
                <Ionicons name="cube-outline" size={20} color={theme.colors.success} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>{t("orderId")}</Text>
                <Text style={styles.detailValue} numberOfLines={1}>
                  {Array.isArray(params.orderId) ? params.orderId[0] : (params.orderId || "N/A")}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleCopy(Array.isArray(params.orderId) ? params.orderId[0] : (params.orderId || ""), t("orderId"))}>
                <Ionicons name="copy-outline" size={20} color="#999" />
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            {/* Date */}
            <View style={styles.detailRow}>
              <View style={styles.iconBox}>
                <Ionicons name="calendar-outline" size={20} color={theme.colors.success} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Date & Time</Text>
                <Text style={styles.detailValue}>{new Date().toLocaleString()}</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleSavingsPress}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>{t("savings")}</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
            </TouchableOpacity>

            <View style={styles.secondaryActions}>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={handleHomePress}
              >
                <Ionicons name="home-outline" size={20} color={theme.colors.textDark} />
                <Text style={styles.secondaryButtonText}>{t("home")}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={handleShare}
              >
                <Ionicons name="share-social-outline" size={20} color={theme.colors.textDark} />
                <Text style={styles.secondaryButtonText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>

        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.success || "#4CAF50",
  },
  topSection: {
    height: "35%",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  gradientBg: {
    ...StyleSheet.absoluteFillObject,
  },
  successIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  pulseCircle: {
    position: "absolute",
    width: rp(100),
    height: rp(100),
    borderRadius: rp(50),
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  iconCircle: {
    width: rp(80),
    height: rp(80),
    borderRadius: rp(40),
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
  },
  statusText: {
    fontSize: rf(18),
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  amountText: {
    fontSize: rf(32),
    color: "#ffffff",
    fontWeight: "800",
    letterSpacing: 1,
  },
  bottomCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 30,
    paddingHorizontal: 24,
    marginTop: -20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 15,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  messageText: {
    fontSize: rf(15),
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  detailsContainer: {
    backgroundColor: "#f9f9f9",
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: rf(12),
    color: "#888",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: rf(14),
    fontWeight: "600",
    color: "#333",
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 12,
  },
  actionsContainer: {
    gap: 16,
  },
  button: {
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 18,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    width: "100%",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: rf(16),
    fontWeight: "700",
  },
  secondaryActions: {
    flexDirection: "row",
    gap: 16,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e5e5",
    paddingVertical: 16,
  },
  secondaryButtonText: {
    color: "#333",
    fontSize: rf(14),
    fontWeight: "600",
    marginLeft: 8,
  }
});
