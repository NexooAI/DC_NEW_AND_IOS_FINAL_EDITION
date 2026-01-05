import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useRouter } from "expo-router";
import { AppState, AppStateStatus } from "react-native";
import { theme } from "@/constants/theme";

interface PaymentSocketProps {
  onPaymentSuccess?: (data: any) => void;
  onPaymentFailure?: (data: any) => void;
  onPaymentError?: (error: any) => void;
  onPaymentExpired?: () => void;
  parsedUserDetails: any;
  router: ReturnType<typeof useRouter>;
  orderId?: string;
}

export const usePaymentSocket = ({
  onPaymentSuccess,
  onPaymentFailure,
  onPaymentError,
  onPaymentExpired,
  parsedUserDetails,
  router,
  orderId,
}: PaymentSocketProps) => {
  const socketRef = useRef<Socket | null>(null);
  const isPaymentCompleted = useRef(false);
  const parsedUserDetailsRef = useRef(parsedUserDetails);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  // Keep parsedUserDetailsRef updated
  useEffect(() => {
    parsedUserDetailsRef.current = parsedUserDetails;
  }, [parsedUserDetails]);

  const buildPaymentMetadata = (pd: any, currentOrderId?: string) => {
    const d = pd || {};
    const inner = d?.data?.data || {};
    return {
      orderId: currentOrderId || d?.orderId || "",
      investmentId: inner?.id || d?.id || d?.investmentId || 0,
      userId: inner?.userId || d?.userId || 0,
      schemeId: inner?.schemeId || d?.schemeId || 0,
      chitId: inner?.chitId || d?.chitId || 0,
      paymentAmount: inner?.amount || d?.amount || 0,
      amount: inner?.amount || d?.amount || 0,
      utr_reference_number: "",
      receipt: "receipt",
      currency: "INR",
      paymentStatus: "PENDING",
      isManual: "No",
      userEmail: inner?.email || d?.email || "",
      userPhone: inner?.mobile || d?.mobile || "",
    };
  };

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io(theme.baseUrl, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socketInstance;

    const emitMetadata = (currentOrderId: string) => {
      if (!currentOrderId) return;

      console.log("🎯 Emitting createOrder/store_payment_metadata for:", currentOrderId);

      // 1. Emit createOrder
      const metadata = buildPaymentMetadata(parsedUserDetailsRef.current, currentOrderId);
      socketInstance.emit("createOrder", metadata);

      // 2. Emit store_payment_metadata
      // Use a consistent structure for store_payment_metadata
      const userDetails = parsedUserDetailsRef.current || {};
      const inner = userDetails.data?.data || {};

      // This object structure seems to be what the backend expects based on previous code
      const storeMetadata = {
        investmentId: metadata.investmentId,
        userId: metadata.userId,
        schemeId: metadata.schemeId,
        chitId: metadata.chitId,
        paymentAmount: metadata.paymentAmount,
        amount: metadata.amount,
        isManual: metadata.isManual,
        orderId: metadata.orderId,
        utr_reference_number: metadata.utr_reference_number,
        accountNumber: inner.accountNo || userDetails.accountNo || userDetails.accNo || "",
        accountName: inner.accountName || userDetails.accountName || userDetails.accountname || "",
        userMobile: inner.mobile || userDetails.mobile || userDetails.userMobile || ""
      };

      socketInstance.emit("store_payment_metadata", storeMetadata);
    };

    // Handle connection events
    socketInstance.on("connect", () => {
      setIsSocketConnected(true);
      console.log("✅ Socket connected. ID:", socketInstance.id);

      const currentOrderId = orderId || parsedUserDetailsRef.current?.orderId;
      if (currentOrderId) {
        emitMetadata(currentOrderId);
      } else {
        console.warn("⚠️ No orderId found on connect");
      }
    });

    socketInstance.on("connect_error", (error) => {
      setIsSocketConnected(false);
      console.error("❌ Socket connection error:", error.message);
      onPaymentError?.({
        error: "Connection Error",
        message: "Failed to connect to payment server",
      });
    });

    socketInstance.on("disconnect", (reason) => {
      setIsSocketConnected(false);
      console.log("⚠️ Socket disconnected:", reason);

      if (!isPaymentCompleted.current) {
        // Only report error if we weren't expecting a disconnect (i.e., payment not done)
        // And also maybe check if it's io client disconnect (manual)
        if (reason !== "io client disconnect") {
          onPaymentError?.({
            error: "Disconnected",
            message: "Lost connection to payment server",
          });
        }
      }
    });

    // Listen for payment status updates
    socketInstance.on("payment_status_update", async (data: any) => {
      console.log("📩 Payment Update:", JSON.stringify(data, null, 2));

      // Check success status
      // Some backends send { status: 'success' }, others nested in paymentResponse
      const isSuccess =
        data?.status === "success" ||
        data?.status === "completed" ||
        data?.paymentResponse?.status === "CHARGED" ||
        data?.paymentResponse?.txn_detail?.status === "CHARGED";

      const isFailed =
        data?.status === "failed" ||
        data?.paymentResponse?.status === "FAILED"; // Add more failure checks if needed

      try {
        if (isSuccess) {
          console.log("✅ Payment Success Detected");
          isPaymentCompleted.current = true;

          // Clean up socket
          if (socketInstance.connected) socketInstance.disconnect();

          // Trigger callback or default navigation
          if (onPaymentSuccess) {
            onPaymentSuccess(data);
          } else {
            // Default handling if no callback provided (though PaymentWebView provides one)
            const response = data?.paymentResponse || {};
            router.replace({
              pathname: '/(tabs)/home/payment-success',
              params: {
                amount: response.amount,
                txnId: response.txn_id,
                orderId: response.order_id,
                message: response.payment_gateway_response?.resp_message || 'Payment Successful'
              }
            });
          }

        } else if (isFailed) {
          console.log("❌ Payment Failure Detected");
          isPaymentCompleted.current = true;

          if (socketInstance.connected) socketInstance.disconnect();

          if (onPaymentFailure) {
            onPaymentFailure(data);
          } else {
            const response = data?.paymentResponse || {};
            router.replace({
              pathname: '/(tabs)/home/payment-failure',
              params: {
                message: response.payment_gateway_response?.resp_message || response.txn_detail?.error_message || 'Payment Failed',
                orderId: response.order_id,
                txnId: response.txn_id,
                amount: response.amount,
                status: response.status
              }
            });
          }
        } else if (data?.status === "expired") {
          console.log("⚠️ Payment Expired");
          if (socketInstance.connected) socketInstance.disconnect();
          onPaymentExpired?.();
        }
      } catch (error) {
        console.error("Error processing socket event:", error);
        onPaymentError?.({
          error: "Processing Error",
          message: "Failed to process payment update"
        });
      }
    });

    // App State handling for reconnection
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        const currentOrderId = orderId || parsedUserDetailsRef.current?.orderId;
        console.log("📱 App active. Socket connected:", socketRef.current?.connected);

        if (socketRef.current && !socketRef.current.connected) {
          console.log("🔄 Reconnecting socket...");
          socketRef.current.connect();
        } else if (socketRef.current?.connected && currentOrderId) {
          // Re-emit metadata just in case server lost context, but be careful of duplication if server isn't idempotent
          // For now, let's assume we should refresh the order context
          // emitMetadata(currentOrderId); 
          // Commented out to avoid double-emit if logic doesn't require it, 
          // but original code had it. Let's keep it safe:
          console.log("🔄 active state: check order status or re-emit if needed");
        }
      }
    };

    const appStateSubscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      // Cleanup
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      appStateSubscription.remove();
    };
  }, [router, orderId]); // Removed parsedUserDetails from dep array to avoid reconnects on minor updates, using Ref instead

  const handleCancel = () => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.disconnect();
    }
    router.replace({ pathname: '/(tabs)/home/payment-failure', params: { message: "Payment Cancelled" } });
  };

  return {
    socket: socketRef.current,
    isSocketConnected,
    handleCancel,
  };
};
