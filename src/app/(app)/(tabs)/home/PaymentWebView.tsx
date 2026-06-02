import React, { useEffect, useState, useRef } from "react";
import { View, Modal, StyleSheet, Alert, Text, TouchableOpacity, ActivityIndicator, Platform, StatusBar, Linking } from "react-native";
import { WebView } from "react-native-webview";
import { useLocalSearchParams, useRouter } from "expo-router";
import { usePaymentSocket } from "@/hooks/usePaymentSocket";
import { SafeAreaView } from "react-native-safe-area-context";
import NetInfo from "@react-native-community/netinfo";
import { theme } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";

export default function PaymentWebView() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const urlBlockedAlertShown = useRef(false);
  const webViewRef = useRef<any>(null);
  const wasDisconnectedRef = useRef(false);

  const customUserAgent = Platform.OS === 'android'
    ? 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
    : 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1';

  // Debug logging & Fix parameter handling
  const [targetUrl, setTargetUrl] = useState<string>("");

  useEffect(() => {
    let url = (params.url || params.paymentUrl) as string;

    // Fix: If expo-router split the URL params (e.g. token param extracted separately)
    // We reconstruct the URL by appending any missing params that belong to the query
    if (url && !url.includes('token=') && params.token) {
      console.log("⚠️ URL truncated, appending token from params...");
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}token=${params.token}`;
    }

    if (url && !url.includes('orderId=') && params.orderId && !url.includes(params.orderId as string)) {
      console.log("⚠️ URL truncated, appending orderId from params...");
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}orderId=${params.orderId}`;
    }

    console.log("PaymentWebView params debug:", {
      originalUrl: params.url,
      paymentUrlParam: params.paymentUrl,
      finalUrl: url,
      allParams: params
    });

    setTargetUrl(url);
  }, [params]);

  const { socket, isSocketConnected, handleCancel } = usePaymentSocket({
    onPaymentSuccess: (data) => {
      // Disconnect socket before navigation (safety check, though hook handles it)
      if (socket && socket.connected) {
        socket.disconnect();
      }

      console.log("params.userDetails", params.userDetails);
      console.log("✅ Payment Success Data:", JSON.stringify(data, null, 2));

      let userDetails: any = {};
      try {
        userDetails = params.userDetails ? JSON.parse(params.userDetails as string) : {};
      } catch (e) {
        console.error("Error parsing userDetails in onPaymentSuccess:", e);
        // Fallback or empty object is already set
      }

      // Handle different response formats:
      // Razorpay: paymentResponse.id (payment ID), paymentResponse.order_id
      // Other gateways: paymentResponse.txn_id, paymentResponse.order_id
      const txnId = data?.paymentResponse?.id ||
        data?.paymentResponse?.txn_id ||
        data?.paymentResponse?.gatewayTransactionId ||
        "";
      const orderId = data?.paymentResponse?.order_id ||
        data?.orderId ||
        "";
      let amount = data?.paymentResponse?.amount ||
        data?.amount ||
        0;

      // Fix: Convert paise to rupees if needed
      // Razorpay returns amount in paise (10000 = 100 INR)
      if (data?.paymentResponse?.id?.startsWith('pay_') && data?.paymentResponse?.currency === 'INR') {
        amount = amount / 100;
      }
      const routerParams = {
        pathname: "/(tabs)/home/payment-success",
        params: {
          txnId: txnId,
          orderId: orderId,
          amount: amount.toString(),
          investmentId: userDetails?.investmentId,
          schemeType: userDetails?.schemeType,
          paymentFrequency: userDetails?.paymentFrequency,
        },
      } as const;

      console.log("✅ Navigating to success:", routerParams);
      router.replace(routerParams);
    },
    onPaymentFailure: (data) => {
      console.log("❌ Payment Failure Data:", JSON.stringify(data, null, 2));
      if (socket && socket.connected) {
        socket.disconnect();
      }

      // Handle different response formats
      const txnId = data?.paymentResponse?.id ||
        data?.paymentResponse?.txn_id ||
        data?.paymentResponse?.gatewayTransactionId ||
        "";
      const orderId = data?.paymentResponse?.order_id ||
        data?.orderId ||
        "";
      let amount = data?.paymentResponse?.amount ||
        data?.amount ||
        0;

      // Fix: Convert paise to rupees if needed
      if (data?.paymentResponse?.id?.startsWith('pay_') && data?.paymentResponse?.currency === 'INR') {
        amount = amount / 100;
      } const message = data?.message ||
        data?.paymentResponse?.txn_detail?.error_message ||
        data?.paymentResponse?.txn_detail?.response_message ||
        data?.paymentResponse?.payment_gateway_response?.resp_message ||
        data?.paymentResponse?.error_description ||
        "Payment Failed";
      const status = data?.paymentResponse?.status ||
        data?.paymentResponse?.txn_detail?.status ||
        data?.status ||
        "FAILED";

      console.log("❌ Navigating to failure:", { txnId, orderId, amount, message, status });

      router.replace({
        pathname: "/(tabs)/home/payment-failure",
        params: {
          message: message,
          orderId: orderId,
          txnId: txnId,
          amount: amount.toString(),
          status: status,
        },
      });
    },
    onPaymentError: (error) => {
      // Don't show error for network disconnection - we handle it automatically
      if (error?.error === "Disconnected" || error?.error === "Connection Error") {
        console.log("⚠️ Payment error due to disconnection - handled automatically");
        return;
      }

      console.log("⚠️ Payment processing error:", error);
      Alert.alert(
        "Payment Error",
        error?.message || "An error occurred during payment processing. Please try again.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    },
    onPaymentExpired: () => {
      if (socket && socket.connected) {
        socket.disconnect();
      }
      Alert.alert(
        "Payment Expired",
        "Your payment session has expired. Please try again.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    },
    parsedUserDetails: (() => {
      try {
        return params.userDetails ? JSON.parse(params.userDetails as string) : null;
      } catch (e) {
        console.error("Error parsing userDetails for hook prop:", e);
        return null;
      }
    })(),
    router,
    orderId: params.orderId as string,
    amount: params.amount as string,
  });

  console.log("PaymentWebView rendered. Socket connected:", isSocketConnected);

  // Handle back button press
  const handleBackPress = () => {
    Alert.alert(
      "Cancel Payment",
      "Are you sure you want to cancel this payment?",
      [
        {
          text: "No",
          style: "cancel",
          onPress: () => { /* Stay on page */ },
        },
        {
          text: "Yes",
          onPress: handleCancelPayment,
        },
      ],
      { cancelable: true }
    );
  };

  const handleCancelPayment = () => {
    setIsCancelling(true);

    if (socket && socket.connected) {
      console.log("Disconnecting socket...");
      socket.disconnect();
    }

    // Small delay to ensure socket disconnection and UI feedback
    setTimeout(() => {
      router.replace({
        pathname: "/(tabs)/home/payment-failure",
        params: {
          message: "Payment cancelled by user",
          orderId: params.orderId as string || "",
          txnId: "",
          amount: params.amount as string || "",
          status: "CANCELLED",
        },
      });
    }, 500);
  };

  // Monitor network connection status
  useEffect(() => {
    // Check initial network state
    NetInfo.fetch().then(state => {
      setIsConnected(state.isConnected === true);
    });

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected === true;
      const wasConnected = isConnected;
      setIsConnected(connected);

      if (!connected) {
        setIsReconnecting(true);
        wasDisconnectedRef.current = true;
      } else if (wasDisconnectedRef.current && wasConnected === false) {
        // Connection restored
        console.log("✅ [WebView] Connection restored, reloading WebView");
        setTimeout(() => {
          if (webViewRef.current) {
            webViewRef.current.reload();
          }
          setIsReconnecting(false);
          wasDisconnectedRef.current = false;
        }, 1000);
      } else {
        // Just initial load or minor fluctuation
        setTimeout(() => setIsReconnecting(false), 2000);
      }
    });

    return () => unsubscribe();
  }, [isConnected]);

  // Clean up socket and WebView on unmount
  useEffect(() => {
    return () => {
      console.log("🧹 Cleaning up PaymentWebView resources...");
      try {
        if (webViewRef.current) {
          webViewRef.current.stopLoading();
        }
      } catch (e) {
        console.log("⚠️ Error stopping WebView loading:", e);
      }

      if (socket && socket.connected) {
        socket.disconnect();
      }
    };
  }, [socket]);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      {/* Modal wrapper removed to prevent Android crash on unmount */}
      <View style={styles.container}>
        {/* Loading overlay when cancelling */}
        {isCancelling && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Cancelling payment...</Text>
          </View>
        )}

        <SafeAreaView style={styles.safeAreaContainer}>
          {/* Header - Styled to match app theme */}
          <View style={styles.headerContainer}>
            <View style={styles.headerContent}>
              <TouchableOpacity
                onPress={handleBackPress}
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={24} color="#fff" />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Secure Payment</Text>
              <View style={styles.placeholder} />
            </View>
          </View>

          <View style={{ flex: 1, backgroundColor: "#fff" }}>
            {/* Connection Status Banner */}
            {(!isConnected || isReconnecting) && (
              <View style={[
                styles.connectionBanner,
                !isConnected ? styles.connectionBannerOffline : styles.connectionBannerReconnecting
              ]}>
                <Text style={styles.connectionBannerText}>
                  {!isConnected
                    ? "⚠️ No internet connection. Waiting for reconnection..."
                    : "🔄 Reconnecting... Please wait"}
                </Text>
              </View>
            )}

            {/* Socket Connection Loading State */}
            {!isSocketConnected ? (
              <View style={styles.loadingContainer}>
                <View style={styles.loadingIconContainer}>
                  <Ionicons name="lock-closed" size={32} color={theme.colors.primary} />
                </View>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Initializing secure connection...</Text>
              </View>
            ) : !targetUrl ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Loading payment info...</Text>
              </View>
            ) : (
              <WebView
                ref={webViewRef}
                source={{
                  uri: targetUrl,
                }}
                userAgent={customUserAgent}
                style={{ flex: 1, backgroundColor: 'transparent' }}
                containerStyle={{ flex: 1 }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                originWhitelist={["*"]}
                startInLoadingState={true}
                renderLoading={() => (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                  </View>
                )}
                allowsInlineMediaPlayback={true}
                thirdPartyCookiesEnabled={true}
                sharedCookiesEnabled={true}
                textZoom={100}
                scalesPageToFit={false}
                overScrollMode="never"
                mixedContentMode="always"
                setSupportMultipleWindows={true} // Allow popups which some gateways use
                cacheEnabled={false} // Disable cache to prevent stale white pages

                // Block navigation to payment-success URL - we only use socket events for status
                // The URL https://api.prod.srimurugangoldhouse.in/payment-success is for status checking only
                // We should NOT navigate to it - socket payment_status_update event handles everything
                onShouldStartLoadWithRequest={(request) => {
                  const url = request.url;
                  const urlLower = url.toLowerCase();
                  console.log("🔍 WebView navigation request:", url);

                  // Handle deep linking for UPI and other custom schemes
                  let targetUrlToOpen = url;
                  if (urlLower.startsWith('intent://')) {
                    console.log("📦 Parsing Android intent URL:", url);
                    const match = url.match(/scheme=([^;]+)/);
                    if (match && match[1]) {
                      const scheme = match[1];
                      const rest = url.substring(9).split('#')[0];
                      targetUrlToOpen = `${scheme}://${rest}`;
                      console.log("🔄 Converted intent URL to:", targetUrlToOpen);
                    }
                  }

                  if (!targetUrlToOpen.toLowerCase().startsWith('http://') && 
                      !targetUrlToOpen.toLowerCase().startsWith('https://') && 
                      !targetUrlToOpen.toLowerCase().startsWith('about:')) {
                    console.log("🚀 Redirecting to native app (custom scheme):", targetUrlToOpen);
                    Linking.openURL(targetUrlToOpen).catch((err) => {
                      console.warn("❌ Error opening deep link directly:", err);
                      Alert.alert(
                        "App Not Found",
                        "The app required to complete this payment is not installed or could not be opened.",
                        [{ text: "OK" }]
                      );
                    });
                    return false;
                  }

                  // Block payment-success URL - status is handled by socket only
                  if (urlLower.includes('/payment-success') ||
                    urlLower.includes('payment-success') ||
                    urlLower.includes('payment_success') ||
                    urlLower.includes('api.prod.srimurugangoldhouse.in/payment-success')) {
                    console.log("🚫 BLOCKED: Navigation to payment-success URL");
                    console.log("   URL:", request.url);
                    console.log("   Reason: Status is handled by payment_status_update socket event only");
                    console.log("   Waiting for socket event to process payment status...");
                    // Prevent navigation - socket will handle the status
                    return false;
                  }

                  // Block and handle cancel / failure routes immediately to exit WebView
                  if (urlLower.includes('/cancel') ||
                      urlLower.includes('/error') ||
                      urlLower.includes('status=failed') ||
                      urlLower.includes('payment_failed')) {
                    console.log("❌ Cancel/Failure URL intercepted in onShouldStartLoadWithRequest:", url);
                    handleCancel();
                    return false;
                  }

                  // Allow all other navigation
                  return true;
                }}

                onNavigationStateChange={(navState) => {
                  console.log("Nav State:", navState);
                  console.log("Current URL:", navState.url);

                  // Block 'about:blank' loops
                  if (navState.url === "about:blank" && !navState.loading) {
                    if (socket && socket.connected) socket.disconnect();

                    Alert.alert("URL Blocked", "The payment URL was blocked.", [
                      {
                        text: "OK", onPress: () => {
                          router.replace({
                            pathname: "/(tabs)/home/payment-failure",
                            params: { message: "Payment URL blocked", orderId: params.orderId as string, status: "blocked" }
                          });
                        }
                      }
                    ]);
                    return;
                  }

                  const currentUrl = navState.url.toLowerCase();

                  // Block payment-success URL if it somehow gets through
                  if (currentUrl.includes('/payment-success') ||
                    currentUrl.includes('payment-success') ||
                    currentUrl.includes('payment_success')) {
                    console.log("🚫 Blocked payment-success URL in navigation state change");
                    console.log("   Relying on socket payment_status_update event only");
                    // Stop loading this URL
                    if (webViewRef.current) {
                      webViewRef.current.stopLoading();
                    }
                    return;
                  }

                  // Check for payment success indicators in URL (for logging only)
                  if (currentUrl.includes("success") ||
                    currentUrl.includes("verified") ||
                    currentUrl.includes("status=success")) {
                    console.log("ℹ️ Payment success URL detected (blocked):", currentUrl);
                    console.log("   Waiting for socket payment_status_update event...");
                    // Don't navigate - socket will handle it
                  }

                  // Check for payment failure indicators
                  if (currentUrl.includes("/cancel") ||
                    currentUrl.includes("/error") ||
                    (currentUrl.includes("payment") && currentUrl.includes("status=failed")) ||
                    currentUrl.includes("payment_failed")) {
                    console.log("❌ Payment failure detected from URL:", currentUrl);
                    handleCancel();
                  }
                }}

                onReceivedSslError={(event: any) => {
                  console.log("🔒 SSL Error detected:", event.nativeEvent);
                  // event.nativeEvent.proceed(); // Uncomment to bypass SSL error for testing
                }}

                onError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  console.warn('WebView error: ', nativeEvent);
                }}
                onHttpError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  console.warn('WebView HTTP error: ', nativeEvent);
                }}

                // Handle JavaScript alerts from payment gateway
                onJsAlert={(event: any) => {
                  const message = event.nativeEvent.message || '';
                  const url = event.nativeEvent.url || '';
                  console.log("🔔 WebView JavaScript Alert Received:");
                  console.log("   Message:", message);
                  console.log("   URL:", url);

                  // Extract the actual message (remove "The page at '...' says:" prefix if present)
                  let actualMessage = message;
                  const saysIndex = message.toLowerCase().indexOf('says:');
                  if (saysIndex !== -1) {
                    actualMessage = message.substring(saysIndex + 5).trim();
                  }

                  console.log("   Extracted Message:", actualMessage);

                  // Check if it's a payment success message (case-insensitive)
                  const messageLower = actualMessage.toLowerCase();
                  const isSuccessMessage =
                    messageLower.includes('payment verified successfully') ||
                    messageLower.includes('payment successful') ||
                    messageLower.includes('payment verified') ||
                    messageLower.includes('verified successfully') ||
                    (messageLower.includes('success') && messageLower.includes('payment')) ||
                    (messageLower.includes('success') && messageLower.includes('verified'));

                  if (isSuccessMessage) {
                    console.log("✅ Payment success detected from alert!");
                    console.log("   Suppressing alert and waiting for socket payment_status_update event...");

                    // Suppress the alert completely - don't show it to user
                    // The socket event will handle navigation
                    return true; // Return true to suppress the default alert
                  }

                  // For other alerts (non-success), still suppress to avoid blocking
                  // But log them for debugging
                  console.log("⚠️ Non-success alert from payment gateway:", actualMessage);
                  console.log("   Suppressing to avoid blocking payment flow");
                  return true; // Suppress all alerts to prevent blocking
                }}

                // Handle JavaScript confirms
                onJsConfirm={(event: any) => {
                  const message = event.nativeEvent.message || '';
                  console.log("🔔 WebView JavaScript Confirm (Suppressed):", message);
                  return true; // Suppress confirmation dialogs
                }}

                // Handle JavaScript prompts
                onJsPrompt={(event: any) => {
                  const message = event.nativeEvent.message || '';
                  console.log("🔔 WebView JavaScript Prompt (Suppressed):", message);
                  return true; // Suppress prompt dialogs
                }}
              />
            )}
          </View>
        </SafeAreaView>
      </View>
      {/* </Modal> removed */}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  safeAreaContainer: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  headerContainer: {
    backgroundColor: theme.colors.primary,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 60,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingRight: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
  },
  placeholder: {
    width: 60,
  },
  connectionBanner: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#FFA500",
    borderBottomWidth: 1,
    borderBottomColor: "#FF8C00",
  },
  connectionBannerOffline: {
    backgroundColor: "#FF6B6B",
    borderBottomColor: "#FF5252",
  },
  connectionBannerReconnecting: {
    backgroundColor: "#FFA500",
    borderBottomColor: "#FF8C00",
  },
  connectionBannerText: {
    fontSize: 13,
    color: "#fff",
    textAlign: "center",
    fontWeight: "500",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },
  loadingIconContainer: {
    marginBottom: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(133, 1, 17, 0.1)", // Primary color with opacity
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textDark,
    fontWeight: "600",
  },
});
