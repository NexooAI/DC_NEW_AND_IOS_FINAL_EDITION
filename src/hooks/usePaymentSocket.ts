import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useRouter } from "expo-router";
import { AppState, AppStateStatus } from "react-native";
import { theme } from "@/constants/theme";
import { logger } from "@/utils/logger";

interface PaymentSocketProps {
  onPaymentSuccess?: (data: any) => void;
  onPaymentFailure?: (data: any) => void;
  onPaymentError?: (error: any) => void;
  onPaymentExpired?: () => void;
  onStopPolling?: () => void; // Called when socket reconnects so polling can be cancelled
  parsedUserDetails: any;
  router: ReturnType<typeof useRouter>;
  orderId?: string;
  bookingId?: string;
  type?: 'scheme' | 'bill' | 'advance_booking' | 'booking';
  amount?: string;
}

export const usePaymentSocket = ({
  onPaymentSuccess,
  onPaymentFailure,
  onPaymentError,
  onPaymentExpired,
  onStopPolling,
  parsedUserDetails,
  router,
  orderId,
  bookingId,
  type,
  amount,
}: PaymentSocketProps) => {
  const socketRef = useRef<Socket | null>(null);
  const isPaymentCompleted = useRef(false);

  // Keep latest callbacks and user details in refs so the socket effect never needs to re-run
  // when only callbacks or user details change (avoids creating duplicate socket connections).
  const onPaymentSuccessRef = useRef(onPaymentSuccess);
  const onPaymentFailureRef = useRef(onPaymentFailure);
  const onPaymentErrorRef = useRef(onPaymentError);
  const onPaymentExpiredRef = useRef(onPaymentExpired);
  const onStopPollingRef = useRef(onStopPolling);
  const parsedUserDetailsRef = useRef(parsedUserDetails);

  useEffect(() => { onPaymentSuccessRef.current = onPaymentSuccess; }, [onPaymentSuccess]);
  useEffect(() => { onPaymentFailureRef.current = onPaymentFailure; }, [onPaymentFailure]);
  useEffect(() => { onPaymentErrorRef.current = onPaymentError; }, [onPaymentError]);
  useEffect(() => { onPaymentExpiredRef.current = onPaymentExpired; }, [onPaymentExpired]);
  useEffect(() => { onStopPollingRef.current = onStopPolling; }, [onStopPolling]);
  useEffect(() => { parsedUserDetailsRef.current = parsedUserDetails; }, [parsedUserDetails]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log("🔌 [usePaymentSocket] Forcibly disconnecting socket");
      socketRef.current.disconnect();
    }
  }, []);

  useEffect(() => {
    // Initialize socket connection using theme.baseUrl
    const socketInstance = io(theme.baseUrl, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socketInstance;

    // Handle connection events
    socketInstance.on("connect", () => {
      const currentOrderId = orderId || parsedUserDetailsRef.current?.orderId;
      console.log("=== SOCKET CONNECTION DEBUG ===");
      console.log("✅ Socket connected successfully!");
      console.log("Socket ID:", socketInstance.id);
      console.log("Socket connected status:", socketInstance.connected);
      console.log("Current orderId:", currentOrderId);
      console.log("parsedUserDetailsRef.current?.orderId:", parsedUserDetailsRef.current?.orderId);

      // If polling was started as a fallback, stop it now that socket is back
      if (onStopPollingRef.current) {
        console.log("🛑 Socket reconnected — stopping fallback polling");
        onStopPollingRef.current();
      }

      if (currentOrderId) {
        console.log("🎯 Emitting joinOrderRoom for orderId:", currentOrderId);
        socketInstance.emit("joinOrderRoom", currentOrderId);
        console.log("✅ joinOrderRoom emission completed");

        // Emit store_payment_metadata after successful connection
        const paymentMetadata = {
          orderId: currentOrderId,
          userMobile: parsedUserDetailsRef.current?.data?.data?.mobile || parsedUserDetailsRef.current?.mobile || parsedUserDetailsRef.current?.userMobile || "",
          investmentId: (type === 'bill' || type === 'advance_booking' || type === 'booking') ? 0 : (parsedUserDetailsRef.current?.data?.data?.id || parsedUserDetailsRef.current?.id || parsedUserDetailsRef.current?.investmentId || 0),
          userId: parsedUserDetailsRef.current?.data?.data?.userId || parsedUserDetailsRef.current?.userId || parsedUserDetailsRef.current?.id || 101,
          schemeId: (type === 'bill' || type === 'advance_booking' || type === 'booking') ? 0 : (parsedUserDetailsRef.current?.data?.data?.schemeId || parsedUserDetailsRef.current?.schemeId || 0),
          chitId: (type === 'bill' || type === 'advance_booking' || type === 'booking') ? 0 : (parsedUserDetailsRef.current?.data?.data?.chitId || parsedUserDetailsRef.current?.chitId || 0),
          amount: amount || parsedUserDetailsRef.current?.data?.data?.amount || parsedUserDetailsRef.current?.amount || 0,
          isManual: "no",
          utr_reference_number: "",
          accountNumber: parsedUserDetailsRef.current?.data?.data?.accountNo || parsedUserDetailsRef.current?.accountNo || parsedUserDetailsRef.current?.accNo || parsedUserDetailsRef.current?.accountNumber || "",
          accountName: parsedUserDetailsRef.current?.data?.data?.accountName || parsedUserDetailsRef.current?.accountName || parsedUserDetailsRef.current?.accountname || parsedUserDetailsRef.current?.name || "",
          bookingId: bookingId || "",
          type: type === 'booking' ? 'advance_booking' : (type || 'scheme')
        };

        console.log("🎯 Emitting store_payment_metadata:", paymentMetadata);
        socketInstance.emit("store_payment_metadata", paymentMetadata);
        console.log("✅ store_payment_metadata emission completed");
      } else {
        console.warn("⚠️ No orderId found on connect");
        console.log("Available orderId sources:");
        console.log("- orderId prop:", orderId);
        console.log("- parsedUserDetailsRef?.orderId:", parsedUserDetailsRef.current?.orderId);
      }
    });

    socketInstance.on("connect_error", (error) => {
      console.error("=== SOCKET CONNECTION ERROR ===");
      console.error("Socket connection error:", error);
      console.error("Error message:", error.message);
      onPaymentErrorRef.current?.({
        error: "Connection Error",
        message: "Failed to connect to payment server",
      });
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("=== SOCKET DISCONNECT ===");
      console.log("Socket disconnected. Reason:", reason);
      console.log("isPaymentCompleted:", isPaymentCompleted.current);

      // 'io client disconnect' is EXPECTED when the user switches to a UPI/bank app
      // (app goes to background). Socket.io auto-reconnects, so we only start the
      // polling fallback for server-side or transport disconnects.
      const isExpectedClientDisconnect =
        reason === "io client disconnect" || reason === "io server disconnect";

      if (!isPaymentCompleted.current && !isExpectedClientDisconnect) {
        console.log("⚠️ Payment not completed, unexpected disconnect — starting polling fallback");
        onPaymentErrorRef.current?.({
          error: "Disconnected",
          message: "Lost connection to payment server",
        });
      } else if (isPaymentCompleted.current) {
        console.log("✅ Payment completed, disconnect is expected");
      } else {
        console.log("ℹ️ Client-initiated disconnect (e.g. UPI app switch). Socket will auto-reconnect.");
      }
    });

    // Listen for payment status updates
    socketInstance.on("payment_status_update", async (data: any) => {
      console.log("Payment status update received:---------------->> ", data);

      // Guard against processing status updates once the payment has already completed.
      if (isPaymentCompleted.current) {
        console.log("[usePaymentSocket] Payment already processed. Ignoring duplicate status update.");
        return;
      }

      // Check both the top-level status and the payment response status using normalized lowercase values
      const rawStatus = String(data?.status || "").toLowerCase();
      const rawPaymentStatus = String(data?.paymentResponse?.status || "").toLowerCase();
      const rawTxnStatus = String(data?.paymentResponse?.txn_detail?.status || "").toLowerCase();

      const isSuccess = rawStatus === "success" || rawStatus === "paid" ||
        rawPaymentStatus === "charged" || rawPaymentStatus === "success" ||
        rawTxnStatus === "charged" || rawTxnStatus === "success";

      const isPending = rawStatus === "pending" || rawStatus === "processing" ||
        rawPaymentStatus.startsWith("pending") || rawPaymentStatus === "processing" ||
        rawTxnStatus.startsWith("pending") || rawTxnStatus === "processing";

      try {
        if (isSuccess) {
          console.log('Payment charged successfully');
          isPaymentCompleted.current = true;

          if (onPaymentSuccessRef.current) {
            console.log("[usePaymentSocket] Invoking onPaymentSuccess callback");
            onPaymentSuccessRef.current(data);
          } else if (router) {
            try {
              console.log("[usePaymentSocket] Routing to payment-success");
              router.replace({
                pathname: '/(tabs)/home/payment-success',
                params: {
                  amount: data?.paymentResponse?.amount || amount || "",
                  txnId: data?.paymentResponse?.txn_id || "",
                  orderId: data?.paymentResponse?.order_id || orderId || "",
                  message: data?.paymentResponse?.payment_gateway_response?.resp_message || 'Payment Successful',
                  investmentId: parsedUserDetailsRef.current?.investmentId,
                  schemeType: parsedUserDetailsRef.current?.schemeType,
                  paymentFrequency: parsedUserDetailsRef.current?.paymentFrequency,
                  type: type,
                  userId: parsedUserDetailsRef.current?.userId || parsedUserDetailsRef.current?.id || "",
                }
              });
            } catch (error) {
              console.error("Error processing successful payment:", error);
              onPaymentErrorRef.current?.({
                error: "Payment Processing Error",
                message: "Failed to process successful payment",
              });
            }
          }

          if (socketInstance) {
            socketInstance.removeAllListeners();
            if (socketInstance.connected) {
              socketInstance.disconnect();
            }
          }
        } else if (isPending) {
          console.log('[usePaymentSocket] Payment is still pending (e.g. VBV verification). Waiting for VBV completion...');
          return; // Ignore and wait for next event
        } else {
          console.log('Payment not charged');
          isPaymentCompleted.current = true;

          if (onPaymentFailureRef.current) {
            console.log("[usePaymentSocket] Invoking onPaymentFailure callback");
            onPaymentFailureRef.current(data);
          } else if (router) {
            console.log("[usePaymentSocket] Routing to payment-failure");
            router.replace({
              pathname: '/(tabs)/home/payment-failure',
              params: {
                message: data?.paymentResponse?.payment_gateway_response?.resp_message ||
                  data?.paymentResponse?.txn_detail?.error_message ||
                  'Payment Failed',
                orderId: data?.paymentResponse?.order_id || orderId || "",
                txnId: data?.paymentResponse?.txn_id || "",
                amount: data?.paymentResponse?.amount || amount || "",
                status: data?.paymentResponse?.status || "FAILED",
                type: type,
                userId: parsedUserDetailsRef.current?.userId || parsedUserDetailsRef.current?.id || "",
                investmentId: parsedUserDetailsRef.current?.investmentId || "",
                paymentMethod: data?.paymentResponse?.payment_method_type || data?.paymentResponse?.payment_method || "",
              }
            });
          }

          if (socketInstance) {
            socketInstance.removeAllListeners();
            if (socketInstance.connected) {
              socketInstance.disconnect();
            }
          }
        }
      } catch (error) {
        console.error('Error in payment status update API sequence:', error);
        onPaymentErrorRef.current?.({
          error: "API Error",
          message: "Failed to process payment status",
        });
      }
    });

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        // App has come to the foreground
        const socketInstance = socketRef.current;
        const currentOrderId = orderId || parsedUserDetailsRef.current?.orderId;
        console.log("[AppState] App is active. Socket connected:", socketInstance?.connected, "OrderId:", currentOrderId);
        if (socketInstance && !socketInstance.connected) {
          console.log("[AppState] Socket not connected. Attempting to reconnect...");
          socketInstance.connect();
        }
        if (socketInstance && socketInstance.connected && currentOrderId) {
          console.log("[AppState] Emitting joinOrderRoom after reconnect for orderId:", currentOrderId);
          socketInstance.emit("joinOrderRoom", currentOrderId);

          // Also emit store_payment_metadata when app becomes active
          const paymentMetadata = {
            orderId: currentOrderId,
            userMobile: parsedUserDetailsRef.current?.data?.data?.mobile || parsedUserDetailsRef.current?.mobile || parsedUserDetailsRef.current?.userMobile || "",
            investmentId: (type === 'bill' || type === 'advance_booking' || type === 'booking') ? 0 : (parsedUserDetailsRef.current?.data?.data?.id || parsedUserDetailsRef.current?.id || parsedUserDetailsRef.current?.investmentId || 0),
            userId: parsedUserDetailsRef.current?.data?.data?.userId || parsedUserDetailsRef.current?.userId || parsedUserDetailsRef.current?.id || 101,
            schemeId: (type === 'bill' || type === 'advance_booking' || type === 'booking') ? 0 : (parsedUserDetailsRef.current?.data?.data?.schemeId || parsedUserDetailsRef.current?.schemeId || 0),
            chitId: (type === 'bill' || type === 'advance_booking' || type === 'booking') ? 0 : (parsedUserDetailsRef.current?.data?.data?.chitId || parsedUserDetailsRef.current?.chitId || 0),
            amount: amount || parsedUserDetailsRef.current?.data?.data?.amount || parsedUserDetailsRef.current?.amount || 0,
            isManual: "no",
            utr_reference_number: "",
            accountNumber: parsedUserDetailsRef.current?.data?.data?.accountNo || parsedUserDetailsRef.current?.accountNo || parsedUserDetailsRef.current?.accNo || parsedUserDetailsRef.current?.accountNumber || "",
            accountName: parsedUserDetailsRef.current?.data?.data?.accountName || parsedUserDetailsRef.current?.accountName || parsedUserDetailsRef.current?.accountname || parsedUserDetailsRef.current?.name || "",
            bookingId: bookingId || "",
            type: type === 'booking' ? 'advance_booking' : (type || 'scheme')
          };

          console.log("[AppState] Emitting store_payment_metadata after reconnect:", paymentMetadata);
          socketInstance.emit("store_payment_metadata", paymentMetadata);
        } else if (socketInstance && !socketInstance.connected) {
          console.warn("[AppState] Socket still not connected after reconnect attempt.");
        }
      }
    };

    const appStateSubscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      if (socketInstance) {
        socketInstance.removeAllListeners();
        if (socketInstance.connected) {
          socketInstance.disconnect();
        }
      }
      appStateSubscription.remove();
    };
  // Only re-run when stable primitive values change (orderId, type, amount, bookingId).
  // Callbacks and userDetails are accessed via refs, so they never trigger a re-run.
  }, [orderId, type, amount, bookingId]);

  const handleCancel = () => {
    disconnect();
    router.replace({ pathname: '/(tabs)/home/payment-failure', params: {} });
  };

  return {
    socket: socketRef.current,
    handleCancel,
    disconnect,
  };
};
