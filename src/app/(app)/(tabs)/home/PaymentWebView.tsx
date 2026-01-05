import React, { useEffect, useState, useRef } from "react";
import { View, Modal, StyleSheet, Alert, Text, TouchableOpacity, ActivityIndicator, Platform, StatusBar } from "react-native";
import { WebView } from "react-native-webview";
import { useLocalSearchParams, useRouter } from "expo-router";
import { usePaymentSocket } from "@/hooks/usePaymentSocket";
import { SafeAreaView } from "react-native-safe-area-context";
import NetInfo from "@react-native-community/netinfo";
import { theme } from "@/constants/theme";

export default function PaymentWebView() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const urlBlockedAlertShown = useRef(false);
  const webViewRef = useRef<any>(null);
  const wasDisconnectedRef = useRef(false);

  // Debug logging
  useEffect(() => {
    console.log("PaymentWebView params:", {
        url: params.url,
        orderId: params.orderId,
        hasUserDetails: !!params.userDetails
    });
  }, [params]);

  const { socket, isSocketConnected, handleCancel } = usePaymentSocket({
    onPaymentSuccess: (data) => {
      // Disconnect socket before navigation (safety check, though hook handles it)
      if (socket && socket.connected) {
        socket.disconnect();
      }

      console.log("params.userDetails", params.userDetails);
      const userDetails = params.userDetails ? JSON.parse(params.userDetails as string) : {};

      const routerParams = {
        pathname: "/(tabs)/home/payment-success",
        params: {
          txnId: data?.paymentResponse?.txn_id,
          orderId: data?.paymentResponse?.order_id,
          amount: data?.paymentResponse?.amount,
          investmentId: userDetails?.investmentId,
          schemeType: userDetails?.schemeType,
          paymentFrequency: userDetails?.paymentFrequency,
        },
      } as const;
      
      console.log("Navigating to success:", routerParams);
      router.replace(routerParams);
    },
    onPaymentFailure: (data) => {
      if (socket && socket.connected) {
        socket.disconnect();
      }
      router.replace({
        pathname: "/(tabs)/home/payment-failure",
        params: {
          message:
            data?.paymentResponse?.txn_detail?.error_message ||
            data?.paymentResponse?.txn_detail?.response_message ||
            data?.paymentResponse?.payment_gateway_response?.resp_message ||
            "Payment Failed",
          orderId: data?.paymentResponse?.order_id,
          txnId: data?.paymentResponse?.txn_id,
          amount: data?.paymentResponse?.amount,
          status: data?.paymentResponse?.txn_detail?.status,
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
    parsedUserDetails: params.userDetails
      ? JSON.parse(params.userDetails as string)
      : null,
    router,
    orderId: params.orderId as string,
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

  // Clean up socket on unmount
  useEffect(() => {
    return () => {
      if (socket && socket.connected) {
        socket.disconnect();
      }
    };
  }, [socket]);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      <Modal visible={true} animationType="slide" presentationStyle="fullScreen" onRequestClose={handleBackPress}>
        <View style={styles.container}>
          {/* Loading overlay when cancelling */}
          {isCancelling && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Cancelling payment...</Text>
            </View>
          )}
          
          <SafeAreaView style={styles.safeAreaContainer}>
            {/* Header */}
            <View style={styles.header}>
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

              {/* Socket Connection Loading State */}
              {!isSocketConnected ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text style={styles.loadingText}>Initializing secure connection...</Text>
                </View>
              ) : (
                <WebView
                    ref={webViewRef}
                    source={{
                        uri: params.url as string,
                        headers: Platform.OS === 'android' ? {
                            'User-Agent': "Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36",
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                            'Upgrade-Insecure-Requests': '1',
                        } : undefined
                    }}
                    style={{ flex: 1 }}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    originWhitelist={["*"]}
                    startInLoadingState={true}
                    allowsInlineMediaPlayback={true}
                    thirdPartyCookiesEnabled={true}
                    sharedCookiesEnabled={true}
                    textZoom={100}
                    scalesPageToFit={true}
                    overScrollMode="never"
                    mixedContentMode="always"
                    setSupportMultipleWindows={false}
                    cacheEnabled={true}
                    
                    onNavigationStateChange={(navState) => {
                        console.log("Nav State:", navState);

                        // Block 'about:blank' loops
                        if (navState.url === "about:blank" && !navState.loading) {
                            if (socket && socket.connected) socket.disconnect();
                            
                            Alert.alert("URL Blocked", "The payment URL was blocked.", [
                                { text: "OK", onPress: () => {
                                    router.replace({
                                        pathname: "/(tabs)/home/payment-failure",
                                        params: { message: "Payment URL blocked", orderId: params.orderId as string, status: "blocked" }
                                    });
                                }}
                            ]);
                            return;
                        }

                        const currentUrl = navState.url.toLowerCase();
                        if (currentUrl.includes("/cancel") || currentUrl.includes("/error") || (currentUrl.includes("payment") && currentUrl.includes("status=failed"))) {
                            handleCancel();
                        }
                    }}
                    
                    onError={(syntheticEvent) => {
                        const { nativeEvent } = syntheticEvent;
                        console.warn('WebView error: ', nativeEvent);
                    }}
                    onHttpError={(syntheticEvent) => {
                         const { nativeEvent } = syntheticEvent;
                         console.warn('WebView HTTP error: ', nativeEvent);
                    }}
                />
              )}
            </View>
          </SafeAreaView>
        </View>
      </Modal>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 40 : 12,
    paddingBottom: 12,
    backgroundColor: theme.colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.primary,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});
