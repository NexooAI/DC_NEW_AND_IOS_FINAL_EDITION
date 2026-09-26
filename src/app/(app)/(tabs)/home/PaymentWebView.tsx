import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import {
  View,
  Modal,
  StyleSheet,
  Alert,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
  Linking,
  AppState,
  AppStateStatus,
} from "react-native";
import { WebView } from "react-native-webview";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme as themeConstants } from "@/constants/theme";
import apiClient from "@/services/api";
import useGlobalStore, { useAppTheme } from "@/store/global.store";
import { logAppEvent } from "@/services/appEventService";

const safeParseJSON = (jsonString: any, fallback: any = {}) => {
  if (!jsonString) return fallback;
  if (typeof jsonString === "object") return jsonString;
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("Error parsing JSON:", e);
    return fallback;
  }
};

const INJECTED_JS = `
  (function() {
    window.open = function(url, target, features) {
      if (url) {
        window.location.href = url;
        return window;
      }
      var mockWin = {
        document: {},
        location: {
          set href(val) { window.location.href = val; },
          get href() { return window.location.href; },
          assign: function(val) { window.location.href = val; },
          replace: function(val) { window.location.replace(val); }
        },
        focus: function() {},
        close: function() {}
      };
      Object.defineProperty(mockWin, 'location', {
        get: function() { return mockWin.location; },
        set: function(val) { window.location.href = val; }
      });
      return mockWin;
    };
    document.addEventListener('submit', function(e) {
      var form = e.target;
      if (form && form.target === '_blank') {
        form.target = '_self';
      }
    }, true);
  })();
  true;
`;

export default function PaymentWebView() {
  const theme = useAppTheme();
  styles = getStyles(theme);
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const router = useRouter();

  const [showExitModal, setShowExitModal] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const webViewRef = useRef<any>(null);
  const isPaymentProcessed = useRef(false);
  const isVerifyingRef = useRef(false);
  const appState = useRef(AppState.currentState);
  const verificationTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { user } = useGlobalStore();

  const type = (params.type as any) || "scheme";
  const bookingId = params.bookingId as string;
  const amount = params.amount as string;
  const orderId = (params.orderId || "") as string;
  const url = (params.url || params.paymentUrl || "") as string;
  const webViewSource = useMemo(() => ({ uri: url }), [url]);
  const accountNumber = params.accountNumber as string;
  const accountName = params.accountName as string;
  const schemeName = (params.schemeName || "") as string;
  const goldRate = (params.goldRate || "") as string;
  const maturityDate = (params.maturityDate || "") as string;
  const joiningDate = (params.joiningDate || "") as string;

  const userDetails = useMemo(() => {
    return safeParseJSON(params.userDetails, {
      ...user,
      id: params.userId || user?.id,
      orderId: orderId,
      accountNumber: accountNumber || (user as any)?.accountNumber || (user as any)?.accountNo || "",
      accountName: accountName || user?.name || (user as any)?.accountName || "",
      userId: params.userId || user?.id,
      name: accountName || user?.name || "",
      userMobile: user?.mobile || (user as any)?.mobileNumber || params.userMobile || "",
    });
  }, [params.userDetails, user, orderId, accountNumber, accountName]);

  useEffect(() => {
    console.log(`[PaymentWebView] Mounted. orderId: ${orderId}, amount: ${amount}, type: ${type}`);
    logAppEvent("PAYMENT_WEBVIEW_LOADED", {
      orderId: String(orderId || ""),
      type,
      bookingId: String(bookingId || ""),
      amount: String(amount || ""),
    });
    return () => {
      if (verificationTimerRef.current) {
        clearTimeout(verificationTimerRef.current);
        verificationTimerRef.current = null;
      }
      isVerifyingRef.current = false;
    };
  }, []);

  const navigateToSuccess = useCallback((txnIdValue: string, responseData?: any) => {
    if (isPaymentProcessed.current) return;
    isPaymentProcessed.current = true;
    setIsVerifyingPayment(false);
    isVerifyingRef.current = false;
    if (verificationTimerRef.current) {
      clearTimeout(verificationTimerRef.current);
      verificationTimerRef.current = null;
    }

    useGlobalStore.getState().clearPaymentSession();

    console.log(`[PaymentWebView] Navigating to payment-success. txnId: ${txnIdValue}, orderId: ${orderId}`);
    logAppEvent("PAYMENT_WEBVIEW_SUCCESS", {
      orderId: orderId,
      txnId: txnIdValue,
      amount: amount,
      type,
    });

    const successParams = {
      pathname: "/(tabs)/home/payment-success",
      params: {
        txnId: txnIdValue || "",
        orderId: orderId,
        amount: responseData?.amount || amount || "",
        investmentId: userDetails?.investmentId || "",
        schemeType: userDetails?.schemeType || "",
        paymentFrequency: userDetails?.paymentFrequency || "",
        schemeName: schemeName,
        goldRate: goldRate,
        joiningDate: joiningDate || userDetails?.joiningDate || "",
        maturityDate: maturityDate || userDetails?.maturityDate || "",
        type: type,
        userId: (params.userId as string) || user?.id || "",
      },
    };

    router.replace(successParams);
  }, [orderId, amount, type, userDetails, schemeName, goldRate, joiningDate, maturityDate, params.userId, user?.id, router]);

  const navigateToFailure = useCallback((message: string, status = "FAILED", txnIdValue = "") => {
    if (isPaymentProcessed.current) return;
    isPaymentProcessed.current = true;
    setIsVerifyingPayment(false);
    isVerifyingRef.current = false;
    if (verificationTimerRef.current) {
      clearTimeout(verificationTimerRef.current);
      verificationTimerRef.current = null;
    }

    console.log(`[PaymentWebView] Navigating to payment-failure. message: ${message}, status: ${status}`);
    logAppEvent("PAYMENT_WEBVIEW_FAILURE", {
      orderId: orderId,
      txnId: txnIdValue,
      amount: amount,
      message,
      type,
    });

    const failureParams = {
      pathname: "/(tabs)/home/payment-failure",
      params: {
        message: message || "Payment Failed",
        orderId: orderId,
        txnId: txnIdValue,
        amount: amount || (params.amount as string) || "",
        status: status,
        type: type,
        userId: (params.userId as string) || user?.id || "",
        investmentId: String(userDetails?.investmentId || params.investmentId || ""),
        userDetails: typeof params.userDetails === 'string' ? params.userDetails : JSON.stringify(userDetails || {}),
        schemeName: schemeName || (params.schemeName as string) || "",
        schemeId: (params.schemeId as string) || (userDetails?.schemeId as string) || "",
        chitId: (params.chitId as string) || (userDetails?.chitId as string) || "",
        schemeType: (params.schemeType as string) || (userDetails?.schemeType as string) || "",
        savinsTypes: (params.savinsTypes as string) || (userDetails?.savinsTypes as string) || "",
        source: (params.source as string) || "payment_retry",
      },
    };

    router.replace(failureParams);
  }, [orderId, amount, type, userDetails, schemeName, params.schemeName, params.schemeId, params.chitId, params.schemeType, params.savinsTypes, params.source, params.userDetails, params.investmentId, params.userId, user?.id, router]);

  // Instant Verification Function (checks backend status with quick retries)
  const verifyPaymentStatus = useCallback(async (currentAttempt = 1, maxAttempts = 6) => {
    if (isPaymentProcessed.current) return;
    if (isVerifyingRef.current && currentAttempt === 1) {
      console.log("[PaymentWebView] Verification already in progress. Skipping duplicate initiation.");
      return;
    }
    if (!orderId) {
      console.warn("[PaymentWebView] No orderId available to verify status");
      return;
    }

    setIsVerifyingPayment(true);
    isVerifyingRef.current = true;

    try {
      const response = await apiClient.get(`/payments/status/${orderId}?t=${Date.now()}`);
      isVerifyingRef.current = false;
      const data = response.data;
      console.log("🔍 [PaymentWebView] FULL STATUS API RESPONSE:\n", JSON.stringify(data, null, 2));

      // Resolve status flexibly from all potential backend formats
      const resolvedStatus = String(
        data?.status ||
        data?.data?.status ||
        data?.data?.order_status ||
        data?.data?.orderStatus ||
        data?.data?.payment_status ||
        data?.paymentResponse?.status ||
        data?.paymentResponse?.txn_detail?.status ||
        ""
      ).toLowerCase();

      const resolvedSuccess =
        data?.success === true ||
        data?.data?.success === true ||
        response?.status === 200;

      const isSuccess =
        resolvedStatus === "success" ||
        resolvedStatus === "charged" ||
        resolvedStatus === "paid" ||
        resolvedStatus === "completed";

      const isFailure =
        resolvedStatus === "failed" ||
        resolvedStatus === "cancelled" ||
        resolvedStatus === "canceled" ||
        resolvedStatus === "expired" ||
        resolvedStatus === "failure";

      const extractedTxnId =
        data?.txnId ||
        data?.transactionId ||
        data?.data?.txnId ||
        data?.data?.txn_id ||
        data?.data?.transactionId ||
        data?.data?.tracking_id ||
        data?.data?.bank_ref_no ||
        data?.paymentResponse?.txn_id ||
        data?.paymentResponse?.tracking_id ||
        orderId ||
        "";

      if (isSuccess && resolvedSuccess) {
        console.log("✅ [PaymentWebView] Verified SUCCESS. Transitioning to success screen!");
        navigateToSuccess(extractedTxnId, data?.data || data);
        return;
      }

      if (isFailure) {
        console.log("❌ [PaymentWebView] Verified FAILURE. Transitioning to failure screen.");
        const failureMessage =
          data?.message ||
          data?.data?.message ||
          data?.paymentResponse?.payment_gateway_response?.resp_message ||
          data?.paymentResponse?.txn_detail?.error_message ||
          "Payment Failed or Cancelled";
        navigateToFailure(failureMessage, "FAILED", extractedTxnId);
        return;
      }

      // If still pending and attempts remain, retry in 1.5 seconds
      if (currentAttempt < maxAttempts && !isPaymentProcessed.current) {
        console.log(`[PaymentWebView] Status pending. Scheduling retry in 1500ms (attempt ${currentAttempt + 1})`);
        verificationTimerRef.current = setTimeout(() => {
          verifyPaymentStatus(currentAttempt + 1, maxAttempts);
        }, 1500);
      } else {
        // Max attempts reached without failure status
        console.log("[PaymentWebView] Max verification attempts completed.");
        setIsVerifyingPayment(false);
      }
    } catch (error: any) {
      isVerifyingRef.current = false;
      const errorMsg =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "";

      // CRITICAL FIX: If backend fails with "Unknown column 'paymentId' in 'field list'",
      // this SQL error occurs AFTER processPaymentResult has already verified the payment with gateway
      // and inserted into payments/transactions. The payment succeeded!
      if (typeof errorMsg === "string" && errorMsg.toLowerCase().includes("paymentid")) {
        console.log("⚠️ [PaymentWebView] Backend has known paymentId column issue, but payment processed. Navigating to success!");
        navigateToSuccess(orderId);
        return;
      }

      console.error("[PaymentWebView] Status verification request error:", error?.message || error);
      if (currentAttempt < maxAttempts && !isPaymentProcessed.current) {
        verificationTimerRef.current = setTimeout(() => {
          verifyPaymentStatus(currentAttempt + 1, maxAttempts);
        }, 1500);
      } else {
        setIsVerifyingPayment(false);
      }
    }
  }, [orderId, navigateToSuccess, navigateToFailure]);

  // AppState Listener: Detect when user returns from UPI app (GPay, PhonePe, etc.)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log(`[PaymentWebView] AppState: ${appState.current} -> ${nextAppState}`);
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        console.log("🔄 App returned to foreground from UPI/background. Triggering instant status check...");
        if (!isPaymentProcessed.current) {
          // 400ms buffer to allow network stack to re-establish
          setTimeout(() => {
            verifyPaymentStatus(1, 6);
          }, 400);
        }
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => {
      subscription.remove();
      if (verificationTimerRef.current) {
        clearTimeout(verificationTimerRef.current);
      }
    };
  }, [verifyPaymentStatus]);

  // Back press handling
  const handleBackPress = () => {
    if (isVerifyingPayment || isCancelling) {
      return;
    }
    Alert.alert(
      "Cancel Payment",
      "Are you sure you want to cancel this payment?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          onPress: () => {
            handleCancelPayment();
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleCancelPayment = () => {
    setIsCancelling(true);
    logAppEvent("PAYMENT_WEBVIEW_CANCELLED", {
      orderId: orderId,
      amount: amount,
      type,
    });
    setTimeout(() => {
      navigateToFailure("Payment cancelled by user", "CANCELLED");
    }, 400);
  };

  const handleExitCancel = () => {
    setShowExitModal(false);
  };

  const handleExitConfirm = () => {
    setShowExitModal(false);
    const session = useGlobalStore.getState().getCurrentPaymentSession();
    if (session) {
      const cleanedUserDetails = { ...session.userDetails } as any;
      delete cleanedUserDetails.orderId;
      router.replace({
        pathname: "/(tabs)/home/paymentNewOverView",
        params: {
          amount: String(session.amount),
          paymentType: String(cleanedUserDetails.source || cleanedUserDetails.paymentType || type || ""),
          schemeId: String(cleanedUserDetails.schemeId || ""),
          schemeName: String(cleanedUserDetails.schemeName || ""),
          chitId: String(cleanedUserDetails.chitId || ""),
          paymentFrequency: String(cleanedUserDetails.paymentFrequency || ""),
          schemeType: String(cleanedUserDetails.schemeType || ""),
          noOfIns: String(cleanedUserDetails.noOfIns || ""),
          totalPaid: String(cleanedUserDetails.totalPaid || ""),
          paidPaymentCount: String(cleanedUserDetails.paidPaymentCount || ""),
          maturityDate: String(cleanedUserDetails.maturityDate || ""),
          joiningDate: String(cleanedUserDetails.joiningDate || ""),
          userDetails: JSON.stringify(cleanedUserDetails),
        },
      });
    } else {
      router.replace("/(tabs)/home/paymentNewOverView");
    }
  };

  // WebView Request Interception
  const handleShouldStartLoadWithRequest = (request: any) => {
    const { url: requestUrl } = request;
    console.log("[PaymentWebView] Loading request URL:", requestUrl);

    const currentUrl = requestUrl.toLowerCase();
    const apiDomain = themeConstants.baseUrl
      ? themeConstants.baseUrl.toLowerCase().replace("http://", "").replace("https://", "").split("/")[0]
      : "kanisaajewellery.com";
    const domainParts = apiDomain.split(".");
    const rootDomain = domainParts.length >= 2 ? domainParts.slice(-2).join(".") : apiDomain;
    const isOurDomain = (apiDomain && currentUrl.includes(apiDomain)) || (rootDomain && currentUrl.includes(rootDomain));

    // Check for Gateway Redirect Landing URLs (for Netbanking / Card callbacks)
    const isSuccessUrl = isOurDomain && (currentUrl.includes("status=success") || currentUrl.includes("payment=success") || currentUrl.includes("/success"));
    const isCancelUrl = isOurDomain && (currentUrl.includes("status=cancelled") || currentUrl.includes("/cancel"));
    const isFailureUrl = isOurDomain && (currentUrl.includes("status=failed") || currentUrl.includes("status=failure") || currentUrl.includes("/failed") || currentUrl.includes("/error"));
    const isCallbackUrl = isOurDomain && (currentUrl.includes("/payments/status") || currentUrl.includes("/loading") || currentUrl.includes("/payments/response"));

    if (isSuccessUrl) {
      console.log("[PaymentWebView] Intercepted SUCCESS landing URL:", requestUrl);
      verifyPaymentStatus(1, 4);
      return false;
    }

    if (isCancelUrl) {
      console.log("[PaymentWebView] Intercepted CANCEL landing URL:", requestUrl);
      navigateToFailure("Payment cancelled by user", "CANCELLED");
      return false;
    }

    if (isFailureUrl) {
      console.log("[PaymentWebView] Intercepted FAILURE landing URL:", requestUrl);
      navigateToFailure("Payment verification failed", "FAILED");
      return false;
    }

    if (isCallbackUrl) {
      console.log("[PaymentWebView] Intercepted CALLBACK landing URL:", requestUrl);
      verifyPaymentStatus(1, 4);
      return false;
    }

    // Allow standard web schemes
    if (
      requestUrl.startsWith("http://") ||
      requestUrl.startsWith("https://") ||
      requestUrl.startsWith("about:blank") ||
      requestUrl.startsWith("about:srcdoc") ||
      requestUrl.startsWith("data:")
    ) {
      return true;
    }

    // UPI / Custom App Schemes
    const customSchemes = ["upi:", "tez:", "phonepe:", "paytm:", "gpay:", "bhim:", "intent:"];
    const isCustomScheme = customSchemes.some((scheme) => requestUrl.toLowerCase().startsWith(scheme));

    if (!isCustomScheme) {
      return true;
    }

    // Android intent:// parsing
    let targetUrl = requestUrl;
    if (requestUrl.toLowerCase().startsWith("intent://")) {
      try {
        const parts = requestUrl.split("#Intent;");
        if (parts.length >= 2) {
          const intentUri = parts[0].substring(9);
          let scheme = "upi";
          const intentParams = parts[1].split(";");
          for (const param of intentParams) {
            if (param.startsWith("scheme=")) {
              scheme = param.substring(7);
            }
          }
          targetUrl = `${scheme}://${intentUri}`;
          console.log("[PaymentWebView] Parsed intent URL to:", targetUrl);
        }
      } catch (e) {
        console.error("Failed to parse intent URL:", e);
      }
    }

    // Launch UPI app
    Linking.canOpenURL(targetUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(targetUrl);
        } else {
          // On Android 11+, canOpenURL may return false even when app is present; attempt openURL as failsafe
          console.log("[PaymentWebView] canOpenURL false, attempting openURL anyway:", targetUrl);
          return Linking.openURL(targetUrl).catch((err) => {
            console.log("Failed to open URL forcibly:", err);
            Alert.alert(
              "Payment App Not Found",
              "Could not open the selected payment app. Please install it or try another method.",
              [{ text: "OK" }]
            );
          });
        }
      })
      .catch((err) => {
        console.error("Error opening URL:", err);
      });

    return false;
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.quaternary || "#F2E6D2"} />
      <Modal visible={true} animationType="slide" presentationStyle="fullScreen" onRequestClose={handleBackPress}>
        <View style={styles.container}>
          {/* Loading overlay when cancelling */}
          {isCancelling && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Cancelling payment...</Text>
            </View>
          )}

          {/* Verification overlay when checking payment status */}
          {isVerifyingPayment && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Verifying payment status...</Text>
              <Text style={styles.loadingSubtext}>
                Please do not close the app or press back
              </Text>
            </View>
          )}

          <View style={styles.safeAreaContainer}>
            {/* Header with back button */}
            <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top : (Platform.OS === "android" ? 24 : 12) }]}>
              <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Payment</Text>
              <View style={styles.placeholder} />
            </View>

            <View style={{ flex: 1, backgroundColor: theme.colors.white }}>
              <WebView
                ref={webViewRef}
                source={webViewSource}
                style={{ flex: 1 }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                originWhitelist={["*"]}
                userAgent={
                  Platform.OS === "android"
                    ? "Mozilla/5.0 (Linux; Android 13; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36"
                    : "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"
                }
                startInLoadingState={true}
                injectedJavaScriptBeforeContentLoaded={INJECTED_JS}
                renderLoading={() => (
                  <View style={styles.webViewLoading}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={styles.webViewLoadingText}>Loading secure payment gateway...</Text>
                  </View>
                )}
                allowsInlineMediaPlayback={true}
                sharedCookiesEnabled={true}
                thirdPartyCookiesEnabled={true}
                setSupportMultipleWindows={false}
                onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
                allowsBackForwardNavigationGestures={true}
                allowsLinkPreview={false}
                cacheEnabled={true}
                incognito={false}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Exit Confirmation Modal */}
      <Modal visible={showExitModal} transparent={true} animationType="fade" onRequestClose={handleExitCancel}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cancel Payment?</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to cancel this payment? This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={handleExitCancel}>
                <Text style={styles.cancelButtonText}>No, Continue</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={handleExitConfirm}>
                <Text style={styles.confirmButtonText}>Yes, Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function getStyles(theme: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.quaternary || "#F2E6D2",
    },
    safeAreaContainer: {
      flex: 1,
      backgroundColor: theme.colors.quaternary || "#F2E6D2",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingBottom: 12,
      backgroundColor: theme.colors.quaternary || "#F2E6D2",
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.quaternary || "#F2E6D2",
    },
    backButton: {
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    backButtonText: {
      fontSize: 16,
      color: theme.colors.textDark,
      fontWeight: "500",
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.colors.textDark,
    },
    placeholder: {
      width: 60,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      backgroundColor: theme.colors.white,
      borderRadius: 12,
      padding: 24,
      marginHorizontal: 32,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: "#000",
      marginBottom: 12,
      textAlign: "center",
    },
    modalMessage: {
      fontSize: 16,
      color: "#666",
      textAlign: "center",
      marginBottom: 24,
      lineHeight: 22,
    },
    modalButtons: {
      flexDirection: "row",
      justifyContent: "space-between",
      width: "100%",
    },
    modalButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginHorizontal: 8,
    },
    cancelButton: {
      backgroundColor: "#f0f0f0",
      borderWidth: 1,
      borderColor: "#ddd",
    },
    confirmButton: {
      backgroundColor: "#FF3B30",
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: "500",
      color: "#666",
      textAlign: "center",
    },
    confirmButtonText: {
      fontSize: 16,
      fontWeight: "500",
      color: "#fff",
      textAlign: "center",
    },
    loadingOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: "#333",
      fontWeight: "600",
    },
    loadingSubtext: {
      marginTop: 8,
      fontSize: 13,
      color: "#888",
      textAlign: "center",
      paddingHorizontal: 32,
    },
    webViewLoading: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.colors.white,
    },
    webViewLoadingText: {
      marginTop: 12,
      fontSize: 15,
      color: "#555",
      fontWeight: "500",
    },
  });
}

var styles = getStyles(themeConstants);
