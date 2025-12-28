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
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [pulseAnim] = useState(new Animated.Value(1));
  const [checkmarkAnim] = useState(new Animated.Value(0));


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
      Animated.timing(checkmarkAnim, {
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
  const handleSavingsPress = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      // First reset the current stack to home root
      router.replace("/(tabs)/home");
      
      // Then navigate to savings after a tick
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
    });
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

  const checkmarkScale = checkmarkAnim.interpolate({
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
            style={[
              styles.checkmarkContainer,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <Animated.View
              style={[
                styles.checkmarkInner,
                { transform: [{ scale: checkmarkScale }] },
              ]}
            >
              <Ionicons name="checkmark-circle" size={rp(80)} color="#16c72e" />
            </Animated.View>
          </Animated.View>
        </View>

        <Text style={styles.title}>{t("paymentSuccessful")}</Text>
        <Text style={styles.message}>{t("paymentSuccessMessage")}</Text>

        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>{t("paymentDetails")}</Text>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons
                name="receipt-outline"
                size={rp(20)}
                color={theme.colors.primary}
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
                <Ionicons name="copy-outline" size={16} color={theme.colors.primary} style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons
                name="document-text-outline"
                size={rp(20)}
                color={theme.colors.primary}
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
                <Ionicons name="copy-outline" size={16} color={theme.colors.primary} style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons
                name="wallet-outline"
                size={rp(20)}
                color={theme.colors.primary}
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

        {/* Button Row: Home (left) and Savings (right) */}
        {/* Button Row: Home (left) and Savings (right) */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.buttonLeft, styles.buttonHome]}
            onPress={handleHomePress}
            activeOpacity={0.9}
          >
            <Ionicons name="home" size={rp(20)} color={theme.colors.textDark} />
            <Text style={[styles.buttonText, styles.buttonTextHome]}>{t("home")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.buttonRight, styles.buttonSavings]}
            onPress={handleSavingsPress}
            activeOpacity={0.9}
          >
            <Ionicons name="wallet" size={rp(20)} color="#fff" />
            <Text style={styles.buttonText}>{t("savings")}</Text>
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
  content: {
    flex: 1,
    padding: rp(16),
    alignItems: "center",
    justifyContent: "space-between", // Distribute space
    paddingVertical: rp(20),
  },
  iconContainer: {
    marginBottom: rp(10),
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  checkmarkContainer: {
    width: rp(100), // Reduced size
    height: rp(100),
    alignItems: "center",
    justifyContent: "center",
  },
  checkmarkInner: {
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: rf(22, { minSize: 20, maxSize: 26 }),
    fontWeight: "800",
    color: "#16c72e",
    marginBottom: rp(8), // Reduced margin
    textAlign: "center",
    fontFamily: "Inter_700Bold",
  },
  message: {
    fontSize: rf(15, { minSize: 13, maxSize: 17 }),
    color: "#616161",
    textAlign: "center",
    marginBottom: rp(20), // Reduced margin
    lineHeight: rp(22),
    maxWidth: "90%",
    fontFamily: "Inter_400Regular",
  },
  detailsCard: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: rb(24),
    padding: rp(20), // Reduced padding
    marginBottom: rp(20), // Reduced margin
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
    marginBottom: rp(16), // Reduced margin
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
    backgroundColor: "#e3f2fd",
    alignItems: "center",
    justifyContent: "center",
    marginRight: rp(16),
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: rf(12, { minSize: 10, maxSize: 14 }),
    color: "#718096",
    marginBottom: rp(4),
    fontFamily: "Inter_400Regular",
  },
  detailValue: {
    fontSize: rf(14, { minSize: 12, maxSize: 16 }),
    color: "#1a202c",
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  amountValue: {
    color: "#2e7d32",
    fontWeight: "700",
    fontSize: rf(18, { minSize: 16, maxSize: 22 }),
  },
  divider: {
    height: 1,
    backgroundColor: "#edf2f7",
    marginVertical: rp(4),
  },
  buttonRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: rp(20),
    gap: rp(16),
  },
  button: {
    paddingVertical: rp(18),
    paddingHorizontal: rp(20),
    borderRadius: rb(16),
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    ...shadows.small,
    flex: 1,
    minHeight: rp(56),
  },
  buttonLeft: {
    // Left button styling
  },
  buttonRight: {
    // Right button styling
  },
  buttonSavings: {
    backgroundColor: theme.colors.primary,
    elevation: 8,
    shadowColor: theme.colors.primary,
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
