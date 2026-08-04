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
  Platform,
  ActivityIndicator,
  ScrollView,
  StatusBar
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@/constants/theme";
import { useTranslation } from "@/hooks/useTranslation";
import useGlobalStore from "@/store/global.store";
import { logger } from "@/utils/logger";
import { responsiveUtils } from "@/utils/responsiveUtils";
import RatingModal, { useRatingPrompt } from "@/components/RatingModal";
import * as SecureStore from "expo-secure-store";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";
import { generatePaymentReceiptHTML, PaymentReceiptData } from "@/templates/html";
import { loadLogoAsBase64 } from "@/utils/imageUtils";
import { investmentAPI, billsAPI } from "@/services/api";
import { LinearGradient } from "expo-linear-gradient";

const { wp, hp, rf, rp, rm, rb, getShadows } = responsiveUtils;
const shadows = getShadows();

// Jagged border that cuts into the white card using the background color
const JaggedBorder = () => {
  const triangles = Array.from({ length: 45 });
  return (
    <View style={styles.jaggedContainer}>
      {triangles.map((_, i) => (
        <View key={i} style={styles.triangle} />
      ))}
    </View>
  );
};

export default function PaymentSuccess() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const type = (Array.isArray(params.type) ? params.type[0] : params.type) || "";
  const isBillPayment = type === "bill";

  const {
    showRating,
    checkAndShowRating,
    hideRating,
  } = useRatingPrompt();

  useEffect(() => {
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
  const [fetchedTransactionId, setFetchedTransactionId] = useState<string>("");
  const userId = Array.isArray(params.userId) ? params.userId[0] : (params.userId || user?.id?.toString() || "");

  const [copiedTxn, setCopiedTxn] = useState(false);
  const [copiedOrder, setCopiedOrder] = useState(false);

  useEffect(() => {
    const fetchInvestmentDetails = async () => {
      const investmentId = Array.isArray(params.investmentId) ? params.investmentId[0] : params.investmentId;
      if (!investmentId) return;
      try {
        const response = await investmentAPI.getInvestmentDetails(investmentId);
        if (response.data && response.data.success && response.data.data) {
          setFetchedInvestment(response.data.data.investmentList);
          logger.log("Successfully fetched investment details for receipt:", response.data.data.investmentList);

          // Find matching transaction in paymentHistory using orderId
          const orderIdStr = (Array.isArray(params.orderId) ? params.orderId[0] : params.orderId || "").trim();
          const history = response.data.data.paymentHistory || [];
          const matchingTxn = history.find((t: any) => {
            const tOrderId = (t.orderId || t.order_id || t.orderid || "").trim();
            return tOrderId.toLowerCase() === orderIdStr.toLowerCase() && orderIdStr !== "";
          });

          let transactionIdToSet = "";
          if (matchingTxn) {
            transactionIdToSet =
              matchingTxn.transactionId ||
              matchingTxn.gatewayTransactionId ||
              matchingTxn.txn_id ||
              matchingTxn.txnId ||
              matchingTxn.utr_reference ||
              matchingTxn.rrn ||
              matchingTxn.epg_txn_id ||
              "";
          }

          if (transactionIdToSet) {
            setFetchedTransactionId(transactionIdToSet);
            logger.log("Found matching transaction ID in payment history:", transactionIdToSet);
          } else if (history.length > 0) {
            // Fallback to the last item in history
            const lastTxn = history[history.length - 1];
            const lastTxnId =
              lastTxn.transactionId ||
              lastTxn.gatewayTransactionId ||
              lastTxn.txn_id ||
              lastTxn.txnId ||
              lastTxn.utr_reference ||
              lastTxn.rrn ||
              lastTxn.epg_txn_id ||
              "";
            if (lastTxnId) {
              setFetchedTransactionId(lastTxnId);
              logger.log("Fallback to last transaction ID in history:", lastTxnId);
            }
          }
        }
      } catch (error) {
        logger.error("Failed to fetch investment details on payment success:", error);
      }
    };
    fetchInvestmentDetails();
  }, [params.investmentId, params.orderId]);

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
        setTabVisibility(true);
        backHandler.remove();
      };
    }, [setTabVisibility, router, isBillPayment, type])
  );

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
    logger.payment("PAYMENT SUCCESS PAGE - Params Received", logData);
  }, []);

  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.95));
  const [pulseAnim] = useState(new Animated.Value(1));
  const [checkmarkAnim] = useState(new Animated.Value(0));
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const [isSharing, setIsSharing] = useState(false);

  const confettiCount = 25;
  const confettiAnims = useRef(
    Array.from({ length: confettiCount }).map(() => ({
      y: new Animated.Value(-100),
      x: new Animated.Value(Math.random() * wp(100) - wp(50)),
      rotate: new Animated.Value(Math.random() * 360),
      color: ["#E5A93C", "#850111", "#ff4444", "#4CAF50", "#007AFF"][Math.floor(Math.random() * 5)],
      size: Math.random() * 8 + 6,
    }))
  ).current;

  const startConfetti = () => {
    confettiAnims.forEach((anim) => {
      Animated.sequence([
        Animated.delay(Math.random() * 800),
        Animated.parallel([
          Animated.timing(anim.y, {
            toValue: hp(100),
            duration: Math.random() * 1500 + 1500,
            useNativeDriver: true,
          }),
          Animated.timing(anim.rotate, {
            toValue: 360,
            duration: Math.random() * 1500 + 1500,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    });
  };

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(checkmarkAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
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
      const transactionId = (Array.isArray(params.txnId) ? params.txnId[0] : params.txnId) || fetchedTransactionId || (Array.isArray(params.orderId) ? params.orderId[0] : params.orderId) || "";
      if (!transactionId) {
        Alert.alert("Error", "Transaction ID is missing");
        setIsSharing(false);
        return;
      }

      const logoBase64 = await loadLogoAsBase64();
      const receiptData: PaymentReceiptData = {
        transactionId: transactionId,
        paymentId: transactionId,
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
          paymentFrequencyName: fetchedInvestment?.paymentFrequencyName || (Array.isArray(params.paymentFrequency) ? params.paymentFrequency[0] : params.paymentFrequency) || "Monthly",
          joiningDate: fetchedInvestment?.joiningDate || (Array.isArray(params.joiningDate) ? params.joiningDate[0] : params.joiningDate) || new Date().toISOString(),
          end_date: fetchedInvestment?.end_date || (Array.isArray(params.maturityDate) ? params.maturityDate[0] : params.maturityDate) || new Date().toISOString(),
          paymentStatus: "Paid",
          total_paid: Number(Array.isArray(params.amount) ? params.amount[0] : params.amount) || 0,
          totalgoldweight: fetchedInvestment?.totalgoldweight || 0,
          current_goldrate: Number(Array.isArray(params.goldRate) ? params.goldRate[0] : params.goldRate) || fetchedInvestment?.current_goldrate || 0,
        },
        logoBase64,
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
      duration: 250,
      useNativeDriver: true,
    }).start(() => router.replace("/(tabs)/home"));
  };

  const handleSavingsPress = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
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
    });
  };

  const handleCopy = async (text: string, type: "txn" | "order") => {
    if (!text) return;
    await Clipboard.setStringAsync(text);
    if (type === "txn") {
      setCopiedTxn(true);
      setTimeout(() => setCopiedTxn(false), 2000);
    } else {
      setCopiedOrder(true);
      setTimeout(() => setCopiedOrder(false), 2000);
    }
  };

  const checkmarkScale = checkmarkAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9ff" />

      {/* Confetti Container */}
      <View style={styles.confettiContainer} pointerEvents="none">
        {confettiAnims.map((anim, i) => (
          <Animated.View
            key={i}
            style={{
              position: "absolute",
              width: anim.size,
              height: anim.size * 1.5,
              backgroundColor: anim.color,
              borderRadius: anim.size / 4,
              left: "50%",
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
              opacity: 0.75,
            }}
          />
        ))}
      </View>

      <ScrollView
        style={{ flex: 1, width: "100%" }}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical={false}
      >
        <Animated.View
          style={[
            styles.content,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* Main Ticket Receipt */}
          <View style={styles.ticketCard}>

            {/* Ticket Header (Green Gradient) */}
            <LinearGradient
              colors={["#0D5A2B", "#16A34A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ticketHeader}
            >
              <View style={styles.iconContainer}>
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <Animated.View style={{ transform: [{ scale: checkmarkScale }] }}>
                    <View style={styles.successIconWrapper}>
                      <Ionicons name="checkmark-sharp" size={rp(28)} color="#16A34A" />
                    </View>
                  </Animated.View>
                </Animated.View>
              </View>

              <Text style={styles.title}>{t("paymentSuccessful") || "Payment Successful"}</Text>
              <Text style={styles.message}>
                {type === "scheme" ? "Your investment has been successfully received." : (t("paymentSuccessMessage") || "Your payment has been processed successfully.")}
              </Text>

              <Text style={styles.amountLabel}>{t("amount").toUpperCase()}</Text>
              <Text style={styles.amountValue}>
                {new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: "INR",
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(Number(Array.isArray(params.amount) ? params.amount[0] : params.amount) || 0)}
              </Text>
            </LinearGradient>

            {/* Ticket Divider with side notches and dashed line */}
            <View style={styles.ticketDivider}>
              <View style={styles.ticketDividerLeft} />
              <View style={styles.dashedLineContainer}>
                {Array.from({ length: 28 }).map((_, i) => (
                  <View key={i} style={styles.dashedSegment} />
                ))}
              </View>
              <View style={styles.ticketDividerRight} />
            </View>

            {/* Ticket Body (Transaction Details) */}
            <View style={styles.ticketBody}>
              <Text style={styles.detailsTitle}>{t("paymentDetails")}</Text>

              <View style={styles.infoList}>

                {/* Customer Name */}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t("customerName") || "Customer Name"}</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>
                    {user?.name || "Customer"}
                  </Text>
                </View>

                {/* Scheme Name */}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t("schemeName") || "Scheme"}</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>
                    {fetchedInvestment?.schemeName || (Array.isArray(params.schemeName) ? params.schemeName[0] : params.schemeName) || (Array.isArray(params.schemeType) ? params.schemeType[0] : params.schemeType) || "Scheme"}
                  </Text>
                </View>

                {/* Account Number */}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t("accountNo") || "Account No"}</Text>
                  <Text style={styles.infoValue}>
                    {fetchedInvestment?.accountNo || (Array.isArray(params.accountNo) ? params.accountNo[0] : params.accountNo) || "N/A"}
                  </Text>
                </View>

                {/* Transaction ID with Copy Micro-Interaction */}
                <View style={styles.infoRowStacked}>
                  <Text style={styles.infoLabel}>{t("transactionId")}</Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.valueCopyRowStacked}
                    onPress={() => handleCopy((Array.isArray(params.txnId) ? params.txnId[0] : params.txnId) || fetchedTransactionId || (Array.isArray(params.orderId) ? params.orderId[0] : params.orderId) || "", "txn")}
                  >
                    <Text style={styles.infoValueCopyStacked}>
                      {(Array.isArray(params.txnId) ? params.txnId[0] : params.txnId) || fetchedTransactionId || (Array.isArray(params.orderId) ? params.orderId[0] : params.orderId) || "N/A"}
                    </Text>
                    <View style={[styles.copyIconWrapper, copiedTxn && styles.copyIconSuccess]}>
                      <Ionicons
                        name={copiedTxn ? "checkmark-sharp" : "copy-outline"}
                        size={14}
                        color={copiedTxn ? "#fff" : theme.colors.primary}
                      />
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Order ID with Copy Micro-Interaction */}
                <View style={styles.infoRowStacked}>
                  <Text style={styles.infoLabel}>{t("orderId")}</Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.valueCopyRowStacked}
                    onPress={() => handleCopy(Array.isArray(params.orderId) ? params.orderId[0] : (params.orderId || ""), "order")}
                  >
                    <Text style={styles.infoValueCopyStacked}>
                      {Array.isArray(params.orderId) ? params.orderId[0] : (params.orderId || "N/A")}
                    </Text>
                    <View style={[styles.copyIconWrapper, copiedOrder && styles.copyIconSuccess]}>
                      <Ionicons
                        name={copiedOrder ? "checkmark-sharp" : "copy-outline"}
                        size={14}
                        color={copiedOrder ? "#fff" : theme.colors.primary}
                      />
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Payment Method */}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t("paymentMethod") || "Payment Method"}</Text>
                  <Text style={styles.infoValue}>
                    {params.paymentMethod || "UPI/Card"}
                  </Text>
                </View>

                {/* Status */}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t("statusLabel") || "Status"}</Text>
                  <Text style={[styles.infoValue, { color: "#16A34A", fontWeight: "700" }]}>
                    {t("statusSuccess") || "SUCCESS"}
                  </Text>
                </View>

                {/* Date & Time */}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t("paymentDate") || "Date & Time"}</Text>
                  <Text style={styles.infoValue}>
                    {new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </Text>
                </View>
              </View>
            </View>

            {/* Jagged edge bottom border */}
            <JaggedBorder />
          </View>

          {/* Buttons Area */}
          <View style={styles.actionsContainer}>
            {/* Share Receipt (Dynamic logic based on parameters) */}
            {!(type === "bill" || type === "booking" || type === "advance_booking") && (
              <TouchableOpacity
                style={[styles.primaryShareButton, isSharing && { opacity: 0.8 }]}
                onPress={handleShareReceipt}
                disabled={isSharing}
              >
                {isSharing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="share-social-outline" size={20} color="#fff" />
                    <Text style={styles.primaryShareText} numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.7}>{t("shareReceipt")}</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {type === "bill" ? (
              <TouchableOpacity
                style={styles.primaryShareButton}
                onPress={() => router.replace("/(app)/bill_payment")}
              >
                <Text style={styles.primaryShareText} numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.7}>{(t("backToBills") || "BACK TO BILLS").toUpperCase()}</Text>
              </TouchableOpacity>
            ) : (type === "booking" || type === "advance_booking") ? (
              <View style={styles.dualButtons}>
                <TouchableOpacity
                  style={styles.primaryShareButton}
                  onPress={() => router.replace("/(tabs)/home/BookingHistory")}
                >
                  <Ionicons name="time-outline" size={20} color="#fff" />
                  <Text style={styles.primaryShareText} numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.7}>{(t("showAdvanceHistory") || "SHOW ADVANCE HISTORY").toUpperCase()}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryHomeButton}
                  onPress={() => router.replace("/(tabs)/home")}
                >
                  <Ionicons name="home-outline" size={20} color={theme.colors.textDark} />
                  <Text style={styles.secondaryHomeText} numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.7}>{(t("backToHome") || "BACK TO HOME").toUpperCase()}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleHomePress}
                  activeOpacity={0.8}
                >
                  <Ionicons name="home-outline" size={20} color={theme.colors.textDark} />
                  <Text style={styles.secondaryButtonText} numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.7}>{t("home")}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleSavingsPress}
                  activeOpacity={0.8}
                >
                  <Ionicons name="wallet-outline" size={20} color="#fff" />
                  <Text style={styles.primaryButtonText} numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.7}>{t("savings")}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

        </Animated.View>
      </ScrollView>

      <RatingModal
        visible={showRating}
        onClose={hideRating}
        appName="Kanisaa Jewellers"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9ff",
  },
  confettiContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 12,
  },
  content: {
    width: "100%",
    paddingHorizontal: 16,
    alignItems: "center",
  },
  ticketCard: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderTopLeftRadius: rb(24),
    borderTopRightRadius: rb(24),
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    shadowColor: "rgba(0, 0, 0, 0.08)",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.8,
    shadowRadius: 32,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
    overflow: "visible",
    marginBottom: 12,
    paddingBottom: 10, // Padding to prevent contents from touching jagged border cuts
  },
  ticketHeader: {
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: wp(5),
    borderTopLeftRadius: rb(24),
    borderTopRightRadius: rb(24),
    overflow: "hidden",
  },
  iconContainer: {
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  successIconWrapper: {
    width: rp(56),
    height: rp(56),
    borderRadius: rb(28),
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "rgba(0,0,0,0.1)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  title: {
    fontSize: rf(18, { minSize: 16, maxSize: 22 }),
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 4,
    textAlign: "center",
    fontFamily: "Inter_700Bold",
  },
  message: {
    fontSize: rf(13, { minSize: 11, maxSize: 15 }),
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: rp(18),
    maxWidth: "85%",
    fontFamily: "Inter_400Regular",
  },
  amountLabel: {
    fontSize: rf(10, { minSize: 8, maxSize: 12 }),
    color: "rgba(255, 255, 255, 0.6)",
    letterSpacing: 1.2,
    marginBottom: 2,
    fontFamily: "Inter_600SemiBold",
  },
  amountValue: {
    fontSize: rf(26, { minSize: 22, maxSize: 30 }),
    fontWeight: "900",
    color: "#ffffff",
    fontFamily: "Inter_800ExtraBold",
  },
  ticketDivider: {
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    overflow: "hidden",
    position: "relative",
  },
  ticketDividerLeft: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#f8f9ff",
    position: "absolute",
    left: -10,
    zIndex: 2,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  ticketDividerRight: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#f8f9ff",
    position: "absolute",
    right: -10,
    zIndex: 2,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  dashedLineContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 15,
  },
  dashedSegment: {
    width: 5,
    height: 1.5,
    backgroundColor: "#e2e8f0",
  },
  ticketBody: {
    paddingTop: 12,
    paddingBottom: 8,
    paddingHorizontal: wp(6),
  },
  detailsTitle: {
    fontSize: rf(15, { minSize: 13, maxSize: 17 }),
    fontWeight: "700",
    color: "#2d3748",
    marginBottom: 10,
    fontFamily: "Inter_600SemiBold",
  },
  infoList: {
    gap: 10,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: rf(13, { minSize: 11, maxSize: 15 }),
    color: "#718096",
    fontFamily: "Inter_400Regular",
  },
  infoValue: {
    fontSize: rf(14, { minSize: 12, maxSize: 16 }),
    color: "#1a202c",
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    textAlign: "right",
    maxWidth: "60%",
  },
  valueCopyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: "65%",
  },
  infoValueCopy: {
    fontSize: rf(14, { minSize: 12, maxSize: 16 }),
    color: "#1a202c",
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    textAlign: "right",
  },
  copyIconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#f0f4f8",
    alignItems: "center",
    justifyContent: "center",
  },
  copyIconSuccess: {
    backgroundColor: "#16c72e",
  },
  actionsContainer: {
    width: "100%",
    gap: hp(1.5),
  },
  primaryShareButton: {
    width: "100%",
    minHeight: rp(48),
    borderRadius: rb(12),
    backgroundColor: "#2e7d32",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: wp(5),
    shadowColor: "#2e7d32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    gap: 8,
  },
  primaryShareText: {
    color: "#ffffff",
    fontSize: rf(15, { minSize: 13, maxSize: 17 }),
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    flexShrink: 1,
  },
  dualButtons: {
    width: "100%",
    gap: hp(1.5),
  },
  secondaryHomeButton: {
    width: "100%",
    minHeight: rp(48),
    borderRadius: rb(12),
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  secondaryHomeText: {
    color: theme.colors.textDark,
    fontSize: rf(15, { minSize: 13, maxSize: 17 }),
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginLeft: 8,
    flexShrink: 1,
  },
  buttonRow: {
    flexDirection: "row",
    width: "100%",
    gap: wp(4),
  },
  primaryButton: {
    flex: 1,
    minHeight: rp(48),
    borderRadius: rb(12),
    backgroundColor: theme.colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    gap: 8,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: rf(15, { minSize: 13, maxSize: 17 }),
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    flexShrink: 1,
  },
  secondaryButton: {
    flex: 1,
    minHeight: rp(48),
    borderRadius: rb(12),
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 8,
  },
  secondaryButtonText: {
    color: theme.colors.textDark,
    fontSize: rf(15, { minSize: 13, maxSize: 17 }),
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    flexShrink: 1,
  },
  jaggedContainer: {
    position: "absolute",
    bottom: -1,
    left: 0,
    right: 0,
    height: 11,
    flexDirection: "row",
    overflow: "hidden",
    zIndex: 10,
  },
  triangle: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 11,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#f8f9ff", // Triangle body is background color, biting into white card
  },
  infoRowStacked: {
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    gap: 4,
    width: "100%",
  },
  valueCopyRowStacked: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    alignSelf: "flex-end",
    gap: 8,
    width: "100%",
  },
  infoValueCopyStacked: {
    fontSize: rf(14, { minSize: 12, maxSize: 16 }),
    color: "#1a202c",
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    textAlign: "right",
    flexShrink: 1,
  },
});
