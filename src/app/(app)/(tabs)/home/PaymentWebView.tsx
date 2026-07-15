import React, { useEffect, useState, useRef } from "react";
import { View, Modal, StyleSheet, Alert, Text, TouchableOpacity, ActivityIndicator, Platform, StatusBar, Linking } from "react-native";
import { WebView } from "react-native-webview";
import { useLocalSearchParams, useRouter } from "expo-router";
import { usePaymentSocket } from "@/hooks/usePaymentSocket";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import NetInfo from "@react-native-community/netinfo";
import { hp } from "@/utils/responsiveUtils";
import { theme } from "@/constants/theme";
import apiClient from "@/services/api";
import useGlobalStore from '@/store/global.store';
import { logAppEvent } from "@/services/appEventService";

// import { safeNavigateBack } from "@/utils/navigationUtils";
// import your socket library here if needed

let errorTimeout: NodeJS.Timeout | null = null;

const safeParseJSON = (jsonString: any, fallback: any = {}) => {
  if (!jsonString) return fallback;
  if (typeof jsonString === 'object') return jsonString;
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("Error parsing JSON:", e);
    return fallback;
  }
};

export default function PaymentWebView() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const router = useRouter();
  const [showExitModal, setShowExitModal] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const urlBlockedAlertShown = useRef(false);
  const webViewRef = useRef<any>(null);
  const wasDisconnectedRef = useRef(false);
  // Forward reference so the socket hook can call stopStatusPolling before it is defined.
  const stopPollingRef = useRef<() => void>(() => {});

  const { user } = useGlobalStore();

  const type = (params.type as any) || 'scheme';
  const bookingId = params.bookingId as string;
  const amount = params.amount as string;
  const url = (params.url || params.paymentUrl || "") as string;
  const accountNumber = params.accountNumber as string;
  const accountName = params.accountName as string;
  const schemeName = (params.schemeName || "") as string;
  const goldRate = (params.goldRate || "") as string;
  const maturityDate = (params.maturityDate || "") as string;
  const joiningDate = (params.joiningDate || "") as string;

  // Debug logging
  console.log("PaymentWebView params:", {
    url,
    orderId: params.orderId,
    type,
    bookingId,
    amount,
    hasUserDetails: !!params.userDetails
  });

  useEffect(() => {
    logAppEvent('PAYMENT_WEBVIEW_LOADED', {
      orderId: String(params.orderId || ''),
      type,
      bookingId: String(bookingId || ''),
      amount: String(amount || ''),
    });
  }, []);

  const { socket, handleCancel } = usePaymentSocket({
    onStopPolling: () => stopPollingRef.current(),
    onPaymentSuccess: (data) => {
      setIsVerifyingPayment(true);
      // Disconnect socket before navigation
      if (socket && socket.connected) {
        socket.disconnect();
      }
      stopStatusPolling();

      logAppEvent('PAYMENT_WEBVIEW_SUCCESS', {
        orderId: data?.paymentResponse?.order_id || params.orderId || "",
        txnId: data?.paymentResponse?.txn_id || "",
        amount: data?.paymentResponse?.amount || amount || "",
        type,
      });

      console.log("params.userDetails", params.userDetails);
      const userDetails = safeParseJSON(params.userDetails);

      const routerParams = {
        pathname: "/(tabs)/home/payment-success",
        params: {
          txnId: data?.paymentResponse?.txn_id || "",
          orderId: data?.paymentResponse?.order_id || params.orderId || "",
          amount: data?.paymentResponse?.amount || params.amount || amount || "",
          investmentId: userDetails?.investmentId || "",
          schemeType: userDetails?.schemeType || "",
          paymentFrequency: userDetails?.paymentFrequency || "",
          schemeName: schemeName,
          goldRate: goldRate,
          joiningDate: joiningDate || userDetails?.joiningDate || "",
          maturityDate: maturityDate || userDetails?.maturityDate || "",
          type: type,
          userId: params.userId as string || user?.id || "",
        },
      };
      console.log("routerParams", routerParams);
      router.replace(routerParams);
    },
    onPaymentFailure: (data) => {
      setIsVerifyingPayment(true);
      // Disconnect socket before navigation
      if (socket && socket.connected) {
        socket.disconnect();
      }
      stopStatusPolling();

      logAppEvent('PAYMENT_WEBVIEW_FAILURE', {
        orderId: data?.paymentResponse?.order_id || params.orderId || "",
        txnId: data?.paymentResponse?.txn_id || "",
        amount: data?.paymentResponse?.amount || amount || "",
        message: data?.paymentResponse?.payment_gateway_response?.resp_message ||
          data?.paymentResponse?.txn_detail?.error_message ||
          'Payment Failed',
        type,
      });

      const userDetails = safeParseJSON(params.userDetails);
      const investmentId = userDetails?.investmentId || params.investmentId || "";
      router.replace({
        pathname: "/(tabs)/home/payment-failure",
        params: {
          message:
            data?.paymentResponse?.payment_gateway_response?.resp_message ||
            data?.paymentResponse?.txn_detail?.error_message ||
            (data?.paymentResponse?.txn_detail as any)?.response_message ||
            "Payment Failed",
          orderId: data?.paymentResponse?.order_id || params.orderId || "",
          txnId: data?.paymentResponse?.txn_id || "",
          amount: data?.paymentResponse?.amount || params.amount || amount || "",
          status: data?.paymentResponse?.status || "FAILED",
          type: type,
          userId: params.userId as string || user?.id || "",
          investmentId: String(investmentId),
          paymentMethod: data?.paymentResponse?.payment_method_type || data?.paymentResponse?.payment_method || "",
        },
      });
    },
    onPaymentError: (error) => {
      // Don't show error for network disconnection - we handle it automatically by starting polling
      if (error?.error === "Disconnected" || error?.error === "Connection Error") {
        console.log("⚠️ Payment error due to disconnection - handled automatically, starting fallback polling");
        
        // Start polling fallback if not already started
        const userDetails = safeParseJSON(params.userDetails);
        const successTarget = {
          pathname: "/(tabs)/home/payment-success" as any,
          params: {
            txnId: "",
            orderId: params.orderId as string,
            amount: params.amount as string,
            investmentId: userDetails?.investmentId,
            schemeType: userDetails?.schemeType,
            paymentFrequency: userDetails?.paymentFrequency,
            schemeName: schemeName,
            goldRate: goldRate,
            joiningDate: joiningDate || userDetails?.joiningDate || "",
            maturityDate: maturityDate || userDetails?.maturityDate || "",
            type: type,
            userId: params.userId as string || user?.id || "",
          },
        };
        const failureTarget = {
          pathname: "/(tabs)/home/payment-failure" as any,
          params: {
            message: "Payment Verification Pending/Failed",
            orderId: params.orderId as string,
            txnId: "",
            amount: params.amount as string,
            status: "FAILED",
            type: type,
            userId: params.userId as string || user?.id || "",
          },
        };
        startStatusPolling(params.orderId as string, successTarget, failureTarget);
        return;
      }

      // Only show alert for non-network related errors
      // These are actual payment processing errors, not connection issues
      console.log("⚠️ Payment error (non-network):", error);
      stopStatusPolling();
      Alert.alert(
        "Payment Error",
        error?.message ||
        "An error occurred during payment processing. Please try again.",
        [
          {
            text: "OK",
            onPress: () => {
              router.back();
            },
          },
        ]
      );
    },
    onPaymentExpired: () => {
      // Disconnect socket before navigation
      if (socket && socket.connected) {
        socket.disconnect();
      }
      stopStatusPolling();
      Alert.alert(
        "Payment Expired",
        "Your payment session has expired. Please try again to complete the transaction.",
        [
          {
            text: "OK",
            onPress: () => {
              router.back();
            },
          },
        ]
      );
    },
    parsedUserDetails: safeParseJSON(params.userDetails, {
      ...user,
      id: params.userId || user?.id,
      orderId: params.orderId as string || "",
      accountNumber: accountNumber || (user as any)?.accountNumber || (user as any)?.accountNo || (user as any)?.accNo || "",
      accountName: accountName || user?.name || (user as any)?.accountName || "",
      userId: params.userId || user?.id,
      name: accountName || user?.name || "",
      userMobile: user?.mobile || (user as any)?.mobileNumber || params.userMobile || ""
    }),
    router,
    orderId: params.orderId as string,
    bookingId,
    type,
    amount
  });

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isTransitioningRef = useRef<boolean>(false);

  const startStatusPolling = (orderIdValue: string, successTarget: any, failureTarget: any) => {
    if (pollingIntervalRef.current) return;
    setIsVerifyingPayment(true);

    console.log(`[Polling Fallback] Starting interval checks for orderId: ${orderIdValue}`);

    pollingIntervalRef.current = setInterval(async () => {
      try {
        console.log(`[Polling Fallback] Fetching status from server for orderId: ${orderIdValue}`);
        const response = await apiClient.get(`/payments/status/${orderIdValue}?t=${Date.now()}`);
        const data = response.data;

        console.log("[Polling Fallback] Status check response:", JSON.stringify(data));

        if (data?.success) {
          const status = data.status;
          
          if (status === "Success" || status === "success") {
            console.log("[Polling Fallback] Payment succeeded. Stopping poll and routing to success.");
            stopStatusPolling();
            
            if (!isTransitioningRef.current) {
              isTransitioningRef.current = true;
              if (socket && socket.connected) socket.disconnect();
              router.replace(successTarget);
            }
          } else if (status === "failed" || status === "failure" || status === "cancelled" || status === "Expired") {
            console.log("[Polling Fallback] Payment unsuccessful. Stopping poll and routing to failure.");
            stopStatusPolling();
            
            if (!isTransitioningRef.current) {
              isTransitioningRef.current = true;
              if (socket && socket.connected) socket.disconnect();
              router.replace(failureTarget);
            }
          }
        }
      } catch (error) {
        console.error("[Polling Fallback] Error checking payment status:", error);
      }
    }, 2000);
  };

  const stopStatusPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      console.log("[Polling Fallback] Polling interval cleared.");
    }
    setIsVerifyingPayment(false);
  };

  // Keep the forward ref up to date so the socket hook can always call the latest version.
  stopPollingRef.current = stopStatusPolling;


  useEffect(() => {
    return () => {
      stopStatusPolling();
    };
  }, []);

  // Handle back button press
  const handleBackPress = () => {
    if (isVerifyingPayment || isCancelling) {
      return;
    }
    Alert.alert(
      "Cancel Payment",
      "Are you sure you want to cancel this payment?",
      [
        {
          text: "No",
          style: "cancel",
          onPress: () => {
            // Do nothing, stay on payment page
          },
        },
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

  // Handle cancel payment
  const handleCancelPayment = () => {
    setIsCancelling(true);

    logAppEvent('PAYMENT_WEBVIEW_CANCELLED', {
      orderId: params.orderId as string || "",
      amount: params.amount as string || "",
      type,
    });

    // Disconnect socket
    if (socket && socket.connected) {
      console.log("Disconnecting socket...");
      socket.disconnect();
    }

    // Small delay to ensure socket disconnection completes, then navigate to payment failure page
    setTimeout(() => {
      const userDetails = safeParseJSON(params.userDetails);
      const investmentId = userDetails?.investmentId || params.investmentId || "";
      router.replace({
        pathname: "/(tabs)/home/payment-failure",
        params: {
          message: "Payment cancelled by user",
          orderId: params.orderId as string || "",
          txnId: "",
          amount: params.amount as string || "",
          status: "CANCELLED",
          type: type,
          userId: params.userId as string || user?.id || "",
          investmentId: String(investmentId),
        },
      });
    }, 500); // 500ms delay for socket disconnection
  };

  // Handle exit confirmation (for exit modal if still used)
  const handleExitConfirm = () => {
    handleCancelPayment();
  };

  // Handle exit cancellation
  const handleExitCancel = () => {
    setShowExitModal(false);
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
      } else {
        // When connection is restored
        if (wasDisconnectedRef.current && wasConnected === false) {
          console.log("✅ [WebView] Connection restored, reloading WebView");
          // Reload WebView when connection is restored
          setTimeout(() => {
            if (webViewRef.current) {
              webViewRef.current.reload();
            }
            setIsReconnecting(false);
            wasDisconnectedRef.current = false;
          }, 1000); // Small delay to ensure connection is stable
        } else {
          setTimeout(() => {
            setIsReconnecting(false);
          }, 2000);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isConnected]);

  // Cleanup socket on component unmount
  useEffect(() => {
    return () => {
      if (socket && socket.connected) {
        socket.disconnect();
      }
    };
  }, [socket]);

  const parseIntentUrl = (url: string): string => {
    try {
      const match = url.match(/intent:\/\/([^#]+)#Intent;(.+)/);
      if (!match) return url;

      const path = match[1];
      const params = match[2].split(";");
      let scheme = "upi";

      params.forEach((param) => {
        if (param.startsWith("scheme=")) {
          scheme = param.split("=")[1];
        }
      });

      return `${scheme}://${path}`;
    } catch (e) {
      console.error("Error parsing intent URL:", e);
      return url;
    }
  };

  // Handle WebView requests
  const handleShouldStartLoadWithRequest = (request: any) => {
    const { url } = request;
    console.log("WebView attempting to load:", url);
    const lowerUrl = url.toLowerCase();

    // Allow standard web schemes to load within the webview
    if (
      lowerUrl.startsWith("http://") ||
      lowerUrl.startsWith("https://") ||
      lowerUrl.startsWith("about:") ||
      lowerUrl.startsWith("data:") ||
      lowerUrl.startsWith("javascript:")
    ) {
      return true;
    }

    // Intercept custom scheme/intent URLs (e.g. upi, phonepe, gpay, intent, bank apps)
    let targetUrl = url;
    if (lowerUrl.startsWith("intent:")) {
      targetUrl = parseIntentUrl(url);
      console.log("Parsed intent URL to standard scheme:", targetUrl);
    }

    Linking.canOpenURL(targetUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(targetUrl);
        } else {
          console.log("canOpenURL returned false, attempting forced open anyway:", targetUrl);
          return Linking.openURL(targetUrl).catch((err) => {
            console.log("Failed to open URL forcibly:", err);
            Alert.alert(
              "Payment App Not Found",
              "Could not open the selected payment app. Please install it or try another method.",
              [{ text: "OK", onPress: () => {} }]
            );
          });
        }
      })
      .catch((err) => {
        console.error("An error occurred handling the URL:", err);
      });

    return false;
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.quaternary || '#F2E6D2'} />
      <Modal visible={true} animationType="slide" presentationStyle="fullScreen" onRequestClose={handleBackPress}>
        <View style={styles.container}>
          {/* Loading overlay when cancelling */}
          {isCancelling && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Cancelling payment...</Text>
            </View>
          )}
          {/* Loading overlay when verifying */}
          {isVerifyingPayment && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Verifying payment status...</Text>
              <Text style={{ marginTop: 8, fontSize: 13, color: "#999", textAlign: "center" }}>
                Please do not close the app or press back
              </Text>
            </View>
          )}
          <View style={styles.safeAreaContainer}>
            {/* Header with back button */}
            <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top : (Platform.OS === 'android' ? 24 : 12) }]}>
              <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Payment</Text>
              <View style={styles.placeholder} />
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

            {Platform.OS === 'android' ? (
              <WebView
                ref={webViewRef}
                source={{ uri: url }}
                style={{ flex: 1 }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                originWhitelist={["*"]}
                startInLoadingState={true}
                renderLoading={() => (
                  <View style={styles.webViewLoading}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={styles.webViewLoadingText}>Loading secure payment gateway...</Text>
                  </View>
                )}
                allowsInlineMediaPlayback={true}
                thirdPartyCookiesEnabled={true}
                textZoom={100}
                scalesPageToFit={true}
                overScrollMode="never"
                mixedContentMode="always"
                setSupportMultipleWindows={false}
                cacheEnabled={true}
                onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
                onOpenWindow={(event) => {
                  console.log("OPEN WINDOW:", event.nativeEvent);
                }}
                onLoadStart={() => {
                  console.log("WebView started loading:", url);
                }}
                onLoadEnd={() => {
                  console.log("WebView finished loading");
                }}
                onNavigationStateChange={(navState) => {
                  console.log("Payment Navigation State:", {
                    url: navState.url,
                    title: navState.title,
                    loading: navState.loading,
                    canGoBack: navState.canGoBack,
                  });

                  // Check for about:blank URL blocking scenario
                  if (
                    navState.url === "about:blank" &&
                    !navState.title &&
                    !navState.loading &&
                    !urlBlockedAlertShown.current
                  ) {
                    urlBlockedAlertShown.current = true;

                    // Disconnect socket
                    if (socket && socket.connected) {
                      socket.disconnect();
                    }

                    // Show alert about URL blocking
                    Alert.alert(
                      "URL Blocked",
                      "The payment URL has been blocked. Please check with customer service for assistance.",
                      [
                        {
                          text: "OK",
                          onPress: () => {
                            // Navigate to payment failure page
                            router.replace({
                              pathname: "/(tabs)/home/payment-failure",
                              params: {
                                message: "Payment URL blocked. Please contact customer service.",
                                orderId: params.orderId as string,
                                txnId: "",
                                amount: params.amount as string,
                                status: "blocked",
                              },
                            });
                          },
                        },
                      ]
                    );
                    return;
                  }

                  const currentUrl = navState.url.toLowerCase();
                  
                  // Check for explicit cancel/failed status in the URL first
                  const isExplicitCancel = currentUrl.includes("status=cancelled") || currentUrl.includes("/cancel");
                  const isExplicitFailure = currentUrl.includes("status=failed") || currentUrl.includes("status=failure") || currentUrl.includes("/failed") || currentUrl.includes("/error");
                  
                  if (isExplicitCancel || isExplicitFailure) {
                    console.log(`[DEBUG Payment Flow] WebView reached explicit cancel/failure page (${isExplicitCancel ? 'Cancel' : 'Failure'}). Routing to failure screen...`);
                    stopStatusPolling();
                    if (socket && socket.connected) {
                      socket.disconnect();
                    }
                    
                    if (!isTransitioningRef.current) {
                      isTransitioningRef.current = true;
                      const userDetails = safeParseJSON(params.userDetails);
                      const investmentId = userDetails?.investmentId || params.investmentId || "";
                      router.replace({
                        pathname: "/(tabs)/home/payment-failure",
                        params: {
                          message: isExplicitCancel ? "Payment cancelled by user" : "Payment Verification Pending/Failed",
                          orderId: params.orderId as string || "",
                          txnId: "",
                          amount: params.amount as string || "",
                          status: isExplicitCancel ? "CANCELLED" : "FAILED",
                          type: type,
                          userId: params.userId as string || user?.id || "",
                          investmentId: String(investmentId),
                        },
                      });
                    }
                    return;
                  }

                  if (currentUrl.includes("/payments/status") || currentUrl.includes("/loading")) {
                    console.log("[DEBUG Payment Flow] WebView reached return url callback page. Starting polling...");
                    const userDetails = safeParseJSON(params.userDetails);
                    const successTarget = {
                      pathname: "/(tabs)/home/payment-success" as any,
                      params: {
                        txnId: "",
                        orderId: params.orderId as string,
                        amount: params.amount as string,
                        investmentId: userDetails?.investmentId,
                        schemeType: userDetails?.schemeType,
                        paymentFrequency: userDetails?.paymentFrequency,
                        schemeName: schemeName,
                        goldRate: goldRate,
                        joiningDate: joiningDate || userDetails?.joiningDate || "",
                        maturityDate: maturityDate || userDetails?.maturityDate || "",
                        type: type,
                        userId: params.userId as string || user?.id || "",
                      },
                    };
                    const failureTarget = {
                      pathname: "/(tabs)/home/payment-failure" as any,
                      params: {
                        message: "Payment Verification Pending/Failed",
                        orderId: params.orderId as string,
                        txnId: "",
                        amount: params.amount as string,
                        status: "FAILED",
                        type: type,
                        userId: params.userId as string || user?.id || "",
                        investmentId: userDetails?.investmentId || params.investmentId || "",
                      },
                    };
                    startStatusPolling(params.orderId as string, successTarget, failureTarget);
                  }
                }}
                onError={(err) => {
                  console.log("WebView Error:", err);
                  const errorCode = err.nativeEvent?.code;
                  const errorDescription = err.nativeEvent?.description || '';
                  const errorDomain = err.nativeEvent?.domain || '';

                  // Check if it's a network connectivity error
                  const isNetworkError =
                    errorCode === -1009 || // NSURLErrorNotConnectedToInternet (iOS)
                    errorCode === -1001 || // NSURLErrorTimedOut
                    errorCode === -1004 || // NSURLErrorCannotConnectToHost
                    errorDescription.toLowerCase().includes('offline') ||
                    errorDescription.toLowerCase().includes('internet connection') ||
                    errorDescription.toLowerCase().includes('network') ||
                    errorDomain.includes('NSURLErrorDomain');

                  if (isNetworkError) {
                    console.log("⚠️ WebView network error detected - handled by connection monitoring");
                    // Don't show alert - the connection banner will handle this
                    // Network monitoring will automatically retry when connection is restored
                    return;
                  }

                  // Only show alert for non-network errors
                  Alert.alert(
                    "WebView Error",
                    `Failed to load payment page: ${errorDescription || 'Unknown error'}`,
                    [
                      {
                        text: "OK",
                        onPress: () => {
                          // Optionally reload the page
                          // webViewRef.current?.reload();
                        }
                      }
                    ]
                  );
                }}
                onHttpError={(e) => {
                  console.log("HTTP error:", e.nativeEvent);
                  const statusCode = e.nativeEvent.statusCode;
                  const description = e.nativeEvent.description || '';

                  // Don't show alert for network-related HTTP errors
                  // These are handled by the connection monitoring
                  if (statusCode === 0 || statusCode >= 500) {
                    console.log("⚠️ HTTP error likely due to network - handled by connection monitoring");
                    return;
                  }

                  // Only show alert for client errors (4xx) that aren't network-related
                  if (statusCode >= 400 && statusCode < 500) {
                    Alert.alert(
                      "HTTP Error",
                      `HTTP Error: ${statusCode} - ${description}`,
                      [
                        {
                          text: "OK",
                          onPress: () => {
                            // Optionally handle the error
                          }
                        }
                      ]
                    );
                  }
                }}
              />
            ) : (
              <WebView
                ref={webViewRef}
                source={{ uri: url }}
                style={{ flex: 1 }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                originWhitelist={["*"]}
                startInLoadingState={true}
                renderLoading={() => (
                  <View style={styles.webViewLoading}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={styles.webViewLoadingText}>Loading secure payment gateway...</Text>
                  </View>
                )}
                allowsInlineMediaPlayback={true}
                sharedCookiesEnabled={true}
                thirdPartyCookiesEnabled={true}
                setSupportMultipleWindows={true}
                onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
                onOpenWindow={(event) => {
                  console.log("OPEN WINDOW:", event.nativeEvent);
                }}
                allowsBackForwardNavigationGestures={true}
                allowsLinkPreview={false}
                userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Safari/604.1"
                cacheEnabled={true}
                incognito={false}
                onLoadStart={() => {
                  console.log("WebView started loading:", url);
                }}
                onLoadEnd={() => {
                  console.log("WebView finished loading");
                }}
                onNavigationStateChange={(navState) => {
                  console.log("Payment Navigation State:", {
                    url: navState.url,
                    title: navState.title,
                    loading: navState.loading,
                    canGoBack: navState.canGoBack,
                  });

                  // Check for about:blank URL blocking scenario
                  if (
                    navState.url === "about:blank" &&
                    !navState.title &&
                    !navState.loading &&
                    !urlBlockedAlertShown.current
                  ) {
                    urlBlockedAlertShown.current = true;

                    // Disconnect socket
                    if (socket && socket.connected) {
                      socket.disconnect();
                    }

                    // Show alert about URL blocking
                    Alert.alert(
                      "URL Blocked",
                      "The payment URL has been blocked. Please check with customer service for assistance.",
                      [
                        {
                          text: "OK",
                          onPress: () => {
                            // Navigate to payment failure page
                            router.replace({
                              pathname: "/(tabs)/home/payment-failure",
                              params: {
                                message: "Payment URL blocked. Please contact customer service.",
                                orderId: params.orderId as string,
                                txnId: "",
                                amount: params.amount as string,
                                status: "blocked",
                              },
                            });
                          },
                        },
                      ]
                    );
                    return;
                  }

                  const currentUrl = navState.url.toLowerCase();
                  
                  // Check for explicit cancel/failed status in the URL first
                  const isExplicitCancel = currentUrl.includes("status=cancelled") || currentUrl.includes("/cancel");
                  const isExplicitFailure = currentUrl.includes("status=failed") || currentUrl.includes("status=failure") || currentUrl.includes("/failed") || currentUrl.includes("/error");
                  
                  if (isExplicitCancel || isExplicitFailure) {
                    console.log(`[DEBUG Payment Flow] WebView reached explicit cancel/failure page (${isExplicitCancel ? 'Cancel' : 'Failure'}). Routing to failure screen...`);
                    stopStatusPolling();
                    if (socket && socket.connected) {
                      socket.disconnect();
                    }
                    
                    if (!isTransitioningRef.current) {
                      isTransitioningRef.current = true;
                      const userDetails = safeParseJSON(params.userDetails);
                      const investmentId = userDetails?.investmentId || params.investmentId || "";
                      router.replace({
                        pathname: "/(tabs)/home/payment-failure",
                        params: {
                          message: isExplicitCancel ? "Payment cancelled by user" : "Payment Verification Pending/Failed",
                          orderId: params.orderId as string || "",
                          txnId: "",
                          amount: params.amount as string || "",
                          status: isExplicitCancel ? "CANCELLED" : "FAILED",
                          type: type,
                          userId: params.userId as string || user?.id || "",
                          investmentId: String(investmentId),
                        },
                      });
                    }
                    return;
                  }

                  if (currentUrl.includes("/payments/status") || currentUrl.includes("/loading")) {
                    console.log("[DEBUG Payment Flow] WebView reached return url callback page. Starting polling...");
                    const userDetails = safeParseJSON(params.userDetails);
                    const successTarget = {
                      pathname: "/(tabs)/home/payment-success" as any,
                      params: {
                        txnId: "",
                        orderId: params.orderId as string,
                        amount: params.amount as string,
                        investmentId: userDetails?.investmentId,
                        schemeType: userDetails?.schemeType,
                        paymentFrequency: userDetails?.paymentFrequency,
                        schemeName: schemeName,
                        goldRate: goldRate,
                        joiningDate: joiningDate || userDetails?.joiningDate || "",
                        maturityDate: maturityDate || userDetails?.maturityDate || "",
                        type: type,
                        userId: params.userId as string || user?.id || "",
                      },
                    };
                    const failureTarget = {
                      pathname: "/(tabs)/home/payment-failure" as any,
                      params: {
                        message: "Payment Verification Pending/Failed",
                        orderId: params.orderId as string,
                        txnId: "",
                        amount: params.amount as string,
                        status: "FAILED",
                        type: type,
                        userId: params.userId as string || user?.id || "",
                        investmentId: userDetails?.investmentId || params.investmentId || "",
                      },
                    };
                    startStatusPolling(params.orderId as string, successTarget, failureTarget);
                  }
                }}
                onError={(err) => {
                  console.log("WebView Error:", err);
                  const errorCode = err.nativeEvent?.code;
                  const errorDescription = err.nativeEvent?.description || '';
                  const errorDomain = err.nativeEvent?.domain || '';

                  // Check if it's a network connectivity error
                  const isNetworkError =
                    errorCode === -1009 || // NSURLErrorNotConnectedToInternet (iOS)
                    errorCode === -1001 || // NSURLErrorTimedOut
                    errorCode === -1004 || // NSURLErrorCannotConnectToHost
                    errorDescription.toLowerCase().includes('offline') ||
                    errorDescription.toLowerCase().includes('internet connection') ||
                    errorDescription.toLowerCase().includes('network') ||
                    errorDomain.includes('NSURLErrorDomain');

                  if (isNetworkError) {
                    console.log("⚠️ WebView network error detected - handled by connection monitoring");
                    // Don't show alert - the connection banner will handle this
                    // Network monitoring will automatically retry when connection is restored
                    return;
                  }

                  // Only show alert for non-network errors
                  Alert.alert(
                    "WebView Error",
                    `Failed to load payment page: ${errorDescription || 'Unknown error'}`,
                    [
                      {
                        text: "OK",
                        onPress: () => {
                          // Optionally reload the page
                          // webViewRef.current?.reload();
                        }
                      }
                    ]
                  );
                }}
                onHttpError={(e) => {
                  console.log("HTTP error:", e.nativeEvent);
                  const statusCode = e.nativeEvent.statusCode;
                  const description = e.nativeEvent.description || '';

                  // Don't show alert for network-related HTTP errors
                  // These are handled by the connection monitoring
                  if (statusCode === 0 || statusCode >= 500) {
                    console.log("⚠️ HTTP error likely due to network - handled by connection monitoring");
                    return;
                  }

                  // Only show alert for client errors (4xx) that aren't network-related
                  if (statusCode >= 400 && statusCode < 500) {
                    Alert.alert(
                      "HTTP Error",
                      `HTTP Error: ${statusCode} - ${description}`,
                      [
                        {
                          text: "OK",
                          onPress: () => {
                            // Optionally handle the error
                          }
                        }
                      ]
                    );
                  }
                }}
              />
            )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Exit Confirmation Modal */}
      <Modal
        visible={showExitModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleExitCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cancel Payment?</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to cancel this payment? This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleExitCancel}
              >
                <Text style={styles.cancelButtonText}>No, Continue</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleExitConfirm}
              >
                <Text style={styles.confirmButtonText}>Yes, Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.quaternary || '#F2E6D2',
  },
  safeAreaContainer: {
    flex: 1,
    backgroundColor: theme.colors.quaternary || '#F2E6D2',
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: theme.colors.quaternary || '#F2E6D2',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.quaternary || '#F2E6D2',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.primary,
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
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    marginHorizontal: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  webViewLoading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  webViewLoadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#555",
    fontWeight: "500",
  },
});
