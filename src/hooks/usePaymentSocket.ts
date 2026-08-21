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
  console.log(`[usePaymentSocket] [HOOK INIT] [${new Date().toISOString()}] Initializing hook with params:`, { orderId, bookingId, type, amount });
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
    console.log(`[usePaymentSocket] [SOCKET INIT] [${new Date().toISOString()}] Connecting to server: ${theme.baseUrl} with transports: ["websocket"], reconnection attempts: 5`);
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
      console.log(`[usePaymentSocket] [SOCKET CONNECTED] [${new Date().toISOString()}] Socket successfully connected. ID: ${socketInstance.id}, Status: ${socketInstance.connected}`);
      console.log("=== SOCKET CONNECTION DEBUG ===");
      console.log("✅ Socket connected successfully!");
      console.log("Socket ID:", socketInstance.id);
      console.log("Socket connected status:", socketInstance.connected);
      console.log("Current orderId:", currentOrderId);
      console.log("parsedUserDetailsRef.current?.orderId:", parsedUserDetailsRef.current?.orderId);

      // If polling was started as a fallback, stop it now that socket is back
      if (onStopPollingRef.current) {
        console.log(`[usePaymentSocket] [SOCKET RECONNECTED] [${new Date().toISOString()}] Socket reconnected — stopping fallback polling`);
        onStopPollingRef.current();
      }

      if (currentOrderId) {
        console.log(`[usePaymentSocket] [SOCKET EMIT] [${new Date().toISOString()}] Emitting joinOrderRoom for orderId: ${currentOrderId}`);
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

        console.log(`[usePaymentSocket] [SOCKET EMIT] [${new Date().toISOString()}] Emitting store_payment_metadata:`, JSON.stringify(paymentMetadata));
        socketInstance.emit("store_payment_metadata", paymentMetadata);
        console.log("✅ store_payment_metadata emission completed");
      } else {
        console.warn(`[usePaymentSocket] [SOCKET WARNING] [${new Date().toISOString()}] No orderId found on connect`);
        console.log("Available orderId sources:");
        console.log("- orderId prop:", orderId);
        console.log("- parsedUserDetailsRef?.orderId:", parsedUserDetailsRef.current?.orderId);
      }
    });

    socketInstance.on("connect_error", (error) => {
      console.error(`[usePaymentSocket] [SOCKET CONNECT ERROR] [${new Date().toISOString()}] Connection error: ${error.message}`, error);
      console.error("=== SOCKET CONNECTION ERROR ===");
      console.error("Socket connection error:", error);
      console.error("Error message:", error.message);
      onPaymentErrorRef.current?.({
        error: "Connection Error",
        message: "Failed to connect to payment server",
      });
    });

    socketInstance.on("disconnect", (reason) => {
      console.log(`[usePaymentSocket] [SOCKET DISCONNECTED] [${new Date().toISOString()}] Socket disconnected. Reason: ${reason}, isPaymentCompleted: ${isPaymentCompleted.current}`);
      console.log("=== SOCKET DISCONNECT ===");
      console.log("Socket disconnected. Reason:", reason);
      console.log("isPaymentCompleted:", isPaymentCompleted.current);

      // 'io client disconnect' is EXPECTED when the user switches to a UPI/bank app
      // (app goes to background). Socket.io auto-reconnects, so we only start the
      // polling fallback for server-side or transport disconnects.
      const isExpectedClientDisconnect =
        reason === "io client disconnect" || reason === "io server disconnect";

      if (!isPaymentCompleted.current && !isExpectedClientDisconnect) {
        console.log(`[usePaymentSocket] [SOCKET UNEXPECTED DISCONNECT] [${new Date().toISOString()}] Triggering onPaymentError callback to start polling fallback`);
        onPaymentErrorRef.current?.({
          error: "Disconnected",
          message: "Lost connection to payment server",
        });
      } else if (isPaymentCompleted.current) {
        console.log(`[usePaymentSocket] [SOCKET DISCONNECT] [${new Date().toISOString()}] Disconnect expected since payment was completed.`);
      } else {
        console.log(`[usePaymentSocket] [SOCKET DISCONNECT] [${new Date().toISOString()}] Client-initiated/app background disconnect. Socket will auto-reconnect.`);
      }
    });

    // Listen for payment status updates
    socketInstance.on("payment_status_update", async (data: any) => {
      console.log(`[usePaymentSocket] [PAYMENT STATUS UPDATE] [${new Date().toISOString()}] Received update:`, JSON.stringify(data));
      console.log("Payment status update received:---------------->> ", data);

      // Guard against processing status updates once the payment has already completed.
      if (isPaymentCompleted.current) {
        console.log(`[usePaymentSocket] [PAYMENT STATUS UPDATE] [${new Date().toISOString()}] Payment already processed. Ignoring duplicate status update.`);
        return;
      }

      // Check both the top-level status and the payment response status using normalized lowercase values
      const rawStatus = String(data?.status || "").toLowerCase();
      const rawPaymentStatus = String(data?.paymentResponse?.status || "").toLowerCase();
      const rawTxnStatus = String(data?.paymentResponse?.txn_detail?.status || "").toLowerCase();
      console.log(`[usePaymentSocket] [PAYMENT STATUS UPDATE] [${new Date().toISOString()}] Resolved raw statuses: rawStatus=${rawStatus}, rawPaymentStatus=${rawPaymentStatus}, rawTxnStatus=${rawTxnStatus}`);

      const isSuccess = rawStatus === "success" || rawStatus === "paid" ||
        rawPaymentStatus === "charged" || rawPaymentStatus === "success" ||
        rawTxnStatus === "charged" || rawTxnStatus === "success";

      const isPending = rawStatus === "pending" || rawStatus === "processing" ||
        rawPaymentStatus.startsWith("pending") || rawPaymentStatus === "processing" ||
        rawTxnStatus.startsWith("pending") || rawTxnStatus === "processing";
      console.log(`[usePaymentSocket] [PAYMENT STATUS UPDATE] [${new Date().toISOString()}] Decided status: isSuccess=${isSuccess}, isPending=${isPending}`);

      try {
        if (isSuccess) {
          console.log(`[usePaymentSocket] [PAYMENT STATUS UPDATE] [${new Date().toISOString()}] Payment charged successfully. Completing status.`);
          console.log('Payment charged successfully');
          isPaymentCompleted.current = true;

          if (onPaymentSuccessRef.current) {
            console.log(`[usePaymentSocket] [PAYMENT STATUS UPDATE] [${new Date().toISOString()}] Invoking onPaymentSuccess callback prop`);
            onPaymentSuccessRef.current(data);
          } else if (router) {
            try {
              console.log(`[usePaymentSocket] [PAYMENT STATUS UPDATE] [${new Date().toISOString()}] No onPaymentSuccess callback prop - Routing to payment-success directly`);
              router.replace({
                pathname: '/(tabs)/home/payment-success',
                params: {
                  amount: data?.paymentResponse?.amount || amount || "",
                  txnId: data?.paymentResponse?.txn_id || data?.paymentResponse?.tracking_id || data?.paymentResponse?.bank_ref_no || "",
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
              console.error(`[usePaymentSocket] [PAYMENT STATUS UPDATE ERROR] [${new Date().toISOString()}] Error routing to success:`, error);
              onPaymentErrorRef.current?.({
                error: "Payment Processing Error",
                message: "Failed to process successful payment",
              });
            }
          }

          if (socketInstance) {
            console.log(`[usePaymentSocket] [PAYMENT STATUS UPDATE] [${new Date().toISOString()}] Cleaning up socket listeners and disconnecting`);
            socketInstance.removeAllListeners();
            if (socketInstance.connected) {
              socketInstance.disconnect();
            }
          }
        } else if (isPending) {
          console.log(`[usePaymentSocket] [PAYMENT STATUS UPDATE] [${new Date().toISOString()}] Payment is still pending (e.g. VBV verification). Waiting for next update...`);
          console.log('[usePaymentSocket] Payment is still pending (e.g. VBV verification). Waiting for VBV completion...');
          return; // Ignore and wait for next event
        } else {
          console.log(`[usePaymentSocket] [PAYMENT STATUS UPDATE] [${new Date().toISOString()}] Payment not charged (failed). Completing status.`);
          console.log('Payment not charged');
          isPaymentCompleted.current = true;

          if (onPaymentFailureRef.current) {
            console.log(`[usePaymentSocket] [PAYMENT STATUS UPDATE] [${new Date().toISOString()}] Invoking onPaymentFailure callback prop`);
            onPaymentFailureRef.current(data);
          } else if (router) {
            console.log(`[usePaymentSocket] [PAYMENT STATUS UPDATE] [${new Date().toISOString()}] No onPaymentFailure callback prop - Routing to payment-failure directly`);
            router.replace({
              pathname: '/(tabs)/home/payment-failure',
              params: {
                message: data?.paymentResponse?.payment_gateway_response?.resp_message ||
                  data?.paymentResponse?.txn_detail?.error_message ||
                  'Payment Failed',
                orderId: data?.paymentResponse?.order_id || orderId || "",
                txnId: data?.paymentResponse?.txn_id || data?.paymentResponse?.tracking_id || data?.paymentResponse?.bank_ref_no || "",
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
            console.log(`[usePaymentSocket] [PAYMENT STATUS UPDATE] [${new Date().toISOString()}] Cleaning up socket listeners and disconnecting`);
            socketInstance.removeAllListeners();
            if (socketInstance.connected) {
              socketInstance.disconnect();
            }
          }
        }
      } catch (error) {
        console.error(`[usePaymentSocket] [PAYMENT STATUS UPDATE ERROR] [${new Date().toISOString()}] Error in payment status update API sequence:`, error);
        onPaymentErrorRef.current?.({
          error: "API Error",
          message: "Failed to process payment status",
        });
      }
    });

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log(`[usePaymentSocket] [APPSTATE CHANGE] [${new Date().toISOString()}] AppState transitioned to: ${nextAppState}`);
      if (nextAppState === "active") {
        // App has come to the foreground
        const socketInstance = socketRef.current;
        const currentOrderId = orderId || parsedUserDetailsRef.current?.orderId;
        console.log(`[usePaymentSocket] [APPSTATE ACTIVE] [${new Date().toISOString()}] App is active. Socket connected: ${socketInstance?.connected}, OrderId: ${currentOrderId}`);
        console.log("[AppState] App is active. Socket connected:", socketInstance?.connected, "OrderId:", currentOrderId);
        if (socketInstance && !socketInstance.connected) {
          console.log(`[usePaymentSocket] [APPSTATE ACTIVE] [${new Date().toISOString()}] Socket not connected. Attempting to reconnect...`);
          console.log("[AppState] Socket not connected. Attempting to reconnect...");
          socketInstance.connect();
        }
        if (socketInstance && socketInstance.connected && currentOrderId) {
          console.log(`[usePaymentSocket] [APPSTATE ACTIVE] [${new Date().toISOString()}] Socket connected. Emitting joinOrderRoom for orderId: ${currentOrderId}`);
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

          console.log(`[usePaymentSocket] [APPSTATE ACTIVE] [${new Date().toISOString()}] Emitting store_payment_metadata after reconnect:`, JSON.stringify(paymentMetadata));
          console.log("[AppState] Emitting store_payment_metadata after reconnect:", paymentMetadata);
          socketInstance.emit("store_payment_metadata", paymentMetadata);
        } else if (socketInstance && !socketInstance.connected) {
          console.warn(`[usePaymentSocket] [APPSTATE WARNING] [${new Date().toISOString()}] Socket still not connected after reconnect attempt.`);
          console.warn("[AppState] Socket still not connected after reconnect attempt.");
        }
      }
    };

    const appStateSubscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      console.log(`[usePaymentSocket] [EFFECT UNMOUNT] [${new Date().toISOString()}] Cleaning up socket effect. removing listeners...`);
      if (socketInstance) {
        socketInstance.removeAllListeners();
        if (socketInstance.connected) {
          console.log(`[usePaymentSocket] [EFFECT UNMOUNT] [${new Date().toISOString()}] Disconnecting socket.`);
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
