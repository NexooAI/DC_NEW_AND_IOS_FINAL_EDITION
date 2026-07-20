import React, { useEffect, useState, useCallback, useRef } from "react";
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
  Platform,
  Linking,
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

interface DeclineDiagnosis {
  reasonKey: string;
  detailsKey: string;
  resolutionKey: string;
  icon: string;
}

const diagnoseDecline = (msg: string): DeclineDiagnosis | null => {
  if (!msg) return null;
  const normalized = msg.toLowerCase();

  // 1. Restricted Card / Code 62
  if (
    normalized.includes("restricted card") || 
    normalized.includes("restricted") || 
    normalized.includes("code 62") || 
    normalized.includes("code \"62\"") || 
    normalized.includes("na-62") || 
    normalized.includes("response 62") ||
    /(\b62\b)/.test(normalized)
  ) {
    return {
      reasonKey: "decline_restricted_reason",
      detailsKey: "decline_restricted_details",
      resolutionKey: "decline_restricted_resolution",
      icon: "lock-closed-outline"
    };
  }

  // 2. Insufficient Funds / Code 51
  if (
    normalized.includes("insufficient funds") || 
    normalized.includes("insufficient balance") || 
    normalized.includes("insufficient") || 
    normalized.includes("code 51") || 
    normalized.includes("na-51") ||
    /(\b51\b)/.test(normalized)
  ) {
    return {
      reasonKey: "decline_insufficient_reason",
      detailsKey: "decline_insufficient_details",
      resolutionKey: "decline_insufficient_resolution",
      icon: "wallet-outline"
    };
  }

  // 3. Do Not Honor / Code 05
  if (
    normalized.includes("do not honor") || 
    normalized.includes("do_not_honor") || 
    normalized.includes("code 05") || 
    normalized.includes("na-05") ||
    /(\b05\b)/.test(normalized)
  ) {
    return {
      reasonKey: "decline_do_not_honor_reason",
      detailsKey: "decline_do_not_honor_details",
      resolutionKey: "decline_do_not_honor_resolution",
      icon: "alert-circle-outline"
    };
  }

  // 4. Expired Card / Code 54
  if (
    normalized.includes("expired") || 
    normalized.includes("code 54") || 
    normalized.includes("na-54") ||
    /(\b54\b)/.test(normalized)
  ) {
    return {
      reasonKey: "decline_expired_reason",
      detailsKey: "decline_expired_details",
      resolutionKey: "decline_expired_resolution",
      icon: "calendar-outline"
    };
  }

  // 5. Incorrect Details / CVV / Code 55 / 14
  if (
    normalized.includes("cvv") || 
    normalized.includes("invalid pin") || 
    normalized.includes("incorrect otp") || 
    normalized.includes("code 55") || 
    normalized.includes("code 14")
  ) {
    return {
      reasonKey: "decline_incorrect_reason",
      detailsKey: "decline_incorrect_details",
      resolutionKey: "decline_incorrect_resolution",
      icon: "keypad-outline"
    };
  }

  // 6. Network/Timeout / Code 91 / 96
  if (
    normalized.includes("timeout") || 
    normalized.includes("timed out") || 
    normalized.includes("network") || 
    normalized.includes("issuer unavailable") || 
    normalized.includes("system error") ||
    normalized.includes("code 91") ||
    normalized.includes("code 96")
  ) {
    return {
      reasonKey: "decline_timeout_reason",
      detailsKey: "decline_timeout_details",
      resolutionKey: "decline_timeout_resolution",
      icon: "wifi-outline"
    };
  }

  // 7. Net Banking: User Cancelled
  if (
    normalized.includes("user cancelled") || 
    normalized.includes("cancelled by user") || 
    normalized.includes("cancelled by customer") || 
    normalized.includes("abandoned") || 
    normalized.includes("transaction cancelled") ||
    normalized.includes("cancel")
  ) {
    return {
      reasonKey: "decline_cancelled_reason",
      detailsKey: "decline_cancelled_details",
      resolutionKey: "decline_cancelled_resolution",
      icon: "close-circle-outline"
    };
  }

  // 8. Net Banking: Authentication Failed
  if (
    normalized.includes("auth failed") || 
    normalized.includes("authentication failed") || 
    normalized.includes("invalid credentials") || 
    normalized.includes("login failed") ||
    normalized.includes("invalid customer")
  ) {
    return {
      reasonKey: "decline_auth_failed_reason",
      detailsKey: "decline_auth_failed_details",
      resolutionKey: "decline_auth_failed_resolution",
      icon: "key-outline"
    };
  }

  // 9. Net Banking: Account Dormant
  if (
    normalized.includes("dormant") || 
    normalized.includes("inactive account") || 
    normalized.includes("account inactive")
  ) {
    return {
      reasonKey: "decline_dormant_reason",
      detailsKey: "decline_dormant_details",
      resolutionKey: "decline_dormant_resolution",
      icon: "ban-outline"
    };
  }

  // 10. Amount Less Than Minimum Configured
  if (
    normalized.includes("amount less than") ||
    normalized.includes("minimum amount configured") ||
    normalized.includes("amount_less_than")
  ) {
    return {
      reasonKey: "decline_min_amount_reason",
      detailsKey: "decline_min_amount_details",
      resolutionKey: "decline_min_amount_resolution",
      icon: "alert-circle-outline"
    };
  }

  return null;
};

export default function PaymentFailure() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const router = useRouter();
  const { user, setTabVisibility, language } = useGlobalStore();
  const insets = useSafeAreaInsets();

  const type = (Array.isArray(params.type) ? params.type[0] : params.type) || "";
  const isBillPayment = type === "bill";
  const userId = Array.isArray(params.userId) ? params.userId[0] : (params.userId || user?.id?.toString() || "");
  const investmentId = Array.isArray(params.investmentId) ? params.investmentId[0] : (params.investmentId || "");

  const paymentMethod = (Array.isArray(params.paymentMethod) ? params.paymentMethod[0] : params.paymentMethod) || "";
  const errorMessage = (Array.isArray(params.message) ? params.message[0] : (params.message || t("paymentFailedMessage"))) || "";
  const diagnosis = diagnoseDecline(errorMessage);

  const localizedReason = diagnosis ? (t(diagnosis.reasonKey as any) || "") : "";
  const localizedDetails = diagnosis ? (t(diagnosis.detailsKey as any) || "") : "";
  const localizedResolution = diagnosis ? (t(diagnosis.resolutionKey as any) || "") : "";
  const localizedRecommendedTitle = t("decline_recommended_action") || "Recommended Action:";

  const [copiedTxn, setCopiedTxn] = useState(false);
  const [copiedOrder, setCopiedOrder] = useState(false);

  const showUpiNotice = 
    paymentMethod.toUpperCase().includes("UPI") ||
    paymentMethod.toUpperCase().includes("COLLECT") ||
    errorMessage.toUpperCase().includes("UPI") ||
    errorMessage.toUpperCase().includes("VPA") ||
    errorMessage.toUpperCase().includes("COLLECT") ||
    errorMessage.toUpperCase().includes("NPCI");

  useEffect(() => {
    if (isBillPayment && userId) {
      const fetchBills = async () => {
        try {
          const { billsAPI } = await import("@/services/api");
          await billsAPI.getUserBills(userId);
        } catch (err) {
          logger.error("Failed to fetch user bills on payment failure:", err);
        }
      };
      fetchBills();
    }
  }, [isBillPayment, userId]);

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
    }, [setTabVisibility, router, isBillPayment, type, investmentId])
  );

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
    logger.payment("PAYMENT FAILURE PAGE - Params Received", logData);
  }, []);

  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.95));
  const [pulseAnim] = useState(new Animated.Value(1));
  const [iconAnim] = useState(new Animated.Value(0));

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
      Animated.timing(iconAnim, {
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
  }, []);

  const handleHomePress = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      router.replace("/(tabs)/home");
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

  const handleSupportPress = async () => {
    const whatsappUrl = `whatsapp://send?phone=${theme.constants.whatsapp}&text=Hi, I faced a payment issue with Order ID: ${params.orderId || "N/A"}`;
    const fallbackUrl = `https://wa.me/${theme.constants.whatsapp}`;
    try {
      const supported = await Linking.canOpenURL(whatsappUrl);
      if (supported) {
        await Linking.openURL(whatsappUrl);
      } else {
        await Linking.openURL(fallbackUrl);
      }
    } catch (error) {
      logger.error("Error opening WhatsApp support:", error);
      Alert.alert("Support", "Please call us at " + theme.constants.mobile);
    }
  };

  const handleRetry = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      try {
        const paymentSession = useGlobalStore.getState().getCurrentPaymentSession();

        if (paymentSession?.userDetails) {
          logger.log("Retrying payment - using payment session from global store");

          const userDetailsForNav = {
            ...paymentSession.userDetails,
            amount: paymentSession.amount || params.amount,
            orderId: undefined,
          };

          const navigationParams: any = {
            pathname: "/(tabs)/home/paymentNewOverView",
            params: {
              amount: String(paymentSession.amount || params.amount || 0),
              userDetails: JSON.stringify(userDetailsForNav),
            },
          };

          const userDetails = paymentSession.userDetails as any;

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
          if (userDetails.noOfIns) {
            navigationParams.params.noOfIns = String(userDetails.noOfIns);
          }
          if (userDetails.totalPaid) {
            navigationParams.params.totalPaid = String(userDetails.totalPaid);
          }
          if (userDetails.paidPaymentCount) {
            navigationParams.params.paidPaymentCount = String(userDetails.paidPaymentCount);
          }
          if (userDetails.maturityDate) {
            navigationParams.params.maturityDate = String(userDetails.maturityDate);
          }
          if (userDetails.joiningDate) {
            navigationParams.params.joiningDate = String(userDetails.joiningDate);
          }
          if (userDetails.schemeName) {
            navigationParams.params.schemeName = String(userDetails.schemeName);
          }
          navigationParams.params.source = userDetails.source || "payment_retry";

          InteractionManager.runAfterInteractions(() => {
            try {
              router.replace(navigationParams);
              logger.log("Navigated to paymentNewOverView for retry", {
                amount: navigationParams.params.amount,
                hasUserDetails: !!navigationParams.params.userDetails,
              });
            } catch (navError) {
              logger.error("Error navigating to paymentNewOverView:", navError);
              router.back();
            }
          });
        } else {
          logger.warn("No payment session found for retry, navigating back");
          router.back();
        }
      } catch (error) {
        logger.error("Error in handleRetry:", error);
        router.back();
      }
    });
  };

  const iconScale = iconAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9ff" />
      
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
            
            {/* Ticket Header (Red Gradient) */}
            <LinearGradient
              colors={["#7F1D1D", "#DC2626"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ticketHeader}
            >
              <View style={styles.iconContainer}>
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <Animated.View style={{ transform: [{ scale: iconScale }] }}>
                    <View style={styles.failureIconWrapper}>
                      <Ionicons name="close-sharp" size={rp(28)} color="#DC2626" />
                    </View>
                  </Animated.View>
                </Animated.View>
              </View>

              <Text style={styles.title}>{t("paymentFailed") || "Payment Failed"}</Text>
              <Text style={styles.message}>
                {(Array.isArray(params.message) ? params.message[0] : params.message) || "The transaction was declined by the bank."}
              </Text>

              {/* UPI Notice Box (Within Ticket Header) */}
              {showUpiNotice && (
                <View style={styles.upiNoticeBox}>
                  <Ionicons name="warning-outline" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={styles.upiNoticeText}>
                    {t("npciUpiNotice") || "UPI transactions might take up to 24-48 hours to update if debited."}
                  </Text>
                </View>
              )}

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

            {/* Ticket Divider with notches */}
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

                {/* Transaction ID with Copy Micro-Interaction */}
                <View style={styles.infoRowStacked}>
                  <Text style={styles.infoLabel}>{t("transactionId")}</Text>
                  <TouchableOpacity 
                    activeOpacity={0.7}
                    style={styles.valueCopyRowStacked}
                    onPress={() => handleCopy((Array.isArray(params.txnId) ? params.txnId[0] : params.txnId) || (Array.isArray(params.orderId) ? params.orderId[0] : params.orderId) || "", "txn")}
                  >
                    <Text style={styles.infoValueCopyStacked}>
                      {(Array.isArray(params.txnId) ? params.txnId[0] : params.txnId) || (Array.isArray(params.orderId) ? params.orderId[0] : params.orderId) || "N/A"}
                    </Text>
                    <View style={[styles.copyIconWrapper, copiedTxn && styles.copyIconSuccess]}>
                      <Ionicons 
                        name={copiedTxn ? "checkmark-sharp" : "copy-outline"} 
                        size={14} 
                        color={copiedTxn ? "#fff" : theme.colors.error} 
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
                        color={copiedOrder ? "#fff" : theme.colors.error} 
                      />
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Payment Method */}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t("paymentMethod") || "Payment Method"}</Text>
                  <Text style={styles.infoValue}>
                    {(Array.isArray(params.paymentMethod) ? params.paymentMethod[0] : params.paymentMethod) || "UPI/Card"}
                  </Text>
                </View>

                {/* Status Code */}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t("statusLabel") || "Status"}</Text>
                  <Text style={[styles.infoValue, { color: theme.colors.error, fontWeight: "700" }]}>
                    {(Array.isArray(params.status) ? params.status[0] : params.status) || "FAILED"}
                  </Text>
                </View>

                {/* Failure Reason */}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t("failureReason") || "Reason"}</Text>
                  <Text style={[styles.infoValue, { color: theme.colors.error, fontWeight: "600" }]} numberOfLines={1}>
                    {localizedReason || errorMessage}
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

          {/* Action Buttons Container */}
          <View style={styles.actionsContainer}>
            {/* WhatsApp/Call Support */}
            <TouchableOpacity
              style={styles.supportButton}
              onPress={handleSupportPress}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-whatsapp" size={20} color="#fff" />
              <Text style={styles.supportButtonText} numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.7}>{t("contactSupport") || "Contact Support"}</Text>
            </TouchableOpacity>

            <View style={styles.buttonRow}>
              {isBillPayment ? (
                <>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => router.replace("/(app)/bill_payment")}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="receipt-outline" size={20} color={theme.colors.textDark} />
                    <Text style={styles.secondaryButtonText} numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.7}>{(t("backToBills") || "Bills").toUpperCase()}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={handleHomePress}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="home-outline" size={20} color={theme.colors.textDark} />
                    <Text style={styles.secondaryButtonText} numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.7}>{t("home").toUpperCase()}</Text>
                  </TouchableOpacity>
                </>
              ) : (type === "booking" || type === "advance_booking") ? (
                <>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => router.replace("/(tabs)/home/BookingHistory")}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="time-outline" size={20} color={theme.colors.textDark} />
                    <Text style={styles.secondaryButtonText} numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.7}>{(t("bookingHistory") || "History").toUpperCase()}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={handleHomePress}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="home-outline" size={20} color={theme.colors.textDark} />
                    <Text style={styles.secondaryButtonText} numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.7}>{t("home").toUpperCase()}</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
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
                    onPress={handleRetry}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="refresh-outline" size={20} color="#fff" />
                    <Text style={styles.primaryButtonText} numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.7}>{t("retry")}</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

        </Animated.View>
      </ScrollView>
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
  failureIconWrapper: {
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
    marginBottom: 10,
    lineHeight: rp(18),
    maxWidth: "85%",
    fontFamily: "Inter_400Regular",
  },
  upiNoticeBox: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1,
    borderRadius: rb(12),
    padding: rp(8),
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    width: "100%",
  },
  upiNoticeText: {
    color: "#ffffff",
    fontSize: rf(11, { minSize: 9, maxSize: 13 }),
    flex: 1,
    lineHeight: rp(15),
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
    backgroundColor: theme.colors.error,
  },
  actionsContainer: {
    width: "100%",
    gap: hp(1.5),
  },
  supportButton: {
    width: "100%",
    minHeight: rp(48),
    borderRadius: rb(12),
    backgroundColor: "#25d366",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: wp(5),
    shadowColor: "#25d366",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    gap: 8,
  },
  supportButtonText: {
    color: "#ffffff",
    fontSize: rf(15, { minSize: 13, maxSize: 17 }),
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
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
    backgroundColor: theme.colors.error,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: theme.colors.error,
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
  diagnosisCard: {
    backgroundColor: "#FEF2F2", // soft red
    borderRadius: rb(12),
    borderWidth: 1,
    borderColor: "#FEE2E2",
    padding: wp(4),
    marginTop: 15,
  },
  diagnosisHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  diagnosisTitle: {
    fontSize: rf(14, { minSize: 12, maxSize: 16 }),
    fontWeight: "700",
    color: "#991B1B", // dark red
    fontFamily: "Inter_600SemiBold",
  },
  diagnosisDescription: {
    fontSize: rf(12, { minSize: 10, maxSize: 14 }),
    color: "#7F1D1D", // medium dark red
    lineHeight: rf(17),
    fontFamily: "Inter_400Regular",
  },
  diagnosisDivider: {
    height: 1,
    backgroundColor: "#FEE2E2",
    marginVertical: 10,
  },
  resolutionContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  resolutionTitle: {
    fontSize: rf(12, { minSize: 10, maxSize: 14 }),
    fontWeight: "700",
    color: "#92400E", // dark amber
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  resolutionText: {
    fontSize: rf(12, { minSize: 10, maxSize: 14 }),
    color: "#78350F", // medium dark amber
    lineHeight: rf(17),
    fontFamily: "Inter_400Regular",
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
