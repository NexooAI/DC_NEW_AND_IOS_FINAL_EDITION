import React, { useEffect, useState, useCallback, useRef } from "react";
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
  ActivityIndicator,
  ScrollView
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@/constants/theme";
import { useTranslation } from "@/hooks/useTranslation";
import useGlobalStore, { useAppTheme, getAppConfig } from "@/store/global.store";
import { logger } from "@/utils/logger";
import { responsiveUtils } from "@/utils/responsiveUtils";
import RatingModal, { useRatingPrompt } from "@/components/RatingModal";
import * as SecureStore from "expo-secure-store";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";
import { generatePaymentReceiptHTML, PaymentReceiptData } from "@/templates/html";
import { investmentAPI, billsAPI } from "@/services/api";

// Responsive constants
const { wp, hp, rf, rp, rm, rb, getShadows } = responsiveUtils;
const shadows = getShadows();

export default function PaymentSuccess() {
  const theme = useAppTheme();
  styles = getStyles(theme);
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const router = useRouter();

  const type = (Array.isArray(params.type) ? params.type[0] : params.type) || "";
  const isBillPayment = type === "bill";

  const {
    showRating,
    checkAndShowRating,
    hideRating,
  } = useRatingPrompt();

  useEffect(() => {
    // Show rating prompt after completing a payment (1 second delay)
    const ratingTimer = setTimeout(() => {
      checkAndShowRating();
    }, 1000);
    return () => clearTimeout(ratingTimer);
  }, []);
  
  useEffect(() => {
    logger.log("Payment Success Params:", params);
  }, [params]);
  const { user, setTabVisibility } = useGlobalStore();

  const [fetchedInvestment, setFetchedInvestment] = useState<any>(null);
  const userId = Array.isArray(params.userId) ? params.userId[0] : (params.userId || user?.id?.toString() || "");

  useEffect(() => {
    const fetchInvestmentDetails = async () => {
      const investmentId = Array.isArray(params.investmentId) ? params.investmentId[0] : params.investmentId;
      if (!investmentId) return;
      try {
        const response = await investmentAPI.getInvestmentDetails(investmentId);
        if (response.data && response.data.success && response.data.data) {
          setFetchedInvestment(response.data.data.investmentList);
          logger.log("Successfully fetched investment details for receipt:", response.data.data.investmentList);
        }
      } catch (error) {
        logger.error("Failed to fetch investment details on payment success:", error);
      }
    };
    fetchInvestmentDetails();
  }, [params.investmentId]);

  useEffect(() => {
    if (isBillPayment && userId) {
      billsAPI.getUserBills(userId).catch((err) => {
        logger.error("Failed to fetch user bills on payment success:", err);
      });
    }
  }, [isBillPayment, userId]);

  // Hide tab bar on focus
  useFocusEffect(
    useCallback(() => {
      setTabVisibility(false);
      
      // Handle back button to go to home instead of back
      const onBackPress = () => {
        if (isBillPayment) {
          router.replace("/(app)/bill_payment");
        } else if (type === "booking" || type === "advance_booking") {
          router.replace("/(tabs)/home");
        } else {
          router.replace("/(tabs)/home");
        }
        return true;
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => {
        // Show tabs again when leaving
        setTabVisibility(true);
        backHandler.remove();
      };
    }, [setTabVisibility, router, isBillPayment, type])
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
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const [isSharing, setIsSharing] = useState(false);

  // Confetti Particle Generator
  const confettiCount = 30;
  const confettiAnims = useRef(
    Array.from({ length: confettiCount }).map(() => ({
      y: new Animated.Value(-100),
      x: new Animated.Value(Math.random() * 400 - 200),
      rotate: new Animated.Value(Math.random() * 360),
      color: ["#ffc90c", "#850111", "#ff4444", "#4CAF50", "#007AFF"][Math.floor(Math.random() * 5)],
      size: Math.random() * 8 + 6,
    }))
  ).current;

  const startConfetti = () => {
    confettiAnims.forEach((anim) => {
      Animated.sequence([
        Animated.delay(Math.random() * 1000),
        Animated.parallel([
          Animated.timing(anim.y, {
            toValue: 800,
            duration: Math.random() * 2000 + 2000,
            useNativeDriver: true,
          }),
          Animated.timing(anim.rotate, {
            toValue: 360,
            duration: Math.random() * 2000 + 2000,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    });
  };

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

    // Infinite rotation for gold coin
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    startConfetti();
  }, []);

  const handleShareReceipt = async () => {
    if (isSharing) return;
    setIsSharing(true);
    try {
      const transactionId = Array.isArray(params.txnId) ? params.txnId[0] : (params.txnId || "");
      if (!transactionId) {
        Alert.alert("Error", "Transaction ID is missing");
        setIsSharing(false);
        return;
      }

      const receiptData: PaymentReceiptData = {
        transactionId: transactionId,
        paymentId: Array.isArray(params.txnId) ? params.txnId[0] : (params.txnId || ""),
        amountPaid: Number(Array.isArray(params.amount) ? params.amount[0] : params.amount) || 0,
        paymentDate: new Date().toISOString(),
        paymentMode: "UPI/Card",
        paymentModeType: "Online",
        orderId: Array.isArray(params.orderId) ? params.orderId[0] : (params.orderId || ""),
        userName: user?.name || "Customer",
        userMobile: user?.mobile?.toString() || "",
        userEmail: user?.email || "",
        maturityDate: fetchedInvestment?.end_date || (Array.isArray(params.maturityDate) ? params.maturityDate[0] : params.maturityDate) || undefined,
        inversement: {
          accountName: fetchedInvestment?.accountName || user?.name || "",
          accountNo: fetchedInvestment?.accountNo || user?.id?.toString() || "",
          schemeName: fetchedInvestment?.schemeName || (Array.isArray(params.schemeName) ? params.schemeName[0] : params.schemeName) || (Array.isArray(params.schemeType) ? params.schemeType[0] : params.schemeType) || "Scheme",
          paymentFrequencyName: fetchedInvestment?.paymentFrequencyName || Array.isArray(params.paymentFrequency) ? params.paymentFrequency[0] : (params.paymentFrequency || "Monthly"),
          joiningDate: fetchedInvestment?.joiningDate || (Array.isArray(params.joiningDate) ? params.joiningDate[0] : params.joiningDate) || new Date().toISOString(),
          end_date: fetchedInvestment?.end_date || (Array.isArray(params.maturityDate) ? params.maturityDate[0] : params.maturityDate) || new Date().toISOString(),
          paymentStatus: "Paid",
          total_paid: Number(Array.isArray(params.amount) ? params.amount[0] : params.amount) || 0,
          totalgoldweight: fetchedInvestment?.totalgoldweight || 0,
          current_goldrate: Number(Array.isArray(params.goldRate) ? params.goldRate[0] : params.goldRate) || fetchedInvestment?.current_goldrate || 0,
        }
      };

      const htmlContent = generatePaymentReceiptHTML(receiptData);
      const { uri } = await Print.printToFileAsync({ html: htmlContent });

      const sanitizeFileName = (str: string) => str.replace(/[^a-zA-Z0-9]/g, '_');
      const customerName = sanitizeFileName(user?.name || 'Customer');
      const fileName = `Receipt_${customerName}_${transactionId}.pdf`;

      const targetDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
      const targetUri = `${targetDir}${fileName}`;
      await FileSystem.moveAsync({ from: uri, to: targetUri });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(targetUri, {
          mimeType: "application/pdf",
          dialogTitle: "Share Receipt",
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert("Success", `Receipt generated at: ${targetUri}`);
      }
    } catch (error) {
      logger.error("Error sharing receipt:", error);
      Alert.alert("Error", "An error occurred while sharing the receipt.");
    } finally {
      setIsSharing(false);
    }
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

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
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      {/* Confetti Particles Container */}
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden" }} pointerEvents="none">
        {confettiAnims.map((anim, i) => (
          <Animated.View
            key={i}
            style={{
              position: "absolute",
              width: anim.size,
              height: anim.size * 1.5,
              backgroundColor: anim.color,
              borderRadius: anim.size / 4,
              left: "50%", // offset to center screen dynamically
              transform: [
                { translateY: anim.y },
                { translateX: anim.x },
                {
                  rotate: anim.rotate.interpolate({
                    inputRange: [0, 360],
                    outputRange: ["0deg", "360deg"],
                  }),
                },
              ],
              zIndex: 10,
              opacity: 0.8,
            }}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
              { transform: [{ scale: pulseAnim }, { rotateY: spin }] },
            ]}
          >
            <Animated.View
              style={[
                styles.checkmarkInner,
                { transform: [{ scale: checkmarkScale }] },
              ]}
            >
              <Ionicons name="ellipse" size={rp(100)} color="#ffc90c" />
              <Ionicons name="checkmark-circle" size={rp(60)} color="#16c72e" style={{ position: "absolute" }} />
              <Ionicons name="sparkles" size={rp(24)} color="#fff" style={styles.coinSparkle} />
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
                <Ionicons name="copy-outline" size={16} color={theme.colors.textDark} style={{ marginLeft: 8 }} />
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
                <Ionicons name="copy-outline" size={16} color={theme.colors.textDark} style={{ marginLeft: 8 }} />
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



        {/* Share Receipt Button */}
        {!(type === "bill" || type === "booking" || type === "advance_booking") && (
          <TouchableOpacity
            style={[styles.shareButton, isSharing && { opacity: 0.7 }]}
            onPress={handleShareReceipt}
            disabled={isSharing}
          >
            {isSharing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="share-social-outline" size={20} color="#fff" />
                <Text style={styles.shareButtonText}>{t("shareReceipt")}</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Button Row depending on payment type */}
        {type === "bill" ? (
          <TouchableOpacity
            style={styles.shareButton} // Full width styled button like shareButton
            onPress={() => router.replace("/(app)/bill_payment")}
          >
            <Text style={styles.shareButtonText}>{(t("backToBills") || "BACK TO BILLS").toUpperCase()}</Text>
          </TouchableOpacity>
        ) : (type === "booking" || type === "advance_booking") ? (
          <View style={{ width: "100%", gap: rp(12) }}>
            <TouchableOpacity
              style={styles.shareButton} // Full width styled primary button
              onPress={() => router.replace("/(tabs)/home/BookingHistory")}
            >
              <Ionicons name="time-outline" size={20} color="#fff" />
              <Text style={styles.shareButtonText}>{(t("showAdvanceHistory") || "SHOW ADVANCE HISTORY").toUpperCase()}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonHome, { width: "100%", minHeight: rp(56) }]} // Full width styled secondary button
              onPress={() => router.replace("/(tabs)/home")}
            >
              <Ionicons name="home" size={rp(20)} color={theme.colors.textDark} />
              <Text style={[styles.buttonText, styles.buttonTextHome]}>{(t("backToHome") || "BACK TO HOME").toUpperCase()}</Text>
            </TouchableOpacity>
          </View>
        ) : (
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
        )}
      </Animated.View>
      </ScrollView>
      <RatingModal
        visible={showRating}
        onClose={hideRating}
        appName="DC Jewellers"
      />
    </SafeAreaView>
  );
}

function getStyles(theme: any) { return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9ff",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    width: "100%",
    padding: rp(16),
    alignItems: "center",
    justifyContent: "center",
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
  countdownText: {
    fontSize: rf(14, { minSize: 12, maxSize: 16 }),
    color: "#718096",
    fontFamily: "Inter_400Regular",
    marginBottom: rp(16),
    textAlign: "center",
  },
  coinSparkle: {
    position: "absolute",
    top: -5,
    right: -5,
    textShadowColor: "rgba(255, 255, 255, 0.8)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  shareButton: {
    width: "100%",
    minHeight: rp(56),
    borderRadius: rb(16),
    backgroundColor: "#16c72e",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: rp(16),
    paddingHorizontal: rp(20),
    elevation: 4,
    shadowColor: "#16c72e",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    gap: 8,
  },
  shareButtonText: {
    color: "#ffffff",
    fontSize: rf(16, { minSize: 14, maxSize: 18 }),
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
}) }

var styles = getStyles(theme);;
