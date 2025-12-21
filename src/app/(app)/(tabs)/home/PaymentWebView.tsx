import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Modal,
  StyleSheet,
  Alert,
  Text,
  TouchableOpacity,
  Linking,
  Platform,
  AppState,
  AppStateStatus,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { useLocalSearchParams, useRouter } from "expo-router";
import { usePaymentSocket } from "@/hooks/usePaymentSocket";
import { logger } from "@/utils/logger";
import useGlobalStore from "@/store/global.store";
import { InteractionManager } from "react-native";

export default function PaymentWebView() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);
  const paymentTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Moved from global to component-scoped ref
  const retryKeyRef = useRef(0); // For stable WebView key
  const [webViewError, setWebViewError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isMounted, setIsMounted] = useState(true);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [alertShown, setAlertShown] = useState(false); // Prevent multiple alerts
  const isNavigatingRef = useRef(false); // Track if navigation is in progress
  const upiInitiatedRef = useRef(false); // Track if UPI payment was initiated
  const appStateRef = useRef(AppState.currentState); // Track current app state
  const paymentStatusCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Timeout for checking payment status

  // Internal state to manage socket instance; consider ref if needed
  const [internalSocket, setInternalSocket] = useState<any>(null);

  // Validate params on mount
  useEffect(() => {
    try {
      // Enhanced URL validation
      if (!params.url || typeof params.url !== 'string' || params.url.trim() === '') {
        logger.crash(new Error("Missing or invalid payment URL"), { params });
        setWebViewError("Payment URL is missing or invalid. Please go back and try again.");
        return;
      }

      if (params.userDetails) {
        try {
          const parsed = JSON.parse(params.userDetails as string);
          if (!parsed || typeof parsed !== 'object') {
            throw new Error("Invalid userDetails structure");
          }
          logger.log("PaymentWebView - userDetails parsed successfully");
        } catch (parseError) {
          logger.crash(parseError as Error, {
            context: "Parsing userDetails in PaymentWebView",
            params,
          });
        }
      }
    } catch (error) {
      logger.crash(error as Error, {
        context: "PaymentWebView initialization",
        params,
      });
    }
  }, []);

  // Use your hook but add a way to get socket instance and connect/disconnect as needed
  const { socket, handleCancel } = usePaymentSocket({
    onPaymentSuccess: (data) => {
      // Prevent multiple navigation attempts
      if (isNavigatingRef.current) {
        logger.log("Navigation already in progress, skipping duplicate success callback");
        return;
      }
      isNavigatingRef.current = true;

      // Log complete payment success data (safely handle undefined values)
      try {
        const successLogData = {
          timestamp: new Date().toISOString(),
          fullResponse: data ? JSON.stringify(data, (key, value) => value === undefined ? null : value, 2) : 'null',
          paymentResponse: data?.paymentResponse || {},
          trackingId: data?.paymentResponse?.tracking_id || null,
          orderId: data?.paymentResponse?.order_id || null,
          amount: data?.paymentResponse?.amount || null,
          paymentMethod: data?.paymentResponse?.payment_method_type || null,
          status: data?.paymentResponse?.status || data?.status || null,
          txnDetail: data?.paymentResponse?.txn_detail || {},
        };

        logger.log("✅ PAYMENT SUCCESS - Complete Data Received:", successLogData);

        // Save to persistent storage (survives crashes) - only safe, serializable data
        logger.payment("PAYMENT SUCCESS", {
          trackingId: data?.paymentResponse?.tracking_id || null,
          orderId: data?.paymentResponse?.order_id || null,
          amount: data?.paymentResponse?.amount || null,
          status: data?.paymentResponse?.status || data?.status || null,
          timestamp: new Date().toISOString(),
        });
      } catch (logError) {
        // If logging fails, at least log the basic error
        logger.error("✅ PAYMENT SUCCESS - Error logging success data:", logError);
        logger.payment("PAYMENT SUCCESS", {
          error: "Failed to log full success data",
          timestamp: new Date().toISOString(),
        });
      }

      // Mark payment as completed FIRST to block any WebView navigation
      setPaymentCompleted(true);

      // Reset UPI flag since payment completed
      upiInitiatedRef.current = false;

      // Clear the payment timeout since payment completed successfully
      if (paymentTimeoutRef.current) {
        clearTimeout(paymentTimeoutRef.current);
        paymentTimeoutRef.current = null;
      }

      // Clear payment status check timeout
      if (paymentStatusCheckTimeoutRef.current) {
        clearTimeout(paymentStatusCheckTimeoutRef.current);
        paymentStatusCheckTimeoutRef.current = null;
      }

      // Disconnect socket with error handling
      try {
        if (socket?.connected) {
          socket.disconnect();
        }
      } catch (socketError) {
        logger.error("Error disconnecting socket on success:", socketError);
      }

      // Use setTimeout to ensure navigation happens after any pending WebView operations
      setTimeout(() => {
        // Check if component is still mounted
        if (!isMounted) {
          logger.log("Component unmounted, skipping navigation to success");
          isNavigatingRef.current = false;
          return;
        }

        // Check if navigation already happened
        if (!isNavigatingRef.current) {
          logger.log("Navigation flag reset, skipping duplicate navigation");
          return;
        }

        logger.log("Navigating to payment success page", {
          txnId: data?.paymentResponse?.tracking_id,
          orderId: data?.paymentResponse?.order_id,
          amount: data?.paymentResponse?.amount,
        });
        try {
          router.replace({
            pathname: "/(tabs)/home/payment-success",
            params: {
              txnId: data?.paymentResponse?.tracking_id,
              orderId: data?.paymentResponse?.order_id,
              amount: data?.paymentResponse?.amount,
            },
          });
        } catch (error) {
          logger.error("Error navigating to payment success:", error);
          isNavigatingRef.current = false; // Reset on error
        }
      }, 100);
    },
    onPaymentFailure: (data) => {
      // Prevent multiple navigation attempts
      if (isNavigatingRef.current) {
        logger.log("Navigation already in progress, skipping duplicate failure callback");
        return;
      }
      isNavigatingRef.current = true;

      // Log complete payment failure data (safely handle undefined values)
      try {
        const failureLogData = {
          timestamp: new Date().toISOString(),
          fullResponse: data ? JSON.stringify(data, (key, value) => value === undefined ? null : value, 2) : 'null',
          paymentResponse: data?.paymentResponse || {},
          trackingId: data?.paymentResponse?.tracking_id || null,
          orderId: data?.paymentResponse?.order_id || null,
          amount: data?.paymentResponse?.amount || null,
          status: data?.paymentResponse?.status || data?.status || null,
          txnDetail: data?.paymentResponse?.txn_detail || {},
          errorMessage: (data?.paymentResponse?.txn_detail as any)?.error_message || null,
          responseMessage: (data?.paymentResponse?.txn_detail as any)?.response_message || null,
        };

        logger.error("❌ PAYMENT FAILURE - Complete Data Received:", failureLogData);

        // Save to persistent storage (survives crashes) - only safe, serializable data
        logger.payment("PAYMENT FAILURE", {
          trackingId: data?.paymentResponse?.tracking_id || null,
          orderId: data?.paymentResponse?.order_id || null,
          amount: data?.paymentResponse?.amount || null,
          status: data?.paymentResponse?.status || data?.status || null,
          errorMessage: (data?.paymentResponse?.txn_detail as any)?.error_message || null,
          timestamp: new Date().toISOString(),
        });
      } catch (logError) {
        // If logging fails, at least log the basic error
        logger.error("❌ PAYMENT FAILURE - Error logging failure data:", logError);
        logger.payment("PAYMENT FAILURE", {
          error: "Failed to log full failure data",
          timestamp: new Date().toISOString(),
        });
      }

      // Mark payment as completed FIRST to block any WebView navigation
      setPaymentCompleted(true);

      // Reset UPI flag since payment completed
      upiInitiatedRef.current = false;

      // Clear the payment timeout since payment completed (failed)
      if (paymentTimeoutRef.current) {
        clearTimeout(paymentTimeoutRef.current);
        paymentTimeoutRef.current = null;
      }

      // Clear payment status check timeout
      if (paymentStatusCheckTimeoutRef.current) {
        clearTimeout(paymentStatusCheckTimeoutRef.current);
        paymentStatusCheckTimeoutRef.current = null;
      }

      // Disconnect socket with error handling
      try {
        if (socket?.connected) {
          socket.disconnect();
        }
      } catch (socketError) {
        logger.error("Error disconnecting socket on failure:", socketError);
      }

      // Use setTimeout to ensure navigation happens after any pending WebView operations
      setTimeout(() => {
        // Check if component is still mounted
        if (!isMounted) {
          logger.log("Component unmounted, skipping navigation to failure");
          isNavigatingRef.current = false;
          return;
        }

        // Check if navigation already happened
        if (!isNavigatingRef.current) {
          logger.log("Navigation flag reset, skipping duplicate navigation");
          return;
        }

        logger.log("Navigating to payment failure page", {
          orderId: data?.paymentResponse?.order_id,
          txnId: data?.paymentResponse?.tracking_id,
          amount: data?.paymentResponse?.amount,
        });
        try {
          router.replace({
            pathname: "/(tabs)/home/payment-failure",
            params: {
              message:
                (data?.paymentResponse?.txn_detail as any)?.error_message ||
                (data?.paymentResponse?.txn_detail as any)?.response_message ||
                "Payment Failed",
              orderId: data?.paymentResponse?.order_id,
              txnId: data?.paymentResponse?.tracking_id,
              amount: data?.paymentResponse?.amount,
              status: data?.paymentResponse?.txn_detail?.status,
            },
          });
        } catch (error) {
          logger.error("Error navigating to payment failure:", error);
          isNavigatingRef.current = false; // Reset on error
        }
      }, 100);
    },
    onPaymentError: (error) => {
      // Only handle errors if component is still mounted and payment hasn't completed
      if (!isMounted || paymentCompleted || alertShown) {
        logger.log("Component unmounted, payment completed, or alert already shown - ignoring payment error");
        return;
      }

      if (error?.error === "Disconnected") {
        // Handle transport errors differently - don't show error alert
        if (error?.isTransportError) {
          logger.log("Transport error detected, webview will handle reload automatically");
          return;
        }

        // Show immediate alert for disconnection (no timeout)
        setAlertShown(true);
        Alert.alert(
          "Payment Error",
          "Lost connection to payment server. Please try again.",
          [
            {
              text: "OK",
              onPress: () => {
                setAlertShown(false);
                router.back();
              },
            },
          ]
        );
        return;
      }
      // Only show alert if component is still mounted and payment hasn't completed
      if (isMounted && !paymentCompleted && !alertShown) {
        setAlertShown(true);
        Alert.alert(
          "Payment Error",
          error?.message ||
          "An error occurred during payment processing. Please try again.",
          [
            {
              text: "OK",
              onPress: () => {
                setAlertShown(false);
                router.back();
              },
            },
          ]
        );
      }
    },
    onPaymentExpired: () => {
      try {
        if (socket?.connected) {
          socket.disconnect();
        }
      } catch (socketError) {
        logger.error("Error disconnecting socket on expired:", socketError);
      }
      // Only show alert if component is still mounted and payment hasn't completed
      if (isMounted && !paymentCompleted && !alertShown) {
        setAlertShown(true);
        Alert.alert(
          "Payment Expired",
          "Your payment session has expired. Please try again to complete the transaction.",
          [
            {
              text: "OK",
              onPress: () => {
                setAlertShown(false);
                router.back();
              },
            },
          ]
        );
      }
    },
    parsedUserDetails: (() => {
      try {
        if (params.userDetails && typeof params.userDetails === 'string') {
          const parsed = JSON.parse(params.userDetails);
          if (parsed && typeof parsed === 'object') {
            return parsed;
          }
        }
        return null;
      } catch (error) {
        logger.crash(error as Error, {
          context: "Parsing userDetails for usePaymentSocket",
          params,
        });
        return null;
      }
    })(),
    router,
    orderId: params.orderId ? String(params.orderId) : "",
  });

  // Save socket to internal state for manipulation on reload
  useEffect(() => {
    setInternalSocket(socket);
  }, [socket]);

  // Get socket connection status for dependency (avoid object reference changes)
  const socketConnected = internalSocket?.connected ?? false;

  // Handle AppState changes to detect when returning from UPI app
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      logger.log("📱 [PaymentWebView] AppState changed", {
        previousState: appStateRef.current,
        nextState: nextAppState,
        upiInitiated: upiInitiatedRef.current,
        paymentCompleted: paymentCompleted,
        socketConnected: internalSocket?.connected,
      });

      // If app was in background and is now active, and UPI was initiated
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        if (upiInitiatedRef.current && !paymentCompleted) {
          logger.log("📱 [PaymentWebView] App returned from background - UPI payment may be in progress, waiting for socket status");

          // Clear any existing timeout
          if (paymentStatusCheckTimeoutRef.current) {
            clearTimeout(paymentStatusCheckTimeoutRef.current);
            paymentStatusCheckTimeoutRef.current = null;
          }

          // Wait for socket to receive payment status (give it time to process)
          // Don't reload WebView immediately - wait for socket to handle payment status
          paymentStatusCheckTimeoutRef.current = setTimeout(() => {
            // Check if component is still mounted
            if (!isMounted) {
              logger.log("📱 [PaymentWebView] Component unmounted, skipping status check");
              return;
            }

            // Only check if payment hasn't completed and socket is still connected
            if (!paymentCompleted && internalSocket?.connected) {
              logger.log("📱 [PaymentWebView] Socket still connected after return from UPI - payment status should be received soon");
              // Socket is connected, it should receive payment status soon
              // Don't reload - just wait
            } else if (paymentCompleted) {
              logger.log("📱 [PaymentWebView] Payment already completed, no action needed");
            } else if (!internalSocket?.connected) {
              logger.log("📱 [PaymentWebView] Socket disconnected after return from UPI - payment may have completed");
              // Socket disconnected might mean payment completed
              // Wait a bit more before reloading
              setTimeout(() => {
                if (!paymentCompleted && isMounted && webViewRef.current) {
                  logger.log("📱 [PaymentWebView] Payment status not received, reloading WebView to check status");
                  webViewRef.current.reload();
                }
              }, 2000); // Wait 2 more seconds before reloading
            }
          }, 5000); // Wait 5 seconds for socket to receive payment status
        }
      }

      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
      if (paymentStatusCheckTimeoutRef.current) {
        clearTimeout(paymentStatusCheckTimeoutRef.current);
        paymentStatusCheckTimeoutRef.current = null;
      }
    };
  }, [paymentCompleted, socketConnected, isMounted]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      setIsMounted(false);
      if (paymentTimeoutRef.current) {
        clearTimeout(paymentTimeoutRef.current);
        paymentTimeoutRef.current = null;
      }
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
        errorTimeoutRef.current = null;
      }
      if (paymentStatusCheckTimeoutRef.current) {
        clearTimeout(paymentStatusCheckTimeoutRef.current);
        paymentStatusCheckTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      try {
        if (internalSocket?.connected) {
          internalSocket.disconnect();
        }
      } catch (socketError) {
        logger.error("Error disconnecting socket on unmount:", socketError);
      }
    };
  }, [internalSocket]);

  const handleRetry = () => {
    try {
      if (internalSocket?.connected) {
        internalSocket.disconnect();
      }
    } catch (socketError) {
      logger.error("Error disconnecting socket on retry:", socketError);
    }
    retryKeyRef.current += 1; // Increment retry key for stable WebView remount
    setIsRetrying(true);
    setWebViewError(null);
    webViewRef.current?.reload();

    // socket reconnection handled in onWebViewLoadEnd
  };

  const onWebViewLoadEnd = () => {
    logger.log("WebView loaded, checking socket connection");
    if (isRetrying) {
      // Socket reconnection is handled automatically by the usePaymentSocket hook
      logger.log(
        "WebView retry completed, socket should reconnect automatically"
      );
      // Reset retry state
      setIsRetrying(false);
    }
  };

  const handleGoBack = () => {
    logger.log("Back button pressed, setting showExitModal to true");
    setShowExitModal(true);
  };

  const handleConfirmExit = () => {
    logger.log("Confirm exit pressed, navigating to paymentNewOverView");
    try {
      if (internalSocket?.connected) {
        internalSocket.disconnect();
      }
    } catch (socketError) {
      logger.error("Error disconnecting socket on exit:", socketError);
    }
    setShowExitModal(false);

    try {
      // Get payment session from global store
      const paymentSession = useGlobalStore.getState().getCurrentPaymentSession();

      if (paymentSession?.userDetails) {
        logger.log("Navigating to paymentNewOverView using payment session from global store");

        // Prepare userDetails for navigation (exclude orderId for retry)
        const userDetailsForNav = {
          ...paymentSession.userDetails,
          amount: paymentSession.amount || params.amount,
          // Remove orderId as we'll get a new one
          orderId: undefined,
        };

        // Safely stringify userDetails
        let userDetailsString: string;
        try {
          userDetailsString = JSON.stringify(userDetailsForNav);
        } catch (stringifyError) {
          logger.error("Error stringifying userDetails in handleConfirmExit:", stringifyError);
          Alert.alert("Error", "Failed to prepare navigation data. Please try again.");
          return;
        }

        // Prepare navigation params with fallbacks
        const navigationParams: any = {
          pathname: "/(tabs)/home/paymentNewOverView",
          params: {
            amount: String(paymentSession.amount || params.amount || 0),
            userDetails: userDetailsString,
          },
        };

        // Add optional params only if they exist
        const userDetails = paymentSession.userDetails as any; // Type assertion for additional fields

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
        navigationParams.params.source = userDetails.source || "payment_webview_exit";

        // Use InteractionManager to ensure UI is ready before navigation
        InteractionManager.runAfterInteractions(() => {
          try {
            router.replace(navigationParams);
            logger.log("Navigated to paymentNewOverView from PaymentWebView exit", {
              amount: navigationParams.params.amount,
              hasUserDetails: !!navigationParams.params.userDetails,
            });
          } catch (navError) {
            logger.error("Error navigating to paymentNewOverView:", navError);
            // Fallback: try to go back
            router.back();
          }
        });
      } else {
        // No payment session found, try to navigate back to payment overview
        logger.warn("No payment session found for exit, navigating back");
        router.back();
      }
    } catch (error) {
      logger.error("Error in handleConfirmExit:", error);
      // Fallback: navigate back
      router.back();
    }
  };

  const handleCancelExit = () => {
    setShowExitModal(false);
  };

  // Early return if URL is invalid (before rendering WebView)
  if (!params.url || typeof params.url !== 'string' || params.url.trim() === '') {
    return (
      <Modal visible animationType="slide" presentationStyle="fullScreen">
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
          <View style={styles.container}>
            <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? insets.top + 1 : 1 }]}>
              <TouchableOpacity
                style={styles.headerBackButton}
                onPress={handleGoBack}
              >
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Payment Gateway</Text>
              <View style={styles.placeholder} />
            </View>

            <View style={styles.errorContainer}>
              <Text style={styles.errorTitle}>Payment Gateway Error</Text>
              <Text style={styles.errorMessage}>Invalid payment URL. Please go back and try again.</Text>
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={handleGoBack}
                >
                  <Text style={styles.buttonText}>Go Back</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  if (webViewError) {
    return (
      <Modal visible animationType="slide" presentationStyle="fullScreen">
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
          <View style={styles.container}>
            <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? insets.top + 1 : 1 }]}>
              <TouchableOpacity
                style={styles.headerBackButton}
                onPress={handleGoBack}
              >
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Payment Gateway</Text>
              <View style={styles.placeholder} />
            </View>

            <View style={styles.errorContainer}>
              <Text style={styles.errorTitle}>Payment Gateway Error</Text>
              <Text style={styles.errorMessage}>{webViewError}</Text>
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={handleRetry}
                >
                  <Text style={styles.buttonText}>Retry</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={handleGoBack}
                >
                  <Text style={styles.buttonText}>Go Back</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.container}>
          <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? insets.top + 12 : 12 }]}>
            <TouchableOpacity
              style={styles.headerBackButton}
              onPress={handleGoBack}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Payment Gateway</Text>
            <View style={styles.placeholder} />
          </View>

          <WebView
            ref={webViewRef}
            key={isRetrying ? `webview-retry-${retryKeyRef.current}` : "webview"}
            source={{ uri: params.url }}
            style={{ flex: 1 }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            originWhitelist={["*"]}
            startInLoadingState={true}
            allowsInlineMediaPlayback={true}
            sharedCookiesEnabled={true}
            thirdPartyCookiesEnabled={true}
            cacheEnabled={true}
            incognito={false}
            onNavigationStateChange={(navState: any) => {
              // Block all navigation if payment is already completed
              if (paymentCompleted) {
                logger.log("Payment completed, blocking WebView navigation");
                return;
              }

              logger.log("Payment Navigation State:", navState, {
                url: navState.url,
                title: navState.title,
                loading: navState.loading,
                canGoBack: navState.canGoBack,
              });

              // Save critical payment navigation to persistent storage (survives crashes)
              logger.payment("Navigation State Change", {
                url: navState.url?.substring(0, 200), // Limit URL length
                title: navState.title,
                loading: navState.loading,
                canGoBack: navState.canGoBack,
                timestamp: new Date().toISOString(),
              });

              if (
                navState.title &&
                typeof navState.title === 'string' &&
                navState.title.toLowerCase().includes("browser error")
              ) {
                logger.log("Browser error detected:", navState.title);
                setWebViewError(
                  "The payment gateway encountered a browser error. This usually indicates a temporary technical issue."
                );
                return;
              }

              // Validate navState.url before using toLowerCase
              if (!navState.url || typeof navState.url !== 'string') {
                logger.warn("Invalid URL in navigation state:", navState);
                return;
              }

              const currentUrl = navState.url.toLowerCase();

              // Check for success URLs
              if (
                currentUrl.includes("/success") ||
                currentUrl.includes("status=success") ||
                currentUrl.includes("payment=success") ||
                (currentUrl.includes("payment") && currentUrl.includes("status=success"))
              ) {
                logger.log("Success URL detected in WebView, waiting for socket confirmation");
                // Don't navigate yet - let socket handle it to ensure we have proper payment data
                return;
              }

              // Check for failure/cancel URLs
              if (
                currentUrl.includes("/cancel") ||
                currentUrl.includes("/error") ||
                currentUrl.includes("/failed") ||
                currentUrl.includes("status=failed") ||
                (currentUrl.includes("payment") &&
                  currentUrl.includes("status=failed"))
              ) {
                logger.log("Failure/Cancel URL detected, handling cancellation");
                try {
                  if (internalSocket?.connected) {
                    internalSocket.disconnect();
                  }
                } catch (socketError) {
                  logger.error("Error disconnecting socket on cancel URL:", socketError);
                }
                handleCancel();
              }
            }}
            onError={(err) => {
              logger.log("WebView Error:", err);
              setWebViewError(
                "Failed to load the payment page. Please check your internet connection and try again."
              );
            }}
            onHttpError={(e) => {
              logger.log("HTTP error:", e.nativeEvent);
              if (e.nativeEvent.statusCode >= 400) {
                setWebViewError(
                  `Payment gateway error (${e.nativeEvent.statusCode}). Please try again later.`
                );
              }
            }}
            onLoadEnd={onWebViewLoadEnd}
            onShouldStartLoadWithRequest={(request) => {
              try {
                // Block all navigation if payment is already completed
                if (paymentCompleted) {
                  logger.log("Payment completed, blocking WebView navigation to:", request?.url);
                  return false;
                }

                // Validate request object
                if (!request || !request.url) {
                  logger.warn("Invalid request object in onShouldStartLoadWithRequest");
                  return true; // Allow default behavior on invalid request
                }

                logger.log("Intercepted URL:", request.url);

                // Check for success/failure URLs and block them - let socket handle navigation
                const url = request.url.toLowerCase();
                if (
                  url.includes("/success") ||
                  url.includes("status=success") ||
                  url.includes("payment=success") ||
                  url.includes("/failed") ||
                  url.includes("status=failed") ||
                  url.includes("/cancel")
                ) {
                  logger.log("Payment status URL detected, blocking WebView navigation - socket will handle");
                  // Block navigation - socket will handle the navigation with proper data
                  return false;
                }

                if (request.url.startsWith("upi:")) {
                  logger.log("UPI URL intercepted, attempting to open UPI app");

                  // Mark that UPI payment was initiated
                  upiInitiatedRef.current = true;

                  // Clear any existing payment timeout before setting a new one
                  if (paymentTimeoutRef.current) {
                    clearTimeout(paymentTimeoutRef.current);
                    paymentTimeoutRef.current = null;
                  }

                  // Check if UPI app is available before trying to open
                  Linking.canOpenURL(request.url).then((supported) => {
                    if (!supported) {
                      logger.warn("No app installed to handle UPI URL:", request.url);
                      Alert.alert(
                        "No UPI App Found",
                        "Please install a UPI app (like PhonePe, Google Pay, Paytm) to complete the payment.",
                        [
                          { text: "OK", onPress: () => upiInitiatedRef.current = false } // Reset flag
                        ]
                      );
                      return;
                    }

                    return Linking.openURL(request.url);
                  }).catch((error) => {
                    logger.error("Failed to open UPI URL:", error);
                    // Handle specific "No Activity found" error if checking failed or openURL failed
                    if (error.message && (error.message.includes("No Activity found") || error.message.includes("Could not open URL"))) {
                       Alert.alert(
                        "No UPI App Found",
                        "Please install a UPI app (like PhonePe, Google Pay, Paytm) to complete the payment.",
                        [
                          { 
                            text: "OK", 
                            onPress: () => {
                               logger.log("UPI alert dismissed, reloading webview");
                               upiInitiatedRef.current = false;
                               if (webViewRef.current) webViewRef.current.reload();
                            }
                          }
                        ]
                      );
                    } else {
                       Alert.alert("Payment Error", "Could not launch UPI app. Please try again.");
                    }
                  });

                  // Don't check socket connection immediately after UPI interception
                  // Instead, wait for app to return from UPI app (handled by AppState listener)
                  // The AppState listener will wait for socket to receive payment status
                  logger.log("UPI app opened - waiting for user to return and socket to receive payment status");

                  // Set a longer timeout as fallback (only if payment hasn't completed after a long time)
                  // This is a safety net - the AppState listener handles the main flow
                  const timeoutId = setTimeout(() => {
                    // Check if component is still mounted and payment hasn't completed
                    if (!isMounted || paymentCompleted) {
                      logger.log("Component unmounted or payment completed, skipping timeout alert");
                      return;
                    }

                    // Only show alert if payment hasn't completed after a very long time (30 seconds)
                    // This gives plenty of time for socket to receive payment status
                    if (isMounted && !paymentCompleted && typeof router.canGoBack === 'function' && router.canGoBack()) {
                      logger.log("Payment timeout reached - showing alert to user");
                      Alert.alert(
                        "Payment Status",
                        "Waiting for payment confirmation. Please check your UPI app or try again.",
                        [
                          {
                            text: "Retry",
                            onPress: () => {
                              // Reset UPI flag and reload webview
                              logger.log("Payment retry requested, reloading webview");
                              upiInitiatedRef.current = false;
                              if (webViewRef.current) {
                                webViewRef.current.reload();
                              }
                            },
                          },
                          {
                            text: "Cancel",
                            style: "cancel",
                            onPress: () => {
                              // Only disconnect socket if user explicitly cancels
                              logger.log("Payment cancelled by user");
                              upiInitiatedRef.current = false;
                              try {
                                if (internalSocket?.connected) {
                                  internalSocket.disconnect();
                                }
                              } catch (socketError) {
                                logger.error("Error disconnecting socket on cancel:", socketError);
                              }
                              handleCancel();
                            }
                          },
                        ]
                      );
                    }
                  }, 30000); // 30 seconds - very long timeout as fallback

                  // Store timeout ID to clear it if payment completes
                  paymentTimeoutRef.current = timeoutId;

                  return false;
                }

                return true;
              } catch (error) {
                logger.error("Error in onShouldStartLoadWithRequest:", error);
                return true; // Allow navigation on error to prevent blocking
              }
            }}
          />
        </View>

        <Modal
          visible={showExitModal}
          transparent={true}
          animationType="fade"
          onRequestClose={handleCancelExit}
        >
          <SafeAreaView style={styles.modalOverlay} edges={['top', 'bottom', 'left', 'right']}>
            <View style={styles.exitModalContent}>
              <Text style={styles.exitModalTitle}>Leave Payment?</Text>
              <Text style={styles.exitModalMessage}>
                Are you sure you want to leave the payment page? Your payment
                session will be cancelled.
              </Text>
              <View style={styles.exitModalButtons}>
                <TouchableOpacity
                  style={styles.exitModalCancelButton}
                  onPress={handleCancelExit}
                >
                  <Text style={styles.exitModalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.exitModalConfirmButton}
                  onPress={handleConfirmExit}
                >
                  <Text style={styles.exitModalConfirmButtonText}>Leave</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
}
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#1a2a39",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.select({
      ios: 12,
      android: 12,
    }),
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerBackButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  backButtonText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    textAlign: "center",
  },
  placeholder: {
    width: 60,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    marginTop: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#e74c3c",
    marginBottom: 20,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    maxWidth: 300,
  },
  retryButton: {
    backgroundColor: "#3498db",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    minWidth: 120,
    alignItems: "center",
  },
  backButton: {
    backgroundColor: "#95a5a6",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    minWidth: 120,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  exitModalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    margin: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    maxWidth: 400,
    zIndex: 1000,
  },
  exitModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 16,
  },
  exitModalMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  exitModalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    minHeight: 50,
  },
  exitModalCancelButton: {
    flex: 1,
    backgroundColor: "#95a5a6",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    minWidth: 80,
  },
  exitModalCancelButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  exitModalConfirmButton: {
    flex: 1,
    backgroundColor: "#e74c3c",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    minWidth: 80,
  },
  exitModalConfirmButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});

