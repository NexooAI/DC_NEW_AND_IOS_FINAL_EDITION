import React, { useEffect, useState, useRef } from "react";
import { View, Modal, StyleSheet, Alert, Text, TouchableOpacity, ActivityIndicator, Platform, StatusBar, Linking } from "react-native";
import { WebView } from "react-native-webview";
import { useLocalSearchParams, useRouter } from "expo-router";
import { usePaymentSocket } from "@/hooks/usePaymentSocket";
import { SafeAreaView } from "react-native-safe-area-context";
import NetInfo from "@react-native-community/netinfo";
import { hp } from "@/utils/responsiveUtils";
import { theme } from "@/constants/theme";

// import { safeNavigateBack } from "@/utils/navigationUtils";
// import your socket library here if needed

let errorTimeout: NodeJS.Timeout | null = null;

export default function PaymentWebView() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [showExitModal, setShowExitModal] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const urlBlockedAlertShown = useRef(false);
  const webViewRef = useRef<any>(null);
  const wasDisconnectedRef = useRef(false);

  // Debug logging
  console.log("PaymentWebView params:", {
    url: params.url,
    orderId: params.orderId,
    hasUserDetails: !!params.userDetails
  });

  const { socket, handleCancel } = usePaymentSocket({
  onPaymentSuccess: (data) => {
      // Disconnect socket before navigation
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
      }
      console.log("routerParams", routerParams);
      
      router.replace(routerParams);
    },
    onPaymentFailure: (data) => {
      // Disconnect socket before navigation
      if (socket && socket.connected) {
        socket.disconnect();
      }
      router.replace({
        pathname: "/(tabs)/home/payment-failure",
        params: {
          message:
            (data?.paymentResponse?.txn_detail as any)?.error_message ||
            (data?.paymentResponse?.txn_detail as any)?.response_message ||
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
        console.log("⚠️ Payment error due to disconnection - handled automatically, not showing alert");
        // Network monitoring and reconnection logic will handle this
        // Don't show alert or navigate back
        return;
      }

      // Only show alert for non-network related errors
      // These are actual payment processing errors, not connection issues
      console.log("⚠️ Payment error (non-network):", error);
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
    parsedUserDetails: params.userDetails
      ? JSON.parse(params.userDetails as string)
      : null,
    router,
    orderId: params.orderId as string,
  });

  // Handle back button press
  const handleBackPress = () => {
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

    // Disconnect socket
    if (socket && socket.connected) {
      console.log("Disconnecting socket...");
      socket.disconnect();
    }

    // Small delay to ensure socket disconnection completes, then navigate to payment failure page
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

  // Handle WebView requests
  const handleShouldStartLoadWithRequest = (request: any) => {
    const { url } = request;
    console.log("WebView attempting to load:", url);

    // Allow http/https and about:blank
    if (
      url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("about:blank")
    ) {
      return true;
    }

    // Handle special schemes (tez://, upi://, phonepe://, etc.)
    // We try to open them in the respective app
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          // Even if canOpenURL returns false (due to visibility queries issues on Android 11+),
          // we should still TRY to open it, as it might just work if the app is installed.
          // This serves as a fail-safe.
          console.log("canOpenURL returned false, but attempting to open anyway:", url);
          return Linking.openURL(url).catch((err) => {
            console.log("Failed to open URL forcibly:", err);
            // If it really fails, THEN show the alert
            Alert.alert(
              "Payment App Not Found", 
              "Could not open the selected payment app. Please install it or try another method.",
              [{ text: "OK", onPress: () => {} }]
            );
            // Throw to prevent the next catch block from thinking it succeeded? 
            // Actually catching it here is enough.
          });
        }
      })
      .catch((err) => {
          console.error("An error occurred handling the URL:", err);
          // Only show generic error if we haven't already shown specific one
          // (Logic simplified above to handle openURL failure directly)
      });

    return false;
  };

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
            {/* Header with back button */}
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

            {Platform.OS === 'android' ? (
              <WebView
                ref={webViewRef}
                source={{ uri: params.url as string }}
                style={{ flex: 1 }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                originWhitelist={["*"]}
                startInLoadingState={true}
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
                  console.log("WebView started loading:", params.url);
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
                  if (
                    currentUrl.includes("/cancel") ||
                    currentUrl.includes("/error") ||
                    currentUrl.includes("/failed") ||
                    (currentUrl.includes("payment") &&
                      currentUrl.includes("status=failed"))
                  ) {
                    if (socket && socket.connected) {
                      socket.disconnect();
                    }
                    handleCancel();
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
                source={{ uri: params.url as string }}
                style={{ flex: 1 }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                originWhitelist={["*"]}
                startInLoadingState={true}
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
                  console.log("WebView started loading:", params.url);
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
                  if (
                    currentUrl.includes("/cancel") ||
                    currentUrl.includes("/error") ||
                    currentUrl.includes("/failed") ||
                    (currentUrl.includes("payment") &&
                      currentUrl.includes("status=failed"))
                  ) {
                    if (socket && socket.connected) {
                      socket.disconnect();
                    }
                    handleCancel();
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
          </SafeAreaView>
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
});
